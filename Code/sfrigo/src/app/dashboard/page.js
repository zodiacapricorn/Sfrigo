"use client";

import Link from "next/link.js";
import { Plus, LogOut, ChevronRight, Users, Crown } from "lucide-react";
import { globalStyles } from "./layout.js";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

// ── Mock data — sostituisci con fetch reale da Firebase ───────────────────────

const MOCK_FRIDGES = [
  { id: "f1", name: "Frigo di Casa", ownerUid: "user_001", ownerName: "Marco R.", members: 3 },
  { id: "f2", name: "Cucina Studio", ownerUid: "user_001", ownerName: "Marco R.", members: 5 },
  { id: "f3", name: "Frigo Coinquilini", ownerUid: "user_002", ownerName: "Sara B.", members: 4 },
  { id: "f4", name: "Casa al Mare", ownerUid: "user_003", ownerName: "Luca M.", members: 2 },
  { id: "f5", name: "Ufficio Milano", ownerUid: "user_004", ownerName: "Chiara V.", members: 8 },
];

// ── Create Modal ──────────────────────────────────────────────────────────────
function CreateFridgeModal({ onClose, onCreate }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
    onClose();
  };


  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h3 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.7rem", fontWeight: 700,
          color: "var(--forest)", marginBottom: 8
        }}>Nuovo frigorifero</h3>

        <p style={{ color: "var(--mid)", fontSize: "0.87rem", marginBottom: 32, lineHeight: 1.6 }}>
          Dai un nome al tuo frigo virtuale. Potrai invitare altri utenti in seguito.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 28 }}>
            <label htmlFor="fridge-name">Nome del frigo</label>
            <input
              id="fridge-name" type="text" autoFocus required
              placeholder="es. Frigo di Casa, Cucina Ufficio…"
              value={name} onChange={e => setName(e.target.value)}
              className="input-field"
            />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: "13px", background: "transparent", color: "var(--mid)",
              fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem",
              border: "1.5px solid rgba(45,74,45,0.15)", borderRadius: 12, cursor: "pointer",
              transition: "border-color 0.2s"
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(45,74,45,0.3)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(45,74,45,0.15)"}
            >Annulla</button>

            <button type="submit" style={{
              flex: 2, padding: "13px", background: "var(--forest)", color: "var(--lime)",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "0.92rem",
              border: "none", borderRadius: 12, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              transition: "background 0.2s"
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--moss)"}
              onMouseLeave={e => e.currentTarget.style.background = "var(--forest)"}
            >
              <Plus size={15} strokeWidth={2} /> Crea frigo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Fridge Card ───────────────────────────────────────────────────────────────
function FridgeCard({ fridge, isOwner, delay }) {
  const router = useRouter();
  return (
    <button
      className={`fridge-card scale-in ${isOwner ? "owner" : "shared"} delay-${delay}`}
      onClick={() => router.push(`/dashboard/fridge/`)}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 12px", borderRadius: 100,
          fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.07em", textTransform: "uppercase",
          background: isOwner ? "rgba(200,224,110,0.18)" : "rgba(45,74,45,0.1)",
          color: isOwner ? "var(--card-owner-accent)" : "var(--card-shared-accent)",
        }}>
          {isOwner
            ? <><Crown size={10} strokeWidth={2} /> Il tuo frigo</>
            : <><Users size={10} strokeWidth={2} /> Condiviso</>}
        </span>

        <div style={{
          width: 32, height: 32, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          background: isOwner ? "rgba(200,224,110,0.15)" : "rgba(45,74,45,0.08)",
        }}>
          <ChevronRight size={15} strokeWidth={2}
            color={isOwner ? "var(--card-owner-accent)" : "var(--card-shared-accent)"} />
        </div>
      </div>

      {/* Name */}
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "clamp(1.2rem, 2vw, 1.45rem)", fontWeight: 700, lineHeight: 1.2,
        color: isOwner ? "var(--card-owner-text)" : "var(--card-shared-text)",
        marginBottom: 10
      }}>{fridge.name}</div>

      {/* Owner + members */}
      <div style={{
        fontSize: "0.82rem",
        color: isOwner ? "var(--card-owner-sub)" : "var(--card-shared-sub)",
        display: "flex", alignItems: "center", gap: 6
      }}>
        <span style={{
          width: 20, height: 20, borderRadius: "50%",
          background: isOwner ? "rgba(168,197,168,0.25)" : "rgba(45,74,45,0.12)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontSize: "0.6rem", fontWeight: 700,
          color: isOwner ? "var(--mint)" : "var(--sage)", flexShrink: 0
        }}>{fridge.ownerName.charAt(0)}</span>
        {isOwner ? "Tu" : fridge.ownerName}
        <span style={{ opacity: 0.4 }}>·</span>
        <Users size={11} strokeWidth={1.75} style={{ opacity: 0.6 }} />
        {fridge.members}
      </div>

      {/* Decorative circle */}
      <div style={{
        position: "absolute", bottom: -18, right: -18,
        width: 80, height: 80, borderRadius: "50%",
        background: isOwner ? "rgba(200,224,110,0.07)" : "rgba(45,74,45,0.05)",
        pointerEvents: "none"
      }} />
    </button>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const router = useRouter();
  const [fridges, setFridges] = useState(MOCK_FRIDGES);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, []);

  if (!currentUser) return null;

  const handleCreate = (name) => {
    setFridges(prev => [{
      id: "f" + Date.now(), name,
      ownerUid: currentUser.uid,
      ownerName: currentUser.displayName,
      members: 1,
    }, ...prev]);
  };

  const ownerFridges = fridges.filter(f => f.ownerUid === currentUser.uid);
  const sharedFridges = fridges.filter(f => f.ownerUid !== currentUser.uid);

  const handleLogout = async () => {
    await signOut(auth);
    document.cookie = "__session=; path=/; max-age=0";
    router.push("/");
  };

  return (
    <>
      <style>{globalStyles}</style>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(245,240,232,0.9)", backdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(45,74,45,0.08)",
        padding: "0 clamp(16px, 4vw, 56px)", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <Link href="/" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "1.35rem", color: "var(--forest)", flexShrink: 0, textDecoration: "none" }}>
          Sfrigo
        </Link>

        {/* Email — nascosta su mobile */}
        <div className="dashboard-email" style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "0.95rem", fontStyle: "italic",
          color: "var(--sage)", flex: 1, textAlign: "center",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          display: "clamp(0px, calc(100vw - 400px), 1px)" === "0px" ? "none" : "block"
        }}>
          Ciao, {currentUser.displayName || currentUser.email}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {/* "Nuovo frigo" — testo nascosto su mobile, solo icona */}
          <button className="btn-create" onClick={() => setShowModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Plus size={15} strokeWidth={2.25} />
            <span style={{ display: "var(--btn-text-display, inline)" }}>Nuovo frigo</span>
          </button>

          {/* Logout — solo icona su mobile, icona + testo su desktop */}
          <button
            onClick={handleLogout}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 14px", borderRadius: 100,
              color: "var(--mid)", border: "1.5px solid rgba(45,74,45,0.15)",
              background: "none", cursor: "pointer", fontSize: "0.88rem",
              fontFamily: "'DM Sans', sans-serif",
              transition: "border-color 0.2s, color 0.2s"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--moss)"; e.currentTarget.style.color = "var(--forest)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(45,74,45,0.15)"; e.currentTarget.style.color = "var(--mid)"; }}
          >
            <LogOut size={14} strokeWidth={1.75} />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </header>

      {/* ── MAIN ───────────────────────────────────────────────────────── */}
      <main style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "clamp(40px, 6vw, 72px) clamp(20px, 5vw, 56px)"
      }}>
        {/* Page heading */}
        <div className="fade-up" style={{ marginBottom: "clamp(40px, 6vw, 64px)" }}>
          <span style={{
            display: "inline-block", padding: "4px 14px",
            background: "var(--mint)", color: "var(--forest)",
            fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.09em",
            textTransform: "uppercase", borderRadius: 100, marginBottom: 16
          }}>I tuoi frigoriferi</span>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 900,
            color: "var(--forest)", lineHeight: 1.08, letterSpacing: "-0.02em"
          }}>Cosa c&apos;è in frigo?</h1>
        </div>

        {/* Gestiti da te */}
        {ownerFridges.length > 0 && (
          <section style={{ marginBottom: "clamp(48px, 7vw, 72px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.1rem", fontWeight: 700, color: "var(--forest)"
              }}>Gestiti da te</h2>
              <span style={{
                padding: "2px 10px", borderRadius: 100,
                background: "var(--forest)", color: "var(--lime)",
                fontSize: "0.72rem", fontWeight: 500
              }}>{ownerFridges.length}</span>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16
            }}>
              {ownerFridges.map((f, i) => (
                <FridgeCard key={f.id} fridge={f} isOwner delay={Math.min(i + 1, 6)} />
              ))}
            </div>
          </section>
        )}

        {/* Condivisi con te */}
        {sharedFridges.length > 0 && (
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <h2 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "1.1rem", fontWeight: 700, color: "var(--forest)"
              }}>Condivisi con te</h2>
              <span style={{
                padding: "2px 10px", borderRadius: 100,
                background: "rgba(45,74,45,0.1)", color: "var(--moss)",
                fontSize: "0.72rem", fontWeight: 500
              }}>{sharedFridges.length}</span>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16
            }}>
              {sharedFridges.map((f, i) => (
                <FridgeCard key={f.id} fridge={f} isOwner={false} delay={Math.min(i + 1, 6)} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {fridges.length === 0 && (
          <div className="empty-state">
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.4rem", fontWeight: 700,
              color: "var(--forest)", marginBottom: 12
            }}>Nessun frigorifero ancora</div>
            <p style={{
              color: "var(--mid)", fontSize: "0.88rem",
              marginBottom: 28, maxWidth: 320, lineHeight: 1.7
            }}>
              Crea il tuo primo frigo virtuale o attendi che qualcuno ti inviti.
            </p>
            <button className="btn-create" onClick={() => setShowModal(true)}>
              <Plus size={15} strokeWidth={2.25} /> Crea il primo frigo
            </button>
          </div>
        )}
      </main>

      {/* ── MODAL ──────────────────────────────────────────────────────── */}
      {showModal && (
        <CreateFridgeModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}
    </>
  );
}