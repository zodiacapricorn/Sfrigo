export const dynamic = 'force-dynamic';

"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, LogIn } from "lucide-react";
import { globalStyles } from "./layout.js";
import { setSessionCookie, syncUserToDb } from "@/lib/authHelpers";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await syncUserToDb(result.user);
      await setSessionCookie(result.user);
      router.refresh();
      router.push(redirectTo);
    } catch (err) {
      if (err.code === "auth/user-not-found") setError("Utente non trovato");
      else if (err.code === "auth/wrong-password") setError("Password non corretta");
      else if (err.code === "auth/invalid-credential") setError("Email o password non corretti");
      else setError("Errore durante l'accesso");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true); setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await syncUserToDb(result.user);
      await setSessionCookie(result.user);
      router.refresh();
      router.push(redirectTo);
    } catch (err) {
      console.error("Errore Google completo:", err.code, err.message);
      setError("Errore con Google: " + err.code);
    }
    setGoogleLoading(false);
  };

  return (
    <>
      <style>{globalStyles}</style>
      <div style={{ minHeight: "100vh", display: "flex" }}>

        {/* LEFT — Brand panel */}
        <div
          id="brand-panel"
          className="noise"
          style={{
            flex: "0 0 44%", maxWidth: "44%",
            background: "linear-gradient(150deg, var(--forest) 0%, #233d28 60%, #1a3320 100%)",
            position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "clamp(40px, 5vw, 72px)",
          }}
        >
          {[380, 620, 860].map((s, i) => (
            <div key={i} style={{
              position: "absolute", width: s, height: s, borderRadius: "50%",
              border: "1px solid rgba(168,197,168,0.07)",
              top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              pointerEvents: "none"
            }} />
          ))}

          {[
            { text: "scorte", top: "18%", left: "10%", dur: "5s" },
            { text: "ricette", bottom: "22%", right: "10%", dur: "6.5s", delay: "1.2s" },
            { text: "frigo", top: "62%", left: "8%", dur: "7s", delay: "0.5s" },
          ].map(({ text, dur, delay, ...pos }, i) => (
            <div key={i} style={{
              position: "absolute", ...pos,
              fontFamily: "'Playfair Display', serif",
              fontSize: "0.72rem", color: "rgba(168,197,168,0.28)",
              letterSpacing: "0.14em", textTransform: "uppercase",
              animation: `drift ${dur} ease-in-out infinite`,
              animationDelay: delay || "0s",
              userSelect: "none", zIndex: 1
            }}>{text}</div>
          ))}

          <div style={{ position: "relative", zIndex: 2, maxWidth: 360 }}>
            <div style={{
              display: "inline-block", padding: "4px 14px",
              background: "rgba(168,197,168,0.15)", color: "var(--mint)",
              fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.09em",
              textTransform: "uppercase", borderRadius: 100, marginBottom: 28
            }}>Cucina condivisa</div>

            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2.2rem, 3vw, 3rem)",
              fontWeight: 900, color: "var(--cream)",
              lineHeight: 1.1, marginBottom: 20, letterSpacing: "-0.02em"
            }}>
              Frigo condiviso,<br />
              <em style={{ color: "var(--lime)", fontStyle: "italic" }}>zero sprechi.</em>
            </h1>

            <p style={{ color: "var(--mint)", lineHeight: 1.8, fontSize: "0.9rem", marginBottom: 44 }}>
              Monitora gli alimenti, condividi le scorte con i tuoi coinquilini
              e ricevi suggerimenti di ricette basati su ciò che hai già.
            </p>

            <Link href="/"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--sage)", fontSize: "0.8rem", textDecoration: "none", letterSpacing: "0.02em", transition: "color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--mint)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--sage)"}
            >
              <ArrowLeft size={13} strokeWidth={1.75} /> Torna alla home
            </Link>
          </div>
        </div>

        {/* RIGHT — Form */}
        <div style={{
          flex: 1, background: "var(--cream)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "clamp(32px, 5vw, 60px) clamp(24px, 6vw, 72px)",
          minHeight: "100vh"
        }}>
          <div style={{ width: "100%", maxWidth: 400 }}>

            <div style={{ marginBottom: 32 }}>
              <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--sage)", fontSize: "0.8rem", textDecoration: "none" }}>
                <ArrowLeft size={13} strokeWidth={1.75} /> Home
              </Link>
            </div>

            <div className="fade-up" style={{ marginBottom: 40 }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 700, color: "var(--forest)", lineHeight: 1.1, marginBottom: 10 }}>Bentornato.</h2>
              <p style={{ color: "var(--mid)", fontSize: "0.88rem", lineHeight: 1.6 }}>Accedi per continuare a gestire il tuo frigorifero.</p>
            </div>

            <form onSubmit={handleEmailLogin}>
              <div className="fade-up delay-1" style={{ marginBottom: 18 }}>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" required placeholder="nome@email.com" value={email} onChange={e => setEmail(e.target.value)} className="input-field" />
              </div>

              <div className="fade-up delay-2" style={{ marginBottom: 6 }}>
                <label htmlFor="password">Password</label>
                <input id="password" type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="input-field" />
              </div>

              {error && (
                <div style={{ margin: "14px 0", padding: "10px 16px", background: "rgba(196,98,45,0.07)", border: "1px solid rgba(196,98,45,0.2)", borderRadius: 10, color: "#C4622D", fontSize: "0.83rem", textAlign: "center" }}>{error}</div>
              )}

              <div className="fade-up delay-3" style={{ marginTop: 26 }}>
                <button type="submit" disabled={loading} className="btn-submit">
                  {loading ? "Accesso in corso…" : <><LogIn size={15} strokeWidth={1.75} /> Accedi</>}
                </button>
              </div>
            </form>

            <div className="fade-up delay-4" style={{ display: "flex", alignItems: "center", gap: 14, margin: "26px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(45,74,45,0.12)" }} />
              <span style={{ color: "var(--mid)", fontSize: "0.75rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>oppure</span>
              <div style={{ flex: 1, height: 1, background: "rgba(45,74,45,0.12)" }} />
            </div>

            <div className="fade-up delay-5">
              <button onClick={handleGoogleLogin} disabled={googleLoading} className="btn-google">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={18} height={18} />
                {googleLoading ? "Accesso in corso…" : "Continua con Google"}
              </button>
            </div>

            <p style={{ textAlign: "center", marginTop: 32, fontSize: "0.85rem", color: "var(--mid)" }}>
              Non hai un account?{" "}
              <Link href="/register"
                style={{ color: "var(--forest)", fontWeight: 500, textDecoration: "none", borderBottom: "1px solid rgba(45,74,45,0.3)", paddingBottom: 1, transition: "border-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--forest)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(45,74,45,0.3)"}
              >Registrati</Link>
            </p>

          </div>
        </div>
      </div>
    </>
  );
}