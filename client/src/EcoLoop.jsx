import { useState, useEffect, useRef } from "react";

/* ── DESIGN TOKENS ────────────────────────────────────── */
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,600;0,9..144,800;1,9..144,300&family=Cabinet+Grotesk:wght@400;500;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ink:     #0f1a0b;
    --paper:   #f2ede4;
    --sage:    #3a5a2c;
    --fern:    #5c8c40;
    --lime:    #b8d96e;
    --amber:   #e8a230;
    --clay:    #c97a4a;
    --mist:    #d6e8cc;
    --ghost:   rgba(15,26,11,0.06);
    --border:  rgba(15,26,11,0.12);
    --shadow:  0 2px 24px rgba(15,26,11,0.10);
    --shadow-lg: 0 12px 60px rgba(15,26,11,0.16);
    --r: 16px;
    --r-sm: 8px;
    --r-xl: 32px;
  }

  body { background: var(--paper); color: var(--ink); font-family: 'Cabinet Grotesk', sans-serif; }

  /* ── NOISE TEXTURE OVERLAY ── */
  #el-root::before {
    content: '';
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    opacity: .4;
  }

  #el-root { position: relative; min-height: 100vh; overflow-x: hidden; }

  /* ── NAV ── */
  .el-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; padding: 0 40px; height: 64px;
    background: rgba(242,237,228,0.82); backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border);
  }
  .el-logo {
    font-family: 'Fraunces', serif; font-size: 22px; font-weight: 800;
    color: var(--sage); cursor: pointer; margin-right: auto;
    display: flex; align-items: center; gap: 8px; letter-spacing: -0.5px;
  }
  .el-logo-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--lime); margin-top: 1px; }
  .el-nav-links { display: flex; gap: 4px; }
  .el-nav-links button {
    background: none; border: none; cursor: pointer; font-family: 'Cabinet Grotesk', sans-serif;
    font-size: 14px; font-weight: 500; color: rgba(15,26,11,0.5);
    padding: 7px 14px; border-radius: var(--r-sm); transition: all .2s;
  }
  .el-nav-links button:hover { color: var(--ink); background: var(--ghost); }
  .el-nav-links button.active { color: var(--sage); background: var(--mist); font-weight: 700; }
  .el-karma-pill {
    margin-left: 20px; display: flex; align-items: center; gap: 7px;
    background: var(--ink); color: var(--lime);
    border-radius: 999px; padding: 6px 16px 6px 12px;
    font-size: 13px; font-weight: 700; cursor: pointer; transition: transform .2s;
  }
  .el-karma-pill:hover { transform: scale(1.04); }
  .el-karma-pill .kp { width: 7px; height: 7px; border-radius: 50%; background: var(--lime); animation: blink 2s infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }

  /* ── PAGE WRAPPER ── */
  .el-page { padding-top: 64px; min-height: 100vh; }

  /* ── HOME HERO ── */
  .el-hero {
    position: relative; overflow: hidden;
    padding: 80px 40px 60px;
    display: grid; grid-template-columns: 1fr 480px; gap: 60px;
    align-items: center; max-width: 1160px; margin: 0 auto;
  }
  .el-hero-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: var(--fern); margin-bottom: 24px;
  }
  .el-hero-eyebrow::before { content:''; width:24px; height:2px; background:var(--lime); border-radius:2px; }
  .el-hero h1 {
    font-family: 'Fraunces', serif; font-size: clamp(48px, 6vw, 80px);
    font-weight: 800; line-height: 1.0; letter-spacing: -2px; color: var(--ink);
    margin-bottom: 24px;
  }
  .el-hero h1 .accent { color: var(--fern); font-style: italic; }
  .el-hero-sub { font-size: 17px; color: rgba(15,26,11,0.55); line-height: 1.65; max-width: 420px; margin-bottom: 40px; }
  .el-hero-btns { display: flex; gap: 12px; }

  /* HERO RIGHT — CIRCLE WIDGET */
  .el-circle-card {
    background: var(--ink); border-radius: var(--r-xl);
    padding: 36px; position: relative; overflow: hidden;
  }
  .el-circle-card::before {
    content: ''; position: absolute; top: -60px; right: -60px;
    width: 240px; height: 240px; border-radius: 50%;
    background: radial-gradient(circle, rgba(184,217,110,0.15) 0%, transparent 70%);
  }
  .el-circle-label {
    font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    color: var(--lime); margin-bottom: 28px;
  }
  .el-circle-ring {
    position: relative; width: 240px; height: 240px; margin: 0 auto 28px;
  }
  .el-circle-ring svg { position: absolute; inset: 0; animation: spin 18s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .el-cn {
    position: absolute; transform: translate(-50%,-50%);
    width: 72px; height: 72px; border-radius: 50%;
    background: rgba(255,255,255,0.06); border: 1.5px solid rgba(255,255,255,0.14);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
    backdrop-filter: blur(8px);
  }
  .el-cn em { font-size: 22px; font-style: normal; }
  .el-cn span { font-size: 9px; color: rgba(255,255,255,0.5); font-weight: 600; }
  .el-cn b { font-size: 10px; color: #fff; font-weight: 700; }
  .el-circle-hub {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 52px; height: 52px; border-radius: 50%;
    background: var(--lime); color: var(--ink); font-size: 22px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 8px rgba(184,217,110,0.12), 0 0 0 18px rgba(184,217,110,0.06);
    animation: hub-pulse 3s ease-in-out infinite;
  }
  @keyframes hub-pulse {
    0%,100%{box-shadow:0 0 0 8px rgba(184,217,110,0.12), 0 0 0 18px rgba(184,217,110,0.06)}
    50%{box-shadow:0 0 0 14px rgba(184,217,110,0.10), 0 0 0 28px rgba(184,217,110,0.04)}
  }
  .el-circle-flow {
    display: flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.05); border-radius: var(--r-sm);
    padding: 12px 14px; font-size: 12px; color: rgba(255,255,255,0.6); font-weight: 500;
  }
  .el-circle-flow strong { color: #fff; }
  .el-circle-flow .arr { color: var(--lime); font-size: 14px; }

  /* ── STATS ── */
  .el-stats {
    display: grid; grid-template-columns: repeat(4,1fr); gap: 1px;
    background: var(--border); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
  }
  .el-stat { background: var(--paper); padding: 32px 40px; text-align: center; }
  .el-stat-val { font-family: 'Fraunces', serif; font-size: 42px; font-weight: 800; color: var(--ink); line-height:1; letter-spacing:-1px; }
  .el-stat-val sup { font-size: 22px; color: var(--fern); }
  .el-stat-lbl { font-size: 13px; color: rgba(15,26,11,0.45); margin-top: 4px; font-weight: 500; }

  /* ── SECTION ── */
  .el-section { max-width: 1160px; margin: 0 auto; padding: 72px 40px; }
  .el-section-tag {
    font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;
    color: var(--fern); margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
  }
  .el-section-tag::after { content:''; flex: 1; height: 1px; background: var(--border); }
  .el-section-h {
    font-family: 'Fraunces', serif; font-size: clamp(28px, 4vw, 44px);
    font-weight: 800; letter-spacing: -1px; color: var(--ink); margin-bottom: 8px;
  }
  .el-section-sub { color: rgba(15,26,11,0.45); font-size: 15px; margin-bottom: 48px; }

  /* STEPS GRID */
  .el-steps { display: grid; grid-template-columns: repeat(4,1fr); gap: 2px; background: var(--border); border-radius: var(--r-xl); overflow: hidden; border: 1px solid var(--border); }
  .el-step { background: var(--paper); padding: 36px 28px; position: relative; overflow: hidden; transition: background .3s; }
  .el-step:hover { background: var(--mist); }
  .el-step-n { font-family: 'Fraunces', serif; font-size: 56px; font-weight: 800; color: var(--lime); line-height: 1; margin-bottom: 20px; opacity: .7; }
  .el-step h3 { font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 8px; }
  .el-step p { font-size: 13px; color: rgba(15,26,11,0.5); line-height: 1.65; }

  /* TYPE CARDS */
  .el-types { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
  .el-type {
    border-radius: var(--r-xl); padding: 36px 32px; cursor: pointer;
    transition: transform .25s, box-shadow .25s; position: relative; overflow: hidden;
  }
  .el-type:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
  .el-type.t-direct   { background: #e8f0fe; }
  .el-type.t-circular { background: var(--ink); color: #fff; }
  .el-type.t-social   { background: #fff5e0; }
  .el-type-icon { font-size: 44px; margin-bottom: 20px; display: block; }
  .el-type-badge {
    display: inline-block; font-size: 10px; font-weight: 700; letter-spacing: 1.5px;
    text-transform: uppercase; padding: 4px 10px; border-radius: 999px; margin-bottom: 16px;
  }
  .t-direct .el-type-badge   { background: rgba(66,133,244,0.12); color: #2a60c4; }
  .t-circular .el-type-badge { background: rgba(184,217,110,0.15); color: var(--lime); }
  .t-social .el-type-badge   { background: rgba(232,162,48,0.15); color: #9a6c00; }
  .el-type h3 { font-family: 'Fraunces', serif; font-size: 22px; font-weight: 800; margin-bottom: 10px; letter-spacing: -0.3px; }
  .t-circular h3 { color: #fff; }
  .el-type p { font-size: 14px; line-height: 1.6; color: rgba(15,26,11,0.55); }
  .t-circular p { color: rgba(255,255,255,0.5); }
  .el-type-deco {
    position: absolute; bottom: -20px; right: -20px;
    width: 100px; height: 100px; border-radius: 50%; opacity: .06;
  }
  .t-direct .el-type-deco   { background: #4285f4; }
  .t-circular .el-type-deco { background: var(--lime); }
  .t-social .el-type-deco   { background: var(--amber); }

  /* ── BUTTONS ── */
  .btn-p {
    background: var(--sage); color: #fff; border: none; cursor: pointer;
    font-family: 'Cabinet Grotesk', sans-serif; font-size: 15px; font-weight: 700;
    padding: 14px 28px; border-radius: var(--r); transition: all .2s;
    box-shadow: 0 4px 20px rgba(58,90,44,0.35);
  }
  .btn-p:hover { background: var(--ink); transform: translateY(-1px); box-shadow: 0 8px 28px rgba(15,26,11,0.25); }
  .btn-o {
    background: none; color: var(--ink); border: 1.5px solid var(--border); cursor: pointer;
    font-family: 'Cabinet Grotesk', sans-serif; font-size: 15px; font-weight: 600;
    padding: 13px 24px; border-radius: var(--r); transition: all .2s;
  }
  .btn-o:hover { border-color: var(--sage); color: var(--sage); }

  /* ── DASHBOARD ── */
  .el-dash { max-width: 1160px; margin: 0 auto; padding: 40px 40px 60px; }
  .el-dash-top {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-bottom: 36px; padding-bottom: 28px; border-bottom: 1px solid var(--border);
  }
  .el-dash-top h2 { font-family: 'Fraunces', serif; font-size: 36px; font-weight: 800; letter-spacing: -1px; color: var(--ink); }
  .el-dash-top p  { font-size: 14px; color: rgba(15,26,11,0.45); margin-top: 4px; }
  .el-kpi-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 28px; }
  .el-kpi {
    background: var(--surface,var(--paper)); border: 1.5px solid var(--border);
    border-radius: var(--r-xl); padding: 24px 28px;
    display: flex; align-items: center; gap: 18px; transition: border-color .2s;
  }
  .el-kpi:hover { border-color: var(--lime); }
  .el-kpi-icon { font-size: 32px; }
  .el-kpi-val  { font-family: 'Fraunces', serif; font-size: 32px; font-weight: 800; color: var(--ink); line-height:1; }
  .el-kpi-lbl  { font-size: 12px; color: rgba(15,26,11,0.4); font-weight: 600; margin-top: 2px; letter-spacing:.5px; text-transform:uppercase; }
  .el-dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .el-card { background: #fff; border: 1.5px solid var(--border); border-radius: var(--r-xl); padding: 28px; }
  .el-card-hd { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(15,26,11,0.35); margin-bottom: 20px; }
  /* listing row */
  .el-lrow { display: flex; align-items: center; gap: 14px; padding: 12px 14px; border-radius: var(--r); background: var(--paper); margin-bottom: 8px; border: 1px solid transparent; transition: all .2s; cursor: pointer; }
  .el-lrow:hover { border-color: var(--lime); background: var(--mist); }
  .el-lrow-em { font-size: 26px; width: 44px; text-align: center; }
  .el-lrow-info { flex: 1; }
  .el-lrow-info h4 { font-size: 14px; font-weight: 700; color: var(--ink); }
  .el-lrow-info p  { font-size: 12px; color: rgba(15,26,11,0.4); margin-top: 2px; }
  .el-badge { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
  .b-active   { background: rgba(92,140,64,0.12); color: var(--sage); }
  .b-matched  { background: rgba(232,162,48,0.15); color: #9a6c00; }
  .b-pending  { background: rgba(201,122,74,0.12); color: #8a3a10; }
  /* activity */
  .el-act { display: flex; flex-direction: column; gap: 0; }
  .el-act-row { display: flex; align-items: center; gap: 14px; padding: 13px 0; border-bottom: 1px solid var(--border); }
  .el-act-row:last-child { border-bottom: none; }
  .el-act-ic { width: 36px; height: 36px; border-radius: 50%; background: var(--mist); display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .el-act-inf h4 { font-size: 13px; font-weight: 600; color: var(--ink); }
  .el-act-inf p  { font-size: 12px; color: rgba(15,26,11,0.4); margin-top: 1px; }
  .el-act-k { margin-left: auto; font-size: 13px; font-weight: 700; color: var(--fern); }

  /* ── MATCHES ── */
  .el-matches { max-width: 800px; margin: 0 auto; padding: 40px 40px 60px; }
  .el-match-hd { margin-bottom: 32px; }
  .el-match-hd h2 { font-family: 'Fraunces', serif; font-size: 34px; font-weight: 800; letter-spacing: -1px; color: var(--ink); }
  .el-match-hd p  { font-size: 14px; color: rgba(15,26,11,0.4); margin-top: 4px; }
  .el-match-card { background: #fff; border: 1.5px solid var(--border); border-radius: var(--r-xl); padding: 28px; margin-bottom: 18px; transition: all .3s; }
  .el-match-card:hover { box-shadow: var(--shadow); border-color: var(--lime); }
  .el-match-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .el-match-typebadge { font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 5px 12px; border-radius: 999px; }
  .mt-circle { background: var(--ink); color: var(--lime); }
  .mt-direct { background: #e8f0fe; color: #2a60c4; }
  .el-match-karma { font-size: 13px; color: rgba(15,26,11,0.4); }
  .el-match-karma strong { color: var(--fern); }
  .el-participants { display: flex; align-items: center; gap: 0; overflow-x: auto; padding-bottom: 4px; }
  .el-part { display: flex; flex-direction: column; align-items: center; gap: 5px; min-width: 80px; }
  .el-part-av { width: 52px; height: 52px; border-radius: 50%; background: var(--paper); border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 24px; }
  .el-part-name { font-size: 11px; font-weight: 700; color: var(--ink); }
  .el-part-item { font-size: 10px; color: rgba(15,26,11,0.4); }
  .el-arrow { font-size: 20px; color: var(--lime); padding: 0 4px; margin-bottom: 22px; }
  .el-match-footer { display: flex; gap: 10px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
  .btn-accept { flex: 1; padding: 12px; background: var(--sage); color: #fff; border: none; border-radius: var(--r); font-family: 'Cabinet Grotesk', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all .2s; }
  .btn-accept:hover { background: var(--ink); }
  .btn-dec { padding: 12px 20px; background: none; color: rgba(15,26,11,0.4); border: 1.5px solid var(--border); border-radius: var(--r); font-family: 'Cabinet Grotesk', sans-serif; font-size: 14px; cursor: pointer; transition: all .2s; }
  .btn-dec:hover { border-color: #c0392b; color: #c0392b; }
  .el-empty { text-align: center; padding: 80px 20px; }
  .el-empty-ico { font-size: 60px; margin-bottom: 16px; }
  .el-empty h3 { font-family: 'Fraunces', serif; font-size: 26px; color: var(--ink); margin-bottom: 8px; }
  .el-empty p  { color: rgba(15,26,11,0.4); font-size: 15px; margin-bottom: 24px; }

  /* ── LIST FORM ── */
  .el-form-wrap { max-width: 640px; margin: 0 auto; padding: 48px 40px 60px; }
  .el-form-wrap h2 { font-family: 'Fraunces', serif; font-size: 38px; font-weight: 800; letter-spacing: -1px; color: var(--ink); margin-bottom: 6px; }
  .el-form-wrap > p { color: rgba(15,26,11,0.45); font-size: 15px; margin-bottom: 40px; }
  .el-fg { margin-bottom: 24px; }
  .el-fg label { display: block; font-size: 13px; font-weight: 700; color: var(--ink); margin-bottom: 8px; letter-spacing:.3px; }
  .el-fg input, .el-fg select, .el-fg textarea {
    width: 100%; padding: 13px 16px;
    background: #fff; border: 1.5px solid var(--border); border-radius: var(--r);
    font-family: 'Cabinet Grotesk', sans-serif; font-size: 14px; color: var(--ink);
    transition: border-color .2s; outline: none; appearance: none;
  }
  .el-fg input:focus, .el-fg select:focus, .el-fg textarea:focus { border-color: var(--fern); box-shadow: 0 0 0 3px rgba(92,140,64,0.1); }
  .el-fg textarea { min-height: 100px; resize: vertical; }
  .el-emoji-g { display: grid; grid-template-columns: repeat(8,1fr); gap: 8px; }
  .el-ej { aspect-ratio:1; background:#fff; border:1.5px solid var(--border); border-radius:var(--r-sm); font-size:22px; cursor:pointer; transition:all .15s; display:flex; align-items:center; justify-content:center; }
  .el-ej:hover  { border-color: var(--fern); transform: scale(1.08); }
  .el-ej.on    { border-color: var(--fern); background: var(--mist); box-shadow: 0 0 0 3px rgba(92,140,64,0.15); }
  .el-tip { background: var(--mist); border-radius: var(--r); padding: 14px 18px; font-size: 13px; color: rgba(15,26,11,0.6); line-height:1.6; margin-bottom: 24px; }
  .el-tip strong { color: var(--sage); }
  .el-submit { width:100%; padding:16px; background:var(--sage); color:#fff; border:none; border-radius:var(--r); font-family:'Cabinet Grotesk',sans-serif; font-size:16px; font-weight:700; cursor:pointer; transition:all .2s; box-shadow:0 4px 20px rgba(58,90,44,0.35); }
  .el-submit:hover { background: var(--ink); transform: translateY(-1px); }
  .el-success { text-align:center; padding: 80px 20px; }
  .el-success-icon { font-size: 72px; margin-bottom: 20px; animation: pop .4s ease; }
  @keyframes pop { 0%{transform:scale(.5)} 70%{transform:scale(1.1)} 100%{transform:scale(1)} }
  .el-success h3 { font-family:'Fraunces',serif; font-size:32px; font-weight:800; color:var(--ink); margin-bottom:8px; }
  .el-success p  { color:rgba(15,26,11,0.45); font-size:15px; }

  /* ── KARMA PAGE ── */
  .el-karma-wrap { max-width: 900px; margin: 0 auto; padding: 40px 40px 60px; }
  .el-karma-wrap h2 { font-family: 'Fraunces', serif; font-size: 36px; font-weight: 800; letter-spacing: -1px; color: var(--ink); margin-bottom: 6px; }
  .el-karma-wrap > p { color: rgba(15,26,11,0.45); font-size: 15px; margin-bottom: 36px; }
  .el-karma-hero {
    background: var(--ink); border-radius: var(--r-xl); padding: 40px;
    display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; margin-bottom: 24px;
  }
  .el-kh-left { text-align: center; }
  .el-kh-num { font-family: 'Fraunces', serif; font-size: 88px; font-weight: 800; color: var(--lime); line-height: 1; letter-spacing:-4px; }
  .el-kh-tier { font-size: 14px; color: rgba(255,255,255,0.5); margin-top: 6px; }
  .el-kh-tier strong { color: #fff; }
  .el-kh-right h3 { font-family:'Fraunces',serif; font-size:22px; font-weight:700; color:#fff; margin-bottom:14px; }
  .el-progress-bar { height: 8px; background: rgba(255,255,255,0.1); border-radius: 999px; overflow: hidden; margin-bottom: 8px; }
  .el-progress-fill { height:100%; background: linear-gradient(90deg, var(--lime), #e8d870); border-radius:999px; transition: width 1.2s ease; }
  .el-progress-labels { display: flex; justify-content: space-between; font-size: 11px; color: rgba(255,255,255,0.35); }
  .el-earn-grid { display: grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:20px; }
  .el-earn-item { display:flex; align-items:center; gap:10px; background:rgba(255,255,255,0.05); border-radius:var(--r-sm); padding:10px 14px; }
  .el-earn-item .ei-icon { font-size:20px; }
  .el-earn-item .ei-act  { font-size:12px; color:rgba(255,255,255,0.6); flex:1; }
  .el-earn-item .ei-pts  { font-size:13px; font-weight:700; color:var(--lime); }
  .el-lb { background:#fff; border: 1.5px solid var(--border); border-radius: var(--r-xl); overflow:hidden; margin-top:24px; }
  .el-lb-hd { padding:20px 24px; font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:rgba(15,26,11,0.35); border-bottom:1px solid var(--border); }
  .el-lb-row { display:flex; align-items:center; gap:16px; padding:16px 24px; border-bottom:1px solid var(--border); transition:background .2s; }
  .el-lb-row:last-child { border-bottom:none; }
  .el-lb-row:hover { background: var(--paper); }
  .el-lb-row.me { background: var(--mist); }
  .el-lb-rank { width:28px; font-family:'Fraunces',serif; font-size:18px; font-weight:800; color:rgba(15,26,11,0.2); text-align:center; }
  .el-lb-row:nth-child(1) .el-lb-rank { color:#d4a017; }
  .el-lb-row:nth-child(2) .el-lb-rank { color:#9e9e9e; }
  .el-lb-row:nth-child(3) .el-lb-rank { color:#a0522d; }
  .el-lb-av { width:40px; height:40px; border-radius:50%; background:var(--paper); border:2px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:18px; }
  .el-lb-info { flex:1; }
  .el-lb-info h4 { font-size:14px; font-weight:700; color:var(--ink); }
  .el-lb-info p  { font-size:12px; color:rgba(15,26,11,0.4); }
  .el-lb-k { font-family:'Fraunces',serif; font-size:22px; font-weight:800; color:var(--amber); }

  /* ── TOAST ── */
  .el-toast {
    position:fixed; bottom:32px; left:50%; transform:translateX(-50%);
    background:var(--ink); color:#fff; padding:14px 24px; border-radius:var(--r);
    font-size:14px; font-weight:600; z-index:200; white-space:nowrap;
    box-shadow:var(--shadow-lg); animation:toast-pop .3s ease;
  }
  @keyframes toast-pop { from{opacity:0;transform:translateX(-50%) translateY(16px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

  @media(max-width:768px){
    .el-hero { grid-template-columns:1fr; gap:40px; }
    .el-circle-card { display:none; }
    .el-stats { grid-template-columns:1fr 1fr; }
    .el-steps { grid-template-columns:1fr 1fr; }
    .el-types { grid-template-columns:1fr; }
    .el-dash-grid { grid-template-columns:1fr; }
    .el-kpi-row { grid-template-columns:1fr; }
    .el-karma-hero { grid-template-columns:1fr; }
    .el-section, .el-dash, .el-matches, .el-form-wrap, .el-karma-wrap { padding-left:20px; padding-right:20px; }
    .el-nav { padding: 0 16px; }
  }
`;

/* ── DATA ──────────────────────────────────────── */
const LISTINGS = [
  { emoji:'🧥', name:'Winter Jacket', want:'Books or Plants', status:'matched' },
  { emoji:'🎸', name:'Acoustic Guitar', want:'Art supplies', status:'active' },
  { emoji:'📷', name:'Film Camera', want:'Board games', status:'active' },
  { emoji:'🪴', name:'Monstera Plant', want:'Kitchen items', status:'pending' },
];

const ACTIVITY = [
  { icon:'🔄', title:'Circle completed with Arjun & Kabir', time:'2 hours ago', karma:'+40' },
  { icon:'📬', title:'New match found for your Jacket', time:'5 hours ago', karma:'' },
  { icon:'✅', title:'Confirmed swap with Meera', time:'Yesterday', karma:'+20' },
  { icon:'💛', title:'Donated old phone to Goonj NGO', time:'3 days ago', karma:'+60' },
];

const MATCHES_DATA = [
  { id:1, type:'circle', label:'3-Way Circle', karma:40,
    parts:[{n:'Riya (You)',em:'🧥',item:'Jacket'},{n:'Arjun',em:'📚',item:'Books'},{n:'Kabir',em:'💡',item:'Lamp'}] },
  { id:2, type:'direct', label:'Direct 1:1', karma:20,
    parts:[{n:'Riya (You)',em:'🎸',item:'Guitar'},{n:'Meera',em:'🎨',item:'Art Set'}] },
  { id:3, type:'circle', label:'3-Way Circle', karma:40,
    parts:[{n:'Riya (You)',em:'📷',item:'Camera'},{n:'Dev',em:'🎲',item:'Board Game'},{n:'Priya',em:'🖥️',item:'Monitor'}] },
];

const LEADERBOARD = [
  { n:'Sunita M.',   city:'Mumbai',    karma:1240, em:'👩', trades:31 },
  { n:'Dev K.',      city:'Delhi',     karma:980,  em:'👨', trades:24 },
  { n:'Priya R.',    city:'Bengaluru', karma:760,  em:'👩', trades:19 },
  { n:'Riya (You)',  city:'Mumbai',    karma:340,  em:'🧑', trades:7,  me:true },
  { n:'Arjun S.',    city:'Mumbai',    karma:290,  em:'👦', trades:6 },
  { n:'Meera P.',    city:'Pune',      karma:210,  em:'👩', trades:5 },
];

const TIERS = [
  {name:'Seedling',min:0,  max:99,  icon:'🌱'},
  {name:'Sprout',  min:100,max:299, icon:'🌿'},
  {name:'Treeling',min:300,max:599, icon:'🌳'},
  {name:'Grove',   min:600,max:1199,icon:'🏡'},
  {name:'Forest',  min:1200,max:9999,icon:'🌲'},
];
const getTier = k => TIERS.find(t=>k>=t.min&&k<=t.max)||TIERS[0];
const EMOJIS  = ['🧥','👟','📚','🎸','📷','🪴','🎲','🛋','🍳','💡','🧸','🖥️','🎨','⌚','🎒','🏺'];
const CATS    = ['Clothing','Electronics','Books','Furniture','Plants','Sports','Music','Art','Kitchen','Toys'];
const EARN    = [
  {icon:'🤝',act:'Complete a Direct Swap',pts:'+20'},
  {icon:'🔄',act:'Complete a 3-Way Circle',pts:'+40'},
  {icon:'💛',act:'Donate to an NGO',pts:'+60'},
  {icon:'⭐',act:'Receive 5-star review',pts:'+10'},
];

/* ── COMPONENTS ────────────────────────────────── */
function Nav({page,setPage,karma}) {
  const links = [{id:'home',l:'Home'},{id:'dashboard',l:'My Listings'},{id:'matches',l:'Matches'},{id:'list',l:'+ List Item'},{id:'karma',l:'Karma'}];
  return (
    <nav className="el-nav">
      <div className="el-logo" onClick={()=>setPage('home')}>
        <span className="el-logo-dot"/>EcoLoop
      </div>
      <div className="el-nav-links">
        {links.map(({id,l})=>(
          <button key={id} className={page===id?'active':''} onClick={()=>setPage(id)}>{l}</button>
        ))}
      </div>
      <div className="el-karma-pill" onClick={()=>setPage('karma')}>
        <span className="kp"/>
        {karma} Karma
      </div>
    </nav>
  );
}

function Home({setPage}) {
  return (
    <>
      {/* HERO */}
      <div className="el-page">
        <div className="el-hero">
          <div>
            <div className="el-hero-eyebrow">Live in Mumbai · Delhi · Bengaluru</div>
            <h1>Trade goods.<br/>Skip the <span className="accent">money.</span></h1>
            <p className="el-hero-sub">
              EcoLoop's circular matching engine connects local swappers in multi-person trade circles — turning idle stuff into community gold.
            </p>
            <div className="el-hero-btns">
              <button className="btn-p" onClick={()=>setPage('list')}>List Your First Item</button>
              <button className="btn-o" onClick={()=>setPage('matches')}>See Live Matches</button>
            </div>
          </div>
          {/* CIRCLE WIDGET */}
          <div className="el-circle-card">
            <div className="el-circle-label">Perfect Circle · Active Now</div>
            <div className="el-circle-ring">
              <svg viewBox="0 0 240 240" fill="none">
                <circle cx="120" cy="120" r="100" stroke="rgba(184,217,110,0.15)" strokeWidth="1.5" strokeDasharray="6 5"/>
                <path d="M120 28 Q208 76 208 212" stroke="rgba(184,217,110,0.6)" strokeWidth="1.5" fill="none" markerEnd="url(#a)"/>
                <path d="M208 212 Q80 252 40 148" stroke="rgba(184,217,110,0.6)" strokeWidth="1.5" fill="none" markerEnd="url(#a)"/>
                <path d="M40 148 Q52 28 120 28"  stroke="rgba(184,217,110,0.6)" strokeWidth="1.5" fill="none" markerEnd="url(#a)"/>
                <defs><marker id="a" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6Z" fill="rgba(184,217,110,0.8)"/></marker></defs>
              </svg>
              <div className="el-cn" style={{top:'8%',left:'50%'}}><em>🧥</em><b>Riya</b><span>Jacket</span></div>
              <div className="el-cn" style={{top:'80%',left:'15%'}}><em>📚</em><b>Arjun</b><span>Books</span></div>
              <div className="el-cn" style={{top:'80%',left:'85%'}}><em>💡</em><b>Kabir</b><span>Lamp</span></div>
              <div className="el-circle-hub">🔄</div>
            </div>
            <div className="el-circle-flow">
              <strong>Riya</strong><span className="arr">→</span>
              <strong>Arjun</strong><span className="arr">→</span>
              <strong>Kabir</strong><span className="arr">→</span>
              <strong>Riya</strong>
              <span style={{marginLeft:'auto'}}>+40 Karma</span>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div className="el-stats">
          {[['12,480','+','Items Swapped'],['3,920','+','Active Traders'],['890','','Circles Formed'],['18.4','t','Waste Avoided']].map(([v,u,l])=>(
            <div className="el-stat" key={l}>
              <div className="el-stat-val">{v}<sup>{u}</sup></div>
              <div className="el-stat-lbl">{l}</div>
            </div>
          ))}
        </div>

        {/* HOW IT WORKS */}
        <div className="el-section">
          <div className="el-section-tag">How It Works</div>
          <div className="el-section-h">Four steps to your first swap</div>
          <div className="el-section-sub">No money, no middlemen — just community.</div>
          <div className="el-steps">
            {[
              ['01','List & Request','Post what you HAVE and what you WANT. Add category, condition, and your neighbourhood.'],
              ['02','Match & Notify','Our engine scans for direct swaps or 3-way circles nearby and pings you instantly.'],
              ['03','Confirm & Connect','Review the circle, accept the match, and receive your counterpart\'s contact info.'],
              ['04','Exchange & Earn','Meet locally, swap, confirm on-app, and watch your Karma climb.'],
            ].map(([n,h,p])=>(
              <div className="el-step" key={n}>
                <div className="el-step-n">{n}</div>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </div>

        {/* EXCHANGE TYPES */}
        <div className="el-section" style={{paddingTop:0}}>
          <div className="el-section-tag">Exchange Types</div>
          <div className="el-section-h">Three ways to trade</div>
          <div className="el-section-sub">Pick the style that fits your situation.</div>
          <div className="el-types">
            {[
              {cls:'t-direct',  icon:'🤝', badge:'Direct · 1:1',     h:'Direct Swap',    p:'Simple two-way exchange when both parties have exactly what the other needs. The fastest path to a trade.'},
              {cls:'t-circular',icon:'🔄', badge:'Flagship · 3-Way', h:'Circular Trade', p:'EcoLoop\'s core innovation. The engine solves the "double coincidence of wants" by forming 3+ person trade circles automatically.'},
              {cls:'t-social',  icon:'💛', badge:'Social · Donate',  h:'NGO Donate',     p:'One-way donation to a verified NGO partner. Earns maximum Karma and contributes directly to community welfare.'},
            ].map(({cls,icon,badge,h,p})=>(
              <div className={`el-type ${cls}`} key={h}>
                <span className="el-type-icon">{icon}</span>
                <span className="el-type-badge">{badge}</span>
                <h3>{h}</h3>
                <p>{p}</p>
                <div className="el-type-deco"/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Dashboard({setPage}) {
  return (
    <div className="el-page">
      <div className="el-dash">
        <div className="el-dash-top">
          <div>
            <h2>Welcome back, Riya 👋</h2>
            <p>Mumbai · {LISTINGS.length} active listings</p>
          </div>
          <button className="btn-p" onClick={()=>setPage('list')}>+ New Listing</button>
        </div>
        <div className="el-kpi-row">
          {[['⭐','340','Karma Points'],['🤝','7','Swaps Done'],['📦','3','Active Listings']].map(([ic,v,l])=>(
            <div className="el-kpi" key={l}>
              <span className="el-kpi-icon">{ic}</span>
              <div><div className="el-kpi-val">{v}</div><div className="el-kpi-lbl">{l}</div></div>
            </div>
          ))}
        </div>
        <div className="el-dash-grid">
          <div className="el-card">
            <div className="el-card-hd">My Listings</div>
            {LISTINGS.map(l=>(
              <div className="el-lrow" key={l.name}>
                <div className="el-lrow-em">{l.emoji}</div>
                <div className="el-lrow-info"><h4>{l.name}</h4><p>Wants: {l.want}</p></div>
                <span className={`el-badge b-${l.status}`}>{l.status}</span>
              </div>
            ))}
          </div>
          <div className="el-card">
            <div className="el-card-hd">Recent Activity</div>
            <div className="el-act">
              {ACTIVITY.map(a=>(
                <div className="el-act-row" key={a.title}>
                  <div className="el-act-ic">{a.icon}</div>
                  <div className="el-act-inf"><h4>{a.title}</h4><p>{a.time}</p></div>
                  {a.karma && <div className="el-act-k">{a.karma}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Matches({setPage}) {
  const [accepted,setAccepted] = useState([]);
  const [toast,setToast]       = useState('');
  const pending = MATCHES_DATA.filter(m=>!accepted.includes(m.id));
  const done    = MATCHES_DATA.filter(m=>accepted.includes(m.id));

  function accept(id,karma) {
    setAccepted(a=>[...a,id]);
    setToast(`Circle accepted! +${karma} Karma incoming 🎉`);
    setTimeout(()=>setToast(''),3000);
  }

  return (
    <div className="el-page">
      <div className="el-matches">
        <div className="el-match-hd">
          <h2>Active Matches</h2>
          <p>{pending.length} pending · {done.length} accepted</p>
        </div>
        {pending.length===0 && (
          <div className="el-empty">
            <div className="el-empty-ico">✅</div>
            <h3>All caught up!</h3>
            <p>No pending matches. List more items to find new circles.</p>
            <button className="btn-p" onClick={()=>setPage('list')}>List an Item</button>
          </div>
        )}
        {pending.map(m=>(
          <div className="el-match-card" key={m.id}>
            <div className="el-match-top">
              <span className={`el-match-typebadge mt-${m.type}`}>{m.label}</span>
              <span className="el-match-karma">+<strong>{m.karma} Karma</strong> on completion</span>
            </div>
            <div className="el-participants">
              {m.parts.map((p,i)=>(
                <div key={p.n} style={{display:'flex',alignItems:'center'}}>
                  <div className="el-part">
                    <div className="el-part-av">{p.em}</div>
                    <div className="el-part-name">{p.n}</div>
                    <div className="el-part-item">{p.item}</div>
                  </div>
                  {i<m.parts.length-1 && <div className="el-arrow">→</div>}
                </div>
              ))}
            </div>
            <div className="el-match-footer">
              <button className="btn-accept" onClick={()=>accept(m.id,m.karma)}>✓ Accept Match</button>
              <button className="btn-dec">Decline</button>
            </div>
          </div>
        ))}
        {done.length>0 && <>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',color:'rgba(15,26,11,0.3)',margin:'24px 0 12px'}}>Accepted</div>
          {done.map(m=>(
            <div className="el-match-card" key={m.id} style={{opacity:.5,pointerEvents:'none'}}>
              <div className="el-match-top">
                <span className={`el-match-typebadge mt-${m.type}`}>{m.label}</span>
                <span style={{fontSize:13,color:'var(--fern)',fontWeight:700}}>✓ Accepted</span>
              </div>
              <div className="el-participants">
                {m.parts.map((p,i)=>(
                  <div key={p.n} style={{display:'flex',alignItems:'center'}}>
                    <div className="el-part"><div className="el-part-av">{p.em}</div><div className="el-part-name">{p.n}</div></div>
                    {i<m.parts.length-1&&<div className="el-arrow">→</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>}
      </div>
      {toast && <div className="el-toast">{toast}</div>}
    </div>
  );
}

function ListItem({setPage}) {
  const [emoji,setEmoji]   = useState('🧥');
  const [name,setName]     = useState('');
  const [cat,setCat]       = useState('');
  const [desc,setDesc]     = useState('');
  const [wants,setWants]   = useState('');
  const [done,setDone]     = useState(false);

  function submit() {
    if (!name||!wants) return;
    setDone(true);
    setTimeout(()=>setPage('dashboard'),2200);
  }

  if (done) return (
    <div className="el-page"><div className="el-form-wrap">
      <div className="el-success">
        <div className="el-success-icon">🎉</div>
        <h3>Item Listed!</h3>
        <p>We're scanning for matches near you. You'll be notified instantly.</p>
        <p style={{marginTop:12,fontSize:13,color:'var(--fern)',fontWeight:600}}>Returning to dashboard…</p>
      </div>
    </div></div>
  );

  return (
    <div className="el-page">
      <div className="el-form-wrap">
        <h2>List an Item</h2>
        <p>Tell us what you have and what you'd like in return.</p>
        <div className="el-fg">
          <label>Choose an icon</label>
          <div className="el-emoji-g">
            {EMOJIS.map(e=>(
              <button key={e} className={`el-ej${emoji===e?' on':''}`} onClick={()=>setEmoji(e)} type="button">{e}</button>
            ))}
          </div>
        </div>
        <div className="el-fg"><label>Item Name *</label><input placeholder="e.g. Winter Jacket, Acoustic Guitar…" value={name} onChange={e=>setName(e.target.value)}/></div>
        <div className="el-fg"><label>Category</label>
          <select value={cat} onChange={e=>setCat(e.target.value)}>
            <option value="">Select category…</option>
            {CATS.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="el-fg"><label>Description</label><textarea placeholder="Condition, brand, size, any details…" value={desc} onChange={e=>setDesc(e.target.value)}/></div>
        <div className="el-fg"><label>What do you want in return? *</label><input placeholder="e.g. Books, Plants, Art Supplies…" value={wants} onChange={e=>setWants(e.target.value)}/></div>
        <div className="el-tip">💡 <strong>Pro tip:</strong> Broader categories (e.g. "Books" not "Harry Potter") increase your chance of landing in a 3-way circle.</div>
        <button className="el-submit" onClick={submit}>🌿 Submit Listing</button>
      </div>
    </div>
  );
}

function Karma() {
  const karma = 340;
  const tier  = getTier(karma);
  const next  = TIERS[TIERS.indexOf(tier)+1];
  const pct   = next ? ((karma-tier.min)/(next.min-tier.min))*100 : 100;

  return (
    <div className="el-page">
      <div className="el-karma-wrap">
        <h2>Karma & Reputation</h2>
        <p>Earn points by completing trades, donating, and building trust.</p>
        <div className="el-karma-hero">
          <div className="el-kh-left">
            <div style={{fontSize:48,marginBottom:8}}>{tier.icon}</div>
            <div className="el-kh-num">{karma}</div>
            <div className="el-kh-tier"><strong>{tier.name}</strong> tier · Mumbai</div>
          </div>
          <div className="el-kh-right">
            <h3>Progress to {next?.name||'Max'}</h3>
            <div className="el-progress-bar">
              <div className="el-progress-fill" style={{width:`${pct}%`}}/>
            </div>
            <div className="el-progress-labels">
              <span>{tier.name} ({tier.min})</span>
              {next && <span>{next.name} ({next.min})</span>}
            </div>
            {next && <p style={{fontSize:13,color:'rgba(255,255,255,0.4)',marginTop:12}}>{next.min-karma} more to reach <strong style={{color:'#fff'}}>{next.name}</strong></p>}
            <div className="el-earn-grid">
              {EARN.map(e=>(
                <div className="el-earn-item" key={e.act}>
                  <span className="ei-icon">{e.icon}</span>
                  <span className="ei-act">{e.act}</span>
                  <span className="ei-pts">{e.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="el-lb">
          <div className="el-lb-hd">Local Leaderboard · Mumbai</div>
          {LEADERBOARD.map((u,i)=>(
            <div className={`el-lb-row${u.me?' me':''}`} key={u.n}>
              <div className="el-lb-rank">{i+1}</div>
              <div className="el-lb-av">{u.em}</div>
              <div className="el-lb-info"><h4>{u.n}{u.me?' ← You':''}</h4><p>{u.city} · {u.trades} trades</p></div>
              <div className="el-lb-k">{u.karma}</div>
              <span style={{marginLeft:4,fontSize:12}}>{getTier(u.karma).icon}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── ROOT APP ──────────────────────────────────── */
export default function App() {
  const [page,setPage] = useState('home');
  const karma = 340;

  return (
    <>
      <style>{CSS}</style>
      <div id="el-root">
        <Nav page={page} setPage={setPage} karma={karma}/>
        {page==='home'      && <Home setPage={setPage}/>}
        {page==='dashboard' && <Dashboard setPage={setPage}/>}
        {page==='matches'   && <Matches setPage={setPage}/>}
        {page==='list'      && <ListItem setPage={setPage}/>}
        {page==='karma'     && <Karma/>}
      </div>
    </>
  );
}
