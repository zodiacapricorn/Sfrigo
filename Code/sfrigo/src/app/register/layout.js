export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --cream: #F5F0E8; --paper: #EDE8DC; --moss: #2D4A2D;
    --forest: #1A3320; --sage: #6B8C6B; --mint: #A8C5A8;
    --lime: #C8E06E; --ink: #1C1C1A; --mid: #5A5A52;
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--ink); }
  .noise::after {
    content: ''; position: absolute; inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
    pointer-events: none; z-index: 0;
  }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes drift  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
  .fade-up { animation: fadeUp 0.7s cubic-bezier(.16,1,.3,1) both; }
  .delay-1 { animation-delay: 0.08s; } .delay-2 { animation-delay: 0.18s; }
  .delay-3 { animation-delay: 0.28s; } .delay-4 { animation-delay: 0.38s; }
  .delay-5 { animation-delay: 0.48s; }
  .input-field {
    width: 100%; padding: 13px 16px; display: block;
    background: var(--cream); color: var(--ink);
    font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
    border: 1.5px solid rgba(45,74,45,0.18); border-radius: 12px;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s; margin-top: 6px;
  }
  .input-field::placeholder { color: rgba(90,90,82,0.45); }
  .input-field:focus { border-color: var(--moss); box-shadow: 0 0 0 3px rgba(45,74,45,0.1); }
  .btn-submit {
    width: 100%; padding: 14px; background: var(--forest); color: var(--lime);
    font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 0.95rem;
    border: none; border-radius: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  }
  .btn-submit:hover:not(:disabled) { background: var(--moss); transform: translateY(-1px); box-shadow: 0 8px 20px rgba(26,51,32,0.2); }
  .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-google {
    width: 100%; padding: 13px; background: #fff; color: var(--ink);
    font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
    border: 1.5px solid rgba(45,74,45,0.15); border-radius: 12px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    transition: background 0.2s, border-color 0.2s;
  }
  .btn-google:hover:not(:disabled) { background: var(--paper); border-color: rgba(45,74,45,0.28); }
  .btn-google:disabled { opacity: 0.6; cursor: not-allowed; }
  label { font-size: 0.78rem; font-weight: 500; color: var(--mid); letter-spacing: 0.05em; text-transform: uppercase; display: block; }
  @media (max-width: 767px) { #brand-panel { display: none !important; } }
`;

export default function DashboardLayout({ children }) {
  return <div>{children}</div>;
}