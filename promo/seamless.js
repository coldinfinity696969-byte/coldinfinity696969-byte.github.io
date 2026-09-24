/* ============ SEAMLESS MODE (promo variant) ============
   Idea taken from the kovriki demo: the page reads as one continuous scene, nothing jumps.
   - inertial smooth scroll (Lenis) for mouse and trackpad; touch keeps native scrolling
   - dark sections share one fixed backdrop with a slow green glow that travels with the scroll
   - the giant outline word of the current chapter drifts behind the content
   - chapter rail on the right, soft parallax on headings and photos
   Everything here is additive: the main page keeps working without this file. */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;
  const glow = document.getElementById('seamGlow');
  const wordsEl = document.getElementById('seamWords');
  const rail = document.getElementById('seamRail');
  if (!glow || !wordsEl || !rail) return;
  root.classList.add('seam-on');

  /* ---- chapters: selector, drifting word, rail label, light background ---- */
  const DEF = [
    ['#home', '', 'Старт', false],
    ['#reel', '', 'Шоурил', false],
    ['#about-text', 'ОБО МНЕ', 'Обо мне', false],
    ['#services', '', 'Услуги', true],
    ['#cases', 'ПРОЕКТЫ', 'Проекты', false],
    ['#sites', 'САЙТЫ', 'Сайты', false],
    ['#process', 'ПРОЦЕСС', 'Процесс', false],
    ['#tools', 'СТЕК', '', false],
    ['#formats', 'ФОРМАТЫ', 'Форматы', false],
    ['#faq', 'ВОПРОСЫ', 'Вопросы', false],
    ['#contact', 'КОНТАКТ', 'Контакты', false]
  ];
  const chapters = DEF.map(([sel, word, label, light]) => ({ el: document.querySelector(sel), word: word, label: label, light: light }))
    .filter(c => c.el);

  /* ---- giant words ---- */
  chapters.forEach(c => {
    if (!c.word) return;
    const w = document.createElement('span');
    w.textContent = c.word;
    wordsEl.appendChild(w);
    c.wordEl = w;
  });

  /* ---- rail ---- */
  chapters.forEach(c => {
    if (!c.label) return;
    const a = document.createElement('a');
    a.href = '#' + c.el.id;
    a.innerHTML = '<i></i><span>' + c.label + '</span>';
    a.setAttribute('aria-label', c.label);
    rail.appendChild(a);
    c.railEl = a;
  });

  /* ---- smooth scroll ---- */
  let lenis = null;
  if (!reduce && fine && typeof window.Lenis === 'function') {
    try {
      lenis = new window.Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1, anchors: { offset: 0 } });
      if (window.gsap && window.ScrollTrigger) {
        lenis.on('scroll', window.ScrollTrigger.update);
        window.gsap.ticker.add(time => lenis.raf(time * 1000));
        window.gsap.ticker.lagSmoothing(0);
      } else {
        const loop = time => { lenis.raf(time); requestAnimationFrame(loop); };
        requestAnimationFrame(loop);
      }
      // the case modal and the mobile menu scroll on their own
      const hold = el => {
        if (!el) return;
        new MutationObserver(() => { el.classList.contains('open') ? lenis.stop() : lenis.start(); })
          .observe(el, { attributes: true, attributeFilter: ['class'] });
      };
      hold(document.getElementById('caseModal'));
      hold(document.getElementById('mobileMenu'));
    } catch (e) { console.warn('seamless: lenis', e); lenis = null; }
  }
  rail.addEventListener('click', e => {
    const a = e.target.closest('a'); if (!a) return;
    const target = document.querySelector(a.getAttribute('href')); if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---- parallax targets ---- */
  const PAR = [];
  document.querySelectorAll('.sec-title, .about-headline, .tools__title, .contact__title').forEach(el => PAR.push({ el: el, k: -0.07 }));
  document.querySelectorAll('.about-visual, .contact__photos img').forEach((el, i) => PAR.push({ el: el, k: 0.05 + (i % 3) * 0.02 }));

  /* ---- frame ---- */
  let active = -1, lastY = -1, vel = 0;
  function frame() {
    const vh = window.innerHeight, y = window.scrollY;
    const dy = lastY < 0 ? 0 : y - lastY; lastY = y;
    vel += (dy - vel) * 0.1;

    // current chapter = the one under the upper third of the screen
    const probe = vh * 0.38;
    let cur = 0;
    chapters.forEach((c, i) => { const r = c.el.getBoundingClientRect(); if (r.top <= probe) cur = i; c.rect = r; });
    if (cur !== active) {
      active = cur;
      chapters.forEach((c, i) => {
        if (c.wordEl) c.wordEl.classList.toggle('on', i === cur);
        if (c.railEl) c.railEl.classList.toggle('on', i === cur);
      });
      root.classList.toggle('seam-light', !!chapters[cur].light);
    }

    if (!reduce) {
      // the word drifts across its chapter: enters from the right, leaves to the left
      const c = chapters[active];
      if (c.wordEl) {
        const p = Math.min(1, Math.max(0, (probe - c.rect.top) / Math.max(1, c.rect.height)));
        c.wordEl.style.transform = 'translate3d(' + (18 - p * 46).toFixed(2) + 'vw, -50%, 0) skewX(' + Math.max(-8, Math.min(8, -vel * 0.35)).toFixed(2) + 'deg)';
      }
      // one glow wanders through the whole page
      const doc = Math.max(1, document.documentElement.scrollHeight - vh);
      const g = y / doc;
      const gx = 50 + Math.sin(g * Math.PI * 5.2) * 34, gy = 50 + Math.cos(g * Math.PI * 3.1) * 26;
      glow.style.transform = 'translate3d(' + (gx - 50).toFixed(2) + 'vw, ' + (gy - 50).toFixed(2) + 'vh, 0) scale(' + (1 + Math.min(0.35, Math.abs(vel) * 0.004)).toFixed(3) + ')';
      // parallax
      PAR.forEach(p => {
        const r = p.el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const off = (r.top + r.height / 2 - vh / 2) * p.k;
        p.el.style.translate = '0 ' + Math.max(-48, Math.min(48, off)).toFixed(1) + 'px';
      });
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
