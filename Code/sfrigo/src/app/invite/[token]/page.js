"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiFetch } from "@/lib/api";

// ── Pagina: app/invite/[token]/page.jsx ──────────────────────────────────────
export default function InvitePage({ params }) {
  const { token } = use(params);
  const router = useRouter();

  const [status, setStatus] = useState("loading"); // loading | accepting | success | expired | error | unauthenticated

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Non loggato → redirect al login con redirect param
        router.replace(`/login?redirect=/invite/${token}`);
        return;
      }

      setStatus("accepting");
      try {
        const data = await apiFetch(`/invites/${token}/accept`, { method: "POST" });
        setStatus("success");
        // Dopo 2 secondi redirect al frigo
        setTimeout(() => {
          router.replace(`/dashboard/fridge/${data.fridge_id}`);
        }, 2000);
      } catch (err) {
        if (err.message?.includes("scaduto") || err.message?.includes("410")) {
          setStatus("expired");
        } else if (err.message?.includes("404")) {
          setStatus("error");
        } else {
          setStatus("error");
        }
      }
    });
    return () => unsubscribe();
  }, [token, router]);

  const styles = {
    page: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg, #F5F0E8)",
      fontFamily: "'DM Sans', sans-serif",
      padding: "24px",
    },
    card: {
      background: "#fff",
      borderRadius: 20,
      padding: "44px 40px",
      maxWidth: 400,
      width: "100%",
      textAlign: "center",
      boxShadow: "0 4px 32px rgba(26,51,32,0.08)",
      border: "1.5px solid rgba(45,74,45,0.09)",
    },
    icon: (bg) => ({
      width: 56,
      height: 56,
      borderRadius: "50%",
      background: bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 18px",
      fontSize: "1.6rem",
    }),
    title: {
      fontFamily: "'Playfair Display', serif",
      fontSize: "1.5rem",
      fontWeight: 700,
      color: "#1A3320",
      marginBottom: 10,
    },
    body: {
      color: "#6B8C6B",
      fontSize: "0.88rem",
      lineHeight: 1.65,
    },
    spinner: {
      width: 36,
      height: 36,
      border: "3px solid rgba(45,74,45,0.15)",
      borderTop: "3px solid #2D4A2D",
      borderRadius: "50%",
      animation: "spin 0.8s linear infinite",
      margin: "0 auto 18px",
    },
  };

  const content = {
    loading: {
      icon: null,
      spinner: true,
      title: "Verifica in corso…",
      body: "Stiamo controllando il tuo accesso.",
    },
    accepting: {
      icon: null,
      spinner: true,
      title: "Accettazione invito…",
      body: "Stiamo aggiungendoti al frigorifero.",
    },
    success: {
      icon: { emoji: "✅", bg: "rgba(200,224,110,0.25)" },
      title: "Benvenuto nel frigo!",
      body: "Sei stato aggiunto con successo. Verrai reindirizzato a breve…",
    },
    expired: {
      icon: { emoji: "⏰", bg: "rgba(196,98,45,0.12)" },
      title: "Link scaduto",
      body: "Questo link di invito non è più valido. Chiedi al proprietario del frigorifero di generarne uno nuovo.",
    },
    error: {
      icon: { emoji: "❌", bg: "rgba(180,60,60,0.1)" },
      title: "Link non valido",
      body: "Non abbiamo trovato questo invito. Potrebbe essere stato revocato o il link non è corretto.",
    },
  };

  const c = content[status] || content.error;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #F5F0E8; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <div style={styles.page}>
        <div style={styles.card}>
          {/* Logo */}
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, fontSize: "1.4rem", color: "#1A3320", marginBottom: 28, letterSpacing: "-0.02em" }}>
            Sfrigo
          </div>

          {c.spinner && <div style={styles.spinner} />}
          {c.icon && (
            <div style={styles.icon(c.icon.bg)}>
              {c.icon.emoji}
            </div>
          )}

          <div style={styles.title}>{c.title}</div>
          <p style={styles.body}>{c.body}</p>

          {(status === "expired" || status === "error") && (
            <button
              onClick={() => router.push("/dashboard")}
              style={{ marginTop: 24, padding: "10px 24px", background: "#1A3320", color: "#C8E06E", fontFamily: "'DM Sans',sans-serif", fontWeight: 500, fontSize: "0.88rem", border: "none", borderRadius: 100, cursor: "pointer" }}
            >
              Vai alla Dashboard
            </button>
          )}
        </div>
      </div>
    </>
  );
}