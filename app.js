(() => {
  'use strict';

  const CW = 170, CH = 84, GX = 26, GY = 100, RING = 40, PAD = 90, IND = 38, SG = 18, SY = 30;
  const GOLD = '#e9b949';
  const BRANCH = ['#ff6b81', '#2fd1a8', '#5b9bff', '#b980ff', '#ff9f43', '#4dd0e1'];

  const $ = (s) => document.querySelector(s);
  const vp = $('#vp'), world = $('#world'), cardsEl = $('#cards'), linesEl = $('#lines');
  const qEl = $('#q'), resEl = $('#results');
  cardsEl.style.setProperty('--cw', CW + 'px');
  cardsEl.style.setProperty('--ch', CH + 'px');

  /* ---------- data prep ---------- */
  const shown = new Set();
  let byId = {}, all = [], root = null, maxDepth = 0;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const EDIT = location.hash === '#edit'; // edit tools are only shown with #edit in the URL
  const DRAFT = 'ft-draft';
  function load(data) {
    byId = {}; maxDepth = 0; shown.clear(); cardsEl.innerHTML = '';
    root = JSON.parse(JSON.stringify(data)); prep(root, null, 0, null);
    all = Object.values(byId); renderInfo();
  }
  function prep(n, parent, depth, branch) {
    n.parent = parent; n.depth = depth; n.children = n.children || [];
    if (depth === 2) { // children of Narayan start a branch
      const i = parent.children.indexOf(n);
      branch = { i, color: BRANCH[i % BRANCH.length], name: n.name.split(' ')[0] };
    }
    n.branch = branch || null;
    n.color = n.branch ? n.branch.color : GOLD;
    n.collapsed = false;
    byId[n.id] = n; maxDepth = Math.max(maxDepth, depth);
    n.children.forEach((c) => prep(c, n, depth + 1, branch));
  }
  const countDesc = (n) => n.children.reduce((s, c) => s + 1 + countDesc(c), 0);
  const first = (s) => s.split(' ')[0];

  /* ---------- layout ---------- */
  function measure(n) {
    n.uw = n.spouse ? 2 * CW + RING : CW;
    n.kids = n.collapsed ? [] : n.children;
    n.kids.forEach(measure);
    // all-leaf children (2+) are stacked as a vertical list, like the hand-drawn tree
    n.stack = n.kids.length > 1 && n.kids.every((k) => !k.children.length && !k.spouse);
    if (n.stack) { n.kw = 0; n.sw = n.uw + IND; return; }
    const kw = n.kids.reduce((s, k) => s + k.sw, 0) + GX * Math.max(0, n.kids.length - 1);
    n.sw = Math.max(n.uw, kw); n.kw = kw;
  }
  function place(n, left, d) {
    n.vis = true; n.ty = d * (CH + GY) + PAD;
    if (n.stack) {
      n.cx = left + n.uw / 2; n.left = left;
      n.kids.forEach((k, i) => {
        k.vis = true; k.cx = left + IND + CW / 2;
        k.ty = n.ty + CH + SY + i * (CH + SG);
      });
      return;
    }
    n.cx = left + n.sw / 2;
    let x = left + (n.sw - n.kw) / 2;
    n.kids.forEach((k) => { place(k, x, d + 1); x += k.sw + GX; });
  }
  let W = 0, H = 0;

  function render(first_) {
    all.forEach((n) => (n.vis = false));
    measure(root); place(root, PAD, 0);
    let bottom = 0; all.forEach((n) => n.vis && (bottom = Math.max(bottom, n.ty + CH)));
    W = root.sw + PAD * 2; H = bottom + PAD;
    world.style.width = W + 'px'; world.style.height = H + 'px';
    linesEl.setAttribute('width', W); linesEl.setAttribute('height', H);

    // lines
    let svg = '';
    all.forEach((p) => {
      if (!p.vis) return;
      p.kids.forEach((c) => {
        if (p.stack) {
          const sx = p.left + 18, sy = p.ty + CH, ey = c.ty + CH / 2, ex = c.cx - CW / 2, r = 12;
          svg += `<path class="ln" data-c="${c.id}" pathLength="1" style="--c:${c.color};--d:${(0.25 + p.depth * 0.18).toFixed(2)}s" d="M${sx} ${sy}V${ey - r}Q${sx} ${ey} ${sx + r} ${ey}H${ex}"/>`;
          return;
        }
        const sx = p.cx, sy = p.spouse ? p.ty + CH / 2 : p.ty + CH;
        const ex = c.spouse ? c.cx - c.uw / 2 + CW / 2 : c.cx, ey = c.ty;
        const my = (sy + ey) / 2 + (p.spouse ? CH / 4 : 0);
        svg += `<path class="ln" data-c="${c.id}" pathLength="1" style="--c:${c.color};--d:${(0.25 + p.depth * 0.18).toFixed(2)}s" d="M${sx} ${sy}C${sx} ${my},${ex} ${my},${ex} ${ey}"/>`;
      });
    });
    linesEl.innerHTML = svg;

    // cards
    all.forEach((n) => {
      let el = n.el;
      if (!n.vis) { if (el) el.style.display = 'none'; shown.delete(n.id); return; }
      if (!el) {
        el = n.el = document.createElement('div');
        el.className = 'unit'; el.dataset.id = n.id;
        el.style.setProperty('--c', n.color);
        el.style.width = n.uw + 'px'; el.style.height = CH + 'px';
        el.innerHTML = unitHTML(n);
        cardsEl.appendChild(el);
      }
      const fresh = !shown.has(n.id);
      el.style.display = '';
      el.style.left = n.cx - n.uw / 2 + 'px'; el.style.top = n.ty + 'px';
      el.classList.toggle('open', !n.collapsed);
      const tog = el.querySelector('.tog');
      if (tog) tog.querySelector('em').textContent = n.collapsed ? '+' + countDesc(n) : '';
      el.querySelectorAll('.card').forEach((c) => {
        c.style.setProperty('--d', fresh ? (first_ ? n.depth * 0.16 : 0.12) + 's' : '0s');
        if (fresh) { c.style.animationName = 'none'; void c.offsetWidth; c.style.animationName = ''; }
        else c.style.animation = 'none';
      });
      shown.add(n.id);
    });
    applyFocus();
  }

  const ICON = {
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/>',
    addc: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M19 8v6M16 11h6"/>',
    addsp: '<path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z"/>',
    del: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  };
  const TIP = { edit: 'Naam badlo', editsp: 'Naam badlo', addc: 'Bachcha jodo', addsp: 'Jeevansathi jodo', delsp: 'Jeevansathi hatao', del: 'Delete karo' };
  // edit mode only: small action bar sitting on top of each card
  const acts = (cls, list) => !EDIT ? '' : `<div class="acts ${cls}">${list.map(([a, ic]) =>
    `<button data-act="${a}" title="${TIP[a]}" aria-label="${TIP[a]}"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[ic]}</svg></button>`).join('')}</div>`;

  function unitHTML(n) {
    const lvl = `<div class="sb">Generation ${n.depth + 1}</div>`;
    const av = (s) => `<div class="av">${esc((s.trim()[0] || '?').toUpperCase())}</div>`;
    let h = `<div class="card" data-id="${n.id}" tabindex="0" role="button" aria-label="${esc(n.name)}">${av(n.name)}<div class="tx"><div class="nm">${esc(n.name)}</div>${lvl}</div></div>`;
    h += acts('', [['edit', 'edit'], ['addc', 'addc'], ...(n.spouse ? [] : [['addsp', 'addsp']]), ...(n.parent ? [['del', 'del']] : [])]);
    if (n.spouse) {
      h += `<div class="ring"><i>♥</i></div>`;
      h += `<div class="card spouse" data-id="${n.id}" data-sp="1" tabindex="0" role="button" aria-label="${esc(n.spouse)}">${av(n.spouse)}<div class="tx"><div class="nm">${esc(n.spouse)}</div><div class="sb">Spouse</div></div></div>`;
      h += acts('sp', [['editsp', 'edit'], ['addc', 'addc'], ['delsp', 'del']]);
    }
    if (n.children.length) {
      h += `<button class="tog" data-tog="${n.id}" aria-label="Expand or collapse"><svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3.5l3 3 3-3"/></svg><em></em></button>`;
    }
    return h;
  }

  /* ---------- camera ---------- */
  const cam = { k: 1, x: 0, y: 0 };
  const K_MIN = 0.12, K_MAX = 2.2;
  function apply(animate) {
    if (animate) { world.classList.add('animate'); clearTimeout(apply.t); apply.t = setTimeout(() => world.classList.remove('animate'), 700); }
    else world.classList.remove('animate');
    world.style.transform = `translate(${cam.x}px,${cam.y}px) scale(${cam.k})`;
    vp.style.backgroundSize = `${28 * cam.k}px ${28 * cam.k}px`;
    vp.style.backgroundPosition = `${cam.x}px ${cam.y}px`;
  }
  const topOff = () => Math.max(innerWidth < 720 ? 130 : 84, $('#top').getBoundingClientRect().bottom + 8);
  function fit(animate = true) {
    const vw = innerWidth, vh = innerHeight, top = topOff(), bot = innerWidth < 720 ? 70 : 20;
    const rm = vw < 720 ? 0 : 76;
    const k = Math.min((vw - 20 - rm) / W, (vh - top - bot) / H, 1.15);
    cam.k = Math.max(K_MIN, k);
    cam.x = (vw - rm - W * cam.k) / 2;
    cam.y = top + (vh - top - bot - H * cam.k) / 2;
    apply(animate);
  }
  function zoomAt(f, px, py, animate) {
    const k = Math.min(K_MAX, Math.max(K_MIN, cam.k * f)), r = k / cam.k;
    cam.x = px - (px - cam.x) * r; cam.y = py - (py - cam.y) * r; cam.k = k;
    apply(animate);
  }
  function focusOn(n) {
    const k = Math.max(cam.k, innerWidth < 720 ? 0.75 : 0.95);
    cam.k = Math.min(k, 1.2);
    cam.x = innerWidth / 2 - n.cx * cam.k;
    cam.y = innerHeight * (innerWidth < 720 ? 0.3 : 0.45) - (n.ty + CH / 2) * cam.k;
    apply(true);
  }

  // pan + pinch
  const ptrs = new Map(); let moved = 0, pinch = 0;
  vp.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.tog')) { moved = 0; return; }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0;
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); }
    vp.classList.add('drag');
  });
  addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    if (ptrs.size === 1) {
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 5) { cam.x += dx; cam.y += dy; apply(false); }
    } else if (ptrs.size === 2) {
      p.x = e.clientX; p.y = e.clientY;
      const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch) zoomAt(d / pinch, (a.x + b.x) / 2, (a.y + b.y) / 2, false);
      pinch = d; moved = 99; return;
    }
    p.x = e.clientX; p.y = e.clientY;
  });
  const up = (e) => { ptrs.delete(e.pointerId); pinch = 0; if (!ptrs.size) vp.classList.remove('drag'); };
  addEventListener('pointerup', up); addEventListener('pointercancel', up);
  vp.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0016)), e.clientX, e.clientY, false);
  }, { passive: false });

  /* ---------- selection / focus ---------- */
  let sel = null;
  const chain = (n) => { const a = []; for (let p = n; p; p = p.parent) a.unshift(p); return a; };
  function inSubtree(n, top) { for (let p = n; p; p = p.parent) if (p === top) return true; return false; }

  function applyFocus() {
    const anc = sel ? new Set(chain(sel).map((x) => x.id)) : null;
    all.forEach((n) => {
      if (!n.el) return;
      const related = !sel || anc.has(n.id) || inSubtree(n, sel);
      n.el.classList.toggle('dim', !related);
      n.el.querySelectorAll('.card').forEach((c) => c.classList.toggle('sel', !!sel && sel.id === n.id && !c.dataset.sp));
    });
    linesEl.querySelectorAll('.ln').forEach((l) => {
      const c = byId[l.dataset.c];
      l.classList.toggle('hot', !!sel && anc.has(c.id));
      l.classList.toggle('dim', !!sel && !(anc.has(c.id) || inSubtree(c, sel)));
    });
  }

  function select(n, opts = {}) {
    sel = n;
    // make sure every ancestor is expanded
    let changed = false;
    for (let p = n.parent; p; p = p.parent) if (p.collapsed) { p.collapsed = false; changed = true; }
    if (changed) render(false);
    applyFocus();
    if (opts.focus !== false) focusOn(n);
  }
  function deselect() { sel = null; applyFocus(); }

  /* ---------- edit mode (owner only: open the site with #edit) ---------- */
  function ser(n) {
    const o = { id: n.id, name: n.name };
    if (n.spouse) o.spouse = n.spouse;
    if (n.children.length) o.children = n.children.map(ser);
    return o;
  }
  function commit(selectId) {
    const data = ser(root), shut = new Set(all.filter((n) => n.collapsed).map((n) => n.id));
    try { localStorage.setItem(DRAFT, JSON.stringify(data)); } catch (_) {}
    sel = null; load(data); all.forEach((n) => (n.collapsed = shut.has(n.id))); render(false);
    if (selectId && byId[selectId]) select(byId[selectId], { focus: false });
  }
  const ask = (msg, val) => { const v = prompt(msg, val); return v === null ? '' : v.replace(/\s+/g, ' ').trim().slice(0, 80); };
  function editAct(act, n) {
    if (act === 'edit' || act === 'editsp') {
      const nm = ask('Naam?', act === 'edit' ? n.name : n.spouse); if (!nm) return;
      if (act === 'edit') n.name = nm; else n.spouse = nm;
      commit(n.id);
    } else if (act === 'addc') {
      const nm = ask('Bachche ka naam?'); if (!nm) return;
      const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      n.children.push({ id, name: nm, children: [] }); commit(id);
    } else if (act === 'addsp') {
      const nm = ask('Jeevansathi ka naam?'); if (!nm) return;
      n.spouse = nm; commit(n.id);
    } else if (act === 'delsp') {
      if (!confirm(`"${n.spouse}" ko hata dena hai?`)) return;
      delete n.spouse; commit(n.id);
    } else if (act === 'del') {
      const c = countDesc(n);
      if (!confirm(`"${n.name}" ko delete karna hai?` + (c ? `\nUnke ${c} vanshaj bhi hat jayenge.` : ''))) return;
      n.parent.children = n.parent.children.filter((x) => x !== n); commit(n.parent.id);
    }
  }
  async function sha(s) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bhadke-tree:' + s));
    return [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, '0')).join('');
  }
  // Asks for the edit password before anything is exported ("finishing" an edit).
  async function unlocked() {
    if (!(window.crypto && crypto.subtle)) { alert('Password check ke liye https (GitHub Pages) chahiye.'); return false; }
    const want = window.PASS_HASH;
    if (!want) {
      const pw = prompt('Abhi koi password set nahi hai. Naya password chuno (kam se kam 6 akshar):');
      if (!pw) return false;
      if (pw.length < 6) { alert('Password bahut chhota hai.'); return false; }
      const line = `window.PASS_HASH = '${await sha(pw)}';`;
      prompt('Is line ko GitHub par auth.js me paste karke commit karo, phir password active ho jayega:', line);
      return false;
    }
    const pw = prompt('Edit password daalo:');
    if (pw === null) return false;
    if ((await sha(pw)) === want) return true;
    alert('Galat password.'); return false;
  }
  function exportData() {
    return '// Bhadke family data — generated from edit mode.\nwindow.FAMILY = ' + JSON.stringify(ser(root), null, 2) + ';\n';
  }
  if (EDIT) {
    const bar = document.createElement('div');
    bar.className = 'editbar';
    bar.innerHTML = `<b>Edit mode</b><span>Har card ke upar buttons hain: naam badlo, bachcha jodo, jeevansathi jodo, delete. Badlav sirf aapke browser me hain — sab ko dikhane ke liye Export karke data.js GitHub par daalo.</span>
      <button data-bar="exp">Export data.js</button><button data-bar="copy">Copy</button><button data-bar="reset">Reset</button>`;
    document.body.appendChild(bar);
    bar.addEventListener('click', async (e) => {
      const k = e.target.closest('[data-bar]'); if (!k) return;
      if (!(await unlocked())) return;
      if (k.dataset.bar === 'exp') {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([exportData()], { type: 'text/javascript' }));
        a.download = 'data.js'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      } else if (k.dataset.bar === 'copy') {
        (navigator.clipboard ? navigator.clipboard.writeText(exportData()) : Promise.reject()).then(
          () => { k.textContent = 'Copied!'; setTimeout(() => (k.textContent = 'Copy'), 1500); },
          () => prompt('Ye copy karo:', exportData()));
      } else if (confirm('Saare draft badlav hata ke original data.js par wapas jaana hai?')) {
        try { localStorage.removeItem(DRAFT); } catch (_) {}
        sel = null; load(window.FAMILY); render(false); fit(true);
      }
    });
  }

  /* ---------- interactions ---------- */
  cardsEl.addEventListener('click', (e) => {
    if (moved > 5) return;
    const act = e.target.closest('[data-act]');
    if (act) return editAct(act.dataset.act, byId[act.closest('.unit').dataset.id]);
    const tog = e.target.closest('.tog');
    if (tog) {
      const n = byId[tog.dataset.tog]; n.collapsed = !n.collapsed;
      render(false); return;
    }
    const card = e.target.closest('.card');
    if (card) select(byId[card.dataset.id], { focus: false });
  });
  cardsEl.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('card')) { e.preventDefault(); select(byId[e.target.dataset.id]); }
  });
  vp.addEventListener('click', (e) => { if (moved <= 5 && !e.target.closest('.unit')) deselect(); });

  $('#zin').onclick = () => zoomAt(1.3, innerWidth / 2, innerHeight / 2, true);
  $('#zout').onclick = () => zoomAt(1 / 1.3, innerWidth / 2, innerHeight / 2, true);
  $('#fit').onclick = () => fit(true);
  $('#expand').onclick = () => { all.forEach((n) => (n.collapsed = false)); render(false); fit(true); };
  $('#collapse').onclick = () => { all.forEach((n) => (n.collapsed = n.depth >= 1 && n.children.length > 0)); render(false); fit(true); };

  const themeBtn = $('#theme'), docEl = document.documentElement;
  try { const t = localStorage.getItem('ft-theme'); if (t) docEl.dataset.theme = t; } catch (_) {}
  themeBtn.onclick = () => {
    const t = docEl.dataset.theme === 'light' ? 'dark' : 'light'; docEl.dataset.theme = t;
    try { localStorage.setItem('ft-theme', t); } catch (_) {}
  };

  /* ---------- search ---------- */
  let hits = [], hi = 0;
  function search() {
    const q = qEl.value.trim().toLowerCase();
    if (!q) { resEl.hidden = true; return; }
    hits = [];
    all.forEach((n) => {
      if (n.name.toLowerCase().includes(q)) hits.push({ n, label: n.name, sub: `Generation ${n.depth + 1}` });
      if (n.spouse && n.spouse.toLowerCase().includes(q)) hits.push({ n, label: n.spouse, sub: `${esc(first(n.name))} ke jeevansathi` });
    });
    hi = 0;
    resEl.innerHTML = hits.length
      ? hits.slice(0, 12).map((h, i) => `<li data-i="${i}" class="${i === 0 ? 'on' : ''}">${esc(h.label)}<small>${h.sub}</small></li>`).join('')
      : '<li class="none">Koi nahi mila</li>';
    resEl.hidden = false;
  }
  function go(i) {
    const h = hits[i]; if (!h) return;
    view('tree');
    resEl.hidden = true; qEl.value = ''; qEl.blur();
    select(h.n);
    const cards = h.n.el && h.n.el.querySelectorAll('.card');
    if (cards) { const c = h.label === h.n.spouse ? cards[1] : cards[0]; if (c) { c.classList.remove('match'); void c.offsetWidth; c.classList.add('match'); } }
  }
  qEl.addEventListener('input', search);
  qEl.addEventListener('keydown', (e) => {
    const items = [...resEl.querySelectorAll('li[data-i]')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault(); if (!items.length) return;
      hi = (hi + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items.forEach((li, i) => li.classList.toggle('on', i === hi));
    } else if (e.key === 'Enter') go(hi);
    else if (e.key === 'Escape') { resEl.hidden = true; qEl.blur(); }
  });
  resEl.addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) go(+li.dataset.i); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) resEl.hidden = true; });

  addEventListener('keydown', (e) => {
    if (e.target === qEl) return;
    if (e.key === '/') { e.preventDefault(); qEl.focus(); }
    else if (e.key === '+' || e.key === '=') $('#zin').click();
    else if (e.key === '-') $('#zout').click();
    else if (e.key === '0') fit(true);
    else if (e.key === 'Escape') { view('tree'); deselect(); }
  });
  let lw = innerWidth; addEventListener('resize', () => { if (!info.hidden) info.style.paddingTop = padTop() + 'px'; if (innerWidth !== lw) { lw = innerWidth; fit(false); } });

  /* ---------- tree analysis: Path / Analysis / Generations / Statistics ---------- */
  const ST = window.STUDENT || {};
  const GEN = [BRANCH[2], BRANCH[3], BRANCH[1], BRANCH[4], BRANCH[0], BRANCH[5]];
  const ord = (n) => n + (['th', 'st', 'nd', 'rd'][n] || 'th');
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
  const icon = (p) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
  const section = (id, title, sub, body) => { $('#' + id).innerHTML = `<h2>${title}</h2><p class="sub">${sub}</p>${body}`; };
  const acard = (c, title, desc, body) => `<div class="acard" style="--c:${c}"><h3><i></i>${title}</h3><p>${desc}</p>${body}</div>`;

  $('#who').innerHTML = ST.name
    ? `<span class="pill"><em>Name:</em><b>${esc(ST.name)}</b>${ST.usn ? `<span class="sep"></span><em>USN:</em><code>${esc(ST.usn)}</code>` : ''}</span><span class="pill tae">TAE-II DMGT</span>`
    : '<span class="pill tae">TAE-II DMGT</span>';

  // everything below is computed from the tree itself, so it follows edits made in #edit mode
  function renderInfo() {
    const me = byId[ST.meId], path = me ? chain(me) : [], on = new Set(path.map((n) => n.id)), edges = path.length - 1;
    const leaves = all.filter((n) => !n.children.length), inner = all.filter((n) => n.children.length);
    const maxDeg = Math.max(0, ...inner.map((n) => n.children.length));
    const levels = Array.from({ length: maxDepth + 1 }, (_, d) => all.filter((n) => n.depth === d));
    const longest = chain(all.find((n) => n.depth === maxDepth));
    const arrow = (p) => p.map((n) => esc(first(n.name))).join(' → ');
    const names = (l) => l.map((n) => esc(n.name)).join(', ');
    const chip = (n, x = '') => `<span class="chip${on.has(n.id) ? ' on' : ''}">${esc(n.name)}${x}</span>`;
    const spouses = all.filter((n) => n.spouse).length;

    section('sec-path', me ? `My Path — Root to ${esc(first(me.name))}` : 'My Path',
      me ? `The unique path from the root node to me, traversing ${plural(edges, 'edge')} through ${plural(path.length, 'node')}` : 'student.js me meId ko data.js ke kisi person ke id par set karo.',
      `<div class="chain">${path.map((n, i) => `${i ? `<div class="edge"><i></i>Edge ${i}<i></i></div>` : ''}<div class="pnode"><b>${esc(n.name)}</b><small>Level ${n.depth}</small></div>`).join('')}</div>`);

    section('sec-analysis', 'Tree Analysis',
      'Mathematical properties computed from the tree data structure' + (spouses ? '<br><small>Jeevansathi (spouse) tree ka node nahi hote — sirf vanshaj nodes count hote hain.</small>' : ''),
      `<div class="grid">${[
        acard('#5b9bff', 'Root Node', 'The topmost node with no parent. Every tree has exactly one root.', `<div class="box mono">${esc(root.name)} (Level 0)</div>`),
        acard('#b980ff', 'Height of Tree', 'The length of the longest root-to-leaf path, counted in edges.', `<div class="box"><div class="big">${maxDepth}</div><small>Path: ${arrow(longest)} = ${plural(maxDepth, 'edge')}</small></div>`),
        acard('#4dd0e1', 'Levels', 'Distance from the root. Root = Level 0.', `<div class="box">${levels.map((l, d) => `<div class="lv"><code>Level ${d}:</code> ${names(l)}</div>`).join('')}</div>`),
        acard('#ff9f43', 'Degree of Internal Nodes', `The number of children each internal node has. Max degree = ${maxDeg}.`, `<div class="box scroll">${inner.map((n) => `<div class="row${on.has(n.id) ? ' on' : ''}"><span>${esc(n.name)}</span><em>degree(${n.children.length})</em></div>`).join('')}</div>`),
        acard('#2fd1a8', 'Leaf Nodes <small>(degree = 0)</small>', `Nodes with no children. Count: ${leaves.length}`, `<div class="box chips">${leaves.map((n) => chip(n, n === me ? ' (ME)' : '')).join('')}</div>`),
        acard('#ff6b81', 'Internal Nodes <small>(degree &gt; 0)</small>', `Nodes with at least one child. Count: ${inner.length}`, `<div class="box chips">${inner.map((n) => chip(n, ` (${n === root ? 'Root' : 'Internal Node'}, degree ${n.children.length})`)).join('')}</div>`),
        acard('#8ea2ff', 'Sibling Groups', 'Nodes sharing the same parent are siblings.', `<div class="box">${inner.filter((n) => n.children.length > 1).map((n) => `<div class="sg">Parent: <b>${esc(n.name)}</b><br><span>Siblings: ${names(n.children)}</span></div>`).join('')}</div>`),
        me ? acard(GOLD, 'My Path (Root to ME)', `The unique path from the root to ${esc(me.name)}. Length = ${plural(edges, 'edge')}.`, `<div class="box"><div class="mono"><b>${arrow(path)}</b></div>${path.slice(1).map((n, i) => `<small>Edge ${i + 1}: ${esc(first(path[i].name))} → ${esc(first(n.name))}</small>`).join('<br>')}</div>`) : '',
      ].join('')}</div>`);

    section('sec-gen', 'Family Generations', 'Each level of the tree represents a generation',
      levels.map((l, d) => `<div class="gen" style="--c:${GEN[d % GEN.length]}"><header><h3><i></i>${ord(d + 1)} Generation</h3><span><code class="lvl">Level ${d}</code><small>${plural(l.length + l.filter((n) => n.spouse).length, 'member')}</small></span></header><div class="chips">${
        l.map((n) => chip(n, n === me ? '<b class="me">ME</b>' : on.has(n.id) ? ' •' : '') + (n.spouse ? `<span class="chip sp">♥ ${esc(n.spouse)}</span>` : '')).join('')}</div></div>`).join(''));

    const tiles = [
      ['#5b9bff', all.length, 'Total Nodes', 'Family members in the tree', '<circle cx="12" cy="8" r="3"/><circle cx="5.5" cy="10" r="2.2"/><circle cx="18.5" cy="10" r="2.2"/><path d="M6 19c0-3.3 2.7-5 6-5s6 1.7 6 5"/>'],
      ['#2fd1a8', leaves.length, 'Leaf Nodes', 'Members with no children', '<circle cx="12" cy="12" r="3"/>'],
      ['#ff9f43', inner.length, 'Internal Nodes', 'Members with children', '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 12h5l1 2h4l1-2h5"/>'],
      ['#b980ff', maxDepth, 'Tree Height', 'Longest root-to-leaf path (edges)', '<path d="M4 6h10M4 11h7M4 16h5M18 20V6m0 0l-3 3m3-3l3 3"/>'],
      ['#4dd0e1', maxDepth + 1, 'Generations', `Total depth levels (Level 0 to Level ${maxDepth})`, '<path d="M4 7h16M4 12h16M4 17h16"/>'],
      ['#ff6b81', maxDeg, 'Max Degree', 'Most children any node has', '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 16v-3M12 16V9M16 16v-5"/>'],
      me && [GOLD, me.depth, 'My Level', `${esc(first(me.name))}'s level in the tree`, '<path d="M12 21s-6-5.3-6-10a6 6 0 0112 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2"/>'],
      ['#ff8fb0', all.length + spouses, 'Members', 'Nodes + jeevansathi (spouses)', ICON.addsp],
    ].filter(Boolean);
    section('sec-stats', 'Family Statistics', 'Auto-calculated metrics from the family tree data structure',
      `<div class="tiles">${tiles.map(([c, v, l, d, p]) => `<div class="tile" style="--c:${c}">${icon(p)}<b>${v}</b><strong>${l}</strong><small>${d}</small></div>`).join('')}</div>`);
  }

  /* ---------- section switcher (header nav) ---------- */
  const info = $('#info'), navEl = $('#nav');
  const padTop = () => $('#top').offsetHeight + 38;
  const setNav = (id) => navEl.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === id));
  function view(id) {
    const tree = id === 'tree', was = info.hidden;
    info.hidden = tree; document.body.classList.toggle('info-on', !tree); setNav(id);
    if (tree) return;
    info.style.paddingTop = padTop() + 'px';
    info.scrollTo({ top: $('#' + id).offsetTop - padTop(), behavior: was ? 'auto' : 'smooth' });
  }
  navEl.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) view(b.dataset.v); });
  info.addEventListener('scroll', () => {
    const y = info.scrollTop + padTop() + 40; let cur = info.querySelector('.sec');
    info.querySelectorAll('.sec').forEach((s) => { if (s.offsetTop <= y) cur = s; });
    if (info.scrollTop + info.clientHeight >= info.scrollHeight - 4) cur = info.querySelector('.sec:last-child');
    setNav(cur.id);
  });

  /* ---------- go ---------- */
  let start = window.FAMILY;
  if (EDIT) { try { const d = localStorage.getItem(DRAFT); if (d) start = JSON.parse(d); } catch (_) {} }
  load(start);
  render(true);
  fit(false);
  if (innerWidth < 720) { // phones: start readable, centred on the top of the tree
    cam.k = 0.8; cam.x = innerWidth / 2 - root.cx * cam.k; cam.y = topOff() - PAD * cam.k; apply(false);
  }
  window.__tree = { select: (id) => select(byId[id]), byId };
})();
