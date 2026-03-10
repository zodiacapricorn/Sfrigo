"use client";

import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";
import { globalStyles } from "./layout.js";
import { setSessionCookie, syncUserToDb } from "@/lib/authHelpers";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Le password non coincidono");
      return;
    }
    if (password.length < 6) {
      setError("La password deve essere di almeno 6 caratteri");
      return;
    }

    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      if (name.trim()) {
        await updateProfile(result.user, { displayName: name.trim() });
      }

      // Salva utente in PostgreSQL
      await syncUserToDb(result.user, name.trim() || email.split("@")[0]);

      await setSessionCookie(result.user);
      router.refresh();
      router.push("/dashboard");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") setError("Email già in uso");
      else if (err.code === "auth/invalid-email") setError("Email non valida");
      else if (err.code === "auth/weak-password") setError("Password troppo debole");
      else setError("Errore durante la registrazione");
    }
    setLoading(false);
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true); setError("");
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Salva/aggiorna utente in PostgreSQL (upsert — sicuro anche se già esiste)
      await syncUserToDb(result.user);

      await setSessionCookie(result.user);
      router.refresh();
      router.push("/dashboard");
    } catch (err) {
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
            { text: "scorte",  top: "18%",    left: "10%",  dur: "5s" },
            { text: "ricette", bottom: "22%", right: "10%", dur: "6.5s", delay: "1.2s" },
            { text: "frigo",   top: "62%",    left: "8%",   dur: "7s",   delay: "0.5s" },
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
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 700, color: "var(--forest)", lineHeight: 1.1, marginBottom: 10 }}>Crea account.</h2>
              <p style={{ color: "var(--mid)", fontSize: "0.88rem", lineHeight: 1.6 }}>Unisciti a Sfrigo e inizia a gestire il tuo frigorifero.</p>
            </div>

            <form onSubmit={handleRegister}>
              <div className="fade-up delay-1" style={{ marginBottom: 18 }}>
                <label htmlFor="name">Nome</label>
                <input id="name" type="text" placeholder="Il tuo nome" value={name} onChange={e => setName(e.target.value)} className="input-field" />
              </div>

              <div className="fade-up delay-2" style={{ marginBottom: 18 }}>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" required placeholder="nome@email.com" value={email} onChange={e => setEmail(e.target.value)} className="input-field" />
              </div>

              <div className="fade-up delay-3" style={{ marginBottom: 18 }}>
                <label htmlFor="password">Password</label>
                <input id="password" type="password" required placeholder="Minimo 6 caratteri" value={password} onChange={e => setPassword(e.target.value)} className="input-field" />
              </div>

              <div className="fade-up delay-4" style={{ marginBottom: 6 }}>
                <label htmlFor="confirm">Conferma password</label>
                <input id="confirm" type="password" required placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-field" />
              </div>

              {error && (
                <div style={{ margin: "14px 0", padding: "10px 16px", background: "rgba(196,98,45,0.07)", border: "1px solid rgba(196,98,45,0.2)", borderRadius: 10, color: "#C4622D", fontSize: "0.83rem", textAlign: "center" }}>{error}</div>
              )}

              <div className="fade-up delay-5" style={{ marginTop: 26 }}>
                <button type="submit" disabled={loading} className="btn-submit">
                  {loading ? "Registrazione in corso…" : <><UserPlus size={15} strokeWidth={1.75} /> Crea account</>}
                </button>
              </div>
            </form>

            <div className="fade-up" style={{ display: "flex", alignItems: "center", gap: 14, margin: "26px 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(45,74,45,0.12)" }} />
              <span style={{ color: "var(--mid)", fontSize: "0.75rem", letterSpacing: "0.06em", textTransform: "uppercase" }}>oppure</span>
              <div style={{ flex: 1, height: 1, background: "rgba(45,74,45,0.12)" }} />
            </div>

            <div className="fade-up">
              <button onClick={handleGoogleRegister} disabled={googleLoading} className="btn-google">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" width={18} height={18} />
                {googleLoading ? "Registrazione in corso…" : "Continua con Google"}
              </button>
            </div>

            <p style={{ textAlign: "center", marginTop: 32, fontSize: "0.85rem", color: "var(--mid)" }}>
              Hai già un account?{" "}
              <Link href="/login"
                style={{ color: "var(--forest)", fontWeight: 500, textDecoration: "none", borderBottom: "1px solid rgba(45,74,45,0.3)", paddingBottom: 1, transition: "border-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--forest)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(45,74,45,0.3)"}
              >Accedi</Link>
            </p>

          </div>
        </div>
      </div>
    </>
  );
}