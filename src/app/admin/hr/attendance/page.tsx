"use client";
import { useState } from "react";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";

const EMPLOYEES = [
  { id:"1", empCode:"PP-001", name:"Rahul Sharma", department:"Sales" },
  { id:"2", empCode:"PP-002", name:"Priya Verma", department:"Accounts" },
  { id:"3", empCode:"PP-003", name:"Amit Singh", department:"Operations" },
  { id:"4", empCode:"PP-004", name:"Sneha Gupta", department:"Sales" },
];

const MOCK_ATTENDANCE: Record<string,string> = {
  "PP-001":"PRESENT","PP-002":"PRESENT","PP-003":"ABSENT","PP-004":"HALF_DAY"
};

const STATUS_STYLE: Record<string,{badge:string,icon:any,label:string}> = {
  PRESENT:  { badge:"badge-green",  icon:CheckCircle, label:"Present" },
  ABSENT:   { badge:"badge-red",    icon:XCircle,     label:"Absent"  },
  HALF_DAY: { badge:"badge-amber",  icon:Clock,       label:"Half Day" },
  LEAVE:    { badge:"badge-blue",   icon:Calendar,    label:"Leave"   },
  HOLIDAY:  { badge:"badge-purple", icon:Calendar,    label:"Holiday" },
};

export default function AttendancePage() {
  const today = new Date().toISOString().slice(0,10);
  const [date, setDate] = useState(today);
  const [att, setAtt] = useState<Record<string,string>>(MOCK_ATTENDANCE);

  const present = Object.values(att).filter(s=>s==="PRESENT").length;
  const absent = Object.values(att).filter(s=>s==="ABSENT").length;

  return (
    <div className="module-page">
      <div className="module-header">
        <div>
          <h1 className="module-title">Attendance</h1>
          <p className="module-subtitle">Present: {present} · Absent: {absent} · {EMPLOYEES.length} total</p>
        </div>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          className="erp-input" style={{ width:"auto", background:"#0b1e3d" }}/>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label:"Present", value:present, color:"#10b981" },
          { label:"Absent",  value:absent,  color:"#ef4444" },
          { label:"Half Day",value:Object.values(att).filter(s=>s==="HALF_DAY").length, color:"#f59e0b" },
          { label:"On Leave", value:Object.values(att).filter(s=>s==="LEAVE").length, color:"#60a5fa" },
        ].map(s=>(
          <div key={s.label} className="kpi-card">
            <div className="text-xs font-semibold uppercase mb-2" style={{ color:"var(--muted)" }}>{s.label}</div>
            <div className="text-2xl font-black" style={{ color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl overflow-auto">
        <table className="erp-table">
          <thead>
            <tr>{["Employee","Code","Department","Status","Mark As"].map(h=><th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {EMPLOYEES.map(emp=>{
              const status = att[emp.empCode]||"ABSENT";
              const s = STATUS_STYLE[status];
              return (
                <tr key={emp.id}>
                  <td className="font-semibold text-white">{emp.name}</td>
                  <td className="font-mono text-xs" style={{ color:"#14c7c0" }}>{emp.empCode}</td>
                  <td style={{ color:"var(--muted)" }}>{emp.department}</td>
                  <td><span className={`badge ${s.badge}`}>{s.label}</span></td>
                  <td>
                    <div className="flex gap-1">
                      {["PRESENT","ABSENT","HALF_DAY","LEAVE"].map(v=>(
                        <button key={v} onClick={()=>setAtt(a=>({...a,[emp.empCode]:v}))}
                          className={att[emp.empCode]===v?"btn-primary":"btn-ghost"}
                          style={{ padding:"4px 10px", fontSize:"11px" }}>
                          {v==="HALF_DAY"?"½":v[0]}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
