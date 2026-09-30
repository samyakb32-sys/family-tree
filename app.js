(() => {
  'use strict';

  const CW = 170, CH = 84, GX = 26, GY = 100, RING = 40, PAD = 90, IND = 38, SG = 18, SY = 30;
  const GOLD = '#e9b949';
  const BRANCH = ['#ff6b81', '#2fd1a8', '#5b9bff', '#b980ff', '#ff9f43', '#4dd0e1'];

  const $ = (s) => document.querySelector(s);
  const vp = $('#vp'), world = $('#world'), cardsEl = $('#cards'), linesEl = $('#lines');
  const panel = $('#panel'), qEl = $('#q'), resEl = $('#results');
  cardsEl.style.setProperty('--cw', CW + 'px');
  cardsEl.style.setProperty('--ch', CH + 'px');

  /* ---------- data prep ---------- */
  const byId = {};
  let maxDepth = 0;
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
  const root = window.FAMILY;
  prep(root, null, 0, null);
  const all = Object.values(byId);
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
  const shown = new Set();

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

  function unitHTML(n) {
    const lvl = `<div class="sb">Generation ${n.depth + 1}</div>`;
    const av = (s) => `<div class="av">${s.trim()[0].toUpperCase()}</div>`;
    let h = `<div class="card" data-id="${n.id}" tabindex="0" role="button" aria-label="${n.name}">${av(n.name)}<div class="tx"><div class="nm">${n.name}</div>${lvl}</div></div>`;
    if (n.spouse) {
      h += `<div class="ring"><i>♥</i></div>`;
      h += `<div class="card spouse" data-id="${n.id}" data-sp="1" tabindex="0" role="button" aria-label="${n.spouse}">${av(n.spouse)}<div class="tx"><div class="nm">${n.spouse}</div><div class="sb">Spouse</div></div></div>`;
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
  function fit(animate = true) {
    const vw = innerWidth, vh = innerHeight, top = innerWidth < 720 ? 130 : 84, bot = innerWidth < 720 ? 70 : 20;
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
    const pw = panel.hidden || innerWidth < 720 ? 0 : 356;
    const k = Math.max(cam.k, innerWidth < 720 ? 0.75 : 0.95);
    cam.k = Math.min(k, 1.2);
    cam.x = (innerWidth - pw) / 2 - n.cx * cam.k;
    cam.y = innerHeight * (innerWidth < 720 ? 0.3 : 0.45) - (n.ty + CH / 2) * cam.k;
    apply(true);
  }

  // pan + pinch
  const ptrs = new Map(); let moved = 0, pinch = 0;
  vp.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.tog')) return;
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0;
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); }
    vp.classList.add('drag'); hideHint();
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
    e.preventDefault(); hideHint();
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
    showPanel(n); applyFocus();
    if (opts.focus !== false) focusOn(n);
  }
  function deselect() { sel = null; panel.hidden = true; applyFocus(); }

  function showPanel(n, isSpouse) {
    const c = n.color, kids = n.children, sibs = n.parent ? n.parent.children.filter((s) => s !== n) : [];
    const pill = (p) => `<span class="pill" data-go="${p.id}">${first(p.name) === p.name ? p.name : p.name}</span>`;
    const pathHTML = chain(n).map((p) => `<div data-go="${p.id}">${p.name}</div>`).join('');
    panel.style.setProperty('--c', c);
    panel.innerHTML = `
      <button class="x" aria-label="Close">×</button>
      <div class="p-head">
        <div class="p-av">${n.name[0].toUpperCase()}</div>
        <h2>${n.name}</h2>
        <span class="chip">Generation ${n.depth + 1}${n.branch ? ' · ' + n.branch.name + ' branch' : ''}</span>
      </div>
      <div class="nums">
        <div><b>${kids.length}</b><span>Santaan</span></div>
        <div><b>${countDesc(n)}</b><span>Vanshaj</span></div>
        <div><b>${sibs.length}</b><span>Bhai-behen</span></div>
      </div>
      ${n.spouse ? `<div class="p-sec"><h3>Jeevansathi</h3><div class="pills"><span class="pill static">♥ ${n.spouse}</span></div></div>` : ''}
      ${n.parent ? `<div class="p-sec"><h3>Mata-pita / Parent</h3><div class="pills">${pill(n.parent)}</div></div>` : ''}
      ${kids.length ? `<div class="p-sec"><h3>Santaan (${kids.length})</h3><div class="pills">${kids.map(pill).join('')}</div></div>` : ''}
      ${sibs.length ? `<div class="p-sec"><h3>Bhai-behen (${sibs.length})</h3><div class="pills">${sibs.map(pill).join('')}</div></div>` : ''}
      <div class="p-sec"><h3>Vansh ki line</h3><div class="path">${pathHTML}</div></div>`;
    panel.hidden = false;
  }

  /* ---------- interactions ---------- */
  cardsEl.addEventListener('click', (e) => {
    if (moved > 5) return;
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
  panel.addEventListener('click', (e) => {
    if (e.target.closest('.x')) return deselect();
    const g = e.target.closest('[data-go]'); if (g) select(byId[g.dataset.go]);
  });

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

  let hintGone = false;
  function hideHint() { if (!hintGone) { hintGone = true; $('#hint').classList.add('off'); } }
  setTimeout(hideHint, 9000);

  /* ---------- search ---------- */
  let hits = [], hi = 0;
  function search() {
    const q = qEl.value.trim().toLowerCase();
    if (!q) { resEl.hidden = true; return; }
    hits = [];
    all.forEach((n) => {
      if (n.name.toLowerCase().includes(q)) hits.push({ n, label: n.name, sub: `Generation ${n.depth + 1}` });
      if (n.spouse && n.spouse.toLowerCase().includes(q)) hits.push({ n, label: n.spouse, sub: `${first(n.name)} ke jeevansathi` });
    });
    hi = 0;
    resEl.innerHTML = hits.length
      ? hits.slice(0, 12).map((h, i) => `<li data-i="${i}" class="${i === 0 ? 'on' : ''}">${h.label}<small>${h.sub}</small></li>`).join('')
      : '<li class="none">Koi nahi mila</li>';
    resEl.hidden = false;
  }
  function go(i) {
    const h = hits[i]; if (!h) return;
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
    else if (e.key === 'Escape') deselect();
  });
  let lw = innerWidth; addEventListener('resize', () => { if (innerWidth !== lw) { lw = innerWidth; fit(false); } });

  /* ---------- stats ---------- */
  const people = all.length + all.filter((n) => n.spouse).length;
  const branches = new Set(all.filter((n) => n.branch).map((n) => n.branch.i)).size;
  $('#stats').innerHTML = [[people, 'Sadasya'], [maxDepth + 1, 'Peedhiyan'], [branches, 'Shakha']]
    .map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('');

  /* ---------- go ---------- */
  render(true);
  fit(false);
  if (innerWidth < 720) { // phones: start readable, centred on the top of the tree
    cam.k = 0.8; cam.x = innerWidth / 2 - root.cx * cam.k; cam.y = 130 - PAD * cam.k; apply(false);
  }
  window.__tree = { select: (id) => select(byId[id]), byId };
})();
