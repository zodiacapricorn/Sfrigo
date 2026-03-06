"use client";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useEffect, useRef, useState } from "react";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
export const AnimatedStat = ({ value, suffix = "", label }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      let n = 0;
      const tick = () => { n += Math.ceil(value / 45); if (n >= value) { setCount(value); return; } setCount(n); requestAnimationFrame(tick); };
      requestAnimationFrame(tick); obs.disconnect();
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.8rem, 6vw, 4.5rem)", fontWeight: 900, color: "var(--lime)", lineHeight: 1 }}>{count}{suffix}</div>
      <div style={{ fontSize: "0.8rem", color: "var(--mint)", marginTop: 8, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
};

export const FeatureCard = ({ LucideIcon, number, title, desc, accent }) => (
  <div className="card-hover animate-scaleIn" style={{ background: "#fff", border: "1.5px solid rgba(45,74,45,0.09)", borderRadius: 20, padding: "36px 30px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "3.5rem", fontWeight: 900, color: `${accent}18`, lineHeight: 1, userSelect: "none" }}>{number}</span>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <LucideIcon size={18} color={accent} strokeWidth={1.75} />
      </div>
    </div>
    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: "var(--forest)", marginBottom: 10 }}>{title}</h3>
    <p style={{ fontSize: "0.87rem", color: "var(--mid)", lineHeight: 1.7 }}>{desc}</p>
  </div>
);

export const ContextCard = ({ label, subtitle, index }) => (
  <div className="card-hover" style={{ background: index % 2 === 0 ? "#fff" : "var(--moss)", borderRadius: 20, padding: "32px 28px", border: "1.5px solid transparent", cursor: "default" }}>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.2rem, 2.5vw, 1.45rem)", fontWeight: 700, color: index % 2 === 0 ? "var(--forest)" : "var(--cream)", marginBottom: 10 }}>{label}</div>
    <p style={{ fontSize: "0.84rem", lineHeight: 1.65, color: index % 2 === 0 ? "var(--mid)" : "var(--mint)" }}>{subtitle}</p>
  </div>
);

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --cream:  #F5F0E8; --paper:  #EDE8DC; --moss: #2D4A2D;
    --forest: #1A3320; --sage:   #6B8C6B; --mint: #A8C5A8;
    --lime:   #C8E06E; --rust:   #C4622D; --ink:  #1C1C1A; --mid: #5A5A52;
  }
  html { scroll-behavior: smooth; }
  body { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--ink); overflow-x: hidden; }
  .serif { font-family: 'Playfair Display', serif; }
  .noise::after {
    content: ''; position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 1;
  }
  @keyframes floatUp  { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes scaleIn  { from { opacity:0; transform:scale(0.94); } to { opacity:1; transform:scale(1); } }
  @keyframes marquee  { from { transform:translateX(0); } to { transform:translateX(-50%); } }
  @keyframes drift    { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-10px); } }
  .animate-floatUp { animation: floatUp  0.8s cubic-bezier(.16,1,.3,1) both; }
  .animate-fadeIn  { animation: fadeIn   0.6s ease both; }
  .animate-scaleIn { animation: scaleIn  0.7s cubic-bezier(.16,1,.3,1) both; }
  .delay-1 { animation-delay: 0.1s; } .delay-2 { animation-delay: 0.25s; }
  .delay-3 { animation-delay: 0.4s; } .delay-4 { animation-delay: 0.55s; }
  .card-hover { transition: transform 0.35s cubic-bezier(.16,1,.3,1), box-shadow 0.35s ease; }
  .card-hover:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(26,51,32,0.12); }
  .btn-primary {
    display: inline-flex; align-items: center; gap: 8px; padding: 14px 28px;
    background: var(--lime); color: var(--forest);
    font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 0.95rem;
    border: none; border-radius: 100px; cursor: pointer; text-decoration: none;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .btn-primary:hover { background: #d4ed7a; transform: scale(1.03); box-shadow: 0 8px 24px rgba(200,224,110,0.35); }
  .btn-ghost {
    display: inline-flex; align-items: center; gap: 8px; padding: 13px 28px;
    background: transparent; color: var(--cream);
    font-family: 'DM Sans', sans-serif; font-weight: 400; font-size: 0.95rem;
    border: 1.5px solid rgba(245,240,232,0.35); border-radius: 100px;
    cursor: pointer; text-decoration: none;
    transition: background 0.2s, border-color 0.2s;
  }
  .btn-ghost:hover { background: rgba(245,240,232,0.08); border-color: rgba(245,240,232,0.6); }
  .tag {
    display: inline-block; padding: 4px 14px; background: var(--mint); color: var(--forest);
    font-size: 0.7rem; font-weight: 500; letter-spacing: 0.09em; text-transform: uppercase; border-radius: 100px;
  }
    @media (max-width: 560px) {
  .logout-text { display: none; }
}
`;
