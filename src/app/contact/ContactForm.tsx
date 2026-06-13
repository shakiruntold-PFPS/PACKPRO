"use client";

import { useState, FormEvent } from "react";

type FormState = {
  name: string;
  phone: string;
  email: string;
  company: string;
  message: string;
  productInterest: string;
};

const INITIAL: FormState = { name: "", phone: "", email: "", company: "", message: "", productInterest: "" };

export default function ContactForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      setErrorMsg("Name, phone, and message are required.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        setStatus("success");
        setForm(INITIAL);
      } else {
        setErrorMsg(json.error || "Something went wrong. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "12px 14px",
    color: "#e8eef8",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "system-ui, sans-serif",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: "#93a5c4",
    marginBottom: 6,
    letterSpacing: 0.5,
  };

  if (status === "success") {
    return (
      <div style={{ background: "rgba(14,165,160,0.12)", border: "1px solid rgba(14,165,160,0.3)", borderRadius: 20, padding: "48px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
        <div style={{ fontWeight: 800, fontSize: 20, color: "#14c7c0", marginBottom: 8 }}>Enquiry Received!</div>
        <p style={{ color: "#93a5c4", fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
          Thank you for reaching out. Our team will get back to you within 24 hours via phone or WhatsApp.
        </p>
        <button
          onClick={() => setStatus("idle")}
          style={{ background: "#0ea5a0", color: "#fff", fontWeight: 700, fontSize: 14, padding: "10px 24px", borderRadius: 8, border: "none", cursor: "pointer" }}>
          Send Another Enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>NAME *</label>
          <input type="text" placeholder="Your name" value={form.name} onChange={set("name")} style={inputStyle} required />
        </div>
        <div>
          <label style={labelStyle}>PHONE *</label>
          <input type="tel" placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={set("phone")} style={inputStyle} required />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div>
          <label style={labelStyle}>EMAIL</label>
          <input type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>COMPANY</label>
          <input type="text" placeholder="Restaurant / Hotel / Shop" value={form.company} onChange={set("company")} style={inputStyle} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>PRODUCT INTEREST</label>
        <textarea
          placeholder="e.g. Disposable cups, meal boxes, carry bags..."
          value={form.productInterest}
          onChange={set("productInterest")}
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>
      <div>
        <label style={labelStyle}>MESSAGE *</label>
        <textarea
          placeholder="Tell us about your requirements — quantity, frequency, delivery location..."
          value={form.message}
          onChange={set("message")}
          rows={4}
          style={{ ...inputStyle, resize: "vertical" }}
          required
        />
      </div>

      {status === "error" && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#fca5a5" }}>
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          background: status === "loading" ? "rgba(14,165,160,0.4)" : "linear-gradient(135deg,#0ea5a0,#0c8c87)",
          color: "#fff",
          fontWeight: 700,
          fontSize: 15,
          padding: "14px 28px",
          borderRadius: 10,
          border: "none",
          cursor: status === "loading" ? "not-allowed" : "pointer",
          width: "100%",
        }}>
        {status === "loading" ? "Sending..." : "Send Enquiry →"}
      </button>
    </form>
  );
}
