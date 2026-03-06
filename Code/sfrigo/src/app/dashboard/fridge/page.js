"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ArrowLeft, Trash2, X, ChevronDown, Users } from "lucide-react";

import { globalStyles } from "./layout";
const MOCK_FRIDGE = { id: "f1", name: "Frigo di Casa", ownerUid: "user_001" };
const MOCK_MEMBERS = [
  { uid: "user_001", name: "Marco R.", role: "owner", initial: "M" },
  { uid: "user_002", name: "Sara B.", role: "member", initial: "S" },
  { uid: "user_003", name: "Luca M.", role: "member", initial: "L" },
];
const CATEGORIES = ["Latticini", "Verdura", "Frutta", "Carne", "Pesce", "Bevande", "Condimenti", "Avanzi", "Altro"];
const MOCK_INGREDIENTS = [
  { id: "i1", name: "Mozzarella", owner: "Marco R.", category: "Latticini", qty: "2 pz", expiry: "2025-06-10", notes: "Fresca, da usare subito" },
  { id: "i2", name: "Spinaci", owner: "Sara B.", category: "Verdura", qty: "300 g", expiry: "2025-06-08", notes: "" },
  { id: "i3", name: "Latte", owner: "Marco R.", category: "Latticini", qty: "1 L", expiry: "2025-06-15", notes: "Parzialmente scremato" },
  { id: "i4", name: "Pollo", owner: "Luca M.", category: "Carne", qty: "500 g", expiry: "2025-06-07", notes: "Già marinato" },
  { id: "i5", name: "Yogurt", owner: "Sara B.", category: "Latticini", qty: "4 pz", expiry: "2025-06-20", notes: "" },
  { id: "i6", name: "Carote", owner: "Marco R.", category: "Verdura", qty: "6 pz", expiry: "2025-06-25", notes: "" },
  { id: "i7", name: "Succo Arancia", owner: "Luca M.", category: "Bevande", qty: "500 ml", expiry: "2025-06-12", notes: "Senza zuccheri aggiunti" },
];
const CATEGORY_COLORS = {
  "Latticini": { bg: "rgba(200,224,110,0.18)", text: "#2D4A2D", dot: "#C8E06E" },
  "Verdura": { bg: "rgba(107,140,107,0.18)", text: "#1A3320", dot: "#6B8C6B" },
  "Frutta": { bg: "rgba(196,98,45,0.14)", text: "#7a3010", dot: "#C4622D" },
  "Carne": { bg: "rgba(180,60,60,0.13)", text: "#7a2020", dot: "#b43c3c" },
  "Pesce": { bg: "rgba(80,140,180,0.14)", text: "#1a4060", dot: "#508cb4" },
  "Bevande": { bg: "rgba(45,74,45,0.12)", text: "#1A3320", dot: "#2D4A2D" },
  "Condimenti": { bg: "rgba(168,197,168,0.22)", text: "#2D4A2D", dot: "#A8C5A8" },
  "Avanzi": { bg: "rgba(90,90,82,0.12)", text: "#3a3a34", dot: "#5A5A52" },
  "Altro": { bg: "rgba(214,208,196,0.35)", text: "#5A5A52", dot: "#D6D0C4" },
};

function daysUntilExpiry(d) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(d) - t) / 86400000);
}
function expiryStyle(days) {
  if (days < 0) return { bg: "rgba(180,60,60,0.13)", color: "#b43c3c", label: "Scaduto" };
  if (days <= 2) return { bg: "rgba(196,98,45,0.15)", color: "#C4622D", label: `${days}g` };
  if (days <= 5) return { bg: "rgba(200,180,60,0.15)", color: "#7a6010", label: `${days}g` };
  return { bg: "rgba(107,140,107,0.15)", color: "#2D4A2D", label: `${days}g` };
}
function ExpiryBadge({ dateStr }) {
  const s = expiryStyle(daysUntilExpiry(dateStr));
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 100,
      fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.04em",
      background: s.bg, color: s.color, whiteSpace: "nowrap"
    }}>
      {s.label}
    </span>
  );
}

function AddModal({ members, onClose, onAdd }) {
  const [f, setF] = useState({ name: "", owner: members[0].name, category: CATEGORIES[0], qty: "", expiry: "", notes: "" });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.qty.trim() || !f.expiry) return;
    onAdd({ ...f, id: "i" + Date.now() });
    onClose();
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.75rem", fontWeight: 700, color: "var(--forest)" }}>Aggiungi Alimento</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mid)", display: "flex", padding: 4 }}><X size={17} strokeWidth={1.75} /></button>
        </div>
        <form onSubmit={submit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "13px 11px" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Nome Alimento *</label>
              <input className="input-field" type="text" required autoFocus placeholder="es. Mozzarella" value={f.name} onChange={e => s("name", e.target.value)} />
            </div>
            <div>
              <label>Proprietario</label>
              <select className="input-field" value={f.owner} onChange={e => s("owner", e.target.value)}>
                {members.map(m => <option key={m.uid}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label>Categoria</label>
              <select className="input-field" value={f.category} onChange={e => s("category", e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label>Quantità *</label>
              <input className="input-field" type="text" required placeholder="es. 200 g" value={f.qty} onChange={e => s("qty", e.target.value)} />
            </div>
            <div>
              <label>Data scadenza *</label>
              <input className="input-field" type="date" required value={f.expiry} onChange={e => s("expiry", e.target.value)} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Note</label>
              <textarea className="input-field" rows={2} placeholder="Facoltativo…" value={f.notes} onChange={e => s("notes", e.target.value)} style={{ resize: "vertical", minHeight: 54 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px", background: "transparent", color: "var(--mid)", fontFamily: "'DM Sans',sans-serif", fontSize: "0.88rem", border: "1.5px solid rgba(45,74,45,0.15)", borderRadius: 10, cursor: "pointer" }}>Annulla</button>
            <button type="submit" style={{ flex: 2, padding: "11px", background: "var(--forest)", color: "var(--lime)", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: "0.9rem", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--moss)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--forest)"}
            ><Plus size={14} strokeWidth={2} /> Aggiungi</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ ingredient, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 370 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(180,60,60,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Trash2 size={20} color="#b43c3c" strokeWidth={1.75} />
          </div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--forest)", marginBottom: 9 }}>Elimina Alimento</h3>
          <p style={{ color: "var(--mid)", fontSize: "0.86rem", lineHeight: 1.65 }}>
            Sei sicuro di voler eliminare <strong style={{ color: "var(--forest)" }}>{ingredient.name}</strong>? L&apos;operazione non può essere annullata.
          </p>
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "transparent", color: "var(--mid)", fontFamily: "'DM Sans',sans-serif", fontSize: "0.88rem", border: "1.5px solid rgba(45,74,45,0.15)", borderRadius: 10, cursor: "pointer" }}>Annulla</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "11px", background: "#b43c3c", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: "0.9rem", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#8a2a2a"}
            onMouseLeave={e => e.currentTarget.style.background = "#b43c3c"}
          ><Trash2 size={13} strokeWidth={2} /> Elimina</button>
        </div>
      </div>
    </div>
  );
}

function MembersList({ members }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--forest)" }}>Membri</h2>
        <span style={{ padding: "2px 9px", borderRadius: 100, background: "rgba(45,74,45,0.08)", color: "var(--moss)", fontSize: "0.9rem", fontWeight: 500 }}>{members.length}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {members.map(m => (
          <div key={m.uid} className="member-pill">
            <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: m.role === "owner" ? "var(--forest)" : "rgba(107,140,107,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: m.role === "owner" ? "var(--lime)" : "var(--sage)" }}>{m.initial}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.84rem", color: "var(--forest)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--mid)", letterSpacing: "0.05em", textTransform: "uppercase" }}>{m.role === "owner" ? "Proprietario" : "Membro"}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22, paddingTop: 14, borderTop: "1px solid rgba(45,74,45,0.08)" }}>
        <div style={{ fontSize: "0.65rem", color: "var(--mid)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 9 }}>Legenda scadenza</div>
        {[{ color: "#b43c3c", label: "Scaduto" }, { color: "#C4622D", label: "≤ 2 giorni" }, { color: "#7a6010", label: "≤ 5 giorni" }, { color: "#2D4A2D", label: "Ok" }].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: "0.77rem", color: "var(--mid)" }}>{label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

function IngRow({ ing, delay, isOpen, onToggle, onDelete }) {
  const cat = CATEGORY_COLORS[ing.category] || CATEGORY_COLORS["Altro"];
  const details = [
    { label: "Alimento", val: ing.name },
    { label: "Proprietario", val: ing.owner },
    { label: "Categoria", val: ing.category },
    { label: "Quantità", val: ing.qty },
    { label: "Scadenza", val: ing.expiry },
  ];
  return (
    <div className={`ing-wrapper scale-in delay-${delay}${isOpen ? " open" : ""}`}>
      <button className="ing-row" onClick={onToggle}>
        {/* Name + category */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: cat.dot, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.94rem", fontWeight: 700, color: "var(--forest)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ing.name}</div>
            <span style={{ fontSize: "0.63rem", fontWeight: 500, letterSpacing: "0.05em", padding: "2px 7px", borderRadius: 100, background: cat.bg, color: cat.text, display: "inline-block", marginTop: 2 }}>{ing.category}</span>
          </div>
        </div>

        {/* Qty — desktop */}
        <div className="col-qty-desk" style={{ fontSize: "0.83rem", color: "var(--ink)", fontWeight: 500, textAlign: "right" }}>{ing.qty}</div>

        {/* Expiry badge — desktop */}
        <div className="col-exp-desk" style={{ display: "flex", justifyContent: "flex-end" }}><ExpiryBadge dateStr={ing.expiry} /></div>

        {/* Qty + expiry stacked — mobile */}
        <div className="col-mob-stack" style={{ flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
          <span style={{ fontSize: "0.8rem", color: "var(--ink)", fontWeight: 500 }}>{ing.qty}</span>
          <ExpiryBadge dateStr={ing.expiry} />
        </div>

        {/* Chevron */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronDown size={15} strokeWidth={2} className="chevron" />
        </div>
      </button>

      {isOpen && (
        <div className="ing-detail">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: "11px 18px", marginBottom: ing.notes ? 12 : 0 }}>
            {details.map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontSize: "0.6rem", color: "var(--mint)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: "0.86rem", color: "var(--cream)", lineHeight: 1.4 }}>{val}</div>
              </div>
            ))}
          </div>
          {ing.notes && (
            <div style={{ paddingTop: 11, borderTop: "1px solid rgba(168,197,168,0.15)" }}>
              <div style={{ fontSize: "0.6rem", color: "var(--mint)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 3 }}>Note</div>
              <div style={{ fontSize: "0.83rem", color: "rgba(245,240,232,0.72)", fontStyle: "italic", lineHeight: 1.55 }}>{ing.notes}</div>
            </div>
          )}
          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={e => { e.stopPropagation(); onDelete(ing); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 15px", background: "rgba(180,60,60,0.16)", color: "#ef9090", fontFamily: "'DM Sans',sans-serif", fontSize: "0.81rem", fontWeight: 500, border: "1px solid rgba(180,60,60,0.26)", borderRadius: 100, cursor: "pointer", transition: "background 0.18s" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(180,60,60,0.3)"; e.currentTarget.style.color = "#fca5a5"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(180,60,60,0.16)"; e.currentTarget.style.color = "#ef9090"; }}
            >
              <Trash2 size={12} strokeWidth={1.75} /> Elimina Alimento
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FridgePage() {
  const fridge = MOCK_FRIDGE;
  const [members] = useState(MOCK_MEMBERS);
  const [ingredients, setIngredients] = useState(MOCK_INGREDIENTS);
  const [openId, setOpenId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [mobMembersOpen, setMobMembersOpen] = useState(false);

  const toggle = (id) => setOpenId(p => p === id ? null : id);
  const handleAdd = (item) => setIngredients(p => [item, ...p]);
  const handleDelete = () => {
    setIngredients(p => p.filter(i => i.id !== toDelete.id));
    if (openId === toDelete.id) setOpenId(null);
    setToDelete(null);
  };

  return (
    <>
      <style>{globalStyles}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(245,240,232,0.92)", backdropFilter: "blur(18px)", borderBottom: "1px solid rgba(45,74,45,0.08)", padding: "0 clamp(14px,4vw,44px)", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "50%", border: "1.5px solid rgba(45,74,45,0.15)", color: "var(--mid)", textDecoration: "none", transition: "border-color 0.2s, color 0.2s", flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--moss)"; e.currentTarget.style.color = "var(--forest)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(45,74,45,0.15)"; e.currentTarget.style.color = "var(--mid)"; }}
          ><ArrowLeft size={14} strokeWidth={1.75} /></Link>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--forest)" }}>Sfrigo</span>
        </div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", color: "var(--forest)", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "center" }}>{fridge.name}</div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus size={14} strokeWidth={2.25} /> Aggiungi Alimento
        </button>
      </header>

      <div className="page-grid">
        <aside className="desktop-sidebar fade-up" style={{ background: "#fff", border: "1.5px solid rgba(45,74,45,0.09)", borderRadius: 18, padding: "20px 17px", position: "sticky", top: 76 }}>
          <MembersList members={members} />
        </aside>

        <section>
          <div className="fade-up" style={{ marginBottom: 20 }}>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.65rem,4vw,2.4rem)", fontWeight: 900, color: "var(--forest)", lineHeight: 1.06, letterSpacing: "-0.02em" }}>{fridge.name}</h1>
            <p style={{ color: "var(--mid)", fontSize: "0.82rem", marginTop: 4 }}>{ingredients.length} {ingredients.length === 1 ? "Alimento" : "alimenti"} · clicca per i dettagli</p>
          </div>

          {/* Mobile members drawer */}
          <div className="show-mobile" style={{ display: "none" }}>
            <div className="mob-drawer">
              <button className="mob-drawer-btn" onClick={() => setMobMembersOpen(o => !o)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Users size={13} strokeWidth={1.75} color="var(--sage)" />
                  <span style={{ fontFamily: "'Playfair Display',serif", fontSize: "0.93rem", fontWeight: 700, color: "var(--forest)" }}>Membri ({members.length})</span>
                </div>
                <ChevronDown size={14} strokeWidth={2} color="var(--sage)" style={{ transition: "transform 0.2s", transform: mobMembersOpen ? "rotate(180deg)" : "none" }} />
              </button>
              {mobMembersOpen && (
                <div style={{ padding: "4px 16px 16px" }}>
                  <MembersList members={members} />
                </div>
              )}
            </div>
          </div>

          {/* Column headers — desktop */}
          <div className="col-headers-row" style={{ marginBottom: 7 }}>
            {["Alimento", "Quantità", "Scadenza", ""].map((h, i) => (
              <div key={i} style={{ fontSize: "0.65rem", color: "var(--mid)", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: i > 0 ? "right" : "left" }}>{h}</div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ingredients.length === 0 ? (
              <div style={{ padding: "52px 24px", textAlign: "center", border: "1.5px dashed rgba(45,74,45,0.18)", borderRadius: 14 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.15rem", color: "var(--forest)", marginBottom: 7 }}>Frigo vuoto</div>
                <p style={{ color: "var(--mid)", fontSize: "0.83rem", marginBottom: 16 }}>Aggiungi il primo Alimento per iniziare.</p>
                <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={13} strokeWidth={2} /> Aggiungi Alimento</button>
              </div>
            ) : (
              ingredients.map((ing, i) => (
                <IngRow key={ing.id} ing={ing} delay={Math.min(i + 1, 8)} isOpen={openId === ing.id} onToggle={() => toggle(ing.id)} onDelete={setToDelete} />
              ))
            )}
          </div>
        </section>
      </div>

      {showAdd && <AddModal members={members} onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {toDelete && <DeleteModal ingredient={toDelete} onClose={() => setToDelete(null)} onConfirm={handleDelete} />}
    </>
  );
}