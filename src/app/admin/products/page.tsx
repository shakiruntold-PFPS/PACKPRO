"use client";
import { useState } from "react";
import { Plus, Search, Package, Eye, Edit, Archive, Star } from "lucide-react";

const CATEGORIES = ["Paper Cups","Food Containers","PET Containers","Paper Bags","Bakery Packaging","Cutlery","Tissues"];

const MOCK_PRODUCTS = [
  { id:"1", name:"Paper Cup 8oz Ripple", code:"CUP-R8OZ", category:"Paper Cups", unit:"pcs", moq:500, sellingPrice:65, stockQty:12500, status:"PUBLISHED", featured:true, gstRate:18 },
  { id:"2", name:"Kraft Bowl 500ml", code:"KBWL-500", category:"Food Containers", unit:"pcs", moq:500, sellingPrice:28, stockQty:85, status:"PUBLISHED", featured:false, gstRate:12 },
  { id:"3", name:"Clear PET Cup 450ml", code:"PET-450", category:"PET Containers", unit:"pcs", moq:1000, sellingPrice:18, stockQty:4300, status:"PUBLISHED", featured:true, gstRate:18 },
  { id:"4", name:"Meal Box Large Kraft", code:"MBOX-LK", category:"Food Containers", unit:"pcs", moq:500, sellingPrice:45, stockQty:320, status:"PUBLISHED", featured:false, gstRate:12 },
  { id:"5", name:"Sweet Box Medium White", code:"SWBX-M", category:"Bakery Packaging", unit:"pcs", moq:500, sellingPrice:22, stockQty:1800, status:"DRAFT", featured:false, gstRate:18 },
  { id:"6", name:"Paper Bag Medium SOS", code:"PBAG-MSOS", category:"Paper Bags", unit:"pcs", moq:500, sellingPrice:12, stockQty:2100, status:"PUBLISHED", featured:false, gstRate:12 },
  { id:"7", name:"Wooden Fork Set 100pc", code:"CUTF-W100", category:"Cutlery", unit:"pcs", moq:1000, sellingPrice:8.5, stockQty:5000, status:"PUBLISHED", featured:false, gstRate:5 },
  { id:"8", name:"Napkin 1-Ply 100pcs", code:"TISN-1P", category:"Tissues", unit:"packs", moq:2000, sellingPrice:35, stockQty:900, status:"ARCHIVED", featured:false, gstRate:5 },
];

const STATUS_STYLE: Record<string,string> = {
  PUBLISHED:"badge-green", DRAFT:"badge-gray", ARCHIVED:"badge-red"
};

function ProductModal({ product, onClose }: any) {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background:"rgba(0,0,0,0.82)" }}
      onClick={e => { if(e.target===e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg rounded-2xl animate-in overflow-hidden"
        style={{ background:"#142645", border:"1px solid var(--border)" }}>
        <div className="p-5 border-b" style={{ borderColor:"var(--border)" }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color:"#14c7c0" }}>
                {product.code}
              </div>
              <h2 className="text-lg font-bold text-white">{product.name}</h2>
              <div className="text-sm mt-1" style={{ color:"var(--muted)" }}>{product.category}</div>
            </div>
            <div className="flex items-center gap-2">
              {product.featured && <Star size={14} fill="#f59e0b" style={{ color:"#f59e0b" }} />}
              <span className={`badge ${STATUS_STYLE[product.status]}`}>{product.status}</span>
              <button onClick={onClose} className="btn-ghost p-1.5">✕</button>
            </div>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3">
          {[
            ["Unit","pcs"],
            ["MOQ",`${product.moq.toLocaleString("en-IN")} ${product.unit}`],
            ["Selling Price",`₹${product.sellingPrice}/${product.unit}`],
            ["GST Rate",`${product.gstRate}%`],
            ["Stock",`${product.stockQty.toLocaleString("en-IN")} ${product.unit}`],
            ["Price + GST",`₹${(product.sellingPrice*(1+product.gstRate/100)).toFixed(2)}`],
          ].map(([k,v]) => (
            <div key={k} className="rounded-xl p-3" style={{ background:"var(--glass)", border:"1px solid var(--border)" }}>
              <div className="erp-label mb-1" style={{ fontSize:10 }}>{k}</div>
              <div className="text-sm font-bold text-white">{v}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-5 pt-0">
          <button className="btn-ghost flex-1 justify-center"><Edit size={13}/> Edit</button>
          <button className="btn-primary flex-1 justify-center">+ Add to Quote</button>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [view, setView] = useState<"grid"|"table">("table");
  const [selected, setSelected] = useState<any>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name:"", code:"", category:"Paper Cups", unit:"pcs", moq:"500", sellingPrice:"", gstRate:"18" });

  const products = MOCK_PRODUCTS.filter(p =>
    (cat==="ALL" || p.category===cat) &&
    (status==="ALL" || p.status===status) &&
    (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search.toUpperCase()))
  );

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Products</h1>
          <p className="module-subtitle">{MOCK_PRODUCTS.filter(p=>p.status==="PUBLISHED").length} published · {MOCK_PRODUCTS.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          {["grid","table"].map(v=>(
            <button key={v} onClick={()=>setView(v as any)}
              className={view===v?"btn-primary":"btn-ghost"} style={{ padding:"7px 12px", fontSize:"12px" }}>
              {v==="grid"?"Grid":"Table"}
            </button>
          ))}
          <button className="btn-primary" onClick={()=>setAddOpen(true)}>
            <Plus size={14}/> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="search-bar flex-1 min-w-48">
          <Search size={13} style={{ color:"var(--muted)" }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products, codes…"/>
        </div>
        <select value={cat} onChange={e=>setCat(e.target.value)}
          className="erp-input" style={{ width:"auto", background:"#0b1e3d" }}>
          <option value="ALL" style={{ background:"#0b1e3d" }}>All Categories</option>
          {CATEGORIES.map(c=><option key={c} value={c} style={{ background:"#0b1e3d" }}>{c}</option>)}
        </select>
        {["ALL","PUBLISHED","DRAFT","ARCHIVED"].map(s=>(
          <button key={s} onClick={()=>setStatus(s)}
            className={status===s?"btn-primary":"btn-ghost"} style={{ padding:"7px 12px", fontSize:"11px" }}>
            {s}
          </button>
        ))}
      </div>

      {/* Grid View */}
      {view==="grid" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p=>(
            <div key={p.id} onClick={()=>setSelected(p)}
              className="glass rounded-2xl p-4 cursor-pointer hover:bg-white/5 transition-all border border-white/8 hover:border-teal-500/30">
              <div className="w-full h-28 rounded-xl mb-3 flex items-center justify-center"
                style={{ background:"linear-gradient(135deg,rgba(14,165,160,0.1),rgba(27,79,138,0.15))" }}>
                <Package size={32} style={{ color:"rgba(14,165,160,0.4)" }}/>
              </div>
              <div className="font-semibold text-white text-sm leading-tight mb-1">{p.name}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-mono text-xs" style={{ color:"#14c7c0" }}>{p.code}</span>
                <span className={`badge ${STATUS_STYLE[p.status]}`} style={{ fontSize:"9px" }}>{p.status}</span>
              </div>
              <div className="mt-2 font-bold text-white">₹{p.sellingPrice}/{p.unit}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {view==="table" && (
        <div className="glass rounded-2xl overflow-auto">
          <table className="erp-table">
            <thead>
              <tr>{["","Product","Code","Category","Unit","MOQ","Price","GST","Stock","Status"].map(h=><th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {products.map(p=>(
                <tr key={p.id} className="cursor-pointer" onClick={()=>setSelected(p)}>
                  <td>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background:"rgba(14,165,160,0.1)" }}>
                      <Package size={14} style={{ color:"#0ea5a0" }}/>
                    </div>
                  </td>
                  <td>
                    <div className="font-semibold text-white">{p.name}</div>
                    {p.featured && <div className="text-xs" style={{ color:"#f59e0b" }}>★ Featured</div>}
                  </td>
                  <td className="font-mono text-xs" style={{ color:"#14c7c0" }}>{p.code}</td>
                  <td style={{ color:"var(--muted)" }}>{p.category}</td>
                  <td style={{ color:"var(--muted)" }}>{p.unit}</td>
                  <td style={{ color:"var(--muted)" }}>{p.moq.toLocaleString("en-IN")}</td>
                  <td className="font-bold text-white">₹{p.sellingPrice}</td>
                  <td style={{ color:"var(--muted)" }}>{p.gstRate}%</td>
                  <td className={p.stockQty<100?"text-red-400":"text-white"} style={{ fontWeight:600 }}>
                    {p.stockQty.toLocaleString("en-IN")}
                  </td>
                  <td><span className={`badge ${STATUS_STYLE[p.status]}`}>{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background:"rgba(0,0,0,0.82)" }}>
          <div className="w-full max-w-lg rounded-2xl p-6 animate-in"
            style={{ background:"#142645", border:"1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">Add Product</h3>
              <button onClick={()=>setAddOpen(false)} className="btn-ghost p-1.5">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                ["Product Name","name","text"],
                ["Product Code","code","text"],
                ["MOQ","moq","number"],
                ["Selling Price","sellingPrice","number"],
              ].map(([l,k,t])=>(
                <div key={k}>
                  <label className="erp-label">{l}</label>
                  <input type={t} value={(form as any)[k]}
                    onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}
                    className="erp-input" placeholder={l}/>
                </div>
              ))}
              <div>
                <label className="erp-label">Category</label>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                  className="erp-input" style={{ background:"#0b1e3d" }}>
                  {CATEGORIES.map(c=><option key={c} value={c} style={{ background:"#0b1e3d" }}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="erp-label">GST Rate</label>
                <select value={form.gstRate} onChange={e=>setForm(f=>({...f,gstRate:e.target.value}))}
                  className="erp-input" style={{ background:"#0b1e3d" }}>
                  {["0","5","12","18","28"].map(r=><option key={r} value={r} style={{ background:"#0b1e3d" }}>{r}%</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>setAddOpen(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
              <button className="btn-primary flex-1 justify-center">
                <Plus size={13}/> Save Product
              </button>
            </div>
          </div>
        </div>
      )}

      <ProductModal product={selected} onClose={()=>setSelected(null)}/>
    </div>
  );
}
