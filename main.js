'use strict';

/* debug: surface any runtime error on-screen (phone testing aid) */
window.addEventListener('error', e => {
  let box = document.getElementById('err-overlay');
  if (!box) {
    box = document.createElement('div');
    box.id = 'err-overlay';
    box.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:9999;' +
      'background:#3b0000;color:#ffd7d7;font:11px/1.4 monospace;' +
      'padding:8px 10px;white-space:pre-wrap;max-height:40vh;overflow:auto';
    document.body.appendChild(box);
  }
  box.textContent += (box.textContent ? '\n---\n' : '') +
    (e.message || String(e.error)) + '\n@ line ' + e.lineno;
});

/* ================= data =================
   Orrery model: each category is a planet on its own orbit lane;
   its links are moons wandering in a "gravitational bubble" around
   the planet. Hovering a lane + scrolling spins that planet (moons
   ride along); other lanes stay put. Clicking anything selects it. */

const CATS = [
  {
    id: 'personal', label: 'Personal', color: '#e54f6d',
    psize: 60,
    start: 0, drift: 0.13,           /* desktop: start slot shuffled each load */
    sway: { amp: 0.38, f: 0.065, ph: 0.5 },   // extra along-lane swing (rad)
    bob:  { amp: 5,    f: 0.19,  ph: 1.2 },   // radial breathing (px)
    planet: { name: 'Socials', url: null, icon: 'heart', desc: 'Life beyond the keyboard.' },
    moons: [
      { name: 'Email',     url: 'mailto:cole.dorazio@gmail.com',            icon: 'mail',      handle: 'cole.dorazio@gmail.com', copyHandle: true, desc: 'Reach me personally.' },
      { name: 'Phone',     url: 'tel:+17048076807',                        icon: 'phone',     handle: '(704) 807-6807', copyHandle: true, desc: 'Text or call me directly.' },
      { name: 'Instagram', url: 'https://www.instagram.com/klassiccole',    icon: 'instagram', handle: '@klassiccole', desc: 'Personal life in pictures.' },
      { name: 'Facebook',  url: 'https://www.facebook.com/klassiccole',     icon: 'facebook',  handle: '@klassiccole', desc: 'The classic feed.' },
      { name: 'Steam',     url: 'https://steamcommunity.com/id/RubixQube/', icon: 'steam',     handle: 'RubixQube',    desc: 'What I like to play.' },
      { name: 'MakerWorld', url: 'https://makerworld.com/en/@KlassicCole',   icon: 'makerworld', handle: '@KlassicCole', desc: 'My 3D print designs and models.' },
      { name: 'Discord',    url: 'https://discord.com/users/168185748904738816', icon: 'discord', handle: 'qube_of_rubix', copyHandle: true, desc: 'Say hi on Discord.' },
    ],
  },
  {
    id: 'cyberflight', label: 'Business', color: '#6fffe9',
    psize: 60,
    start: 120, drift: -0.11,
    sway: { amp: 0.34, f: 0.055, ph: 2.6 },
    bob:  { amp: 4.5,  f: 0.16,  ph: 3.4 },
    planet: { name: 'Cyberflight Studio', url: null, icon: 'globe', desc: 'My studio, where engineering meets art.' },
    moons: [
      { name: 'Email',     url: 'mailto:cole@cyberflight.studio',                icon: 'mail',      handle: 'cole@cyberflight.studio', copyHandle: true, desc: 'Direct line to the studio inbox.' },
      { name: 'Phone',     url: 'tel:+17047505025',                              icon: 'phone',     handle: '(704) 750-5025', copyHandle: true, desc: 'Text or call the studio.' },
      { name: 'Website',   url: 'https://cyberflight.studio/',                   icon: 'globe',     handle: 'cyberflight.studio',  desc: "The studio's official home on the web." },
      { name: 'YouTube',   url: 'https://www.youtube.com/@cyberflightstudios',   icon: 'youtube',   handle: '@cyberflightstudios', desc: 'Full-length drone and studio videos.' },
      { name: 'TikTok',    url: 'https://www.tiktok.com/@cyberflightstudios',    icon: 'tiktok',    handle: '@cyberflightstudios', desc: 'Quick hits of our drone and camera work.' },
      { name: 'Instagram', url: 'https://www.instagram.com/cyberflightstudios/', icon: 'instagram', handle: '@cyberflightstudios', desc: 'Drone shots, photography, and videography.' },
      { name: 'Cash App',  url: 'https://cash.app/$cyberflightstudios',        icon: 'cashapp',   handle: '$cyberflightstudios', desc: 'Support the studio. Every bit fuels the next project.' },
      { name: 'Venmo',     url: 'https://www.venmo.com/u/cyberflightstudios',      icon: 'venmo',     handle: '@cyberflightstudios', desc: 'Prefer Venmo? The studio takes that too.' },
    ],
  },
  {
    id: 'professional', label: 'Professional', color: '#1282a2',
    psize: 60,
    start: 240, drift: 0.095,
    sway: { amp: 0.36, f: 0.075, ph: 4.8 },
    bob:  { amp: 5,    f: 0.22,  ph: 5.1 },
    planet: { name: 'Computer Science', url: null, icon: 'brief', desc: 'Where I work, ship, and network.' },
    moons: [
      { name: 'LinkedIn', url: 'https://www.linkedin.com/in/coledorazio/', icon: 'linkedin', handle: 'coledorazio',  desc: 'The professional résumé and network.' },
      { name: 'GitHub',   url: 'https://github.com/klassiccole',           icon: 'github',   handle: '@klassiccole', desc: 'Code, experiments, and open source.' },
      { name: 'Resume',    url: 'images/Software_Developer_Resume.pdf',     icon: 'resume',    handle: 'PDF download',        desc: 'My full résumé, ready to view or save.' },
    ],
  },
];

/* flat node list: planet first, then its moons */
const FLAT = [];
CATS.forEach((cat, ci) => {
  FLAT.push({ cat, ci, isPlanet: true, ref: cat.planet });
  cat.moons.forEach((m, mi) => FLAT.push({ cat, ci, isPlanet: false, ref: m, mi }));
});
const SEQ = [-1, ...FLAT.map((_, k) => k)];

/* ================= dom refs ================= */

const cosmos   = document.getElementById('cosmos');
const pathsSvg = document.getElementById('orbitPaths');
const panel    = document.getElementById('panel');
const chipsEl  = document.getElementById('chips');
const glow     = document.getElementById('glow');
const listview = document.getElementById('listview');
const lvGroups = document.getElementById('lvGroups');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* geometry: lane radii are DERIVED so the gap between the sun's edge,
   each lane, is identical, while the outer system stays inside the
   cosmos. The static arrays below are only fallbacks for tiny screens. */
const desktopMQ = window.matchMedia('(min-width: 900px)');
const GEO_DESKTOP = { lanes: [0.40, 0.63, 0.86] };
const GEO_MOBILE  = { lanes: [0.45, 0.61, 0.77] };
let GEO = desktopMQ.matches ? GEO_DESKTOP : GEO_MOBILE;
const avatarEl = document.getElementById('avatar');
avatarEl.addEventListener('click', () => { if (!dragMoved) selectHome(); });   // sun = splash

function syncGeometry() {
  GEO = desktopMQ.matches ? GEO_DESKTOP : GEO_MOBILE;

  if (cosmosSize) {
    const R = cosmosSize / 2;
    const sunR = avatarEl.offsetWidth / 2;
    const planetR0 = CATS[0].psize / 2;

    if (desktopMQ.matches) {
      /* desktop: inner lane pinned; outer two split the rest evenly */
      GEO.pscale = 1;
      const L3max = R - planetR0 - 2;
      const L1 = R * 0.40;
      const gap = (L3max - L1) / 2;
      if (gap >= 18) {
        GEO.lanes = [L1, L1 + gap, L1 + 2 * gap].map(v => v / R);
      }
      pathEls.forEach(p => { p.style.opacity = ''; });
    } else {
      /* phones/tablets: ONE shared lane — all three planets ride a single
         ring, evenly spaced, at full size. One scroll finds everything. */
      GEO.pscale = 1;
      const pR = planetR0;
      const L1 = Math.min(sunR + pR + 20, R - pR - 6);   // extra sun-to-orbit spacing
      GEO.lanes = [L1, L1, L1].map(v => v / R);   // store as fraction of R
      /* only the first ellipse is drawn; the others would just stack */
      pathEls.forEach((p, ci2) => {
        p.style.opacity = ci2 > 0 ? '0' : '';
      });
    }
  }

  cosmos.style.setProperty('--pscale', String(GEO.pscale || 1));
  pathEls.forEach((p, ci) => {
    p.setAttribute('rx', String(GEO.lanes[ci] * 50));
    p.setAttribute('ry', String(GEO.lanes[ci] * 50 * (desktopMQ.matches ? 1 : TILT)));
  });
}
const syncLaneRadii = syncGeometry;      // alias during transition
desktopMQ.addEventListener('change', () => {
  syncLaneRadii();
  if (reducedMotion) layout(0, 0);
});

/* ================= motion state ================= */

const N = CATS.length;
const MOONSHOWN = new Array(N).fill();   // per-cat moon visibility (mobile collapse)
const laneTime = CATS.map(() => -2);     // per-lane motion clock (starts held ~2s before drifting)
let moonAnimTimer = null;
let focusF = 0;                          // mobile focus-mode zoom progress (0..1)
let ringScroll = 0, ringVel = 0;         // focus ring: user rotation + momentum
const scroll = new Array(N).fill(0);   // manual rotation per lane (rad)
const vel    = new Array(N).fill(0);   // lane spin velocity (rad/s)
let hoverLane = null;                  // lane under the pointer
let dragLane  = null;                  // lane being dragged (touch)
let sel = -1;                          // flat index, -1 = home
let dragMoved = false;
let cosmosSize = 0;

/* ================= build: paths, planets, moons ================= */

const SVGNS = 'http://www.w3.org/2000/svg';

const TILT = 0.5;   // mobile lane tilt: 1 = flat top-down, 0 = edge-on
const pathEls = CATS.map((cat, ci) => {
  const c = document.createElementNS(SVGNS, 'ellipse');
  c.setAttribute('cx', '50');
  c.setAttribute('cy', '50');
  c.setAttribute('rx', String(GEO.lanes[ci] * 50));
  c.setAttribute('ry', String(GEO.lanes[ci] * 50 * (desktopMQ.matches ? 1 : TILT)));
  c.setAttribute('class', 'orbit-path');
  c.style.stroke = cat.color;
  pathsSvg.appendChild(c);
  return c;
});

const worlds = CATS.map((cat, ci) => {
  const wrap = document.createElement('div');
  wrap.className = 'cat-planet';
  wrap.dataset.cat = String(ci);
  wrap.style.setProperty('--psize', cat.psize + 'px');
  wrap.style.setProperty('--c', cat.color);
  wrap.setAttribute('role', 'button');
  wrap.setAttribute('aria-label', cat.label);
  wrap.innerHTML = `
    <div class="planet-disc"><svg class="icon"><use href="#i-${cat.planet.icon}"/></svg></div>
    <div class="planet-label">${cat.label}</div>`;
  const kPlanet = FLAT.findIndex(n => n.ci === ci && n.isPlanet);
  wrap.addEventListener('click', () => {
    if (dragMoved) return;
    if (!desktopMQ.matches && focusF > 0.5) return selectHome();  // focused: tap planet = back
    select(kPlanet);
  });

  const moonEls = cat.moons.map((m, mi) => {
    const moon = document.createElement('button');
    moon.className = 'moon';
    moon.dataset.cat = String(ci);   // so moon hover pauses/selects the right lane
    moon.style.setProperty('--size', '34px');
    moon.style.setProperty('--c', cat.color);   // no longer inherits from the planet wrap
    moon.setAttribute('aria-label', m.name);
    moon.innerHTML = `<svg class="icon"><use href="#i-${m.icon}"/></svg>`;
    const kMoon = FLAT.findIndex(nd => nd.ci === ci && !nd.isPlanet && nd.mi === mi);
    moon.addEventListener('click', e => {
      e.stopPropagation();   // don't let the planet's click handler swallow this
      if (!dragMoved) select(kMoon);
    });
    cosmos.appendChild(moon);   // moons live in cosmos space (trailing the planet)
    return moon;
  });

  cosmos.appendChild(wrap);
  return { wrap, moonEls };
});

/* ================= stars ================= */

const starsEl = document.querySelector('.stars');
for (let i = 0; i < 70; i++) {
  const s = document.createElement('span');
  s.className = 'star';
  const size = Math.random() * 2 + 0.6;
  s.style.width = s.style.height = size + 'px';
  s.style.left = Math.random() * 100 + '%';
  s.style.top = Math.random() * 100 + '%';
  s.style.animationDelay = Math.random() * 4 + 's';
  s.style.animationDuration = Math.random() * 3 + 3 + 's';
  starsEl.appendChild(s);
}

/* ================= chips ================= */

const chipEls = [
  { key: 'home', label: 'Contact', color: '#ede6f5' },   /* neutral white, distinct from orbit colors */
  ...CATS.map(c => ({ key: c.id, label: c.label, color: c.color })),
].map(c => {
  const b = document.createElement('button');
  b.className = 'chip';
  b.textContent = c.label;
  b.style.setProperty('--chip-c', c.color);
  b.addEventListener('click', () => {
    if (c.key === 'home') return selectHome();   // "Info" = splash page
    const ci = CATS.findIndex(cat => cat.id === c.key);
    select(FLAT.findIndex(n => n.ci === ci && n.isPlanet));
  });
  chipsEl.appendChild(b);
  return { el: b, key: c.key };
});

/* ================= list view ================= */

function lvRow(item) {
  const a = document.createElement('a');
  a.className = 'lv-row';
  a.href = item.url;
  a.target = '_blank';
  a.rel = 'noopener';
  a.innerHTML = `
    <svg class="icon"><use href="#i-${item.icon}"/></svg>
    <span><span class="lv-row-name">${item.name}</span><br><span class="lv-row-desc">${item.desc}</span></span>
    <svg class="icon lv-arrow"><use href="#i-open"/></svg>`;
  a.dataset.search = `${item.name} ${item.handle || ''} ${item.desc} ${item.url}`.toLowerCase();
  return a;
}

CATS.forEach((cat) => {
  const group = document.createElement('div');
  group.className = 'lv-group';
  group.style.setProperty('--c', cat.color);
  group.innerHTML = `<div class="lv-group-title">${cat.label}</div>`;
  if (cat.planet.url) {
    group.appendChild(lvRow(cat.planet));
  }
  cat.moons.forEach(m => group.appendChild(lvRow(m)));
  lvGroups.appendChild(group);
});

const listToggle = document.getElementById('listToggle');
const listClose  = document.getElementById('listClose');
function openList()  {
  listview.hidden = false;
  requestAnimationFrame(() => listview.classList.add('show'));
}
function closeList() { listview.classList.remove('show'); setTimeout(() => { listview.hidden = true; }, 300); }

/* search inside the list view */
const lvSearch = document.getElementById('lvSearch');

function filterList() {
  const q = lvSearch.value.trim().toLowerCase();
  let any = false;
  lvGroups.querySelectorAll('.lv-group').forEach(group => {
    let groupAny = false;
    group.querySelectorAll('.lv-row').forEach(row => {
      const hit = !q || row.dataset.search.includes(q);
      row.style.display = hit ? '' : 'none';
      if (hit) groupAny = true;
    });
    group.style.display = groupAny ? '' : 'none';
    if (groupAny) any = true;
  });
  let empty = lvGroups.querySelector('.lv-empty');
  if (!any && !empty) {
    empty = document.createElement('div');
    empty.className = 'lv-empty';
    empty.textContent = 'No links match your search.';
    lvGroups.appendChild(empty);
  } else if (any && empty) {
    empty.remove();
  }
}

lvSearch.addEventListener('input', filterList);
lvSearch.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeList(); lvSearch.blur(); }
  e.stopPropagation();   // keep orbit hotkeys from firing while typing
});
listToggle.addEventListener('click', openList);
listClose.addEventListener('click', closeList);

/* ================= selection & panel ================= */

function selectHome() { select(-1); }

function select(k) {
  sel = k;
  dragMoved = false;

  document.querySelectorAll('.cat-planet.focused, .moon.focused')
    .forEach(el => el.classList.remove('focused'));

  if (k === -1) {
    cosmos.classList.add('home');
    pathEls.forEach(p => p.classList.remove('sel'));
    renderPanel();
    syncChips();
    return;
  }
  cosmos.classList.remove('home');
  const node = FLAT[k];
  const w = worlds[node.ci];
  pathEls.forEach((p, i) => p.classList.toggle('sel', i === node.ci));
  if (node.isPlanet) w.wrap.classList.add('focused');
  else w.moonEls[node.mi].classList.add('focused');

  renderPanel();
  syncChips();
}

const host = url => {
  try {
    const u = new URL(url, window.location.href);
    return u.host ? u.host.replace(/^www\./, '') : '';
  } catch (_) { return ''; }
};

function crumbs(cat, item) {
  const chip = cat
    ? `<span class="crumb-chip">${cat.label}</span>`
    : '';
  return item
    ? `${chip}<span class="crumb-sep">&#9656;</span><span class="crumb-name">${item}</span>`
    : chip;
}

function linkCard(ref) {
  const copyVal = ref.copyHandle ? ref.handle : ref.url;
  const copyLabel = ref.copyHandle ? 'Copy username' : 'Copy link';
  return `
    <div class="panel-handle">${ref.handle}${host(ref.url) ? `<span class="panel-url">${host(ref.url)}</span>` : ''}</div>
    <div class="panel-actions">
      <a class="panel-cta" href="${ref.url}" target="_blank" rel="noopener">Open <svg class="icon"><use href="#i-open"/></svg></a>
      <button class="panel-copy" data-copy="${copyVal}"><svg class="icon"><use href="#i-copy"/></svg> ${copyLabel}</button>
    </div>`;
}

function renderPanel() {
  if (sel === -1) {
    panel.style.setProperty('--c', '#ede6f5');   /* neutral white for the Contact panel */
    panel.innerHTML = `
      <div class="panel-inner">
        <div class="panel-head">
          <div class="panel-icon"><svg class="icon"><use href="#i-mail"/></svg></div>
          <div class="panel-titles">
            <div class="panel-crumbs"><span class="crumb-chip">Contact</span></div>
            <div class="panel-title">Communication Methods</div>
          </div>
        </div>
        <div class="panel-actions triple">
          <a class="panel-copy solid" style="--c: #e54f6d" href="tel:+17048076807"><svg class="icon"><use href="#i-phone"/></svg> Call me</a>
          <a class="panel-copy solid" style="--c: #e54f6d" href="sms:+17048076807"><svg class="icon"><use href="#i-sms"/></svg> Text me</a>
          <a class="panel-copy solid" style="--c: #e54f6d" href="mailto:cole.dorazio@gmail.com"><svg class="icon"><use href="#i-mail"/></svg> Email me</a>
        </div>
        <div class="panel-actions">
          <button class="panel-copy light" data-action="links"><svg class="icon"><use href="#i-list"/></svg> All links</button>
          <a class="panel-copy light" href="images/cole-dorazio.vcf" download="Cole_Dorazio.vcf"><svg class="icon"><use href="#i-download"/></svg> Add to contacts</a>
        </div>
      </div>`;
  } else {
    const node = FLAT[sel];
    const cat = node.cat;
    panel.style.setProperty('--c', cat.color);

    if (node.isPlanet) {
      /* category overview: intro + clickable list of its moons */
      const kPlanet = FLAT.findIndex(n => n.ci === node.ci && n.isPlanet);
      const rows = [
        ...(cat.planet.url ? [{ ref: cat.planet, k: kPlanet }] : []),
        ...cat.moons.map((m, mi) => ({ ref: m, k: FLAT.findIndex(n => n.ci === node.ci && !n.isPlanet && n.mi === mi) })),
      ];
      panel.innerHTML = `
        <div class="panel-inner">
          <div class="panel-head">
            <div class="panel-icon"><svg class="icon"><use href="#i-${cat.planet.icon}"/></svg></div>
            <div class="panel-titles">
              <div class="panel-crumbs">${crumbs(cat)}</div>
              <div class="panel-title">${cat.planet.name}</div>
            </div>
          </div>
          <div class="panel-list">
            ${rows.map(r => `
              <button class="panel-row" data-node="${r.k}">
                <svg class="icon"><use href="#i-${r.ref.icon}"/></svg>
                <span class="pr-name">${r.ref.name}</span>
                <span class="pr-handle">${r.ref.handle}</span>
              </button>`).join('')}
          </div>`;
    } else {
      /* moon: full link card */
      panel.innerHTML = `
        <div class="panel-inner">
          <div class="panel-head">
            <div class="panel-icon"><svg class="icon"><use href="#i-${node.ref.icon}"/></svg></div>
            <div class="panel-titles">
              <div class="panel-crumbs">${crumbs(cat)}</div>
              <div class="panel-title">${node.ref.name}</div>
            </div>
          </div>
          ${linkCard(node.ref)}
        </div>`;
    }
  }
  panel.classList.remove('swap');
  void panel.offsetWidth;
  panel.classList.add('swap');
}

/* panel interactions: moon rows, copy buttons, home CTAs */
panel.addEventListener('click', e => {
  const row = e.target.closest('.panel-row');
  if (row) { select(Number(row.dataset.node)); return; }

  const copyBtn = e.target.closest('.panel-copy[data-copy]');
  if (copyBtn) {
    const url = copyBtn.dataset.copy;
    const done = () => {
      copyBtn.classList.add('copied');
      copyBtn.innerHTML = 'Copied &#10003;';
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = '<svg class="icon"><use href="#i-copy"/></svg> Copy link';
      }, 1400);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(done).catch(() => {});
    } else {
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (_) {}
      ta.remove();
    }
    return;
  }

  const action = e.target.closest('[data-action]');
  if (action) {
    if (action.dataset.action === 'work') {
      const ci = CATS.findIndex(c => c.id === 'cyberflight');
      select(FLAT.findIndex(n => n.ci === ci && n.isPlanet));
    } else if (action.dataset.action === 'links') {
      openList();
    }
  }
});

function syncChips() {
  const key = sel === -1 ? 'home' : CATS[FLAT[sel].ci].id;
  chipEls.forEach(c => c.el.classList.toggle('on', c.key === key));
}

/* ================= lane detection ================= */

function laneAt(clientX, clientY) {
  if (!cosmosSize) return null;
  const rect = cosmos.getBoundingClientRect();
  const tilt = desktopMQ.matches ? 1 : TILT;
  const d = Math.hypot(clientX - (rect.left + rect.width / 2),
                      (clientY - (rect.top + rect.height / 2)) / tilt);
  let best = null, bestD = Infinity;
  CATS.forEach((cat, ci) => {
    const diff = Math.abs(d - GEO.lanes[ci] * cosmosSize / 2);
    if (diff < bestD) { bestD = diff; best = ci; }
  });
  return bestD < 32 ? best : null;
}

function laneFromEvent(e) {
  const w = e.target.closest?.('.cat-planet');
  if (w) return Number(w.dataset.cat);
  return laneAt(e.clientX, e.clientY);
}

function setHotLane(ci) {
  if (hoverLane === ci) return;
  hoverLane = ci;
  pathEls.forEach((p, i) => p.classList.toggle('hot', i === ci));
}

cosmos.addEventListener('pointermove', e => {
  /* hovering a planet or one of its moons freezes that lane */
  if (dragLane === null && focusF <= 0.5) {
    const w = e.target.closest?.('.cat-planet, .moon');
    setHotLane(w ? Number(w.dataset.cat) : null);
  }
  moveGlow(e);
});
cosmos.addEventListener('pointerleave', () => setHotLane(null));

/* ================= input: wheel spins the hovered lane ================= */

cosmos.addEventListener('wheel', e => {
  e.preventDefault();
  if (!desktopMQ.matches && focusF > 0.5) {
    /* focus mode: the wheel spins the moon ring */
    ringVel = Math.max(-0.9, Math.min(0.9, ringVel + e.deltaY * 0.0042));
    return;
  }
  const lane = laneFromEvent(e);
  const targets = !desktopMQ.matches ? [0]
    : (lane === null ? [0, 1, 2] : [lane]);
  const f = lane === null ? 0.3 : 1;
  targets.forEach(i => {
    vel[i] += e.deltaY * 0.0042 * f;
    vel[i] = Math.max(-0.9, Math.min(0.9, vel[i]));
  });
}, { passive: false });

/* ================= input: touch drag spins the lane under the finger ================= */

let dragX = null, dragY = null, dragT = 0;

/* NOTE: no setPointerCapture here: capturing retargets the gesture to
   the cosmos and the click would never reach the moon/planet buttons. */
cosmos.addEventListener('pointerdown', e => {
  dragX = e.clientX;
  dragY = e.clientY;
  dragT = performance.now();
  dragMoved = false;
  dragLane = laneFromEvent(e);
});

/* mobile focus mode: tapping empty space (not a world) returns to the sun */
cosmos.addEventListener('click', e => {
  if (!desktopMQ.matches && focusF > 0.5 && !e.target.closest('.cat-planet, .moon')) {
    selectHome();
  }
});

/* drag tracked on window so it keeps working outside the cosmos.
   Wheel physics: the finger grabs the ring and spins it like a real
   wheel. Rotation = cross product of (pointer - sun center) with the
   drag vector, divided by radius squared, so planets follow the finger
   along the circle from ANY grab position, horizontal or vertical. */
window.addEventListener('pointermove', e => {
  if (dragY === null) return;
  const dx = e.clientX - dragX;
  const dy = e.clientY - dragY;
  if (Math.hypot(dx, dy) > 10) dragMoved = true;

  const rect = cosmos.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const rx = e.clientX - cx, ry = e.clientY - cy;
  const r2 = rx * rx + ry * ry;
  const now = performance.now();
  const dt = Math.max(8, now - dragT) / 1000;
  if (r2 < 1) { dragX = e.clientX; dragY = e.clientY; dragT = now; return; }
  const dpa = (rx * dy - ry * dx) / r2;   // 1:1 wheel spin

  if (!desktopMQ.matches && focusF > 0.5) {
    /* focus mode: the same grab-and-spin, applied to the moon ring */
    ringScroll += dpa;
    ringVel = Math.max(-0.9, Math.min(0.9, dpa / dt));
  } else {
    const targets = !desktopMQ.matches ? [0]
      : (dragLane === null ? [0, 1, 2] : [dragLane]);
    const f = dragLane === null ? 0.35 : 1;
    targets.forEach(i => {
      scroll[i] += dpa * f;
      vel[i] = Math.max(-0.9, Math.min(0.9, (dpa * f) / dt));
    });
  }
  dragX = e.clientX;
  dragY = e.clientY;
  dragT = now;
});

function endDrag() { dragX = null; dragY = null; dragLane = null; }
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);

/* ================= mobile: pull down to refresh =================
   The solar system reserves vertical drags for rotation, so the browser's
   native pull-to-refresh can't trigger there. This adds the gesture to the
   top strip (identity + chips) instead, with a cache-busting reload. */
let pullY = null;
const pullHint = document.createElement('div');
pullHint.style.cssText = 'position:fixed;top:8px;left:50%;transform:translateX(-50%);' +
  'z-index:9999;padding:6px 14px;border-radius:999px;font:600 11px/1 system-ui,sans-serif;' +
  'letter-spacing:0.08em;color:#22162b;background:#6fffe9;opacity:0;transition:opacity 0.2s;' +
  'pointer-events:none';
pullHint.textContent = 'RELEASE TO REFRESH';
document.body.appendChild(pullHint);

window.addEventListener('pointerdown', e => {
  if (desktopMQ.matches) return;
  if (e.target.closest('.cosmos, .panel, .listview, .icon-btn')) return;
  pullY = e.clientY;
});
window.addEventListener('pointermove', e => {
  if (pullY === null) return;
  const dy = e.clientY - pullY;
  pullHint.style.opacity = dy > 30 ? '0.95' : '0';
  if (dy > 90) {
    pullY = null;
    pullHint.style.opacity = '0';
    location.href = location.pathname + '?v=' + Date.now();   // bust the Pages cache
  }
});
window.addEventListener('pointerup', () => { pullY = null; pullHint.style.opacity = '0'; });
window.addEventListener('pointercancel', () => { pullY = null; pullHint.style.opacity = '0'; });

/* ================= glow follower ================= */

function moveGlow(e) {
  const rect = cosmos.getBoundingClientRect();
  glow.style.left = (e.clientX - rect.left) + 'px';
  glow.style.top  = (e.clientY - rect.top) + 'px';
}

/* ================= keyboard ================= */

document.addEventListener('keydown', e => {
  if (!listview.hidden) {
    if (e.key === 'Escape') closeList();
    return;
  }
  if (e.target.matches?.('input, textarea')) return;
  if (e.key === '/') {
    e.preventDefault();
    openList();
    lvSearch.focus();
    return;
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  else if (e.key === 'Escape') selectHome();
  else if (e.key === 'Enter' && sel !== -1 && FLAT[sel].ref.url) window.open(FLAT[sel].ref.url, '_blank', 'noopener');
});

function step(dir) {
  const i = SEQ.indexOf(sel);
  const next = SEQ[Math.min(SEQ.length - 1, Math.max(0, i + dir))];
  if (next !== sel) select(next);
}

/* ================= the orrery loop =================
   One rAF loop drives everything:
   - planets: free-float the whole circumference (start angle + user scroll
     with inertia + slow continuous drift)
   - moons: a trailing line strung out behind the planet along its own
     lane, with a gentle breathing wobble for life
   - depth: bodies lower on screen are slightly bigger/brighter (pseudo-3D) */

function layout(t, dt) {
  const R = cosmosSize / 2;

  /* MOBILE focus mode: the selected planet zooms to the sun's spot and
     its moons form a revolving ring around it; everything else fades */
  const focused = !desktopMQ.matches && sel !== -1;
  const focusCi = focused ? FLAT[sel].ci : -1;
  focusF += ((focused ? 1 : 0) - focusF) * Math.min(1, dt * 4.5);
  if (focusF < 0.005) focusF = focused ? focusF : 0;
  const e = focusF * focusF * (3 - 2 * focusF);   // smoothstep ease
  /* focus ring: user rotation with inertia */
  ringScroll += ringVel * dt;
  ringVel *= Math.exp(-2.0 * dt);
  if (Math.abs(ringVel) < 0.0005) ringVel = 0;
  /* sun hands off to the planet mid-transition both ways, so neither
     ever feels absent */
  cosmos.classList.toggle('focus-mode', focusF > 0.35);

  CATS.forEach((cat, ci) => {
    /* lane spin physics */
    scroll[ci] += vel[ci] * dt;
    vel[ci] *= Math.exp(-2.0 * dt);
    if (Math.abs(vel[ci]) < 0.0005) vel[ci] = 0;

    const laneR = GEO.lanes[ci] * R;
    const isFocus = ci === focusCi;
    const ps = GEO.pscale || 1;

    /* planet: anywhere around the sun; all start stacked at 12 o'clock
       and hold there briefly before drifting apart */
    /* desktop: hovering a planet freezes that lane's motion */
    const paused = desktopMQ.matches && hoverLane === ci;
    if (paused) {
      vel[ci] = 0;
    } else {
      laneTime[ci] += dt;
    }
    const lt = Math.max(0, laneTime[ci]);
    let pa;
    if (!desktopMQ.matches) {
      /* one shared lane: planets evenly spaced (120deg), rotating together */
      const base = (CATS[0].start * Math.PI / 180) + scroll[0] + lt * CATS[0].drift
                 + CATS[0].sway.amp * Math.sin(lt * CATS[0].sway.f + CATS[0].sway.ph);
      pa = base + ci * (Math.PI * 2 / 3);
    } else {
      pa = (cat.start * Math.PI / 180) + scroll[ci] + lt * cat.drift
         + cat.sway.amp * Math.sin(lt * cat.sway.f + cat.sway.ph);
    }
    const bobSrc = desktopMQ.matches ? cat.bob : CATS[0].bob;
    const rr = laneR + bobSrc.amp * Math.sin(lt * bobSrc.f + bobSrc.ph);
    const dir = (desktopMQ.matches ? cat.drift : CATS[0].drift) >= 0 ? 1 : -1;
    const tilt = desktopMQ.matches ? 1 : TILT;
    let px, py, s, op, z;
    if (desktopMQ.matches) {
      px = Math.sin(pa) * rr;
      py = -Math.cos(pa) * rr;
      const norm = (py / R + 1) / 2;    // 0 = far/top, 1 = near/bottom
      s = 0.9 + 0.18 * norm;
      op = 0.72 + 0.28 * norm;
      z = 10 + Math.round(norm * 10);
    } else {
      /* 3D tilted plane: planets grow and brighten swinging around the
         front (bottom), shrink and slip behind the sun's glass at the back */
      const dn = (1 - Math.cos(pa)) / 2;          // 0 = far/back, 1 = near/front
      px = Math.sin(pa) * rr;
      py = -Math.cos(pa) * rr * tilt;
      s = 0.5 + 1.1 * dn;
      op = 0.25 + 0.75 * dn;
      if (dn < 0.22) {
        z = 4;                                    // behind the sun's glass
        op *= 0.35;
      } else {
        z = 10 + Math.round(dn * 20);
      }
    }
    let sF = s;                       // zoom scale (grows in focus)
    const w = worlds[ci];

    if (isFocus && e > 0) {
      /* zoom to center + grow to exactly the sun's on-screen size */
      const fx = px * (1 - e), fy = py * (1 - e);
      sF = (avatarEl.offsetWidth / 2) / ((cat.psize / 2) * ps);
      w.wrap.style.transform =
        `translate(${fx.toFixed(1)}px, ${fy.toFixed(1)}px) translate(-50%, -50%) scale(${sF.toFixed(3)})`;
      w.wrap.style.opacity = '1';
      w.wrap.style.zIndex = '30';
      w.wrap.style.pointerEvents = e > 0.6 ? '' : 'none';
      /* sun eclipse: a halo ~25% larger than the focused planet */
      const sunScale = 1.25;
      avatarEl.style.transform = `translate(-50%, -50%) scale(${sunScale.toFixed(3)})`;
    } else {
      w.wrap.style.transform =
        `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -50%) scale(${s.toFixed(3)})`;
      w.wrap.style.opacity = (op * (1 - e)).toFixed(3);
      w.wrap.style.zIndex = String(z);
      w.wrap.style.pointerEvents = e > 0.5 ? 'none' : '';
    }



    /* moons: trailing line behind the planet, along the same lane,
       uniform spacing derived from real sizes. Rigid: the whole line
       rotates together with the planet. */
    /* moons: half lead the planet, half trail behind it, all on the lane,
       uniform spacing derived from real sizes. Rigid: the whole formation
       rotates together with the planet.
       MOBILE ONLY: a planet's moons collapse into it unless that planet's
       section is the selected one (Info/home = all collapsed). */
    const mobileMoons = !desktopMQ.matches;
    const shown = !mobileMoons || (sel !== -1 && FLAT[sel].ci === ci);
    if (MOONSHOWN[ci] !== undefined && MOONSHOWN[ci] !== shown && mobileMoons) {
      cosmos.classList.add('moon-anim');
      clearTimeout(moonAnimTimer);
      moonAnimTimer = setTimeout(() => cosmos.classList.remove('moon-anim'), 450);
    }
    MOONSHOWN[ci] = shown;

    const moonR = 17 * ps, pad = 10 * ps;
    const step = (moonR * 2 + pad) / laneR;
    const first = ((cat.psize / 2) * ps + moonR + pad) / laneR;
    const nAhead = Math.ceil(cat.moons.length / 2);
    let iA = 0, iB = 0;
    cat.moons.forEach((m, mi) => {
      const el = w.moonEls[mi];
      if (!shown) {
        el.style.transform =
          `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) translate(-50%, -50%) scale(0)`;
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        return;
      }
      el.style.opacity = '1';
      el.style.pointerEvents = '';
      const ahead = mi < nAhead;
      const a = ahead
        ? pa + dir * (first + (iA++) * step)
        : pa - dir * (first + (iB++) * step);
      let mx, my, ms, mz, mOp = 1;
      if (!desktopMQ.matches) {
        const dnm = (1 - Math.cos(a)) / 2;        // 0 = far/back, 1 = near/front
        mx = Math.sin(a) * laneR;
        my = -Math.cos(a) * laneR * tilt;
        ms = 0.55 + 0.75 * dnm;
        mz = dnm < 0.22 ? 4 : 10 + Math.round(dnm * 20);
        if (dnm < 0.22) mOp = 0.45;               // ghosting behind the sun glass
      } else {
        mx = Math.sin(a) * laneR;
        my = -Math.cos(a) * laneR;
        const mnorm = (my / R + 1) / 2;
        ms = 0.85 + 0.2 * mnorm;
        mz = 10 + Math.round(mnorm * 10);
      }

      if (isFocus && e > 0) {
        /* swirl from the trail into a revolving ring around the center;
           moons grow to exactly main-screen planet size */
        const n = cat.moons.length;
        const planetHalfVis = ((cat.psize / 2) * ps) * sF;
        const moonVisR = (17 * ps) * (cat.psize / 34) * 1.18;
        const ringR = planetHalfVis + 10 + moonVisR;
        const ra = (mi * (Math.PI * 2) / n) + ci * 0.9 + ringScroll + t * 0.12 * dir;
        mx += (Math.sin(ra) * ringR - mx) * e;
        my += (-Math.cos(ra) * ringR - my) * e;
        ms += ((cat.psize / 34) * 1.18 - ms) * e;
        mOp = 1;   // ring moons sit at the center: never behind the sun's glass
        el.style.zIndex = '29';
      } else {
        el.style.zIndex = String(mz);
      }
      el.style.opacity = String(mOp);
      el.style.transform =
        `translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px) translate(-50%, -50%) scale(${ms.toFixed(3)})`;
    });
  });
}

let lastNow = performance.now();

function frame(now) {
  const dt = Math.min((now - lastNow) / 1000, 0.05);
  lastNow = now;
  layout(now / 1000, dt);
  requestAnimationFrame(frame);
}

/* ================= sizing ================= */

function measure() {
  cosmosSize = cosmos.getBoundingClientRect().width;
}

new ResizeObserver(() => {
  measure();
  syncGeometry();
  if (reducedMotion) layout(0, 0);
}).observe(cosmos);

/* ================= init ================= */

/* desktop: shuffle the three start slots (0/120/240) each load, so every
   visit opens with a unique arrangement */
{
  const slots = [0, 120, 240];
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  CATS.forEach((cat, i) => { cat.start = slots[i]; });
}

measure();
syncGeometry();
selectHome();

if (reducedMotion) {
  layout(0, 0);
} else {
  requestAnimationFrame(frame);
}
