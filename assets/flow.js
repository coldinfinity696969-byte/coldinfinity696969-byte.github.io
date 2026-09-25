/* ============ FLOW BETWEEN SECTIONS ============
   Scroll-linked links between the chapters of the page. Every effect is a few elements
   updated from one scroll handler, nothing runs while its part of the page is off screen.
   1. Headings rise word by word from under a mask when they come into view.
   2. The light services chapter does not start with a hard edge: it opens as a circle
      from the cursor (from the heading on phones) while it scrolls in.
   3. The services pipeline goes on after its last card: a wire runs out of «Контент-завод»
      down into «Проекты», a data packet follows the reader along it and lights the case cards.
      The link at the bottom of each service card scrolls to the work that shows it.
   4. «От брифа до сдачи»: a rail fills 01 → 04 with the scroll, a step lights up when it is reached. */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const NS = 'http://www.w3.org/2000/svg';
  const $ = s => document.querySelector(s);
  const vh = () => window.innerHeight;
  const ready = fn => (document.documentElement.classList.contains('is-ready') ? fn() : document.addEventListener('site:ready', fn, { once: true }));

  const updaters = [];            // called on scroll and resize, each one cheap
  let queued = false;
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; updaters.forEach(fn => fn()); }); } }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule, { passive: true });

  /* ---------- 1. headings: word by word ---------- */
  function splitWords(el) {
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          if (!n.textContent.trim()) return;
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
            const outer = document.createElement('span'), inner = document.createElement('span');
            outer.className = 'w'; inner.textContent = part;
            outer.appendChild(inner); frag.appendChild(outer);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    el.querySelectorAll('.w > span').forEach((s, i) => { s.style.transitionDelay = Math.min(i * 70, 560) + 'ms'; });
    el.classList.add('js-words');
  }
  if (!reduce) {
    const heads = [...document.querySelectorAll('.sec-title, .about-headline, .tools__title, .contact__title')];
    heads.forEach(splitWords);
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('words-in'); io.unobserve(e.target);
      }), { rootMargin: '0px 0px -12% 0px' });
      heads.forEach(h => io.observe(h));
    } else heads.forEach(h => h.classList.add('words-in'));
    const heroTitle = $('.hero__title');
    // two frames: the hidden state has to be painted once, or the words would just appear
    if (heroTitle) { splitWords(heroTitle); ready(() => requestAnimationFrame(() => requestAnimationFrame(() => heroTitle.classList.add('words-in')))); }
  }

  /* ---------- 2. services open as a circle ---------- */
  (function () {
    const sec = $('#services'), title = sec && sec.querySelector('.sec-title');
    if (!sec || !title || reduce) return;
    const veil = document.createElement('div');
    veil.className = 'svc-veil'; veil.setAttribute('aria-hidden', 'true');
    sec.insertBefore(veil, sec.firstChild);
    let px = null, cx = null, lastKey = '';
    if (fine) addEventListener('pointermove', e => { px = e.clientX; }, { passive: true });
    function update() {
      const r = sec.getBoundingClientRect(), H = vh();
      if (r.bottom < 0 || r.top > H) { if (lastKey !== 'off') { veil.classList.remove('on'); lastKey = 'off'; } return; }
      const p = clamp((H * 0.92 - r.top) / (H * 0.72), 0, 1);
      if (p >= 1) { if (lastKey !== 'done') { veil.classList.remove('on'); lastKey = 'done'; } return; }
      const t = title.getBoundingClientRect();
      const home = t.left - r.left + Math.min(t.width, 420) / 2;          // centre of the heading
      const want = px == null ? home : clamp(px - r.left, 0, r.width);
      cx = cx == null ? want : cx + (want - cx) * 0.18;
      if (Math.abs(want - cx) > 0.5) schedule();                          // let the circle catch up with the cursor
      const cy = t.top - r.top + t.height / 2;
      const R = Math.hypot(Math.max(cx, r.width - cx), H) + 60;
      const rad = R * Math.pow(p, 2.1);
      const key = cx.toFixed(0) + '|' + rad.toFixed(0);
      if (key === lastKey) return;
      lastKey = key;
      veil.classList.add('on');
      veil.style.background = 'radial-gradient(circle at ' + cx.toFixed(0) + 'px ' + cy.toFixed(0) + 'px, rgba(17,17,17,0) ' + rad.toFixed(1) + 'px, rgba(192,255,51,.55) ' + (rad + 1.5).toFixed(1) + 'px, rgba(17,17,17,.97) ' + (rad + 4).toFixed(1) + 'px, #111 ' + (rad + 60).toFixed(1) + 'px)';
    }
    updaters.push(update);
    update();
  })();

  /* ---------- 3. wire from the services into the cases ---------- */
  (function () {
    const sec = $('#services'), src = $('#svcCard5'), cases = $('#cases'), wrap = $('#casesWrap');
    if (!sec || !src || !cases || !wrap) return;
    const icon = src.querySelector('.svc-icon') || src;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'flow-wire'); svg.setAttribute('aria-hidden', 'true');
    const mk = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); (parent || svg).appendChild(n); return n; };
    const rail = mk('path', { fill: 'none', stroke: '#8fce2e', 'stroke-width': 1.5, 'stroke-opacity': 0.5, 'stroke-linecap': 'round' });
    const lit = mk('path', { fill: 'none', stroke: '#c0ff33', 'stroke-width': 2, 'stroke-linecap': 'round' });
    const portA = mk('circle', { r: 3.6, fill: '#fff', stroke: '#5fb800', 'stroke-width': 1.5 });
    const portB = mk('circle', { r: 3.6, fill: '#0a0a0a', stroke: '#c0ff33', 'stroke-width': 1.5 });
    const pack = mk('g', { opacity: 0 });
    mk('circle', { r: 10, fill: '#c0ff33', opacity: 0.3 }, pack);
    mk('circle', { r: 4, fill: '#c0ff33' }, pack);
    const chip = mk('g', { transform: 'translate(12 -9)', class: 'flow-chip' }, pack);
    mk('rect', { x: 0, y: 0, width: 58, height: 18, rx: 9, fill: '#0f140a', stroke: '#c0ff33', 'stroke-width': 1 }, chip);
    const label = mk('text', { x: 29, y: 12.4, 'text-anchor': 'middle', fill: '#c0ff33', 'font-size': 8.5, 'font-weight': 600, 'letter-spacing': '.12em', 'font-family': 'JetBrains Mono, monospace' }, chip);
    label.textContent = 'КЕЙСЫ';
    document.body.appendChild(svg);

    let top = 0, len = 0, sY = 0, eY = 1, lastP = -1, arrived = false;
    function rounded(pts, rad) {
      let d = 'M' + pts[0][0] + ' ' + pts[0][1];
      for (let i = 1; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
        const d1 = Math.hypot(x1 - x0, y1 - y0), d2 = Math.hypot(x2 - x1, y2 - y1), r = Math.min(rad, d1 / 2, d2 / 2);
        if (!d1 || !d2) continue;
        d += ' L' + (x1 - (x1 - x0) / d1 * r).toFixed(1) + ' ' + (y1 - (y1 - y0) / d1 * r).toFixed(1) +
             ' Q' + x1 + ' ' + y1 + ' ' + (x1 + (x2 - x1) / d2 * r).toFixed(1) + ' ' + (y1 + (y2 - y1) / d2 * r).toFixed(1);
      }
      const L = pts[pts.length - 1];
      return d + ' L' + L[0] + ' ' + L[1];
    }
    function build() {
      const sy = scrollY, S = sec.getBoundingClientRect(), C = src.getBoundingClientRect(), I = icon.getBoundingClientRect(), W = wrap.getBoundingClientRect();
      if (!C.width || !W.width) return;
      const gutter = Math.max(12, Math.round(parseFloat(getComputedStyle(sec).paddingLeft) / 2));
      const x0 = Math.round(I.left + I.width / 2), y0 = Math.round(C.bottom + sy);
      const y1 = Math.round(y0 + Math.min(52, (S.bottom - C.bottom) * 0.5));
      const y3 = Math.round(W.top + sy - 22), x4 = Math.round(W.left + 34), y4 = Math.round(W.top + sy + 1);
      top = y0 - 14;
      const pts = [[x0, y0], [x0, y1], [gutter, y1], [gutter, y3], [x4, y3], [x4, y4]].map(([x, y]) => [x, y - top]);
      svg.style.top = top + 'px';
      svg.style.height = (y4 - top + 16) + 'px';
      const d = rounded(pts, 14);
      rail.setAttribute('d', d); lit.setAttribute('d', d);
      len = lit.getTotalLength();
      lit.setAttribute('stroke-dasharray', len.toFixed(1) + ' ' + len.toFixed(1));
      portA.setAttribute('cx', pts[0][0]); portA.setAttribute('cy', pts[0][1]);
      portB.setAttribute('cx', pts[5][0]); portB.setAttribute('cy', pts[5][1]);
      sY = y0; eY = y4; lastP = -1;
      update();
    }
    function ping(cards, gap) {
      cards.forEach((c, i) => setTimeout(() => {
        c.classList.remove('is-ping'); void c.offsetWidth; c.classList.add('is-ping');
        setTimeout(() => c.classList.remove('is-ping'), 1100);
      }, i * gap));
    }
    function visibleCards() {
      const W = wrap.getBoundingClientRect();
      return [...wrap.querySelectorAll('.case-card')].filter(c => { const r = c.getBoundingClientRect(); return r.right > W.left + 8 && r.left < W.right - 8; });
    }
    function update() {
      if (!len) return;
      const p = reduce ? 1 : clamp((scrollY + vh() * 0.62 - sY) / (eY - sY), 0, 1);
      if (Math.abs(p - lastP) < 0.0005) return;
      lastP = p;
      lit.setAttribute('stroke-dashoffset', (len * (1 - p)).toFixed(1));
      const pt = lit.getPointAtLength(len * p);
      pack.setAttribute('transform', 'translate(' + pt.x.toFixed(1) + ' ' + pt.y.toFixed(1) + ')');
      pack.setAttribute('opacity', p > 0.01 && p < 0.985 && !reduce ? 1 : 0);
      portB.setAttribute('fill', p >= 0.985 ? '#c0ff33' : '#0a0a0a');
      if (p >= 0.985 && !arrived) { arrived = true; if (!reduce) ping(visibleCards(), 90); }
      else if (p < 0.9) arrived = false;
    }
    updaters.push(update);
    let bt = 0;
    const rebuild = () => { cancelAnimationFrame(bt); bt = requestAnimationFrame(build); };
    addEventListener('resize', rebuild, { passive: true });
    addEventListener('load', rebuild);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuild);
    if ('ResizeObserver' in window) { const ro = new ResizeObserver(rebuild); ro.observe(sec); ro.observe(cases); ro.observe(document.body); }
    build();

    /* the link under each service: go to its work and point at it */
    function goToCase(id) {
      const card = wrap.querySelector('.case-card[data-case="' + id + '"]');
      if (!card) return;
      cases.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      let doneScroll = false;
      const after = () => {
        if (doneScroll) return; doneScroll = true;
        const W = wrap.getBoundingClientRect(), R = card.getBoundingClientRect();
        wrap.scrollTo({ left: wrap.scrollLeft + R.left - W.left, behavior: reduce ? 'auto' : 'smooth' });
        setTimeout(() => ping([card], 0), reduce ? 0 : 420);
      };
      if ('onscrollend' in window) addEventListener('scrollend', after, { once: true });
      setTimeout(after, reduce ? 0 : 1100);
    }
    document.querySelectorAll('.svc-go[data-case]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); goToCase(a.dataset.case); }));
  })();

  /* ---------- 4. process rail ---------- */
  (function () {
    const grid = $('#processGrid');
    if (!grid) return;
    const fill = grid.querySelector('.process-rail i');
    const steps = [...grid.querySelectorAll('.process-step')];
    if (!fill || !steps.length) return;
    if (reduce) { steps.forEach(s => s.classList.add('lit')); return; }
    let lastKey = '';
    function update() {
      const G = grid.getBoundingClientRect(), H = vh();
      if (G.bottom < -50 || G.top > H + 50) return;
      const rects = steps.map(s => s.getBoundingClientRect());
      const vertical = Math.abs(rects[0].top - rects[rects.length - 1].top) > 4;
      grid.classList.toggle('is-vertical', vertical);
      let key;
      if (vertical) {
        // the rail tip follows a line at 62 % of the screen; a step lights once the tip passes its top
        const tip = clamp(H * 0.62 - G.top, 0, G.height);
        fill.style.transform = 'scaleY(' + (tip / G.height).toFixed(4) + ')';
        key = steps.map((s, i) => (rects[i].top - G.top + 36 <= tip ? 1 : 0)).join('');
      } else {
        const p = clamp((H * 0.86 - G.top) / (H * 0.5), 0, 1);
        fill.style.transform = 'scaleX(' + p.toFixed(4) + ')';
        const x = p * G.width;
        key = steps.map((s, i) => (rects[i].left - G.left + 30 <= x ? 1 : 0)).join('');
      }
      if (key === lastKey) return;
      lastKey = key;
      steps.forEach((s, i) => s.classList.toggle('lit', key[i] === '1'));
    }
    updaters.push(update);
    update();
  })();
})();
