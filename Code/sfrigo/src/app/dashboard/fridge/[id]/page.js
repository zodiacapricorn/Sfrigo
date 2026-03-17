"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, ArrowLeft, Trash2, X, ChevronDown, Users, UserPlus, Link2, Check, Copy } from "lucide-react";
import { globalStyles } from "./layout";
import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Latticini", "Verdura", "Frutta", "Carne", "Pesce", "Bevande", "Condimenti", "Avanzi", "Altro"];
const CATEGORY_COLORS = {
  "Latticini":  { bg: "rgba(200,224,110,0.18)", text: "#2D4A2D", dot: "#C8E06E" },
  "Verdura":    { bg: "rgba(107,140,107,0.18)", text: "#1A3320", dot: "#6B8C6B" },
  "Frutta":     { bg: "rgba(196,98,45,0.14)",   text: "#7a3010", dot: "#C4622D" },
  "Carne":      { bg: "rgba(180,60,60,0.13)",   text: "#7a2020", dot: "#b43c3c" },
  "Pesce":      { bg: "rgba(80,140,180,0.14)",  text: "#1a4060", dot: "#508cb4" },
  "Bevande":    { bg: "rgba(45,74,45,0.12)",    text: "#1A3320", dot: "#2D4A2D" },
  "Condimenti": { bg: "rgba(168,197,168,0.22)", text: "#2D4A2D", dot: "#A8C5A8" },
  "Avanzi":     { bg: "rgba(90,90,82,0.12)",    text: "#3a3a34", dot: "#5A5A52" },
  "Altro":      { bg: "rgba(214,208,196,0.35)", text: "#5A5A52", dot: "#D6D0C4" },
};

function daysUntilExpiry(d) {
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(d) - t) / 86400000);
}
function expiryStyle(days) {
  if (days < 0)  return { bg: "rgba(180,60,60,0.13)",  color: "#b43c3c", label: "Scaduto" };
  if (days <= 2) return { bg: "rgba(196,98,45,0.15)",  color: "#C4622D", label: `${days}g` };
  if (days <= 5) return { bg: "rgba(200,180,60,0.15)", color: "#7a6010", label: `${days}g` };
  return           { bg: "rgba(107,140,107,0.15)", color: "#2D4A2D", label: `${days}g` };
}
function ExpiryBadge({ dateStr }) {
  const s = expiryStyle(daysUntilExpiry(dateStr));
  return (
    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 100, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.04em", background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

// ── Normalizza un alimento dall'API al formato usato nel componente ─────────
function normalizeItem(item) {
  const id = item._id?.$oid || item._id?.toString() || item._id || item.id;
  return {
    id,
    name:     item.name,
    owner:    item.owner_id || item.owner || "",
    category: item.category || "Altro",
    qty:      item.quantity != null
                ? `${item.quantity} ${item.unit || ""}`.trim()
                : (item.qty || ""),
    expiry:   item.expiration_date
                ? new Date(item.expiration_date).toISOString().split("T")[0]
                : (item.expiry || ""),
    notes:    item.notes || "",
  };
}

// ── Modals ──────────────────────────────────────────────────────────────────

function AddModal({ members, onClose, onAdd }) {
  const [f, setF] = useState({
    name: "", owner: members[0]?.uid || "", category: CATEGORIES[0],
    quantity: "", unit: "pz", expiration_date: "", notes: ""
  });
  const s = (k, v) => setF(p => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.quantity || !f.expiration_date) return;
    await onAdd(f);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.9rem", fontWeight: 700, color: "var(--forest)" }}>Aggiungi Alimento</h3>
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
                {members.map(m => <option key={m.uid} value={m.uid}>{m.name}</option>)}
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
              <input className="input-field" type="number" required placeholder="es. 200" value={f.quantity} onChange={e => s("quantity", e.target.value)} />
            </div>
            <div>
              <label>Unità</label>
              <select className="input-field" value={f.unit} onChange={e => s("unit", e.target.value)}>
                {["pz", "g", "kg", "ml", "L", "fette"].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label>Data scadenza *</label>
              <input className="input-field" type="date" required value={f.expiration_date} onChange={e => s("expiration_date", e.target.value)} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label>Note</label>
              <textarea className="input-field" rows={2} placeholder="Facoltativo…" value={f.notes} onChange={e => s("notes", e.target.value)} style={{ resize: "vertical", minHeight: 54 }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 9, marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "13px", background: "transparent", color: "var(--mid)", fontFamily: "'DM Sans',sans-serif", fontSize: "0.92rem", border: "1.5px solid rgba(45,74,45,0.15)", borderRadius: 10, cursor: "pointer" }}>Annulla</button>
            <button type="submit" style={{ flex: 2, padding: "13px", background: "var(--forest)", color: "var(--lime)", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: "0.95rem", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--moss)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--forest)"}
            ><Plus size={14} strokeWidth={2} /> Aggiungi Alimento</button>
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
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.45rem", fontWeight: 700, color: "var(--forest)", marginBottom: 11 }}>Elimina Alimento</h3>
          <p style={{ color: "var(--mid)", fontSize: "0.92rem", lineHeight: 1.65 }}>
            Sei sicuro di voler eliminare <strong style={{ color: "var(--forest)" }}>{ingredient.name}</strong>? L&apos;operazione non può essere annullata.
          </p>
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "13px", background: "transparent", color: "var(--mid)", fontFamily: "'DM Sans',sans-serif", fontSize: "0.92rem", border: "1.5px solid rgba(45,74,45,0.15)", borderRadius: 10, cursor: "pointer" }}>Annulla</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "13px", background: "#b43c3c", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: "0.95rem", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#8a2a2a"}
            onMouseLeave={e => e.currentTarget.style.background = "#b43c3c"}
          ><Trash2 size={14} strokeWidth={2} /> Elimina</button>
        </div>
      </div>
    </div>
  );
}

// FIX: modal puro — riceve solo fridgeName, onClose, onConfirm dall'esterno
function DeleteFridgeModal({ fridgeName, onClose, onConfirm }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 390 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(180,60,60,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
            <Trash2 size={20} color="#b43c3c" strokeWidth={1.75} />
          </div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.45rem", fontWeight: 700, color: "var(--forest)", marginBottom: 11 }}>Elimina Frigorifero</h3>
          <p style={{ color: "var(--mid)", fontSize: "0.92rem", lineHeight: 1.65 }}>
            Sei sicuro di voler eliminare <strong style={{ color: "var(--forest)" }}>{fridgeName}</strong>?<br />
            Tutti gli alimenti verranno rimossi. L&apos;operazione non può essere annullata.
          </p>
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 24 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "13px", background: "transparent", color: "var(--mid)", fontFamily: "'DM Sans',sans-serif", fontSize: "0.92rem", border: "1.5px solid rgba(45,74,45,0.15)", borderRadius: 10, cursor: "pointer" }}>Annulla</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "13px", background: "#b43c3c", color: "#fff", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: "0.95rem", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
            onMouseEnter={e => e.currentTarget.style.background = "#8a2a2a"}
            onMouseLeave={e => e.currentTarget.style.background = "#b43c3c"}
          ><Trash2 size={13} strokeWidth={2} /> Elimina</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal Invito ─────────────────────────────────────────────────────────────
function InviteModal({ fridgeId, onClose }) {
  const [inviteLink, setInviteLink] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";

  const generateLink = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch(`/fridges/${fridgeId}/invites`, { method: "POST" });
      setInviteLink(`${BASE_URL}/invite/${data.token}`);
    } catch (err) {
      setError("Errore nella generazione del link. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--forest)" }}>Invita al Frigorifero</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mid)", display: "flex", padding: 4 }}><X size={17} strokeWidth={1.75} /></button>
        </div>

        <p style={{ color: "var(--mid)", fontSize: "0.86rem", lineHeight: 1.65, marginBottom: 20 }}>
          Genera un link di invito da condividere. Chiunque lo apra verrà aggiunto al frigorifero come membro. Il link è valido per <strong style={{ color: "var(--forest)" }}>24 ore</strong>.
        </p>

        {!inviteLink ? (
          <button
            onClick={generateLink}
            disabled={loading}
            style={{ width: "100%", padding: "12px", background: "var(--forest)", color: "var(--lime)", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: "0.9rem", border: "none", borderRadius: 10, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1, transition: "background 0.2s" }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "var(--moss)"; }}
            onMouseLeave={e => e.currentTarget.style.background = "var(--forest)"}
          >
            <Link2 size={15} strokeWidth={2} />
            {loading ? "Generazione in corso…" : "Genera Link di Invito"}
          </button>
        ) : (
          <div>
            <div style={{ fontSize: "0.65rem", color: "var(--mid)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>Link generato</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ flex: 1, padding: "10px 13px", background: "rgba(45,74,45,0.05)", border: "1.5px solid rgba(45,74,45,0.12)", borderRadius: 10, fontSize: "0.78rem", color: "var(--forest)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {inviteLink}
              </div>
              <button
                onClick={copyLink}
                style={{ flexShrink: 0, padding: "10px 14px", background: copied ? "rgba(200,224,110,0.25)" : "var(--forest)", color: copied ? "var(--forest)" : "var(--lime)", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'DM Sans',sans-serif", fontSize: "0.82rem", fontWeight: 500, transition: "all 0.2s" }}
              >
                {copied ? <><Check size={13} strokeWidth={2.5} /> Copiato</> : <><Copy size={13} strokeWidth={2} /> Copia</>}
              </button>
            </div>
            <p style={{ color: "var(--mid)", fontSize: "0.75rem", marginTop: 10, lineHeight: 1.5 }}>
              Puoi generare un nuovo link in qualsiasi momento — ogni link è indipendente.
            </p>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 9, background: "rgba(196,98,45,0.07)", border: "1px solid rgba(196,98,45,0.2)", color: "#C4622D", fontSize: "0.83rem" }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function MembersList({ members, isOwner, onInvite, hideTitle }) {
  return (
    <>
      {!hideTitle && (
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16 }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.4rem", fontWeight: 700, color: "var(--forest)" }}>Membri</h2>
          <span style={{ padding: "2px 9px", borderRadius: 100, background: "rgba(45,74,45,0.08)", color: "var(--moss)", fontSize: "0.9rem", fontWeight: 500 }}>{members.length}</span>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {members.map(m => (
          <div key={m.uid} className="member-pill">
            <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: m.role === "owner" || m.role === "ADMIN" ? "var(--forest)" : "rgba(107,140,107,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: m.role === "owner" || m.role === "ADMIN" ? "var(--lime)" : "var(--sage)" }}>{m.initial || m.name?.charAt(0)}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.84rem", color: "var(--forest)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
              <div style={{ fontSize: "0.65rem", color: "var(--mid)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {m.role === "ADMIN" || m.role === "owner" ? "Proprietario" : "Membro"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Legenda scadenza */}
      <div style={{ marginTop: 22, paddingTop: 14, borderTop: "1px solid rgba(45,74,45,0.08)" }}>
        <div style={{ fontSize: "0.65rem", color: "var(--mid)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 9 }}>Legenda scadenza</div>
        {[{ color: "#b43c3c", label: "Scaduto" }, { color: "#C4622D", label: "≤ 2 giorni" }, { color: "#7a6010", label: "≤ 5 giorni" }, { color: "#2D4A2D", label: "Ok" }].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: "0.77rem", color: "var(--mid)" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Sezione invito — visibile solo al proprietario */}
      {isOwner && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(45,74,45,0.08)" }}>
          <div style={{ fontSize: "0.65rem", color: "var(--mid)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Invita</div>
          <p style={{ fontSize: "0.75rem", color: "var(--mid)", lineHeight: 1.55, marginBottom: 11 }}>
            Genera un link per aggiungere nuovi membri al frigorifero.
          </p>
          <button
            onClick={onInvite}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 14px", background: "rgba(45,74,45,0.07)", color: "var(--forest)", border: "1.5px solid rgba(45,74,45,0.14)", borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", transition: "background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(45,74,45,0.14)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(45,74,45,0.07)"}
          >
            <UserPlus size={13} strokeWidth={2} /> Genera link di invito
          </button>
        </div>
      )}
    </>
  );
}

function IngRow({ ing, delay, isOpen, onToggle, onDelete, members }) {
  const cat = CATEGORY_COLORS[ing.category] || CATEGORY_COLORS["Altro"];
  // FIX: risolve uid → nome leggibile
  const ownerName = members.find(m => m.uid === ing.owner)?.name || ing.owner;
  const details = [
    { label: "Alimento",     val: ing.name },
    { label: "Proprietario", val: ownerName },
    { label: "Categoria",    val: ing.category },
    { label: "Quantità",     val: ing.qty },
    { label: "Scadenza",     val: ing.expiry },
  ];
  return (
    <div className={`ing-wrapper scale-in delay-${delay}${isOpen ? " open" : ""}`}>
      <button className="ing-row" onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: cat.dot, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--forest)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ing.name}</div>
            <span style={{ fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.05em", padding: "2px 8px", borderRadius: 100, background: cat.bg, color: cat.text, display: "inline-block", marginTop: 3 }}>{ing.category}</span>
          </div>
        </div>
        <div className="col-qty-desk" style={{ fontSize: "0.92rem", color: "var(--ink)", fontWeight: 500, textAlign: "right" }}>{ing.qty}</div>
        <div className="col-exp-desk" style={{ display: "flex", justifyContent: "flex-end" }}><ExpiryBadge dateStr={ing.expiry} /></div>
        <div className="col-mob-stack" style={{ flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
          <span style={{ fontSize: "0.88rem", color: "var(--ink)", fontWeight: 500 }}>{ing.qty}</span>
          <ExpiryBadge dateStr={ing.expiry} />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronDown size={15} strokeWidth={2} className="chevron" />
        </div>
      </button>
      {isOpen && (
        <div className="ing-detail">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: "11px 18px", marginBottom: ing.notes ? 12 : 0 }}>
            {details.map(({ label, val }) => (
              <div key={label}>
                <div style={{ fontSize: "0.67rem", color: "var(--mint)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: "0.95rem", color: "var(--cream)", lineHeight: 1.4 }}>{val}</div>
              </div>
            ))}
          </div>
          {ing.notes && (
            <div style={{ paddingTop: 11, borderTop: "1px solid rgba(168,197,168,0.15)" }}>
              <div style={{ fontSize: "0.67rem", color: "var(--mint)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 4 }}>Note</div>
              <div style={{ fontSize: "0.9rem", color: "rgba(245,240,232,0.72)", fontStyle: "italic", lineHeight: 1.6 }}>{ing.notes}</div>
            </div>
          )}
          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={e => { e.stopPropagation(); onDelete(ing); }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "rgba(180,60,60,0.16)", color: "#ef9090", fontFamily: "'DM Sans',sans-serif", fontSize: "0.88rem", fontWeight: 500, border: "1px solid rgba(180,60,60,0.26)", borderRadius: 100, cursor: "pointer", transition: "background 0.18s" }}
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

// ── Main Page ────────────────────────────────────────────────────────────────
export default function FridgePage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState(null);
  const [fridge, setFridge] = useState(null);
  const [members, setMembers] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [openId, setOpenId] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [showDeleteFridge, setShowDeleteFridge] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [mobMembersOpen, setMobMembersOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setCurrentUser(user);
      try {
        const [fridgeData, items, membersData] = await Promise.all([
          apiFetch(`/fridges/${id}`).catch(() => ({ id, name: "Frigorifero" })),
          apiFetch(`/fridges/${id}/items`),
          apiFetch(`/fridges/${id}/members`).catch(() => []),
        ]);

        setFridge(fridgeData);
        setIngredients((items || []).map(normalizeItem));

        // Membri reali dal DB con username e ruolo
        setMembers((membersData || []).map(m => ({
          uid:     m.id,
          name:    m.username,
          role:    m.role,
          initial: m.username.charAt(0).toUpperCase(),
        })));
      } catch (err) {
        console.error("Errore fetch frigo:", err);
        setError("Impossibile caricare i dati. Riprova più tardi.");
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [id]);

  const toggle = (itemId) => setOpenId(p => p === itemId ? null : itemId);

  const handleAdd = async (formData) => {
    const newItem = await apiFetch(`/fridges/${id}/items`, {
      method: "POST",
      body: JSON.stringify({
        name:            formData.name,
        owner_id:        formData.owner,
        category:        formData.category,
        quantity:        Number(formData.quantity),
        unit:            formData.unit,
        expiration_date: formData.expiration_date,
        notes:           formData.notes,
      }),
    });
    setIngredients(p => [normalizeItem(newItem), ...p]);
  };

  const handleDelete = async () => {
    await apiFetch(`/fridges/${id}/items/${toDelete.id}`, { method: "DELETE" });
    setIngredients(p => p.filter(i => i.id !== toDelete.id));
    if (openId === toDelete.id) setOpenId(null);
    setToDelete(null);
  };

  // FIX: handleDeleteFridge nel componente principale — ha accesso a id e router
  const handleDeleteFridge = async () => {
    await apiFetch(`/fridges/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mid)", fontFamily: "'DM Sans', sans-serif" }}>
      Caricamento…
    </div>
  );

  const isOwner = fridge?.owner_id === currentUser?.uid;

  return (
    <>
      <style>{globalStyles}</style>
      <style>{`
        @media (max-width: 520px) {
          .logout-text { display: none !important; }
        }
      `}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(245,240,232,0.92)", backdropFilter: "blur(18px)", borderBottom: "1px solid rgba(45,74,45,0.08)", padding: "0 clamp(14px,4vw,44px)", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>

        {/* Sinistra: back + logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "50%", border: "1.5px solid rgba(45,74,45,0.15)", color: "var(--mid)", textDecoration: "none", transition: "border-color 0.2s, color 0.2s", flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--moss)"; e.currentTarget.style.color = "var(--forest)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(45,74,45,0.15)"; e.currentTarget.style.color = "var(--mid)"; }}
          ><ArrowLeft size={14} strokeWidth={1.75} /></Link>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--forest)" }}>Sfrigo</span>
        </div>

        {/* Centro: nome frigo */}
        <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", color: "var(--forest)", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "center" }}>
          {fridge?.name || "Frigorifero"}
        </div>

        {/* Destra: pulsanti — solo icone su mobile, testo su desktop */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {isOwner && (
            <button
              onClick={() => setShowDeleteFridge(true)}
              title="Elimina frigo"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 100, background: "rgba(180,60,60,0.1)", color: "#b43c3c", border: "1px solid rgba(180,60,60,0.25)", fontFamily: "'DM Sans',sans-serif", fontSize: "0.82rem", cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(180,60,60,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(180,60,60,0.1)"}
            >
              <Trash2 size={13} strokeWidth={1.75} />
              <span className="logout-text">Elimina frigo</span>
            </button>
          )}
          <button
            className="btn-primary"
            onClick={() => setShowAdd(true)}
            title="Aggiungi Alimento"
            style={{ whiteSpace: "nowrap" }}
          >
            <Plus size={14} strokeWidth={2.25} />
            <span className="logout-text">Aggiungi Alimento</span>
          </button>
        </div>
      </header>

      {error && (
        <div style={{ margin: "20px clamp(14px,4vw,44px)", padding: "14px 18px", borderRadius: 12, background: "rgba(196,98,45,0.07)", border: "1px solid rgba(196,98,45,0.2)", color: "#C4622D", fontSize: "0.88rem" }}>
          {error}
        </div>
      )}

      <div className="page-grid">
        <aside className="desktop-sidebar fade-up" style={{ background: "#fff", border: "1.5px solid rgba(45,74,45,0.09)", borderRadius: 18, padding: "20px 17px", position: "sticky", top: 76 }}>
          <MembersList members={members} isOwner={isOwner} onInvite={() => setShowInvite(true)} />
        </aside>

        <section>
          <div className="fade-up" style={{ marginBottom: 20 }}>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, color: "var(--forest)", lineHeight: 1.06, letterSpacing: "-0.02em" }}>
              {fridge?.name || "Frigorifero"}
            </h1>
            <p style={{ color: "var(--mid)", fontSize: "0.92rem", marginTop: 6 }}>
              {ingredients.length} {ingredients.length === 1 ? "alimento" : "alimenti"} · clicca per i dettagli
            </p>
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
                  <MembersList members={members} isOwner={isOwner} onInvite={() => setShowInvite(true)} hideTitle />
                </div>
              )}
            </div>
          </div>

          {/* Column headers */}
          <div className="col-headers-row" style={{ marginBottom: 7 }}>
            {["Alimento", "Quantità", "Scadenza", ""].map((h, i) => (
              <div key={i} style={{ fontSize: "0.72rem", color: "var(--mid)", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: i > 0 ? "right" : "left" }}>{h}</div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ingredients.length === 0 ? (
              <div style={{ padding: "60px 24px", textAlign: "center", border: "1.5px dashed rgba(45,74,45,0.18)", borderRadius: 14 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.35rem", color: "var(--forest)", marginBottom: 9 }}>Frigo vuoto</div>
                <p style={{ color: "var(--mid)", fontSize: "0.92rem", marginBottom: 20 }}>Aggiungi il primo alimento per iniziare.</p>
                <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={13} strokeWidth={2} /> Aggiungi Alimento</button>
              </div>
            ) : (
              ingredients.map((ing, i) => (
                <IngRow key={ing.id} ing={ing} delay={Math.min(i + 1, 8)} isOpen={openId === ing.id} onToggle={() => toggle(ing.id)} onDelete={setToDelete} members={members} />
              ))
            )}
          </div>
        </section>
      </div>

      {showInvite && <InviteModal fridgeId={id} onClose={() => setShowInvite(false)} />}
      {showAdd && <AddModal members={members} onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {toDelete && <DeleteModal ingredient={toDelete} onClose={() => setToDelete(null)} onConfirm={handleDelete} />}
      {showDeleteFridge && (
        <DeleteFridgeModal
          fridgeName={fridge?.name}
          onClose={() => setShowDeleteFridge(false)}
          onConfirm={handleDeleteFridge}
        />
      )}
    </>
  );
}