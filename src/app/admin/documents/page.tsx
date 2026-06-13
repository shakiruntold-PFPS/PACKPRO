"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Upload, Search, FolderOpen, FileText, Image, File, Trash2, X, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const DOC_TYPES = [
  "GST_CERT", "AGREEMENT", "CUSTOMER_PO", "VENDOR_BILL",
  "CATALOG", "INVOICE", "DELIVERY_CHALLAN", "OTHER",
];
const EXT_ICON: Record<string, any> = { pdf: FileText, jpg: Image, jpeg: Image, png: Image };

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ name: "", type: "OTHER", tags: "", notes: "" });
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { success, error } = useToast();

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set("search", search);
      if (typeFilter !== "ALL") p.set("type", typeFilter);
      const res = await fetch(`/api/documents?${p}`);
      const json = await res.json();
      setDocs(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { error("Please select a file"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const upRes = await fetch("/api/upload", { method: "POST", body: fd });
      const upJson = await upRes.json();
      if (!upRes.ok) throw new Error(upJson.error ?? "Upload failed");

      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || file.name,
          type: form.type,
          url: upJson.data.url,
          size: file.size,
          mimeType: file.type,
          tags: form.tags ? form.tags.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean) : [],
          notes: form.notes,
        }),
      });

      success("Document uploaded", form.name || file.name);
      setShowUpload(false);
      setFile(null);
      setForm({ name: "", type: "OTHER", tags: "", notes: "" });
      fetchDocs();
    } catch (err_: any) {
      error("Upload failed", err_.message);
    } finally {
      setUploading(false);
    }
  }

  async function deleteDoc(id: string) {
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    setDocs(d => d.filter(doc => doc.id !== id));
    success("Document deleted");
  }

  function bytesLabel(n?: number | null) {
    if (!n) return "—";
    if (n > 1e6) return `${(n / 1e6).toFixed(1)} MB`;
    return `${(n / 1024).toFixed(0)} KB`;
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Documents</h1>
          <p className="module-subtitle">{docs.length} documents · Certificates, Agreements, Bills, POs</p>
        </div>
        <button className="btn-primary" onClick={() => setShowUpload(true)}>
          <Upload size={13} /> Upload Document
        </button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color: "var(--text-muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents, tags…" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="erp-input" style={{ width: "auto" }}>
          <option value="ALL">All Types</option>
          {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="glass rounded-2xl overflow-auto">
        <table className="erp-table">
          <thead>
            <tr>{["Document", "Type", "Party", "Size", "Tags", "Uploaded By", "Date", "Actions"].map(h => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Loading…</td></tr>}
            {!loading && docs.length === 0 && (
              <tr><td colSpan={8}>
                <div className="empty-state">
                  <FolderOpen size={40} />
                  <div className="text-sm mt-2 font-semibold">No documents found</div>
                  <div className="text-xs mt-1">Upload certificates, agreements, and bills</div>
                </div>
              </td></tr>
            )}
            {docs.map(doc => {
              const ext = doc.url?.split(".").pop() ?? "pdf";
              const Icon = EXT_ICON[ext] ?? File;
              return (
                <tr key={doc.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(14,165,160,0.12)" }}>
                        <Icon size={14} style={{ color: "var(--brand)" }} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{doc.name}</div>
                        <div className="text-xs font-mono mt-0.5 uppercase" style={{ color: "var(--text-muted)" }}>.{ext}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-teal text-xs">{doc.type?.replace(/_/g, " ")}</span></td>
                  <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{doc.party?.name ?? "—"}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{bytesLabel(doc.size)}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {(doc.tags ?? []).map((t: string) => (
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(139,165,200,0.1)", color: "var(--text-muted)" }}>{t}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{doc.uploadedBy ?? "—"}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{formatDate(doc.createdAt)}</td>
                  <td>
                    <div className="flex gap-1">
                      <a href={doc.url} target="_blank" rel="noreferrer" className="btn-ghost p-1.5" title="View">
                        <ExternalLink size={12} />
                      </a>
                      <button className="btn-ghost p-1.5" title="Delete" onClick={() => deleteDoc(doc.id)}
                        style={{ color: "#ef4444" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowUpload(false); }}>
          <div className="w-full max-w-md rounded-2xl animate-in"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Upload Document</h2>
              <button onClick={() => setShowUpload(false)} className="btn-ghost p-1.5"><X size={15} /></button>
            </div>
            <form onSubmit={handleUpload} className="p-5 space-y-4">
              <div>
                <label className="erp-label">File *</label>
                <div
                  className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
                  style={{ borderColor: file ? "var(--brand)" : "var(--border)", background: "var(--bg-input)" }}
                  onClick={() => fileRef.current?.click()}>
                  <input ref={fileRef} type="file" className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.docx"
                    onChange={e => setFile(e.target.files?.[0] ?? null)} />
                  {file ? (
                    <div className="text-sm font-semibold" style={{ color: "var(--brand)" }}>{file.name}</div>
                  ) : (
                    <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                      Click to select file (PDF, images, Excel, Word — max 10MB)
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="erp-label">Document Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="erp-input" placeholder="Leave blank to use filename" />
              </div>
              <div>
                <label className="erp-label">Type *</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                  className="erp-input">
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">Tags (comma-separated)</label>
                <input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="erp-input" placeholder="legal, gst, vendor" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowUpload(false)} className="btn-ghost flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={uploading || !file} className="btn-primary flex-1 justify-center">
                  {uploading
                    ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Uploading…</>
                    : <><Upload size={13} /> Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
