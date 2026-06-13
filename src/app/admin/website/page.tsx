"use client";
import { useState, useEffect } from "react";
import { Save, ExternalLink, Globe, Phone, Mail, MapPin, Building2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const BLANK = {
  name: "", tagline: "", address: "", city: "", state: "", pincode: "",
  phone: "", email: "", website: "", gstin: "", pan: "",
  bankName: "", bankAccount: "", bankIfsc: "", bankBranch: "",
  invoicePrefix: "", financialYear: "", gstRate: "18",
};

export default function WebsitePage() {
  const { success, error } = useToast();
  const [form, setForm] = useState<Record<string, string>>(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"company"|"bank"|"catalog">("company");

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(j => {
        if (j.data) {
          const d = j.data;
          setForm({
            name: d.name ?? "", tagline: d.tagline ?? "", address: d.address ?? "",
            city: d.city ?? "", state: d.state ?? "", pincode: d.pincode ?? "",
            phone: d.phone ?? "", email: d.email ?? "", website: d.website ?? "",
            gstin: d.gstin ?? "", pan: d.pan ?? "",
            bankName: d.bankName ?? "", bankAccount: d.bankAccount ?? "",
            bankIfsc: d.bankIfsc ?? "", bankBranch: d.bankBranch ?? "",
            invoicePrefix: d.invoicePrefix ?? "PPQ",
            financialYear: d.financialYear ?? "2025-26",
            gstRate: String(d.gstRate ?? 18),
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, gstRate: parseFloat(form.gstRate) || 18 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      success("Settings saved", "Company information updated");
    } catch (err_: any) {
      error("Failed to save", err_.message);
    } finally {
      setSaving(false);
    }
  }

  function fld(k: string, v: string) { setForm(f => ({ ...f, [k]: v })); }

  if (loading) return (
    <div className="module-page">
      <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>Loading…</div>
    </div>
  );

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Website & Company Settings</h1>
          <p className="module-subtitle">Manage your public website content, company info, and catalog settings</p>
        </div>
        <div className="flex gap-2">
          <a href="/" target="_blank" rel="noreferrer" className="btn-ghost">
            <ExternalLink size={13} /> View Website
          </a>
          <a href="/catalog" target="_blank" rel="noreferrer" className="btn-ghost">
            <Globe size={13} /> View Catalog
          </a>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { href: "/", label: "Public Homepage", desc: "Your company landing page", icon: Globe },
          { href: "/catalog", label: "Product Catalog", desc: "Customer-facing product list", icon: Building2 },
          { href: "/admin/catalog", label: "Catalog Manager", desc: "Control catalog visibility", icon: Building2 },
        ].map(({ href, label, desc, icon: Icon }) => (
          <a key={href} href={href} target="_blank" rel="noreferrer"
            className="rounded-xl p-4 flex items-start gap-3 transition-colors hover:bg-white/5"
            style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", textDecoration: "none" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(14,165,160,0.12)" }}>
              <Icon size={14} style={{ color: "var(--brand)" }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{label}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</div>
            </div>
            <ExternalLink size={11} style={{ color: "var(--text-muted)", marginLeft: "auto", marginTop: 2 }} />
          </a>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: "var(--bg-input)", width: "fit-content" }}>
        {(["company", "bank", "catalog"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={tab === t ? "btn-primary" : "btn-ghost"}
            style={{ padding: "7px 18px", fontSize: 12, textTransform: "capitalize" }}>
            {t === "company" ? "Company Info" : t === "bank" ? "Bank & Finance" : "Catalog / Billing"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        {tab === "company" && (
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="erp-label">Company Name *</label>
                <input value={form.name} onChange={e => fld("name", e.target.value)} className="erp-input" placeholder="PACKPRO Food Packaging Solutions" required />
              </div>
              <div className="sm:col-span-2">
                <label className="erp-label">Tagline / Slogan</label>
                <input value={form.tagline} onChange={e => fld("tagline", e.target.value)} className="erp-input" placeholder="Premium Packaging for Food & Hospitality" />
              </div>
              <div className="sm:col-span-2">
                <label className="erp-label">Full Address</label>
                <input value={form.address} onChange={e => fld("address", e.target.value)} className="erp-input" placeholder="Street, Area, Landmark" />
              </div>
              <div>
                <label className="erp-label">City</label>
                <input value={form.city} onChange={e => fld("city", e.target.value)} className="erp-input" placeholder="Alwar" />
              </div>
              <div>
                <label className="erp-label">State</label>
                <input value={form.state} onChange={e => fld("state", e.target.value)} className="erp-input" placeholder="Rajasthan" />
              </div>
              <div>
                <label className="erp-label">Pincode</label>
                <input value={form.pincode} onChange={e => fld("pincode", e.target.value)} className="erp-input" placeholder="301001" />
              </div>
              <div>
                <label className="erp-label">Phone</label>
                <input value={form.phone} onChange={e => fld("phone", e.target.value)} className="erp-input" placeholder="+91 9057627625" />
              </div>
              <div>
                <label className="erp-label">Email</label>
                <input type="email" value={form.email} onChange={e => fld("email", e.target.value)} className="erp-input" placeholder="sales@packpro.site" />
              </div>
              <div>
                <label className="erp-label">Website</label>
                <input value={form.website} onChange={e => fld("website", e.target.value)} className="erp-input" placeholder="www.packpro.site" />
              </div>
              <div>
                <label className="erp-label">GSTIN</label>
                <input value={form.gstin} onChange={e => fld("gstin", e.target.value)} className="erp-input" placeholder="08XXXXX1234X1ZX" />
              </div>
              <div>
                <label className="erp-label">PAN</label>
                <input value={form.pan} onChange={e => fld("pan", e.target.value)} className="erp-input" placeholder="AAACX1234X" />
              </div>
            </div>
          </div>
        )}

        {tab === "bank" && (
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="erp-label">Bank Name</label>
                <input value={form.bankName} onChange={e => fld("bankName", e.target.value)} className="erp-input" placeholder="State Bank of India" />
              </div>
              <div>
                <label className="erp-label">Account Number</label>
                <input value={form.bankAccount} onChange={e => fld("bankAccount", e.target.value)} className="erp-input" placeholder="1234567890" />
              </div>
              <div>
                <label className="erp-label">IFSC Code</label>
                <input value={form.bankIfsc} onChange={e => fld("bankIfsc", e.target.value)} className="erp-input" placeholder="SBIN0001234" />
              </div>
              <div>
                <label className="erp-label">Branch</label>
                <input value={form.bankBranch} onChange={e => fld("bankBranch", e.target.value)} className="erp-input" placeholder="Alwar Main Branch" />
              </div>
            </div>
          </div>
        )}

        {tab === "catalog" && (
          <div className="glass rounded-2xl p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="erp-label">Invoice / Quote Prefix</label>
                <input value={form.invoicePrefix} onChange={e => fld("invoicePrefix", e.target.value)} className="erp-input" placeholder="PPQ" />
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Used as prefix for all invoice/quote numbers (e.g. PPQ-2526-001)</p>
              </div>
              <div>
                <label className="erp-label">Financial Year</label>
                <input value={form.financialYear} onChange={e => fld("financialYear", e.target.value)} className="erp-input" placeholder="2025-26" />
              </div>
              <div>
                <label className="erp-label">Default GST Rate (%)</label>
                <input type="number" value={form.gstRate} onChange={e => fld("gstRate", e.target.value)} className="erp-input" placeholder="18" min="0" max="28" />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-5">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving
              ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
              : <><Save size={13} />Save Settings</>}
          </button>
        </div>
      </form>
    </div>
  );
}
