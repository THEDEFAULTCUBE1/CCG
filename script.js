// ═══════════════════════════════════════════════════════════════
//   CCG BUNKER OS v5.1 — script.js
// ═══════════════════════════════════════════════════════════════
'use strict';

/* ────────────── AUDIO ENGINE ────────────── */
let _actx = null;
const getACtx = () => {
  if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
  return _actx;
};
const SFX = {
  on: true, typing: true,
  tone(f, type='sine', dur=0.15, vol=0.22, delay=0, fEnd=null) {
    if (!this.on) return;
    try {
      const ctx = getACtx(), osc = ctx.createOscillator(), g = ctx.createGain();
      const now = ctx.currentTime + delay;
      osc.connect(g); g.connect(ctx.destination);
      osc.type = type; osc.frequency.setValueAtTime(f, now);
      if (fEnd) osc.frequency.linearRampToValueAtTime(fEnd, now + dur);
      g.gain.setValueAtTime(vol, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.start(now); osc.stop(now + dur + 0.01);
    } catch(e) {}
  },
  click()   { if (!this.typing) return; this.tone(600 + Math.random()*700, 'square', 0.03, 0.06); },
  boot()    { [100,200,320,480,660,900].forEach((f,i) => this.tone(f,'sine',0.18,0.12,i*0.1)); setTimeout(()=>this.tone(1100,'triangle',0.5,0.2),750); },
  access()  { [330,440,550,660,880].forEach((f,i) => this.tone(f,'triangle',0.15,0.18,i*0.065)); },
  deny()    { this.tone(280,'sawtooth',0.18,0.45); this.tone(200,'sawtooth',0.2,0.45,0.16); this.tone(140,'sawtooth',0.22,0.35,0.3); },
  error()   { this.tone(220,'sawtooth',0.1,0.3); this.tone(180,'sawtooth',0.1,0.3,0.09); },
  success() { [440,550,660,880].forEach((f,i) => this.tone(f,'sine',0.14,0.2,i*0.07)); },
  reward()  { [330,440,524,659,784,880,1047].forEach((f,i) => this.tone(f,'triangle',0.18,0.2,i*0.055)); },
  secret()  { this.tone(220,'sine',0.8,0.12); this.tone(330,'sine',0.8,0.08,0.25); },
  appSwitch(){ this.tone(500,'sine',0.07,0.1); },
  lock()    { this.tone(350,'sawtooth',0.14,0.4); this.tone(240,'sawtooth',0.18,0.4,0.12); },
  notify()  { this.tone(800,'sine',0.06,0.15); this.tone(1000,'sine',0.06,0.12,0.07); },
};

/* ────────────── STATE ────────────── */
const S = {
  codesDecoded: 0,
  errors: 0,
  sessionStart: null,
  uptimeStart: null,
  pkt: { tx: 0, rx: 0 },
  fx: { scanlines:true, flicker:true, grain:true, chromatic:true, cursor:true, sound:true, typing:true },
  achievements: [],
  discoveries: [],
  gfxData: {
    codes:  Array(20).fill(0),
    pkts:   Array(20).fill(0),
    threat: Array.from({length:20}, (_,i) => Math.sin(i*0.4)*1.5 + 2.5),
    ops:    Array(20).fill(50),
    bunker: Array(20).fill(4),
  },
};

/* ────────────── ACHIEVEMENTS ────────────── */
const ACH_DEF = [
  { id:'first_code',    name:'FIRST CONTACT',     icon:'🔓', desc:'Decode your first code.' },
  { id:'three_codes',   name:'FIELD AGENT',        icon:'🕵️', desc:'Decode 3 codes.' },
  { id:'all_lore',      name:'LORE KEEPER',        icon:'📖', desc:'Unlock all lore entries.' },
  { id:'reward_hunter', name:'REWARD HUNTER',      icon:'🏆', desc:'Unlock a reward code.' },
  { id:'ghost_signal',  name:'GHOST SIGNAL',       icon:'👻', desc:'Discover the ghost frequency.' },
  { id:'deep_diver',    name:'DEEP DIVER',         icon:'⬇️', desc:'Find a sublevel 4 secret.' },
  { id:'code_master',   name:'CODE MASTER',        icon:'⭐', desc:'Decode 6+ codes.' },
  { id:'all_comms',     name:'SIGNAL INTERCEPTED', icon:'📡', desc:'Read all intercepted messages.' },
];
let commsRead = new Set();

/* ────────────── CODES DATABASE ────────────── */
const CODES = {
  SUBJECT0: {
    type:'lore', ach: null,
    lines:[
      '╔══════════════════════════════════════════════════════╗',
      '║  FILE: SUBJECT-0 // CLASSIFICATION: OMEGA           ║',
      '║  ORIGIN: CCG BUNKER — SUBLEVEL 4 ARCHIVE            ║',
      '╚══════════════════════════════════════════════════════╝',
      '',
      '  Subject Zero was the first individual inserted into',
      '  the CCG Bunker experiment during Year Zero.',
      '  Identity: CLASSIFIED. Clearance: OMEGA.',
      '',
      '  Last known location: Sublevel 4 — Corridor 7-C.',
      '  Last transmitted words: "It responded."',
      '',
      '  Status: UNACCOUNTED — 847 days since last signal.',
      '',
      '  TRB Security has flagged all mentions of Subject Zero.',
      '  Do not approach. Do not engage. Do not descend.',
      '',
      '  ⚠ NOTE: Subject Zero may still be inside the bunker.',
      '────────────────────────────────────────────────────────',
      '[ DECRYPT COMPLETE // CCG ARCHIVE v5.1 ]',
    ]
  },
  ALPHA: {
    type:'lore', ach:'all_lore',
    lines:[
      '╔══════════════════════════════════════════════════════╗',
      '║  PROTOCOL: ALPHA — CCG BUNKER ORIGIN FILE           ║',
      '╚══════════════════════════════════════════════════════╝',
      '',
      '  The Alpha Protocol initiated the CCG Bunker project.',
      '  Construction ran in secret over 3 years underground.',
      '',
      '  Surface cover: dense forest with controlled road access.',
      '  A functioning airbase was built nearby to supply it.',
      '  Heli insertion routes designated for all operatives.',
      '',
      '  Original stated purpose: classified intelligence archive.',
      '  Actual purpose: ████████████████████████████████████',
      '',
      '  The Alpha Protocol is still active.',
      '  You are inside it right now.',
      '',
      '  Find the remaining codes. Assemble the full truth.',
      '────────────────────────────────────────────────────────',
      '[ DECRYPT COMPLETE ]',
    ]
  },
  BUNKER: {
    type:'lore', ach:null,
    lines:[
      '╔══════════════════════════════════════════════════════╗',
      '║  CCG BUNKER — STRUCTURAL INTELLIGENCE BRIEF         ║',
      '╚══════════════════════════════════════════════════════╝',
      '',
      '  SURFACE ........... FOREST // AIRBASE // 3 ROAD ROUTES',
      '  SUBLEVEL 1 ........ TRB SECURITY // ENTRY CHECKPOINT',
      '  SUBLEVEL 2 ........ COMMS // BRIEFINGS // ARCHIVE',
      '  SUBLEVEL 3 ........ THIS TERMINAL ★ [YOU ARE HERE]',
      '  SUBLEVEL 4 ........ ████████████████████████████████',
      '  BELOW SL-4 ........ NO SIGNAL — UNKNOWN DEPTH',
      '',
      '  The bunker expands downward via a central shaft.',
      '  3 road routes cut through the forest to the outside.',
      '  TRB Security controls all access points, all levels.',
      '',
      '  ⚠ Personnel who entered Sublevel 4: 12.',
      '  ⚠ Personnel who returned from Sublevel 4: 9.',
      '────────────────────────────────────────────────────────',
      '[ DECRYPT COMPLETE ]',
    ]
  },
  CORE: {
    type:'reward', ach:'reward_hunter',
    lines:[
      '╔══════════════════════════════════════════════════════╗',
      '║  ★  REWARD UNLOCKED: CORE OPERATIVE BADGE  ★        ║',
      '╚══════════════════════════════════════════════════════╝',
      '',
      '  You found the CORE signal fragment.',
      '',
      '  ▸ CCG Core Badge — registered to your operative ID.',
      '  ▸ Marks you as a certified CCG field decoder.',
      '  ▸ Coin bonus queued for in-game exchange.',
      '',
      '  This is just the beginning.',
      '  More rewards are hidden deeper than you think.',
      '',
      '╔══════════════════════════════════════════════════════╗',
      '║  ★  SHOW THIS SCREEN TO A CCG ADMIN TO CLAIM  ★     ║',
      '╚══════════════════════════════════════════════════════╝',
    ]
  },
  GHOST: {
    type:'secret', ach:'ghost_signal',
    lines:[
      '╔══════════════════════════════════════════════════════╗',
      '║  GHOST FREQUENCY — EYES ONLY — UNLOGGED CHANNEL     ║',
      '╚══════════════════════════════════════════════════════╝',
      '',
      '  Signal on band 7.4MHz. Origin: MOBILE. Untraceable.',
      '',
      '  Decoded transmission:',
      '',
      '  "The roads are watched. The forest hides more.',
      '   The heli drop zone is not where they told you.',
      '   Sublevel 4 is not the bottom.',
      '   Something answered back when I called.',
      '   I am still here.',
      '   — S.Z."',
      '',
      '  ⚠ TRB Security has no record of this transmission.',
      '  ⚠ Signal origin: near Sublevel 4 junction point.',
      '',
      '  You were not meant to find this. Leave no trace.',
      '────────────────────────────────────────────────────────',
      '[ SIGNAL TERMINATED — SOURCE UNRESOLVABLE ]',
    ]
  },
  ORIGIN: {
    type:'lore', ach:null,
    lines:[
      '╔══════════════════════════════════════════════════════╗',
      '║  FILE: ORIGIN — FOUNDING OF CCG PRODUCTIONS         ║',
      '╚══════════════════════════════════════════════════════╝',
      '',
      '  CCG Productions was not originally a production company.',
      '',
      '  Founded after an unnamed incident, CCG was built around',
      '  a single belief: certain knowledge must be hidden —',
      '  not to protect the organization, but to protect everyone.',
      '',
      '  The bunker is the physical embodiment of that belief.',
      '  What is stored here cannot be stored above ground.',
      '',
      '  The event you are in is not just a game.',
      '  It is a field test. You are being evaluated.',
      '',
      '  CCG Productions watches. CCG Productions remembers.',
      '  TRB Security ensures no one finds out what for.',
      '────────────────────────────────────────────────────────',
      '[ DECRYPT COMPLETE ]',
    ]
  },
  CRIMSON: {
    type:'reward', ach:null,
    lines:[
      '╔══════════════════════════════════════════════════════╗',
      '║  ★★  REWARD UNLOCKED: CRIMSON CLEARANCE  ★★         ║',
      '╚══════════════════════════════════════════════════════╝',
      '',
      '  CLEARANCE TIER UPGRADED: ► CRIMSON ◄',
      '',
      '  ▸ Crimson Badge — registered to your operative ID.',
      '  ▸ Sublevel 2 restricted archive access GRANTED.',
      '  ▸ Exclusive Crimson cosmetic reward queued.',
      '  ▸ Coin multiplier: +25% active for this session.',
      '',
      '  You are among the top operatives in this event.',
      '',
      '╔══════════════════════════════════════════════════════╗',
      '║  ★★  SHOW THIS SCREEN TO A CCG ADMIN TO CLAIM  ★★   ║',
      '╚══════════════════════════════════════════════════════╝',
    ]
  },
  ARCHIVE: {
    type:'secret', ach:'deep_diver',
    lines:[
      '╔══════════════════════════════════════════════════════╗',
      '║  ARCHIVE — OMEGA LEVEL — SESSION NOT BEING LOGGED   ║',
      '╚══════════════════════════════════════════════════════╝',
      '',
      '  > Bypassing standard log entry...',
      '  > Accessing restricted archive layer...',
      '  > Decrypting memory fragments...',
      '',
      '  The archive is not a collection of files.',
      '  The archive is a continuous record of everything',
      '  that has occurred inside this bunker.',
      '',
      '  Every person who entered. Every code entered.',
      '  Every attempt to reach Sublevel 5.',
      '',
      '  The archive has a heartbeat.',
      '  It started 847 days ago.',
      '  The same day Subject Zero stopped transmitting.',
      '',
      '  ████ RECORD CONTINUES BELOW — OMEGA LOCKED ████',
      '',
      '  > This session has been suppressed. You were never here.',
      '────────────────────────────────────────────────────────',
      '[ ACCESS PARTIAL — CLEARANCE INSUFFICIENT FOR REMAINDER ]',
    ]
  },
  HELI: {
    type:'lore', ach:null,
    lines:[
      '╔══════════════════════════════════════════════════════╗',
      '║  FILE: INSERTION PROTOCOL — HELI DROP BRIEF         ║',
      '╚══════════════════════════════════════════════════════╝',
      '',
      '  Standard operative insertion: helicopter drop into',
      '  the forest sector, ~800m north of the airbase.',
      '',
      '  Route: DROP ZONE → FOREST PATH → AIRBASE (optional)',
      '         → ROAD ACCESS POINT → BUNKER ENTRANCE → DESCENT',
      '',
      '  The forest path contains: surveillance markers,',
      '  two concealed supply caches, one signal relay node.',
      '',
      '  The airbase serves as a secondary staging point.',
      '  TRB personnel patrol the perimeter at set intervals.',
      '',
      '  What you were not told: thermal sensors have logged',
      '  unexplained movement at grid position 7-North-4.',
      '  Every single night. Every single night.',
      '────────────────────────────────────────────────────────',
      '[ DECRYPT COMPLETE ]',
    ]
  },
  TRB: {
    type:'lore', ach:null,
    lines:[
      '╔══════════════════════════════════════════════════════╗',
      '║  FILE: TRB SECURITY DIVISION — PARTIAL DECLASSIFIED ║',
      '╚══════════════════════════════════════════════════════╝',
      '',
      '  TRB Security Division serves one client: CCG Productions.',
      '',
      '  Mandate: secure all bunker sublevels at all times.',
      '  Authority: absolute within the facility.',
      '  Methods: classified.',
      '',
      '  TRB employs approximately ██ personnel at full strength.',
      '  Standard bunker duty: ██ active at any time.',
      '  Sublevel 4 assignment: VOLUNTARY ONLY — few apply twice.',
      '',
      '  ⚠ All TRB orders must be obeyed immediately.',
      '  ⚠ Do not ask TRB about Sublevel 4.',
      '  ⚠ Do not ask TRB about Subject Zero.',
      '  ⚠ Do not ask TRB about the readings.',
      '────────────────────────────────────────────────────────',
      '[ DECRYPT COMPLETE ]',
    ]
  },
  COINS: {
    type:'reward', ach:null,
    lines:[
      '╔══════════════════════════════════════════════════════╗',
      '║  ★  BONUS REWARD: COIN CACHE UNLOCKED  ★            ║',
      '╚══════════════════════════════════════════════════════╝',
      '',
      '  You found the Coin Cache code.',
      '',
      '  ▸ +500 BONUS COINS — added to your in-game wallet.',
      '  ▸ Valid for one redemption at the Coin Exchange.',
      '  ▸ Coin Exchange is on Sublevel 2 — Operations Center.',
      '  ▸ Items rotate throughout the event.',
      '',
      '╔══════════════════════════════════════════════════════╗',
      '║  ★  SHOW THIS SCREEN TO A CCG ADMIN TO REDEEM  ★    ║',
      '╚══════════════════════════════════════════════════════╝',
    ]
  },
};

/* ────────────── COMMS DATA ────────────── */
const COMMS = [
  {
    from:'CCG-HQ', subj:'OPERATIVE DEPLOYMENT ORDER', time:'07:04:11',
    html:`<div class="cv-hdr"><div class="cv-from">FROM: CCG OPERATIONS HQ // ENCRYPTED CHANNEL</div><div class="cv-subj">OPERATIVE DEPLOYMENT ORDER — ALPHA CLEARANCE</div></div><div class="cv-body">Operative,<br/><br/>You have been inserted via helicopter into the forest sector and routed to the CCG Bunker. You are now at Sublevel 3 — the primary Decode Terminal, connected to the classified archive via an encrypted channel monitored by TRB Security Division.<br/><br/>Your mission: locate and decrypt all field codes embedded throughout the operational area. Codes are hidden in the forest, along the road access points, at the airbase, within the bunker, and at various depths underground.<br/><br/>Each decoded code unlocks a piece of the classified archive, a reward, or intelligence that no briefing document contains. The full picture only emerges when all fragments are assembled.<br/><br/>Do not discuss codes with other operatives until you have registered yours here first.<br/><br/>Good hunting.<br/>— CCG OPERATIONS DIVISION<br/><span style="color:rgba(255,255,255,0.15)">████ AUTH CODE: ████████████████ ████</span></div>`
  },
  {
    from:'TRB-COMMAND', subj:'SECURITY BRIEFING — PRE-MISSION', time:'06:22:47',
    html:`<div class="cv-hdr"><div class="cv-from" style="color:#00d2ff">FROM: TRB SECURITY COMMAND // CCG-BNK-MAIN</div><div class="cv-subj">SECURITY BRIEFING — PRE-MISSION ADVISORY</div></div><div class="cv-body">To all operatives within CCG Bunker facility:<br/><br/><b style="color:#00d2ff">RULES OF CONDUCT:</b><br/>01. TRB authority is absolute. Comply immediately with all directives.<br/>02. Do not access areas beyond your cleared sublevel without escort.<br/>03. All terminal usage is monitored and archived by TRB systems.<br/>04. Report anomalous observations to the nearest TRB post.<br/>05. Do NOT attempt to access Sublevel 4 without an escort. Ever.<br/><br/><b style="color:#ffcc00">CURRENT THREAT LEVEL: MODERATE</b><br/>Elevated readings in the forest sector. Two unidentified signals detected. Both are under active investigation.<br/><br/>You are safe within the facility. TRB is watching.<br/>— TRB SECURITY COMMAND</div>`
  },
  {
    from:'UNKNOWN_SOURCE', subj:'⚠ URGENT — READ IMMEDIATELY', time:'??:??:??',
    html:`<div class="cv-hdr"><div class="cv-from" style="color:#ff3333">FROM: UNVERIFIED // SOURCE: UNTRACEABLE // ORIGIN: UNKNOWN</div><div class="cv-subj" style="color:#ffcc00">⚠ URGENT — READ IMMEDIATELY — DO NOT SHARE</div></div><div class="cv-body" style="color:rgba(255,204,0,0.9)">Whoever is reading this.<br/><br/>The bunker is not what CCG told you. The codes you are finding are not just for lore. They are fragments of something that should never be assembled in one place.<br/><br/>I was an operative three events ago. I found all the codes. I entered them all. The terminal showed me something that is not in any of the public "lore" fragments.<br/><br/>I cannot tell you what it was. TRB monitors all comms from inside the bunker. But I can tell you this:<br/><br/><b style="color:#ff3333">Do not enter the final code if you find it. You will know it when you see it. It will feel different from the others.</b><br/><br/>Below Sublevel 4 there is something that responds to the decode terminal. It has been waiting. For a long time. And it is patient.<br/><br/>I had to warn you.<br/>— <span style="color:#ff3333">███████</span></div>`
  },
  {
    from:'CCG-ARCHIVE', subj:'SUBLEVEL 4 — INCIDENT REPORT 07', time:'LOGGED',
    html:`<div class="cv-hdr"><div class="cv-from" style="color:#ff6b35">FROM: CCG ARCHIVE SYSTEM // AUTO-GENERATED LOG</div><div class="cv-subj">SUBLEVEL 4 — INCIDENT REPORT #07 of 12</div></div><div class="cv-body"><b style="color:#ff6b35">CLASSIFICATION: UNEXPLAINED</b><br/><b>DATE:</b> <span style="color:rgba(255,255,255,0.12)">████████████</span><br/><b>INVOLVED:</b> 3 TRB operatives, 1 researcher<br/><br/><b>REPORT:</b><br/>At approximately 02:14 local time, motion sensors in Sublevel 4, Corridor C registered movement consistent with a human individual. No personnel were authorized or present below Sublevel 3 at this time.<br/><br/>Camera footage review for Corridor C: <b style="color:#ff3333">FOOTAGE MISSING — 12-minute gap</b><br/><br/>Audio log captured two events during the gap:<br/>— A mechanical sound described as "doors opening that have no doors"<br/>— A voice: <em style="color:#7b2ff7">"I can see all of them now."</em><br/><br/>Three subsequent attempts to access Corridor C resulted in equipment failure at the junction point.<br/><br/><b>TRB ASSESSMENT:</b> Equipment malfunction. No further investigation required.<br/><b>ARCHIVE ASSESSMENT:</b> <span style="color:rgba(255,255,255,0.1)">████████████████████████████████████████████████</span></div>`
  },
  {
    from:'??? ENCRYPTED ???', subj:'find the door', time:'RED-ZONE',
    html:`<div class="cv-hdr"><div class="cv-from" style="color:#ff2d9b">FROM: ??? // CIPHER: UNKNOWN // TRACE: FAILED 47 TIMES</div><div class="cv-subj" style="color:#ff2d9b">find the door</div></div><div class="cv-body" style="color:rgba(210,180,230,0.88);font-size:13px;line-height:2.5">the terminal you're using.<br/>i built it.<br/><br/>not this version. the first one. before CCG changed it. before TRB locked the lower menus.<br/><br/>there is a door on sublevel 4 that doesn't appear on any blueprint.<br/>no handle. no keypad. no seams.<br/>it opens when it decides you are ready.<br/><br/>i went through it.<br/>i came back. eventually.<br/>the clocks said three minutes.<br/>my body said three years.<br/><br/>if you find the door:<br/>don't knock.<br/>it already knows you're standing there.<br/><br/><span style="color:#ff2d9b;font-size:16px">find me.</span><br/>— s.z.</div>`
  },
];

/* ────────────── WORLD CANVAS ────────────── */
(function initWorldCanvas() {
  const c = document.getElementById('worldCanvas');
  const ctx = c.getContext('2d');
  const pts = [];
  function resize() { c.width = innerWidth; c.height = innerHeight; }
  resize(); window.addEventListener('resize', resize);
  for (let i = 0; i < 80; i++) pts.push({
    x: Math.random()*innerWidth, y: Math.random()*innerHeight,
    vx:(Math.random()-.5)*.12, vy:(Math.random()-.5)*.12,
    r:Math.random()*1.5+.3, a:Math.random()*.4+.05,
    h:[180,220,260,280,30][Math.floor(Math.random()*5)]
  });
  let t = 0;
  (function draw() {
    t++;
    ctx.clearRect(0,0,c.width,c.height);
    ctx.strokeStyle='rgba(0,150,200,0.03)'; ctx.lineWidth=1;
    const gs=90;
    for(let x=0;x<c.width;x+=gs){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,c.height);ctx.stroke();}
    for(let y=0;y<c.height;y+=gs){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(c.width,y);ctx.stroke();}
    pts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=c.width; if(p.x>c.width)p.x=0;
      if(p.y<0)p.y=c.height; if(p.y>c.height)p.y=0;
      const a=p.a*(0.5+0.5*Math.sin(t*.02+p.x*.01));
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`hsla(${p.h},100%,65%,${a})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  })();
})();

/* ────────────── CURSOR GLOW ────────────── */
const cursorGlow = document.getElementById('cursorGlow');
document.addEventListener('mousemove', e => {
  if (!S.fx.cursor) return;
  cursorGlow.style.left = e.clientX + 'px';
  cursorGlow.style.top  = e.clientY + 'px';
  cursorGlow.style.opacity = '1';
});

/* ────────────── BIO SCANNER CANVAS ────────────── */
function runBioCanvas() {
  const c = document.getElementById('bioCanvas'); if (!c) return;
  const ctx = c.getContext('2d'); let t = 0;
  (function draw() {
    t++; ctx.clearRect(0,0,c.width,c.height);
    ctx.strokeStyle='rgba(0,210,255,0.35)'; ctx.lineWidth=0.8;
    for (let y=5; y<c.height; y+=8) {
      ctx.beginPath();
      for (let x=0; x<c.width; x+=2) {
        const off=Math.sin((x+t)*.14+y*.3)*3.5+Math.sin((x-t*.6)*.08)*2;
        if(x===0)ctx.moveTo(x,y+off); else ctx.lineTo(x,y+off);
      }
      ctx.stroke();
    }
    const sy=(t*1.2)%(c.height+10)-5;
    const sg=ctx.createLinearGradient(0,sy-8,0,sy+8);
    sg.addColorStop(0,'transparent'); sg.addColorStop(.5,'rgba(0,210,255,.4)'); sg.addColorStop(1,'transparent');
    ctx.fillStyle=sg; ctx.fillRect(0,sy-8,c.width,16);
    requestAnimationFrame(draw);
  })();
}

/* ────────────── WAVE CANVAS ────────────── */
function runWaveCanvas() {
  const c = document.getElementById('waveCanvas'); if (!c) return;
  const ctx = c.getContext('2d'); let t = 0;
  (function draw() {
    t++; ctx.clearRect(0,0,c.width,c.height);
    const g=ctx.createLinearGradient(0,0,c.width,0);
    g.addColorStop(0,'rgba(123,47,247,.6)'); g.addColorStop(.5,'rgba(0,210,255,.8)'); g.addColorStop(1,'rgba(255,107,53,.6)');
    ctx.strokeStyle=g; ctx.lineWidth=1.5; ctx.beginPath();
    for (let x=0; x<c.width; x++) {
      const y=c.height/2+Math.sin((x+t)*.14)*7+Math.sin((x+t)*.09)*5+Math.sin((x+t*1.4)*.22)*3+(Math.random()<.015?(Math.random()-.5)*10:0);
      if(x===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke(); requestAnimationFrame(draw);
  })();
}

/* ────────────── AUTH BG ────────────── */
function runAuthBg() {
  const c = document.getElementById('authBg'); if (!c) return;
  c.width=innerWidth; c.height=innerHeight;
  const ctx=c.getContext('2d'); let t=0;
  (function draw(){
    t++; ctx.clearRect(0,0,c.width,c.height);
    ctx.strokeStyle='rgba(0,210,255,0.04)'; ctx.lineWidth=1;
    for(let r=40;r<Math.max(c.width,c.height)*.85;r+=70){
      ctx.beginPath(); ctx.arc(c.width/2,c.height/2+20,r+Math.sin(t*.02)*6,0,Math.PI*2); ctx.stroke();
    }
    requestAnimationFrame(draw);
  })();
}

/* ────────────── SPARKLINES ────────────── */
function drawSparkline(id, data, color) {
  const c=document.getElementById(id); if(!c)return;
  const ctx=c.getContext('2d'), W=c.width, H=c.height;
  ctx.clearRect(0,0,W,H);
  if(data.length<2)return;
  const max=Math.max(...data,1), min=Math.min(...data), range=max-min||1;
  ctx.strokeStyle=color; ctx.lineWidth=1.5;
  ctx.shadowColor=color; ctx.shadowBlur=4; ctx.beginPath();
  data.forEach((v,i)=>{
    const x=i/(data.length-1)*W, y=H-(v-min)/range*(H-2)-1;
    if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke(); ctx.shadowBlur=0;
  ctx.fillStyle=color.replace(/[\d.]+\)$/,'0.08)');
  ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
}

/* ────────────── MINI SECTOR MAP ────────────── */
let miniRAF;
function startMiniMap() {
  const c=document.getElementById('miniSector'); if(!c)return;
  const ctx=c.getContext('2d');
  function resize(){c.width=c.clientWidth; c.height=c.clientHeight;}
  resize();
  let t=0;
  (function draw(){
    t++; miniRAF=requestAnimationFrame(draw);
    if(!c.clientWidth)return;
    const W=c.width, H=c.height;
    ctx.clearRect(0,0,W,H);
    // forest bg
    ctx.fillStyle='rgba(0,35,8,0.65)'; ctx.fillRect(0,0,W,H);
    // trees
    for(let i=0;i<45;i++){
      const fx=((i*73+11)%97)/97, fy=((i*47+29)%83)/83;
      ctx.fillStyle=`rgba(0,${55+i%25},${8+i%12},0.5)`;
      ctx.beginPath(); ctx.arc(fx*W,fy*H,3+i%5,0,Math.PI*2); ctx.fill();
    }
    // grid
    ctx.strokeStyle='rgba(0,140,190,0.04)'; ctx.lineWidth=1;
    for(let x=0;x<W;x+=28){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    // roads
    const roads=[
      [.18,.22,.48,.60],[.48,.60,.85,.52],[.06,.12,.18,.22]
    ];
    roads.forEach(r=>{
      ctx.strokeStyle='rgba(200,175,110,0.22)'; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.moveTo(r[0]*W,r[1]*H); ctx.lineTo(r[2]*W,r[3]*H); ctx.stroke();
    });
    // sweep line
    const sa=(t*.7)%(W+26)-13;
    const sg=ctx.createLinearGradient(sa-13,0,sa+13,0);
    sg.addColorStop(0,'transparent'); sg.addColorStop(.5,'rgba(0,210,255,0.04)'); sg.addColorStop(1,'transparent');
    ctx.fillStyle=sg; ctx.fillRect(sa-13,0,26,H);
    // threat zones
    [[.75,.28],[.22,.72]].forEach(tr=>{
      ctx.fillStyle='rgba(255,107,53,0.12)'; ctx.beginPath();
      ctx.arc(tr[0]*W,tr[1]*H,22,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,107,53,0.7)'; ctx.font='11px sans-serif';
      ctx.fillText('▲',tr[0]*W-5,tr[1]*H+4);
    });
    // code sites
    [[.1,.12],[.18,.22],[.33,.38],[.48,.60],[.48,.72]].forEach((cs,i)=>{
      const pp=Math.sin(t*.08+i*1.2)*.5+.5;
      ctx.fillStyle=`rgba(123,47,247,${0.12+pp*.12})`; ctx.beginPath(); ctx.arc(cs[0]*W,cs[1]*H,9+pp*3,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(150,80,255,.9)'; ctx.font='10px sans-serif'; ctx.fillText('★',cs[0]*W-5,cs[1]*H+4);
    });
    // airbase
    ctx.strokeStyle='rgba(255,204,0,0.35)'; ctx.lineWidth=1.2; ctx.setLineDash([4,3]);
    ctx.strokeRect(.06*W,.1*H,.18*W,.14*H); ctx.setLineDash([]);
    ctx.fillStyle='#ffcc00'; ctx.font='8px Share Tech Mono';
    ctx.fillText('✈ AIRBASE',.07*W,.175*H);
    // heli dot
    ctx.fillStyle='rgba(255,45,155,0.8)'; ctx.beginPath(); ctx.arc(.1*W,.12*H,5,0,Math.PI*2); ctx.fill();
    // bunker
    const bx=.48*W, by=.6*H, bp=Math.sin(t*.05)*.4+.6;
    [25,35,45].forEach(r=>{
      ctx.strokeStyle=`rgba(0,210,255,${(.12-.02*(r-25)/10)*bp})`; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(bx,by,r,0,Math.PI*2); ctx.stroke();
    });
    ctx.fillStyle='#00d2ff'; ctx.beginPath(); ctx.arc(bx,by,5,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(0,210,255,.8)'; ctx.font='bold 8px Share Tech Mono'; ctx.fillText('◎ CCG',bx-12,by-16);
  })();
}

/* ────────────── FULL SECTOR MAP ────────────── */
let sectorRAF;
function startSectorMap() {
  const c=document.getElementById('sectorMap'); if(!c)return;
  cancelAnimationFrame(sectorRAF);
  const ctx=c.getContext('2d');
  function resize(){c.width=c.clientWidth; c.height=c.clientHeight;}
  resize(); window.addEventListener('resize',resize);
  let t=0;
  (function draw(){
    t++; sectorRAF=requestAnimationFrame(draw);
    const W=c.width, H=c.height;
    ctx.clearRect(0,0,W,H);
    // bg
    const bg=ctx.createRadialGradient(W*.5,H*.5,0,W*.5,H*.5,Math.max(W,H)*.65);
    bg.addColorStop(0,'rgba(0,28,9,0.75)'); bg.addColorStop(1,'rgba(0,6,2,0.96)');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    // grid
    ctx.strokeStyle='rgba(0,130,60,0.04)'; ctx.lineWidth=1;
    for(let x=0;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    // tree clusters
    ctx.fillStyle='rgba(0,50,12,0.18)';
    for(let i=0;i<90;i++){
      const tx=((i*137+t*.005)%W), ty=((i*89)%H);
      ctx.beginPath(); ctx.arc(tx,ty,4+i%7,0,Math.PI*2); ctx.fill();
    }
    // roads
    const roads=[
      [.3,0,.25,.3],[.25,.3,.48,.6],[.48,.6,1,.65],[.06,.18,.25,.3]
    ];
    roads.forEach(r=>{
      ctx.strokeStyle='rgba(200,175,110,0.22)'; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(r[0]*W,r[1]*H); ctx.lineTo(r[2]*W,r[3]*H); ctx.stroke();
      ctx.strokeStyle='rgba(180,155,90,0.08)'; ctx.lineWidth=10;
      ctx.beginPath(); ctx.moveTo(r[0]*W,r[1]*H); ctx.lineTo(r[2]*W,r[3]*H); ctx.stroke();
    });
    // sweep
    const sw=(t*.55)%(W+40)-20;
    const swg=ctx.createLinearGradient(sw-22,0,sw+22,0);
    swg.addColorStop(0,'transparent'); swg.addColorStop(.5,'rgba(0,210,255,0.055)'); swg.addColorStop(1,'transparent');
    ctx.fillStyle=swg; ctx.fillRect(sw-22,0,44,H);
    // AIRBASE
    ctx.fillStyle='rgba(255,204,0,0.06)'; ctx.fillRect(.05*W,.08*H,.22*W,.22*H);
    ctx.strokeStyle='rgba(255,204,0,0.35)'; ctx.lineWidth=1.5; ctx.setLineDash([6,4]);
    ctx.strokeRect(.05*W,.08*H,.22*W,.22*H); ctx.setLineDash([]);
    ctx.fillStyle='#ffcc00'; ctx.font='bold 14px Orbitron,monospace';
    ctx.fillText('✈ AIRBASE',.065*W,.175*H);
    // heli drop zone
    const hx=.13*W, hy=.05*H;
    ctx.fillStyle='rgba(255,45,155,0.12)'; ctx.beginPath(); ctx.arc(hx,hy,22,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(255,45,155,0.5)'; ctx.lineWidth=1.2;
    ctx.beginPath(); ctx.arc(hx,hy,22,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='#ff2d9b'; ctx.font='13px sans-serif'; ctx.fillText('🚁',hx-7,hy+6);
    ctx.font='8px Share Tech Mono'; ctx.fillStyle='rgba(255,45,155,0.7)'; ctx.fillText('DROP ZONE',hx-16,hy+22);
    // code sites
    const cSites=[{x:.13,y:.05},{x:.1,y:.15},{x:.29,y:.37},{x:.48,y:.6},{x:.34,y:.54},{x:.48,y:.74}];
    cSites.forEach((cs,i)=>{
      const pp=Math.sin(t*.07+i*1.2)*.5+.5;
      ctx.fillStyle=`rgba(123,47,247,${.14+pp*.14})`; ctx.beginPath(); ctx.arc(cs.x*W,cs.y*H,11+pp*5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(180,100,255,.95)'; ctx.font='13px sans-serif'; ctx.fillText('★',cs.x*W-6,cs.y*H+5);
    });
    // threat zones
    [{x:.77,y:.28},{x:.23,y:.74}].forEach(tr=>{
      ctx.fillStyle=`rgba(255,107,53,${.04+.03*Math.sin(t*.05)})`;
      ctx.beginPath(); ctx.arc(tr.x*W,tr.y*H,38,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(255,107,53,0.28)'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.arc(tr.x*W,tr.y*H,38,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='rgba(255,107,53,0.85)'; ctx.font='16px sans-serif'; ctx.fillText('▲',tr.x*W-7,tr.y*H+6);
    });
    // CCG BUNKER
    const bx=.48*W, by=.6*H, bp=Math.sin(t*.04)*.4+.6;
    [45,60,78].forEach((r,i)=>{
      ctx.strokeStyle=`rgba(0,210,255,${(.11-i*.025)*bp})`; ctx.lineWidth=1;
      ctx.beginPath(); ctx.arc(bx,by,r,0,Math.PI*2); ctx.stroke();
    });
    ctx.fillStyle='rgba(0,210,255,0.09)'; ctx.beginPath(); ctx.arc(bx,by,30,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#00d2ff'; ctx.font='bold 15px Orbitron,monospace';
    ctx.fillText('◎ CCG BUNKER',bx-58,by-36);
    ctx.fillStyle='rgba(0,210,255,0.85)'; ctx.beginPath(); ctx.arc(bx,by,8,0,Math.PI*2); ctx.fill();
    ctx.font='10px Share Tech Mono'; ctx.fillStyle='rgba(0,210,255,0.5)';
    ctx.fillText('SUBLEVEL 3',bx-30,by+22);
    // data packets on roads
    roads.forEach((r,ri)=>{
      const prog=((t*.8+ri*40)%100)/100;
      const px=(r[0]+( r[2]-r[0])*prog)*W, py=(r[1]+(r[3]-r[1])*prog)*H;
      ctx.fillStyle='rgba(0,210,255,0.6)'; ctx.beginPath(); ctx.arc(px,py,2.5,0,Math.PI*2); ctx.fill();
    });
    document.getElementById('mapScan').textContent=new Date().toTimeString().slice(0,8);
  })();
}

/* ────────────── CLOCKS ────────────── */
function updateClocks(){
  const t=new Date().toTimeString().slice(0,8);
  document.getElementById('gbClock').textContent=t;
  const oc=document.getElementById('osClock'); if(oc)oc.textContent=t;
}
setInterval(updateClocks,1000); updateClocks();

function updateUptime(){
  if(!S.uptimeStart)return;
  const s=Math.floor((Date.now()-S.uptimeStart)/1000);
  const h=String(Math.floor(s/3600)).padStart(2,'0');
  const m=String(Math.floor((s%3600)/60)).padStart(2,'0');
  const sc=String(s%60).padStart(2,'0');
  const el=document.getElementById('osUptime'); if(el)el.textContent=`${h}:${m}:${sc}`;
}
setInterval(updateUptime,1000);

function updateSession(){
  if(!S.sessionStart)return;
  const s=Math.floor((Date.now()-S.sessionStart)/1000);
  const m=String(Math.floor(s/60)).padStart(2,'0');
  const sc=String(s%60).padStart(2,'0');
  const el=document.getElementById('osSession'); if(el)el.textContent=`SESSION: ${m}:${sc}`;
  const ts=document.getElementById('tsbTime'); if(ts)ts.textContent=`${m}:${sc}`;
}
setInterval(updateSession,1000);

/* ────────────── PACKETS ────────────── */
function startPackets(){
  setInterval(()=>{
    S.pkt.tx+=Math.floor(Math.random()*22)+3;
    S.pkt.rx+=Math.floor(Math.random()*15)+1;
    S.gfxData.pkts.push(S.pkt.tx%50+Math.random()*10);
    if(S.gfxData.pkts.length>20)S.gfxData.pkts.shift();
    const tx=document.getElementById('osTX'); if(tx)tx.textContent=S.pkt.tx.toLocaleString();
    const rx=document.getElementById('osRX'); if(rx)rx.textContent=S.pkt.rx.toLocaleString();
    const sc=document.getElementById('scPkts'); if(sc)sc.textContent=S.pkt.tx.toLocaleString();
    drawSparkline('spk3',S.gfxData.pkts,'rgba(0,255,136,1)');
  },700);
}

/* ────────────── MARQUEE ────────────── */
document.getElementById('gbMarquee').textContent=
  '◈ CCG BUNKER ACTIVE — SUBLEVEL 3 TERMINAL ONLINE   ◈   TRB SECURITY MONITORING ALL SESSIONS   ◈   '+
  'THREAT LEVEL: MODERATE — FOREST SECTOR 7   ◈   50+ OPERATIVES IN THE FIELD   ◈   '+
  'FIND CODES — ENTER THEM IN THE TERMINAL — UNLOCK THE TRUTH   ◈   AIRBASE ACTIVE — HELI DROP CONFIRMED   ◈   '+
  'SUBLEVEL 4 ACCESS: OMEGA CLEARANCE REQUIRED   ◈   CCG PRODUCTIONS — CLASSIFIED EVENT ACTIVE   ◈';

/* ────────────── LIVE FEED ────────────── */
const FEED=[
  ['NETWORK','Secure uplink BUNKER-MAIN → CCG-HQ: 12ms // NOMINAL'],
  ['SECURITY','TRB perimeter sweep complete — surface sector CLEAR'],
  ['SYSTEM','Decode engine cache cleared — ready for new entries'],
  ['NETWORK','Encrypted packet relay: BUNKER ↔ ARCHIVE // ACTIVE'],
  ['ALERT','Forest sector thermal sensor: anomalous reading — grid 7N4'],
  ['SECURITY','Sublevel 2 access log: 14 operatives on level'],
  ['SYSTEM','AES-4096 key rotation completed successfully'],
  ['NETWORK','Road access point ALPHA — vehicle logged, outbound'],
  ['ALERT','Unknown signal detected: band 7.4MHz — INVESTIGATING'],
  ['SECURITY','TRB checkpoint: biometric scan — 3 personnel cleared'],
  ['SYSTEM','Archive fragment integrity check: ALL FRAGMENTS VALID'],
  ['NETWORK','Heli uplink: CCG-HQ acknowledges field operative status'],
  ['ALERT','Sublevel 4 junction: access attempt — DENIED // NO CLEARANCE'],
  ['SYSTEM','Operative session tokens refreshed — 48 sessions active'],
  ['NETWORK','Backup comms relay activated — primary route congested'],
  ['SECURITY','Motion sensor CORRIDOR-C: triggered — classified response'],
];
let feedIdx=0;
function startLiveFeed(){
  const el=document.getElementById('liveFeed');
  function add(){
    const [mod,msg]=FEED[feedIdx%FEED.length]; feedIdx++;
    const t=new Date().toTimeString().slice(0,8);
    const isAlert=mod==='ALERT';
    const d=document.createElement('div'); d.className='lf-line';
    d.innerHTML=`<span class="lft">[${t}]</span><span class="lfm${isAlert?' lf-warn':''}">[${mod}] ${msg}</span>`;
    el.appendChild(d);
    while(el.children.length>35)el.removeChild(el.firstChild);
    el.scrollTop=el.scrollHeight;
    if(isAlert)addAlert(msg,'warn');
    setTimeout(add,1600+Math.random()*2200);
  }
  add();
  ['UPLINK ESTABLISHED — CCG BUNKER ONLINE','TRB SECURITY MONITORING ACTIVE','AES-4096 ENCRYPTION CONFIRMED'].forEach(m=>addAlert(m,'ok'));
}
function addAlert(msg,type='warn'){
  const el=document.getElementById('alertList'); if(!el)return;
  const d=document.createElement('div');
  d.className=`al-item al-${type==='warn'?'warn':type==='ok'?'ok':'blue'}`;
  d.textContent=`${type==='warn'?'⚠':type==='ok'?'✓':'◈'} ${msg}`;
  el.prepend(d); while(el.children.length>7)el.removeChild(el.lastChild);
}

/* ────────────── SYSTEM LOGS ────────────── */
function addLog(module,msg){
  const t=new Date().toTimeString().slice(0,8);
  const d=document.createElement('div');
  d.className=`log-entry log-${module.toLowerCase()}`;
  d.dataset.mod=module.toLowerCase();
  d.innerHTML=`<span class="le-t">[${t}]</span><span class="le-mod">[${module}]</span><span class="le-msg">${msg}</span>`;
  const el=document.getElementById('logsOut'); if(el){el.appendChild(d);el.scrollTop=el.scrollHeight;}
  addIntelTimeline(`[${module}] ${msg}`);
}
function addIntelTimeline(msg){
  const el=document.getElementById('intelTL'); if(!el)return;
  const t=new Date().toTimeString().slice(0,8);
  const d=document.createElement('div'); d.className='ist-entry';
  d.textContent=`${t} — ${msg}`;
  el.prepend(d); while(el.children.length>15)el.removeChild(el.lastChild);
}
function clearLogs(){
  const el=document.getElementById('logsOut'); if(el)el.innerHTML='';
  addLog('SYSTEM','Session logs cleared by operator.'); SFX.appSwitch();
}
function filterLogs(mod,btn){
  document.querySelectorAll('.lb-btn').forEach(b=>b.classList.remove('active-lb'));
  btn.classList.add('active-lb');
  document.querySelectorAll('.log-entry').forEach(el=>{
    el.style.display=(mod==='all'||el.dataset.mod===mod)?'':'none';
  });
}

/* ────────────── NOTIFICATIONS ────────────── */
function showNotif(text,type='info'){
  const stack=document.getElementById('notifStack');
  const d=document.createElement('div');
  d.className=`notif notif-${type}`;
  d.textContent=text;
  stack.appendChild(d); SFX.notify();
  setTimeout(()=>{d.classList.add('notif-out');setTimeout(()=>d.remove(),400);},4500);
}

/* ────────────── ACHIEVEMENTS ────────────── */
function initAchGrid(){
  const grid=document.getElementById('achGrid'); if(!grid)return;
  grid.innerHTML='';
  ACH_DEF.forEach(a=>{
    const el=document.createElement('div');
    el.className='ach-tile'; el.id=`ach-${a.id}`;
    el.innerHTML=`<div class="ach-icon">${a.icon}</div><div class="ach-name">${a.name}</div><div class="ach-desc">${a.desc}</div>`;
    grid.appendChild(el);
  });
}
function unlockAchievement(id){
  if(S.achievements.includes(id))return;
  S.achievements.push(id);
  const a=ACH_DEF.find(x=>x.id===id); if(!a)return;
  const tile=document.getElementById(`ach-${id}`); if(tile)tile.classList.add('unlocked');
  const cpAch=document.getElementById('cpAch'); if(cpAch)cpAch.textContent=S.achievements.length;
  showNotif(`🏆 ACHIEVEMENT: ${a.name}`,'reward');
  addLog('CODEX',`Achievement unlocked: ${a.name}`);
}
function checkAchievements(){
  if(S.codesDecoded>=1)unlockAchievement('first_code');
  if(S.codesDecoded>=3)unlockAchievement('three_codes');
  if(S.codesDecoded>=6)unlockAchievement('code_master');
  const loreIds=Object.entries(CODES).filter(([,v])=>v.type==='lore').map(([k])=>k);
  if(loreIds.every(id=>S.discoveries.includes(id)))unlockAchievement('all_lore');
  if(commsRead.size>=COMMS.length)unlockAchievement('all_comms');
}

/* ────────────── CODEX / DISCOVERIES ────────────── */
function addDiscovery(code){
  const el=document.getElementById('discList'); if(!el)return;
  const empty=el.querySelector('.dl-empty'); if(empty)empty.remove();
  const c=CODES[code]; if(!c)return;
  const color=c.type==='reward'?'#ffcc00':c.type==='secret'?'#ff2d9b':'#00d2ff';
  const preview=c.lines.find(l=>l.trim()&&!l.startsWith('╔')&&!l.startsWith('║')&&!l.startsWith('╚')&&l.trim()!=='')?.trim().slice(0,56)||'...';
  const d=document.createElement('div'); d.className='disc-item';
  d.innerHTML=`<div class="di-top"><span class="di-code" style="color:${color}">${code}</span><span class="di-type ${c.type}">${c.type.toUpperCase()}</span></div><div class="di-preview">${preview}...</div>`;
  el.prepend(d);
}

/* ────────────── COMMS ────────────── */
function selectComm(i){
  document.querySelectorAll('.ci').forEach((el,j)=>el.classList.toggle('active-ci',j===i));
  const v=document.getElementById('commViewer');
  if(v){v.innerHTML=COMMS[i].html; SFX.appSwitch();}
  commsRead.add(i); checkAchievements();
  addLog('COMMS',`Opened: ${COMMS[i].from} — ${COMMS[i].subj.slice(0,40)}`);
}

/* ────────────── APP SWITCHING ────────────── */
function openApp(name){
  document.querySelectorAll('.app').forEach(a=>a.classList.remove('active'));
  document.querySelectorAll('.dk-btn').forEach(b=>b.classList.remove('active'));
  const appEl=document.getElementById(`app-${name}`);
  const dkEl=document.getElementById(`dk-${name}`);
  if(appEl)appEl.classList.add('active');
  if(dkEl)dkEl.classList.add('active');
  SFX.appSwitch();
  addLog('UI',`Module: ${name.toUpperCase()}`);
  if(name==='map')setTimeout(startSectorMap,60);
  if(name==='terminal')setTimeout(()=>document.getElementById('termInput')?.focus(),80);
}

/* ────────────── QUICK CHECK ────────────── */
function quickCheck(){
  const inp=document.getElementById('qdInput');
  const res=document.getElementById('qdResult');
  const val=inp.value.trim().toUpperCase(); inp.value='';
  if(!val)return;
  if(CODES[val]){
    res.textContent=`✓ VALID: ${val} — ${CODES[val].type.toUpperCase()} — Use TERMINAL to decrypt.`;
    res.style.color='var(--green)'; SFX.success();
  }else{
    res.textContent=`✗ NOT FOUND: "${val}"`;
    res.style.color='var(--red)'; SFX.error();
  }
  setTimeout(()=>{res.textContent='';},5000);
}

/* ────────────── AUTH ────────────── */
const PW='CRIM4LIFE';
let authTries=0, authLocked=false;

document.getElementById('authInput')?.addEventListener('keydown',e=>{SFX.click();if(e.key==='Enter')checkPassword();});

function checkPassword(){
  if(authLocked)return;
  const inp=document.getElementById('authInput');
  const msg=document.getElementById('authMsg');
  const wrap=document.getElementById('authWrap');
  const loader=document.getElementById('amfLoader');
  const status=document.getElementById('authStatus');
  const val=inp.value.trim().toUpperCase();
  loader.classList.add('active'); inp.disabled=true;
  document.getElementById('authBtn').disabled=true;

  setTimeout(()=>{
    loader.classList.remove('active'); inp.disabled=false;
    document.getElementById('authBtn').disabled=false;
    authTries++;
    document.getElementById('authAttempts').textContent=authTries;

    if(val===PW){
      msg.textContent='▸ ACCESS GRANTED — IDENTITY VERIFIED — WELCOME, OPERATIVE';
      msg.className='amf-msg ok';
      status.textContent='GRANTED'; wrap.classList.add('flash-g');
      SFX.access();
      addLog('AUTH','Successful authentication. Session started.');
      inp.disabled=true; document.getElementById('authBtn').disabled=true;
      setTimeout(bootOS,1700);
    }else{
      SFX.deny(); inp.value=''; status.textContent='DENIED';
      wrap.classList.add('shake','flash-r');
      setTimeout(()=>wrap.classList.remove('shake','flash-r'),500);
      addLog('AUTH',`Failed attempt ${authTries}/5`);
      if(authTries>=5){
        authLocked=true;
        let sec=10;
        msg.textContent=`⚠ LOCKOUT ACTIVE — RETRY IN ${sec}s`; msg.className='amf-msg err';
        const iv=setInterval(()=>{
          sec--;
          msg.textContent=`⚠ LOCKOUT — TRB SECURITY ALERTED — RETRY IN ${sec}s`;
          if(sec<=0){
            clearInterval(iv); authLocked=false; authTries=0;
            document.getElementById('authAttempts').textContent='0';
            msg.textContent=''; msg.className='amf-msg';
            status.textContent='LOCKED'; inp.disabled=false;
            document.getElementById('authBtn').disabled=false;
          }
        },1000);
      }else{
        const r=5-authTries;
        msg.textContent=`⚠ ACCESS DENIED — ${r} ATTEMPT${r!==1?'S':''} REMAINING`;
        msg.className='amf-msg err';
      }
    }
  },1000);
}

function bootOS(){
  document.getElementById('scAuth').classList.remove('active');
  const os=document.getElementById('scOS'); os.classList.add('active');
  S.sessionStart=Date.now(); S.uptimeStart=Date.now();
  startPackets(); startLiveFeed(); startMiniMap(); initAchGrid();
  selectComm(0);
  const colors=['rgba(0,210,255,1)','rgba(123,47,247,1)','rgba(255,107,53,1)','rgba(0,255,136,1)','rgba(255,45,155,1)'];
  const dataKeys=['ops','codes','threat','pkts','bunker'];
  ['spk0','spk1','spk2','spk3','spk4'].forEach((id,i)=>drawSparkline(id,S.gfxData[dataKeys[i]],colors[i]));
  addLog('SYSTEM','OS initialized — all modules operational.');
  addLog('NETWORK','CCG Bunker uplink confirmed — TRB monitoring active.');
  addLog('SECURITY','AES-4096 encryption active — session secured.');
  showNotif('Welcome to CCG Bunker Terminal, operative.','info');
}

/* ────────────── SETTINGS TOGGLES ────────────── */
function toggleFX(key){
  S.fx[key]=!S.fx[key];
  const tog=document.getElementById(`tog-${key}`);
  if(tog){
    tog.classList.toggle('on',S.fx[key]);
    const s=tog.querySelector('span'); if(s)s.textContent=S.fx[key]?'ON':'OFF';
  }
  ({
    scanlines: ()=>{ const e=document.getElementById('elScanlines'); if(e)e.style.opacity=S.fx.scanlines?'1':'0'; },
    flicker:   ()=>{ const e=document.getElementById('elFlicker'); if(e)e.style.animationName=S.fx.flicker?'flkr':'none'; },
    grain:     ()=>{ const e=document.getElementById('elChromatic'); if(e)e.style.display=S.fx.grain?'':'none'; },
    chromatic: ()=>{ const e=document.getElementById('elChromatic'); if(e)e.style.opacity=S.fx.chromatic?'1':'0'; },
    cursor:    ()=>{ cursorGlow.style.opacity=S.fx.cursor?'1':'0'; },
    sound:     ()=>{ SFX.on=S.fx.sound; },
    typing:    ()=>{ SFX.typing=S.fx.typing; },
  })[key]?.();
  SFX.appSwitch();
  addLog('CONFIG',`${key.toUpperCase()} → ${S.fx[key]?'ON':'OFF'}`);
}

function lockSystem(){
  SFX.lock();
  addLog('AUTH','System locked by operator.');
  document.getElementById('scOS').classList.remove('active');
  const auth=document.getElementById('scAuth'); auth.classList.add('active');
  document.getElementById('authInput').value='';
  document.getElementById('authInput').disabled=false;
  document.getElementById('authBtn').disabled=false;
  document.getElementById('authMsg').textContent='';
  document.getElementById('authMsg').className='amf-msg';
  document.getElementById('authStatus').textContent='LOCKED';
  document.getElementById('authAttempts').textContent='0';
  authTries=0; authLocked=false;
  cancelAnimationFrame(sectorRAF); cancelAnimationFrame(miniRAF);
  setTimeout(()=>document.getElementById('authInput')?.focus(),200);
}

/* ────────────── TERMINAL ENGINE ────────────── */
document.getElementById('termInput')?.addEventListener('keydown',e=>{SFX.click();if(e.key==='Enter')submitTerminal();});
function injectCmd(cmd){const i=document.getElementById('termInput');if(i)i.value=cmd;submitTerminal();}
function submitTerminal(){
  const inp=document.getElementById('termInput');
  const val=inp.value.trim().toUpperCase(); inp.value='';
  if(!val)return;
  processCmd(val);
}

const HELP_LINES=[
  '╔══════════════════════════════════════════════════════╗',
  '║    CCG BUNKER TERMINAL — COMMAND REFERENCE v5.1     ║',
  '╚══════════════════════════════════════════════════════╝',
  '  HELP    — Show this reference',
  '  STATUS  — Show system status report',
  '  SCAN    — Run full sector scan',
  '  CLEAR   — Clear terminal output',
  '  HOME    — Return to dashboard',
  '  LORE    — Show event lore summary',
  '  CODES   — Show session decode count',
  '────────────────────────────────────────────────────────',
  '  [FIELD CODE] — Enter any code found in the map.',
  '  Codes unlock: LORE, REWARDS, or SECRETS.',
  '  Type exactly as found. Case insensitive.',
  '────────────────────────────────────────────────────────',
];
const LORE_LINES=[
  '╔══════════════════════════════════════════════════════╗',
  '║    CCG BUNKER EVENT — LORE SUMMARY                  ║',
  '╚══════════════════════════════════════════════════════╝',
  '  You were dropped via helicopter into a forest sector.',
  '  You walked past the airbase and entered the CCG Bunker.',
  '  The bunker expands underground through multiple levels.',
  '  TRB Security Division controls all entry and movement.',
  '  Codes are hidden everywhere — surface to deep levels.',
  '  Below Sublevel 4: something waits in the dark.',
  '  Subject Zero has not been seen in 847 days.',
  '  The archive has a heartbeat. It started with him.',
  '  You are being evaluated. By whom is unclear.',
  '────────────────────────────────────────────────────────',
  '  Find more codes to unlock the full story.',
];

let typeQ=[], isTyping=false;

function processCmd(val){
  const out=document.getElementById('termOutput');
  addLine(out,`OPERATIVE@CCG-BUNKER ▸ ${val}`,'cmd');

  if(val==='CLEAR'){out.innerHTML='';addLine(out,'Terminal cleared.','dim');SFX.appSwitch();return;}
  if(val==='HOME'){openApp('dashboard');addLog('TERMINAL','HOME executed.');return;}
  if(val==='HELP'){queueLines(out,HELP_LINES,'bright',15);addLog('TERMINAL','HELP displayed.');return;}
  if(val==='LORE'){queueLines(out,LORE_LINES,'lore',18);addLog('TERMINAL','LORE displayed.');return;}
  if(val==='CODES'){addLine(out,`Codes decoded this session: ${S.codesDecoded}`,'bright');return;}

  if(val==='SCAN'){
    queueLines(out,[
      '> Initiating full sector scan...',
      '  SURFACE ............... ACTIVE // AIRBASE ONLINE',
      '  HELI DROP ZONE ........ ACTIVE // SECURE',
      '  FOREST NORTH .......... ANOMALY AT GRID 7N4',
      '  FOREST SOUTH .......... CLEAR',
      '  ROAD ACCESS ALPHA ..... ACTIVE',
      '  ROAD ACCESS BETA ...... ACTIVE',
      '  ROAD ACCESS GAMMA ..... ACTIVE',
      '  BUNKER ENTRANCE ....... ACTIVE // TRB CHECKPOINT',
      '  SUBLEVEL 1 ............. ACTIVE // 8 PERSONNEL',
      '  SUBLEVEL 2 ............. ACTIVE // 14 PERSONNEL',
      '  SUBLEVEL 3 ............. THIS TERMINAL — ACTIVE',
      '  SUBLEVEL 4 ............. WEAK SIGNAL // NO RESPONSE',
      '  BELOW SUBLEVEL 4 ...... ——— NO SIGNAL ———',
      '> Scan complete. 1 anomaly flagged. Threat: MODERATE.',
    ],'lore',55);
    addLog('NETWORK','Sector scan executed.'); return;
  }

  if(val==='STATUS'){
    queueLines(out,[
      '╔══════════════════════════════════════════════════════╗',
      '║    SYSTEM STATUS — CCG BUNKER TERMINAL v5.1         ║',
      '╚══════════════════════════════════════════════════════╝',
      `  NODE ............ CCG-BNK-MAIN`,
      `  LOCATION ........ SUBLEVEL 3`,
      `  ENCRYPTION ...... AES-4096 ACTIVE`,
      `  THREAT .......... MODERATE`,
      `  CODES DECODED ... ${S.codesDecoded} this session`,
      `  ERRORS .......... ${S.errors}`,
      `  PACKETS TX ...... ${S.pkt.tx.toLocaleString()}`,
      `  UPTIME .......... ${document.getElementById('osUptime')?.textContent||'--:--:--'}`,
      `  TRB STATUS ...... MONITORING ACTIVE`,
      '────────────────────────────────────────────────────────',
    ],'green',14); return;
  }

  if(CODES[val]){
    const code=CODES[val];
    S.codesDecoded++;
    S.gfxData.codes.push(S.codesDecoded);
    if(S.gfxData.codes.length>20)S.gfxData.codes.shift();
    drawSparkline('spk1',S.gfxData.codes,'rgba(123,47,247,1)');
    const scC=document.getElementById('scCodes'); if(scC)scC.textContent=S.codesDecoded;
    const tsbD=document.getElementById('tsbDec'); if(tsbD)tsbD.textContent=S.codesDecoded;
    const iF=document.getElementById('intelFound'); if(iF)iF.textContent=S.codesDecoded;
    const cpD=document.getElementById('cpDec'); if(cpD)cpD.textContent=S.codesDecoded;
    if(!S.discoveries.includes(val)){S.discoveries.push(val);addDiscovery(val);}
    addLog('DECODE',`Code: ${val} — ${code.type.toUpperCase()}`);
    addAlert(`CODE DECODED: ${val}`,'warn');
    if(code.ach)unlockAchievement(code.ach);
    checkAchievements();
    const notifMsg={lore:`📖 Lore unlocked: ${val}`,reward:`★ REWARD: ${val} — Show to CCG admin!`,secret:`👻 SECRET FOUND: ${val}`};
    showNotif(notifMsg[code.type]||`Code: ${val}`, code.type==='reward'?'reward':'info');
    if(code.type==='reward')SFX.reward();
    else if(code.type==='secret'){SFX.secret();}
    else SFX.success();
    addLine(out,'> Decrypting signal fragment...','dim');
    setTimeout(()=>queueLines(out,code.lines,code.type,19),500);
    return;
  }

  S.errors++;
  const tsbErr=document.getElementById('tsbErr'); if(tsbErr)tsbErr.textContent=S.errors;
  SFX.error();
  addLog('DECODE',`Invalid: "${val}"`);
  queueLines(out,[
    `ERROR: COMMAND NOT FOUND — "${val}"`,
    'Code not recognized in database. Check spelling and retry.',
    'Type HELP for command reference.',
  ],'err',20);
}

function addLine(container,text,cls=''){
  const d=document.createElement('div'); d.className=`tl ${cls}`; d.textContent=text;
  container.appendChild(d); container.scrollTop=container.scrollHeight; return d;
}
function queueLines(container,lines,cls,speed){
  typeQ.push({container,lines,cls,speed}); if(!isTyping)processQueue();
}
function processQueue(){
  if(!typeQ.length){isTyping=false;return;}
  isTyping=true;
  const {container,lines,cls,speed}=typeQ.shift();
  let i=0;
  function next(){
    if(i>=lines.length){processQueue();return;}
    const el=addLine(container,'',cls);
    typeChars(el,lines[i],speed,next); i++;
  }
  next();
}
function typeChars(el,text,speed,cb){
  let i=0;
  const out=document.getElementById('termOutput');
  function step(){
    el.textContent=text.slice(0,i);
    if(i>0&&i<text.length&&S.fx.typing&&i%4===0)SFX.click();
    if(out)out.scrollTop=out.scrollHeight;
    i++;
    if(i>text.length){if(cb)cb();}
    else setTimeout(step,speed+(Math.random()*speed*.25));
  }
  step();
}

/* ────────────── BOOT SEQUENCE ────────────── */
const BOOT_LOG=[
  {text:'Initializing CCG BIOS v3.1.4-SEC...',        type:'info',d:160},
  {text:'POST diagnostic: CPU OK — RAM 65536MB OK',    type:'ok',  d:240},
  {text:'Loading CCG Bunker OS kernel v5.1...',        type:'info',d:320},
  {text:'Kernel modules: 47/47 loaded',                type:'ok',  d:200},
  {text:'Mounting encrypted filesystem [AES-4096]...', type:'info',d:300},
  {text:'Filesystem: /bunker/main SECURED',            type:'ok',  d:180},
  {text:'TRB Security module: initializing...',        type:'info',d:280},
  {text:'TRB Security: ARMED AND ACTIVE',              type:'ok',  d:160},
  {text:'Initializing network stack...',               type:'info',d:260},
  {text:'CCG Bunker uplink: ESTABLISHED — 12ms',      type:'ok',  d:200},
  {text:'WARNING: Sublevel 4 signal degraded',         type:'warn',d:280},
  {text:'WARNING: Anomalous reading — grid 7N4',       type:'warn',d:260},
  {text:'Loading decode engine v5.1...',               type:'info',d:320},
  {text:'Decode engine: READY — 11 codes in database', type:'ok',  d:150},
  {text:'Establishing encrypted HQ comms...',          type:'info',d:340},
  {text:'CCG-HQ comms: SECURED // AES-4096',          type:'ok',  d:180},
  {text:'Intrusion detection: ACTIVE — TRB ONLINE',   type:'ok',  d:150},
  {text:'All systems operational. Initiating auth.',   type:'ok',  d:200},
];

function runBoot(){
  SFX.boot();
  const log=document.getElementById('bootLog');
  const timerEl=document.getElementById('bootTimer');
  const statusEl=document.getElementById('bootStatus');
  let idx=0, elapsed=0;
  function setBar(barId,pctId,val){
    const b=document.getElementById(barId); const p=document.getElementById(pctId);
    if(b)b.style.width=val+'%'; if(p)p.textContent=val+'%';
  }
  function tick(){
    if(idx>=BOOT_LOG.length){
      ['bb0','bb1','bb2','bb3'].forEach((b,i)=>setBar(b,'bp'+i,100));
      if(statusEl)statusEl.innerHTML='BOOT COMPLETE — AUTHENTICATION REQUIRED';
      setTimeout(showAuth,800); return;
    }
    const entry=BOOT_LOG[idx]; elapsed+=entry.d;
    const prog=Math.round((idx/BOOT_LOG.length)*95);
    setBar('bb0','bp0',Math.min(100,Math.round(idx/4*100)));
    setBar('bb1','bp1',Math.min(100,Math.round(Math.max(0,idx-4)/4*100)));
    setBar('bb2','bp2',Math.min(100,Math.round(Math.max(0,idx-9)/5*100)));
    setBar('bb3','bp3',Math.min(100,Math.round(Math.max(0,idx-11)/6*100)));
    if(timerEl)timerEl.textContent=`T+${(elapsed/1000).toFixed(3)}s`;
    const verbs=['INITIALIZING','LOADING','MOUNTING','ESTABLISHING','VERIFYING','SECURING','ACTIVATING'];
    if(statusEl)statusEl.innerHTML=`${verbs[idx%verbs.length]}<span class="bdots"></span>`;
    const d=document.createElement('div'); d.className=`bl ${entry.type}`; d.textContent=entry.text;
    log.appendChild(d); log.scrollTop=log.scrollHeight;
    idx++;
    setTimeout(tick,entry.d);
  }
  setTimeout(tick,600);
}

function showAuth(){
  document.getElementById('scBoot').classList.remove('active');
  document.getElementById('scAuth').classList.add('active');
  runBioCanvas(); runWaveCanvas(); runAuthBg();
  setTimeout(()=>document.getElementById('authInput')?.focus(),300);
}

/* ────────────── INIT ────────────── */
window.addEventListener('load',()=>{
  setTimeout(runBoot,500);
  selectComm(0);
});
