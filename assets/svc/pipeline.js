/* ============ SERVICES PIPELINE ============
   The five service cards work as one live automation:
   every few seconds a data packet leaves "Strategy", runs along the wires to the
   next cards, the target node flashes and the card's own mini-scene reacts.
   Mini-scenes are drawn in SVG from code (no generated pictures):
   radar audit, pixel generation, AI-agent workflow, code -> site, content conveyor. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const C = {
    line: '#9bd84a', flow: '#5fb800', head: '#6fd000', lime: '#c0ff33', dark: '#2f6300',
    ink: '#161616', mute: '#9aa39a', soft: '#eef5e6', softer: '#f6f9f2', edge: '#d9e9c6', raw: '#cfd8c6'
  };
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const ease = x => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const easeIO = x => { x = clamp(x, 0, 1); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const sine = x => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x, 0, 1));

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(parent, x, y, s, cls, extra) {
    const t = el('text', Object.assign({ x: x, y: y, class: cls || 'v-mono' }, extra || {}), parent);
    t.textContent = s; return t;
  }
  function mount(host, vb) {
    return el('svg', { viewBox: vb, preserveAspectRatio: 'xMidYMid meet', class: 'svc-viz__svg', 'aria-hidden': 'true' }, host);
  }
  function check(parent, x, y, color) {
    return el('path', { d: 'M' + x + ' ' + y + 'l3 3 6-6', fill: 'none', stroke: color || C.flow, 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0 }, parent);
  }

  /* ---------- 1. Strategy: radar audit ---------- */
  function vizRadar(host) {
    const svg = mount(host, '0 0 300 124');
    const cx = 62, cy = 62, R = 50;
    [R, R * 0.66, R * 0.33].forEach(r => el('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: C.edge }, svg));
    el('path', { d: 'M' + (cx - R) + ' ' + cy + 'H' + (cx + R) + 'M' + cx + ' ' + (cy - R) + 'V' + (cy + R), stroke: C.edge }, svg);
    const sweep = el('g', {}, svg);
    const SPAN = 0.95, STEPS = 10;
    const pt = a => (cx + R * Math.cos(a)).toFixed(2) + ' ' + (cy + R * Math.sin(a)).toFixed(2);
    for (let i = 0; i < STEPS; i++) {
      const a0 = -SPAN * (i + 1) / STEPS, a1 = -SPAN * i / STEPS;
      el('path', { d: 'M' + cx + ' ' + cy + 'L' + pt(a0) + 'A' + R + ' ' + R + ' 0 0 1 ' + pt(a1) + 'Z', fill: C.lime, 'fill-opacity': (0.5 * (1 - i / STEPS)).toFixed(3) }, sweep);
    }
    el('line', { x1: cx, y1: cy, x2: cx + R, y2: cy, stroke: C.flow, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, sweep);
    el('circle', { cx: cx, cy: cy, r: 3, fill: C.flow }, svg);
    const blips = [[0.7, 0.78], [2.25, 0.52], [3.7, 0.86], [5.05, 0.36]].map(([a, d]) => {
      const x = cx + R * d * Math.cos(a), y = cy + R * d * Math.sin(a);
      return { a: a, ring: el('circle', { cx: x, cy: y, r: 3, fill: 'none', stroke: C.flow, opacity: 0 }, svg), dot: el('circle', { cx: x, cy: y, r: 2.8, fill: C.flow, opacity: 0 }, svg) };
    });
    const rows = ['НИША', 'ОФФЕР', 'КАНАЛЫ'].map((label, i) => {
      const y = 32 + i * 32;
      txt(svg, 136, y, label);
      el('rect', { x: 136, y: y + 7, width: 128, height: 5, rx: 2.5, fill: C.soft }, svg);
      return { bar: el('rect', { x: 136, y: y + 7, width: 0, height: 5, rx: 2.5, fill: C.flow }, svg), ok: check(svg, 272, y + 7) };
    });
    let ang = 0.4, runAt = -99;
    function draw(t) {
      sweep.setAttribute('transform', 'rotate(' + (ang * 180 / Math.PI).toFixed(2) + ' ' + cx + ' ' + cy + ')');
      blips.forEach(b => {
        const since = (((ang - b.a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const v = Math.max(0, 1 - since / 2.4);
        b.dot.setAttribute('opacity', v.toFixed(3));
        b.ring.setAttribute('r', (3 + (1 - v) * 9).toFixed(2));
        b.ring.setAttribute('opacity', (v * 0.6).toFixed(3));
      });
      const e = t - runAt;
      rows.forEach((r, i) => {
        const p = ease((e - 0.2 - i * 0.5) / 0.65);
        r.bar.setAttribute('width', (128 * p).toFixed(1));
        r.ok.setAttribute('opacity', p >= 1 ? 1 : 0);
      });
    }
    return {
      tick(t, dt) { ang = (ang + dt * 1.5) % (2 * Math.PI); draw(t); },
      hit(t) { runAt = t; },
      still() { ang = 1.1; draw(0); }
    };
  }

  /* ---------- 2. Content: frames resolve pixel by pixel ---------- */
  function vizGen(host) {
    const svg = mount(host, '0 0 300 108');
    const MASKS = [
      ['..#....', '..##...', '..###..', '..##...', '..#....'],
      ['.....#.', '.......', '..#....', '.###.#.', '#######'],
      ['..###..', '..###..', '...#...', '.#####.', '#######']
    ];
    const LABELS = ['ВИДЕО', 'ФОТО', 'АВАТАР'];
    const CW = 12, COLS = 7, ROWS = 5, FW = COLS * CW, FH = ROWS * CW;
    const frames = MASKS.map((m, f) => {
      const x0 = 12 + f * (FW + 13), y0 = 10;
      el('rect', { x: x0 - 3, y: y0 - 3, width: FW + 6, height: FH + 6, rx: 6, fill: 'none', stroke: C.edge }, svg);
      const cells = [];
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const on = m[r][c] === '#';
        cells.push({
          rect: el('rect', { x: x0 + c * CW + 1, y: y0 + r * CW + 1, width: CW - 2, height: CW - 2, rx: 2, fill: C.softer }, svg),
          order: Math.random(), shade: on ? C.flow : (Math.random() < 0.5 ? '#dcefc4' : '#e9f4dc')
        });
      }
      txt(svg, x0 - 2, y0 + FH + 17, LABELS[f], 'v-mono v-ink');
      return { cells: cells, stat: txt(svg, x0 - 2, y0 + FH + 29, '', 'v-mono v-mute'), start: -1, done: true };
    });
    const DUR = 1.25;
    let next = 0;
    function fill(fr, p) { fr.cells.forEach(c => c.rect.setAttribute('fill', c.order < p ? c.shade : C.softer)); }
    function finish(fr) { fill(fr, 2); fr.done = true; fr.stat.textContent = 'ГОТОВО'; fr.stat.setAttribute('class', 'v-mono v-ok'); }
    frames.forEach(finish);
    return {
      tick(t) {
        frames.forEach(fr => {
          if (fr.done) return;
          const p = (t - fr.start) / DUR;
          if (p >= 1) { finish(fr); return; }
          fill(fr, p);
          fr.stat.textContent = Math.floor(p * 100) + '%';
        });
      },
      hit(t) {
        if (next === 0) frames.forEach(fr => { fill(fr, -1); fr.done = true; fr.stat.textContent = 'ЖДЁТ'; fr.stat.setAttribute('class', 'v-mono v-mute'); });
        const fr = frames[next];
        fr.start = t; fr.done = false; fr.stat.setAttribute('class', 'v-mono v-mute');
        next = (next + 1) % frames.length;
      },
      still() { frames.forEach(finish); }
    };
  }

  /* ---------- 3. Automation: request -> AI agent -> Telegram / CRM / report ---------- */
  function vizAuto(host) {
    const svg = mount(host, '0 0 300 300');
    const edgesG = el('g', {}, svg);
    function node(x, y, w, label) {
      const g = el('g', { transform: 'translate(' + x + ' ' + y + ')' }, svg);
      const box = el('rect', { x: 0, y: 0, width: w, height: 30, rx: 8, fill: '#fff', stroke: C.edge, 'stroke-width': 1.2 }, g);
      el('circle', { cx: 13, cy: 15, r: 3.2, fill: C.flow }, g);
      txt(g, 23, 18.2, label, 'v-mono v-ink');
      return { box: box, ok: check(g, w - 18, 12), cx: x + w / 2, top: y, bottom: y + 30, flash: -99 };
    }
    const ins = [node(10, 14, 122, 'ФОРМА С САЙТА'), node(168, 14, 122, 'ЧАТ / ЗВОНОК')];
    const outs = [node(4, 208, 94, 'TELEGRAM'), node(103, 226, 94, 'CRM'), node(202, 208, 94, 'ОТЧЁТ')];
    const AX = 150, AY = 120, AR = 28;
    function curve(x1, y1, x2, y2) { const m = (y1 + y2) / 2; return 'M' + x1 + ' ' + y1 + 'C' + x1 + ' ' + m + ' ' + x2 + ' ' + m + ' ' + x2 + ' ' + y2; }
    function edge(d) {
      el('path', { d: d, fill: 'none', stroke: C.edge, 'stroke-width': 1.4 }, edgesG);
      el('path', { d: d, fill: 'none', stroke: C.flow, 'stroke-width': 1.4, class: 'v-flow', opacity: 0.55 }, edgesG);
      return el('path', { d: d, fill: 'none', stroke: 'none' }, edgesG);
    }
    const inE = ins.map(n => edge(curve(n.cx, n.bottom, AX, AY - AR)));
    const outE = outs.map(n => edge(curve(AX, AY + AR, n.cx, n.top)));
    const orbit = el('circle', { cx: AX, cy: AY, r: AR + 11, fill: 'none', stroke: C.line, 'stroke-width': 1.2, 'stroke-dasharray': '3 6' }, svg);
    const pulse = el('circle', { cx: AX, cy: AY, r: AR, fill: 'none', stroke: C.flow, 'stroke-width': 1.5, opacity: 0 }, svg);
    const core = el('circle', { cx: AX, cy: AY, r: AR, fill: '#f4fae9', stroke: C.flow, 'stroke-width': 2 }, svg);
    const coreT = txt(svg, AX, AY + 5, 'ИИ', 'v-disp', { 'text-anchor': 'middle', 'font-size': 16 });
    txt(svg, AX, AY + AR + 24, 'АГЕНТ', 'v-mono v-mute', { 'text-anchor': 'middle' });
    const logG = el('g', {}, svg);
    const logEls = [txt(logG, 6, 280, '', 'v-mono v-mute'), txt(logG, 6, 294, '', 'v-mono v-ink')];
    const lines = ['', ''];
    const packG = el('g', {}, svg);
    function packet() {
      const g = el('g', { opacity: 0 }, packG);
      el('circle', { r: 8, fill: C.lime, opacity: 0.5 }, g);
      el('circle', { r: 3.4, fill: C.head }, g);
      return g;
    }
    function place(g, path, u) {
      if (u <= 0 || u >= 1) { g.setAttribute('opacity', 0); return; }
      const p = path.getPointAtLength(easeIO(u) * path.getTotalLength());
      g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
      g.setAttribute('opacity', 1);
    }
    const runs = [];
    let lastHit = -99, src = 0, agentAt = -99, logAt = -99;
    function addLog(t, s) {
      const d = new Date(), hh = n => String(n).padStart(2, '0');
      lines.shift();
      lines.push(hh(d.getHours()) + ':' + hh(d.getMinutes()) + ':' + hh(d.getSeconds()) + '  ' + (s ? 'чат' : 'форма') + ' / ИИ / TG, CRM, отчёт');
      logEls.forEach((e, i) => { e.textContent = lines[i]; });
      logAt = t;
    }
    function hit(t) {
      lastHit = t; src = 1 - src;
      ins[src].flash = t;
      runs.push({ t0: t, src: src, p0: packet(), outs: outs.map(packet), proc: false, done: false });
    }
    function draw(t) {
      orbit.setAttribute('transform', 'rotate(' + ((t * 40) % 360).toFixed(1) + ' ' + AX + ' ' + AY + ')');
      for (let i = runs.length - 1; i >= 0; i--) {
        const r = runs[i], e = t - r.t0;
        place(r.p0, inE[r.src], e / 0.7);
        if (e >= 0.7 && !r.proc) { r.proc = true; agentAt = t; }
        const f = (e - 1.2) / 0.7;
        r.outs.forEach((p, k) => place(p, outE[k], f));
        if (f >= 1 && !r.done) { r.done = true; outs.forEach(o => { o.flash = t; }); addLog(t, r.src); }
        if (e > 2.3) { r.p0.remove(); r.outs.forEach(p => p.remove()); runs.splice(i, 1); }
      }
      ins.concat(outs).forEach(n => {
        const on = t - n.flash < 0.7;
        n.box.setAttribute('stroke', on ? C.flow : C.edge);
        n.box.setAttribute('fill', on ? '#f2fbe4' : '#fff');
      });
      outs.forEach(n => n.ok.setAttribute('opacity', clamp(1.6 - (t - n.flash), 0, 1).toFixed(2)));
      const a = clamp((t - agentAt) / 0.9, 0, 1);
      pulse.setAttribute('r', (AR + a * 22).toFixed(1));
      pulse.setAttribute('opacity', (t - agentAt < 0.9 ? (1 - a) * 0.6 : 0).toFixed(2));
      core.setAttribute('fill', t - agentAt < 0.5 ? C.lime : '#f4fae9');
      coreT.textContent = t - agentAt < 0.5 ? '···' : 'ИИ';
      logG.setAttribute('transform', 'translate(0 ' + ((1 - ease((t - logAt) / 0.35)) * 6).toFixed(1) + ')');
    }
    return {
      tick(t) { if (t - lastHit > 4.5) hit(t); draw(t); },
      hit: hit,
      still() { outs.forEach(o => { o.ok.setAttribute('opacity', 1); }); addLog(0, 0); addLog(0, 1); draw(-50); }
    };
  }

  /* ---------- 4. Sites: code types on the left, the page assembles on the right ---------- */
  function vizCode(host) {
    const svg = mount(host, '0 0 420 250');
    el('rect', { x: 6, y: 10, width: 200, height: 230, rx: 10, fill: C.softer, stroke: C.edge }, svg);
    [0, 1, 2].forEach(i => el('circle', { cx: 20 + i * 10, cy: 23, r: 3, fill: '#d5dccd' }, svg));
    txt(svg, 196, 26, 'index.html', 'v-mono v-mute', { 'text-anchor': 'end' });
    el('line', { x1: 6, y1: 35, x2: 206, y2: 35, stroke: C.edge }, svg);
    const LINES = [
      [['<header ', 't'], ['class', 'a'], ['="hero"', 's'], ['>', 't']],
      [['  <h1>', 't'], ['Сайт под задачу', 'x'], ['</h1>', 't']],
      [['  <a ', 't'], ['class', 'a'], ['="btn"', 's'], ['>', 't'], ['Заявка', 'x'], ['</a>', 't']],
      [['</header>', 't']],
      [['<section ', 't'], ['class', 'a'], ['="cards"', 's'], ['>', 't']],
      [['  <div ', 't'], ['class', 'a'], ['="card"', 's'], ['/>', 't']],
      [['</section>', 't']],
      [['<footer>', 't'], ['@Cold_69', 'x'], ['</footer>', 't']]
    ];
    const code = LINES.map((parts, i) => {
      const y = 54 + i * 23;
      txt(svg, 14, y, String(i + 1), 'v-mono v-mute');
      const t = el('text', { x: 30, y: y, class: 'v-code' }, svg);
      return { parts: parts.map(([s, c]) => { const sp = el('tspan', { class: 'v-' + c }, t); return { sp: sp, s: s }; }), len: parts.reduce((n, p) => n + p[0].length, 0), y: y };
    });
    const caret = el('rect', { x: 30, y: 46, width: 5, height: 10, fill: C.flow }, svg);
    // browser
    el('rect', { x: 214, y: 10, width: 200, height: 230, rx: 10, fill: '#fff', stroke: C.edge }, svg);
    [0, 1, 2].forEach(i => el('circle', { cx: 228 + i * 10, cy: 23, r: 3, fill: '#d5dccd' }, svg));
    el('rect', { x: 262, y: 17, width: 120, height: 12, rx: 6, fill: '#f1f4ed' }, svg);
    txt(svg, 322, 26, 'ваш-сайт.рф', 'v-mono v-mute v-xs', { 'text-anchor': 'middle' });
    const frame = el('rect', { x: 214, y: 10, width: 200, height: 230, rx: 10, fill: 'none', stroke: C.flow, 'stroke-width': 1.5, opacity: 0 }, svg);
    function block(after, build) { const g = el('g', { opacity: 0 }, svg); build(g); return { g: g, after: after, at: -1 }; }
    const blocks = [
      block(0, g => el('rect', { x: 222, y: 42, width: 184, height: 92, rx: 6, fill: '#f1f8e6' }, g)),
      block(1, g => { el('rect', { x: 234, y: 58, width: 122, height: 10, rx: 2, fill: C.ink }, g); el('rect', { x: 234, y: 74, width: 86, height: 10, rx: 2, fill: C.ink }, g); }),
      block(2, g => { el('rect', { x: 234, y: 98, width: 56, height: 17, rx: 4, fill: C.lime }, g); txt(g, 262, 109.5, 'ЗАЯВКА', 'v-mono v-ink v-xs', { 'text-anchor': 'middle' }); }),
      block(4, g => el('rect', { x: 222, y: 144, width: 64, height: 5, rx: 2.5, fill: C.raw }, g)),
      block(5, g => [0, 1, 2].forEach(k => {
        const x = 222 + k * 63;
        el('rect', { x: x, y: 156, width: 58, height: 48, rx: 5, fill: C.softer, stroke: C.edge }, g);
        el('rect', { x: x + 7, y: 163, width: 10, height: 10, rx: 2, fill: C.flow }, g);
        el('rect', { x: x + 7, y: 180, width: 40, height: 4, rx: 2, fill: C.raw }, g);
        el('rect', { x: x + 7, y: 189, width: 28, height: 4, rx: 2, fill: C.raw }, g);
      })),
      block(7, g => { el('rect', { x: 222, y: 212, width: 184, height: 18, rx: 4, fill: C.ink }, g); txt(g, 231, 224, '@COLD_69', 'v-mono v-xs v-limef'); })
    ];
    const CPS = 30, LINE_PAUSE = 0.22, HOLD = 2.4, FADE = 0.5;
    const total = code.reduce((n, l) => n + l.len, 0);
    let start = 0, hitAt = -99, cw = 5.1;
    function setChars(line, n) {
      let left = n;
      line.parts.forEach(p => { const k = clamp(left, 0, p.s.length); p.sp.textContent = p.s.slice(0, k); left -= k; });
    }
    function draw(t) {
      if (!cw || cw === 5.1) { try { const L = code[3].parts[0].sp.getComputedTextLength(); if (L > 0 && code[3].parts[0].sp.textContent.length) cw = L / code[3].parts[0].sp.textContent.length; } catch (e) { /* not laid out yet */ } }
      const e = t - start;
      const typeDur = total / CPS + LINE_PAUSE * code.length;
      if (e > typeDur + HOLD + FADE) { start = t; return draw(t); }
      let clock = e, curLine = code.length - 1, curChars = code[code.length - 1].len;
      code.forEach((l, i) => {
        const need = l.len / CPS + LINE_PAUSE;
        const n = clamp(Math.floor((clock) * CPS), 0, l.len);
        setChars(l, n);
        if (clock >= 0 && clock < need && curLine === code.length - 1 && !(i === code.length - 1 && n >= l.len)) { curLine = i; curChars = n; }
        l.done = clock >= l.len / CPS;
        l.doneAt = t - (clock - l.len / CPS);
        clock -= need;
      });
      const fade = e > typeDur + HOLD ? 1 - (e - typeDur - HOLD) / FADE : 1;
      code.forEach(l => l.parts.forEach(p => p.sp.parentNode.setAttribute('opacity', clamp(fade, 0, 1))));
      caret.setAttribute('x', (30 + curChars * cw).toFixed(1));
      caret.setAttribute('y', code[curLine].y - 9);
      caret.setAttribute('opacity', (Math.floor(t * 2.4) % 2 ? 0.25 : 1) * clamp(fade, 0, 1));
      blocks.forEach(b => {
        const l = code[b.after];
        const p = l.done ? ease((t - l.doneAt) / 0.4) : 0;
        b.g.setAttribute('opacity', (p * clamp(fade, 0, 1)).toFixed(2));
        b.g.setAttribute('transform', 'translate(0 ' + ((1 - p) * 7).toFixed(1) + ')');
      });
      frame.setAttribute('opacity', clamp(1 - (t - hitAt) / 0.6, 0, 1).toFixed(2));
    }
    return {
      tick(t) { draw(t); },
      hit(t) { hitAt = t; },
      still() { code.forEach(l => setChars(l, l.len)); caret.setAttribute('opacity', 0); blocks.forEach(b => b.g.setAttribute('opacity', 1)); }
    };
  }

  /* ---------- 5. Content factory: conveyor through the AI press ---------- */
  function vizFactory(host) {
    const svg = mount(host, '0 0 420 250');
    svg.style.overflow = 'hidden';                       // items leave the belt inside the frame
    const defs = el('defs', {}, svg);
    const lg = el('linearGradient', { id: 'svcBeam', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': C.lime, 'stop-opacity': 0.9 }, lg);
    el('stop', { offset: 1, 'stop-color': C.lime, 'stop-opacity': 0 }, lg);
    txt(svg, 14, 24, 'ГОТОВО', 'v-mono v-mute');
    const cnt = txt(svg, 14, 54, '0', 'v-disp', { 'font-size': 26 });
    txt(svg, 406, 24, 'ОЧЕРЕДЬ / AI / ПУБЛИКАЦИЯ', 'v-mono v-mute', { 'text-anchor': 'end' });
    const MX = 172, MW = 80, MC = MX + MW / 2;
    el('rect', { x: MX + 8, y: 146, width: 6, height: 30, fill: '#e3ecd9' }, svg);
    el('rect', { x: MX + MW - 14, y: 146, width: 6, height: 30, fill: '#e3ecd9' }, svg);
    const press = el('rect', { x: MX, y: 70, width: MW, height: 78, rx: 10, fill: '#fff', stroke: C.flow, 'stroke-width': 1.5 }, svg);
    txt(svg, MC, 101, 'AI', 'v-disp', { 'text-anchor': 'middle', 'font-size': 18 });
    const leds = [0, 1, 2].map(i => el('rect', { x: MX + 17 + i * 16, y: 114, width: 12, height: 4, rx: 2, fill: C.soft }, svg));
    const beam = el('rect', { x: MX + 14, y: 148, width: MW - 28, height: 28, fill: 'url(#svcBeam)', opacity: 0 }, svg);
    el('rect', { x: 8, y: 176, width: 404, height: 16, rx: 8, fill: '#eef5e6', stroke: '#d3e6bd' }, svg);
    const belt = el('line', { x1: 16, y1: 184, x2: 404, y2: 184, stroke: '#c3dca5', 'stroke-width': 2, 'stroke-dasharray': '6 10' }, svg);
    const rollers = [];
    for (let x = 26; x <= 394; x += 46) {
      el('circle', { cx: x, cy: 206, r: 7, fill: '#fff', stroke: '#d3e6bd' }, svg);
      rollers.push({ x: x, sp: el('path', { d: 'M' + (x - 5) + ' 206H' + (x + 5) + 'M' + x + ' 201V211', stroke: '#b9d494', 'stroke-width': 1.2 }, svg) });
    }
    txt(svg, 406, 234, 'ОПУБЛИКОВАНО', 'v-mono v-mute', { 'text-anchor': 'end' });
    const itemsG = el('g', {}, svg);
    const ICONS = [
      g => el('path', { d: 'M18 9l10 6-10 6z' }, g),
      g => { el('path', { d: 'M9 23l8-9 5 5 4-4 9 8z' }, g); el('circle', { cx: 31, cy: 10, r: 2.6 }, g); },
      g => [9, 14, 19].forEach((y, i) => el('rect', { x: 10, y: y, width: i === 2 ? 16 : 24, height: 3, rx: 1.5 }, g))
    ];
    const items = [];
    let kind = 0, done = 0, lastSpawn = -99, queued = 0, pressAt = -99;
    const SPEED = 62;
    function spawn(t) {
      const g = el('g', {}, itemsG);
      const box = el('rect', { x: 0, y: 0, width: 44, height: 30, rx: 6, fill: '#fff', stroke: C.raw, 'stroke-width': 1.2 }, g);
      const ic = el('g', { fill: '#bcc5b3' }, g);
      ICONS[kind](ic); kind = (kind + 1) % ICONS.length;
      items.push({ g: g, box: box, ic: ic, x: -48, made: false, out: false });
      lastSpawn = t;
    }
    function draw(t, dt) {
      belt.setAttribute('stroke-dashoffset', (-t * SPEED).toFixed(1));
      rollers.forEach(r => r.sp.setAttribute('transform', 'rotate(' + ((t * SPEED / 7) * 57.3 % 360).toFixed(1) + ' ' + r.x + ' 206)'));
      if (queued > 0 && (!items.length || items[items.length - 1].x > 14)) { queued--; spawn(t); }
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.x += SPEED * dt;
        if (!it.made && it.x + 22 >= MC) {
          it.made = true; pressAt = t;
          it.box.setAttribute('fill', C.lime); it.box.setAttribute('stroke', C.flow); it.ic.setAttribute('fill', '#1f3a00');
        }
        if (!it.out && it.x > 366) { it.out = true; done++; cnt.textContent = String(done); }
        const fade = clamp((420 - it.x) / 40, 0, 1);
        it.g.setAttribute('transform', 'translate(' + it.x.toFixed(1) + ' 145)');
        it.g.setAttribute('opacity', fade.toFixed(2));
        if (it.x > 420) { it.g.remove(); items.splice(i, 1); }
      }
      const b = clamp(1 - (t - pressAt) / 0.7, 0, 1);
      beam.setAttribute('opacity', b.toFixed(2));
      press.setAttribute('fill', b > 0.5 ? '#f2fbe4' : '#fff');
      leds.forEach((l, i) => l.setAttribute('fill', b > 0 && (Math.floor(t * 12) + i) % 3 === 0 ? C.flow : C.soft));
    }
    return {
      tick(t, dt) { if (t - lastSpawn > 3.2 && !queued) queued++; draw(t, dt); },
      hit() { queued++; },
      still() { [30, 120, 290].forEach((x, i) => { spawn(0); const it = items[i]; it.x = x; if (x > MC) { it.made = true; it.box.setAttribute('fill', C.lime); it.box.setAttribute('stroke', C.flow); it.ic.setAttribute('fill', '#1f3a00'); } }); done = 3; cnt.textContent = '3'; draw(0, 0); }
    };
  }

  const FACTORIES = { radar: vizRadar, gen: vizGen, auto: vizAuto, code: vizCode, factory: vizFactory };

  /* ---------- wires between the cards ---------- */
  function init() {
    const grid = document.getElementById('svcGrid');
    const svg = document.getElementById('svcSvg');
    const section = document.getElementById('services');
    if (!grid || !svg || !section) return;
    const card = id => document.getElementById(id);
    const CARDS = { c1: card('svcCard1'), c2: card('svcCard2'), c3: card('svcCard3'), c4: card('svcCard4'), c5: card('svcCard5') };
    if (Object.values(CARDS).some(c => !c)) return;

    // mini-scenes
    const viz = {};
    Object.keys(CARDS).forEach(k => {
      const host = CARDS[k].querySelector('[data-viz]');
      if (host && FACTORIES[host.dataset.viz]) { try { viz[k] = FACTORIES[host.dataset.viz](host); } catch (e) { console.warn('svc viz', e); } }
    });

    const rails = el('g', {}, svg), ports = el('g', {}, svg), packG = el('g', {}, svg);
    let edges = [], sig = '', layout = '';

    function rel(r, g) { return { l: r.left - g.left, r: r.right - g.left, t: r.top - g.top, b: r.bottom - g.top, cx: (r.left + r.right) / 2 - g.left, cy: (r.top + r.bottom) / 2 - g.top }; }
    function rounded(pts, rad) {
      const p = pts.filter((q, i) => i === 0 || Math.hypot(q[0] - pts[i - 1][0], q[1] - pts[i - 1][1]) > 0.5);
      const keep = p.filter((q, i) => {
        if (i === 0 || i === p.length - 1) return true;
        const a = p[i - 1], c = p[i + 1];
        return Math.abs((q[0] - a[0]) * (c[1] - q[1]) - (q[1] - a[1]) * (c[0] - q[0])) > 0.5;
      });
      let d = 'M' + keep[0][0].toFixed(1) + ' ' + keep[0][1].toFixed(1);
      for (let i = 1; i < keep.length - 1; i++) {
        const [x0, y0] = keep[i - 1], [x1, y1] = keep[i], [x2, y2] = keep[i + 1];
        const d1 = Math.hypot(x1 - x0, y1 - y0), d2 = Math.hypot(x2 - x1, y2 - y1), r = Math.min(rad, d1 / 2, d2 / 2);
        d += ' L' + (x1 - (x1 - x0) / d1 * r).toFixed(1) + ' ' + (y1 - (y1 - y0) / d1 * r).toFixed(1) +
             ' Q' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' ' + (x1 + (x2 - x1) / d2 * r).toFixed(1) + ' ' + (y1 + (y2 - y1) / d2 * r).toFixed(1);
      }
      const L = keep[keep.length - 1];
      return d + ' L' + L[0].toFixed(1) + ' ' + L[1].toFixed(1);
    }

    function geometry() {
      const g = grid.getBoundingClientRect();
      const E = {}, I = {};
      Object.keys(CARDS).forEach(k => { E[k] = rel(CARDS[k].getBoundingClientRect(), g); I[k] = rel((CARDS[k].querySelector('.svc-icon') || CARDS[k]).getBoundingClientRect(), g); });
      return { E: E, I: I };
    }

    function build() {
      const { E, I } = geometry();
      const s = Object.keys(E).map(k => [E[k].l, E[k].t, E[k].r, E[k].b].map(Math.round).join(',')).join('|');
      if (s === sig) return;
      sig = s;
      rails.textContent = ''; ports.textContent = ''; packG.textContent = '';
      packets.length = 0;
      const desk = Math.abs(E.c1.t - E.c4.t) < 24 && E.c4.l > E.c2.r;
      layout = desk ? 'desk' : 'chain';
      const defs = [];
      const across = (ax, ay, bx, by, mx) => Math.abs(ay - by) < 1 ? [[ax, ay], [bx, by]] : [[ax, ay], [mx, ay], [mx, by], [bx, by]];
      const hop = (a, b, label) => {
        const A = E[a], B = E[b], IA = I[a], IB = I[b];
        if (Math.abs(A.t - B.t) < 12) return { from: a, to: b, label: label, pts: across(IA.r + 5, IA.cy, IB.l - 5, IB.cy, (A.r + B.l) / 2) };
        const mid = (A.b + B.t) / 2;
        return { from: a, to: b, label: label, pts: [[IA.cx, A.b], [IA.cx, mid], [IB.cx, mid], [IB.cx, IB.t - 5]] };
      };
      if (desk) {
        const gx = (E.c1.r + E.c2.l) / 2;
        defs.push({ from: 'c1', to: 'c2', label: 'ПЛАН', pts: across(I.c1.r + 5, I.c1.cy, I.c2.l - 5, I.c2.cy, gx) });
        defs.push({ from: 'c1', to: 'c3', label: 'ТЗ', pts: [[I.c1.r + 5, I.c1.cy], [gx, I.c1.cy], [gx, E.c3.t]] });
        defs.push({ from: 'c2', to: 'c4', label: 'КОНТЕНТ', pts: across(I.c2.r + 5, I.c2.cy, I.c4.l - 5, I.c4.cy, (E.c2.r + E.c4.l) / 2) });
        defs.push({ from: 'c3', to: 'c5', label: 'ЗАЯВКИ', pts: across(E.c3.r, I.c3.cy, I.c5.l - 5, I.c5.cy, (E.c3.r + E.c5.l) / 2) });
        defs.push({ from: 'c4', to: 'c5', label: 'ЗАДАЧИ', pts: [[I.c5.cx, E.c4.b], [I.c5.cx, I.c5.t - 5]] });
      } else {
        defs.push(hop('c1', 'c2', 'ПЛАН'), hop('c2', 'c4', 'КОНТЕНТ'), hop('c4', 'c3', 'СЦЕНАРИИ'), hop('c3', 'c5', 'ЗАЯВКИ'));
      }
      edges = defs.map(d => {
        const path = rounded(d.pts, 12);
        el('path', { d: path, fill: 'none', stroke: C.line, 'stroke-width': 1.5, 'stroke-opacity': 0.55, 'stroke-linecap': 'round' }, rails);
        el('path', { d: path, fill: 'none', stroke: C.flow, 'stroke-width': 1.5, class: 'v-flow', 'stroke-linecap': 'round' }, rails);
        const probe = el('path', { d: path, fill: 'none', stroke: 'none' }, rails);
        const a = d.pts[0], b = d.pts[d.pts.length - 1];
        const pa = el('circle', { cx: a[0], cy: a[1], r: 3.6, fill: '#fff', stroke: C.flow, 'stroke-width': 1.5 }, ports);
        const pb = el('circle', { cx: b[0], cy: b[1], r: 3.6, fill: '#fff', stroke: C.flow, 'stroke-width': 1.5 }, ports);
        return { from: d.from, to: d.to, label: d.label, path: probe, len: probe.getTotalLength(), pa: pa, pb: pb, flash: -99 };
      });
    }

    /* packets */
    const packets = [];
    const SPEED = 250;
    function makePacket(e) {
      const g = el('g', {}, packG);
      const trail = [];
      for (let k = 7; k >= 1; k--) trail.push(el('circle', { r: (3.4 * (1 - k / 8)).toFixed(2), fill: C.head, opacity: (0.55 * (1 - k / 8)).toFixed(2) }, g));
      el('circle', { r: 9, fill: C.lime, opacity: 0.45, class: 'v-halo' }, g);
      const head = el('circle', { r: 3.8, fill: C.head }, g);
      let chip = null;
      if (e.len > 150 && e.label) {
        chip = el('g', {}, g);
        const w = e.label.length * 6.2 + 16;
        el('rect', { x: 0, y: 0, width: w, height: 17, rx: 8.5, fill: '#fff', stroke: C.flow, 'stroke-width': 1 }, chip);
        txt(chip, w / 2, 11.8, e.label, 'v-mono v-chip', { 'text-anchor': 'middle' });
        chip.w = w;
      }
      return { g: g, trail: trail, head: head, chip: chip };
    }
    function emit(e, t) {
      const cur = edges.find(x => x.from === e.from && x.to === e.to);
      if (cur) packets.push({ e: cur, t0: t, dur: Math.max(0.55, cur.len / SPEED), v: makePacket(cur) });
    }

    /* the automation run */
    const timers = [];
    const later = (t, fn) => timers.push({ t: t, fn: fn });
    function hitCard(k, t) {
      const c = CARDS[k];
      c.classList.remove('svc-hit'); void c.offsetWidth; c.classList.add('svc-hit');
      setTimeout(() => c.classList.remove('svc-hit'), 700);
      if (viz[k]) viz[k].hit(t);
    }
    function arrive(e, t) {
      e.flash = t;
      hitCard(e.to, t);
      edges.filter(x => x.from === e.to).forEach((x, i) => later(t + 0.28 + i * 0.9, tt => emit(x, tt)));
    }
    let lastRun = -99;
    const PERIOD = 3.6;
    function run(t) {
      lastRun = t;
      hitCard('c1', t);
      edges.filter(x => x.from === 'c1').forEach((x, i) => later(t + 0.35 + i * 0.9, tt => emit(x, tt)));
    }

    function drawPackets(t) {
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i], u = (t - p.t0) / p.dur;
        if (u >= 1) { p.v.g.remove(); packets.splice(i, 1); arrive(p.e, t); continue; }
        const s = sine(u) * p.e.len;
        const h = p.e.path.getPointAtLength(s);
        p.v.head.setAttribute('cx', h.x); p.v.head.setAttribute('cy', h.y);
        const halo = p.v.g.children[p.v.trail.length];
        halo.setAttribute('cx', h.x); halo.setAttribute('cy', h.y);
        p.v.trail.forEach((c, k) => {
          const q = p.e.path.getPointAtLength(Math.max(0, s - (p.v.trail.length - k) * 5));
          c.setAttribute('cx', q.x); c.setAttribute('cy', q.y);
        });
        if (p.v.chip) {
          const a = p.e.path.getPointAtLength(Math.max(0, s - 4)), b = p.e.path.getPointAtLength(Math.min(p.e.len, s + 4));
          const horiz = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
          const x = horiz ? h.x - p.v.chip.w / 2 : h.x + 12, y = horiz ? h.y - 27 : h.y - 8.5;
          p.v.chip.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
          p.v.chip.setAttribute('opacity', horiz ? clamp(Math.min(u * 6, (1 - u) * 6), 0, 1).toFixed(2) : 0);
        }
      }
      edges.forEach(e => {
        const f = clamp(1 - (t - e.flash) / 0.5, 0, 1);
        e.pb.setAttribute('r', (3.6 + f * 3).toFixed(2));
        e.pb.setAttribute('fill', f > 0 ? C.lime : '#fff');
      });
    }

    build();
    Object.values(viz).forEach(v => { try { v.still(); } catch (e) { /* ignore */ } });
    window.addEventListener('resize', () => { sig = ''; build(); }, { passive: true });
    if (reduce) { setInterval(build, 1500); return; }

    let running = false, raf = 0, clock = 0, last = 0, geoAt = 0;
    function frame(now) {
      raf = 0;
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now; clock += dt;
      const t = clock;
      if (t - geoAt > 0.3) { geoAt = t; build(); }
      for (let i = timers.length - 1; i >= 0; i--) if (timers[i].t <= t) { const fn = timers[i].fn; timers.splice(i, 1); fn(t); }
      if (t - lastRun > PERIOD) run(t);
      drawPackets(t);
      Object.values(viz).forEach(v => v.tick(t, dt));
      raf = requestAnimationFrame(frame);
    }
    new IntersectionObserver(([en]) => {
      running = en.isIntersecting;
      if (running && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }, { rootMargin: '80px' }).observe(section);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
