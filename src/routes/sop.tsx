import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { userById } from "@/lib/data";
import { useAuth } from "@/lib/auth";
import { canCommentOnSops, canManageSops, canUploadSops } from "@/lib/rbac";
import { configurationService, sopService } from "@/lib/services";
import { Search, Download, FileText, Plus, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sop")({
  component: SOPPage,
});

function SOPPage() {
  const { user } = useAuth();
  const [rows] = useState(() => sopService.list());
  const [commentDraft, setCommentDraft] = useState("");
  const sopSettings = configurationService.listSopSettings().filter((setting) => setting.active);
  const canManage = canManageSops(user);
  const canUpload = canUploadSops(user);
  const canComment = canCommentOnSops(user);
  const categories = Array.from(new Set(rows.map((s) => s.category)));
  const types = Array.from(new Set(rows.map((s) => s.type)));
  const [cat, setCat] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const recordDownload = (sopId: string) => {
    if (!user) return;
    sopService.recordDownload(sopId, user.id);
    toast.success(`${sopId} download recorded`);
  };

  const addSuggestionComment = () => {
    if (!user || !canComment) return;
    const trimmed = commentDraft.trim();
    if (!trimmed) {
      toast.error("Suggested modification comment is required.");
      return;
    }

    toast.success("Suggested modification recorded for review.");
    setCommentDraft("");
  };

  const filtered = rows.filter((s) => {
    if (cat && s.category !== cat) return false;
    if (type && s.type !== type) return false;
    if (search && !`${s.title} ${s.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="SOP Library"
        subtitle="Approved procedures, runbooks, troubleshooting guides and operational evidence."
        actions={
          canUpload || canManage ? (
            <button
              disabled={!canUpload && !canManage}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> New Document
            </button>
          ) : null
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-1">Governance Settings</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              SOP behavior is configured by category, approval workflow and visibility rules.
            </p>
            <div className="space-y-2">
              {sopSettings.slice(0, 4).map((setting) => (
                <div key={setting.id} className="rounded-md border border-border bg-background p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{setting.category}</span>
                    <StatusBadge
                      status={setting.approvalWorkflow ? "Requires Review" : "Approved"}
                      tone={setting.approvalWorkflow ? "warning" : "success"}
                    />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Visibility: {setting.visibilityRule || "Not set"}
                  </div>
                </div>
              ))}
              {!sopSettings.length ? (
                <div className="rounded-md border border-dashed border-border bg-muted/20 px-3 py-4 text-center text-sm text-muted-foreground">
                  No SOP settings configured yet.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Categories</h3>
            <div className="space-y-1">
              <FilterBtn
                active={cat === null}
                onClick={() => setCat(null)}
                label="All categories"
                count={rows.length}
              />
              {categories.map((c) => (
                <FilterBtn
                  key={c}
                  active={cat === c}
                  onClick={() => setCat(c)}
                  label={c}
                  count={rows.filter((s) => s.category === c).length}
                />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Document Type</h3>
            <div className="space-y-1">
              <FilterBtn
                active={type === null}
                onClick={() => setType(null)}
                label="All types"
                count={rows.length}
              />
              {types.map((t) => (
                <FilterBtn
                  key={t}
                  active={type === t}
                  onClick={() => setType(t)}
                  label={t}
                  count={rows.filter((s) => s.type === t).length}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-9 space-y-4">
          <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents..."
              className="flex-1 bg-transparent text-sm outline-none"
            />
            <span className="text-xs text-muted-foreground">{filtered.length} results</span>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h3 className="text-sm font-semibold">Suggested modifications</h3>
                <p className="text-xs text-muted-foreground">
                  Engineers can raise a comment proposing changes to an SOP.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <textarea
                value={commentDraft}
                onChange={(e) => setCommentDraft(e.target.value)}
                placeholder={
                  canComment
                    ? "Suggest a revision or update for this SOP library…"
                    : "Your role does not currently allow SOP comments."
                }
                className="min-h-[84px] flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none resize-none disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!canComment}
              />
              <button
                type="button"
                onClick={addSuggestionComment}
                disabled={!canComment}
                className="inline-flex items-center gap-2 self-end rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MessageSquare className="h-4 w-4" /> Submit
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-border bg-card p-4 hover:border-primary transition"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> {s.id} - v{s.version}
                  </div>
                  <StatusBadge status={s.approval} />
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {s.type} - {s.category}
                  </span>
                  <button
                    onClick={() => recordDownload(s.id)}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <Download className="h-3 w-3" /> Download
                  </button>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">
                  Updated {s.lastUpdated} - by {userById(s.createdBy).split(" ")[0]}
                </div>
              </div>
            ))}
            {!filtered.length ? (
              <div className="md:col-span-2 rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
                <div className="text-sm font-medium">No SOP documents match these filters</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Adjust filters or add approved SOP documents when your repository is ready.
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterBtn({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between text-sm rounded-md px-2 py-1.5 ${active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
    >
      <span className="truncate">{label}</span>
      <span className="text-xs">{count}</span>
    </button>
  );
}
