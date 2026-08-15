import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, KpiCard } from "@/components/AppShell";
import {
  CONFIGURATION_CENTER_TABS,
  ConfigurationRulePanel,
  type ConfigurationCenterTab,
} from "@/components/ConfigurationCenterSections";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import {
  auditService,
  categoryService,
  roleService,
  shiftService,
  statusConfigService,
  systemConfigService,
  teamService,
  userService,
} from "@/lib/services";
import { parseRosterWorkbook } from "@/lib/roster-import";
import {
  moduleNames,
  userById,
  type CategoryConfig,
  type CategoryModule,
  type CoverageStatus,
  type CoverageRules,
  type Role,
  type Shift,
  type ShiftType,
  type ShiftTypeConfig,
  type StatusConfig,
  type StatusModule,
  type SystemSettings,
  type TeamConfig,
  type User,
} from "@/lib/data";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Cog,
  Edit3,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const TABS = [
  "Users",
  "Roles & Permissions",
  "Teams",
  "Task Templates",
  "Incident Rules",
  "Project Templates",
  "Shift & Roster Rules",
  "Handover Templates",
  "SOP Settings",
  "Dashboard Settings",
  "SLA & Escalation",
  "Categories",
  "Statuses",
  "Audit Logs",
] as const;

const ROLE_OPTIONS: Role[] = ["engineer", "shift-lead", "manager", "executive", "admin"];
const CATEGORY_MODULES: CategoryModule[] = [
  "Tasks",
  "Incidents",
  "Projects",
  "SOP documents",
  "Handover points",
];
const STATUS_MODULES: StatusModule[] = [
  "Tasks",
  "Incidents",
  "Projects",
  "Shift requests",
  "Handover points",
];
const TONES: StatusConfig["tone"][] = ["success", "warning", "critical", "info", "neutral"];
const COVERAGE_STATUS_OPTIONS: CoverageStatus[] = [
  "Covered",
  "Understaffed",
  "Pending Update",
  "Conflict",
];

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonthValue() {
  return new Date().toISOString().slice(0, 7);
}

function rosterKey(shift: Pick<Shift, "date" | "type">) {
  return `${shift.date}|${shift.type}`;
}

function AdminPage() {
  const { user } = useAuth();
  const actorId = user?.id ?? "system";
  const [tab, setTab] = useState<(typeof TABS)[number]>("Users");
  const [users, setUsers] = useState(() => userService.list());
  const [roles, setRoles] = useState(() => roleService.list());
  const [teams, setTeams] = useState(() => teamService.list());
  const [shiftTypes, setShiftTypes] = useState(() => shiftService.listShiftTypes());
  const [coverageRules, setCoverageRules] = useState<CoverageRules>(() =>
    shiftService.getCoverageRules(),
  );
  const [rosterRows, setRosterRows] = useState(() => shiftService.listSchedule());
  const [categories, setCategories] = useState(() => categoryService.list());
  const [statuses, setStatuses] = useState(() => statusConfigService.list());
  const [settings, setSettings] = useState<SystemSettings>(() => systemConfigService.get());
  const [activity, setActivity] = useState(() => auditService.list());

  const [userEditId, setUserEditId] = useState<string | "new" | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    role: "engineer" as Role,
    team: "DC",
  });

  const [teamEditId, setTeamEditId] = useState<string | "new" | null>(null);
  const [teamForm, setTeamForm] = useState({ name: "", description: "" });
  const [teamAssignId, setTeamAssignId] = useState<string | null>(null);
  const [teamUserSelection, setTeamUserSelection] = useState<string[]>([]);

  const [categoryEditId, setCategoryEditId] = useState<string | "new" | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    module: "Tasks" as CategoryModule,
    name: "",
  });

  const [statusEditId, setStatusEditId] = useState<string | "new" | null>(null);
  const [statusForm, setStatusForm] = useState({
    module: "Tasks" as StatusModule,
    name: "",
    tone: "neutral" as StatusConfig["tone"],
  });

  const [shiftEditId, setShiftEditId] = useState<string | null>(null);
  const [shiftForm, setShiftForm] = useState({
    startTime: "06:00",
    endTime: "18:00",
    minEngineers: 3,
    enabled: true,
  });
  const [rosterEditKey, setRosterEditKey] = useState<string | "new" | null>(null);
  const [rosterForm, setRosterForm] = useState({
    date: todayValue(),
    type: "Morning" as ShiftType,
    engineers: [] as string[],
    shiftLead: "",
    coverageStatus: "Pending Update" as CoverageStatus,
    notes: "",
  });
  const [rosterImport, setRosterImport] = useState<{
    summary: string;
    errors: string[];
  }>({ summary: "", errors: [] });
  const [monthBuilder, setMonthBuilder] = useState({
    month: currentMonthValue(),
    shiftTypes: ["Morning", "Evening", "Night"] as ShiftType[],
    engineers: [] as string[],
    shiftLead: "",
    notes: "Monthly roster shell",
    overwriteExisting: false,
  });
  const [monthBuildSummary, setMonthBuildSummary] = useState("");

  const rosterAssignees = users.filter(
    (target) =>
      target.status !== "Inactive" && (target.role === "engineer" || target.role === "shift-lead"),
  );

  const refresh = () => {
    setUsers(userService.list());
    setRoles(roleService.list());
    setTeams(teamService.list());
    setShiftTypes(shiftService.listShiftTypes());
    setCoverageRules(shiftService.getCoverageRules());
    setRosterRows(shiftService.listSchedule());
    setCategories(categoryService.list());
    setStatuses(statusConfigService.list());
    setSettings(systemConfigService.get());
    setActivity(auditService.list());
  };

  const startAddUser = () => {
    setUserEditId("new");
    setUserForm({ name: "", username: "", role: "engineer", team: teams[0]?.id ?? "DC" });
  };

  const startEditUser = (target: User) => {
    setUserEditId(target.id);
    setUserForm({
      name: target.name,
      username: target.username,
      role: target.role,
      team: target.team ?? teams[0]?.id ?? "DC",
    });
  };

  const saveUser = () => {
    if (!userForm.name.trim() || !userForm.username.trim()) {
      toast.error("Name and username are required");
      return;
    }
    if (userEditId === "new") {
      userService.create(actorId, userForm);
      toast.success("User added");
    } else if (userEditId) {
      userService.update(userEditId, actorId, userForm);
      toast.success("User updated");
    }
    setUserEditId(null);
    refresh();
  };

  const startAddTeam = () => {
    setTeamEditId("new");
    setTeamForm({ name: "", description: "" });
  };

  const startEditTeam = (team: TeamConfig) => {
    setTeamEditId(team.id);
    setTeamForm({ name: team.name, description: team.description });
  };

  const saveTeam = () => {
    if (!teamForm.name.trim()) {
      toast.error("Team name is required");
      return;
    }
    if (teamEditId === "new") {
      teamService.create(actorId, teamForm);
      toast.success("Team added");
    } else if (teamEditId) {
      teamService.update(teamEditId, actorId, teamForm);
      toast.success("Team updated");
    }
    setTeamEditId(null);
    refresh();
  };

  const startAssignTeam = (team: TeamConfig) => {
    setTeamAssignId(team.id);
    setTeamUserSelection(
      users.filter((target) => target.team === team.id).map((target) => target.id),
    );
  };

  const toggleTeamUser = (userId: string) => {
    setTeamUserSelection((current) =>
      current.includes(userId) ? current.filter((item) => item !== userId) : [...current, userId],
    );
  };

  const saveTeamUsers = () => {
    if (!teamAssignId) return;
    teamService.assignUsers(teamAssignId, teamUserSelection, actorId);
    setTeamAssignId(null);
    refresh();
    toast.success("Team users updated");
  };

  const startAddCategory = () => {
    setCategoryEditId("new");
    setCategoryForm({ module: "Tasks", name: "" });
  };

  const startEditCategory = (category: CategoryConfig) => {
    setCategoryEditId(category.id);
    setCategoryForm({ module: category.module, name: category.name });
  };

  const saveCategory = () => {
    if (!categoryForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }
    if (categoryEditId === "new") {
      categoryService.create(actorId, categoryForm);
      toast.success("Category added");
    } else if (categoryEditId) {
      categoryService.update(categoryEditId, actorId, categoryForm);
      toast.success("Category updated");
    }
    setCategoryEditId(null);
    refresh();
  };

  const startAddStatus = () => {
    setStatusEditId("new");
    setStatusForm({ module: "Tasks", name: "", tone: "neutral" });
  };

  const startEditStatus = (status: StatusConfig) => {
    setStatusEditId(status.id);
    setStatusForm({ module: status.module, name: status.name, tone: status.tone });
  };

  const saveStatus = () => {
    if (!statusForm.name.trim()) {
      toast.error("Status name is required");
      return;
    }
    if (statusEditId === "new") {
      statusConfigService.create(actorId, statusForm);
      toast.success("Status added");
    } else if (statusEditId) {
      statusConfigService.update(statusEditId, actorId, statusForm);
      toast.success("Status updated");
    }
    setStatusEditId(null);
    refresh();
  };

  const startEditShiftType = (shiftType: ShiftTypeConfig) => {
    setShiftEditId(shiftType.id);
    setShiftForm({
      startTime: shiftType.startTime,
      endTime: shiftType.endTime,
      minEngineers: shiftType.minEngineers,
      enabled: shiftType.enabled,
    });
  };

  const saveShiftType = () => {
    if (!shiftEditId) return;
    shiftService.updateShiftType(shiftEditId, actorId, shiftForm);
    setShiftEditId(null);
    refresh();
    toast.success("Shift settings updated");
  };

  const saveCoverageRules = () => {
    shiftService.updateCoverageRules(actorId, coverageRules);
    refresh();
    toast.success("Coverage rules updated");
  };

  const startAddRosterRow = () => {
    setRosterEditKey("new");
    setRosterForm({
      date: todayValue(),
      type: shiftTypes[0]?.name ?? "Morning",
      engineers: [],
      shiftLead: "",
      coverageStatus: "Pending Update",
      notes: "",
    });
  };

  const startEditRosterRow = (shift: Shift) => {
    setRosterEditKey(rosterKey(shift));
    setRosterForm({
      date: shift.date,
      type: shift.type,
      engineers: [...shift.engineers],
      shiftLead: shift.shiftLead ?? "",
      coverageStatus: shift.coverageStatus ?? "Pending Update",
      notes: shift.notes ?? "",
    });
  };

  const toggleRosterEngineer = (engineerId: string) => {
    setRosterForm((current) => {
      const engineers = current.engineers.includes(engineerId)
        ? current.engineers.filter((item) => item !== engineerId)
        : [...current.engineers, engineerId];
      return {
        ...current,
        engineers,
        shiftLead: engineers.includes(current.shiftLead) ? current.shiftLead : "",
      };
    });
  };

  const saveRosterRow = () => {
    if (!rosterForm.date) {
      toast.error("Roster date is required");
      return;
    }
    const payload: Shift = {
      date: rosterForm.date,
      type: rosterForm.type,
      engineers: rosterForm.engineers,
      shiftLead: rosterForm.shiftLead || undefined,
      coverageStatus: rosterForm.coverageStatus,
      notes: rosterForm.notes,
    };

    if (rosterEditKey === "new") {
      const created = shiftService.createShift(actorId, payload);
      if (!created) {
        toast.error("A roster row already exists for that date and shift");
        return;
      }
      toast.success("Roster row created");
    } else if (rosterEditKey) {
      const [originalDate, originalType] = rosterEditKey.split("|") as [string, ShiftType];
      if (originalDate !== payload.date || originalType !== payload.type) {
        const duplicate = shiftService
          .listSchedule()
          .some((shift) => shift.date === payload.date && shift.type === payload.type);
        if (duplicate) {
          toast.error("A roster row already exists for that date and shift");
          return;
        }
        shiftService.deleteShift(originalDate, originalType, actorId);
        shiftService.createShift(actorId, payload);
      } else {
        shiftService.updateShift(payload.date, payload.type, actorId, {
          engineers: payload.engineers,
          shiftLead: payload.shiftLead,
          coverageStatus: payload.coverageStatus,
          notes: payload.notes,
        });
      }
      toast.success("Roster row updated");
    }

    setRosterEditKey(null);
    refresh();
  };

  const deleteRosterRow = (shift: Shift) => {
    shiftService.deleteShift(shift.date, shift.type, actorId);
    refresh();
    toast.success("Roster row deleted");
  };

  const toggleMonthShiftType = (type: ShiftType) => {
    setMonthBuilder((current) => ({
      ...current,
      shiftTypes: current.shiftTypes.includes(type)
        ? current.shiftTypes.filter((item) => item !== type)
        : [...current.shiftTypes, type],
    }));
  };

  const toggleMonthEngineer = (engineerId: string) => {
    setMonthBuilder((current) => {
      const engineers = current.engineers.includes(engineerId)
        ? current.engineers.filter((item) => item !== engineerId)
        : [...current.engineers, engineerId];
      return {
        ...current,
        engineers,
        shiftLead: engineers.includes(current.shiftLead) ? current.shiftLead : "",
      };
    });
  };

  const buildMonthlyRoster = () => {
    if (!monthBuilder.month) {
      toast.error("Month is required");
      return;
    }
    if (!monthBuilder.shiftTypes.length) {
      toast.error("Select at least one shift type");
      return;
    }
    const result = shiftService.buildMonthlyRoster(actorId, {
      month: monthBuilder.month,
      shiftTypes: monthBuilder.shiftTypes,
      engineers: monthBuilder.engineers,
      shiftLead: monthBuilder.shiftLead || undefined,
      notes: monthBuilder.notes.trim() || "Monthly roster shell",
      overwriteExisting: monthBuilder.overwriteExisting,
    });
    refresh();
    setMonthBuildSummary(
      `${result.created} created, ${result.updated} updated, ${result.skipped} skipped for ${result.month}. Mandatory assignments applied: ${result.mandatoryAssignmentsApplied}. Fairness: ${result.fairnessSummary}`,
    );
    toast.success(`Monthly roster built for ${result.month}`);
  };

  const importRosterFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const result = await parseRosterWorkbook(
        file,
        users,
        shiftTypes.map((shiftType) => shiftType.name),
      );
      if (!result.shifts.length) {
        setRosterImport({
          summary: "No roster rows were imported.",
          errors: result.errors.length ? result.errors : ["No valid roster rows found."],
        });
        toast.error("No valid roster rows found");
        return;
      }

      const summary = shiftService.importShifts(actorId, result.shifts);
      refresh();
      setRosterImport({
        summary: `${summary.created} created, ${summary.updated} updated from ${file.name}.`,
        errors: result.errors,
      });
      toast.success(
        `Roster import complete: ${summary.created} created, ${summary.updated} updated`,
      );
    } catch {
      setRosterImport({
        summary: "Roster import failed.",
        errors: ["Check that the file is a valid .xlsx or .csv roster sheet."],
      });
      toast.error("Roster import failed");
    }
  };

  const saveSystemSettings = () => {
    systemConfigService.update(actorId, settings);
    refresh();
    toast.success("System settings updated");
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        title="Configuration Center"
        subtitle="Configure users, rules, templates, roster behavior, dashboards and governance without developer changes."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard label="Users" value={users.length} icon={Users} tone="info" />
            <KpiCard
              label="Active Roles"
              value={roles.filter((role) => role.enabled).length}
              icon={ShieldCheck}
            />
            <KpiCard label="Teams" value={teams.filter((team) => team.active).length} />
            <KpiCard
              label="Rule Library"
              value={categories.length + statuses.length}
              icon={Cog}
              tone="neutral"
              sub="Templates, rules and statuses"
            />
          </div>

          <div className="border-b border-border flex gap-1 overflow-x-auto">
            {TABS.map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`px-4 py-2 text-sm border-b-2 -mb-px whitespace-nowrap ${
                  tab === item
                    ? "border-primary text-foreground font-medium"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {tab === "Users" ? (
            <ConfigSection
              title="Users"
              description="Add users, edit their role/team, deactivate accounts or reset the starter password."
              addLabel="Add User"
              onAdd={startAddUser}
            >
              {userEditId ? (
                <InlineForm title={userEditId === "new" ? "Add user" : "Edit user"}>
                  <TextInput
                    label="Name"
                    value={userForm.name}
                    onChange={(value) => setUserForm({ ...userForm, name: value })}
                  />
                  <TextInput
                    label="Username"
                    value={userForm.username}
                    onChange={(value) => setUserForm({ ...userForm, username: value })}
                  />
                  <SelectInput
                    label="Role"
                    value={userForm.role}
                    onChange={(value) => setUserForm({ ...userForm, role: value as Role })}
                    options={ROLE_OPTIONS.map((role) => ({ value: role, label: roleLabel(role) }))}
                  />
                  <SelectInput
                    label="Team"
                    value={userForm.team}
                    onChange={(value) => setUserForm({ ...userForm, team: value })}
                    options={teams.map((team) => ({ value: team.id, label: team.name }))}
                  />
                  <FormActions onCancel={() => setUserEditId(null)} onSave={saveUser} />
                </InlineForm>
              ) : null}
              <Table>
                <thead>
                  <HeaderRow labels={["Name", "Username", "Role", "Team", "Status", "Actions"]} />
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((target) => (
                    <tr key={target.id} className="hover:bg-muted/30">
                      <Cell strong>{target.name}</Cell>
                      <Cell mono>{target.username}</Cell>
                      <Cell>{roleLabel(target.role)}</Cell>
                      <Cell>
                        {teams.find((team) => team.id === target.team)?.name ?? "No team"}
                      </Cell>
                      <Cell>
                        <StatusBadge status={target.status ?? "Active"} />
                      </Cell>
                      <ActionCell>
                        <ActionButton
                          label="Edit"
                          icon={Edit3}
                          onClick={() => startEditUser(target)}
                        />
                        <ActionButton
                          label="Reset"
                          icon={RotateCcw}
                          onClick={() => {
                            userService.resetPassword(target.id, actorId);
                            refresh();
                            toast.success("Password reset to change-me");
                          }}
                        />
                        <ActionButton
                          label="Deactivate"
                          icon={Trash2}
                          danger
                          onClick={() => {
                            userService.deactivate(target.id, actorId);
                            refresh();
                            toast.success("User deactivated");
                          }}
                        />
                      </ActionCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </ConfigSection>
          ) : null}

          {tab === "Roles & Permissions" ? (
            <ConfigSection
              title="Roles & Permissions"
              description="Enable roles and configure module visibility per role."
              addLabel="Enable Shift Lead"
              onAdd={() => {
                roleService.update("shift-lead", actorId, { enabled: true });
                refresh();
                toast.success("Shift Lead role enabled");
              }}
            >
              <div className="grid grid-cols-1 gap-3">
                {roles.map((role) => (
                  <div key={role.id} className="rounded-lg border border-border bg-card p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{role.label}</h3>
                          <StatusBadge status={role.enabled ? "Active" : "Inactive"} />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {users.filter((target) => target.role === role.id).length} users
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          roleService.update(role.id, actorId, { enabled: !role.enabled });
                          refresh();
                          toast.success(`${role.label} ${role.enabled ? "disabled" : "enabled"}`);
                        }}
                        className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                      >
                        {role.enabled ? "Disable" : "Enable"}
                      </button>
                    </div>
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                      {moduleNames.map((module) => (
                        <label
                          key={module}
                          className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={role.modules.includes(module)}
                            onChange={() => {
                              roleService.toggleModule(role.id, module, actorId);
                              refresh();
                              toast.success("Module access updated");
                            }}
                          />
                          {module}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ConfigSection>
          ) : null}

          {tab === "Teams" ? (
            <ConfigSection
              title="Teams"
              description="Add, edit or remove operational teams and see assigned users."
              addLabel="Add Team"
              onAdd={startAddTeam}
            >
              {teamEditId ? (
                <InlineForm title={teamEditId === "new" ? "Add team" : "Edit team"}>
                  <TextInput
                    label="Team name"
                    value={teamForm.name}
                    onChange={(value) => setTeamForm({ ...teamForm, name: value })}
                  />
                  <TextInput
                    label="Description"
                    value={teamForm.description}
                    onChange={(value) => setTeamForm({ ...teamForm, description: value })}
                  />
                  <FormActions onCancel={() => setTeamEditId(null)} onSave={saveTeam} />
                </InlineForm>
              ) : null}
              {teamAssignId ? (
                <InlineForm
                  title={`Assign users to ${teams.find((team) => team.id === teamAssignId)?.name ?? "team"}`}
                >
                  <div className="md:col-span-2 xl:col-span-3">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      Users
                    </span>
                    <div className="mt-1.5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 rounded-md border border-border bg-card p-3">
                      {users.map((target) => (
                        <label
                          key={target.id}
                          className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={teamUserSelection.includes(target.id)}
                            onChange={() => toggleTeamUser(target.id)}
                          />
                          <span>
                            {target.name} ({roleLabel(target.role)})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <FormActions onCancel={() => setTeamAssignId(null)} onSave={saveTeamUsers} />
                </InlineForm>
              ) : null}
              <Table>
                <thead>
                  <HeaderRow labels={["Team", "Description", "Users", "Status", "Actions"]} />
                </thead>
                <tbody className="divide-y divide-border">
                  {teams.map((team) => (
                    <tr key={team.id} className="hover:bg-muted/30">
                      <Cell strong>{team.name}</Cell>
                      <Cell>{team.description}</Cell>
                      <Cell>
                        {users
                          .filter((target) => target.team === team.id)
                          .map((target) => target.name.split(" ")[0])
                          .join(", ") || "No users"}
                      </Cell>
                      <Cell>
                        <StatusBadge status={team.active ? "Active" : "Inactive"} />
                      </Cell>
                      <ActionCell>
                        <ActionButton
                          label="Edit"
                          icon={Edit3}
                          onClick={() => startEditTeam(team)}
                        />
                        <ActionButton
                          label="Assign"
                          icon={Users}
                          onClick={() => startAssignTeam(team)}
                        />
                        <ActionButton
                          label="Remove"
                          icon={Trash2}
                          danger
                          onClick={() => {
                            teamService.remove(team.id, actorId);
                            refresh();
                            toast.success("Team removed");
                          }}
                        />
                      </ActionCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </ConfigSection>
          ) : null}

          {CONFIGURATION_CENTER_TABS.includes(tab as ConfigurationCenterTab) ? (
            <ConfigurationRulePanel
              tab={tab as ConfigurationCenterTab}
              actorId={actorId}
              users={users}
              teams={teams}
              onChange={refresh}
            />
          ) : null}

          {tab === "Shift & Roster Rules" ? (
            <ConfigSection
              title="Roster Builder & Shift Timings"
              description="Configure roster timings, minimum staffing, work patterns, mandatory assignments and shift assignment rows."
              addLabel="Save Coverage Rules"
              onAdd={saveCoverageRules}
            >
              <ConfigurationRulePanel
                tab="Shift & Roster Rules"
                actorId={actorId}
                users={users}
                teams={teams}
                onChange={refresh}
              />
              <div>
                <h3 className="text-sm font-semibold">Coverage rules</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  These defaults are used when roster rows calculate Covered, Understaffed, Pending
                  Update or Conflict.
                </p>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <label className="rounded-md border border-border bg-muted/20 p-3 text-sm">
                  <span className="block text-xs uppercase tracking-wider text-muted-foreground">
                    Minimum engineers
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={coverageRules.defaultMinimumEngineers}
                    onChange={(event) =>
                      setCoverageRules({
                        ...coverageRules,
                        defaultMinimumEngineers: Number(event.target.value),
                      })
                    }
                    className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2"
                  />
                </label>
                <ToggleBox
                  label="Require shift lead"
                  checked={coverageRules.requireShiftLead}
                  onChange={(checked) =>
                    setCoverageRules({ ...coverageRules, requireShiftLead: checked })
                  }
                />
                <ToggleBox
                  label="Prevent overlapping assignments"
                  checked={coverageRules.preventOverlappingAssignments}
                  onChange={(checked) =>
                    setCoverageRules({ ...coverageRules, preventOverlappingAssignments: checked })
                  }
                />
              </div>
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Monthly roster builder</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Generate Morning, Evening and Night roster rows across a full month, then edit
                      details row by row as needed.
                    </p>
                  </div>
                  <button
                    onClick={buildMonthlyRoster}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
                  >
                    <CalendarDays className="h-4 w-4" /> Build Month
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  <TextInput
                    label="Month"
                    type="month"
                    value={monthBuilder.month}
                    onChange={(value) => setMonthBuilder({ ...monthBuilder, month: value })}
                  />
                  <SelectInput
                    label="Default shift lead"
                    value={monthBuilder.shiftLead}
                    onChange={(value) => setMonthBuilder({ ...monthBuilder, shiftLead: value })}
                    options={[
                      { value: "", label: "No default lead" },
                      ...monthBuilder.engineers.map((engineerId) => ({
                        value: engineerId,
                        label: userById(engineerId),
                      })),
                    ]}
                  />
                  <TextInput
                    label="Default note"
                    value={monthBuilder.notes}
                    onChange={(value) => setMonthBuilder({ ...monthBuilder, notes: value })}
                  />
                  <ToggleBox
                    label="Overwrite existing rows"
                    checked={monthBuilder.overwriteExisting}
                    onChange={(checked) =>
                      setMonthBuilder({ ...monthBuilder, overwriteExisting: checked })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <div className="rounded-md border border-border bg-muted/20 p-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Shifts to build
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {shiftTypes.map((shiftType) => (
                        <label
                          key={shiftType.id}
                          className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={monthBuilder.shiftTypes.includes(shiftType.name)}
                            onChange={() => toggleMonthShiftType(shiftType.name)}
                          />
                          {shiftType.name} ({shiftType.startTime}-{shiftType.endTime})
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-md border border-border bg-muted/20 p-3">
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      Default assigned engineers
                    </div>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {rosterAssignees.map((target) => (
                        <label
                          key={target.id}
                          className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={monthBuilder.engineers.includes(target.id)}
                            onChange={() => toggleMonthEngineer(target.id)}
                          />
                          {target.name}
                        </label>
                      ))}
                      {!rosterAssignees.length ? (
                        <div className="text-sm text-muted-foreground">
                          Add active engineer or shift lead users first.
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
                {monthBuildSummary ? (
                  <div className="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                    {monthBuildSummary}
                  </div>
                ) : null}
              </div>
              <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Roster assignments</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Create, edit, delete or import shift rows before publishing real team
                      schedules.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label
                      className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                      title="Import .xlsx or .csv roster file"
                    >
                      <Upload className="h-4 w-4" /> Import Excel
                      <input
                        type="file"
                        accept=".xlsx,.csv"
                        className="sr-only"
                        onChange={(event) => {
                          void importRosterFile(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    <button
                      onClick={startAddRosterRow}
                      className="inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
                    >
                      <Plus className="h-4 w-4" /> Add Roster Row
                    </button>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                  Excel columns: Date, Shift Type, Assigned Engineers, Shift Lead, Coverage Status,
                  Notes. Match engineers by user ID, username or full name. Use Morning, Evening or
                  Night for three shifts per day.
                </div>
                {rosterImport.summary ? (
                  <div className="rounded-md border border-info/30 bg-info/10 px-3 py-2 text-sm text-info">
                    {rosterImport.summary}
                  </div>
                ) : null}
                {rosterImport.errors.length ? (
                  <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
                    <div className="font-medium">Import warnings</div>
                    <ul className="mt-1 list-disc space-y-1 pl-4">
                      {rosterImport.errors.slice(0, 6).map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                    {rosterImport.errors.length > 6 ? (
                      <div className="mt-1">
                        {rosterImport.errors.length - 6} more row warnings hidden.
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {rosterEditKey ? (
                  <InlineForm
                    title={rosterEditKey === "new" ? "Add roster row" : "Edit roster row"}
                  >
                    <TextInput
                      label="Date"
                      type="date"
                      value={rosterForm.date}
                      onChange={(value) => setRosterForm({ ...rosterForm, date: value })}
                    />
                    <SelectInput
                      label="Shift"
                      value={rosterForm.type}
                      onChange={(value) =>
                        setRosterForm({ ...rosterForm, type: value as ShiftType })
                      }
                      options={shiftTypes.map((shiftType) => ({
                        value: shiftType.name,
                        label: shiftType.name,
                      }))}
                    />
                    <SelectInput
                      label="Coverage status"
                      value={rosterForm.coverageStatus}
                      onChange={(value) =>
                        setRosterForm({
                          ...rosterForm,
                          coverageStatus: value as CoverageStatus,
                        })
                      }
                      options={COVERAGE_STATUS_OPTIONS.map((status) => ({
                        value: status,
                        label: status,
                      }))}
                    />
                    <SelectInput
                      label="Shift lead"
                      value={rosterForm.shiftLead}
                      onChange={(value) => setRosterForm({ ...rosterForm, shiftLead: value })}
                      options={[
                        { value: "", label: "No lead" },
                        ...rosterForm.engineers.map((engineerId) => ({
                          value: engineerId,
                          label: userById(engineerId),
                        })),
                      ]}
                    />
                    <div className="md:col-span-2 xl:col-span-4">
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        Assigned engineers
                      </span>
                      <div className="mt-1.5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 rounded-md border border-border bg-card p-3">
                        {rosterAssignees.map((target) => (
                          <label
                            key={target.id}
                            className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={rosterForm.engineers.includes(target.id)}
                              onChange={() => toggleRosterEngineer(target.id)}
                            />
                            <span>
                              {target.name} ({roleLabel(target.role)})
                            </span>
                          </label>
                        ))}
                        {!rosterAssignees.length ? (
                          <div className="text-sm text-muted-foreground">
                            Add active engineer or shift lead users first.
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <TextInput
                      label="Notes"
                      value={rosterForm.notes}
                      onChange={(value) => setRosterForm({ ...rosterForm, notes: value })}
                    />
                    <FormActions onCancel={() => setRosterEditKey(null)} onSave={saveRosterRow} />
                  </InlineForm>
                ) : null}
                <Table>
                  <thead>
                    <HeaderRow
                      labels={[
                        "Date",
                        "Shift",
                        "Engineers",
                        "Lead",
                        "Coverage",
                        "Notes",
                        "Actions",
                      ]}
                    />
                  </thead>
                  <tbody className="divide-y divide-border">
                    {[...rosterRows]
                      .sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type))
                      .map((shift) => (
                        <tr key={rosterKey(shift)} className="hover:bg-muted/30">
                          <Cell mono>{shift.date}</Cell>
                          <Cell strong>{shift.type}</Cell>
                          <Cell>
                            {shift.engineers.map((engineerId) => userById(engineerId)).join(", ") ||
                              "No engineers"}
                          </Cell>
                          <Cell>{shift.shiftLead ? userById(shift.shiftLead) : "No lead"}</Cell>
                          <Cell>
                            <StatusBadge status={shift.coverageStatus ?? "Pending Update"} />
                          </Cell>
                          <Cell>{shift.notes || "No notes"}</Cell>
                          <ActionCell>
                            <ActionButton
                              label="Edit"
                              icon={Edit3}
                              onClick={() => startEditRosterRow(shift)}
                            />
                            <ActionButton
                              label="Delete"
                              icon={Trash2}
                              danger
                              onClick={() => deleteRosterRow(shift)}
                            />
                          </ActionCell>
                        </tr>
                      ))}
                    {!rosterRows.length ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          No roster rows yet. Add a row or import your Excel roster.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </Table>
              </div>
              {shiftEditId ? (
                <InlineForm title="Edit shift type">
                  <TextInput
                    label="Start time"
                    type="time"
                    value={shiftForm.startTime}
                    onChange={(value) => setShiftForm({ ...shiftForm, startTime: value })}
                  />
                  <TextInput
                    label="End time"
                    type="time"
                    value={shiftForm.endTime}
                    onChange={(value) => setShiftForm({ ...shiftForm, endTime: value })}
                  />
                  <TextInput
                    label="Minimum engineers"
                    type="number"
                    value={String(shiftForm.minEngineers)}
                    onChange={(value) =>
                      setShiftForm({ ...shiftForm, minEngineers: Number(value) })
                    }
                  />
                  <ToggleBox
                    label="Enabled"
                    checked={shiftForm.enabled}
                    onChange={(checked) => setShiftForm({ ...shiftForm, enabled: checked })}
                  />
                  <FormActions onCancel={() => setShiftEditId(null)} onSave={saveShiftType} />
                </InlineForm>
              ) : null}
              <div>
                <h3 className="text-sm font-semibold">Shift timings</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Admin can edit Morning, Evening and Night start time, end time, enabled state and
                  required engineers per shift.
                </p>
              </div>
              <Table>
                <thead>
                  <HeaderRow labels={["Shift", "Start", "End", "Minimum", "Status", "Actions"]} />
                </thead>
                <tbody className="divide-y divide-border">
                  {shiftTypes.map((shiftType) => (
                    <tr key={shiftType.id} className="hover:bg-muted/30">
                      <Cell strong>{shiftType.name}</Cell>
                      <Cell>{shiftType.startTime}</Cell>
                      <Cell>{shiftType.endTime}</Cell>
                      <Cell>{shiftType.minEngineers}</Cell>
                      <Cell>
                        <StatusBadge status={shiftType.enabled ? "Active" : "Inactive"} />
                      </Cell>
                      <ActionCell>
                        <ActionButton
                          label="Edit"
                          icon={Edit3}
                          onClick={() => startEditShiftType(shiftType)}
                        />
                      </ActionCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </ConfigSection>
          ) : null}

          {tab === "Categories" ? (
            <ConfigSection
              title="Categories"
              description="Manage categories for tasks, incidents, projects, SOP documents and handover points."
              addLabel="Add Category"
              onAdd={startAddCategory}
            >
              {categoryEditId ? (
                <InlineForm title={categoryEditId === "new" ? "Add category" : "Edit category"}>
                  <SelectInput
                    label="Module"
                    value={categoryForm.module}
                    onChange={(value) =>
                      setCategoryForm({ ...categoryForm, module: value as CategoryModule })
                    }
                    options={CATEGORY_MODULES.map((module) => ({ value: module, label: module }))}
                  />
                  <TextInput
                    label="Category name"
                    value={categoryForm.name}
                    onChange={(value) => setCategoryForm({ ...categoryForm, name: value })}
                  />
                  <FormActions onCancel={() => setCategoryEditId(null)} onSave={saveCategory} />
                </InlineForm>
              ) : null}
              <ConfigItemsTable
                rows={categories}
                onEdit={startEditCategory}
                onRemove={(category) => {
                  categoryService.remove(category.id, actorId);
                  refresh();
                  toast.success("Category removed");
                }}
              />
            </ConfigSection>
          ) : null}

          {tab === "Statuses" ? (
            <ConfigSection
              title="Statuses"
              description="Manage status labels and badge tones for operational modules."
              addLabel="Add Status"
              onAdd={startAddStatus}
            >
              {statusEditId ? (
                <InlineForm title={statusEditId === "new" ? "Add status" : "Edit status"}>
                  <SelectInput
                    label="Module"
                    value={statusForm.module}
                    onChange={(value) =>
                      setStatusForm({ ...statusForm, module: value as StatusModule })
                    }
                    options={STATUS_MODULES.map((module) => ({ value: module, label: module }))}
                  />
                  <TextInput
                    label="Status name"
                    value={statusForm.name}
                    onChange={(value) => setStatusForm({ ...statusForm, name: value })}
                  />
                  <SelectInput
                    label="Tone"
                    value={statusForm.tone}
                    onChange={(value) =>
                      setStatusForm({ ...statusForm, tone: value as StatusConfig["tone"] })
                    }
                    options={TONES.map((tone) => ({ value: tone, label: tone }))}
                  />
                  <FormActions onCancel={() => setStatusEditId(null)} onSave={saveStatus} />
                </InlineForm>
              ) : null}
              <Table>
                <thead>
                  <HeaderRow labels={["Module", "Status", "Tone", "Active", "Actions"]} />
                </thead>
                <tbody className="divide-y divide-border">
                  {statuses.map((status) => (
                    <tr key={status.id} className="hover:bg-muted/30">
                      <Cell>{status.module}</Cell>
                      <Cell strong>{status.name}</Cell>
                      <Cell>
                        <StatusBadge status={status.tone} tone={status.tone} />
                      </Cell>
                      <Cell>
                        <StatusBadge status={status.active ? "Active" : "Inactive"} />
                      </Cell>
                      <ActionCell>
                        <ActionButton
                          label="Edit"
                          icon={Edit3}
                          onClick={() => startEditStatus(status)}
                        />
                        <ActionButton
                          label="Remove"
                          icon={Trash2}
                          danger
                          onClick={() => {
                            statusConfigService.remove(status.id, actorId);
                            refresh();
                            toast.success("Status removed");
                          }}
                        />
                      </ActionCell>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </ConfigSection>
          ) : null}

          {tab === "Dashboard Settings" ? (
            <ConfigSection
              title="System & Dashboard Settings"
              description="Configure app naming, theme preference, enabled modules and navigation visibility per role."
              addLabel="Save Settings"
              onAdd={saveSystemSettings}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <TextInput
                  label="App name"
                  value={settings.appName}
                  onChange={(value) => setSettings({ ...settings, appName: value })}
                />
                <TextInput
                  label="Logo placeholder"
                  value={settings.logoPlaceholder}
                  onChange={(value) => setSettings({ ...settings, logoPlaceholder: value })}
                />
                <SelectInput
                  label="Theme preference"
                  value={settings.themePreference}
                  onChange={(value) =>
                    setSettings({
                      ...settings,
                      themePreference: value as SystemSettings["themePreference"],
                    })
                  }
                  options={["System", "Light", "Dark"].map((item) => ({
                    value: item,
                    label: item,
                  }))}
                />
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold">Enabled modules</h3>
                <div className="mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                  {moduleNames.map((module) => (
                    <label
                      key={module}
                      className="flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={settings.enabledModules.includes(module)}
                        onChange={() => {
                          setSettings({
                            ...settings,
                            enabledModules: settings.enabledModules.includes(module)
                              ? settings.enabledModules.filter((item) => item !== module)
                              : [...settings.enabledModules, module],
                          });
                        }}
                      />
                      {module}
                    </label>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold">Navigation visibility per role</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Control which operational modules appear for each role in the main navigation.
                </p>
                <div className="mt-3 space-y-3">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="rounded-md border border-border bg-background p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{role.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {role.enabled ? "Role enabled" : "Role disabled"}
                          </div>
                        </div>
                        <StatusBadge status={role.enabled ? "Active" : "Inactive"} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2">
                        {moduleNames.map((module) => (
                          <label
                            key={`${role.id}-${module}`}
                            className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5 text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={role.modules.includes(module)}
                              onChange={() => {
                                roleService.toggleModule(role.id, module, actorId);
                                refresh();
                                toast.success("Navigation visibility updated");
                              }}
                            />
                            {module}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ConfigSection>
          ) : null}

          {tab === "Audit Logs" ? (
            <ConfigSection
              title="Audit Logs"
              description="Review configuration history, role changes, roster updates and operational governance events."
              addLabel="Refresh Logs"
              onAdd={refresh}
            >
              <Table>
                <thead>
                  <HeaderRow labels={["Time", "Action", "Entity", "Actor", "Governance"]} />
                </thead>
                <tbody className="divide-y divide-border">
                  {activity.map((entry) => (
                    <tr key={entry.id} className="hover:bg-muted/30">
                      <Cell mono>{entry.createdAt}</Cell>
                      <Cell strong>{humanAction(entry.action)}</Cell>
                      <Cell>
                        {entry.entityType} / {entry.entityId}
                      </Cell>
                      <Cell>{userById(entry.actorId)}</Cell>
                      <Cell>
                        <StatusBadge status="Configuration Change Logged" tone="info" />
                      </Cell>
                    </tr>
                  ))}
                  {!activity.length ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-muted-foreground"
                      >
                        No configuration changes logged yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </Table>
            </ConfigSection>
          ) : null}
        </div>

        <aside className="rounded-lg border border-border bg-card p-4 h-fit">
          <Link
            to="/import-center"
            className="mb-4 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3 hover:bg-primary/15"
          >
            <div className="rounded-md bg-primary/15 p-2 text-primary">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold">Import Center</div>
              <p className="mt-1 text-xs text-muted-foreground">
                Download templates, validate files and review import history.
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Recent Admin Activity</h2>
          </div>
          <div className="mt-3 space-y-2">
            {activity.slice(0, 8).map((entry) => (
              <div
                key={entry.id}
                className="rounded-md border border-border bg-background px-3 py-2"
              >
                <div className="text-sm font-medium">{humanAction(entry.action)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {entry.entityType} / {entry.entityId} by {userById(entry.actorId)}
                </div>
              </div>
            ))}
            {!activity.length ? (
              <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-5 text-center text-sm text-muted-foreground">
                Admin actions will appear here after changes are saved.
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ConfigSection({
  title,
  description,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  addLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <button
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> {addLabel}
        </button>
      </div>
      {children}
    </section>
  );
}

function InlineForm({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">{children}</div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2"
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleBox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/20 p-3 text-sm">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function FormActions({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex items-end gap-2">
      <button
        onClick={onCancel}
        className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
      >
        Cancel
      </button>
      <button
        onClick={onSave}
        className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
      >
        <CheckCircle2 className="h-4 w-4" /> Save
      </button>
    </div>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

function HeaderRow({ labels }: { labels: string[] }) {
  return (
    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
      {labels.map((label) => (
        <th key={label} className="px-4 py-2.5">
          {label}
        </th>
      ))}
    </tr>
  );
}

function Cell({
  children,
  strong,
  mono,
}: {
  children: React.ReactNode;
  strong?: boolean;
  mono?: boolean;
}) {
  return (
    <td className={`px-4 py-3 ${strong ? "font-medium" : ""} ${mono ? "font-mono text-xs" : ""}`}>
      {children}
    </td>
  );
}

function ActionCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3">
      <div className="flex flex-wrap gap-1">{children}</div>
    </td>
  );
}

function ActionButton({
  label,
  icon: Icon,
  onClick,
  danger,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={label}
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted ${
        danger
          ? "border-critical/30 text-critical"
          : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function ConfigItemsTable({
  rows,
  onEdit,
  onRemove,
}: {
  rows: CategoryConfig[];
  onEdit: (row: CategoryConfig) => void;
  onRemove: (row: CategoryConfig) => void;
}) {
  return (
    <Table>
      <thead>
        <HeaderRow labels={["Module", "Category", "Active", "Actions"]} />
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-muted/30">
            <Cell>{row.module}</Cell>
            <Cell strong>{row.name}</Cell>
            <Cell>
              <StatusBadge status={row.active ? "Active" : "Inactive"} />
            </Cell>
            <ActionCell>
              <ActionButton label="Edit" icon={Edit3} onClick={() => onEdit(row)} />
              <ActionButton label="Remove" icon={Trash2} danger onClick={() => onRemove(row)} />
            </ActionCell>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function roleLabel(role: Role) {
  const labels: Record<Role, string> = {
    engineer: "Engineer",
    "shift-lead": "Shift Lead",
    manager: "Manager",
    executive: "Executive",
    admin: "Admin",
  };
  return labels[role];
}

function humanAction(action: string) {
  return action
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "))
    .join(" ");
}
