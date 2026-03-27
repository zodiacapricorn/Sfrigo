"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { Plus, ArrowLeft, Trash2, X, ChevronDown, Users, UserPlus, Link2, Check, Copy, LogOut, UserMinus, ChefHat, UserRound, ArrowUpDown, BookOpen } from "lucide-react";
import { globalStyles } from "./layout";
import { apiFetch } from "@/lib/api";
import { auth } from "@/lib/firebase";

// ── Costanti ─────────────────────────────────────────────────────────────────

const CATEGORIES = ["Latticini", "Verdura", "Frutta", "Carne", "Pesce", "Bevande", "Condimenti", "Avanzi", "Altro"];

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysUntilExpiry(d) {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.ceil((new Date(d) - t) / 86400000);
}

function expiryStyle(days) {
  if (days < 0) return { bg: "rgba(180,60,60,0.13)", color: "#b43c3c", label: "Scaduto" };
  if (days <= 2) return { bg: "rgba(196,98,45,0.15)", color: "#C4622D", label: `${days}g` };
  if (days <= 5) return { bg: "rgba(200,180,60,0.15)", color: "#7a6010", label: `${days}g` };
  return { bg: "rgba(107,140,107,0.15)", color: "#2D4A2D", label: `${days}g` };
}

function normalizeItem(item) {
  const id = item._id?.$oid || item._id?.toString() || item._id || item.id;
  return {
    id,
    name: item.name,
    owner: item.owner_id || item.owner || "",
    category: item.category || "Altro",
    qty: item.quantity != null
      ? `${item.quantity} ${item.unit || ""}`.trim()
      : (item.qty || ""),
    expiry: item.expiration_date
      ? new Date(item.expiration_date).toISOString().split("T")[0]
      : (item.expiry || ""),
    notes: item.notes || "",
    is_common_use: item.sharing_status?.is_common_use || false,
  };
}

// ── Sorting ───────────────────────────────────────────────────────────────────

// Peso per categoria — più alto = più urgente (usato nell'algoritmo urgenza)
const CATEGORY_URGENCY = {
  "Carne": 1.0,
  "Pesce": 1.0,
  "Latticini": 0.8,
  "Verdura": 0.6,
  "Frutta": 0.6,
  "Avanzi": 0.7,
  "Bevande": 0.3,
  "Condimenti": 0.2,
  "Altro": 0.4,
};

function sortIngredients(list, mode, members) {
  const copy = [...list];
  switch (mode) {
    case "name_asc":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case "name_desc":
      return copy.sort((a, b) => b.name.localeCompare(a.name));
    case "expiry":
      return copy.sort((a, b) => {
        if (!a.expiry) return 1;
        if (!b.expiry) return -1;
        return new Date(a.expiry) - new Date(b.expiry);
      });
    case "category":
      return copy.sort((a, b) => a.category.localeCompare(b.category));
    case "owner":
      return copy.sort((a, b) => {
        const nameA = members.find(m => m.uid === a.owner)?.name || a.owner;
        const nameB = members.find(m => m.uid === b.owner)?.name || b.owner;
        return nameA.localeCompare(nameB);
      });
    case "urgency": {
      // Score composito: 70% scadenza + 30% categoria
      // Più basso il punteggio = più urgente
      const MAX_DAYS = 30;
      return copy.sort((a, b) => {
        const daysA = a.expiry ? daysUntilExpiry(a.expiry) : MAX_DAYS;
        const daysB = b.expiry ? daysUntilExpiry(b.expiry) : MAX_DAYS;
        const expiryScoreA = Math.min(Math.max(daysA, 0), MAX_DAYS) / MAX_DAYS;
        const expiryScoreB = Math.min(Math.max(daysB, 0), MAX_DAYS) / MAX_DAYS;
        const catWeightA = CATEGORY_URGENCY[a.category] ?? 0.4;
        const catWeightB = CATEGORY_URGENCY[b.category] ?? 0.4;
        const scoreA = expiryScoreA * 0.7 + (1 - catWeightA) * 0.3;
        const scoreB = expiryScoreB * 0.7 + (1 - catWeightB) * 0.3;
        return scoreA - scoreB;
      });
    }
    default:
      return copy;
  }
}



function ExpiryBadge({ dateStr }) {
  const s = expiryStyle(daysUntilExpiry(dateStr));
  return (
    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: 100, fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.04em", background: s.bg, color: s.color, whiteSpace: "nowrap" }}>
      {s.label}
    </span>
  );
}

function ModalBase({ onClose, children, maxWidth = 420 }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}

// Pulsanti Annulla/Conferma riutilizzabili nei modal di conferma
function ConfirmButtons({ onClose, onConfirm, confirmLabel, confirmIcon, danger = false }) {
  const bg = danger ? "#b43c3c" : "var(--forest)";
  const bgHover = danger ? "#8a2a2a" : "var(--moss)";
  const color = danger ? "#fff" : "var(--lime)";
  return (
    <div style={{ display: "flex", gap: 9, marginTop: 24 }}>
      <button onClick={onClose} style={{ flex: 1, padding: "13px", background: "transparent", color: "var(--mid)", fontFamily: "'DM Sans',sans-serif", fontSize: "0.92rem", border: "1.5px solid rgba(45,74,45,0.15)", borderRadius: 10, cursor: "pointer" }}>
        Annulla
      </button>
      <button onClick={onConfirm} style={{ flex: 1, padding: "13px", background: bg, color, fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: "0.95rem", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
        onMouseEnter={e => e.currentTarget.style.background = bgHover}
        onMouseLeave={e => e.currentTarget.style.background = bg}
      >
        {confirmIcon} {confirmLabel}
      </button>
    </div>
  );
}

// Icona centrata con sfondo circolare usata nei modal di conferma
function ModalIcon({ icon, bg }) {
  return (
    <div style={{ width: 48, height: 48, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
      {icon}
    </div>
  );
}

// ── Modals ────────────────────────────────────────────────────────────────────

function AddModal({ members, currentUserId, onClose, onAdd }) {
  const [f, setF] = useState({
    name: "", owner: currentUserId || members[0]?.uid || "", category: CATEGORIES[0],
    quantity: "", unit: "pz", expiration_date: "", notes: "",
    is_common_use: false,
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!f.name.trim() || !f.quantity || !f.expiration_date) return;
    await onAdd(f);
    onClose();
  };

  return (
    <ModalBase onClose={onClose} maxWidth={520}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.9rem", fontWeight: 700, color: "var(--forest)" }}>Aggiungi Alimento</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mid)", display: "flex", padding: 4 }}>
          <X size={17} strokeWidth={1.75} />
        </button>
      </div>
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "13px 11px" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Nome Alimento *</label>
            <input className="input-field" type="text" required autoFocus placeholder="es. Mozzarella" value={f.name} onChange={e => set("name", e.target.value)} />
          </div>
          <div>
            <label>Proprietario</label>
            <div className="input-field" style={{ color: "var(--mid)", pointerEvents: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--forest)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, color: "var(--lime)", flexShrink: 0 }}>
                {members.find(m => m.uid === f.owner)?.initial || "?"}
              </span>
              {members.find(m => m.uid === f.owner)?.name || "Tu"}
            </div>
          </div>
          <div>
            <label>Categoria</label>
            <select className="input-field" value={f.category} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label>Quantità *</label>
            <input className="input-field" type="number" required placeholder="es. 200" value={f.quantity} onChange={e => set("quantity", e.target.value)} />
          </div>
          <div>
            <label>Unità</label>
            <select className="input-field" value={f.unit} onChange={e => set("unit", e.target.value)}>
              {["pz", "g", "kg", "ml", "L", "fette"].map(u => <option key={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label>Data scadenza *</label>
            <input className="input-field" type="date" required value={f.expiration_date} onChange={e => set("expiration_date", e.target.value)} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label>Note</label>
            <textarea className="input-field" rows={2} placeholder="Facoltativo…" value={f.notes} onChange={e => set("notes", e.target.value)} style={{ resize: "vertical", minHeight: 54 }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${f.is_common_use ? "rgba(45,74,45,0.3)" : "rgba(45,74,45,0.12)"}`, background: f.is_common_use ? "rgba(200,224,110,0.12)" : "transparent", transition: "all 0.2s" }}
            >
              <div
                onClick={() => set("is_common_use", !f.is_common_use)}
                style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${f.is_common_use ? "var(--forest)" : "rgba(45,74,45,0.3)"}`, background: f.is_common_use ? "var(--forest)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s", cursor: "pointer" }}
              >
                {f.is_common_use && <Check size={11} strokeWidth={3} color="var(--lime)" />}
              </div>
              <div onClick={() => set("is_common_use", !f.is_common_use)}>
                <div style={{ fontSize: "0.88rem", color: "var(--forest)", fontWeight: 500 }}>Alimento condiviso</div>
                <div style={{ fontSize: "0.75rem", color: "var(--mid)", marginTop: 1 }}>Accessibile a tutti i membri del frigorifero</div>
              </div>
            </label>
          </div>
        </div>
        <div style={{ display: "flex", gap: 9, marginTop: 20 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: "13px", background: "transparent", color: "var(--mid)", fontFamily: "'DM Sans',sans-serif", fontSize: "0.92rem", border: "1.5px solid rgba(45,74,45,0.15)", borderRadius: 10, cursor: "pointer" }}>Annulla</button>
          <button type="submit" style={{ flex: 2, padding: "13px", background: "var(--forest)", color: "var(--lime)", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: "0.95rem", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--moss)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--forest)"}
          ><Plus size={14} strokeWidth={2} /> Aggiungi</button>
        </div>
      </form>
    </ModalBase>
  );
}

function DeleteModal({ ingredient, onClose, onConfirm }) {
  return (
    <ModalBase onClose={onClose} maxWidth={370}>
      <div style={{ textAlign: "center" }}>
        <ModalIcon icon={<Trash2 size={20} color="#b43c3c" strokeWidth={1.75} />} bg="rgba(180,60,60,0.1)" />
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.45rem", fontWeight: 700, color: "var(--forest)", marginBottom: 11 }}>Elimina Alimento</h3>
        <p style={{ color: "var(--mid)", fontSize: "0.92rem", lineHeight: 1.65 }}>
          Sei sicuro di voler eliminare <strong style={{ color: "var(--forest)" }}>{ingredient.name}</strong>? L&apos;operazione non può essere annullata.
        </p>
      </div>
      <ConfirmButtons onClose={onClose} onConfirm={onConfirm} confirmLabel="Elimina" confirmIcon={<Trash2 size={14} strokeWidth={2} />} danger />
    </ModalBase>
  );
}

function DeleteFridgeModal({ fridgeName, onClose, onConfirm }) {
  return (
    <ModalBase onClose={onClose} maxWidth={390}>
      <div style={{ textAlign: "center" }}>
        <ModalIcon icon={<Trash2 size={20} color="#b43c3c" strokeWidth={1.75} />} bg="rgba(180,60,60,0.1)" />
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.45rem", fontWeight: 700, color: "var(--forest)", marginBottom: 11 }}>Elimina Frigorifero</h3>
        <p style={{ color: "var(--mid)", fontSize: "0.92rem", lineHeight: 1.65 }}>
          Sei sicuro di voler eliminare <strong style={{ color: "var(--forest)" }}>{fridgeName}</strong>?<br />
          Tutti gli alimenti verranno rimossi. L&apos;operazione non può essere annullata.
        </p>
      </div>
      <ConfirmButtons onClose={onClose} onConfirm={onConfirm} confirmLabel="Elimina" confirmIcon={<Trash2 size={13} strokeWidth={2} />} danger />
    </ModalBase>
  );
}

function LeaveFridgeModal({ fridgeName, onClose, onConfirm }) {
  return (
    <ModalBase onClose={onClose} maxWidth={390}>
      <div style={{ textAlign: "center" }}>
        <ModalIcon icon={<LogOut size={20} color="var(--forest)" strokeWidth={1.75} />} bg="rgba(45,74,45,0.08)" />
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.45rem", fontWeight: 700, color: "var(--forest)", marginBottom: 11 }}>Lascia il frigorifero</h3>
        <p style={{ color: "var(--mid)", fontSize: "0.92rem", lineHeight: 1.65 }}>
          Sei sicuro di voler lasciare <strong style={{ color: "var(--forest)" }}>{fridgeName}</strong>?<br />
          Potrai rientrare solo con un nuovo invito.
        </p>
      </div>
      <ConfirmButtons onClose={onClose} onConfirm={onConfirm} confirmLabel="Lascia" confirmIcon={<LogOut size={14} strokeWidth={2} />} />
    </ModalBase>
  );
}

function KickMemberModal({ memberName, onClose, onConfirm }) {
  return (
    <ModalBase onClose={onClose} maxWidth={390}>
      <div style={{ textAlign: "center" }}>
        <ModalIcon icon={<UserMinus size={20} color="#b43c3c" strokeWidth={1.75} />} bg="rgba(180,60,60,0.09)" />
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.45rem", fontWeight: 700, color: "var(--forest)", marginBottom: 11 }}>Espelli membro</h3>
        <p style={{ color: "var(--mid)", fontSize: "0.92rem", lineHeight: 1.65 }}>
          Sei sicuro di voler rimuovere <strong style={{ color: "var(--forest)" }}>{memberName}</strong> dal frigorifero?<br />
          Potrà rientrare solo con un nuovo invito.
        </p>
      </div>
      <ConfirmButtons onClose={onClose} onConfirm={onConfirm} confirmLabel="Espelli" confirmIcon={<UserMinus size={14} strokeWidth={2} />} danger />
    </ModalBase>
  );
}

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
    } catch {
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
    <ModalBase onClose={onClose} maxWidth={420}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--forest)" }}>Invita al Frigorifero</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mid)", display: "flex", padding: 4 }}>
          <X size={17} strokeWidth={1.75} />
        </button>
      </div>
      <p style={{ color: "var(--mid)", fontSize: "0.86rem", lineHeight: 1.65, marginBottom: 20 }}>
        Genera un link di invito da condividere. Chiunque lo apra verrà aggiunto come membro. Il link è valido per <strong style={{ color: "var(--forest)" }}>24 ore</strong>.
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
    </ModalBase>
  );
}



// ── Modal Ricetta ─────────────────────────────────────────────────────────────

function RecipeModal({ ingredients, currentUserId, fridgeId, onClose, onIngredientsUsed }) {
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState(null);
  const [error, setError] = useState("");
  const [usingIdx, setUsingIdx] = useState(null);
  const [usedIdx, setUsedIdx] = useState(null);

  const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:8080";

  const personalItems = ingredients.filter(i => i.owner === currentUserId);
  const sharedItems = ingredients.filter(i => i.is_common_use || i.owner === currentUserId);
  const list = mode === "personal" ? personalItems : sharedItems;

  const toggleItem = (id) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const selectedItems = list.filter(i => selected.includes(i.id));
  const canSearch = selected.length >= 2;

  const handleUseRecipe = async (recipe, idx) => {
    setUsingIdx(idx);
    setError("");
    try {
      const matchedItems = selectedItems.filter(item =>
        recipe.ingredients_used.some(name =>
          name.toLowerCase() === item.name.toLowerCase()
        )
      );

      if (matchedItems.length === 0) {
        setError("Nessun alimento corrisponde agli ingredienti della ricetta.");
        return;
      }

      await apiFetch(`/fridges/${fridgeId}/recipe`, {
        method: "POST",
        body: JSON.stringify({
          recipe_name: recipe.name,
          mode,
          item_ids: matchedItems.map(i => i.id),
          ingredients_used: matchedItems.map(i => ({
            name: i.name,
            owner_id: i.owner,
            quantity: i.qty,
            unit: "",
            item_id: i.id,
          })),
        }),
      });

      setUsedIdx(idx);
      const usedIds = new Set(matchedItems.map(i => i.id));
      onIngredientsUsed(usedIds);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error(err);
      setError("Errore durante l'utilizzo della ricetta. Riprova.");
    } finally {
      setUsingIdx(null);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setRecipes(null);
    try {
      const ingredientList = selectedItems
        .map(i => `- ${i.name}${i.qty ? ` (${i.qty})` : ""}`)
        .join("\n");

      const prompt = `Sei un assistente culinario.
Suggerisci esattamente 3 ricette che utilizzano PRINCIPALMENTE questi ingredienti:
${ingredientList}

Puoi assumere che siano sempre disponibili in cucina:
- Condimenti: sale, pepe nero, pepe bianco, olio d'oliva, olio di semi, aceto
- Aromi secchi: aglio in polvere, origano, rosmarino, basilico secco, paprika, peperoncino
- Ingredienti secchi: pasta, riso, farina, pane, pangrattato, zucchero
- Altro: uova, dado da brodo, concentrato di pomodoro

REGOLE IMPORTANTI:
- Ogni ricetta deve usare almeno 2 degli ingredienti forniti
- Non inventare ingredienti freschi o da frigo non presenti nella lista
- Rispondi SOLO con un JSON valido, senza markdown, senza testo aggiuntivo
- In ingredients_used inserisci SOLO i nomi degli ingredienti presenti in ${ingredientList}, non ingredienti inventati o generici (es. "carne", "verdura", ecc.)

Formato JSON richiesto:
{
  "recipes": [
    {
      "name": "Nome Ricetta",
      "difficulty": "Facile",
      "time": "X min",
      "description": "Descrizione breve in 2-3 frasi",
      "ingredients_used": ["ingrediente1", "ingrediente2"],
      "tips": "Un consiglio utile"
    }
  ]
}`;

      const token = await auth.currentUser?.getIdToken();
      const res = await fetch(`${GATEWAY}/api/v1/recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      if (!text) throw new Error("Risposta vuota");

      // Pulizia e parsing JSON
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setRecipes(parsed.recipes || []);
    } catch {
      setError("Errore nella generazione delle ricette. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setMode(null);
    setSelected([]);
    setRecipes(null);
    setError("");
    setUsingIdx(null);
    setUsedIdx(null);
  };

  const difficultyColor = {
    "Facile": { bg: "rgba(107,140,107,0.15)", color: "#2D4A2D" },
    "Media": { bg: "rgba(200,180,60,0.15)", color: "#7a6010" },
    "Difficile": { bg: "rgba(196,98,45,0.15)", color: "#C4622D" },
  };

  return (
    <ModalBase onClose={onClose} maxWidth={500}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {mode && (
            <button
              onClick={handleBack}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mid)", display: "flex", padding: 2, transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--forest)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--mid)"}
            >
              <ChevronDown size={16} strokeWidth={2} style={{ transform: "rotate(90deg)" }} />
            </button>
          )}
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", fontWeight: 700, color: "var(--forest)" }}>Ricetta</h3>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mid)", display: "flex", padding: 4 }}>
          <X size={17} strokeWidth={1.75} />
        </button>
      </div>

      {/* Step 1 — selezione tipo */}
      {!mode && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ color: "var(--mid)", fontSize: "0.88rem", lineHeight: 1.65, marginBottom: 6 }}>
            Scegli su quali alimenti basare la ricetta.
          </p>
          {[
            { key: "personal", label: "Ricetta Personale", desc: "Usa solo i tuoi alimenti", icon: <UserRound size={18} color="var(--forest)" strokeWidth={1.75} /> },
            { key: "shared", label: "Ricetta Condivisa", desc: "Usa i tuoi alimenti e quelli condivisi del frigo", icon: <Users size={18} color="var(--forest)" strokeWidth={1.75} /> },
          ].map(({ key, label, desc, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "rgba(45,74,45,0.04)", border: "1.5px solid rgba(45,74,45,0.12)", borderRadius: 12, cursor: "pointer", textAlign: "left", transition: "all 0.18s", width: "100%" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(45,74,45,0.09)"; e.currentTarget.style.borderColor = "rgba(45,74,45,0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(45,74,45,0.04)"; e.currentTarget.style.borderColor = "rgba(45,74,45,0.12)"; }}
            >
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(200,224,110,0.18)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--forest)", fontFamily: "'DM Sans',sans-serif" }}>{label}</div>
                <div style={{ fontSize: "0.75rem", color: "var(--mid)", marginTop: 2 }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2 — lista alimenti selezionabili */}
      {mode && !recipes && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: "0.75rem", color: "var(--mid)", letterSpacing: "0.07em", textTransform: "uppercase" }}>
              {mode === "personal" ? "I tuoi alimenti" : "Alimenti condivisi"}
            </span>
            <span style={{ padding: "1px 8px", borderRadius: 100, background: "rgba(45,74,45,0.08)", color: "var(--moss)", fontSize: "0.78rem", fontWeight: 500 }}>
              {list.length}
            </span>
            {selected.length > 0 && (
              <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--sage)" }}>
                {selected.length} selezionati
              </span>
            )}
          </div>

          {list.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", border: "1.5px dashed rgba(45,74,45,0.15)", borderRadius: 12 }}>
              <p style={{ color: "var(--mid)", fontSize: "0.88rem", lineHeight: 1.65 }}>
                {mode === "personal"
                  ? "Non hai alimenti intestati a te in questo frigo."
                  : "Non ci sono alimenti condivisi in questo frigo."}
              </p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 280, overflowY: "auto", marginBottom: 16 }}>
                {list.map(ing => {
                  const cat = CATEGORY_COLORS[ing.category] || CATEGORY_COLORS["Altro"];
                  const isSelected = selected.includes(ing.id);
                  return (
                    <button
                      key={ing.id}
                      type="button"
                      onClick={() => toggleItem(ing.id)}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: `1.5px solid ${isSelected ? "var(--forest)" : "rgba(45,74,45,0.09)"}`, borderRadius: 10, background: isSelected ? "rgba(200,224,110,0.12)" : "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%" }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${isSelected ? "var(--forest)" : "rgba(45,74,45,0.25)"}`, background: isSelected ? "var(--forest)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.15s" }}>
                        {isSelected && <Check size={11} strokeWidth={3} color="var(--lime)" />}
                      </div>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cat.dot, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--forest)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ing.name}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--mid)", marginTop: 1 }}>{ing.qty}</div>
                      </div>
                      {ing.expiry && <ExpiryBadge dateStr={ing.expiry} />}
                    </button>
                  );
                })}
              </div>

              {!canSearch && (
                <p style={{ fontSize: "0.75rem", color: "var(--mid)", textAlign: "center", marginBottom: 10 }}>
                  Seleziona almeno 2 alimenti per cercare ricette
                </p>
              )}
              <button
                type="button"
                onClick={handleSearch}
                disabled={!canSearch || loading}
                style={{ width: "100%", padding: "12px", background: canSearch ? "var(--forest)" : "rgba(45,74,45,0.15)", color: canSearch ? "var(--lime)" : "var(--mid)", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: "0.92rem", border: "none", borderRadius: 10, cursor: canSearch ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}
                onMouseEnter={e => { if (canSearch) e.currentTarget.style.background = "var(--moss)"; }}
                onMouseLeave={e => { if (canSearch) e.currentTarget.style.background = "var(--forest)"; }}
              >
                <ChefHat size={15} strokeWidth={2} />
                {loading ? "Generazione in corso…" : `Cerca ricette (${selected.length})`}
              </button>
            </>
          )}
        </>
      )}

      {/* Step 3 — card ricette */}
      {recipes && (
        <>
          <div style={{ fontSize: "0.72rem", color: "var(--mid)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>
            Ricette suggerite · {selectedItems.length} ingredienti
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 540, overflowY: "auto" }}>
            {recipes.map((r, i) => {
              const diff = difficultyColor[r.difficulty] || difficultyColor["Facile"];
              const searchUrl = `https://www.giallozafferano.it/ricerca-ricette/${encodeURIComponent(r.name)}`;
              return (
                <div key={i} style={{ border: "1.5px solid rgba(45,74,45,0.1)", borderRadius: 14, overflow: "hidden", flexShrink: 0 }}>
                  {/* Card header */}
                  <div style={{ padding: "14px 16px 10px", background: "rgba(45,74,45,0.03)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                      <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--forest)", lineHeight: 1.2 }}>{r.name}</div>
                      <a
                        href={searchUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ flexShrink: 0, fontSize: "0.72rem", color: "var(--sage)", textDecoration: "none", border: "1px solid rgba(45,74,45,0.2)", borderRadius: 100, padding: "3px 10px", whiteSpace: "nowrap", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(45,74,45,0.07)"; e.currentTarget.style.color = "var(--forest)"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--sage)"; }}
                      >
                        Cerca ricetta ↗
                      </a>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.7rem", fontWeight: 500, padding: "4px 9px", borderRadius: 100, background: diff.bg, color: diff.color }}>{r.difficulty}</span>
                      <span style={{ fontSize: "0.7rem", fontWeight: 500, padding: "4px 9px", borderRadius: 100, background: "rgba(45,74,45,0.07)", color: "var(--mid)" }}>⏱ {r.time}</span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: "10px 16px 14px" }}>
                    <p style={{ fontSize: "0.84rem", color: "var(--mid)", lineHeight: 1.65, marginBottom: 10 }}>{r.description}</p>

                    {/* Ingredienti usati */}
                    {r.ingredients_used?.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: "0.65rem", color: "var(--mid)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>Ingredienti usati</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {r.ingredients_used.map((ing, j) => (
                            <span key={j} style={{ fontSize: "0.72rem", padding: "2px 9px", borderRadius: 100, background: "rgba(200,224,110,0.18)", color: "#2D4A2D", fontWeight: 500 }}>{ing}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tips */}
                    {r.tips && (
                      <div style={{ padding: "8px 12px", background: "rgba(200,224,110,0.1)", borderRadius: 8, borderLeft: "3px solid rgba(200,224,110,0.6)" }}>
                        <span style={{ fontSize: "0.75rem", color: "var(--forest)", lineHeight: 1.55 }}>💡 {r.tips}</span>
                      </div>
                    )}

                    {/* Pulsante usa ricetta */}

                    <div style={{ marginTop: 20, display: "flex", justifyContent: "center" }}>
                      {usedIdx === i ? (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(200,224,110,0.2)", borderRadius: 100, color: "#2D4A2D", fontSize: "0.75rem", fontWeight: 500 }}>
                          <Check size={12} strokeWidth={2.5} /> Ingredienti rimossi
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleUseRecipe(r, i)}
                          disabled={usingIdx === i || usedIdx !== null}
                          className="btn-secondary"
                          style={{ opacity: usedIdx !== null && usedIdx !== i ? 0.4 : 1, cursor: usingIdx === i || usedIdx !== null ? "not-allowed" : "pointer" }}
                        >
                          <ChefHat size={13} strokeWidth={2} />
                          {usingIdx === i ? "In corso…" : "Usa questa ricetta"}
                        </button>
                      )}
                    </div>


                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => { setRecipes(null); setSelected([]); }}
            style={{ marginTop: 16, width: "100%", padding: "11px", background: "transparent", color: "var(--sage)", fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", fontWeight: 500, border: "1.5px solid rgba(45,74,45,0.15)", borderRadius: 100, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, letterSpacing: "0.02em", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--moss)"; e.currentTarget.style.color = "var(--forest)"; e.currentTarget.style.background = "rgba(45,74,45,0.05)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(45,74,45,0.15)"; e.currentTarget.style.color = "var(--forest)"; e.currentTarget.style.background = "transparent"; }}
          >
            <ChevronDown size={14} strokeWidth={2} style={{ transform: "rotate(90deg)" }} />
            Seleziona altri ingredienti
          </button>
        </>
      )}

      {error && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 9, background: "rgba(196,98,45,0.07)", border: "1px solid rgba(196,98,45,0.2)", color: "#C4622D", fontSize: "0.83rem" }}>
          {error}
        </div>
      )}
    </ModalBase>
  );
}

// ── Cronologia Ricette ─────────────────────────────────────────────────────────────
function RecipeHistoryModal({ fridgeId, members, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/fridges/${fridgeId}/recipe`)
      .then(data => setHistory(data || []))
      .catch(() => setError("Errore nel caricamento dello storico."))
      .finally(() => setLoading(false));
  }, [fridgeId]);

  return (
    <ModalBase onClose={onClose} maxWidth={500} overflowY="auto">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.6rem", fontWeight: 700, color: "var(--forest)" }}>Storico Ricette</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--mid)", display: "flex", padding: 4 }}>
          <X size={17} strokeWidth={1.75} />
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--mid)", fontSize: "0.88rem" }}>
          Caricamento…
        </div>
      )}

      {error && (
        <div style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(196,98,45,0.07)", border: "1px solid rgba(196,98,45,0.2)", color: "#C4622D", fontSize: "0.83rem" }}>
          {error}
        </div>
      )}

      {!loading && !error && history.length === 0 && (
        <div style={{ padding: "40px 16px", textAlign: "center", border: "1.5px dashed rgba(45,74,45,0.15)", borderRadius: 12 }}>
          <p style={{ color: "var(--mid)", fontSize: "0.88rem", lineHeight: 1.65 }}>
            Nessuna ricetta condivisa utilizzata ancora.
          </p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 440, overflowY: "auto" }}>
          {history.map((entry, i) => {
            const requestedBy = members.find(m => m.uid === entry.requested_by)?.name || entry.requested_by;
            const date = new Date(entry.used_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" });
            return (
              <div key={i} style={{ border: "1.5px solid rgba(45,74,45,0.09)", borderRadius: 12, overflow: "hidden", flexShrink : 0 }}>
                {/* Header */}
                <div style={{ padding: "12px 14px 8px", background: "rgba(45,74,45,0.03)", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1rem", fontWeight: 700, color: "var(--forest)" }}>{entry.recipe_name}</div>
                  <span style={{ fontSize: "0.7rem", color: "var(--mid)", whiteSpace: "nowrap", flexShrink: 0 }}>{date}</span>
                </div>

                {/* Body */}
                <div style={{ padding: "8px 14px 12px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--mid)", marginBottom: 7 }}>
                    Richiesta da <strong style={{ color: "var(--forest)" }}>{requestedBy}</strong>
                  </div>
                  {entry.ingredients?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                      {entry.ingredients.map((ing, j) => (
                        <span key={j} style={{ fontSize: "0.71rem", padding: "2px 9px", borderRadius: 100, background: "rgba(200,224,110,0.18)", color: "#2D4A2D", fontWeight: 500 }}>
                          {ing.name}{ing.quantity ? ` · ${ing.quantity}` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModalBase>
  );
}
// ── Sidebar membri ────────────────────────────────────────────────────────────

function MembersList({ members, isOwner, onInvite, onKick, onRecipe, hideTitle, onRecipeHistory }) {
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
          <div key={m.uid} className="member-pill" style={{ display: "flex", alignItems: "center", gap: 9, justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0, background: m.role === "ADMIN" ? "var(--forest)" : "rgba(107,140,107,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, color: m.role === "ADMIN" ? "var(--lime)" : "var(--sage)" }}>
                {m.initial || m.name?.charAt(0)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.84rem", color: "var(--forest)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                <div style={{ fontSize: "0.65rem", color: "var(--mid)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  {m.role === "ADMIN" ? "Proprietario" : "Membro"}
                </div>
              </div>
            </div>
            {isOwner && m.role !== "ADMIN" && (
              <button
                onClick={() => onKick(m)}
                title={`Espelli ${m.name}`}
                style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: "transparent", border: "1px solid rgba(180,60,60,0.2)", color: "#b43c3c", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(180,60,60,0.1)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <UserMinus size={12} strokeWidth={1.75} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 22, paddingTop: 14, borderTop: "1px solid rgba(45,74,45,0.08)" }}>
        <div style={{ fontSize: "0.65rem", color: "var(--mid)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 9 }}>Legenda scadenza</div>
        {[
          { color: "#b43c3c", label: "Scaduto" },
          { color: "#C4622D", label: "≤ 2 giorni" },
          { color: "#7a6010", label: "≤ 5 giorni" },
          { color: "#2D4A2D", label: "Ok" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: "0.77rem", color: "var(--mid)" }}>{label}</span>
          </div>
        ))}
      </div>


      <div style={{ borderTop: "1px solid rgba(45,74,45,0.08)", marginTop: 22, paddingTop: 14}}>
        <div style={{ fontSize: "0.65rem", color: "var(--mid)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>Ricetta</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={onRecipe}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 14px", background: "rgba(45,74,45,0.07)", color: "var(--forest)", border: "1.5px solid rgba(45,74,45,0.14)", borderRadius: 10, fontFamily: "'DM Sans',sans-serif", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", transition: "background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(45,74,45,0.14)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(45,74,45,0.07)"}
          >
            <ChefHat size={13} strokeWidth={2} /> Ricetta AI
          </button>
          <button
            onClick={onRecipeHistory}
            title="Storico ricette"
            style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(45,74,45,0.07)", color: "var(--forest)", border: "1.5px solid rgba(45,74,45,0.14)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "background 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(45,74,45,0.14)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(45,74,45,0.07)"}
          >
            <BookOpen size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>



      {isOwner && (
        <div style={{ marginTop: 18, paddingTop: 16, borderTop: "1px solid rgba(45,74,45,0.08)" }}>
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

// ── Lista ingredienti ─────────────────────────────────────────────────────────

function IngRow({ ing, delay, isOpen, onToggle, onDelete, members }) {
  const cat = CATEGORY_COLORS[ing.category] || CATEGORY_COLORS["Altro"];
  const ownerName = members.find(m => m.uid === ing.owner)?.name || ing.owner;

  const details = [
    { label: "Alimento", val: ing.name },
    { label: "Proprietario", val: ownerName },
    { label: "Categoria", val: ing.category },
    { label: "Quantità", val: ing.qty },
    { label: "Scadenza", val: ing.expiry },
  ];

  return (
    <div className={`ing-wrapper scale-in delay-${delay}${isOpen ? " open" : ""}`}>
      <button className="ing-row" onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: cat.dot, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.05rem", fontWeight: 700, color: "var(--forest)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ing.name}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap", marginTop: 3 }}>
              <span style={{ fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.05em", padding: "2px 8px", borderRadius: 100, background: cat.bg, color: cat.text }}>{ing.category}</span>
              {ing.is_common_use && (
                <span style={{ fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.05em", padding: "2px 8px", borderRadius: 100, background: "rgba(200,224,110,0.22)", color: "#2D4A2D" }}>Condiviso</span>
              )}
            </div>
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

// ── Pagina principale ─────────────────────────────────────────────────────────

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
  const [toKick, setToKick] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showDeleteFridge, setShowDeleteFridge] = useState(false);
  const [showLeaveFridge, setShowLeaveFridge] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [showRecipeHistory, setShowRecipeHistory] = useState(false);
  const [mobMembersOpen, setMobMembersOpen] = useState(false);
  const [sortMode, setSortMode] = useState("urgency");

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchData = async () => {
    try {
      const [fridgeData, items, membersData] = await Promise.all([
        apiFetch(`/fridges/${id}`).catch(() => ({ id, name: "Frigorifero" })),
        apiFetch(`/fridges/${id}/items`),
        apiFetch(`/fridges/${id}/members`).catch(() => []),
      ]);
      setFridge(fridgeData);
      setIngredients((items || []).map(normalizeItem));
      setMembers((membersData || []).map(m => ({
        uid: m.id,
        name: m.username,
        role: m.role,
        initial: m.username.charAt(0).toUpperCase(),
      })));
    } catch (err) {
      console.error(err);
      if (err.message?.includes("403") || err.message?.includes("404")) {
        router.replace("/dashboard");
        return;
      }
      setError("Impossibile caricare i dati. Riprova più tardi.");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      setCurrentUser(user);
      await fetchData();
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  // Polling ogni 30 secondi
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [currentUser, id]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const toggle = (itemId) => setOpenId(p => p === itemId ? null : itemId);

  const handleAdd = async (formData) => {
    const newItem = await apiFetch(`/fridges/${id}/items`, {
      method: "POST",
      body: JSON.stringify({
        name: formData.name,
        owner_id: formData.owner,
        category: formData.category,
        quantity: Number(formData.quantity),
        unit: formData.unit,
        expiration_date: formData.expiration_date,
        notes: formData.notes,
        sharing_status: {
          is_common_use: formData.is_common_use || false,
          is_available_for_loan: false,
        },
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

  const handleDeleteFridge = async () => {
    await apiFetch(`/fridges/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  };

  const handleLeaveFridge = async () => {
    await apiFetch(`/fridges/${id}/members/me`, { method: "DELETE" });
    router.push("/dashboard");
  };

  const handleKickMember = async () => {
    await apiFetch(`/fridges/${id}/members/${toKick.uid}`, { method: "DELETE" });
    setMembers(p => p.filter(m => m.uid !== toKick.uid));
    setToKick(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--mid)", fontFamily: "'DM Sans', sans-serif" }}>
      Caricamento…
    </div>
  );

  const isOwner = fridge?.owner_id === currentUser?.uid;

  return (
    <>
      <style>{globalStyles}</style>
      <style>{`@media (max-width: 520px) { .logout-text { display: none !important; } }`}</style>

      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(245,240,232,0.92)", backdropFilter: "blur(18px)", borderBottom: "1px solid rgba(45,74,45,0.08)", padding: "0 clamp(14px,4vw,44px)", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: "50%", border: "1.5px solid rgba(45,74,45,0.15)", color: "var(--mid)", textDecoration: "none", transition: "border-color 0.2s, color 0.2s", flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--moss)"; e.currentTarget.style.color = "var(--forest)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(45,74,45,0.15)"; e.currentTarget.style.color = "var(--mid)"; }}
          ><ArrowLeft size={14} strokeWidth={1.75} /></Link>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--forest)" }}>Sfrigo</span>
        </div>

        <div style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", color: "var(--forest)", fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, textAlign: "center" }}>
          {fridge?.name || "Frigorifero"}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {isOwner ? (
            <button onClick={() => setShowDeleteFridge(true)} title="Elimina frigo"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 100, background: "rgba(180,60,60,0.1)", color: "#b43c3c", border: "1px solid rgba(180,60,60,0.25)", fontFamily: "'DM Sans',sans-serif", fontSize: "0.82rem", cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(180,60,60,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(180,60,60,0.1)"}
            >
              <Trash2 size={13} strokeWidth={1.75} />
              <span className="logout-text">Elimina frigo</span>
            </button>
          ) : (
            <button onClick={() => setShowLeaveFridge(true)} title="Lascia frigo"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 100, background: "rgba(45,74,45,0.07)", color: "var(--forest)", border: "1px solid rgba(45,74,45,0.15)", fontFamily: "'DM Sans',sans-serif", fontSize: "0.82rem", cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(45,74,45,0.14)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(45,74,45,0.07)"}
            >
              <LogOut size={13} strokeWidth={1.75} />
              <span className="logout-text">Lascia frigo</span>
            </button>
          )}
          <button className="btn-primary" onClick={() => setShowAdd(true)} title="Aggiungi Alimento" style={{ whiteSpace: "nowrap" }}>
            <Plus size={14} strokeWidth={2.25} />
            <span className="logout-text">Aggiungi</span>
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
          <MembersList members={members} isOwner={isOwner} onInvite={() => setShowInvite(true)} onKick={setToKick} onRecipe={() => setShowRecipe(true)} onRecipeHistory={() => setShowRecipeHistory(true)} />
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

          {/* Drawer membri — solo mobile */}
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
                  <MembersList members={members} isOwner={isOwner} onInvite={() => setShowInvite(true)} onKick={setToKick} onRecipe={() => setShowRecipe(true)} onRecipeHistory={() => setShowRecipeHistory(true)} hideTitle />
                </div>
              )}
            </div>
          </div>

          <div className="col-headers-row" style={{ marginBottom: 7 }}>
            {["Alimento", "Quantità", "Scadenza", ""].map((h, i) => (
              <div key={i} style={{ fontSize: "0.72rem", color: "var(--mid)", letterSpacing: "0.08em", textTransform: "uppercase", textAlign: i > 0 ? "right" : "left" }}>{h}</div>
            ))}
          </div>

          {/* Barra filtri sorting */}
          {ingredients.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              <ArrowUpDown size={12} strokeWidth={1.75} color="var(--mid)" style={{ flexShrink: 0 }} />
              {[
                { key: "urgency", label: "Urgenza" },
                { key: "expiry", label: "Scadenza" },
                { key: "name_asc", label: "A→Z" },
                { key: "name_desc", label: "Z→A" },
                { key: "category", label: "Categoria" },
                { key: "owner", label: "Proprietario" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSortMode(key)}
                  style={{ padding: "4px 11px", borderRadius: 100, fontSize: "0.72rem", fontWeight: 500, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", transition: "all 0.15s", border: sortMode === key ? "1.5px solid var(--forest)" : "1.5px solid rgba(45,74,45,0.15)", background: sortMode === key ? "var(--forest)" : "transparent", color: sortMode === key ? "var(--lime)" : "var(--mid)" }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ingredients.length === 0 ? (
              <div style={{ padding: "60px 24px", textAlign: "center", border: "1.5px dashed rgba(45,74,45,0.18)", borderRadius: 14 }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.35rem", color: "var(--forest)", marginBottom: 9 }}>Frigo vuoto</div>
                <p style={{ color: "var(--mid)", fontSize: "0.92rem", marginBottom: 20 }}>Aggiungi il primo alimento per iniziare.</p>
                <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={13} strokeWidth={2} /> Aggiungi Alimento</button>
              </div>
            ) : (
              sortIngredients(ingredients, sortMode, members).map((ing, i) => (
                <IngRow key={ing.id} ing={ing} delay={Math.min(i + 1, 8)} isOpen={openId === ing.id} onToggle={() => toggle(ing.id)} onDelete={setToDelete} members={members} />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Modals */}
      {showRecipe && <RecipeModal ingredients={ingredients} currentUserId={currentUser?.uid} fridgeId={id} onClose={() => setShowRecipe(false)} onIngredientsUsed={(usedIds) => setIngredients(p => p.filter(i => !usedIds.has(i.id)))} />}
      {showAdd && <AddModal members={members} currentUserId={currentUser?.uid} onClose={() => setShowAdd(false)} onAdd={handleAdd} />}
      {showInvite && <InviteModal fridgeId={id} onClose={() => setShowInvite(false)} />}
      {toDelete && <DeleteModal ingredient={toDelete} onClose={() => setToDelete(null)} onConfirm={handleDelete} />}
      {toKick && <KickMemberModal memberName={toKick.name} onClose={() => setToKick(null)} onConfirm={handleKickMember} />}
      {showLeaveFridge && <LeaveFridgeModal fridgeName={fridge?.name} onClose={() => setShowLeaveFridge(false)} onConfirm={handleLeaveFridge} />}
      {showDeleteFridge && <DeleteFridgeModal fridgeName={fridge?.name} onClose={() => setShowDeleteFridge(false)} onConfirm={handleDeleteFridge} />}
      {showRecipeHistory && <RecipeHistoryModal fridgeId={id} members={members} onClose={() => setShowRecipeHistory(false)} />}
    </>
  );
}