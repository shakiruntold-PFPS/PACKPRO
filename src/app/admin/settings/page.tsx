"use client";
import { useState, useEffect } from "react";
import { Save, Building2, CreditCard, FileText, Users, Plus, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { FormSkeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";

const TABS = [
  { key: "company", label: "Company",      icon: Building2  },
  { key: "gst",     label: "GST & Tax",    icon: FileText   },
  { key: "bank",    label: "Bank Details", icon: CreditCard },
  { key: "users",   label: "Users",        icon: Users      },
];
const ROLES = ["SUPER_ADMIN","ADMIN","MANAGER","SALES","ACCOUNTS","WAREHOUSE","PURCHASE","HR"];
const ROLE_COLORS: Record<string,string> = {
  SUPER_ADMIN:"badge-purple",ADMIN:"badge-teal",MANAGER:"badge-blue",
  SALES:"badge-green",ACCOUNTS:"badge-amber",WAREHOUSE:"badge-orange",
  PURCHASE:"badge-indigo",HR:"badge-pink",
};

function Field({ label, value, onChange, type="text", placeholder="", disabled=false, required=false }:any) {
  return (
    <div>
      <label className="erp-label">{label}{required&&" *"}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)}
        disabled={disabled} placeholder={placeholder||label} className="erp-input"
        style={disabled?{opacity:.5}:{}}/>
    </div>
  );
}

export default function SettingsPage() {
  const [tab, setTab]       = useState("company");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error, info } = useToast();

  const [company, setCompany] = useState({ name:"",tagline:"",address:"",city:"",state:"",pincode:"",phone:"",email:"",supportEmail:"",website:"" });
  const [gst, setGst]         = useState({ gstin:"",pan:"",defaultGstRate:"18",invoicePrefix:"PPQ",financialYear:"2025-26" });
  const [bank, setBank]       = useState({ bankName:"",accountNo:"",ifsc:"",branch:"",accountType:"Current",upiId:"" });
  const [users, setUsers]     = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState({ name:"",email:"",password:"",role:"SALES" });
  const [addingUser, setAddingUser] = useState(false);

  useEffect(()=>{
    fetch("/api/settings").then(r=>r.json()).then(json=>{
      if(json.data){
        const d=json.data;
        setCompany({name:d.name??"",tagline:d.tagline??"",address:d.address??"",city:d.city??"",state:d.state??"",pincode:d.pincode??"",phone:d.phone??"",email:d.email??"",supportEmail:d.supportEmail??"",website:d.website??""});
        setGst({gstin:d.gstin??"",pan:d.pan??"",defaultGstRate:String(d.gstRate??"18"),invoicePrefix:d.invoicePrefix??"PPQ",financialYear:d.financialYear??"2025-26"});
        setBank({bankName:d.bankName??"",accountNo:d.accountNo??"",ifsc:d.ifsc??"",branch:d.branch??"",accountType:d.accountType??"Current",upiId:d.upiId??""});
      }
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    if(tab!=="users") return;
    setUsersLoading(true);
    fetch("/api/users?limit=50").then(r=>r.json()).then(json=>setUsers(json.data?.data??[])).catch(()=>error("Failed to load users")).finally(()=>setUsersLoading(false));
  },[tab]);

  async function saveSettings(){
    setSaving(true);
    try{
      const payload={...company,...bank,gstRate:Number(gst.defaultGstRate),gstin:gst.gstin,pan:gst.pan,invoicePrefix:gst.invoicePrefix,financialYear:gst.financialYear};
      const res=await fetch("/api/settings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
      if(!res.ok) throw new Error();
      success("Settings saved","Changes have been saved successfully");
    } catch{ error("Failed to save settings"); } finally{ setSaving(false); }
  }

  async function addUser(){
    if(!newUser.name||!newUser.email||!newUser.password){ info("Fill all required fields"); return; }
    setAddingUser(true);
    try{
      const res=await fetch("/api/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(newUser)});
      const json=await res.json();
      if(!res.ok){ error(json.error||"Failed to add user"); return; }
      setUsers(u=>[json.data,...u]); setNewUser({name:"",email:"",password:"",role:"SALES"}); setShowAdd(false);
      success("User added",`${newUser.email} can now sign in`);
    } catch{ error("Failed to add user"); } finally{ setAddingUser(false); }
  }

  async function toggleUser(u:any){
    const res=await fetch(`/api/users/${u.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({isActive:!u.isActive})});
    if(res.ok){ setUsers(us=>us.map(x=>x.id===u.id?{...x,isActive:!x.isActive}:x)); success(u.isActive?"User deactivated":"User activated"); }
  }

  const set=(setter:any)=>(key:string)=>(val:string)=>setter((s:any)=>({...s,[key]:val}));

  return (
    <div className="module-page animate-in">
      <div className="module-header">
        <div>
          <h1 className="module-title">Settings</h1>
          <p className="module-subtitle">Manage company profile, GST, bank and users</p>
        </div>
        {tab!=="users" && (
          <button className="btn-primary" onClick={saveSettings} disabled={saving}>
            {saving?<span className="inline-flex items-center gap-2"><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"/>Saving…</span>:<><Save size={13}/>Save Changes</>}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl overflow-x-auto" style={{background:"var(--glass)",border:"1px solid var(--border)",width:"fit-content"}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all"
            style={{background:tab===t.key?"linear-gradient(135deg,#0ea5a0,#1b4f8a)":"transparent",color:tab===t.key?"#fff":"var(--muted)"}}>
            <t.icon size={14}/>{t.label}
          </button>
        ))}
      </div>

      {loading&&tab!=="users"?<FormSkeleton fields={6}/>:<>

        {tab==="company"&&(
          <div className="glass rounded-2xl p-6 animate-in">
            <h3 className="font-bold text-white mb-5">Company Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Field label="Company Name" value={company.name} onChange={set(setCompany)("name")} required/></div>
              <div className="md:col-span-2"><Field label="Tagline" value={company.tagline} onChange={set(setCompany)("tagline")}/></div>
              <div className="md:col-span-2"><Field label="Address" value={company.address} onChange={set(setCompany)("address")}/></div>
              <Field label="City" value={company.city} onChange={set(setCompany)("city")}/>
              <Field label="State" value={company.state} onChange={set(setCompany)("state")}/>
              <Field label="Pincode" value={company.pincode} onChange={set(setCompany)("pincode")}/>
              <Field label="Phone" value={company.phone} onChange={set(setCompany)("phone")} type="tel"/>
              <Field label="Email" value={company.email} onChange={set(setCompany)("email")} type="email"/>
              <Field label="Support Email" value={company.supportEmail} onChange={set(setCompany)("supportEmail")} type="email"/>
              <Field label="Website" value={company.website} onChange={set(setCompany)("website")}/>
            </div>
          </div>
        )}

        {tab==="gst"&&(
          <div className="glass rounded-2xl p-6 animate-in">
            <h3 className="font-bold text-white mb-5">GST & Tax Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="GSTIN" value={gst.gstin} onChange={set(setGst)("gstin")} placeholder="22AAAAA0000A1Z5"/>
              <Field label="PAN" value={gst.pan} onChange={set(setGst)("pan")} placeholder="AABCP1234A"/>
              <div>
                <label className="erp-label">Default GST Rate (%)</label>
                <select value={gst.defaultGstRate} onChange={e=>setGst(g=>({...g,defaultGstRate:e.target.value}))} className="erp-select">
                  {["0","5","12","18","28"].map(r=><option key={r} value={r}>{r}%</option>)}
                </select>
              </div>
              <Field label="Invoice Prefix" value={gst.invoicePrefix} onChange={set(setGst)("invoicePrefix")} placeholder="PPQ"/>
              <Field label="Financial Year" value={gst.financialYear} onChange={set(setGst)("financialYear")} placeholder="2025-26"/>
            </div>
          </div>
        )}

        {tab==="bank"&&(
          <div className="glass rounded-2xl p-6 animate-in">
            <h3 className="font-bold text-white mb-5">Bank Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Bank Name" value={bank.bankName} onChange={set(setBank)("bankName")}/>
              <Field label="Account Number" value={bank.accountNo} onChange={set(setBank)("accountNo")}/>
              <Field label="IFSC Code" value={bank.ifsc} onChange={set(setBank)("ifsc")}/>
              <Field label="Branch" value={bank.branch} onChange={set(setBank)("branch")}/>
              <div>
                <label className="erp-label">Account Type</label>
                <select value={bank.accountType} onChange={e=>setBank(b=>({...b,accountType:e.target.value}))} className="erp-select">
                  {["Current","Savings","OD"].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <Field label="UPI ID" value={bank.upiId} onChange={set(setBank)("upiId")} placeholder="business@upi"/>
            </div>
          </div>
        )}

        {tab==="users"&&(
          <div className="animate-in">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-white">{users.length} registered users</span>
              <button className="btn-primary" onClick={()=>setShowAdd(s=>!s)}><Plus size={13}/> Add User</button>
            </div>

            {showAdd&&(
              <div className="glass rounded-2xl p-5 mb-4 animate-in-scale" style={{border:"1px solid rgba(14,165,160,0.3)"}}>
                <h4 className="font-bold text-white mb-4">Create New User</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Full Name" value={newUser.name} onChange={(v:string)=>setNewUser(u=>({...u,name:v}))} required/>
                  <Field label="Email" type="email" value={newUser.email} onChange={(v:string)=>setNewUser(u=>({...u,email:v}))} required/>
                  <Field label="Password" type="password" value={newUser.password} onChange={(v:string)=>setNewUser(u=>({...u,password:v}))} required/>
                  <div>
                    <label className="erp-label">Role *</label>
                    <select value={newUser.role} onChange={e=>setNewUser(u=>({...u,role:e.target.value}))} className="erp-select">
                      {ROLES.map(r=><option key={r} value={r}>{r.replace("_"," ")}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="btn-primary" onClick={addUser} disabled={addingUser}>
                    {addingUser?<span className="inline-flex items-center gap-2"><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin"/>Adding…</span>:<><CheckCircle size={13}/>Create User</>}
                  </button>
                  <button className="btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button>
                </div>
              </div>
            )}

            {usersLoading?(
              <div className="glass rounded-2xl p-6 text-center" style={{color:"var(--muted)"}}>Loading users…</div>
            ):(
              <div className="glass rounded-2xl overflow-auto">
                <table className="erp-table">
                  <thead><tr>{["User","Email","Role","Last Login","Status","Action"].map(h=><th key={h}>{h}</th>)}</tr></thead>
                  <tbody>
                    {users.map(u=>(
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                              style={{background:"linear-gradient(135deg,#0ea5a0,#1b4f8a)",color:"#fff"}}>
                              {u.name.split(" ").map((n:string)=>n[0]).join("").slice(0,2)}
                            </div>
                            <span className="font-semibold text-white text-sm">{u.name}</span>
                          </div>
                        </td>
                        <td style={{color:"var(--muted)",fontSize:13}}>{u.email}</td>
                        <td><span className={`badge ${ROLE_COLORS[u.role]??"badge-gray"}`}>{u.role.replace("_"," ")}</span></td>
                        <td style={{color:"var(--muted)",fontSize:12}}>{u.lastLogin?formatDate(u.lastLogin):"Never"}</td>
                        <td><span className={`badge ${u.isActive?"badge-green":"badge-red"}`}>{u.isActive?"Active":"Inactive"}</span></td>
                        <td>
                          <button onClick={()=>toggleUser(u)} className="btn-ghost" style={{padding:"4px 10px",fontSize:"11px"}}>
                            {u.isActive?"Deactivate":"Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </>}
    </div>
  );
}
