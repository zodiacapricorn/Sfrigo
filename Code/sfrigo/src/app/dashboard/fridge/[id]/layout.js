export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
  *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
  :root {
    --cream:#F5F0E8; --paper:#EDE8DC; --moss:#2D4A2D;
    --forest:#1A3320; --sage:#6B8C6B; --mint:#A8C5A8;
    --lime:#C8E06E; --ink:#1C1C1A; --mid:#5A5A52;
  }
  html { scroll-behavior:smooth; }
  body { font-family:'DM Sans',sans-serif; background:var(--cream); color:var(--ink); min-height:100vh; }

  @keyframes fadeUp     { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
  @keyframes scaleIn    { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
  @keyframes expandDown { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }

  .fade-up  { animation:fadeUp  0.6s cubic-bezier(.16,1,.3,1) both; }
  .scale-in { animation:scaleIn 0.55s cubic-bezier(.16,1,.3,1) both; }
  .delay-1{animation-delay:0.05s} .delay-2{animation-delay:0.10s} .delay-3{animation-delay:0.15s}
  .delay-4{animation-delay:0.20s} .delay-5{animation-delay:0.25s} .delay-6{animation-delay:0.30s}
  .delay-7{animation-delay:0.35s} .delay-8{animation-delay:0.40s}

  .ing-wrapper {
    border-radius:14px; border:1.5px solid rgba(45,74,45,0.09);
    background:#fff; overflow:hidden;
    transition:border-color 0.2s, box-shadow 0.2s;
  }
  .ing-wrapper:hover { border-color:rgba(45,74,45,0.18); }
  .ing-wrapper.open  { border-color:rgba(45,74,45,0.3); box-shadow:0 6px 24px rgba(26,51,32,0.1); }

  /* Desktop: name | qty | expiry | chevron — 4 separate columns, no overlap */
  .ing-row {
    display:grid;
    grid-template-columns: minmax(0,1fr) 72px 80px 30px;
    column-gap:12px; align-items:center;
    padding:13px 16px; cursor:pointer;
    background:transparent; border:none; width:100%;
    font-family:'DM Sans',sans-serif; text-align:left;
    transition:background 0.15s;
  }
  .ing-row:hover     { background:rgba(245,240,232,0.65); }
  .open .ing-row     { background:rgba(245,240,232,0.45); }

  .ing-detail {
    border-top:1px solid rgba(45,74,45,0.08); background:var(--forest);
    padding:16px 18px 18px; animation:expandDown 0.2s cubic-bezier(.16,1,.3,1) both;
  }
  .chevron { transition:transform 0.22s cubic-bezier(.16,1,.3,1); color:var(--sage); flex-shrink:0; }
  .open .chevron { transform:rotate(180deg); color:var(--mint); }

  .member-pill {
    display:flex; align-items:center; gap:10px; padding:9px 13px;
    border-radius:11px; border:1.5px solid rgba(45,74,45,0.09); background:#fff;
    transition:border-color 0.2s;
  }
  .member-pill:hover { border-color:rgba(45,74,45,0.2); }

  .mob-drawer { border-radius:14px; border:1.5px solid rgba(45,74,45,0.09); background:#fff; overflow:hidden; margin-bottom:18px; }
  .mob-drawer-btn {
    display:flex; align-items:center; justify-content:space-between; padding:13px 16px;
    cursor:pointer; background:transparent; border:none; width:100%;
    font-family:'DM Sans',sans-serif; transition:background 0.15s;
  }
  .mob-drawer-btn:hover { background:rgba(245,240,232,0.7); }

  .btn-primary {
    display:inline-flex; align-items:center; gap:7px; padding:10px 18px;
    background:var(--lime); color:var(--forest);
    font-family:'DM Sans',sans-serif; font-weight:500; font-size:0.88rem;
    border:none; border-radius:100px; cursor:pointer; white-space:nowrap;
    transition:background 0.2s, transform 0.15s;
  }
  .btn-primary:hover { background: #d4ed7a; transform: scale(1.04); box-shadow: 0 8px 20px rgba(200,224,110,0.35); }

  .btn-secondary {
    display:inline-flex; align-items:center; gap:7px; padding:5px 9px;
    background:var(--lime); color:var(--forest);
    font-family:'DM Sans',sans-serif; font-weight:500; font-size:0.75rem;
    border:none; border-radius:100px; cursor:pointer; white-space:nowrap;
    transition:background 0.2s, transform 0.15s;
  }
  .btn-secondary:hover { background: #d4ed7a; transform: scale(1.04); box-shadow: 0 8px 20px rgba(200,224,110,0.35); }


  .modal-overlay {
    position:fixed; inset:0; z-index:200; background:rgba(26,51,32,0.45);
    backdrop-filter:blur(6px); display:flex; align-items:center;
    justify-content:center; padding:20px; animation:fadeIn 0.2s ease both;
  }
  .modal-box {
    background:var(--cream); border-radius:22px; padding:clamp(22px,4vw,40px);
    width:100%; max-width:480px; box-shadow:0 32px 64px rgba(26,51,32,0.22);
    animation:scaleIn 0.26s cubic-bezier(.16,1,.3,1) both; max-height:92vh; overflow-y:auto;
  }
  .modal-box::-webkit-scrollbar{width:4px}
  .modal-box::-webkit-scrollbar-thumb{background:rgba(45,74,45,0.2);border-radius:100px}

  .input-field {
    width:100%; padding:11px 13px; display:block; background:var(--paper); color:var(--ink);
    font-family:'DM Sans',sans-serif; font-size:0.88rem;
    border:1.5px solid rgba(45,74,45,0.15); border-radius:10px;
    outline:none; transition:border-color 0.2s, box-shadow 0.2s; margin-top:5px;
  }
  .input-field::placeholder{color:rgba(90,90,82,0.4)}
  .input-field:focus{border-color:var(--moss);box-shadow:0 0 0 3px rgba(45,74,45,0.08)}
  select.input-field{appearance:none;cursor:pointer}
  label{font-size:0.72rem;font-weight:500;color:var(--mid);letter-spacing:0.06em;text-transform:uppercase;display:block}

  /* col headers (mirrors .ing-row grid) */
  .col-headers-row {
    display:grid; grid-template-columns:minmax(0,1fr) 72px 80px 30px;
    column-gap:12px; padding:0 16px; margin-bottom:7px;
  }

  .page-grid {
    display:grid; grid-template-columns:210px 1fr; gap:22px;
    max-width:1140px; margin:0 auto;
    padding:clamp(22px,4vw,48px) clamp(14px,4vw,44px); align-items:start;
  }

  /* ── MOBILE breakpoint ── */
  @media (max-width:680px) {
    .page-grid       { grid-template-columns:1fr; gap:0; padding:14px; }
    .desktop-sidebar { display:none !important; }
    .show-mobile     { display:block !important; }

    /* Mobile row: name+cat | qty+expiry stacked | chevron */
    .ing-row         { grid-template-columns:minmax(0,1fr) auto 30px; column-gap:10px; }
    .col-qty-desk    { display:none !important; }
    .col-exp-desk    { display:none !important; }
    .col-mob-stack   { display:flex !important; }
    .col-headers-row { display:none; }
  }
  @media (min-width:681px) {
    .show-mobile   { display:none !important; }
    .col-mob-stack { display:none !important; }
  }

  ::-webkit-scrollbar{width:6px}
  ::-webkit-scrollbar-thumb{background:rgba(45,74,45,0.2);border-radius:100px}
`;

export default function DashboardLayout({ children }) {
  return <div>{children}</div>;
}