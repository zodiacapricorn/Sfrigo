"use client";
import { Clock, Users, Grid, ChefHat, ArrowRight, LogIn, UserPlus, LogOut } from "lucide-react";
import { globalStyles, AnimatedStat, FeatureCard, ContextCard } from "./layout.js";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    document.cookie = "__session=; path=/; max-age=0; SameSite=Strict";
    router.refresh();
  };

  return (
    <>
      <style>{globalStyles}</style>
      <main style={{ background: "var(--cream)" }}>

        {/* NAV */}
        <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "0 clamp(24px, 5vw, 64px)", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(245,240,232,0.88)", backdropFilter: "blur(18px)", borderBottom: "1px solid rgba(45,74,45,0.07)" }}>

          {/* Logo */}
          <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: "1.35rem", color: "var(--forest)", letterSpacing: "-0.01em" }}>Sfrigo</div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {authLoading ? null : user ? (
              <>
                <a href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 100, color: "var(--forest)", fontSize: "0.87rem", fontWeight: 400, textDecoration: "none", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(45,74,45,0.07)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <Grid size={14} strokeWidth={1.75} /> Dashboard
                </a>
                <button onClick={handleLogout} className="btn-primary" style={{ padding: "9px 14px", fontSize: "0.87rem", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <LogOut size={14} strokeWidth={1.75} />
                  <span className="logout-text">Logout</span>
                </button>
              </>
            ) : (
              <>
                <a href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 100, color: "var(--forest)", fontSize: "0.87rem", fontWeight: 400, textDecoration: "none", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(45,74,45,0.07)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <LogIn size={14} strokeWidth={1.75} /> Accedi
                </a>
                <a href="/register" className="btn-primary" style={{ padding: "9px 22px", fontSize: "0.87rem" }}>Registrati</a>
              </>
            )}
          </div>
        </nav>

        {/* HERO */}
        <section className="noise" style={{ minHeight: "100vh", background: "linear-gradient(150deg, var(--forest) 0%, #233d28 60%, #1a3320 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "120px clamp(24px, 5vw, 80px) 100px", position: "relative", overflow: "hidden" }}>
          {[500, 780, 1060].map((s, i) => (
            <div key={i} style={{ position: "absolute", width: s, height: s, borderRadius: "50%", border: "1px solid rgba(168,197,168,0.07)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }} />
          ))}
          {[
            { text: "scorte", style: { top: "22%", left: "7%", animationDuration: "5s" } },
            { text: "scadenze", style: { bottom: "26%", right: "8%", animationDuration: "6s", animationDelay: "1.5s" } },
            { text: "ricette", style: { top: "60%", left: "5%", animationDuration: "7s", animationDelay: "0.8s" } },
          ].map(({ text, style }, i) => (
            <div key={i} style={{ position: "absolute", fontFamily: "'Playfair Display', serif", fontSize: "clamp(0.65rem, 1.2vw, 0.8rem)", color: "rgba(168,197,168,0.3)", letterSpacing: "0.14em", textTransform: "uppercase", animation: "drift 5s ease-in-out infinite", userSelect: "none", ...style }}>{text}</div>
          ))}

          <div style={{ maxWidth: 700, textAlign: "center", position: "relative", zIndex: 3 }}>
            <div className="animate-fadeIn tag" style={{ marginBottom: 32, background: "rgba(168,197,168,0.15)", color: "var(--mint)" }}>Cucina condivisa · Zero sprechi</div>
            <h1 className="serif animate-floatUp delay-1" style={{ fontSize: "clamp(3.2rem, 8vw, 6rem)", fontWeight: 900, color: "var(--cream)", lineHeight: 1.0, marginBottom: 32, letterSpacing: "-0.025em" }}>
              Il tuo frigo,<br /><em style={{ color: "var(--lime)", fontStyle: "italic" }}>finalmente</em><br />in ordine.
            </h1>
            <p className="animate-floatUp delay-2" style={{ fontSize: "clamp(0.95rem, 2vw, 1.1rem)", color: "var(--mint)", lineHeight: 1.8, maxWidth: 480, margin: "0 auto 48px" }}>
              Monitora gli alimenti, condividi le scorte e organizza gli spazi in modo semplice e collaborativo.
            </p>
            <div className="animate-floatUp delay-3" style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              {authLoading ? null : user ? (
                <a href="/dashboard" className="btn-primary">
                  Vai alla dashboard <ArrowRight size={15} strokeWidth={2.25} />
                </a>
              ) : (
                <>
                  <a href="/register" className="btn-primary">Inizia gratis <ArrowRight size={15} strokeWidth={2.25} /></a>
                  <a href="/login" className="btn-ghost">Accedi al tuo account</a>
                </>
              )}
            </div>
          </div>

          <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, zIndex: 4 }}>
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
              <path d="M0 80 C360 20 1080 20 1440 80 L1440 80 L0 80 Z" fill="var(--cream)" />
            </svg>
          </div>
        </section>

        {/* TICKER */}
        <div style={{ background: "var(--lime)", padding: "13px 0", overflow: "hidden" }}>
          <div style={{ display: "flex", gap: 56, width: "max-content", animation: "marquee 22s linear infinite", whiteSpace: "nowrap" }}>
            {["Scorte sempre aggiornate", "Niente più scadenze dimenticate", "Collaborazione in tempo reale", "Ricette su misura", "Meno sprechi, più consapevolezza", "Organizzazione per categorie",
              "Scorte sempre aggiornate", "Niente più scadenze dimenticate", "Collaborazione in tempo reale", "Ricette su misura", "Meno sprechi, più consapevolezza", "Organizzazione per categorie"
            ].map((t, i) => (
              <span key={i} style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--forest)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {t}&nbsp;&nbsp;<span style={{ opacity: 0.35 }}>◆</span>
              </span>
            ))}
          </div>
        </div>

        {/* OBIETTIVO */}
        <section style={{ padding: "clamp(72px, 10vw, 130px) clamp(24px, 5vw, 80px)", background: "var(--cream)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "60px 80px", alignItems: "center" }}>
            <div>
              <span className="tag" style={{ marginBottom: 24, display: "inline-block" }}>Obiettivo</span>
              <h2 className="serif" style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.4rem)", fontWeight: 700, color: "var(--forest)", lineHeight: 1.1, marginBottom: 28 }}>
                Meno sprechi,<br />più armonia<br /><em style={{ color: "var(--sage)" }}>in cucina.</em>
              </h2>
              <p style={{ color: "var(--mid)", lineHeight: 1.85, fontSize: "0.96rem", maxWidth: 400 }}>
                Sfrigo nasce per semplificare la gestione degli alimenti condivisi. Tieni sotto controllo le scorte, migliora la collaborazione e riduci lo spreco in modo pratico e immediato.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {["Monitoraggio visivo delle scorte in tempo reale", "Collaborazione fluida tra tutti i coinquilini", "Riduzione concreta degli sprechi alimentari"].map((label, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, background: "#fff", border: "1.5px solid rgba(45,74,45,0.09)", borderRadius: 14, padding: "18px 22px" }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, color: "var(--lime)", background: "var(--forest)", width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "0.78rem" }}>0{i + 1}</span>
                  <span style={{ color: "var(--forest)", fontSize: "0.91rem", lineHeight: 1.5 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* STATS */}
        <section style={{ background: "var(--forest)", padding: "clamp(56px, 8vw, 90px) clamp(24px, 5vw, 80px)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 50%, rgba(168,197,168,0.06) 0%, transparent 65%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 48, position: "relative" }}>
            <AnimatedStat value={30} suffix="%" label="spreco risparmiato" />
            <AnimatedStat value={4} suffix="×" label="contesti d'uso" />
            <AnimatedStat value={100} suffix="%" label="collaborativo" />
          </div>
        </section>

        {/* FUNZIONALITÀ */}
        <section style={{ padding: "clamp(72px, 10vw, 130px) clamp(24px, 5vw, 80px)", background: "var(--paper)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ marginBottom: 60 }}>
              <span className="tag" style={{ marginBottom: 18, display: "inline-block" }}>Funzionalità</span>
              <h2 className="serif" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "var(--forest)" }}>Tutto ciò di cui hai bisogno</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
              <FeatureCard number="01" LucideIcon={Clock} accent="#C4622D" title="Scadenze & Quantità" desc="Avvisi automatici prima che un prodotto scada. Dì addio al cibo dimenticato in fondo al cassetto." />
              <FeatureCard number="02" LucideIcon={Users} accent="#2D4A2D" title="Condivisione facile" desc="Invita coinquilini, familiari o colleghi. Ogni aggiornamento è visibile a tutti in tempo reale." />
              <FeatureCard number="03" LucideIcon={Grid} accent="#6B8C6B" title="Organizzazione smart" desc="Categorizza i prodotti per tipo o zona del frigo. Trova tutto al volo con un sistema intuitivo." />
              <FeatureCard number="04" LucideIcon={ChefHat} accent="#C8E06E" title="Ricette personalizzate" desc="Suggerimenti di ricette basati su ciò che hai già. Cucina di più, spreca meno." />
            </div>
          </div>
        </section>

        {/* CONTESTI — pura tipografia, zero icone */}
        <section style={{ padding: "clamp(72px, 10vw, 130px) clamp(24px, 5vw, 80px)", background: "var(--cream)" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ marginBottom: 56 }}>
              <span className="tag" style={{ marginBottom: 18, display: "inline-block" }}>Dove usarla</span>
              <h2 className="serif" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, color: "var(--forest)" }}>Adatta a ogni contesto</h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {[
                { label: "Case condivise", subtitle: "Ordine senza discussioni tra coinquilini." },
                { label: "Famiglie", subtitle: "Coordina la spesa, evita i doppioni, pianifica i pasti." },
                { label: "Residenze universitarie", subtitle: "Gestisci le scorte comuni in modo trasparente." },
                { label: "Ambienti di lavoro", subtitle: "La cucina dell'ufficio, finalmente organizzata." },
              ].map((c, i) => <ContextCard key={i} {...c} index={i} />)}
            </div>
          </div>
        </section>

        {/* VISIONE */}
        <section style={{ padding: "clamp(72px, 10vw, 130px) clamp(24px, 5vw, 80px)", background: "var(--forest)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", width: 800, height: 800, borderRadius: "50%", border: "1px solid rgba(168,197,168,0.08)", top: "50%", right: "-250px", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 720, position: "relative", zIndex: 2 }}>
            <span className="tag" style={{ marginBottom: 28, display: "inline-block", background: "rgba(168,197,168,0.15)", color: "var(--mint)" }}>Visione</span>
            <h2 className="serif" style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", fontWeight: 700, color: "var(--cream)", lineHeight: 1.08, marginBottom: 30 }}>
              Uno strumento semplice<br /><em style={{ color: "var(--lime)" }}>per un futuro più<br />consapevole.</em>
            </h2>
            <p style={{ color: "var(--mint)", lineHeight: 1.9, fontSize: "clamp(0.94rem, 1.8vw, 1.05rem)", maxWidth: 520 }}>
              L'obiettivo è ottimizzare i consumi, migliorare l'organizzazione e promuovere un uso più consapevole delle risorse — una cucina condivisa alla volta.
            </p>
            <div style={{ marginTop: 48, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {["Sostenibilità", "Semplicità", "Comunità"].map((t, i) => (
                <div key={i} style={{ padding: "9px 22px", border: "1px solid rgba(168,197,168,0.22)", borderRadius: 100, color: "var(--mint)", fontSize: "0.82rem", letterSpacing: "0.05em", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{t}</div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "clamp(90px, 14vw, 160px) clamp(24px, 5vw, 80px)", background: "var(--cream)", textAlign: "center" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            {authLoading ? null : user ? (
              <>
                <h2 className="serif" style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)", fontWeight: 700, color: "var(--forest)", lineHeight: 1.08, marginBottom: 22 }}>
                  Bentornato.<br />
                  <em style={{ color: "var(--sage)", fontStyle: "italic" }}>Il tuo frigo ti aspetta.</em>
                </h2>
                <p style={{ color: "var(--mid)", marginBottom: 44, fontSize: "0.97rem", lineHeight: 1.75 }}>
                  Controlla le scorte, aggiungi alimenti e tieni d&apos;occhio le scadenze.
                </p>
                <a href="/dashboard" className="btn-primary" style={{ background: "var(--forest)", color: "var(--lime)", padding: "16px 40px", fontSize: "1rem" }}>
                  <Grid size={16} strokeWidth={1.75} /> Apri la dashboard
                </a>
              </>
            ) : (
              <>
                <h2 className="serif" style={{ fontSize: "clamp(2.2rem, 5.5vw, 4rem)", fontWeight: 700, color: "var(--forest)", lineHeight: 1.08, marginBottom: 22 }}>
                  Pronto a fare ordine<br />nel tuo frigo?
                </h2>
                <p style={{ color: "var(--mid)", marginBottom: 44, fontSize: "0.97rem", lineHeight: 1.75 }}>
                  Crea un account in 30 secondi e inizia a organizzare, condividere e ridurre gli sprechi.
                </p>
                <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                  <a href="/register" className="btn-primary" style={{ background: "var(--forest)", color: "var(--lime)", padding: "16px 40px", fontSize: "1rem" }}>
                    <UserPlus size={16} strokeWidth={1.75} /> Crea account gratuito
                  </a>
                  <a href="/login" style={{ padding: "16px 36px", borderRadius: 100, border: "1.5px solid rgba(45,74,45,0.22)", color: "var(--forest)", fontSize: "1rem", fontWeight: 400, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, transition: "border-color 0.2s, background 0.2s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(45,74,45,0.05)"; e.currentTarget.style.borderColor = "var(--moss)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(45,74,45,0.22)"; }}>
                    <LogIn size={15} strokeWidth={1.75} /> Accedi
                  </a>
                </div>
              </>
            )}
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ background: "var(--forest)", padding: "28px clamp(24px, 5vw, 64px)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontFamily: "'Playfair Display', serif", color: "var(--cream)", fontWeight: 700, fontSize: "1rem" }}>Sfrigo</span>
          <span style={{ color: "var(--sage)", fontSize: "0.78rem", letterSpacing: "0.04em" }}>© 2025 · Meno sprechi, più sapore</span>
        </footer>

      </main>
    </>
  );
}