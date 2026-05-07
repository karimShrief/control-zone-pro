import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { sops, userById } from "@/lib/mock-data";
import { Search, Download, FileText, Plus } from "lucide-react";

export const Route = createFileRoute("/sop")({
  component: SOPPage,
});

function SOPPage() {
  const categories = Array.from(new Set(sops.map((s) => s.category)));
  const types = Array.from(new Set(sops.map((s) => s.type)));
  const [cat, setCat] = useState<string | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = sops.filter((s) => {
    if (cat && s.category !== cat) return false;
    if (type && s.type !== type) return false;
    if (search && !`${s.title} ${s.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      <PageHeader
        title="SOP Library"
        subtitle="Standard procedures, runbooks, troubleshooting guides and audit documents"
        actions={<button className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90"><Plus className="h-4 w-4" /> New Document</button>}
      />

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-3 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Categories</h3>
            <div className="space-y-1">
              <FilterBtn active={cat === null} onClick={() => setCat(null)} label="All categories" count={sops.length} />
              {categories.map((c) => (
                <FilterBtn key={c} active={cat === c} onClick={() => setCat(c)} label={c} count={sops.filter((s) => s.category === c).length} />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-sm mb-3">Document Type</h3>
            <div className="space-y-1">
              <FilterBtn active={type === null} onClick={() => setType(null)} label="All types" count={sops.length} />
              {types.map((t) => (
                <FilterBtn key={t} active={type === t} onClick={() => setType(t)} label={t} count={sops.filter((s) => s.type === t).length} />
              ))}
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-9 space-y-4">
          <div className="rounded-lg border border-border bg-card p-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents…" className="flex-1 bg-transparent text-sm outline-none" />
            <span className="text-xs text-muted-foreground">{filtered.length} results</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((s) => (
              <div key={s.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary transition">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> {s.id} · v{s.version}
                  </div>
                  <StatusBadge status={s.approval} />
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {s.tags.map((t) => <span key={t} className="text-[11px] rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">#{t}</span>)}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>{s.type} · {s.category}</span>
                  <button className="inline-flex items-center gap-1 text-primary hover:underline"><Download className="h-3 w-3" /> Download</button>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">Updated {s.lastUpdated} · by {userById(s.createdBy).split(" ")[0]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterBtn({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between text-sm rounded-md px-2 py-1.5 ${active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}>
      <span className="truncate">{label}</span>
      <span className="text-xs">{count}</span>
    </button>
  );
}
