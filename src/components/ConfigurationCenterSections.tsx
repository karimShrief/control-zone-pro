import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { configurationService } from "@/lib/services";
import { userById } from "@/lib/data";
import { Archive, CheckCircle2, Edit3, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  moduleNames,
  type AdminModule,
  type DashboardWidgetSetting,
  type HandoverCategory,
  type HandoverTemplate,
  type IncidentCategory,
  type IncidentRule,
  type ProjectTemplate,
  type Role,
  type RosterRule,
  type Severity,
  type ShiftType,
  type SlaEscalationPolicy,
  type SopSetting,
  type TaskTemplate,
  type TaskType,
  type TeamConfig,
  type User,
} from "@/lib/data";

export const CONFIGURATION_CENTER_TABS = [
  "Task Templates",
  "Incident Rules",
  "Project Templates",
  "Handover Templates",
  "SOP Settings",
  "Dashboard Settings",
  "SLA & Escalation",
] as const;

export type ConfigurationCenterTab = (typeof CONFIGURATION_CENTER_TABS)[number];

const TASK_TYPES: TaskType[] = ["Daily DC Operation", "General Task", "NOC Task", "DC Task"];
const RECURRENCE_OPTIONS: TaskTemplate["recurrence"][] = [
  "Daily",
  "Weekly",
  "Monthly",
  "On Demand",
];
const INCIDENT_CATEGORIES: IncidentCategory[] = [
  "Network",
  "Server",
  "Storage",
  "Power",
  "Cooling",
  "Security",
  "Access",
  "Application",
  "Unknown",
];
const SEVERITIES: Severity[] = ["SEV-1", "SEV-2", "SEV-3", "SEV-4"];
const SHIFT_OPTIONS: Array<ShiftType | "Any"> = ["Any", "Morning", "Evening", "Night"];
const HANDOVER_CATEGORIES: HandoverCategory[] = [
  "Incident",
  "Task",
  "Project",
  "Maintenance",
  "Alert",
  "Access",
  "General",
];
const ROLES: Role[] = ["engineer", "shift-lead", "manager", "executive", "admin"];
const SLA_APPLIES_TO: SlaEscalationPolicy["appliesTo"][] = [
  "Tasks",
  "Incidents",
  "Projects",
  "Handover",
];

export function ConfigurationRulePanel({
  tab,
  actorId,
  users,
  teams,
  onChange,
}: {
  tab: ConfigurationCenterTab | "Shift & Roster Rules";
  actorId: string;
  users: User[];
  teams: TeamConfig[];
  onChange: () => void;
}) {
  if (tab === "Task Templates")
    return <TaskTemplatesPanel actorId={actorId} teams={teams} onChange={onChange} />;
  if (tab === "Incident Rules")
    return <IncidentRulesPanel actorId={actorId} teams={teams} onChange={onChange} />;
  if (tab === "Project Templates")
    return <ProjectTemplatesPanel actorId={actorId} teams={teams} onChange={onChange} />;
  if (tab === "Shift & Roster Rules")
    return <RosterRulesPanel actorId={actorId} users={users} teams={teams} onChange={onChange} />;
  if (tab === "Handover Templates")
    return <HandoverTemplatesPanel actorId={actorId} onChange={onChange} />;
  if (tab === "SOP Settings") return <SopSettingsPanel actorId={actorId} onChange={onChange} />;
  if (tab === "Dashboard Settings")
    return <DashboardWidgetsPanel actorId={actorId} onChange={onChange} />;
  if (tab === "SLA & Escalation")
    return <SlaPoliciesPanel actorId={actorId} teams={teams} onChange={onChange} />;
  return null;
}

function TaskTemplatesPanel({
  actorId,
  teams,
  onChange,
}: {
  actorId: string;
  teams: TeamConfig[];
  onChange: () => void;
}) {
  const [rows, setRows] = useState(() => configurationService.listTaskTemplates());
  const [editing, setEditing] = useState<TaskTemplate | null>(null);
  const reload = () => {
    setRows(configurationService.listTaskTemplates());
    onChange();
  };

  return (
    <RuleShell
      title="Task Templates"
      description="Define reusable task templates for daily operations, maintenance, and recurring activities."
      helper="A manager can generate daily DC/NOC work from these templates. Shared Daily DC Operations remain editable by all engineers."
      addLabel="Add Template"
      onAdd={() => {
        const template = configurationService.createTaskTemplate(actorId);
        setEditing({ ...template });
        reload();
        toast.success("Task template created");
      }}
    >
      {editing ? (
        <RuleForm title="Edit task template">
          <TextField
            label="Template name"
            value={editing.name}
            onChange={(name) => setEditing({ ...editing, name })}
          />
          <SelectField
            label="Task type"
            value={editing.type}
            options={TASK_TYPES}
            onChange={(type) => setEditing({ ...editing, type: type as TaskType })}
          />
          <SelectField
            label="Recurrence"
            value={editing.recurrence}
            options={RECURRENCE_OPTIONS}
            onChange={(recurrence) =>
              setEditing({ ...editing, recurrence: recurrence as TaskTemplate["recurrence"] })
            }
          />
          <SelectField
            label="Owner team"
            value={editing.ownerTeam}
            options={teams.map((team) => team.id)}
            onChange={(ownerTeam) => setEditing({ ...editing, ownerTeam })}
          />
          <TextAreaField
            label="Description"
            value={editing.description}
            onChange={(description) => setEditing({ ...editing, description })}
          />
          <TextAreaField
            label="Checklist"
            value={editing.checklist.join("\n")}
            onChange={(value) => setEditing({ ...editing, checklist: splitLines(value) })}
          />
          <ToggleField
            label="Requires evidence"
            checked={editing.evidenceRequired}
            onChange={(evidenceRequired) => setEditing({ ...editing, evidenceRequired })}
          />
          <ToggleField
            label="Shared daily operation"
            checked={editing.sharedDailyOperation}
            onChange={(sharedDailyOperation) => setEditing({ ...editing, sharedDailyOperation })}
          />
          <FormActions
            onCancel={() => setEditing(null)}
            onSave={() => {
              configurationService.updateTaskTemplate(editing.id, actorId, editing);
              setEditing(null);
              reload();
              toast.success("Task template saved");
            }}
          />
        </RuleForm>
      ) : null}
      <RuleTable
        headers={["Template", "Rule", "Team", "Governance", "Status", "Actions"]}
        empty="No task templates configured yet."
      >
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-muted/30">
            <Cell strong>{row.name}</Cell>
            <Cell>
              {row.recurrence} / {row.type}
              <div className="mt-1 text-xs text-muted-foreground">
                {row.checklist.length} checklist items
              </div>
            </Cell>
            <Cell>{row.ownerTeam}</Cell>
            <Cell>
              <StatusBadge
                status={row.evidenceRequired ? "Evidence Required" : "Guidance Only"}
                tone={row.evidenceRequired ? "warning" : "info"}
              />
            </Cell>
            <Cell>
              <StatusBadge status={row.active ? "Active" : "Archived"} />
            </Cell>
            <ActionCell>
              <SmallAction label="Edit" icon={Edit3} onClick={() => setEditing({ ...row })} />
              <SmallAction
                label="Archive"
                icon={Archive}
                danger
                onClick={() =>
                  archiveWithConfirm(row.id, "task template", () => {
                    configurationService.archiveTaskTemplate(row.id, actorId);
                    reload();
                  })
                }
              />
            </ActionCell>
          </tr>
        ))}
      </RuleTable>
    </RuleShell>
  );
}

function IncidentRulesPanel({
  actorId,
  teams,
  onChange,
}: {
  actorId: string;
  teams: TeamConfig[];
  onChange: () => void;
}) {
  const [rows, setRows] = useState(() => configurationService.listIncidentRules());
  const [editing, setEditing] = useState<IncidentRule | null>(null);
  const reload = () => {
    setRows(configurationService.listIncidentRules());
    onChange();
  };

  return (
    <RuleShell
      title="Incident Rules"
      description="Define default severity, SLA, assignment team, and recommended SOPs by incident category."
      helper="When an incident is created, matching active rules guide severity, SLA and SOP behavior without code changes."
      addLabel="Add Rule"
      onAdd={() => {
        const rule = configurationService.createIncidentRule(actorId);
        setEditing({ ...rule });
        reload();
        toast.success("Incident rule created");
      }}
    >
      {editing ? (
        <RuleForm title="Edit incident rule">
          <SelectField
            label="Category"
            value={editing.category}
            options={INCIDENT_CATEGORIES}
            onChange={(category) =>
              setEditing({ ...editing, category: category as IncidentCategory })
            }
          />
          <SelectField
            label="Default severity"
            value={editing.defaultSeverity}
            options={SEVERITIES}
            onChange={(defaultSeverity) =>
              setEditing({ ...editing, defaultSeverity: defaultSeverity as Severity })
            }
          />
          <NumberField
            label="SLA minutes"
            value={editing.slaMinutes}
            onChange={(slaMinutes) => setEditing({ ...editing, slaMinutes })}
          />
          <SelectField
            label="Assignment team"
            value={editing.assignmentTeam}
            options={teams.map((team) => team.id)}
            onChange={(assignmentTeam) => setEditing({ ...editing, assignmentTeam })}
          />
          <TextField
            label="Recommended SOP"
            value={editing.recommendedSop}
            onChange={(recommendedSop) => setEditing({ ...editing, recommendedSop })}
          />
          <TextField
            label="Escalation path"
            value={editing.escalationPath}
            onChange={(escalationPath) => setEditing({ ...editing, escalationPath })}
          />
          <FormActions
            onCancel={() => setEditing(null)}
            onSave={() => {
              configurationService.updateIncidentRule(editing.id, actorId, editing);
              setEditing(null);
              reload();
              toast.success("Incident rule saved");
            }}
          />
        </RuleForm>
      ) : null}
      <RuleTable
        headers={["Category", "Severity / SLA", "Team", "Recommended SOP", "Status", "Actions"]}
        empty="No incident rules configured yet."
      >
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-muted/30">
            <Cell strong>{row.category}</Cell>
            <Cell>
              <div className="flex flex-wrap gap-1">
                <StatusBadge status={row.defaultSeverity} />
                <StatusBadge status={`${row.slaMinutes} min SLA`} tone="info" />
              </div>
            </Cell>
            <Cell>{row.assignmentTeam}</Cell>
            <Cell>
              {row.recommendedSop}
              <div className="mt-1 text-xs text-muted-foreground">{row.escalationPath}</div>
            </Cell>
            <Cell>
              <StatusBadge status={row.active ? "Active" : "Archived"} />
            </Cell>
            <ActionCell>
              <SmallAction label="Edit" icon={Edit3} onClick={() => setEditing({ ...row })} />
              <SmallAction
                label="Archive"
                icon={Archive}
                danger
                onClick={() =>
                  archiveWithConfirm(row.id, "incident rule", () => {
                    configurationService.archiveIncidentRule(row.id, actorId);
                    reload();
                  })
                }
              />
            </ActionCell>
          </tr>
        ))}
      </RuleTable>
    </RuleShell>
  );
}

function ProjectTemplatesPanel({
  actorId,
  teams,
  onChange,
}: {
  actorId: string;
  teams: TeamConfig[];
  onChange: () => void;
}) {
  const [rows, setRows] = useState(() => configurationService.listProjectTemplates());
  const [editing, setEditing] = useState<ProjectTemplate | null>(null);
  const reload = () => {
    setRows(configurationService.listProjectTemplates());
    onChange();
  };

  return (
    <RuleShell
      title="Project Templates"
      description="Define project templates that create standard phases and subtasks for repeatable work."
      helper="Progress is calculated from generated subtasks, giving managers a clean project-risk story."
      addLabel="Add Template"
      onAdd={() => {
        const template = configurationService.createProjectTemplate(actorId);
        setEditing({ ...template });
        reload();
        toast.success("Project template created");
      }}
    >
      {editing ? (
        <RuleForm title="Edit project template">
          <TextField
            label="Template name"
            value={editing.name}
            onChange={(name) => setEditing({ ...editing, name })}
          />
          <SelectField
            label="Default team"
            value={editing.defaultTeam}
            options={teams.map((team) => team.id)}
            onChange={(defaultTeam) => setEditing({ ...editing, defaultTeam })}
          />
          <TextField
            label="Governance gate"
            value={editing.governanceGate}
            onChange={(governanceGate) => setEditing({ ...editing, governanceGate })}
          />
          <TextAreaField
            label="Description"
            value={editing.description}
            onChange={(description) => setEditing({ ...editing, description })}
          />
          <TextAreaField
            label="Phases"
            value={editing.phases.join("\n")}
            onChange={(value) => setEditing({ ...editing, phases: splitLines(value) })}
          />
          <FormActions
            onCancel={() => setEditing(null)}
            onSave={() => {
              configurationService.updateProjectTemplate(editing.id, actorId, editing);
              setEditing(null);
              reload();
              toast.success("Project template saved");
            }}
          />
        </RuleForm>
      ) : null}
      <RuleTable
        headers={["Template", "Phases", "Team", "Governance", "Status", "Actions"]}
        empty="No project templates configured yet."
      >
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-muted/30">
            <Cell strong>{row.name}</Cell>
            <Cell>{row.phases.length} phases</Cell>
            <Cell>{row.defaultTeam}</Cell>
            <Cell>{row.governanceGate}</Cell>
            <Cell>
              <StatusBadge status={row.active ? "Active" : "Archived"} />
            </Cell>
            <ActionCell>
              <SmallAction label="Edit" icon={Edit3} onClick={() => setEditing({ ...row })} />
              <SmallAction
                label="Archive"
                icon={Archive}
                danger
                onClick={() =>
                  archiveWithConfirm(row.id, "project template", () => {
                    configurationService.archiveProjectTemplate(row.id, actorId);
                    reload();
                  })
                }
              />
            </ActionCell>
          </tr>
        ))}
      </RuleTable>
    </RuleShell>
  );
}

function RosterRulesPanel({
  actorId,
  users,
  onChange,
}: {
  actorId: string;
  users: User[];
  teams: TeamConfig[];
  onChange: () => void;
}) {
  const [rows, setRows] = useState(() => configurationService.listRosterRules());
  const [editing, setEditing] = useState<RosterRule | null>(null);
  const rosterAssignees = users.filter(
    (user) =>
      user.status !== "Inactive" && (user.role === "engineer" || user.role === "shift-lead"),
  );
  const reload = () => {
    setRows(configurationService.listRosterRules());
    onChange();
  };

  return (
    <RuleShell
      title="Shift & Roster Rules"
      description="Define shift coverage, work/off patterns, mandatory assignments, and fairness rules."
      helper="The monthly roster builder applies active mandatory assignment rules and continues to surface coverage conflicts."
      addLabel="Add Roster Rule"
      onAdd={() => {
        const rule = configurationService.createRosterRule(actorId);
        setEditing({ ...rule });
        reload();
        toast.success("Roster rule created");
      }}
    >
      {editing ? (
        <RuleForm title="Edit roster rule">
          <TextField
            label="Rule name"
            value={editing.name}
            onChange={(name) => setEditing({ ...editing, name })}
          />
          <SelectField
            label="Mandatory engineer"
            value={editing.mandatoryEngineer ?? ""}
            options={["", ...rosterAssignees.map((user) => user.id)]}
            optionLabels={{
              "": "No mandatory engineer",
              ...Object.fromEntries(rosterAssignees.map((user) => [user.id, user.name])),
            }}
            onChange={(mandatoryEngineer) =>
              setEditing({ ...editing, mandatoryEngineer: mandatoryEngineer || undefined })
            }
          />
          <SelectField
            label="Mandatory shift"
            value={editing.mandatoryShift}
            options={SHIFT_OPTIONS}
            onChange={(mandatoryShift) =>
              setEditing({
                ...editing,
                mandatoryShift: mandatoryShift as RosterRule["mandatoryShift"],
              })
            }
          />
          <TextField
            label="Work/off pattern"
            value={editing.pattern}
            onChange={(pattern) => setEditing({ ...editing, pattern })}
          />
          <TextAreaField
            label="Description"
            value={editing.description}
            onChange={(description) => setEditing({ ...editing, description })}
          />
          <TextAreaField
            label="Fairness target"
            value={editing.fairnessTarget}
            onChange={(fairnessTarget) => setEditing({ ...editing, fairnessTarget })}
          />
          <FormActions
            onCancel={() => setEditing(null)}
            onSave={() => {
              configurationService.updateRosterRule(editing.id, actorId, editing);
              setEditing(null);
              reload();
              toast.success("Roster rule saved");
            }}
          />
        </RuleForm>
      ) : null}
      <RuleTable
        headers={["Rule", "Mandatory", "Pattern", "Fairness", "Status", "Actions"]}
        empty="No roster rules configured yet."
      >
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-muted/30">
            <Cell strong>{row.name}</Cell>
            <Cell>
              {row.mandatoryEngineer ? userById(row.mandatoryEngineer) : "None"}
              <div className="mt-1 text-xs text-muted-foreground">{row.mandatoryShift}</div>
            </Cell>
            <Cell>{row.pattern}</Cell>
            <Cell>{row.fairnessTarget}</Cell>
            <Cell>
              <StatusBadge status={row.active ? "Active" : "Archived"} />
            </Cell>
            <ActionCell>
              <SmallAction label="Edit" icon={Edit3} onClick={() => setEditing({ ...row })} />
              <SmallAction
                label="Archive"
                icon={Archive}
                danger
                onClick={() =>
                  archiveWithConfirm(row.id, "roster rule", () => {
                    configurationService.archiveRosterRule(row.id, actorId);
                    reload();
                  })
                }
              />
            </ActionCell>
          </tr>
        ))}
      </RuleTable>
    </RuleShell>
  );
}

function HandoverTemplatesPanel({ actorId, onChange }: { actorId: string; onChange: () => void }) {
  const [rows, setRows] = useState(() => configurationService.listHandoverTemplates());
  const [editing, setEditing] = useState<HandoverTemplate | null>(null);
  const reload = () => {
    setRows(configurationService.listHandoverTemplates());
    onChange();
  };

  return (
    <RuleShell
      title="Handover Templates"
      description="Define handover templates, required categories and acknowledgement rules."
      helper="Critical handover points can require next actions and manager acknowledgement, supporting governance without extra pages."
      addLabel="Add Template"
      onAdd={() => {
        const template = configurationService.createHandoverTemplate(actorId);
        setEditing({ ...template });
        reload();
        toast.success("Handover template created");
      }}
    >
      {editing ? (
        <RuleForm title="Edit handover template">
          <TextField
            label="Template name"
            value={editing.name}
            onChange={(name) => setEditing({ ...editing, name })}
          />
          <TextAreaField
            label="Description"
            value={editing.description}
            onChange={(description) => setEditing({ ...editing, description })}
          />
          <SelectMultiField
            label="Required categories"
            values={editing.requiredCategories}
            options={HANDOVER_CATEGORIES}
            onChange={(requiredCategories) => setEditing({ ...editing, requiredCategories })}
          />
          <ToggleField
            label="Requires acknowledgement"
            checked={editing.requiresAcknowledgement}
            onChange={(requiresAcknowledgement) =>
              setEditing({ ...editing, requiresAcknowledgement })
            }
          />
          <ToggleField
            label="Critical points require next action"
            checked={editing.criticalRequiresNextAction}
            onChange={(criticalRequiresNextAction) =>
              setEditing({ ...editing, criticalRequiresNextAction })
            }
          />
          <FormActions
            onCancel={() => setEditing(null)}
            onSave={() => {
              configurationService.updateHandoverTemplate(editing.id, actorId, editing);
              setEditing(null);
              reload();
              toast.success("Handover template saved");
            }}
          />
        </RuleForm>
      ) : null}
      <RuleTable
        headers={["Template", "Required Categories", "Controls", "Governance", "Status", "Actions"]}
        empty="No handover templates configured yet."
      >
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-muted/30">
            <Cell strong>{row.name}</Cell>
            <Cell>{row.requiredCategories.join(", ")}</Cell>
            <Cell>
              {row.criticalRequiresNextAction ? "Critical next action required" : "Guidance"}
            </Cell>
            <Cell>
              <StatusBadge
                status={row.requiresAcknowledgement ? "Requires Review" : "Guidance Only"}
                tone={row.requiresAcknowledgement ? "warning" : "info"}
              />
            </Cell>
            <Cell>
              <StatusBadge status={row.active ? "Active" : "Archived"} />
            </Cell>
            <ActionCell>
              <SmallAction label="Edit" icon={Edit3} onClick={() => setEditing({ ...row })} />
              <SmallAction
                label="Archive"
                icon={Archive}
                danger
                onClick={() =>
                  archiveWithConfirm(row.id, "handover template", () => {
                    configurationService.archiveHandoverTemplate(row.id, actorId);
                    reload();
                  })
                }
              />
            </ActionCell>
          </tr>
        ))}
      </RuleTable>
    </RuleShell>
  );
}

function SopSettingsPanel({ actorId, onChange }: { actorId: string; onChange: () => void }) {
  const [rows, setRows] = useState(() => configurationService.listSopSettings());
  const [editing, setEditing] = useState<SopSetting | null>(null);
  const reload = () => {
    setRows(configurationService.listSopSettings());
    onChange();
  };

  return (
    <RuleShell
      title="SOP Settings"
      description="Define SOP categories, approval workflow, visibility rules and linkage behavior."
      helper="SOP governance stays lightweight: approved documents can be linked to incidents, tasks, projects and handover points."
      addLabel="Add SOP Setting"
      onAdd={() => {
        const setting = configurationService.createSopSetting(actorId);
        setEditing({ ...setting });
        reload();
        toast.success("SOP setting created");
      }}
    >
      {editing ? (
        <RuleForm title="Edit SOP setting">
          <TextField
            label="Setting name"
            value={editing.name}
            onChange={(name) => setEditing({ ...editing, name })}
          />
          <TextField
            label="Category"
            value={editing.category}
            onChange={(category) => setEditing({ ...editing, category })}
          />
          <TextField
            label="Approval workflow"
            value={editing.approvalWorkflow}
            onChange={(approvalWorkflow) => setEditing({ ...editing, approvalWorkflow })}
          />
          <TextField
            label="Visibility rule"
            value={editing.visibilityRule}
            onChange={(visibilityRule) => setEditing({ ...editing, visibilityRule })}
          />
          <SelectMultiField
            label="Linkable modules"
            values={editing.linkableTo}
            options={moduleNames}
            onChange={(linkableTo) =>
              setEditing({ ...editing, linkableTo: linkableTo as AdminModule[] })
            }
          />
          <FormActions
            onCancel={() => setEditing(null)}
            onSave={() => {
              configurationService.updateSopSetting(editing.id, actorId, editing);
              setEditing(null);
              reload();
              toast.success("SOP setting saved");
            }}
          />
        </RuleForm>
      ) : null}
      <RuleTable
        headers={["Setting", "Category", "Workflow", "Visibility", "Status", "Actions"]}
        empty="No SOP settings configured yet."
      >
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-muted/30">
            <Cell strong>{row.name}</Cell>
            <Cell>{row.category}</Cell>
            <Cell>{row.approvalWorkflow}</Cell>
            <Cell>{row.visibilityRule}</Cell>
            <Cell>
              <StatusBadge status={row.active ? "Active" : "Archived"} />
            </Cell>
            <ActionCell>
              <SmallAction label="Edit" icon={Edit3} onClick={() => setEditing({ ...row })} />
              <SmallAction
                label="Archive"
                icon={Archive}
                danger
                onClick={() =>
                  archiveWithConfirm(row.id, "SOP setting", () => {
                    configurationService.archiveSopSetting(row.id, actorId);
                    reload();
                  })
                }
              />
            </ActionCell>
          </tr>
        ))}
      </RuleTable>
    </RuleShell>
  );
}

function DashboardWidgetsPanel({ actorId, onChange }: { actorId: string; onChange: () => void }) {
  const [rows, setRows] = useState(() => configurationService.listDashboardWidgets());
  const [editing, setEditing] = useState<DashboardWidgetSetting | null>(null);
  const reload = () => {
    setRows(configurationService.listDashboardWidgets());
    onChange();
  };

  return (
    <RuleShell
      title="Dashboard Widget Rules"
      description="Choose which widgets appear for each role while keeping dashboards simple and role-relevant."
      helper="Executive widgets stay read-only; manager widgets focus on Command View decisions; engineer noise stays out of My Work."
      addLabel="Add Widget Rule"
      onAdd={() => {
        const widget = configurationService.createDashboardWidget(actorId);
        setEditing({ ...widget });
        reload();
        toast.success("Dashboard widget rule created");
      }}
    >
      {editing ? (
        <RuleForm title="Edit dashboard widget rule">
          <SelectField
            label="Role"
            value={editing.role}
            options={ROLES}
            onChange={(role) => setEditing({ ...editing, role: role as Role })}
          />
          <TextField
            label="Widget"
            value={editing.widget}
            onChange={(widget) => setEditing({ ...editing, widget })}
          />
          <TextAreaField
            label="Description"
            value={editing.description}
            onChange={(description) => setEditing({ ...editing, description })}
          />
          <TextField
            label="Governance signal"
            value={editing.governanceSignal}
            onChange={(governanceSignal) => setEditing({ ...editing, governanceSignal })}
          />
          <ToggleField
            label="Enabled"
            checked={editing.enabled}
            onChange={(enabled) => setEditing({ ...editing, enabled })}
          />
          <FormActions
            onCancel={() => setEditing(null)}
            onSave={() => {
              configurationService.updateDashboardWidget(editing.id, actorId, editing);
              setEditing(null);
              reload();
              toast.success("Dashboard widget rule saved");
            }}
          />
        </RuleForm>
      ) : null}
      <RuleTable
        headers={["Role", "Widget", "Description", "Governance", "Status", "Actions"]}
        empty="No dashboard widget rules configured yet."
      >
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-muted/30">
            <Cell strong>{roleLabel(row.role)}</Cell>
            <Cell>{row.widget}</Cell>
            <Cell>{row.description}</Cell>
            <Cell>
              <StatusBadge status={row.governanceSignal} tone="info" />
            </Cell>
            <Cell>
              <StatusBadge status={row.enabled ? "Active" : "Archived"} />
            </Cell>
            <ActionCell>
              <SmallAction label="Edit" icon={Edit3} onClick={() => setEditing({ ...row })} />
              <SmallAction
                label="Archive"
                icon={Archive}
                danger
                onClick={() =>
                  archiveWithConfirm(row.id, "dashboard widget rule", () => {
                    configurationService.archiveDashboardWidget(row.id, actorId);
                    reload();
                  })
                }
              />
            </ActionCell>
          </tr>
        ))}
      </RuleTable>
    </RuleShell>
  );
}

function SlaPoliciesPanel({
  actorId,
  teams,
  onChange,
}: {
  actorId: string;
  teams: TeamConfig[];
  onChange: () => void;
}) {
  const [rows, setRows] = useState(() => configurationService.listSlaPolicies());
  const [editing, setEditing] = useState<SlaEscalationPolicy | null>(null);
  const reload = () => {
    setRows(configurationService.listSlaPolicies());
    onChange();
  };

  return (
    <RuleShell
      title="SLA & Escalation"
      description="Define simple SLA thresholds and escalation owners for operational governance."
      helper="These policies make SLA risk visible in dashboards and keep accountability clear without adding a heavy compliance module."
      addLabel="Add SLA Policy"
      onAdd={() => {
        const policy = configurationService.createSlaPolicy(actorId);
        setEditing({ ...policy });
        reload();
        toast.success("SLA policy created");
      }}
    >
      {editing ? (
        <RuleForm title="Edit SLA policy">
          <TextField
            label="Policy name"
            value={editing.name}
            onChange={(name) => setEditing({ ...editing, name })}
          />
          <SelectField
            label="Applies to"
            value={editing.appliesTo}
            options={SLA_APPLIES_TO}
            onChange={(appliesTo) =>
              setEditing({ ...editing, appliesTo: appliesTo as SlaEscalationPolicy["appliesTo"] })
            }
          />
          <NumberField
            label="Threshold minutes"
            value={editing.thresholdMinutes}
            onChange={(thresholdMinutes) => setEditing({ ...editing, thresholdMinutes })}
          />
          <SelectField
            label="Escalation owner"
            value={editing.escalationOwner}
            options={teams.map((team) => team.id)}
            onChange={(escalationOwner) => setEditing({ ...editing, escalationOwner })}
          />
          <FormActions
            onCancel={() => setEditing(null)}
            onSave={() => {
              configurationService.updateSlaPolicy(editing.id, actorId, editing);
              setEditing(null);
              reload();
              toast.success("SLA policy saved");
            }}
          />
        </RuleForm>
      ) : null}
      <RuleTable
        headers={["Policy", "Applies To", "Threshold", "Owner", "Status", "Actions"]}
        empty="No SLA policies configured yet."
      >
        {rows.map((row) => (
          <tr key={row.id} className="hover:bg-muted/30">
            <Cell strong>{row.name}</Cell>
            <Cell>{row.appliesTo}</Cell>
            <Cell>{row.thresholdMinutes} minutes</Cell>
            <Cell>{row.escalationOwner}</Cell>
            <Cell>
              <StatusBadge status={row.active ? "Active" : "Archived"} />
            </Cell>
            <ActionCell>
              <SmallAction label="Edit" icon={Edit3} onClick={() => setEditing({ ...row })} />
              <SmallAction
                label="Archive"
                icon={Archive}
                danger
                onClick={() =>
                  archiveWithConfirm(row.id, "SLA policy", () => {
                    configurationService.archiveSlaPolicy(row.id, actorId);
                    reload();
                  })
                }
              />
            </ActionCell>
          </tr>
        ))}
      </RuleTable>
    </RuleShell>
  );
}

function RuleShell({
  title,
  description,
  helper,
  addLabel,
  onAdd,
  children,
}: {
  title: string;
  description: string;
  helper: string;
  addLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="rounded-lg border border-info/25 bg-info/10 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-info" />
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            <p className="mt-2 text-sm text-foreground">{helper}</p>
          </div>
          <button
            onClick={onAdd}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> {addLabel}
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}

function RuleForm({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
      <div className="mt-3 rounded-md border border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        Configuration Change Logged: updates are written to the audit log.
      </div>
    </div>
  );
}

function RuleTable({
  headers,
  empty,
  children,
}: {
  headers: string[];
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
              {headers.map((header) => (
                <th key={header} className="px-4 py-2.5">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {hasChildren ? (
              children
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-10 text-center text-sm text-muted-foreground"
                >
                  {empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm md:col-span-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        value={value}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full resize-none rounded-md border border-input bg-background px-3 py-2"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  optionLabels,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  optionLabels?: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {optionLabels?.[option] ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectMultiField<T extends string>({
  label,
  values,
  options,
  onChange,
}: {
  label: string;
  values: T[];
  options: readonly T[];
  onChange: (value: T[]) => void;
}) {
  return (
    <div className="md:col-span-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1.5 grid grid-cols-1 gap-2 rounded-md border border-border bg-background p-3 md:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => (
          <label key={option} className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={values.includes(option)}
              onChange={() =>
                onChange(
                  values.includes(option)
                    ? values.filter((value) => value !== option)
                    : [...values, option],
                )
              }
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-background p-3 text-sm">
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
        <CheckCircle2 className="h-4 w-4" /> Save Changes
      </button>
    </div>
  );
}

function Cell({ children, strong }: { children: React.ReactNode; strong?: boolean }) {
  return <td className={`px-4 py-3 ${strong ? "font-medium" : ""}`}>{children}</td>;
}

function ActionCell({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-4 py-3">
      <div className="flex flex-wrap gap-1">{children}</div>
    </td>
  );
}

function SmallAction({
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

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function archiveWithConfirm(id: string, label: string, onConfirm: () => void) {
  const ok =
    typeof window === "undefined" ||
    window.confirm(`Archive ${label} ${id}? This configuration change will be logged.`);
  if (!ok) return;
  onConfirm();
  toast.success(`${label} archived`);
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
