export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream: #F5F0E8; --paper: #EDE8DC; --moss: #2D4A2D;
    --forest: #1A3320; --sage: #6B8C6B; --mint: #A8C5A8;
    --lime: #C8E06E; --ink: #1C1C1A; --mid: #5A5A52;

    --card-owner-bg:     #1A3320;
    --card-owner-text:   #F5F0E8;
    --card-owner-sub:    #A8C5A8;
    --card-owner-accent: #C8E06E;
    --card-owner-border: rgba(200,224,110,0.25);

    --card-shared-bg:     #EDE8DC;
    --card-shared-text:   #1A3320;
    --card-shared-sub:    #6B8C6B;
    --card-shared-accent: #2D4A2D;
    --card-shared-border: rgba(45,74,45,0.12);
  }

  html { scroll-behavior: smooth; }
  body { font-family: 'DM Sans', sans-serif; background: var(--cream); color: var(--ink); min-height: 100vh; }

  @keyframes fadeUp  { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }

  .fade-up  { animation: fadeUp  0.65s cubic-bezier(.16,1,.3,1) both; }
  .fade-in  { animation: fadeIn  0.5s ease both; }
  .scale-in { animation: scaleIn 0.6s cubic-bezier(.16,1,.3,1) both; }

  .delay-1{animation-delay:0.06s} .delay-2{animation-delay:0.12s} .delay-3{animation-delay:0.18s}
  .delay-4{animation-delay:0.24s} .delay-5{animation-delay:0.30s} .delay-6{animation-delay:0.36s}

  .fridge-card {
    border-radius: 20px; padding: 28px 26px; cursor: pointer;
    position: relative; overflow: hidden; border: 1.5px solid transparent;
    transition: transform 0.32s cubic-bezier(.16,1,.3,1), box-shadow 0.32s ease, border-color 0.2s;
    text-align: left; width: 100%; font-family: 'DM Sans', sans-serif;
  }
  .fridge-card.owner  { background: var(--card-owner-bg);  border-color: var(--card-owner-border);  color: var(--card-owner-text); }
  .fridge-card.shared { background: var(--card-shared-bg); border-color: var(--card-shared-border); color: var(--card-shared-text); }
  .fridge-card:hover  { transform: translateY(-6px) rotate(-0.3deg); }
  .fridge-card.owner:hover  { box-shadow: 0 24px 48px rgba(26,51,32,0.28); border-color: rgba(200,224,110,0.45); }
  .fridge-card.shared:hover { box-shadow: 0 24px 48px rgba(26,51,32,0.10); border-color: rgba(45,74,45,0.25); }

  .btn-create {
    display: inline-flex; align-items: center; gap: 8px; padding: 11px 22px;
    background: var(--lime); color: var(--forest);
    font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 0.9rem;
    border: none; border-radius: 100px; cursor: pointer; white-space: nowrap;
    transition: background 0.2s, transform 0.18s, box-shadow 0.2s;
  }
  .btn-create:hover { background: #d4ed7a; transform: scale(1.04); box-shadow: 0 8px 20px rgba(200,224,110,0.35); }

  .modal-overlay {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(26,51,32,0.45); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center; padding: 24px;
    animation: fadeIn 0.2s ease both;
  }
  .modal-box {
    background: var(--cream); border-radius: 24px;
    padding: clamp(32px, 5vw, 48px); width: 100%; max-width: 440px;
    box-shadow: 0 32px 64px rgba(26,51,32,0.22);
    animation: scaleIn 0.3s cubic-bezier(.16,1,.3,1) both;
  }

  .input-field {
    width: 100%; padding: 13px 16px; display: block;
    background: var(--paper); color: var(--ink);
    font-family: 'DM Sans', sans-serif; font-size: 0.9rem;
    border: 1.5px solid rgba(45,74,45,0.18); border-radius: 12px;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s; margin-top: 6px;
  }
  .input-field::placeholder { color: rgba(90,90,82,0.4); }
  .input-field:focus { border-color: var(--moss); box-shadow: 0 0 0 3px rgba(45,74,45,0.1); }

  label { font-size: 0.76rem; font-weight: 500; color: var(--mid); letter-spacing: 0.06em; text-transform: uppercase; display: block; }

  .empty-state {
    grid-column: 1 / -1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 72px 24px; text-align: center;
    border: 1.5px dashed rgba(45,74,45,0.2); border-radius: 20px;
    animation: fadeIn 0.6s ease both;
  }

  @media (max-width: 560px) {
  .logout-text { display: none; }
  .btn-create span { display: none; }
  .dashboard-email { display: none; }
}
  
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: rgba(45,74,45,0.2); border-radius: 100px; }
`;

export default function DashboardLayout({ children }) {
  return <div>{children}</div>;
}