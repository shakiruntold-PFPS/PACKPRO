"use client";
import { useState, useEffect, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  status: string;
  views: number;
  category?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  author?: { name: string } | null;
}

interface Career {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  status: string;
  salary?: string | null;
  _count?: { applications: number };
  createdAt: string;
}

interface Application {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  career: { id: string; title: string; department: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PUBLISHED: { bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
  DRAFT:     { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  OPEN:      { bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
  CLOSED:    { bg: "rgba(239,68,68,0.12)", color: "#ef4444" },
  NEW:       { bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
  REVIEWED:  { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  SHORTLISTED: { bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
  REJECTED:  { bg: "rgba(239,68,68,0.12)", color: "#ef4444" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_COLORS[status] || { bg: "rgba(255,255,255,0.06)", color: "#93a5c4" };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 12, letterSpacing: 0.5 }}>
      {status}
    </span>
  );
}

// ─── Blog Modal ───────────────────────────────────────────────────────────────

const BLANK_POST = { title: "", slug: "", excerpt: "", category: "", tags: "", status: "DRAFT", content: "", seoTitle: "", seoDesc: "", coverImage: "" };

function BlogModal({ post, onClose, onSave }: {
  post: BlogPost | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState(BLANK_POST);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (post) {
      setForm({
        title: post.title,
        slug: post.slug,
        excerpt: "",
        category: post.category || "",
        tags: "",
        status: post.status,
        content: "",
        seoTitle: "",
        seoDesc: "",
        coverImage: "",
      });
    } else {
      setForm(BLANK_POST);
    }
  }, [post]);

  function set(key: string, val: string) {
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === "title" && !post) next.slug = slugify(val);
      return next;
    });
  }

  async function handleSave() {
    if (!form.title || !form.content) { setError("Title and content are required"); return; }
    setSaving(true);
    setError("");
    try {
      const url = post ? `/api/blog/${post.slug}` : "/api/blog";
      const method = post ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      onSave();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#0e1e38", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 680, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#e8eef8", marginBottom: 24 }}>{post ? "Edit Post" : "New Blog Post"}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { key: "title", label: "Title *", type: "text", full: true },
            { key: "slug", label: "Slug", type: "text" },
            { key: "category", label: "Category", type: "text" },
            { key: "tags", label: "Tags (comma-separated)", type: "text", full: true },
            { key: "coverImage", label: "Cover Image URL", type: "url", full: true },
            { key: "seoTitle", label: "SEO Title", type: "text", full: true },
            { key: "seoDesc", label: "SEO Description", type: "text", full: true },
          ].map(({ key, label, type, full }) => (
            <div key={key} style={{ gridColumn: full ? "1 / -1" : "auto" }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5d7399", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
              <input type={type} value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#e8eef8", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5d7399", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#e8eef8", fontSize: 13, outline: "none" }}>
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5d7399", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Content *</label>
            <textarea value={form.content} onChange={e => set("content", e.target.value)} rows={10}
              placeholder="Write your blog post content here. HTML is supported."
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#e8eef8", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "monospace" }} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5d7399", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Excerpt</label>
            <textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)} rows={2}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#e8eef8", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
        </div>

        {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", color: "#93a5c4", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", color: "#fff", fontWeight: 700, border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Career Modal ─────────────────────────────────────────────────────────────

const BLANK_CAREER = { title: "", department: "", location: "Alwar, Rajasthan", type: "FULL_TIME", description: "", requirements: "", salary: "", status: "OPEN" };

function CareerModal({ career, onClose, onSave }: {
  career: Career | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState(BLANK_CAREER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (career) {
      setForm({ title: career.title, department: career.department, location: career.location, type: career.type, description: "", requirements: "", salary: career.salary || "", status: career.status });
    } else {
      setForm(BLANK_CAREER);
    }
  }, [career]);

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  async function handleSave() {
    if (!form.title || !form.department || !form.description) { setError("Title, department and description are required"); return; }
    setSaving(true);
    setError("");
    try {
      const url = career ? `/api/careers/${career.id}` : "/api/careers";
      const method = career ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      onSave();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div style={{ background: "#0e1e38", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 32, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#e8eef8", marginBottom: 24 }}>{career ? "Edit Career" : "New Job Opening"}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {[
            { key: "title", label: "Job Title *", type: "text", full: true },
            { key: "department", label: "Department *", type: "text" },
            { key: "location", label: "Location", type: "text" },
            { key: "salary", label: "Salary Range", type: "text", full: true },
          ].map(({ key, label, type, full }) => (
            <div key={key} style={{ gridColumn: full ? "1 / -1" : "auto" }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5d7399", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
              <input type={type} value={form[key as keyof typeof form]} onChange={e => set(key, e.target.value)}
                style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#e8eef8", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5d7399", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Type</label>
            <select value={form.type} onChange={e => set("type", e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#e8eef8", fontSize: 13, outline: "none" }}>
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="INTERNSHIP">Internship</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5d7399", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</label>
            <select value={form.status} onChange={e => set("status", e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#e8eef8", fontSize: 13, outline: "none" }}>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5d7399", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Description *</label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={5}
              placeholder="Describe the role and responsibilities..."
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#e8eef8", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5d7399", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Requirements</label>
            <textarea value={form.requirements} onChange={e => set("requirements", e.target.value)} rows={4}
              placeholder="List qualifications and requirements..."
              style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#e8eef8", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
        </div>

        {error && <div style={{ color: "#f87171", fontSize: 13, marginTop: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.06)", color: "#93a5c4", border: "none", padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            style={{ background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", color: "#fff", fontWeight: 700, border: "none", padding: "10px 24px", borderRadius: 8, fontSize: 13, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : "Save Position"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main CMS Page ───────────────────────────────────────────────────────────

export default function CMSPage() {
  const [tab, setTab] = useState<"blog" | "careers" | "applications">("blog");

  // Blog state
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [blogModal, setBlogModal] = useState<BlogPost | null | "new">(null);

  // Careers state
  const [careers, setCareers] = useState<Career[]>([]);
  const [careersLoading, setCareersLoading] = useState(true);
  const [careerModal, setCareerModal] = useState<Career | null | "new">(null);

  // Applications state
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  const loadPosts = useCallback(() => {
    setPostsLoading(true);
    fetch("/api/blog?admin=true")
      .then(r => r.json())
      .then(j => setPosts(j.data ?? []))
      .catch(() => {})
      .finally(() => setPostsLoading(false));
  }, []);

  const loadCareers = useCallback(() => {
    setCareersLoading(true);
    fetch("/api/careers?admin=true")
      .then(r => r.json())
      .then(j => setCareers(j.data ?? []))
      .catch(() => {})
      .finally(() => setCareersLoading(false));
  }, []);

  const loadApplications = useCallback(() => {
    setAppsLoading(true);
    fetch("/api/applications")
      .then(r => r.json())
      .then(j => setApplications(j.data ?? []))
      .catch(() => {})
      .finally(() => setAppsLoading(false));
  }, []);

  useEffect(() => { loadPosts(); loadCareers(); }, [loadPosts, loadCareers]);
  useEffect(() => { if (tab === "applications") loadApplications(); }, [tab, loadApplications]);

  async function deletePost(slug: string) {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/blog/${slug}`, { method: "DELETE" });
    loadPosts();
  }

  async function deleteCareer(id: string) {
    if (!confirm("Delete this career posting?")) return;
    await fetch(`/api/careers/${id}`, { method: "DELETE" });
    loadCareers();
  }

  async function updateAppStatus(id: string, status: string) {
    await fetch(`/api/applications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadApplications();
  }

  const tabs = [
    { key: "blog", label: "Blog Posts", count: posts.length },
    { key: "careers", label: "Careers", count: careers.length },
    { key: "applications", label: "Applications", count: applications.length },
  ] as const;

  const btnStyle = { background: "linear-gradient(135deg,#0ea5a0,#1b4f8a)", color: "#fff", fontWeight: 700, border: "none", padding: "9px 18px", borderRadius: 8, fontSize: 13, cursor: "pointer" };
  const thStyle: React.CSSProperties = { padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#5d7399", textAlign: "left" as const, textTransform: "uppercase" as const, letterSpacing: 0.5, borderBottom: "1px solid rgba(255,255,255,0.06)" };
  const tdStyle = { padding: "12px 14px", fontSize: 13, color: "#93a5c4", borderBottom: "1px solid rgba(255,255,255,0.04)", verticalAlign: "middle" as const };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#e8eef8", marginBottom: 4 }}>CMS & Blog</h1>
        <p style={{ fontSize: 14, color: "#5d7399" }}>Manage blog posts, career openings, and job applications.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ background: "none", border: "none", padding: "10px 20px", fontSize: 13, fontWeight: tab === t.key ? 700 : 500, color: tab === t.key ? "#14c7c0" : "#5d7399", cursor: "pointer", borderBottom: tab === t.key ? "2px solid #14c7c0" : "2px solid transparent", marginBottom: -1 }}>
            {t.label}
            {t.count > 0 && (
              <span style={{ marginLeft: 6, background: "rgba(14,165,160,0.15)", color: "#14c7c0", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* BLOG TAB */}
      {tab === "blog" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: "#5d7399" }}>{posts.length} posts total</div>
            <button style={btnStyle} onClick={() => setBlogModal("new")}>+ New Post</button>
          </div>

          {postsLoading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#5d7399" }}>Loading...</div>
          ) : (
            <div style={{ background: "rgba(15,30,56,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Views</th>
                    <th style={thStyle}>Author</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.length === 0 && (
                    <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center", padding: 40 }}>No posts yet. Create your first post.</td></tr>
                  )}
                  {posts.map(post => (
                    <tr key={post.id} style={{ cursor: "default" }}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: "#e8eef8", marginBottom: 2 }}>{post.title}</div>
                        <div style={{ fontSize: 11, color: "#3d5070" }}>{post.slug}</div>
                      </td>
                      <td style={tdStyle}><StatusBadge status={post.status} /></td>
                      <td style={tdStyle}>{post.views.toLocaleString()}</td>
                      <td style={tdStyle}>{post.author?.name || "—"}</td>
                      <td style={tdStyle}>{formatDate(post.publishedAt || post.createdAt)}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setBlogModal(post)}
                            style={{ background: "rgba(14,165,160,0.15)", color: "#14c7c0", border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                            Edit
                          </button>
                          <button onClick={() => deletePost(post.slug)}
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CAREERS TAB */}
      {tab === "careers" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: "#5d7399" }}>{careers.length} positions total</div>
            <button style={btnStyle} onClick={() => setCareerModal("new")}>+ New Job</button>
          </div>

          {careersLoading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#5d7399" }}>Loading...</div>
          ) : (
            <div style={{ background: "rgba(15,30,56,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Title</th>
                    <th style={thStyle}>Department</th>
                    <th style={thStyle}>Type</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Applicants</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {careers.length === 0 && (
                    <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center", padding: 40 }}>No positions yet.</td></tr>
                  )}
                  {careers.map(career => (
                    <tr key={career.id}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: "#e8eef8", marginBottom: 2 }}>{career.title}</div>
                        <div style={{ fontSize: 11, color: "#3d5070" }}>📍 {career.location}</div>
                      </td>
                      <td style={tdStyle}>{career.department}</td>
                      <td style={tdStyle}>{career.type.replace("_", " ")}</td>
                      <td style={tdStyle}><StatusBadge status={career.status} /></td>
                      <td style={tdStyle}>{career._count?.applications ?? 0}</td>
                      <td style={tdStyle}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button onClick={() => setCareerModal(career)}
                            style={{ background: "rgba(14,165,160,0.15)", color: "#14c7c0", border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                            Edit
                          </button>
                          <button onClick={() => deleteCareer(career.id)}
                            style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "none", padding: "5px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {tab === "applications" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: "#5d7399" }}>{applications.length} applications total</div>
            <button onClick={loadApplications} style={{ background: "rgba(255,255,255,0.06)", color: "#93a5c4", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer" }}>
              Refresh
            </button>
          </div>

          {appsLoading ? (
            <div style={{ textAlign: "center", padding: 60, color: "#5d7399" }}>Loading...</div>
          ) : (
            <div style={{ background: "rgba(15,30,56,0.7)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Applicant</th>
                    <th style={thStyle}>Position</th>
                    <th style={thStyle}>Contact</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 && (
                    <tr><td colSpan={6} style={{ ...tdStyle, textAlign: "center", padding: 40 }}>No applications yet.</td></tr>
                  )}
                  {applications.map(app => (
                    <tr key={app.id}>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: "#e8eef8" }}>{app.name}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ color: "#e8eef8" }}>{app.career.title}</div>
                        <div style={{ fontSize: 11, color: "#3d5070" }}>{app.career.department}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontSize: 12 }}>{app.email}</div>
                        <div style={{ fontSize: 12 }}>{app.phone}</div>
                      </td>
                      <td style={tdStyle}><StatusBadge status={app.status} /></td>
                      <td style={tdStyle}>{formatDate(app.createdAt)}</td>
                      <td style={tdStyle}>
                        <select value={app.status}
                          onChange={e => updateAppStatus(app.id, e.target.value)}
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "5px 8px", color: "#e8eef8", fontSize: 12, outline: "none", cursor: "pointer" }}>
                          <option value="NEW">New</option>
                          <option value="REVIEWED">Reviewed</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Blog Modal */}
      {blogModal !== null && (
        <BlogModal
          post={blogModal === "new" ? null : blogModal}
          onClose={() => setBlogModal(null)}
          onSave={loadPosts}
        />
      )}

      {/* Career Modal */}
      {careerModal !== null && (
        <CareerModal
          career={careerModal === "new" ? null : careerModal}
          onClose={() => setCareerModal(null)}
          onSave={loadCareers}
        />
      )}
    </div>
  );
}
