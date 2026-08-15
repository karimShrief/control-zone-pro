import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, KpiCard } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { useAuth } from "@/lib/auth";
import { canImportType, canRunImports, canViewImportCenter } from "@/lib/rbac";
import { importService } from "@/lib/services";
import { userById, type ImportJob, type ImportJobRow, type ImportType } from "@/lib/data";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  Eye,
  FileText,
  RotateCcw,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/import-center")({
  component: ImportCenterPage,
});

const STEPS = [
  "Select Import Type",
  "Download Template",
  "Upload File",
  "Validate Data",
  "Review & Confirm",
  "Import Complete",
];

function ImportCenterPage() {
  const { user } = useAuth();
  const [templates] = useState(() => importService.listTemplates());
  const allowedTemplates = useMemo(
    () => importService.allowedTypesForRole(user?.role),
    [user?.role],
  );
  const [selectedType, setSelectedType] = useState<ImportType>(
    allowedTemplates[0]?.type ?? "Tasks",
  );
  const [step, setStep] = useState(1);
  const [jobs, setJobs] = useState(() => importService.listJobs());
  const [activeJob, setActiveJob] = useState<ImportJob | null>(null);
  const [rows, setRows] = useState<ImportJobRow[]>([]);
  const [detailJob, setDetailJob] = useState<ImportJob | null>(null);

  if (!user) return <Navigate to="/login" />;
  if (!canViewImportCenter(user)) return <PermissionDenied />;

  const readOnly = user.role === "executive";
  const selectedTemplate =
    templates.find((template) => template.type === selectedType) ?? allowedTemplates[0];
  const canImportSelected = canImportType(user, selectedType);
  const canRun = canRunImports(user) && canImportSelected;
  const summary = summarizeRows(rows);

  const refresh = (job?: ImportJob | null) => {
    setJobs(importService.listJobs());
    if (job) {
      setActiveJob(job);
      setRows(importService.listRows(job.id));
    }
  };

  const downloadTemplate = () => {
    if (!canRun || !selectedTemplate) return;
    const csv = importService.downloadTemplate(user.id, selectedTemplate.type);
    downloadTextFile(csv, `${fileSlug(selectedTemplate.type)}-template.csv`);
    refresh();
    setStep(3);
    toast.success("Template downloaded");
  };

  const uploadFile = (fileName: string) => {
    if (!canRun || !selectedTemplate) return;
    const job = importService.uploadFile(user.id, selectedTemplate.type, fileName);
    if (!job) {
      toast.error("Action cannot be completed. Select an allowed import type.");
      return;
    }
    refresh(job);
    setStep(4);
    toast.success("Mock file uploaded");
  };

  const validateJob = () => {
    if (!activeJob) return;
    const job = importService.validate(user.id, activeJob.id);
    if (!job) return;
    refresh(job);
    setStep(5);
    toast.success("Validation completed");
  };

  const confirmJob = () => {
    if (!activeJob) return;
    const job = importService.confirm(user.id, activeJob.id);
    if (!job) return;
    refresh(job);
    setStep(6);
    toast.success(job.status === "Imported" ? "Import complete" : "Import failed");
  };

  const cancelJob = () => {
    if (!activeJob) return;
    const job = importService.cancel(user.id, activeJob.id);
    refresh(job);
    setStep(1);
    toast.success("Import cancelled");
  };

  const rerunImport = (job: ImportJob) => {
    if (!canImportType(user, job.importType)) return;
    const next = importService.rerun(user.id, job.id);
    if (!next) return;
    setSelectedType(next.importType);
    refresh(next);
    setStep(4);
    toast.success("Import re-run prepared");
  };

  const downloadErrorReport = (job: ImportJob) => {
    const report = importService.errorReport(user.id, job.id);
    downloadTextFile(report || "No row errors found", `${job.id}-error-report.csv`);
    refresh();
    toast.success("Mock error report downloaded");
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6">
      <PageHeader
        title="Import Center"
        subtitle="Import operational data using guided templates, validation checks, and audit-ready history."
      />

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Data Import Builder
            </div>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight">
              Bring DC/NOC data in with validation before it reaches operations.
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Use role-approved templates for users, tasks, incidents, projects, roster, handover
              points and SOP metadata. The prototype validates mock rows now and is structured for
              future MySQL import jobs.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard label="Import Jobs" value={jobs.length} icon={Database} tone="info" />
            <KpiCard
              label="Audit Ready"
              value="Yes"
              icon={ShieldCheck}
              tone="success"
              sub="Each action is logged"
            />
          </div>
        </div>
      </section>

      {readOnly ? (
        <section className="rounded-lg border border-info/25 bg-info/10 p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Read-only import history</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Executive access is limited to import visibility and governance review.
              </p>
            </div>
            <StatusBadge status="Role Restricted" tone="info" />
          </div>
        </section>
      ) : (
        <>
          <StepRail current={step} />

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1fr]">
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-2 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Step 1: Select import type</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Role-restricted cards make it clear what this user can import.
                  </p>
                </div>
                <StatusBadge status={roleAccessLabel(user.role)} tone="info" />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                {templates.map((template) => {
                  const allowed = canImportType(user, template.type);
                  return (
                    <button
                      key={template.type}
                      disabled={!allowed}
                      onClick={() => {
                        setSelectedType(template.type);
                        setStep(Math.max(step, 2));
                      }}
                      className={`rounded-lg border p-3 text-left transition ${
                        selectedType === template.type
                          ? "border-primary bg-primary/10"
                          : "border-border bg-background hover:bg-muted/50"
                      } ${allowed ? "" : "cursor-not-allowed opacity-55"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">{template.type}</span>
                        <StatusBadge
                          status={allowed ? "Allowed" : "Role Restricted"}
                          tone={allowed ? "success" : "neutral"}
                        />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{template.description}</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Step 2: Download template</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Template fields match the future MySQL target tables.
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  disabled={!canRun}
                  title="Download a mock CSV template for the selected import type"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" /> Download Template
                </button>
              </div>
              {selectedTemplate ? <TemplateFields template={selectedTemplate} /> : null}
            </section>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold">Step 3: Upload file</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload CSV/XLSX or use the sample file to simulate validation.
              </p>
              <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 p-5 text-center">
                <Upload className="mx-auto h-7 w-7 text-muted-foreground" />
                <div className="mt-2 text-sm font-medium">Drop-zone prototype</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  File parsing is mocked for now; validation rows are generated from the selected
                  template.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm hover:bg-muted">
                    <Upload className="h-4 w-4" /> Upload CSV/XLSX
                    <input
                      type="file"
                      accept=".csv,.xlsx"
                      className="sr-only"
                      disabled={!canRun}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) uploadFile(file.name);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    onClick={() => uploadFile(`${fileSlug(selectedType)}-sample.csv`)}
                    disabled={!canRun}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <FileText className="h-4 w-4" /> Use Sample File
                  </button>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Steps 4-5: Validate and review</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Required fields, unknown engineers, dates, duplicate rows, status and priority
                    are checked.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={validateJob}
                    disabled={!activeJob || activeJob.status === "Imported"}
                    className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Validate Data
                  </button>
                  <button
                    onClick={confirmJob}
                    disabled={!activeJob || activeJob.status !== "Validated"}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Database className="h-4 w-4" /> Confirm Import
                  </button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                <Metric label="Total" value={summary.total} />
                <Metric label="Valid" value={summary.valid} tone="success" />
                <Metric label="Warnings" value={summary.warnings} tone="warning" />
                <Metric label="Errors" value={summary.errors} tone="critical" />
              </div>

              <PreviewTable rows={rows} />

              {activeJob ? (
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                  <button
                    onClick={cancelJob}
                    disabled={activeJob.status === "Imported" || activeJob.status === "Cancelled"}
                    className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" /> Cancel Import
                  </button>
                  {step === 6 ? <StatusBadge status="Import Complete" tone="success" /> : null}
                </div>
              ) : null}
            </section>
          </div>
        </>
      )}

      <HistoryTable
        jobs={jobs}
        readOnly={readOnly}
        userCanRun={canRunImports(user)}
        onView={(job) => {
          setDetailJob(job);
          setRows(importService.listRows(job.id));
        }}
        onErrorReport={downloadErrorReport}
        onRerun={rerunImport}
        canRerun={(job) => canImportType(user, job.importType)}
      />

      {detailJob ? (
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-border pb-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold">Import details - {detailJob.id}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {detailJob.importType} uploaded by {userById(detailJob.uploadedBy)}
              </p>
            </div>
            <StatusBadge status={detailJob.status} />
          </div>
          <PreviewTable rows={rows} />
        </section>
      ) : null}
    </div>
  );
}

function PermissionDenied() {
  return (
    <div className="mx-auto max-w-[900px] p-6">
      <div className="rounded-xl border border-warning/30 bg-warning/10 p-6 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-warning-foreground" />
        <h1 className="mt-3 text-lg font-semibold">Permission denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Import Center is restricted to Shift Lead, Manager, Executive and Admin roles.
        </p>
      </div>
    </div>
  );
}

function StepRail({ current }: { current: number }) {
  return (
    <section className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {STEPS.map((label, index) => {
          const stepNumber = index + 1;
          const active = current === stepNumber;
          const done = current > stepNumber;
          return (
            <div
              key={label}
              className={`rounded-lg border px-3 py-2 ${
                active
                  ? "border-primary bg-primary/10"
                  : done
                    ? "border-success/30 bg-success/10"
                    : "border-border bg-background"
              }`}
            >
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Step {stepNumber}
              </div>
              <div className="mt-1 text-sm font-medium">{label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TemplateFields({
  template,
}: {
  template: ReturnType<typeof importService.listTemplates>[number];
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
        CSV template structure
      </div>
      <div className="max-h-[260px] overflow-y-auto rounded-lg border border-border">
        {template.fields.map((field) => (
          <div
            key={field.name}
            className="grid grid-cols-[1fr_auto] gap-3 border-b border-border px-3 py-2 last:border-0"
          >
            <div>
              <div className="text-sm font-medium">{field.name}</div>
              <div className="text-xs text-muted-foreground">Example: {field.example}</div>
            </div>
            <StatusBadge
              status={field.required ? "Required" : "Optional"}
              tone={field.required ? "warning" : "neutral"}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 text-xs text-muted-foreground">
        Future MySQL tables: {template.mysqlTargetTables.join(", ")}
      </div>
    </div>
  );
}

function PreviewTable({ rows }: { rows: ImportJobRow[] }) {
  if (!rows.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
        <Upload className="mx-auto h-5 w-5 text-muted-foreground" />
        <div className="mt-2 text-sm font-medium">No file uploaded yet</div>
        <div className="mt-1 text-xs text-muted-foreground">
          Upload a file or use the sample file to see validation preview rows.
        </div>
      </div>
    );
  }

  const previewKeys = Object.keys(rows[0].preview).slice(0, 4);
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2">Row</th>
              {previewKeys.map((key) => (
                <th key={key} className="px-3 py-2">
                  {key}
                </th>
              ))}
              <th className="px-3 py-2">Validation</th>
              <th className="px-3 py-2">Messages</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-muted/30">
                <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                  {row.rowNumber}
                </td>
                {previewKeys.map((key) => (
                  <td key={key} className="max-w-[220px] truncate px-3 py-2 text-xs">
                    {row.preview[key] || "-"}
                  </td>
                ))}
                <td className="px-3 py-2">
                  <StatusBadge status={row.validationStatus} />
                </td>
                <td className="max-w-[360px] px-3 py-2 text-xs text-muted-foreground">
                  {row.messages.join("; ") || "Ready for validation"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistoryTable({
  jobs,
  readOnly,
  userCanRun,
  onView,
  onErrorReport,
  onRerun,
  canRerun,
}: {
  jobs: ImportJob[];
  readOnly: boolean;
  userCanRun: boolean;
  onView: (job: ImportJob) => void;
  onErrorReport: (job: ImportJob) => void;
  onRerun: (job: ImportJob) => void;
  canRerun: (job: ImportJob) => boolean;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold">Import History</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Audit-ready record of template downloads, validations and confirmed imports.
          </p>
        </div>
        {readOnly ? <StatusBadge status="Read Only" tone="info" /> : null}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5">Date/Time</th>
              <th className="px-4 py-2.5">Import Type</th>
              <th className="px-4 py-2.5">Uploaded By</th>
              <th className="px-4 py-2.5">Imported</th>
              <th className="px-4 py-2.5">Failed</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Notes</th>
              <th className="px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {job.updatedAt}
                </td>
                <td className="px-4 py-3 font-medium">{job.importType}</td>
                <td className="px-4 py-3 text-xs">{userById(job.uploadedBy)}</td>
                <td className="px-4 py-3">{job.recordsImported}</td>
                <td className="px-4 py-3">{job.recordsFailed}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={job.status} />
                </td>
                <td className="max-w-xs px-4 py-3 text-xs text-muted-foreground">
                  <span className="line-clamp-2">{job.notes}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <IconButton label="View Details" icon={Eye} onClick={() => onView(job)} />
                    {!readOnly && userCanRun ? (
                      <>
                        <IconButton
                          label="Download Error Report"
                          icon={AlertTriangle}
                          onClick={() => onErrorReport(job)}
                        />
                        <IconButton
                          label="Re-run Import"
                          icon={RotateCcw}
                          disabled={!canRerun(job)}
                          onClick={() => onRerun(job)}
                        />
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {!jobs.length ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <div className="text-sm font-medium">No import history yet</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Template downloads, uploads, validations and confirmed imports will appear here.
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "success" | "warning" | "critical";
}) {
  const toneClass = {
    neutral: "text-foreground",
    success: "text-success",
    warning: "text-warning-foreground",
    critical: "text-critical",
  }[tone];
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${toneClass}`}>{value}</div>
    </div>
  );
}

function IconButton({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function summarizeRows(rows: ImportJobRow[]) {
  const errors = rows.filter((row) => row.validationStatus === "Error").length;
  const warnings = rows.filter((row) => row.validationStatus === "Warning").length;
  const valid = rows.length - errors;
  return { total: rows.length, valid, warnings, errors };
}

function roleAccessLabel(role: string) {
  if (role === "admin") return "Full Access";
  if (role === "manager") return "Operational Imports";
  if (role === "shift-lead") return "Shift & Ops Imports";
  return "History Only";
}

function fileSlug(type: ImportType) {
  return type
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function downloadTextFile(content: string, fileName: string) {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
