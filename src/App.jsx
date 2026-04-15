import { useState, useRef, useMemo } from "react";

// ─── DATA ─────────────────────────────────────────────────────────────────────
const INIT_LOCATIONS = ["Lobi Utama", "Gedung B", "Balkon", "Ruang Anak"];
const INIT_EQUIPMENT = [
  { id: "eq1", name: "Receiver + Earphone" },
  { id: "eq2", name: "Transmitter (Interpreter)" },
];
const INIT_STOCK = {
  "Lobi Utama": { eq1: 6, eq2: 2 },
  "Gedung B":   { eq1: 4, eq2: 1 },
  "Balkon":     { eq1: 3, eq2: 1 },
  "Ruang Anak": { eq1: 2, eq2: 0 },
};
const INIT_LANGUAGES = [
  { id: "l1", name: "Inggris",       color: "#2563eb" },
  { id: "l2", name: "Mandarin",      color: "#dc2626" },
  { id: "l3", name: "Bahasa Isyarat",color: "#059669" },
  { id: "l4", name: "Lainnya",       color: "#d97706" },
];
const INIT_MEMBERS = [
  { id: "m1", name: "Hendri Santoso",  phone: "081234567890", inCG: true  },
  { id: "m2", name: "Melinda Kusuma",  phone: "081298765432", inCG: false },
  { id: "m3", name: "Budi Prasetyo",   phone: "081287654321", inCG: false },
];
const INIT_LOANS = [
  { id: "ln1", memberId:"m1", name:"Hendri Santoso",  phone:"081234567890", date:"2026-04-13", time:"07:45", service:"Ibadah Pagi",  officer:"Kak Grace", languageId:"l1", equipmentId:"eq1", qty:2, location:"Lobi Utama", inCG:true,  followup:null,  photo:null, returned:false },
  { id: "ln2", memberId:"m2", name:"Melinda Kusuma",  phone:"081298765432", date:"2026-04-13", time:"08:00", service:"Ibadah Pagi",  officer:"Kak David", languageId:"l2", equipmentId:"eq1", qty:1, location:"Gedung B",   inCG:false, followup:true,  photo:null, returned:false },
  { id: "ln3", memberId:"m3", name:"Budi Prasetyo",   phone:"081287654321", date:"2026-04-13", time:"10:30", service:"Ibadah Siang", officer:"Kak Sarah", languageId:"l3", equipmentId:"eq1", qty:1, location:"Lobi Utama", inCG:false, followup:false, photo:null, returned:true  },
];
const PRESET_COLORS = ["#2563eb","#dc2626","#059669","#d97706","#7c3aed","#db2777","#0891b2","#65a30d"];

// ─── UTILS ────────────────────────────────────────────────────────────────────
function uid() { return "x" + Date.now() + Math.random().toString(36).slice(2,5); }
function computeStock(base, loans) {
  const s = JSON.parse(JSON.stringify(base));
  loans.filter(l => !l.returned).forEach(l => {
    if (s[l.location]?.[l.equipmentId] !== undefined) s[l.location][l.equipmentId] -= l.qty;
  });
  return s;
}
function totalStock(stock, eqId) {
  return Object.values(stock).reduce((a, loc) => a + (loc[eqId] || 0), 0);
}
const today   = new Date().toISOString().slice(0,10);
const nowTime = new Date().toTimeString().slice(0,5);

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  navy:"#0f2557", blue:"#1d4ed8", lightBlue:"#eff6ff",
  surface:"#fff", bg:"#f0f4ff", border:"#e2e8f0",
  primary:"#0f172a", muted:"#64748b", light:"#94a3b8",
  success:"#059669", successBg:"#d1fae5",
  warn:"#d97706",    warnBg:"#fef3c7",
  danger:"#dc2626",  dangerBg:"#fee2e2",
};
// Mobile-first input — tall enough to tap easily
const inp = {
  width:"100%", border:`1.5px solid ${C.border}`, borderRadius:12,
  padding:"13px 14px", fontSize:16, outline:"none",
  boxSizing:"border-box", fontFamily:"inherit",
  background:C.surface, color:C.primary,
  WebkitAppearance:"none", appearance:"none",
};
const card = { background:C.surface, borderRadius:20, padding:18, boxShadow:"0 2px 16px rgba(15,23,42,0.08)", marginBottom:14 };

// ─── MICRO COMPONENTS ────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  const bg = type==="error" ? C.danger : type==="warn" ? C.warn : C.success;
  return (
    <div style={{ position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", zIndex:9999,
      background:bg, color:"#fff", padding:"13px 22px", borderRadius:16,
      boxShadow:"0 8px 32px rgba(0,0,0,0.2)", fontWeight:700, fontSize:15,
      maxWidth:"90vw", textAlign:"center", whiteSpace:"nowrap" }}>
      {msg}
    </div>
  );
}

// Bottom-sheet modal — feels native on mobile
function Sheet({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(15,23,42,0.6)", zIndex:1000,
      display:"flex", alignItems:"flex-end", justifyContent:"center" }}
      onClick={onClose}>
      <div style={{ background:C.surface, borderRadius:"24px 24px 0 0", padding:"20px 20px 32px",
        width:"100%", maxWidth:520, maxHeight:"88vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>
        {/* Drag handle */}
        <div style={{ width:40, height:4, background:C.border, borderRadius:4,
          margin:"0 auto 18px" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontWeight:800, fontSize:18, color:C.primary }}>{title}</div>
          <button onClick={onClose} style={{ background:C.bg, border:"none", borderRadius:"50%",
            width:36, height:36, cursor:"pointer", fontSize:20, lineHeight:1,
            display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children, required }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={{ display:"block", fontSize:13, fontWeight:700, color:C.muted, marginBottom:6 }}>
        {label}{required && <span style={{ color:C.danger }}> *</span>}
      </label>
      {children}
    </div>
  );
}

// Large tap-friendly button
function Btn({ children, onClick, variant="primary", disabled, full, style:extra }) {
  const base = { primary:{ background:C.blue, color:"#fff" }, secondary:{ background:C.bg, color:C.muted },
    danger:{ background:C.dangerBg, color:C.danger }, success:{ background:C.successBg, color:C.success } };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...base[variant], border:"none", borderRadius:14, padding:"14px 20px",
      fontWeight:800, fontSize:16, cursor:disabled?"not-allowed":"pointer",
      opacity:disabled?0.45:1, width:full?"100%":undefined,
      minHeight:52, display:"flex", alignItems:"center", justifyContent:"center", gap:6,
      ...extra }}>
      {children}
    </button>
  );
}

function LangBadge({ lang }) {
  if (!lang) return null;
  return <span style={{ background:lang.color+"18", color:lang.color, borderRadius:8,
    padding:"3px 10px", fontSize:12, fontWeight:700 }}>{lang.name}</span>;
}

function SecLabel({ children }) {
  return <div style={{ fontSize:11, fontWeight:800, letterSpacing:2, textTransform:"uppercase",
    color:C.light, margin:"20px 0 8px" }}>{children}</div>;
}

function SmBadge({ children, color="#64748b", bg="#f1f5f9" }) {
  return <span style={{ background:bg, color, borderRadius:7, padding:"3px 9px", fontSize:12, fontWeight:600 }}>{children}</span>;
}

// ─── PHOTO CAPTURE ────────────────────────────────────────────────────────────
function PhotoCapture({ value, onChange }) {
  const fileRef = useRef(), camRef = useRef();
  const read = e => { const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>onChange(ev.target.result); r.readAsDataURL(f); };
  return value ? (
    <div style={{ position:"relative" }}>
      <img src={value} alt="foto" style={{ width:"100%", borderRadius:14, maxHeight:200, objectFit:"cover" }} />
      <button onClick={()=>onChange(null)} style={{ position:"absolute", top:10, right:10,
        background:C.danger, color:"#fff", border:"none", borderRadius:"50%",
        width:30, height:30, cursor:"pointer", fontWeight:900, fontSize:16 }}>×</button>
    </div>
  ) : (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
      {[{ref:camRef, capture:"environment", icon:"📷", label:"Kamera", col:C.blue, bg:C.lightBlue},
        {ref:fileRef, capture:null, icon:"🖼", label:"Galeri", col:C.muted, bg:C.bg}].map((b,i) => (
        <button key={i} onClick={()=>b.ref.current.click()} style={{
          border:`2px dashed ${b.col}`, background:b.bg, borderRadius:14, padding:"16px 8px",
          color:b.col, fontWeight:700, cursor:"pointer", fontSize:14, display:"flex",
          flexDirection:"column", alignItems:"center", gap:4 }}>
          <span style={{fontSize:24}}>{b.icon}</span>{b.label}
        </button>
      ))}
      <input ref={camRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={read} />
      <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={read} />
    </div>
  );
}

// ─── MEMBER LOOKUP ────────────────────────────────────────────────────────────
function MemberLookup({ members, onSelect }) {
  const [q, setQ] = useState("");
  const results = q.length>=2 ? members.filter(m =>
    m.name.toLowerCase().includes(q.toLowerCase()) || m.phone.includes(q)) : [];
  return (
    <div style={{ position:"relative" }}>
      <div style={{ position:"relative" }}>
        <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:18 }}>🔍</span>
        <input style={{...inp, paddingLeft:42}} value={q} onChange={e=>setQ(e.target.value)}
          placeholder="Ketik nama atau no. HP jemaat lama..." />
      </div>
      {results.length>0 && (
        <div style={{ position:"absolute", top:"110%", left:0, right:0, zIndex:50,
          background:C.surface, borderRadius:16, boxShadow:"0 8px 32px rgba(15,23,42,0.18)",
          border:`1px solid ${C.border}`, maxHeight:220, overflowY:"auto" }}>
          {results.map(m => (
            <div key={m.id} onClick={()=>{ onSelect(m); setQ(""); }}
              style={{ padding:"14px 16px", cursor:"pointer",
                borderBottom:`1px solid ${C.bg}`, display:"flex",
                justifyContent:"space-between", alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:700, color:C.primary, fontSize:15 }}>{m.name}</div>
                <div style={{ fontSize:13, color:C.muted }}>📞 {m.phone}</div>
              </div>
              <span style={{ fontSize:12, background:m.inCG?C.successBg:C.warnBg,
                color:m.inCG?C.success:C.warn, padding:"3px 10px", borderRadius:20, fontWeight:700 }}>
                {m.inCG?"CG ✓":"Non-CG"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SCREEN: PEMINJAMAN (list, form, return)
// ════════════════════════════════════════════════════════════════
function ScreenPeminjaman({ loans, setLoans, members, setMembers, equipment, locations, languages, stock, showToast }) {
  const [view, setView] = useState("list");
  const active = loans.filter(l => !l.returned);

  return (
    <div>
      {/* Sub-tabs as big pill buttons */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
        {[{id:"list",label:"📋 Riwayat"},{id:"form",label:"➕ Pinjam"},
          {id:"return",label:`↩️ Kembali${active.length?` (${active.length})`:""}`}
        ].map(t => (
          <button key={t.id} onClick={()=>setView(t.id)} style={{
            background:view===t.id?C.blue:C.surface,
            color:view===t.id?"#fff":C.muted,
            border:`1.5px solid ${view===t.id?C.blue:C.border}`,
            borderRadius:12, padding:"11px 4px", fontWeight:700, fontSize:12,
            cursor:"pointer", lineHeight:1.3 }}>{t.label}</button>
        ))}
      </div>

      {view==="list"   && <LoanList   loans={loans} equipment={equipment} languages={languages} />}
      {view==="form"   && <LoanForm   members={members} setMembers={setMembers} equipment={equipment}
        locations={locations} languages={languages} stock={stock}
        onSave={d=>{ setLoans(p=>[...p,d]); setView("list"); showToast("✅ Peminjaman dicatat!"); }}
        onCancel={()=>setView("list")} />}
      {view==="return" && <ReturnList loans={loans} equipment={equipment} languages={languages}
        onReturn={id=>{ setLoans(p=>p.map(l=>l.id===id?{...l,returned:true}:l)); showToast("✅ Alat dikembalikan!"); }} />}
    </div>
  );
}

function LoanList({ loans, equipment, languages }) {
  return (
    <div style={card}>
      <div style={{ fontWeight:800, fontSize:16, color:C.primary, marginBottom:14 }}>Riwayat Peminjaman</div>
      {loans.length===0 && <div style={{ color:C.light, textAlign:"center", padding:40 }}>Belum ada data.</div>}
      {[...loans].reverse().map(l => {
        const eq = equipment.find(e=>e.id===l.equipmentId);
        const lang = languages.find(x=>x.id===l.languageId);
        return (
          <div key={l.id} style={{ borderBottom:`1px solid ${C.bg}`, paddingBottom:14, marginBottom:14, opacity:l.returned?.55:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:15, color:C.primary }}>{l.name}</div>
                <div style={{ fontSize:13, color:C.muted, margin:"3px 0" }}>📞 {l.phone}</div>
                <div style={{ fontSize:12, color:C.light }}>{l.date} {l.time} · {l.service}</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:7 }}>
                  {lang && <LangBadge lang={lang} />}
                  <SmBadge>{eq?.name} ×{l.qty}</SmBadge>
                  <SmBadge color="#7c3aed" bg="#f5f3ff">{l.location}</SmBadge>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6, flexShrink:0 }}>
                <span style={{ fontSize:12, fontWeight:700, padding:"4px 10px", borderRadius:20,
                  background:l.returned?C.bg:C.warnBg, color:l.returned?C.light:C.warn }}>
                  {l.returned?"✅ Kembali":"⏳ Dipinjam"}
                </span>
                {l.inCG===false && (
                  <span style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:20,
                    background:l.followup?C.successBg:C.dangerBg,
                    color:l.followup?C.success:C.danger }}>
                    {l.followup?"FU ✓":"No FU"}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LoanForm({ members, setMembers, equipment, locations, languages, stock, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:"", phone:"", date:today, time:nowTime,
    service:"", officer:"", languageId:languages[0]?.id||"",
    equipmentId:equipment[0]?.id||"", qty:1, location:locations[0]||"",
    inCG:null, followup:null, photo:null
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const avail = stock[form.location]?.[form.equipmentId] ?? 0;
  const valid = form.name && form.phone && form.service && form.officer &&
    form.equipmentId && form.location && form.qty>=1 && form.qty<=avail && form.inCG!==null;

  const handleSave = () => {
    const existing = members.find(m=>m.phone===form.phone);
    let memberId;
    if (existing) { memberId=existing.id; setMembers(p=>p.map(m=>m.id===existing.id?{...m,name:form.name,inCG:form.inCG}:m)); }
    else { memberId=uid(); setMembers(p=>[...p,{id:memberId,name:form.name,phone:form.phone,inCG:form.inCG??false}]); }
    onSave({...form, memberId, id:uid(), returned:false});
  };

  return (
    <div style={card}>
      <div style={{ fontWeight:800, fontSize:17, color:C.primary, marginBottom:16 }}>📋 Form Peminjaman</div>

      <SecLabel>Cari Jemaat Lama</SecLabel>
      <MemberLookup members={members} onSelect={m=>setForm(p=>({...p,name:m.name,phone:m.phone,inCG:m.inCG}))} />

      <SecLabel>Waktu & Petugas</SecLabel>
      <Field label="Tanggal" required><input type="date" style={inp} value={form.date} onChange={e=>set("date",e.target.value)} /></Field>
      <Field label="Jam" required><input type="time" style={inp} value={form.time} onChange={e=>set("time",e.target.value)} /></Field>
      <Field label="Ibadah" required><input style={inp} value={form.service} onChange={e=>set("service",e.target.value)} placeholder="Contoh: Ibadah Pagi" /></Field>
      <Field label="Nama Petugas" required><input style={inp} value={form.officer} onChange={e=>set("officer",e.target.value)} placeholder="Nama petugas" /></Field>

      <SecLabel>Data Jemaat</SecLabel>
      <Field label="Nama Lengkap" required><input style={inp} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Nama jemaat" /></Field>
      <Field label="No. HP / WA" required><input style={inp} value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="08xx..." type="tel" /></Field>

      <SecLabel>Alat yang Dipinjam</SecLabel>
      <Field label="Bahasa" required>
        <select style={inp} value={form.languageId} onChange={e=>set("languageId",e.target.value)}>
          {languages.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </Field>
      <Field label="Jenis Alat" required>
        <select style={inp} value={form.equipmentId} onChange={e=>{set("equipmentId",e.target.value);set("qty",1);}}>
          {equipment.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </Field>
      <Field label="Lokasi Ambil" required>
        <select style={inp} value={form.location} onChange={e=>{set("location",e.target.value);set("qty",1);}}>
          {locations.map(l=><option key={l}>{l}</option>)}
        </select>
      </Field>
      {/* Stock indicator */}
      <div style={{ background:avail===0?C.dangerBg:avail<=2?C.warnBg:C.successBg,
        borderRadius:12, padding:"10px 14px", marginBottom:14,
        display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:14, fontWeight:600, color:avail===0?C.danger:avail<=2?C.warn:C.success }}>Stok tersedia di {form.location}</span>
        <span style={{ fontWeight:900, fontSize:22, color:avail===0?C.danger:avail<=2?C.warn:C.success }}>{avail}</span>
      </div>
      <Field label="Jumlah" required>
        <div style={{ display:"grid", gridTemplateColumns:"52px 1fr 52px", gap:8, alignItems:"center" }}>
          <button onClick={()=>set("qty",Math.max(1,form.qty-1))} style={{ height:52, background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:12, fontSize:22, cursor:"pointer", fontWeight:800 }}>−</button>
          <input type="number" min={1} max={avail} style={{...inp, textAlign:"center", fontWeight:800, fontSize:20}} value={form.qty} onChange={e=>set("qty",parseInt(e.target.value)||1)} />
          <button onClick={()=>set("qty",Math.min(avail,form.qty+1))} style={{ height:52, background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:12, fontSize:22, cursor:"pointer", fontWeight:800 }}>+</button>
        </div>
        {form.qty>avail && <div style={{color:C.danger,fontSize:13,marginTop:6}}>⚠️ Melebihi stok.</div>}
      </Field>

      <SecLabel>Foto KTP / Bukti</SecLabel>
      <PhotoCapture value={form.photo} onChange={v=>set("photo",v)} />

      <SecLabel>Cell Group (CG)</SecLabel>
      <div style={{ background:C.bg, borderRadius:16, padding:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:C.primary, marginBottom:12 }}>Sudah tergabung dalam CG?</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[{v:true,l:"✅ Sudah"},{v:false,l:"❌ Belum"}].map(o=>(
            <button key={String(o.v)} onClick={()=>{set("inCG",o.v); if(o.v) set("followup",null);}}
              style={{ border:`2px solid ${form.inCG===o.v?C.blue:C.border}`,
                background:form.inCG===o.v?C.lightBlue:C.surface,
                color:form.inCG===o.v?C.blue:C.muted,
                borderRadius:12, padding:"14px 8px", fontWeight:700, cursor:"pointer", fontSize:14 }}>
              {o.l}
            </button>
          ))}
        </div>
        {form.inCG===false && (
          <div style={{ marginTop:14 }}>
            <div style={{ fontSize:14, fontWeight:700, color:C.primary, marginBottom:10 }}>Bersedia di-follow up?</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[{v:true,l:"👍 Ya, bersedia"},{v:false,l:"👎 Tidak"}].map(o=>(
                <button key={String(o.v)} onClick={()=>set("followup",o.v)}
                  style={{ border:`2px solid ${form.followup===o.v?C.success:C.border}`,
                    background:form.followup===o.v?C.successBg:C.surface,
                    color:form.followup===o.v?C.success:C.muted,
                    borderRadius:12, padding:"14px 8px", fontWeight:700, cursor:"pointer", fontSize:14 }}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:10, marginTop:20 }}>
        <Btn variant="secondary" onClick={onCancel} full>Batal</Btn>
        <Btn onClick={handleSave} disabled={!valid} full>💾 Simpan</Btn>
      </div>
    </div>
  );
}

function ReturnList({ loans, equipment, languages, onReturn }) {
  const [search, setSearch] = useState("");
  const active = loans.filter(l => !l.returned && l.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={card}>
      <div style={{ fontWeight:800, fontSize:16, color:C.primary, marginBottom:14 }}>↩️ Pengembalian Alat</div>
      <div style={{ position:"relative", marginBottom:16 }}>
        <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", fontSize:18 }}>🔍</span>
        <input style={{...inp, paddingLeft:44}} placeholder="Cari nama jemaat..." value={search} onChange={e=>setSearch(e.target.value)} />
      </div>
      {active.length===0 && (
        <div style={{ textAlign:"center", padding:"32px 0", color:C.light, fontSize:15 }}>
          {search ? "Tidak ditemukan." : "🎉 Semua alat sudah dikembalikan!"}
        </div>
      )}
      {active.map(l => {
        const eq = equipment.find(e=>e.id===l.equipmentId);
        const lang = languages.find(x=>x.id===l.languageId);
        return (
          <div key={l.id} style={{ border:`1.5px solid ${C.border}`, borderRadius:16, padding:16, marginBottom:12 }}>
            <div style={{ display:"flex", justifyContent:"space-between", gap:10, marginBottom:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:16, color:C.primary }}>{l.name}</div>
                <div style={{ fontSize:13, color:C.muted, marginTop:2 }}>📞 {l.phone}</div>
                <div style={{ fontSize:12, color:C.light, marginTop:2 }}>{l.date} {l.time} · {l.service} · {l.officer}</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap", marginTop:8 }}>
                  {lang && <LangBadge lang={lang} />}
                  <SmBadge>{eq?.name} ×{l.qty}</SmBadge>
                  <SmBadge color="#7c3aed" bg="#f5f3ff">{l.location}</SmBadge>
                </div>
              </div>
              {l.photo && <img src={l.photo} alt="foto" style={{ width:56, height:56, borderRadius:12, objectFit:"cover", flexShrink:0 }} />}
            </div>
            <Btn variant="success" onClick={()=>onReturn(l.id)} full>✔ Tandai Sudah Dikembalikan</Btn>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SCREEN: STOK
// ════════════════════════════════════════════════════════════════
function ScreenStok({ equipment, setEquipment, locations, setLocations, baseStock, setBaseStock, loans, showToast }) {
  const [modal, setModal] = useState(null);
  const [log, setLog] = useState([]);
  const stock = useMemo(()=>computeStock(baseStock, loans), [baseStock, loans]);
  const addLog = e => setLog(p=>[...p,{...e,id:uid(),time:new Date().toLocaleString("id-ID")}]);

  const handleAddEq = ({name, qtys}) => {
    const id=uid();
    setEquipment(p=>[...p,{id,name}]);
    setBaseStock(p=>{ const n={...p}; locations.forEach(loc=>{n[loc]={...n[loc],[id]:qtys[loc]||0}}); return n; });
    addLog({desc:`Alat baru: "${name}"`}); setModal(null); showToast(`✅ "${name}" ditambahkan!`);
  };
  const handleEdit = ({eqId,loc,qty,note}) => {
    const eq=equipment.find(e=>e.id===eqId); const prev=baseStock[loc]?.[eqId]??0;
    setBaseStock(p=>({...p,[loc]:{...p[loc],[eqId]:qty}}));
    addLog({desc:`Edit "${eq?.name}" di ${loc}: ${prev}→${qty}`,note}); setModal(null); showToast("✅ Stok diperbarui!");
  };
  const handleTransfer = ({eqId,from,to,qty,note}) => {
    const eq=equipment.find(e=>e.id===eqId);
    setBaseStock(p=>({...p,[from]:{...p[from],[eqId]:(p[from]?.[eqId]??0)-qty},[to]:{...p[to],[eqId]:(p[to]?.[eqId]??0)+qty}}));
    addLog({desc:`Transfer "${eq?.name}": ${qty}× ${from}→${to}`,note}); setModal(null); showToast(`✅ Transfer berhasil!`);
  };
  const handleAddLoc = (name) => {
    if(locations.includes(name)){showToast("⚠️ Lokasi sudah ada!","warn");return;}
    setLocations(p=>[...p,name]);
    setBaseStock(p=>({...p,[name]:Object.fromEntries(equipment.map(e=>[e.id,0]))}));
    addLog({desc:`Lokasi baru: "${name}"`}); setModal(null); showToast(`✅ Lokasi ditambahkan!`);
  };

  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        {[{icon:"✏️",label:"Edit Stok",col:C.blue,bg:C.lightBlue,a:"edit"},
          {icon:"🔄",label:"Transfer",col:"#7c3aed",bg:"#f5f3ff",a:"transfer"},
          {icon:"➕",label:"Tambah Alat",col:C.success,bg:C.successBg,a:"addEq"},
          {icon:"📍",label:"Tambah Lokasi",col:C.warn,bg:C.warnBg,a:"addLoc"}
        ].map(b=>(
          <button key={b.a} onClick={()=>setModal(b.a)} style={{
            background:b.bg, color:b.col, border:`1.5px solid ${b.col}33`,
            borderRadius:14, padding:"16px 8px", fontWeight:800, fontSize:14,
            cursor:"pointer", display:"flex", flexDirection:"column",
            alignItems:"center", gap:5, minHeight:72 }}>
            <span style={{fontSize:22}}>{b.icon}</span>{b.label}
          </button>
        ))}
      </div>

      {/* Stock cards — one per equipment type, easier to read on mobile */}
      {equipment.map(eq => (
        <div key={eq.id} style={card}>
          <div style={{ fontWeight:800, fontSize:15, color:C.primary, marginBottom:12 }}>🎧 {eq.name}</div>
          {locations.map(loc => {
            const qty = stock[loc]?.[eq.id] ?? 0;
            const pct = Math.max(0, Math.min(100, (qty / (totalStock(stock, eq.id) || 1)) * 100));
            return (
              <div key={loc} style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:C.primary }}>{loc}</span>
                  <span style={{ fontWeight:900, fontSize:18, color:qty===0?C.danger:qty<=2?C.warn:C.success }}>{qty}</span>
                </div>
                <div style={{ background:C.bg, borderRadius:8, height:8 }}>
                  <div style={{ background:qty===0?C.danger:qty<=2?C.warn:C.success,
                    borderRadius:8, height:8, width:`${pct}%`, transition:"width .3s" }} />
                </div>
              </div>
            );
          })}
          <div style={{ borderTop:`1px solid ${C.bg}`, paddingTop:10, display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:13, color:C.muted, fontWeight:600 }}>Total semua lokasi</span>
            <span style={{ fontWeight:900, fontSize:18, color:C.blue }}>{totalStock(stock, eq.id)}</span>
          </div>
        </div>
      ))}

      {log.length>0 && (
        <div style={card}>
          <div style={{ fontWeight:800, fontSize:14, color:C.primary, marginBottom:12 }}>📋 Riwayat Perubahan</div>
          {[...log].reverse().slice(0,6).map(e=>(
            <div key={e.id} style={{ borderBottom:`1px solid ${C.bg}`, padding:"10px 0", fontSize:13 }}>
              <div style={{ fontWeight:700, color:C.primary }}>{e.desc}</div>
              <div style={{ fontSize:12, color:C.light }}>{e.time}</div>
              {e.note && <div style={{ color:C.muted, fontStyle:"italic", fontSize:12 }}>📝 {e.note}</div>}
            </div>
          ))}
        </div>
      )}

      {modal==="addEq"    && <StockSheetAddEq  locations={locations} onClose={()=>setModal(null)} onSave={handleAddEq} />}
      {modal==="edit"     && <StockSheetEdit   equipment={equipment} locations={locations} stock={stock} onClose={()=>setModal(null)} onSave={handleEdit} />}
      {modal==="transfer" && <StockSheetTransfer equipment={equipment} locations={locations} stock={stock} onClose={()=>setModal(null)} onSave={handleTransfer} />}
      {modal==="addLoc"   && <StockSheetAddLoc onClose={()=>setModal(null)} onSave={handleAddLoc} />}
    </div>
  );
}

function StockSheetAddEq({ locations, onClose, onSave }) {
  const [name, setName] = useState("");
  const [qtys, setQtys] = useState(Object.fromEntries(locations.map(l=>[l,0])));
  return (
    <Sheet title="➕ Tambah Alat Baru" onClose={onClose}>
      <Field label="Nama Alat" required><input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Nama alat..." /></Field>
      <div style={{ fontSize:13, fontWeight:700, color:C.muted, marginBottom:8 }}>Stok Awal per Lokasi</div>
      {locations.map(loc=>(
        <div key={loc} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", background:C.bg, borderRadius:12, marginBottom:8 }}>
          <span style={{ fontWeight:700, fontSize:14 }}>{loc}</span>
          <div style={{ display:"grid", gridTemplateColumns:"36px 60px 36px", gap:6, alignItems:"center" }}>
            <button onClick={()=>setQtys(p=>({...p,[loc]:Math.max(0,p[loc]-1)}))} style={{ height:36, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, fontSize:18, cursor:"pointer" }}>−</button>
            <input type="number" min={0} style={{...inp,padding:"7px",textAlign:"center",fontWeight:800}} value={qtys[loc]} onChange={e=>setQtys(p=>({...p,[loc]:parseInt(e.target.value)||0}))} />
            <button onClick={()=>setQtys(p=>({...p,[loc]:p[loc]+1}))} style={{ height:36, background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, fontSize:18, cursor:"pointer" }}>+</button>
          </div>
        </div>
      ))}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:10, marginTop:16 }}>
        <Btn variant="secondary" onClick={onClose} full>Batal</Btn>
        <Btn onClick={()=>onSave({name,qtys})} disabled={!name.trim()} full>Simpan</Btn>
      </div>
    </Sheet>
  );
}

function StockSheetEdit({ equipment, locations, stock, onClose, onSave }) {
  const [selEq,  setSelEq]  = useState(equipment[0]?.id||"");
  const [selLoc, setSelLoc] = useState(locations[0]||"");
  const [qty,    setQty]    = useState(stock[locations[0]]?.[equipment[0]?.id]??0);
  const [note,   setNote]   = useState("");
  const current = stock[selLoc]?.[selEq]??0;
  return (
    <Sheet title="✏️ Edit Stok" onClose={onClose}>
      <Field label="Jenis Alat"><select style={inp} value={selEq} onChange={e=>{setSelEq(e.target.value);setQty(stock[selLoc]?.[e.target.value]??0)}}>{equipment.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
      <Field label="Lokasi"><select style={inp} value={selLoc} onChange={e=>{setSelLoc(e.target.value);setQty(stock[e.target.value]?.[selEq]??0)}}>{locations.map(l=><option key={l}>{l}</option>)}</select></Field>
      <div style={{ background:C.bg, borderRadius:12, padding:"12px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:14, color:C.muted, fontWeight:600 }}>Stok saat ini</span>
        <span style={{ fontWeight:900, fontSize:24, color:C.blue }}>{current}</span>
      </div>
      <Field label="Jumlah Baru" required>
        <div style={{ display:"grid", gridTemplateColumns:"52px 1fr 52px", gap:8, alignItems:"center" }}>
          <button onClick={()=>setQty(Math.max(0,qty-1))} style={{ height:52,background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:12,fontSize:22,cursor:"pointer",fontWeight:800 }}>−</button>
          <input type="number" min={0} style={{...inp,textAlign:"center",fontWeight:800,fontSize:20}} value={qty} onChange={e=>setQty(parseInt(e.target.value)||0)} />
          <button onClick={()=>setQty(qty+1)} style={{ height:52,background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:12,fontSize:22,cursor:"pointer",fontWeight:800 }}>+</button>
        </div>
      </Field>
      <Field label="Catatan"><input style={inp} value={note} placeholder="Alasan perubahan..." onChange={e=>setNote(e.target.value)} /></Field>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:10, marginTop:16 }}>
        <Btn variant="secondary" onClick={onClose} full>Batal</Btn>
        <Btn onClick={()=>onSave({eqId:selEq,loc:selLoc,qty,note})} full>Simpan</Btn>
      </div>
    </Sheet>
  );
}

function StockSheetTransfer({ equipment, locations, stock, onClose, onSave }) {
  const [selEq, setSelEq] = useState(equipment[0]?.id||"");
  const [from,  setFrom]  = useState(locations[0]||"");
  const [to,    setTo]    = useState(locations[1]||"");
  const [qty,   setQty]   = useState(1);
  const [note,  setNote]  = useState("");
  const avail = stock[from]?.[selEq]??0;
  const valid = from!==to && qty>=1 && qty<=avail;
  return (
    <Sheet title="🔄 Transfer Alat" onClose={onClose}>
      <Field label="Jenis Alat"><select style={inp} value={selEq} onChange={e=>{setSelEq(e.target.value);setQty(1)}}>{equipment.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></Field>
      <Field label="Dari Lokasi"><select style={inp} value={from} onChange={e=>{setFrom(e.target.value);setQty(1)}}>{locations.map(l=><option key={l}>{l}</option>)}</select></Field>
      <Field label="Ke Lokasi"><select style={inp} value={to} onChange={e=>setTo(e.target.value)}>{locations.filter(l=>l!==from).map(l=><option key={l}>{l}</option>)}</select></Field>
      <div style={{ background:avail===0?C.dangerBg:C.successBg, borderRadius:12, padding:"10px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:14, fontWeight:600, color:avail===0?C.danger:C.success }}>Tersedia di {from}</span>
        <span style={{ fontWeight:900, fontSize:22, color:avail===0?C.danger:C.success }}>{avail}</span>
      </div>
      <Field label="Jumlah">
        <div style={{ display:"grid", gridTemplateColumns:"52px 1fr 52px", gap:8, alignItems:"center" }}>
          <button onClick={()=>setQty(Math.max(1,qty-1))} style={{ height:52,background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:12,fontSize:22,cursor:"pointer",fontWeight:800 }}>−</button>
          <input type="number" min={1} max={avail} style={{...inp,textAlign:"center",fontWeight:800,fontSize:20}} value={qty} onChange={e=>setQty(parseInt(e.target.value)||1)} />
          <button onClick={()=>setQty(Math.min(avail,qty+1))} style={{ height:52,background:C.bg,border:`1.5px solid ${C.border}`,borderRadius:12,fontSize:22,cursor:"pointer",fontWeight:800 }}>+</button>
        </div>
      </Field>
      <Field label="Catatan"><input style={inp} value={note} placeholder="Opsional..." onChange={e=>setNote(e.target.value)} /></Field>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:10, marginTop:16 }}>
        <Btn variant="secondary" onClick={onClose} full>Batal</Btn>
        <Btn onClick={()=>onSave({eqId:selEq,from,to,qty,note})} disabled={!valid} full>🔄 Transfer</Btn>
      </div>
    </Sheet>
  );
}

function StockSheetAddLoc({ onClose, onSave }) {
  const [name, setName] = useState("");
  return (
    <Sheet title="📍 Tambah Lokasi" onClose={onClose}>
      <Field label="Nama Lokasi" required><input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Contoh: Ruang Doa" /></Field>
      <div style={{ background:C.bg, borderRadius:12, padding:"12px 14px", fontSize:14, color:C.muted, marginBottom:16 }}>Stok awal 0. Isi lewat Edit Stok setelahnya.</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:10 }}>
        <Btn variant="secondary" onClick={onClose} full>Batal</Btn>
        <Btn onClick={()=>onSave(name.trim())} disabled={!name.trim()} full>Tambah</Btn>
      </div>
    </Sheet>
  );
}

// ════════════════════════════════════════════════════════════════
//  SCREEN: BAHASA
// ════════════════════════════════════════════════════════════════
function ScreenBahasa({ languages, setLanguages, showToast }) {
  const [sheet, setSheet] = useState(null);
  const [form, setForm] = useState({ name:"", color:PRESET_COLORS[0] });

  const openAdd  = ()      => { setForm({name:"",color:PRESET_COLORS[0]}); setSheet("add"); };
  const openEdit = (lang)  => { setForm({name:lang.name,color:lang.color}); setSheet({edit:lang}); };

  const save = () => {
    if(!form.name.trim()) return;
    if(sheet==="add") { setLanguages(p=>[...p,{id:uid(),name:form.name.trim(),color:form.color}]); showToast("✅ Bahasa ditambahkan!"); }
    else { setLanguages(p=>p.map(l=>l.id===sheet.edit.id?{...l,name:form.name.trim(),color:form.color}:l)); showToast("✅ Diperbarui!"); }
    setSheet(null);
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
        <div style={{ fontWeight:800, fontSize:16, color:C.primary }}>Pilihan Bahasa</div>
        <Btn onClick={openAdd} style={{ padding:"10px 18px" }}>+ Tambah</Btn>
      </div>
      <div style={card}>
        {languages.map(lang=>(
          <div key={lang.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 0", borderBottom:`1px solid ${C.bg}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <span style={{ width:18, height:18, borderRadius:"50%", background:lang.color, display:"inline-block", flexShrink:0 }} />
              <span style={{ fontWeight:700, color:C.primary, fontSize:16 }}>{lang.name}</span>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <Btn variant="secondary" onClick={()=>openEdit(lang)} style={{ padding:"8px 14px", fontSize:14 }}>✏️</Btn>
              <Btn variant="danger"    onClick={()=>{ setLanguages(p=>p.filter(l=>l.id!==lang.id)); showToast("🗑 Dihapus","warn"); }} style={{ padding:"8px 14px", fontSize:14 }}>🗑</Btn>
            </div>
          </div>
        ))}
        {languages.length===0 && <div style={{textAlign:"center",color:C.light,padding:40}}>Belum ada bahasa.</div>}
      </div>

      {sheet && (
        <Sheet title={sheet==="add"?"➕ Tambah Bahasa":"✏️ Edit Bahasa"} onClose={()=>setSheet(null)}>
          <Field label="Nama Bahasa" required>
            <input style={inp} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Contoh: Jepang" />
          </Field>
          <Field label="Warna Label">
            <div style={{ display:"grid", gridTemplateColumns:"repeat(8,1fr)", gap:10 }}>
              {PRESET_COLORS.map(c=>(
                <button key={c} onClick={()=>setForm(p=>({...p,color:c}))} style={{
                  width:"100%", aspectRatio:"1", borderRadius:"50%", background:c,
                  border:form.color===c?"4px solid #0f172a":"4px solid transparent",
                  cursor:"pointer", outline:"none" }} />
              ))}
            </div>
            <div style={{ marginTop:12 }}><LangBadge lang={{name:form.name||"Preview",color:form.color}} /></div>
          </Field>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 2fr", gap:10, marginTop:18 }}>
            <Btn variant="secondary" onClick={()=>setSheet(null)} full>Batal</Btn>
            <Btn onClick={save} disabled={!form.name.trim()} full>Simpan</Btn>
          </div>
        </Sheet>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  SCREEN: SETTING
// ════════════════════════════════════════════════════════════════
function ScreenSetting({ churchName, setChurchName, showToast }) {
  const [name,  setName]  = useState(churchName);
  const [title, setTitle] = useState("Layanan Interpreter — Alat");
  return (
    <div>
      <div style={{ fontWeight:800, fontSize:16, color:C.primary, marginBottom:14 }}>Pengaturan Aplikasi</div>
      <div style={card}>
        <SecLabel>Identitas Gereja</SecLabel>
        <Field label="Nama Gereja">
          <input style={inp} value={name} onChange={e=>setName(e.target.value)} placeholder="Nama gereja..." />
        </Field>
        <Field label="Judul Aplikasi">
          <input style={inp} value={title} onChange={e=>setTitle(e.target.value)} placeholder="Judul aplikasi..." />
        </Field>
        {/* Preview */}
        <div style={{ background:`linear-gradient(135deg,${C.navy},${C.blue})`, borderRadius:16,
          padding:"16px 18px", margin:"16px 0", color:"#fff" }}>
          <div style={{ fontSize:9, letterSpacing:3, textTransform:"uppercase", opacity:.65, fontWeight:700 }}>Preview</div>
          <div style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase", opacity:.75, fontWeight:700, marginTop:8 }}>{name||"Nama Gereja"}</div>
          <div style={{ fontSize:17, fontWeight:900 }}>{title||"Judul App"}</div>
        </div>
        <Btn onClick={()=>{ setChurchName(name.trim()||"Gereja"); showToast("✅ Pengaturan disimpan!"); }} full>💾 Simpan Pengaturan</Btn>
      </div>

      <div style={card}>
        <SecLabel>Tentang Aplikasi</SecLabel>
        {[["Versi","1.0.0"],["Modul","Peminjaman Alat"],["Platform","Web / Mobile PWA"]].map(([k,v])=>(
          <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"12px 0", borderBottom:`1px solid ${C.bg}`, fontSize:14 }}>
            <span style={{ color:C.muted }}>{k}</span>
            <span style={{ fontWeight:700, color:C.primary }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
//  ROOT — bottom nav like a real mobile app
// ════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("pinjam");
  const [churchName, setChurchName] = useState("Gereja Bethel Indonesia");
  const [equipment,  setEquipment]  = useState(INIT_EQUIPMENT);
  const [locations,  setLocations]  = useState(INIT_LOCATIONS);
  const [baseStock,  setBaseStock]  = useState(INIT_STOCK);
  const [languages,  setLanguages]  = useState(INIT_LANGUAGES);
  const [members,    setMembers]    = useState(INIT_MEMBERS);
  const [loans,      setLoans]      = useState(INIT_LOANS);
  const [toast,      setToast]      = useState(null);

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };
  const stock = useMemo(()=>computeStock(baseStock, loans), [baseStock, loans]);
  const activeCount = loans.filter(l=>!l.returned).length;

  const TABS = [
    { id:"pinjam", icon:"🎧", label:"Pinjam",  badge:activeCount||null },
    { id:"stok",   icon:"📦", label:"Stok"   },
    { id:"bahasa", icon:"🌐", label:"Bahasa" },
    { id:"setting",icon:"⚙️", label:"Setting"},
  ];

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:C.bg,
      minHeight:"100vh", paddingBottom:80 }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${C.navy} 0%,#1d4ed8 100%)`,
        padding:"18px 18px 16px", color:"#fff",
        boxShadow:"0 4px 20px rgba(15,23,42,0.22)", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ fontSize:10, letterSpacing:3, textTransform:"uppercase", opacity:.65, fontWeight:700 }}>{churchName}</div>
        <div style={{ fontSize:18, fontWeight:900, letterSpacing:-.3 }}>Layanan Interpreter — Alat</div>
      </div>

      {/* Content */}
      <div style={{ padding:"16px 14px", maxWidth:520, margin:"0 auto" }}>
        {tab==="pinjam"  && <ScreenPeminjaman loans={loans} setLoans={setLoans} members={members} setMembers={setMembers} equipment={equipment} locations={locations} languages={languages} stock={stock} showToast={showToast} />}
        {tab==="stok"    && <ScreenStok equipment={equipment} setEquipment={setEquipment} locations={locations} setLocations={setLocations} baseStock={baseStock} setBaseStock={setBaseStock} loans={loans} showToast={showToast} />}
        {tab==="bahasa"  && <ScreenBahasa languages={languages} setLanguages={setLanguages} showToast={showToast} />}
        {tab==="setting" && <ScreenSetting churchName={churchName} setChurchName={setChurchName} showToast={showToast} />}
      </div>

      {/* Bottom Navigation — like a real mobile app */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, zIndex:20,
        background:C.surface, borderTop:`1px solid ${C.border}`,
        display:"flex", paddingBottom:"env(safe-area-inset-bottom,8px)",
        boxShadow:"0 -4px 20px rgba(15,23,42,0.1)" }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            flex:1, border:"none", background:"transparent", padding:"10px 4px 6px",
            cursor:"pointer", display:"flex", flexDirection:"column",
            alignItems:"center", gap:2, position:"relative" }}>
            <span style={{ fontSize:24, lineHeight:1 }}>{t.icon}</span>
            <span style={{ fontSize:11, fontWeight:700,
              color:tab===t.id?C.blue:C.light }}>{t.label}</span>
            {/* Active indicator */}
            {tab===t.id && <span style={{ position:"absolute", top:0, left:"25%", right:"25%",
              height:3, background:C.blue, borderRadius:"0 0 4px 4px" }} />}
            {/* Badge */}
            {t.badge>0 && <span style={{ position:"absolute", top:6, right:"22%",
              background:C.danger, color:"#fff", borderRadius:"50%",
              width:18, height:18, fontSize:10, fontWeight:900,
              display:"flex", alignItems:"center", justifyContent:"center" }}>{t.badge}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
