"use client";
import { useState } from "react";
import { Save, Building2, CreditCard, FileText, Bell, Users } from "lucide-react";

const TABS = [
  { key: "company", label: "Company Profile", icon: Building2 },
  { key: "gst", label: "GST & Tax", icon: FileText },
  { key: "bank", label: "Bank Details", icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "users", label: "Users & Roles", icon: Users },
];

const MOCK_USERS = [
  { id: "1", name: "Admin User", email: "admin@packpro.site", role: "SUPER_ADMIN", isActive: true, lastLogin: "2025-06-11" },
  { id: "2", name: "Rahul Sharma", email: "rahul@packpro.site", role: "SALES", isActive: true, lastLogin: "2025-06-11" },
  { id: "3", name: "Priya Verma", email: "priya@packpro.site", role: "ACCOUNTS", isActive: true, lastLogin: "2025-06-10" },
  { id: "4", name: "Amit Singh", email: "amit@packpro.site", role: "WAREHOUSE", isActive: true, lastLogin: "2025-06-09" },
];

function Field({ label, value, onChange, type = "text", disabled = false, placeholder = "" }: any) {
  return (
    <div>
      <label className="erp-label">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        disabled={disabled} placeholder={placeholder} className="erp-input"
        style={disabled ? { opacity: 0.5 } : {}} />
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState("company");
  const [saved, setSaved] = useState(false);
  const [company, setCompany] = useState({
    name: "PACKPRO Food Packaging Solutions",
    tagline: "Premium Food Packaging for Modern Businesses",
    address: "Dholidub, Narnaul-Behror Road",
    city: "Alwar",
    state: "Rajasthan",
    pincode: "301001",
    phone: "+91 9057627625",
    email: "sales@packpro.site",
    supportEmail: "support@packpro.site",
    website: "www.packpro.site",
  });
  const [gst, setGst] = useState({
    gstin: "08PACKP1234A1Z5",
    pan: "AABCP1234A",
    defaultGstRate: "18",
    invoicePrefix: "PPQ",
    financialYear: "2025-26",
  });
  const [bank, setBank] = useState({
    bankName: "State Bank of India",
    accountNo: "1234567890",
    ifsc: "SBIN0001234",
    branch: "Alwar Main Branch",
    accountType: "Current",
  });

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const set = (setter: any) => (key: string) => (val: string) => setter((s: any) => ({ ...s, [key]: val }));

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Settings</h1>
          <p className="module-subtitle">Manage company profile, GST, bank details and users</p>
        </div>
        <button className="btn-primary" onClick={save}>
          <Save size={13} />
          {saved ? "Saved ✓" : "Save Changes"}
        </button>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={tab === t.key ? "btn-primary" : "btn-ghost"}
            style={{ fontSize: "12px" }}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {tab === "company" && (
        <div className="glass rounded-2xl p-6 animate-in">
          <h3 className="text-sm font-bold text-white mb-5">Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Company Name" value={company.name} onChange={set(setCompany)("name")} />
            <Field label="Tagline" value={company.tagline} onChange={set(setCompany)("tagline")} />
            <Field label="Phone" value={company.phone} onChange={set(setCompany)("phone")} type="tel" />
            <Field label="Sales Email" value={company.email} onChange={set(setCompany)("email")} type="email" />
            <Field label="Support Email" value={company.supportEmail} onChange={set(setCompany)("supportEmail")} type="email" />
            <Field label="Website" value={company.website} onChange={set(setCompany)("website")} />
            <div className="md:col-span-2">
              <Field label="Address" value={company.address} onChange={set(setCompany)("address")} />
            </div>
            <Field label="City" value={company.city} onChange={set(setCompany)("city")} />
            <Field label="State" value={company.state} onChange={set(setCompany)("state")} />
            <Field label="Pincode" value={company.pincode} onChange={set(setCompany)("pincode")} />
          </div>
        </div>
      )}

      {tab === "gst" && (
        <div className="glass rounded-2xl p-6 animate-in">
          <h3 className="text-sm font-bold text-white mb-5">GST & Tax Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="GSTIN" value={gst.gstin} onChange={set(setGst)("gstin")} />
            <Field label="PAN" value={gst.pan} onChange={set(setGst)("pan")} />
            <div>
              <label className="erp-label">Default GST Rate</label>
              <select value={gst.defaultGstRate} onChange={e => setGst(g => ({ ...g, defaultGstRate: e.target.value }))}
                className="erp-input" style={{ background: "#0b1e3d" }}>
                {["0", "5", "12", "18", "28"].map(r => (
                  <option key={r} value={r} style={{ background: "#0b1e3d" }}>{r}%</option>
                ))}
              </select>
            </div>
            <Field label="Invoice Prefix" value={gst.invoicePrefix} onChange={set(setGst)("invoicePrefix")} placeholder="e.g. PPQ, INV" />
            <Field label="Financial Year" value={gst.financialYear} onChange={set(setGst)("financialYear")} placeholder="2025-26" />
          </div>
        </div>
      )}

      {tab === "bank" && (
        <div className="glass rounded-2xl p-6 animate-in">
          <h3 className="text-sm font-bold text-white mb-5">Bank Account Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Bank Name" value={bank.bankName} onChange={set(setBank)("bankName")} />
            <Field label="Account Number" value={bank.accountNo} onChange={set(setBank)("accountNo")} />
            <Field label="IFSC Code" value={bank.ifsc} onChange={set(setBank)("ifsc")} />
            <Field label="Branch" value={bank.branch} onChange={set(setBank)("branch")} />
            <div>
              <label className="erp-label">Account Type</label>
              <select value={bank.accountType} onChange={e => setBank(b => ({ ...b, accountType: e.target.value }))}
                className="erp-input" style={{ background: "#0b1e3d" }}>
                {["Current", "Savings"].map(t => <option key={t} value={t} style={{ background: "#0b1e3d" }}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {tab === "users" && (
        <div className="glass rounded-2xl overflow-auto animate-in">
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="text-sm font-bold text-white">System Users</h3>
            <button className="btn-primary" style={{ padding: "7px 14px", fontSize: "12px" }}>
              + Add User
            </button>
          </div>
          <table className="erp-table">
            <thead>
              <tr>{["Name", "Email", "Role", "Status", "Last Login"].map(h => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {MOCK_USERS.map(u => (
                <tr key={u.id}>
                  <td className="font-semibold text-white">{u.name}</td>
                  <td style={{ color: "var(--muted)" }}>{u.email}</td>
                  <td>
                    <span className="badge badge-teal text-xs">{u.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? "badge-green" : "badge-gray"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{u.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "notifications" && (
        <div className="glass rounded-2xl p-6 animate-in">
          <h3 className="text-sm font-bold text-white mb-5">Notification Preferences</h3>
          {[
            ["New Lead Alert", "Get notified when a new lead is created"],
            ["Quote Approval", "Alert when a customer approves a quotation"],
            ["Invoice Overdue", "Daily digest of overdue invoices"],
            ["Low Stock Alert", "Alert when product stock drops below reorder level"],
            ["New Order", "Notify when a new sales order is confirmed"],
            ["Payment Received", "Alert when a payment is recorded"],
          ].map(([label, desc]) => (
            <div key={label} className="flex items-center justify-between py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <div>
                <div className="text-sm font-semibold text-white">{label}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{desc}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-9 h-5 rounded-full peer peer-checked:after:translate-x-full after:absolute after:top-0.5 after:left-0.5 after:w-4 after:h-4 after:rounded-full after:transition-all"
                  style={{ background: "rgba(14,165,160,0.8)" }} />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
