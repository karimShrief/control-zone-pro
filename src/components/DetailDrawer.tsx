import { useEffect, useRef, useState } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { userById } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import {
  Send, Paperclip, FileText, Upload, Trash2, Download, FileWarning,
  CheckCircle2, ArrowUpRight, UserPlus, Activity,
} from "lucide-react";

export type DetailKind = "task" | "incident";

export interface DetailItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  severity?: string;
  sla?: string;
  assignee?: string | null;
  category?: string;
  subcategory?: string;
  dueDate?: string;
  createdAt?: string;
  source?: string;
  sourceRef?: string;
  type?: string;
  audit?: string;
  resolution?: string;
}

interface CommentItem { id: string; author: string; at: string; text: string; }
interface EvidenceItem { id: string; name: string; size: string; by: string; at: string; kind: "image" | "log" | "doc"; }
interface ReportItem { id: string; name: string; size: string; by: string; at: string; type: "Incident Report" | "Activity Report" | "RCA"; }
interface ActivityItem { id: string; at: string; by: string; text: string; }

const seedComments: Record<string, CommentItem[]> = {};
const seedEvidence: Record<string, EvidenceItem[]> = {};
const seedReports: Record<string, ReportItem[]> = {};
const seedActivity: Record<string, ActivityItem[]> = {};

function ensure<T>(map: Record<string, T[]>, id: string, initial: () => T[]) {
  if (!map[id]) map[id] = initial();
  return map[id];
}

export function DetailDrawer({
  open, onOpenChange, kind, item,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  kind: DetailKind;
  item: DetailItem | null;
}) {
  const { user } = useAuth();
  const [, force] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const reportInput = useRef<HTMLInputElement>(null);
  const [comment, setComment] = useState("");
  const [statusDraft, setStatusDraft] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [reportType, setReportType] = useState<ReportItem["type"]>("Incident Report");

  useEffect(() => {
    if (item) {
      setStatusDraft(item.status);
      setUpdateNote("");
      setComment("");
    }
  }, [item?.id]);

  if (!item) return null;

  const comments = ensure(seedComments, item.id, () => [
    { id: "c1", author: "Mohammed Al Suwaidi", at: "2 hours ago", text: "Please prioritise this and update by EOD." },
    { id: "c2", author: "Ahmed Al Marzouqi", at: "1 hour ago", text: "Investigating. Will share findings shortly." },
  ]);
  const evidence = ensure(seedEvidence, item.id, () => [
    { id: "e1", name: "before.png", size: "412 KB", by: "Ahmed", at: "Today 09:14", kind: "image" as const },
    { id: "e2", name: "switch-cpu.log", size: "28 KB", by: "Khalid", at: "Today 08:02", kind: "log" as const },
  ]);
  const reports = ensure(seedReports, item.id, () => kind === "incident" ? [
    { id: "r1", name: `${item.id}-incident-report-v1.pdf`, size: "186 KB", by: "Khalid Al Hammadi", at: "Today 10:30", type: "Incident Report" as const },
  ] : []);
  const activity = ensure(seedActivity, item.id, () => [
    { id: "a1", at: "Today 06:12", by: "System", text: `${kind === "incident" ? "Incident" : "Task"} created from ${item.source ?? "manual entry"}.` },
    { id: "a2", at: "Today 06:30", by: userById(item.assignee ?? null) || "Unassigned", text: "Assignment updated." },
  ]);

  const me = user?.name ?? "Engineer";

  const addComment = () => {
    if (!comment.trim()) return;
    comments.unshift({ id: `c${Date.now()}`, author: me, at: "just now", text: comment.trim() });
    activity.unshift({ id: `a${Date.now()}`, at: "just now", by: me, text: "Added a comment." });
    setComment("");
    force((n) => n + 1);
    toast.success("Comment added");
  };

  const onUpload = (target: "evidence" | "report") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    Array.from(files).forEach((f) => {
      if (target === "evidence") {
        const kind: EvidenceItem["kind"] = f.type.startsWith("image") ? "image" : f.name.endsWith(".log") ? "log" : "doc";
        evidence.unshift({ id: `e${Date.now()}-${f.name}`, name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB`, by: me, at: "just now", kind });
      } else {
        reports.unshift({ id: `r${Date.now()}-${f.name}`, name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB`, by: me, at: "just now", type: reportType });
      }
      activity.unshift({ id: `a${Date.now()}-${f.name}`, at: "just now", by: me, text: `Attached ${target === "report" ? reportType : "evidence"}: ${f.name}` });
    });
    e.target.value = "";
    force((n) => n + 1);
    toast.success(`${files.length} file${files.length > 1 ? "s" : ""} attached`);
  };

  const removeEvidence = (id: string) => {
    const idx = evidence.findIndex((e) => e.id === id);
    if (idx >= 0) { evidence.splice(idx, 1); force((n) => n + 1); toast("Removed"); }
  };
  const removeReport = (id: string) => {
    const idx = reports.findIndex((e) => e.id === id);
    if (idx >= 0) { reports.splice(idx, 1); force((n) => n + 1); toast("Removed"); }
  };

  const saveUpdate = () => {
    if (statusDraft !== item.status) {
      activity.unshift({ id: `a${Date.now()}`, at: "just now", by: me, text: `Status changed from ${item.status} to ${statusDraft}.` });
      item.status = statusDraft;
    }
    if (updateNote.trim()) {
      comments.unshift({ id: `c${Date.now()}`, author: me, at: "just now", text: `[Update] ${updateNote.trim()}` });
      activity.unshift({ id: `a${Date.now()}-u`, at: "just now", by: me, text: "Posted a status update." });
    }
    setUpdateNote("");
    force((n) => n + 1);
    toast.success("Update posted");
  };

  const taskStatuses = ["New", "In Progress", "Pending Team", "Waiting Vendor", "Waiting Approval", "Escalated", "Blocked", "Completed"];
  const incidentStatuses = ["Unassigned", "Assigned", "Accepted", "In Progress", "Resolved", "Closed"];
  const statusOptions = kind === "task" ? taskStatuses : incidentStatuses;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        <div className="border-b border-border px-6 py-5 bg-muted/30">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-1">
            <span>{item.id}</span>
            {item.source && <><span>·</span><span>{item.source}</span></>}
            {item.sourceRef && <span className="text-foreground/60">/ {item.sourceRef}</span>}
          </div>
          <SheetHeader className="space-y-2 text-left">
            <SheetTitle className="text-lg leading-tight pr-6">{item.title}</SheetTitle>
            <SheetDescription className="sr-only">{kind} detail</SheetDescription>
            <div className="flex flex-wrap items-center gap-2">
              {item.severity && <StatusBadge status={item.severity} />}
              <StatusBadge status={item.status} />
              {item.priority && <StatusBadge status={item.priority} />}
              {item.sla && <StatusBadge status={item.sla} />}
              {item.audit && <StatusBadge status={item.audit} />}
            </div>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs">
            <Field label="Assignee" value={userById(item.assignee ?? null) || "—"} />
            <Field label={kind === "incident" ? "Created" : "Due"} value={(kind === "incident" ? item.createdAt : item.dueDate) ?? "—"} />
            <Field label="Category" value={item.category ?? "—"} />
            <Field label={kind === "incident" ? "Subcategory" : "Type"} value={(kind === "incident" ? item.subcategory : item.type) ?? "—"} />
          </div>
          <div className="flex items-center gap-2 mt-4">
            {!item.assignee && (
              <QuickBtn icon={UserPlus} label="Assign to me" onClick={() => { item.assignee = user?.id ?? null; activity.unshift({ id: `a${Date.now()}`, at: "just now", by: me, text: `Self-assigned ${item.id}.` }); force((n) => n + 1); toast.success("Assigned to you"); }} />
            )}
            <QuickBtn icon={CheckCircle2} label="Accept" onClick={() => { setStatusDraft("In Progress"); toast("Marked In Progress (save to apply)"); }} />
            <QuickBtn icon={ArrowUpRight} label="Escalate" onClick={() => { setStatusDraft("Escalated"); toast("Marked Escalated (save to apply)"); }} />
          </div>
        </div>

        <Tabs defaultValue="update" className="px-6 pb-6 pt-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="update">Update</TabsTrigger>
            <TabsTrigger value="comments">Comments <span className="ml-1.5 text-[10px] text-muted-foreground">{comments.length}</span></TabsTrigger>
            <TabsTrigger value="evidence">Evidence <span className="ml-1.5 text-[10px] text-muted-foreground">{evidence.length}</span></TabsTrigger>
            {kind === "incident" && (
              <TabsTrigger value="reports">Reports <span className="ml-1.5 text-[10px] text-muted-foreground">{reports.length}</span></TabsTrigger>
            )}
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="update" className="space-y-4 mt-4">
            {item.description && (
              <div className="text-sm text-muted-foreground rounded-md border border-border bg-muted/20 p-3">{item.description}</div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Status</label>
                <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} className="mt-1.5 w-full rounded-md border border-input bg-card px-2 py-2 text-sm">
                  {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Notify</label>
                <select className="mt-1.5 w-full rounded-md border border-input bg-card px-2 py-2 text-sm">
                  <option>Manager only</option>
                  <option>Whole team</option>
                  <option>Sponsor + Manager</option>
                  <option>None</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Update note</label>
              <textarea value={updateNote} onChange={(e) => setUpdateNote(e.target.value)} rows={4} placeholder={kind === "incident" ? "Describe current state, mitigations, ETA…" : "Progress notes, blockers, next steps…"} className="mt-1.5 w-full rounded-md border border-input bg-card px-3 py-2 text-sm resize-none" />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => onOpenChange(false)} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">Cancel</button>
              <button onClick={saveUpdate} className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90">Post update</button>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="space-y-3 mt-4">
            <div className="flex items-start gap-2">
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="Add a comment…" className="flex-1 rounded-md border border-input bg-card px-3 py-2 text-sm resize-none" />
              <button onClick={addComment} className="rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90 inline-flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Send</button>
            </div>
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className="rounded-md border border-border bg-card p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span className="font-medium text-foreground">{c.author}</span>
                    <span>{c.at}</span>
                  </div>
                  <div className="text-sm">{c.text}</div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-3 mt-4">
            <input ref={fileInput} type="file" multiple className="hidden" onChange={onUpload("evidence")} />
            <button onClick={() => fileInput.current?.click()} className="w-full rounded-md border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/40 transition-colors p-6 text-center">
              <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
              <div className="text-sm font-medium">Drop files or click to upload</div>
              <div className="text-xs text-muted-foreground mt-0.5">Photos, logs, screenshots, docs · max 25 MB each</div>
            </button>
            <div className="space-y-1.5">
              {evidence.map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{f.name}</div>
                    <div className="text-xs text-muted-foreground">{f.size} · {f.by} · {f.at}</div>
                  </div>
                  <IconBtn icon={Download} title="Download" onClick={() => toast("Mock download")} />
                  <IconBtn icon={Trash2} title="Remove" onClick={() => removeEvidence(f.id)} />
                </div>
              ))}
              {evidence.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">No evidence attached.</div>}
            </div>
          </TabsContent>

          {kind === "incident" && (
            <TabsContent value="reports" className="space-y-3 mt-4">
              <div className="rounded-md border border-border bg-card p-4">
                <div className="flex items-start gap-2 mb-3">
                  <FileWarning className="h-4 w-4 text-info mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    Attach an <span className="font-medium text-foreground">Incident Report</span>, <span className="font-medium text-foreground">Activity Report</span>, or <span className="font-medium text-foreground">RCA</span> document. Reports are tracked separately from raw evidence and visible in the incident audit trail.
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">Document type</label>
                    <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportItem["type"])} className="mt-1.5 w-full rounded-md border border-input bg-card px-2 py-2 text-sm">
                      <option>Incident Report</option>
                      <option>Activity Report</option>
                      <option>RCA</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <input ref={reportInput} type="file" className="hidden" onChange={onUpload("report")} />
                    <button onClick={() => reportInput.current?.click()} className="w-full rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90 inline-flex items-center justify-center gap-1.5">
                      <Upload className="h-3.5 w-3.5" /> Attach Report
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                {reports.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-md border border-border bg-card px-3 py-2">
                    <div className="h-9 w-9 rounded-md bg-info/15 text-info flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.type} · {r.size} · {r.by} · {r.at}</div>
                    </div>
                    <IconBtn icon={Download} title="Download" onClick={() => toast("Mock download")} />
                    <IconBtn icon={Trash2} title="Remove" onClick={() => removeReport(r.id)} />
                  </div>
                ))}
                {reports.length === 0 && <div className="text-sm text-muted-foreground text-center py-6">No reports attached yet.</div>}
              </div>
            </TabsContent>
          )}

          <TabsContent value="activity" className="mt-4">
            <ol className="relative border-l border-border ml-2 space-y-4">
              {activity.map((a) => (
                <li key={a.id} className="ml-4">
                  <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <Activity className="h-3 w-3" /> {a.at} · {a.by}
                  </div>
                  <div className="text-sm">{a.text}</div>
                </li>
              ))}
            </ol>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="uppercase tracking-wider text-muted-foreground text-[10px]">{label}</div>
      <div className="text-foreground mt-0.5">{value}</div>
    </div>
  );
}

function QuickBtn({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-muted">
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function IconBtn({ icon: Icon, title, onClick }: { icon: React.ComponentType<{ className?: string }>; title: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick} className="rounded-md p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground">
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}
