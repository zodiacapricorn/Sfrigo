"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";
import { CheckCircle, Clock, XCircle, ArrowRight } from "lucide-react";

// ── Pagina: app/invite/[token]/page.jsx ──────────────────────────────────────
export default function InvitePage({ params }) {
  const { token } = use(params);
  const router = useRouter();

  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace(`/login?redirect=/invite/${token}`);
        return;
      }
      setStatus("accepting");
      try {
        const data = await apiFetch(`/invites/${token}/accept`, { method: "POST" });
        setStatus("success");
        setTimeout(() => router.replace(`/dashboard/fridge/${data.fridge_id}`), 2500);
      } catch (err) {
        if (err.message?.includes("scaduto") || err.message?.includes("410")) {
          setStatus("expired");
        } else {
          setStatus("error");
        }
      }
    });
    return () => unsubscribe();
  }, [token, router]);

  const isLoading = status === "loading" || status === "accepting";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F5F0E8; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .invite-card { animation: fadeUp 0.5s ease both; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#F5F0E8",
        padding: "clamp(24px, 5vw, 48px)",
        fontFamily: "'DM Sans', sans-serif",
      }}>

        {/* Logo */}
        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontWeight: 900,
          fontSize: "1.5rem",
          color: "#1A3320",
          letterSpacing: "-0.02em",
          marginBottom: 40,
        }}>
          Sfrigo
        </div>

        <div className="invite-card" style={{
          background: "#fff",
          borderRadius: 20,
          padding: "clamp(36px, 6vw, 56px) clamp(28px, 6vw, 52px)",
          maxWidth: 460,
          width: "100%",
          border: "1.5px solid rgba(45,74,45,0.09)",
          boxShadow: "0 2px 24px rgba(26,51,32,0.07)",
        }}>

          {/* Stato loading / accepting */}
          {isLoading && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 44,
                height: 44,
                border: "3px solid rgba(45,74,45,0.12)",
                borderTop: "3px solid #2D4A2D",
                borderRadius: "50%",
                animation: "spin 0.75s linear infinite",
                margin: "0 auto 28px",
              }} />
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.5rem, 4vw, 1.9rem)",
                fontWeight: 700,
                color: "#1A3320",
                marginBottom: 12,
                lineHeight: 1.2,
              }}>
                {status === "loading" ? "Un momento…" : "Accettazione in corso"}
              </h1>
              <p style={{ color: "#6B8C6B", fontSize: "0.95rem", lineHeight: 1.7 }}>
                {status === "loading"
                  ? "Stiamo verificando il tuo accesso."
                  : "Ti stiamo aggiungendo al frigorifero."}
              </p>
            </div>
          )}

          {/* Stato success */}
          {status === "success" && (
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "rgba(200,224,110,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
              }}>
                <CheckCircle size={26} color="#2D4A2D" strokeWidth={1.75} />
              </div>
              <h1 style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.5rem, 4vw, 1.9rem)",
                fontWeight: 700,
                color: "#1A3320",
                marginBottom: 12,
                lineHeight: 1.2,
              }}>
                Sei dentro.
              </h1>
              <p style={{ color: "#6B8C6B", fontSize: "0.95rem", lineHeight: 1.7 }}>
                Sei stato aggiunto al frigorifero con successo. Verrai reindirizzato a breve.
              </p>
            </div>
          )}

          {/* Stato expired */}
          {status === "expired" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(196,98,45,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Clock size={20} color="#C4622D" strokeWidth={1.75} />
                </div>
                <h1 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(1.3rem, 3.5vw, 1.65rem)",
                  fontWeight: 700,
                  color: "#1A3320",
                  lineHeight: 1.2,
                }}>
                  Link scaduto
                </h1>
              </div>
              <p style={{ color: "#6B8C6B", fontSize: "0.93rem", lineHeight: 1.75, marginBottom: 28 }}>
                Questo invito non è più valido. Chiedi al proprietario del frigorifero di generarne uno nuovo — scadono dopo 24 ore.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "11px 24px", background: "#1A3320", color: "#C8E06E",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "0.9rem",
                  border: "none", borderRadius: 100, cursor: "pointer",
                }}
              >
                Vai alla dashboard <ArrowRight size={14} strokeWidth={2} />
              </button>
            </>
          )}

          {/* Stato error */}
          {status === "error" && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "rgba(180,60,60,0.09)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <XCircle size={20} color="#b43c3c" strokeWidth={1.75} />
                </div>
                <h1 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(1.3rem, 3.5vw, 1.65rem)",
                  fontWeight: 700,
                  color: "#1A3320",
                  lineHeight: 1.2,
                }}>
                  Link non valido
                </h1>
              </div>
              <p style={{ color: "#6B8C6B", fontSize: "0.93rem", lineHeight: 1.75, marginBottom: 28 }}>
                Non siamo riusciti a trovare questo invito. Potrebbe essere stato revocato o il link potrebbe essere incompleto.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "11px 24px", background: "#1A3320", color: "#C8E06E",
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: "0.9rem",
                  border: "none", borderRadius: 100, cursor: "pointer",
                }}
              >
                Vai alla dashboard <ArrowRight size={14} strokeWidth={2} />
              </button>
            </>
          )}

        </div>
      </div>
    </>
  );
}