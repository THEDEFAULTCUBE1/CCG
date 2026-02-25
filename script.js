'use strict';
/* ═══════════════════════════════════════════════════════
   CCG BUNKER OS  —  script.js
   All logic: boot, privacy, profiles, login, desktop,
   windows, globe (fixed CCG dot), terminal, comms,
   intel, codex, achievements, effects
═══════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────
   AUDIO
───────────────────────────────────────── */
let _ac = null;
const AC = () => { if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)(); return _ac; };
const SFX = {
  on: true, typing: true,
  _t(f, type='sine', dur=0.1, vol=0.12, delay=0) {
    if (!this.on) return;
    try {
      const ac = AC(), o = ac.createOscillator(), g = ac.createGain();
      const t = ac.currentTime + delay;
      o.connect(g); g.connect(ac.destination);
      o.type = type; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.02);
    } catch(e) {}
  },
  click()   { if (!this.typing) return; this._t(500+Math.random()*600,'square',0.02,0.035); },
  open()    { this._t(880,'sine',0.07,0.1); this._t(1100,'sine',0.07,0.08,0.05); },
  close()   { this._t(550,'sine',0.07,0.1); this._t(440,'sine',0.06,0.07,0.05); },
  ok()      { [440,550,660].forEach((f,i)=>this._t(f,'triangle',0.1,0.13,i*0.055)); },
  err()     { this._t(220,'sawtooth',0.1,0.28); this._t(180,'sawtooth',0.1,0.25,0.09); },
  reward()  { [330,440,524,659,784].forEach((f,i)=>this._t(f,'triangle',0.14,0.18,i*0.05)); },
  secret()  { this._t(220,'sine',0.5,0.09); this._t(330,'sine',0.5,0.07,0.18); },
  deny()    { this._t(280,'sawtooth',0.13,0.35); this._t(200,'sawtooth',0.14,0.3,0.13); },
  start()   { this._t(660,'triangle',0.12,0.15); this._t(880,'triangle',0.1,0.12,0.08); },
  lock()    { this._t(330,'sawtooth',0.1,0.3); this._t(220,'sawtooth',0.12,0.28,0.1); },
  balloon() { this._t(900,'sine',0.05,0.1); this._t(1100,'sine',0.05,0.08,0.06); },
};

function playStartup() {
  const a = new Audio('startup.mp3');
  a.volume = 0.8; a.play().catch(()=>{});
}

/* ─────────────────────────────────────────
   STATE
───────────────────────────────────────── */
const STATE = {
  codesDecoded: 0, discoveries: [], achievements: [],
  commsRead: new Set(), docsRead: new Set(),
  cfg: { scanlines: false, sound: true, typing: true },
};

/* ─────────────────────────────────────────
   CODES  — fill these in before the event
   Format: CODENAME: { type:'lore'|'reward'|'secret', lines:['...'] }
───────────────────────────────────────── */
const CODES = {
  // TEST: { type:'lore', lines:['Line 1.','Line 2.'] },
};

/* ─────────────────────────────────────────
   ACHIEVEMENTS
───────────────────────────────────────── */
const ACHS = [
  { id:'first',     name:'First Contact',   ico:'&#x1F513;', desc:'Decode your first code.' },
  { id:'three',     name:'Field Agent',     ico:'&#x1F575;', desc:'Decode 3 codes.' },
  { id:'six',       name:'Code Master',     ico:'&#x2B50;',  desc:'Decode 6 codes.' },
  { id:'reward',    name:'Reward Found',    ico:'&#x1F3C6;', desc:'Find a reward code.' },
  { id:'secret',    name:'Ghost Signal',    ico:'&#x1F47B;', desc:'Find a secret code.' },
  { id:'comms',     name:'Intercepted',     ico:'&#x1F4E1;', desc:'Read all 5 comms.' },
  { id:'map',       name:'Navigator',       ico:'&#x1F30D;', desc:'Open the Sector Map.' },
  { id:'archivist', name:'Archivist',       ico:'&#x1F4DA;', desc:'Read all intel files.' },
];

/* ─────────────────────────────────────────
   INTEL DOCUMENTS
───────────────────────────────────────── */
const DOCS = {
  mission:{
    file:'overview.txt', badge:'Alpha Clearance', title:'Mission Overview',
    body:`<b>THE SITUATION</b><br><br>
You have been inserted via helicopter into a forest sector and reached the CCG Bunker &mdash; a classified underground facility operated by CCG Productions and secured by the TRB Security Division. You are now at Sublevel 3, connected to the primary Decode Terminal.<br><br>
<b>YOUR OBJECTIVE</b><br><br>
Field codes are hidden throughout the operational area. Find them. Enter them into the Decode Terminal on this desktop. Each code unlocks classified intel, a reward, or a secret.<br><br>
<b>HOW IT WORKS</b><br><br>
1. Explore the map &mdash; codes are hidden everywhere.<br>
2. Type each code into the Decode Terminal and press Enter.<br>
3. Reward codes must be shown to a CCG admin to claim your prize.<br>
4. Track everything in the Codex.`
  },
  sectors:{
    file:'sectors.txt', badge:'Structural Data', title:'Bunker Sectors',
    body:`<b>SECTOR 00 &mdash; THE ENTRANCE</b><br>
The surface-level entry point. TRB Security checkpoint and biometric scan. Every operative is cleared here before going underground.<br><br>
<b>SECTOR 01 &mdash; MAIN OPERATIONS</b><br>
The primary event floor. Games, activities, the Coin Exchange, and the achievement display. Most operatives will spend their time here.<br><br>
<b>SECTOR 02 &mdash; SECURITY AND SPECIAL EVENTS</b><br>
Heavily restricted. Wall-mounted turrets and armed TRB guards. Special events including the Blackout Protocol launch from here. Entry requires TRB authorization.<br><br>
<b>BELOW SECTOR 02</b><br>
<span class="redact">CLEARANCE LEVEL OMEGA REQUIRED &mdash; ACCESS DENIED</span><br><br>
<div class="iv-warn">&#9888; Attempting unauthorized access will result in immediate removal by TRB Security.</div>`
  },
  trb:{
    file:'trb_brief.txt', badge:'Personnel File', title:'TRB Security Division',
    body:`<b>OVERVIEW</b><br><br>
TRB is a Private Military Company (PMC) clan in <b>Criminality</b> on Roblox. For this event, TRB is the exclusive security contractor for CCG Productions with full authority over the facility.<br><br>
<b>RESPONSIBILITIES</b><br><br>
&mdash; Full security coverage across Sectors 00, 01, and 02<br>
&mdash; Checkpoint and biometric operations at Sector 00<br>
&mdash; Wall turret operation and armed response in Sector 02<br>
&mdash; Blackout Protocol activation and Subject 0 containment<br>
&mdash; Monitoring and logging of all terminal sessions<br><br>
<div class="iv-warn">&#9888; TRB authority is absolute. Non-compliance results in removal from the event.</div>`
  },
  subject0:{
    file:'subject0.txt', badge:'Classification: Restricted', title:'Subject 0 &mdash; Incident File',
    body:`<b>WHO IS SUBJECT 0</b><br><br>
Subject 0 is a white, featureless humanoid entity from the Roblox horror experience <b>party.exe</b>. His signature phrase:<br><br>
<span style="color:#c00;font-style:italic;font-size:13px;">"I will taste your lungs."</span><br><br>
<b>THE BLACKOUT EVENT</b><br><br>
During a classified incident, generators in Sector 02 failed. Subject 0 broke free from containment and entered the main event floors. TRB response was immediate. Power restored after 4 minutes, 17 seconds. Officially: recontained.<br><br>
<b>CURRENT STATUS</b><br><br>
Listed as <b>recontained</b>. Cell location: <span class="redact">CLASSIFIED</span>.<br><br>
<div class="iv-warn">&#9888; If a blackout occurs during the event, stop moving. Do not use flashlights. Follow TRB instructions. Do not look for Subject 0.</div>`
  },
  event:{
    file:'event_rules.txt', badge:'Read Before Entry', title:'Event Rules and Info',
    body:`<b>WELCOME TO THE CCG BUNKER EVENT</b><br><br>
A live interactive experience inside <b>Criminality</b> on Roblox, hosted by CCG Productions.<br><br>
<b>CURRENCY</b><br><br>
&mdash; Play games and complete activities to earn coins.<br>
&mdash; Spend coins at the Coin Exchange in Sector 01.<br><br>
<b>FIELD CODES</b><br><br>
&mdash; Codes are hidden throughout the entire area.<br>
&mdash; Enter each code in the Decode Terminal on this desktop.<br>
&mdash; Reward codes must be shown to a CCG admin to claim prizes.<br>
&mdash; Codes are single-use per operative. No sharing reward screens.<br><br>
<b>RULES</b><br><br>
1. Follow all TRB Security instructions at all times.<br>
2. Do not grief or disrupt other operatives.<br>
3. Do not access restricted sectors without clearance.<br>
4. Have fun.`
  },
  classified:{
    file:'[RESTRICTED]', badge:'Omega Clearance Only', title:'CLASSIFIED',
    body:`<div class="iv-class-hdr">&#9888; OMEGA CLEARANCE REQUIRED &#9888;</div>
<div class="iv-classified">
THE REAL PURPOSE OF CCG BUNKER IS NOT INTELLIGENCE STORAGE<br>
THE ENTITY DESIGNATED SUBJECT 0 HAS A SECOND FILE NOT IN THIS SYSTEM<br>
SECTOR 03 APPEARS ON NO OFFICIAL FLOOR PLAN AND YET IT EXISTS<br>
THE BLACKOUT WAS NOT CAUSED BY A POWER FAILURE<br>
TRB STANDING ORDERS PREDATE THE EVENT BY MORE THAN TWO YEARS<br>
SOMETHING ANSWERED THE LAST TERMINAL SIGNAL SENT TO SUBLEVEL 4<br>
SUBJECT 0 DID NOT WALK BACK TO HIS CELL AFTER THE BLACKOUT<br>
THE ARCHIVE BELOW HAS BEEN RUNNING FOR 847 DAYS<br>
YOU HAVE BEEN OBSERVED SINCE YOU ARRIVED AT SECTOR 00
</div>`
  }
};

/* ─────────────────────────────────────────
   COMMS
───────────────────────────────────────── */
const COMMS = [
  { from:'CCG-HQ', subj:'Deployment Order', time:'07:04:11',
    html:`<div class="cv-from">FROM: CCG Operations Headquarters</div>
<div class="cv-subj">Operative Deployment Order</div>
<div class="cv-meta">To: Field Operative &nbsp;|&nbsp; Classification: Alpha</div>
<div class="cv-body">Operative,<br><br>
You have cleared Sector 00 and are connected to the Decode Terminal at Sublevel 3.<br><br>
Your mission: locate all field codes hidden throughout the CCG Bunker area and enter them into this terminal. Reward codes must be shown to a CCG administrator before leaving.<br><br>
TRB Security has full authority on-site. Follow their instructions at all times.<br><br>
Good luck.<br>&mdash; <b>CCG Operations</b></div>` },
  { from:'TRB-COMMAND', subj:'Security Briefing', time:'06:22:47',
    html:`<div class="cv-from" style="color:#1e5cbf">FROM: TRB Security Command</div>
<div class="cv-subj">Pre-Mission Security Briefing</div>
<div class="cv-meta">To: All Operatives &nbsp;|&nbsp; Priority: High</div>
<div class="cv-body"><b>Briefing:</b><br><br>
TRB Security Division is fully deployed across all sectors.<br><br>
&mdash; <b>Sector 02</b> requires TRB authorization. Do not approach turret zones unescorted.<br>
&mdash; <b>Blackout Protocol:</b> If lights go out, stop immediately. No flashlights. Wait for TRB response.<br>
&mdash; All terminal sessions are logged by TRB intelligence.<br>
&mdash; If you see something you cannot explain, report to the nearest TRB post.<br><br>
We are watching all areas at all times.<br>&mdash; <b>TRB Security Command</b></div>` },
  { from:'UNKNOWN SOURCE', subj:'&#9888; Urgent &mdash; read this now', time:'??:??:??',
    html:`<div class="cv-from" style="color:#b05a00">FROM: [UNVERIFIED &mdash; TRACE FAILED 14 ATTEMPTS]</div>
<div class="cv-subj">&#9888; You need to read this right now</div>
<div class="cv-meta" style="color:#c00">Source unknown &nbsp;|&nbsp; Encryption: unrecognized cipher</div>
<div class="cv-body">I was inside during the Blackout. Sector 01, lights out.<br><br>
I saw Subject 0. Up close. Maybe two meters. He was scanning each person one by one.<br><br>
He stopped when he reached me and said something.<br><br>
<span class="cred">"I know where your lungs are."</span><br><br>
Then the power came back and he was gone. TRB said he went back to his cell. I don't believe that.<br><br>
Watch the power indicators. If anything flickers &mdash; leave immediately.<br>
I can't send more. They monitor outgoing.<br>
&mdash; <span class="cdim">redacted</span></div>` },
  { from:'CCG-ARCHIVE', subj:'Blackout &mdash; Report #03', time:'LOGGED',
    html:`<div class="cv-from" style="color:#8a0000">FROM: CCG Archive System [Auto-generated]</div>
<div class="cv-subj">Blackout Incident &mdash; Report #03 of 12</div>
<div class="cv-meta">Type: Containment / Power Incident &nbsp;|&nbsp; Status: Closed</div>
<div class="cv-body">
<b>Duration:</b> 4 minutes, 17 seconds<br><br>
02:14 &mdash; Power draw in Sector 02 spikes to 340%. All lights offline.<br>
02:14 &mdash; Containment cell <span class="cdim">REDACTED</span> registers open. Cause: unknown.<br>
02:15 &mdash; Subject 0 detected on Sector 01. TRB response deployed.<br>
02:16 &mdash; NE corridor cameras: <b style="color:#c00">12-minute footage gap.</b><br>
02:17 &mdash; Audio: voice recorded &mdash; <em style="color:#7a10a0">"I can see all of them now."</em><br>
02:18 &mdash; Power restored. Subject 0 no longer visible on any camera.<br>
02:18 &mdash; Recontainment confirmed by <span class="cdim">REDACTED</span>.<br><br>
<b>Archive Note:</b> <span class="cdim">camera footage shows Subject 0 did not walk back to his cell</span></div>` },
  { from:'??? ENCRYPTED', subj:'find me', time:'RED-ZONE',
    html:`<div class="cv-from" style="color:#7a1090">FROM: ??? [Cipher: unknown &mdash; 47 decode attempts failed]</div>
<div class="cv-subj" style="color:#7a1090">find me</div>
<div class="cv-meta" style="color:#bbb">Origin: unresolvable &nbsp;|&nbsp; Timestamp: anomalous</div>
<div class="cv-body" style="color:#444;line-height:2.7">
you found the terminal.<br>good.<br><br>
i built the first version of it.<br>
before CCG replaced my code.<br>
before TRB locked the menus below this level.<br><br>
there is something below Sector 02 not on any floor plan.<br>
no door. no frame. a gap in the wall that wasn't there before.<br>
it opens when it decides you are ready.<br><br>
i went through once. i came back.<br>
the clock said three minutes had passed.<br>
i am still not sure i came back whole.<br><br>
<span style="color:#7a1090;font-size:13px">find me.</span><br>
&mdash; s.z.</div>` },
];

/* ═══════════════════════════════════════════════════════
   BACKGROUND CANVAS EFFECTS
   Used on privacy / boot / profile / login screens
═══════════════════════════════════════════════════════ */
function bgParticles(canvasId, opts={}) {
  const c = document.getElementById(canvasId);
  if (!c) return null;
  const ctx = c.getContext('2d');
  let alive = true;
  const color = opts.color || 'rgba(60,120,255,';
  function resize() { c.width = window.innerWidth; c.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  const pts = Array.from({length: opts.count||60}, ()=>({
    x: Math.random()*window.innerWidth,
    y: Math.random()*window.innerHeight,
    vx:(Math.random()-.5)*(opts.speed||0.3),
    vy:(Math.random()-.5)*(opts.speed||0.3),
    r: Math.random()*(opts.maxR||1.5)+.4,
  }));
  let t=0;
  function draw() {
    if (!alive) return;
    requestAnimationFrame(draw);
    t++;
    ctx.clearRect(0,0,c.width,c.height);
    pts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0) p.x=c.width; if(p.x>c.width) p.x=0;
      if(p.y<0) p.y=c.height; if(p.y>c.height) p.y=0;
      const a = .04+.03*Math.sin(t*.012+p.x*.005);
      ctx.fillStyle = color+a+')';
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    });
    // draw faint connection lines
    if (opts.lines) {
      ctx.strokeStyle = color+'0.04)';
      ctx.lineWidth = 1;
      pts.forEach((a,i)=>{
        for(let j=i+1;j<pts.length;j++){
          const b=pts[j],d=Math.hypot(a.x-b.x,a.y-b.y);
          if(d<140){ ctx.globalAlpha=(1-d/140)*.06; ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke(); }
        }
      });
      ctx.globalAlpha=1;
    }
  }
  draw();
  return ()=>{ alive=false; };
}

/* Desktop ambient particles + scanline vignette */
function startDeskFx() {
  const c = document.getElementById('deskFx');
  if (!c) return;
  const ctx = c.getContext('2d');
  function resize(){ c.width=window.innerWidth; c.height=window.innerHeight; }
  resize(); window.addEventListener('resize',resize);
  const pts = Array.from({length:40},()=>({
    x:Math.random()*window.innerWidth, y:Math.random()*window.innerHeight,
    vx:(Math.random()-.5)*.05, vy:(Math.random()-.5)*.05,
    r:Math.random()*1.2+.3, phase:Math.random()*Math.PI*2
  }));
  let t=0;
  function draw(){
    requestAnimationFrame(draw); t++;
    ctx.clearRect(0,0,c.width,c.height);
    // Subtle vignette
    const vig=ctx.createRadialGradient(c.width/2,c.height/2,c.height*.3,c.width/2,c.height/2,c.height*.9);
    vig.addColorStop(0,'rgba(0,0,0,0)'); vig.addColorStop(1,'rgba(0,0,0,0.28)');
    ctx.fillStyle=vig; ctx.fillRect(0,0,c.width,c.height);
    // Floating particles
    pts.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=c.width; if(p.x>c.width)p.x=0;
      if(p.y<0)p.y=c.height; if(p.y>c.height)p.y=0;
      const a=.03+.025*Math.sin(t*.01+p.phase);
      ctx.fillStyle=`rgba(200,220,255,${a})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    });
  }
  draw();

  // Add clock widget to desktop
  const cw=document.createElement('div');
  cw.id='deskClock';
  cw.style.cssText='position:absolute;bottom:38px;right:10px;z-index:9;pointer-events:none;text-align:right;';
  document.getElementById('scDesktop').appendChild(cw);
  function updateDeskClock(){
    const d=new Date();
    const h=String(d.getHours()).padStart(2,'0'), m=String(d.getMinutes()).padStart(2,'0'), s=String(d.getSeconds()).padStart(2,'0');
    const days=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    cw.innerHTML=`<div style="font-family:'Lucida Console',monospace;font-size:9px;color:rgba(255,255,255,0.25);letter-spacing:1px;text-shadow:1px 1px 3px rgba(0,0,0,0.8)">${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}</div>`;
  }
  setInterval(updateDeskClock,1000); updateDeskClock();
}

/* ═══════════════════════════════════════════════════════
   OS CONTROLLER
═══════════════════════════════════════════════════════ */
const OS = {
  loginTries: 0, loginLocked: false,
  PW: 'CRIM4LIFE',
  _privStop: null, _profStop: null,

  acceptPrivacy() {
    if (this._privStop) this._privStop();
    document.getElementById('scPrivacy').style.display='none';
    this._startBoot();
  },

  _startBoot() {
    const el = document.getElementById('scBoot');
    el.style.display='flex';

    // Matrix rain background on boot canvas
    const bc = document.getElementById('bootBg');
    if(bc){
      bc.width=window.innerWidth; bc.height=window.innerHeight;
      const bctx=bc.getContext('2d');
      const cols=Math.floor(window.innerWidth/14);
      const drops=Array.from({length:cols},()=>Math.random()*-100);
      const chars='01アイウエオカキクケコTRBCCGBNK!@#$%&*';
      function rainDraw(){
        bctx.fillStyle='rgba(0,0,0,0.07)'; bctx.fillRect(0,0,bc.width,bc.height);
        bctx.font='12px Lucida Console,monospace';
        drops.forEach((y,i)=>{
          const ch=chars[Math.floor(Math.random()*chars.length)];
          const bright=Math.random()>.95;
          bctx.fillStyle=bright?'rgba(150,210,255,0.9)':`rgba(20,80,200,${0.15+Math.random()*.25})`;
          bctx.fillText(ch, i*14, y*14);
          if(y*14>bc.height && Math.random()>.96) drops[i]=0;
          drops[i]+=.5+Math.random()*.3;
        });
        if(el.style.display!=='none') requestAnimationFrame(rainDraw);
      }
      rainDraw();
    }

    // Glitch effect on logo
    let glitchIv = setInterval(()=>{
      const logo=document.getElementById('bootLogo');
      if(!logo){ clearInterval(glitchIv); return; }
      if(Math.random()<.3){
        logo.style.textShadow=`${(Math.random()-.5)*8}px 0 rgba(255,0,80,.7), ${(Math.random()-.5)*8}px 0 rgba(0,200,255,.7), 0 0 40px rgba(80,160,255,0.9)`;
        logo.style.transform=`skewX(${(Math.random()-.5)*6}deg)`;
        setTimeout(()=>{
          logo.style.textShadow='0 0 30px rgba(80,160,255,0.8),0 0 80px rgba(80,160,255,0.4)';
          logo.style.transform='';
        }, 80+Math.random()*120);
      }
    }, 400);

    // build block segments
    const container = document.getElementById('bootBlocks');
    const TOTAL = 24;
    for(let i=0;i<TOTAL;i++){
      const b=document.createElement('div'); b.className='boot-block'; container.appendChild(b);
    }
    const blocks = container.querySelectorAll('.boot-block');
    const msgs = [
      'INITIALIZING CCG BIOS v3.1.4...',
      'POST DIAGNOSTIC: OK',
      'LOADING OS KERNEL...',
      'MOUNTING ENCRYPTED FILESYSTEM...',
      'STARTING TRB SECURITY MODULE...',
      'ESTABLISHING NETWORK UPLINK...',
      'LOADING DECODE ENGINE...',
      'VERIFYING OPERATIVE CREDENTIALS...',
      'ALL SYSTEMS READY.',
    ];
    let step=0;
    const msgEl = document.getElementById('bootMsg');
    function advance(){
      if(step>=msgs.length){
        clearInterval(glitchIv);
        blocks.forEach(b=>b.classList.add('lit'));
        setTimeout(()=>{
          el.style.display='none';
          this._showProfiles();
        },600);
        return;
      }
      msgEl.textContent = msgs[step];
      const lit = Math.ceil((step+1)/msgs.length * TOTAL);
      for(let i=0;i<lit;i++) blocks[i].classList.add('lit');
      step++;
      setTimeout(()=>advance.call(this), 300+Math.random()*200);
    }
    setTimeout(()=>advance.call(this), 500);
  },

  _showProfiles() {
    const el = document.getElementById('scProfile');
    el.style.display='flex';
    this._profStop = bgParticles('profBg',{count:55,speed:.2,color:'rgba(40,100,220,',lines:true});
  },

  pickProfile(type, el) {
    if(el.classList.contains('locked')){
      // shake animation
      el.style.animation='shake .4s ease';
      setTimeout(()=>el.style.animation='',500);
      return;
    }
    SFX.open();
    if(this._profStop) this._profStop();
    document.getElementById('scProfile').style.display='none';
    this._showLogin();
  },

  backToProfiles() {
    document.getElementById('scLogin').style.display='none';
    this._showProfiles();
  },

  shutdownFromMenu() {
    Start.close();
    this.shutdownScreen();
  },

  shutdownScreen() {
    document.getElementById('scProfile').style.display='none';
    // show black screen with text
    document.body.style.background='#000';
    setTimeout(()=>{
      document.body.innerHTML='<div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000"><div style="color:#fff;font-family:Tahoma,sans-serif;font-size:13px;text-align:center;opacity:.4">It is now safe to close this window.</div></div>';
    }, 800);
  },

  _showLogin() {
    const el = document.getElementById('scLogin');
    el.style.display='flex';
    bgParticles('loginBg',{count:30,speed:.15,color:'rgba(30,80,200,',lines:false});
    setTimeout(()=>document.getElementById('loginInput')?.focus(), 200);
  },

  doLogin() {
    if (this.loginLocked) return;
    const inp = document.getElementById('loginInput');
    const msg = document.getElementById('loginMsg');
    const val = inp.value.trim().toUpperCase();
    if (val === this.PW) {
      msg.style.color='#aaffaa'; msg.textContent='Access granted...';
      inp.disabled=true; document.querySelector('.lc-btn').disabled=true;
      setTimeout(()=>this._enterDesktop(), 900);
    } else {
      this.loginTries++;
      SFX.deny(); inp.value='';
      if (this.loginTries>=5){
        this.loginLocked=true;
        let s=15;
        const iv=setInterval(()=>{
          s--; msg.textContent=`Locked. Retry in ${s}s`;
          if(s<=0){ clearInterval(iv); this.loginLocked=false; this.loginTries=0;
            msg.textContent=''; inp.disabled=false; document.querySelector('.lc-btn').disabled=false; }
        },1000);
      } else {
        msg.textContent=`Access denied. ${5-this.loginTries} attempt(s) remaining.`;
      }
    }
  },

  _enterDesktop() {
    document.getElementById('scLogin').style.display='none';
    document.getElementById('scDesktop').style.display='block';
    playStartup();
    startDeskFx();
    setTimeout(()=>{
      WM.open('terminal');
      Balloon.show('Welcome, Operative','CCG Bunker Terminal is ready. Double-click icons to open apps.');
    }, 700);
  },

  lock() {
    SFX.lock();
    Globe.stop();
    document.querySelectorAll('.xwin').forEach(w=>w.classList.remove('show'));
    document.getElementById('tbApps').innerHTML='';
    document.getElementById('scDesktop').style.display='none';
    this.loginTries=0; this.loginLocked=false;
    const inp=document.getElementById('loginInput');
    const btn=document.querySelector('.lc-btn');
    if(inp){ inp.value=''; inp.disabled=false; }
    if(btn) btn.disabled=false;
    document.getElementById('loginMsg').textContent='';
    this._showLogin();
  }
};

/* ═══════════════════════════════════════════════════════
   WINDOW MANAGER
═══════════════════════════════════════════════════════ */
const WM = {
  zTop:100, maxed:{}, _drag:null, _rsz:null,

  open(id){
    const w=document.getElementById('win-'+id);
    if(!w) return;
    if(w.classList.contains('show')){ this.focus(id); return; }
    SFX.open(); w.classList.add('show'); w.style.visibility='';
    this.focus(id); this._addTb(id);
    // Flash taskbar button briefly
    setTimeout(()=>{
      const tb=document.getElementById('tb-'+id);
      if(tb){ tb.classList.add('new-pulse'); setTimeout(()=>tb.classList.remove('new-pulse'),500); }
    },50);
    if(id==='map')     { Globe.init(); Achs.unlock('map'); }
    if(id==='intel')   { Intel.show('mission', document.querySelector('.it-item.active')); }
    if(id==='comms')   { Comms.select(0, document.querySelector('.cl-item')); }
    if(id==='codex')   { Achs.buildGrid(); }
    if(id==='terminal'){ setTimeout(()=>document.getElementById('termIn')?.focus(), 80); }
  },
  close(id){
    const w=document.getElementById('win-'+id); if(!w) return;
    SFX.close(); w.classList.remove('show');
    document.getElementById('tb-'+id)?.remove();
    if(id==='map') Globe.stop();
  },
  minimize(id){
    const w=document.getElementById('win-'+id); if(!w) return;
    const hidden=w.style.visibility==='hidden';
    w.style.visibility=hidden?'':'hidden';
    const tb=document.getElementById('tb-'+id);
    if(tb) tb.classList.toggle('active',!hidden);
    (hidden?SFX.open():SFX.close()).bind(SFX)();
  },
  maximize(id){
    const w=document.getElementById('win-'+id); if(!w) return;
    if(this.maxed[id]){
      const m=this.maxed[id];
      w.style.left=m.l; w.style.top=m.t; w.style.width=m.w; w.style.height=m.h;
      this.maxed[id]=null;
    } else {
      this.maxed[id]={l:w.style.left,t:w.style.top,w:w.style.width,h:w.style.height};
      w.style.left='0'; w.style.top='0';
      w.style.width=window.innerWidth+'px'; w.style.height=(window.innerHeight-30)+'px';
    }
    this.focus(id); if(id==='map') setTimeout(()=>Globe.resize(),50);
  },
  focus(id){
    document.querySelectorAll('.xwin').forEach(w=>w.classList.remove('focused'));
    document.querySelectorAll('.tb-btn').forEach(b=>b.classList.remove('active'));
    const w=document.getElementById('win-'+id);
    if(w){ w.style.zIndex=++this.zTop; w.classList.add('focused'); }
    document.getElementById('tb-'+id)?.classList.add('active');
  },
  arrange(){
    const ids=['terminal','map','intel','comms','codex'];
    const open=ids.filter(id=>{
      const w=document.getElementById('win-'+id);
      return w&&w.classList.contains('show')&&w.style.visibility!=='hidden';
    });
    if(!open.length) return;
    const cols=Math.ceil(Math.sqrt(open.length)), rows=Math.ceil(open.length/cols);
    const W=window.innerWidth, H=window.innerHeight-30;
    open.forEach((id,i)=>{
      const w=document.getElementById('win-'+id);
      w.style.left=(i%cols*(W/cols))+'px'; w.style.top=(Math.floor(i/cols)*(H/rows))+'px';
      w.style.width=(W/cols-3)+'px'; w.style.height=(H/rows-3)+'px';
    });
  },
  drag(e,id){
    if(e.target.closest('.xwin-btns')) return;
    const w=document.getElementById(id); this.focus(id.replace('win-',''));
    const r=w.getBoundingClientRect();
    this._drag={w,ox:e.clientX-r.left,oy:e.clientY-r.top};
    e.preventDefault();
  },
  resize(e,id){
    const w=document.getElementById(id);
    this._rsz={w,sx:e.clientX,sy:e.clientY,sw:w.offsetWidth,sh:w.offsetHeight};
    e.preventDefault(); e.stopPropagation();
  },
  _addTb(id){
    if(document.getElementById('tb-'+id)) return;
    const labels={terminal:'&#128187; Terminal',map:'&#127757; Map',intel:'&#128193; Intel',
      comms:'&#128225; Comms',codex:'&#127942; Codex',notepad:'&#128221; Notes',settings:'&#9881; Panel'};
    const btn=document.createElement('div');
    btn.className='tb-btn active'; btn.id='tb-'+id;
    btn.innerHTML=labels[id]||id;
    btn.onclick=()=>{
      const w=document.getElementById('win-'+id);
      if(w?.style.visibility==='hidden') this.minimize(id); else this.focus(id);
    };
    document.getElementById('tbApps').appendChild(btn);
  }
};

document.addEventListener('mousemove',e=>{
  if(WM._drag){
    const{w,ox,oy}=WM._drag;
    let x=Math.max(0,Math.min(window.innerWidth-w.offsetWidth,e.clientX-ox));
    let y=Math.max(0,Math.min(window.innerHeight-60,e.clientY-oy));
    w.style.left=x+'px'; w.style.top=y+'px';
  }
  if(WM._rsz){
    const{w,sx,sy,sw,sh}=WM._rsz;
    w.style.width=Math.max(320,sw+e.clientX-sx)+'px';
    w.style.height=Math.max(200,sh+e.clientY-sy)+'px';
    if(w.id==='win-map') Globe.resize();
  }
});
document.addEventListener('mouseup',()=>{ WM._drag=null; WM._rsz=null; });
document.querySelectorAll('.xwin').forEach(w=>{
  w.addEventListener('mousedown',()=>WM.focus(w.id.replace('win-','')));
});

/* ═══════════════════════════════════════════════════════
   START MENU
═══════════════════════════════════════════════════════ */
const Start = {
  _open:false,
  toggle(){ this._open=!this._open; document.getElementById('startMenu').classList.toggle('show',this._open); if(this._open) SFX.start(); },
  close(){ this._open=false; document.getElementById('startMenu').classList.remove('show'); }
};
document.addEventListener('mousedown',e=>{
  if(Start._open&&!e.target.closest('#startMenu')&&!e.target.closest('#startBtn')) Start.close();
});

/* ═══════════════════════════════════════════════════════
   CONTEXT MENU
═══════════════════════════════════════════════════════ */
function hideCtx(){ document.getElementById('ctxMenu').style.display='none'; }
document.getElementById('scDesktop')?.addEventListener('contextmenu',e=>{
  if(e.target.closest('.xwin')) return;
  e.preventDefault();
  const m=document.getElementById('ctxMenu');
  m.style.display=''; m.style.left=Math.min(e.clientX,window.innerWidth-190)+'px';
  m.style.top=Math.min(e.clientY,window.innerHeight-140)+'px';
});
document.addEventListener('click',e=>{ if(!e.target.closest('#ctxMenu')) hideCtx(); });

/* ═══════════════════════════════════════════════════════
   CLOCK
═══════════════════════════════════════════════════════ */
function tick(){
  const d=new Date();
  document.getElementById('trayClock').textContent=
    String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  const mc=document.getElementById('mapClock');
  if(mc) mc.textContent=d.toTimeString().slice(0,8);
}
setInterval(tick,1000); tick();

/* ═══════════════════════════════════════════════════════
   GLOBE  —  fixed CCG island red dot
   The fix: we use a fixed canvas-space position approach
   so the CCG dot always renders on top correctly.
═══════════════════════════════════════════════════════ */
const Globe = (()=>{
  let raf=null, alive=false, spinning=true, rot=0;

  // Real lat/lon land dot cloud — continent shapes
  const LAND=[
    // North America
    ...[ [-138,60],[-130,58],[-120,55],[-110,50],[-100,48],[-92,46],[-83,44],[-76,42],
         [-75,41],[-78,35],[-80,30],[-82,25],[-90,22],[-104,28],[-110,32],[-118,34],
         [-122,37],[-124,45],[-126,49],[-130,55],[-136,58],[-85,46],[-78,43],[-70,44],
         [-65,44],[-95,38],[-88,40],[-80,38] ].map(([lo,la])=>({la,lo})),
    // Canada / Alaska
    ...[ [-140,60],[-135,65],[-128,62],[-100,68],[-85,72],[-75,68],[-65,65],
         [-60,62],[-80,60],[-165,64],[-160,60] ].map(([lo,la])=>({la,lo})),
    // Greenland
    ...[ [-42,80],[-36,76],[-28,72],[-32,68],[-44,70],[-56,74],[-64,78],[-50,82] ].map(([lo,la])=>({la,lo})),
    // South America
    ...[ [-62,10],[-60,5],[-52,0],[-48,-5],[-42,-10],[-40,-14],[-42,-20],[-44,-23],
         [-50,-30],[-58,-35],[-62,-40],[-66,-46],[-70,-50],[-58,-3],[-76,5],
         [-72,10],[-65,8],[-62,2],[-38,-8] ].map(([lo,la])=>({la,lo})),
    // Europe
    ...[ [-9,38],[-8,37],[-6,36],[-4,38],[-2,43],[2,44],[3,46],[4,48],[5,50],[8,47],
         [10,54],[12,52],[14,50],[16,48],[16,47],[14,42],[12,44],[12,38],[15,37],
         [20,52],[22,54],[24,56],[25,60],[26,64],[28,66],[25,65],[20,62],[18,58],
         [10,62],[8,57],[5,56],[0,52],[-2,52],[-3,56],[-4,58],[-6,58],[-5,53] ].map(([lo,la])=>({la,lo})),
    // Scandinavia
    ...[ [7,58],[8,60],[10,62],[14,64],[16,66],[18,68],[22,70],[26,65],[28,63] ].map(([lo,la])=>({la,lo})),
    // Africa
    ...[ [10,35],[12,32],[30,30],[32,26],[36,22],[38,18],[40,14],[40,10],[36,5],
         [32,0],[28,-5],[28,-10],[26,-14],[26,-20],[28,-26],[30,-30],[26,-34],
         [4,32],[0,26],[15,20],[20,14],[14,10],[8,5],[10,0],[14,-6],[20,-10],
         [22,-16],[20,-22],[-5,10],[-12,8],[-16,12],[-14,15],[-12,18] ].map(([lo,la])=>({la,lo})),
    // Asia (W)
    ...[ [36,38],[44,38],[50,42],[52,40],[52,36],[48,32],[56,26],[60,22],[66,26],
         [70,22],[72,18],[80,14],[80,10],[80,8] ].map(([lo,la])=>({la,lo})),
    // Asia (E/SE)
    ...[ [86,20],[90,24],[92,22],[96,22],[100,20],[106,18],[106,16],[108,14],
         [100,12],[104,10],[100,4],[98,8],[96,18],[114,22],[118,24],[120,26],
         [120,28],[122,32],[120,36],[118,38],[116,40],[106,38],[104,36],[96,40],
         [88,44],[82,46],[104,52],[108,54],[114,56],[120,58],[130,60],[140,62],
         [150,64],[150,60],[140,56],[130,52],[140,42],[136,34],[134,32],[136,36],
         [138,38],[140,38],[142,44] ].map(([lo,la])=>({la,lo})),
    // SE Asia islands
    ...[ [110,2],[110,0],[112,-2],[114,-4],[106,-6],[102,-4],[100,4],[100,6],
         [98,8],[104,2],[108,0],[116,-8],[120,-10] ].map(([lo,la])=>({la,lo})),
    // Australia
    ...[ [130,-14],[136,-18],[140,-22],[148,-26],[152,-30],[150,-34],[146,-38],
         [140,-38],[138,-34],[138,-36],[116,-30],[114,-26],[114,-22],[118,-20],
         [124,-16],[130,-20],[130,-26] ].map(([lo,la])=>({la,lo})),
    // Middle East
    ...[ [36,36],[38,34],[34,30],[34,28],[38,26],[46,24],[50,22],[54,24],[56,26] ].map(([lo,la])=>({la,lo})),
    // CCG ISLAND — mid-Atlantic, stored separately for special render
  ];

  // CCG island coords (mid-Atlantic, will show ~every rotation cycle)
  const CCG_LAT = 22, CCG_LON = -28;

  function ll2xyz(lat, lon, R, rotDeg){
    const phi=(90-lat)*Math.PI/180, lam=(lon+rotDeg)*Math.PI/180;
    return { x:R*Math.sin(phi)*Math.cos(lam), y:R*Math.cos(phi), z:R*Math.sin(phi)*Math.sin(lam) };
  }

  function drawFrame(canvas, ctx){
    const W=canvas.width, H=canvas.height, cx=W/2, cy=H/2, R=Math.min(W,H)*.4;

    ctx.clearRect(0,0,W,H);

    // Space
    ctx.fillStyle='#000006'; ctx.fillRect(0,0,W,H);

    // Stars
    for(let i=0;i<260;i++){
      const sx=((i*2537+19)%W), sy=((i*1733+37)%H), big=(i%11===0);
      ctx.fillStyle=`rgba(${200+i%55},${210+i%45},255,${.1+((i*11)%14)/40})`;
      ctx.fillRect(sx,sy,big?1.5:1,big?1.5:1);
    }

    // Atmosphere
    const atm=ctx.createRadialGradient(cx,cy,R*.88,cx,cy,R*1.15);
    atm.addColorStop(0,'rgba(80,140,255,0)'); atm.addColorStop(.35,'rgba(80,140,255,.14)');
    atm.addColorStop(.7,'rgba(60,100,220,.06)'); atm.addColorStop(1,'rgba(40,60,180,0)');
    ctx.beginPath(); ctx.arc(cx,cy,R*1.15,0,Math.PI*2); ctx.fillStyle=atm; ctx.fill();

    // Ocean
    const ocean=ctx.createRadialGradient(cx-R*.28,cy-R*.22,0,cx,cy,R);
    ocean.addColorStop(0,'#1c5090'); ocean.addColorStop(.4,'#0e3060');
    ocean.addColorStop(.8,'#081a38'); ocean.addColorStop(1,'#040e1c');
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fillStyle=ocean; ctx.fill();

    // Grid
    ctx.lineWidth=.5; ctx.strokeStyle='rgba(60,110,200,.17)';
    for(let lat=-75;lat<=75;lat+=30){
      ctx.beginPath(); let f=true;
      for(let lon=-180;lon<=180;lon+=3){
        const p=ll2xyz(lat,lon,R,rot);
        if(p.z<-R*.05){f=true;continue;}
        f?ctx.moveTo(cx+p.x,cy-p.y):ctx.lineTo(cx+p.x,cy-p.y); f=false;
      } ctx.stroke();
    }
    for(let lon=-180;lon<180;lon+=30){
      ctx.beginPath(); let f=true;
      for(let lat=-85;lat<=85;lat+=3){
        const p=ll2xyz(lat,lon,R,rot);
        if(p.z<-R*.05){f=true;continue;}
        f?ctx.moveTo(cx+p.x,cy-p.y):ctx.lineTo(cx+p.x,cy-p.y); f=false;
      } ctx.stroke();
    }

    // Land
    LAND.forEach(pt=>{
      const p=ll2xyz(pt.la,pt.lo,R,rot);
      if(p.z<-R*.04) return;
      const bright=.35+.65*(p.z/R), gb=Math.floor(bright*55);
      const g=ctx.createRadialGradient(cx+p.x,cy-p.y,0,cx+p.x,cy-p.y,3.8);
      g.addColorStop(0,`rgba(${40+gb},${100+gb},${38+Math.floor(gb*.4)},${bright*.92})`);
      g.addColorStop(1,'rgba(20,55,18,0)');
      ctx.beginPath(); ctx.arc(cx+p.x,cy-p.y,3.2,0,Math.PI*2); ctx.fillStyle=g; ctx.fill();
    });

    // ★ CCG ISLAND — drawn last, always on top, visible whenever facing viewer ★
    {
      const p = ll2xyz(CCG_LAT, CCG_LON, R, rot);
      // Show whenever the point is on the front hemisphere (z > 0) or just barely behind
      if(p.z > -R*.15){
        const px=cx+p.x, py=cy-p.y;
        // vis: 0 when barely visible, 1 when fully facing
        const vis = Math.max(0.15, (p.z + R*.15) / (R * 1.15));
        const pulse=.5+.5*Math.abs(Math.sin(Date.now()*.003));
        const t2 = Date.now()*.0015;

        // Outer expanding ring (animated)
        const ringR1 = 18+pulse*7;
        ctx.beginPath(); ctx.arc(px,py,ringR1,0,Math.PI*2);
        ctx.strokeStyle=`rgba(255,40,40,${vis*.5*pulse})`;
        ctx.lineWidth=1.5; ctx.stroke();

        // Second tighter ring
        ctx.beginPath(); ctx.arc(px,py,11,0,Math.PI*2);
        ctx.strokeStyle=`rgba(255,100,100,${vis*.7})`;
        ctx.lineWidth=1; ctx.stroke();

        // Glow halo
        const grd=ctx.createRadialGradient(px,py,0,px,py,14);
        grd.addColorStop(0,`rgba(255,80,80,${vis*.85})`);
        grd.addColorStop(.4,`rgba(200,30,30,${vis*.5})`);
        grd.addColorStop(1,'rgba(150,0,0,0)');
        ctx.beginPath(); ctx.arc(px,py,14,0,Math.PI*2); ctx.fillStyle=grd; ctx.fill();

        // Core dot — bright solid red always
        ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,${40+Math.floor(pulse*120)},40,${Math.max(0.7, vis)})`;
        ctx.fill();
        // White hot center
        ctx.beginPath(); ctx.arc(px,py,2,0,Math.PI*2);
        ctx.fillStyle=`rgba(255,230,230,${vis*.9})`;
        ctx.fill();

        // Label + connector line
        if(vis>.25){
          ctx.font='bold 10px Lucida Console, monospace';
          ctx.fillStyle=`rgba(255,140,140,${vis*.95})`;
          ctx.fillText('CCG BUNKER', px+10, py-10);
          ctx.beginPath(); ctx.moveTo(px+6,py-2); ctx.lineTo(px+9,py-8);
          ctx.strokeStyle=`rgba(255,80,80,${vis*.5})`; ctx.lineWidth=1; ctx.stroke();
        }
      }
    }

    // Specular
    const spec=ctx.createRadialGradient(cx-R*.32,cy-R*.3,0,cx,cy,R*.9);
    spec.addColorStop(0,'rgba(180,225,255,.1)'); spec.addColorStop(.4,'rgba(140,190,255,.04)');
    spec.addColorStop(1,'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fillStyle=spec; ctx.fill();

    // Night shadow
    const shadow=ctx.createRadialGradient(cx+R*.55,cy,0,cx,cy,R);
    shadow.addColorStop(.5,'rgba(0,0,0,0)'); shadow.addColorStop(.72,'rgba(0,0,0,.28)');
    shadow.addColorStop(.88,'rgba(0,0,0,.62)'); shadow.addColorStop(1,'rgba(0,0,0,.88)');
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2); ctx.fillStyle=shadow; ctx.fill();

    // Edge
    ctx.beginPath(); ctx.arc(cx,cy,R,0,Math.PI*2);
    ctx.strokeStyle='rgba(80,150,230,.28)'; ctx.lineWidth=1.5; ctx.stroke();
  }

  return {
    init(){
      const canvas=document.getElementById('globeCanvas'); if(!canvas||alive) return;
      const par=canvas.parentElement;
      canvas.width=par.clientWidth; canvas.height=par.clientHeight;
      const ctx=canvas.getContext('2d');
      alive=true;
      const loop=()=>{
        if(!alive) return;
        raf=requestAnimationFrame(loop);
        if(spinning) rot+=.08;
        drawFrame(canvas,ctx);
      };
      loop();
    },
    stop(){ alive=false; cancelAnimationFrame(raf); },
    resize(){
      const c=document.getElementById('globeCanvas'); if(!c) return;
      c.width=c.parentElement.clientWidth; c.height=c.parentElement.clientHeight;
    },
    toggleRotate(){
      spinning=!spinning;
      document.getElementById('mapRotBtn').textContent=spinning?'Pause Rotation':'Resume Rotation';
    }
  };
})();

/* ═══════════════════════════════════════════════════════
   INTEL
═══════════════════════════════════════════════════════ */
const Intel = {
  show(key, el){
    const d=DOCS[key]; if(!d) return;
    document.querySelectorAll('.it-item').forEach(i=>i.classList.remove('active'));
    el?.classList.add('active');
    document.getElementById('intelView').innerHTML=
      `<div class="iv-title">${d.title} <span class="iv-badge">${d.badge}</span></div>
       <div class="iv-line"></div>
       <div class="iv-body">${d.body}</div>`;
    document.getElementById('intelSb').textContent=d.file;
    document.getElementById('intelAddr').textContent='C:\\CCG\\INTEL\\'+d.file;
    STATE.docsRead.add(key);
    if(STATE.docsRead.size>=Object.keys(DOCS).length-1) Achs.unlock('archivist');
    SFX.click();
  }
};

/* ═══════════════════════════════════════════════════════
   COMMS
═══════════════════════════════════════════════════════ */
const Comms = {
  select(i, el){
    document.querySelectorAll('.cl-item').forEach(c=>c.classList.remove('sel'));
    if(el) el.classList.add('sel');
    else document.querySelectorAll('.cl-item')[i]?.classList.add('sel');
    const v=document.getElementById('commsView');
    if(v&&COMMS[i]) v.innerHTML=COMMS[i].html;
    STATE.commsRead.add(i);
    if(STATE.commsRead.size>=COMMS.length) Achs.unlock('comms');
    SFX.click();
  }
};

/* ═══════════════════════════════════════════════════════
   ACHIEVEMENTS
═══════════════════════════════════════════════════════ */
const Achs = {
  buildGrid(){
    const g=document.getElementById('achGrid'); if(!g||g.children.length) return;
    ACHS.forEach(a=>{
      const t=document.createElement('div'); t.className='ach-tile'; t.id='at-'+a.id;
      t.innerHTML=`<div class="ach-ico">${a.ico}</div><div class="ach-nm">${a.name}</div><div class="ach-ds">${a.desc}</div>`;
      g.appendChild(t);
    });
    STATE.achievements.forEach(id=>document.getElementById('at-'+id)?.classList.add('got'));
  },
  unlock(id){
    if(STATE.achievements.includes(id)) return;
    STATE.achievements.push(id);
    document.getElementById('at-'+id)?.classList.add('got');
    const a=ACHS.find(x=>x.id===id); if(!a) return;
    document.getElementById('cxAch').textContent=STATE.achievements.length;
    Balloon.show(a.ico+' Achievement Unlocked',a.name+' &mdash; '+a.desc);
  },
  check(){
    if(STATE.codesDecoded>=1) this.unlock('first');
    if(STATE.codesDecoded>=3) this.unlock('three');
    if(STATE.codesDecoded>=6) this.unlock('six');
    if(STATE.discoveries.some(d=>CODES[d]?.type==='reward')) this.unlock('reward');
    if(STATE.discoveries.some(d=>CODES[d]?.type==='secret')) this.unlock('secret');
  }
};

/* ═══════════════════════════════════════════════════════
   BALLOON NOTIFICATIONS
═══════════════════════════════════════════════════════ */
const Balloon = {
  show(title, body=''){
    SFX.balloon();
    const stack=document.getElementById('balloonStack');
    const el=document.createElement('div'); el.className='balloon';
    el.innerHTML=`<div class="balloon-title">${title}</div>${body?`<div class="balloon-body">${body}</div>`:''}`;
    stack.appendChild(el);
    setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),250); },5000);
  }
};

/* ═══════════════════════════════════════════════════════
   TERMINAL
═══════════════════════════════════════════════════════ */
const Term = {
  _queue:[], _busy:false,

  inject(cmd){ const i=document.getElementById('termIn'); if(i) i.value=cmd; this.submit(); },

  submit(){
    const inp=document.getElementById('termIn'); if(!inp) return;
    const val=inp.value.trim().toUpperCase(); inp.value='';
    if(!val) return; this._run(val);
  },

  _line(text,cls=''){
    const out=document.getElementById('termOut'); if(!out) return null;
    const s=document.createElement('span'); s.className='tl '+cls; s.innerHTML=text;
    out.appendChild(s); out.scrollTop=out.scrollHeight; return s;
  },

  _queueLines(lines,cls,speed=18){
    this._queue.push({lines,cls,speed});
    if(!this._busy) this._process();
  },

  _process(){
    if(!this._queue.length){ this._busy=false; return; }
    this._busy=true;
    const{lines,cls,speed}=this._queue.shift();
    let i=0;
    const next=()=>{
      if(i>=lines.length){ this._process(); return; }
      const el=this._line('',cls);
      this._typeChars(el,lines[i],speed,next); i++;
    };
    next();
  },

  _typeChars(el,text,speed,cb){
    let i=0; const out=document.getElementById('termOut');
    const step=()=>{
      el.textContent=text.slice(0,i);
      if(STATE.cfg.typing&&i>0&&i%4===0) SFX.click();
      if(out) out.scrollTop=out.scrollHeight;
      i++;
      if(i>text.length){ if(cb) cb(); } else setTimeout(step,speed+Math.random()*speed*.3);
    };
    step();
  },

  _run(val){
    this._line('C:\\CCG\\BUNKER&gt; '+val,'tc');
    if(val==='CLEAR'){ document.getElementById('termOut').innerHTML=''; return; }
    if(val==='HELP'){
      this._queueLines([
        '+--------------------------------------------------+',
        '|   CCG BUNKER TERMINAL  --  COMMANDS             |',
        '+--------------------------------------------------+',
        '|  HELP     Show this list                        |',
        '|  STATUS   Show system status                    |',
        '|  CLEAR    Clear the screen                      |',
        '|  CODES    Show session decode count             |',
        '|  [CODE]   Enter any field code to decrypt it   |',
        '+--------------------------------------------------+',
      ],'tw',10);
      return;
    }
    if(val==='STATUS'){
      this._queueLines([
        '--- SYSTEM STATUS -----------------------------------',
        '  Node:        CCG-BNK-MAIN',
        '  Location:    Sublevel 3',
        '  Encryption:  AES-4096  ACTIVE',
        '  Decoded:     '+STATE.codesDecoded+' code(s) this session',
        '-----------------------------------------------------',
      ],'tg',10);
      return;
    }
    if(val==='CODES'){ this._line('Codes decoded this session: '+STATE.codesDecoded,'tw'); return; }

    if(CODES[val]){
      const code=CODES[val];
      STATE.codesDecoded++;
      if(!STATE.discoveries.includes(val)){ STATE.discoveries.push(val); this._addDisc(val); }
      document.getElementById('termSb2').textContent='Decoded: '+STATE.codesDecoded;
      document.getElementById('cxDec').textContent=STATE.codesDecoded;
      if(code.type==='reward'){
        SFX.reward();
        Balloon.show('&#9733; Reward Found: '+val,'Show this screen to a CCG admin to claim your prize!');
        // Flash terminal background
        const tw=document.querySelector('.term-wrap');
        if(tw){ tw.classList.add('term-reward-flash'); setTimeout(()=>tw.classList.remove('term-reward-flash'),700); }
      }
      else if(code.type==='secret'){ SFX.secret(); Balloon.show('&#x1F47B; Secret Found: '+val,'A hidden signal has been intercepted.'); }
      else { SFX.ok(); Balloon.show('&#x1F513; Code Decoded: '+val,'Intel fragment unlocked.'); }
      Achs.check();
      this._line('&gt; Decrypting...','td');
      setTimeout(()=>this._queueLines(code.lines,'t'+code.type[0],18),400);
      return;
    }

    SFX.err();
    this._line('ERROR: "'+val+'" &mdash; code not recognized.','tr');
    this._line('Type HELP for commands.','td');
  },

  _addDisc(code){
    const list=document.getElementById('discList'); if(!list) return;
    list.querySelector('.disc-empty')?.remove();
    const c=CODES[code]; if(!c) return;
    const col={lore:'#1a6a1a',reward:'#806000',secret:'#6a1a8a'}[c.type]||'#000';
    const d=document.createElement('div'); d.className='disc-item';
    d.innerHTML=`<div class="di-code" style="color:${col}">${code}</div>
      <div class="di-type di-${c.type}">${c.type.toUpperCase()}</div>`;
    list.prepend(d);
  }
};

document.getElementById('termIn')?.addEventListener('keydown',e=>{
  if(e.key==='Enter') Term.submit(); else SFX.click();
});

/* ═══════════════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════════════ */
const Settings = {
  toggle(key){
    STATE.cfg[key]=!STATE.cfg[key];
    document.getElementById('cb-'+key)?.classList.toggle('on',STATE.cfg[key]);
    if(key==='scanlines') document.getElementById('scanlines').classList.toggle('on',STATE.cfg.scanlines);
    if(key==='sound') SFX.on=STATE.cfg.sound;
    if(key==='typing') SFX.typing=STATE.cfg.typing;
    SFX.click();
  }
};

/* ═══════════════════════════════════════════════════════
   NOTEPAD
═══════════════════════════════════════════════════════ */
document.getElementById('notepadArea')?.addEventListener('keyup',function(){
  const lines=this.value.split('\n');
  const col=this.selectionStart-this.value.lastIndexOf('\n',this.selectionStart-1)-1;
  document.getElementById('npSb').textContent=`Ln ${lines.length}, Col ${col}`;
});

/* ═══════════════════════════════════════════════════════
   DESKTOP ICON SELECTION
═══════════════════════════════════════════════════════ */
document.querySelectorAll('.dicon').forEach(ico=>{
  ico.addEventListener('click',()=>{
    document.querySelectorAll('.dicon').forEach(i=>i.classList.remove('sel'));
    ico.classList.add('sel');
  });
});
document.getElementById('wallpaper')?.addEventListener('click',()=>{
  document.querySelectorAll('.dicon').forEach(i=>i.classList.remove('sel'));
});

/* ═══════════════════════════════════════════════════════
   SHAKE CSS (for locked profiles)
═══════════════════════════════════════════════════════ */
const shakeCSS = document.createElement('style');
shakeCSS.textContent=`
@keyframes shake {
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-8px)}
  40%{transform:translateX(8px)}
  60%{transform:translateX(-6px)}
  80%{transform:translateX(6px)}
}`;
document.head.appendChild(shakeCSS);

/* ═══════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════ */
window.addEventListener('load',()=>{
  // Start privacy screen background
  OS._privStop = bgParticles('privBg',{count:50,speed:.2,color:'rgba(40,100,200,',lines:true});

  // Login enter key
  document.getElementById('loginInput')
    ?.addEventListener('keydown',e=>{ if(e.key==='Enter') OS.doLogin(); });
});
