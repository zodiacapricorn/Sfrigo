"use client";

import Link from "next/link.js";
import { Plus, LogOut, ChevronRight, Users, Crown } from "lucide-react";
import { globalStyles } from "./layout.js";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { apiFetch } from "@/lib/api";

// ── Create Modal ──────────────────────────────────────────────────────────────
function CreateFridgeModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await onCreate(name.trim());
      onClose();
    } catch (err) {
      setError(err.message || "Errore durante la creazione");
    }
    setLoading(false);
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

          {error && (
            <div style={{
              marginBottom: 16, padding: "10px 16px",
              background: "rgba(196,98,45,0.07)",
              border: "1px solid rgba(196,98,45,0.2)",
              borderRadius: 10, color: "#C4622D", fontSize: "0.83rem"
            }}>{error}</div>
          )}

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

            <button type="submit" disabled={loading} style={{
              flex: 2, padding: "13px", background: "var(--forest)", color: "var(--lime)",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "0.92rem",
              border: "none", borderRadius: 12, cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              opacity: loading ? 0.7 : 1, transition: "background 0.2s"
            }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = "var(--moss)")}
              onMouseLeave={e => e.currentTarget.style.background = "var(--forest)"}
            >
              <Plus size={15} strokeWidth={2} />
              {loading ? "Creazione…" : "Crea frigo"}
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
      onClick={() => router.push(`/dashboard/fridge/${fridge.id}`)}
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

      {/* Owner info */}
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
        }}>
          {isOwner
            ? "Tu"
            : (fridge.owner_username?.charAt(0)?.toUpperCase() || "?")}
        </span>
        {isOwner ? "Tu" : (fridge.owner_username || "Utente sconosciuto")}
        {fridge.role && (
          <>
            <span style={{ opacity: 0.4 }}>·</span>
            <span style={{ opacity: 0.7, fontSize: "0.75rem", textTransform: "capitalize" }}>
              Proprietario
            </span>
          </>
        )}
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
  const [fridges, setFridges] = useState([]);
  const [loadingFridges, setLoadingFridges] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchFridges = async () => {
    try {
      const data = await apiFetch("/fridges");
      setFridges(data || []);
      setFetchError("");
    } catch (err) {
      console.error("Errore fetch frigo:", err);
      setFetchError("Impossibile caricare i frigoriferi. Riprova più tardi.");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await fetchFridges();
        setLoadingFridges(false);
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(fetchFridges, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  if (!currentUser) return null;

  // L'API restituisce { id, name, owner_id, created_at, role } per ogni frigo
  const ownerFridges = fridges.filter(f => f.owner_id === currentUser.uid);
  const sharedFridges = fridges.filter(f => f.owner_id !== currentUser.uid);

  const handleCreate = async (name) => {
    const newFridge = await apiFetch("/fridges", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    setFridges(prev => [newFridge, ...prev]);
  };

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

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button className="btn-create" onClick={() => setShowModal(true)} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
            <Plus size={15} strokeWidth={2.25} />
            <span style={{ display: "var(--btn-text-display, inline)" }}>Nuovo frigo</span>
          </button>

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
        <div className="fade-up" style={{ marginBottom: "clamp(32px, 5vw, 52px)" }}>
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
          }}>
            Bentornato,<br />
            <em style={{ color: "var(--sage)", fontStyle: "italic" }}>
              {currentUser.displayName?.split(" ")[0] || currentUser.email}.
            </em>
          </h1>
        </div>

        {/* Loading */}
        {loadingFridges && (
          <div style={{ color: "var(--mid)", fontSize: "0.9rem", padding: "40px 0" }}>
            Caricamento frigoriferi…
          </div>
        )}

        {/* Error */}
        {fetchError && (
          <div style={{
            padding: "16px 20px", borderRadius: 12,
            background: "rgba(196,98,45,0.07)",
            border: "1px solid rgba(196,98,45,0.2)",
            color: "#C4622D", fontSize: "0.88rem", marginBottom: 32
          }}>{fetchError}</div>
        )}

        {/* Gestiti da te */}
        {!loadingFridges && ownerFridges.length > 0 && (
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
        {!loadingFridges && sharedFridges.length > 0 && (
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
        {!loadingFridges && !fetchError && fridges.length === 0 && (
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