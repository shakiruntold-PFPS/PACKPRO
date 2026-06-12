"use client";
import { useState } from "react";
import { Upload, Search, FolderOpen, FileText, Image, File, Download, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";

const MOCK_DOCS = [
  { id:"1", name:"PACKPRO GSTIN Certificate", type:"GST_CERT", ext:"pdf", size:"245 KB", party:"—", tags:["legal","gst"], uploadedBy:"Admin", createdAt:"2025-04-01" },
  { id:"2", name:"Raj Paper Mills — Supply Agreement", type:"AGREEMENT", ext:"pdf", size:"1.2 MB", party:"Raj Paper Mills", tags:["vendor","agreement"], uploadedBy:"Admin", createdAt:"2025-05-10" },
  { id:"3", name:"Cloud Bites Kitchen — PO #CBK-2025-012", type:"CUSTOMER_PO", ext:"pdf", size:"380 KB", party:"Cloud Bites Kitchen", tags:["customer","sales"], uploadedBy:"Rahul S.", createdAt:"2025-06-05" },
  { id:"4", name:"Product Catalog June 2025", type:"CATALOG", ext:"pdf", size:"4.8 MB", party:"—", tags:["catalog","marketing"], uploadedBy:"Admin", createdAt:"2025-06-01" },
  { id:"5", name:"Vendor Bill — PET Solutions #INV-2025-456", type:"VENDOR_BILL", ext:"pdf", size:"210 KB", party:"PET Solutions Pvt Ltd", tags:["purchase","bill"], uploadedBy:"Vikram Y.", createdAt:"2025-06-03" },
];

const DOC_TYPES = ["ALL","GST_CERT","AGREEMENT","CUSTOMER_PO","VENDOR_BILL","CATALOG","INVOICE","DELIVERY_CHALLAN"];
const TYPE_ICONS: Record<string,any> = { pdf:FileText, jpg:Image, png:Image };

export default function DocumentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [uploading, setUploading] = useState(false);

  const filtered = MOCK_DOCS.filter(d=>
    (typeFilter==="ALL" || d.type===typeFilter) &&
    (!search || d.name.toLowerCase().includes(search.toLowerCase()) || d.party.toLowerCase().includes(search.toLowerCase()) || d.tags.some(t=>t.includes(search.toLowerCase())))
  );

  function handleUpload() {
    setUploading(true);
    setTimeout(()=>setUploading(false),1500);
  }

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Documents</h1>
          <p className="module-subtitle">{MOCK_DOCS.length} documents · Certificates, Agreements, Bills, POs</p>
        </div>
        <button className="btn-primary" onClick={handleUpload}>
          <Upload size={13} className={uploading?"animate-spin":""}/> Upload Document
        </button>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color:"var(--muted)" }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search documents, tags, parties…"/>
        </div>
        <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}
          className="erp-input" style={{ width:"auto", background:"#0b1e3d" }}>
          {DOC_TYPES.map(t=><option key={t} value={t} style={{ background:"#0b1e3d" }}>{t==="ALL"?"All Types":t.replace("_"," ")}</option>)}
        </select>
      </div>

      <div className="glass rounded-2xl overflow-auto">
        <table className="erp-table">
          <thead>
            <tr>{["Document","Type","Party","Size","Tags","Uploaded By","Date","Actions"].map(h=><th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map(doc=>{
              const Icon = TYPE_ICONS[doc.ext]||File;
              return (
                <tr key={doc.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background:"rgba(14,165,160,0.1)" }}>
                        <Icon size={14} style={{ color:"#0ea5a0" }}/>
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">{doc.name}</div>
                        <div className="text-xs font-mono mt-0.5" style={{ color:"var(--muted)" }}>.{doc.ext}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-teal text-xs">{doc.type.replace("_"," ")}</span></td>
                  <td style={{ color:"var(--muted)", fontSize:13 }}>{doc.party}</td>
                  <td style={{ color:"var(--muted)", fontSize:12 }}>{doc.size}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {doc.tags.map(t=>(
                        <span key={t} className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background:"rgba(139,165,200,0.1)", color:"var(--muted)" }}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ color:"var(--muted)", fontSize:12 }}>{doc.uploadedBy}</td>
                  <td style={{ color:"var(--muted)", fontSize:12 }}>{formatDate(doc.createdAt)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn-ghost p-1.5"><Eye size={12}/></button>
                      <button className="btn-ghost p-1.5"><Download size={12}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length===0 && (
          <div className="empty-state">
            <FolderOpen size={40}/>
            <div className="text-sm mt-2 font-semibold">No documents found</div>
          </div>
        )}
      </div>
    </div>
  );
}
