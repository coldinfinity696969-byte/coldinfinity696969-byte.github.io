"""Build the promo variant: promo/index.html = ../index.html + "seamless mode" (promo/seamless.js).

The main site (../index.html) is never modified. Re-run after any change to the main site:
    python promo/build.py
To move seamless mode to the main site later: copy the CSS block, the three layer divs,
the Lenis script and seamless.js the same way this script injects them.
"""
import io
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', 'index.html')
OUT = os.path.join(HERE, 'index.html')

s = io.open(SRC, encoding='utf-8').read()


def rep(old, new, count=1):
    global s
    n = s.count(old)
    if n != count:
        raise SystemExit('build.py: expected %d match(es), found %d: %r' % (count, n, old[:60].encode('ascii', 'replace')))
    s = s.replace(old, new)


# assets live one level up
s = s.replace('src="assets/', 'src="../assets/').replace('href="assets/', 'href="../assets/')
s = s.replace("url('assets/", "url('../assets/")
rep("const P = 'assets/portfolio/';", "const P = '../assets/portfolio/';")

# the variant must not compete with the main page in search
rep('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n<meta name="robots" content="noindex" />')

CSS = r'''
/* ============ SEAMLESS MODE (promo variant, promo/seamless.js) ============ */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-smooth [data-lenis-prevent] { overscroll-behavior: contain; }
.lenis.lenis-stopped { overflow: hidden; }

/* one backdrop for the whole page: sections stop painting their own dark fill */
html.seam-on body { background: transparent !important; }
html.seam-on #about-text, html.seam-on .section, html.seam-on #cases, html.seam-on #process,
html.seam-on #contact, html.seam-on .tools, html.seam-on .footer { background-color: transparent !important; }
html.seam-on .section, html.seam-on .reel, html.seam-on .about-section, html.seam-on .contact,
html.seam-on .tools, html.seam-on .footer, html.seam-on .stats { border-top-color: transparent !important; border-bottom-color: transparent !important; }
.seam-glow {
  position: fixed; left: 50%; top: 50%; width: 110vmax; height: 110vmax; margin: -55vmax 0 0 -55vmax;
  z-index: -1; pointer-events: none; will-change: transform;
  background: radial-gradient(circle, rgba(192,255,51,.07) 0%, rgba(192,255,51,.022) 32%, transparent 60%);
}
.seam-words { position: fixed; inset: 0; z-index: -1; pointer-events: none; overflow: hidden; }
.seam-words span {
  position: absolute; left: 0; top: 54%; white-space: nowrap;
  font-family: var(--display); font-weight: 800; font-size: 21vw; line-height: 1; letter-spacing: -.05em;
  color: transparent; -webkit-text-stroke: 1.5px rgba(255,255,255,.11);
  opacity: 0; transform: translate3d(18vw, -50%, 0); transition: opacity .7s var(--ease); will-change: transform, opacity;
}
.seam-words span.on { opacity: 1; }

/* the light services chapter fades in and out of the dark instead of a hard edge */
html.seam-on .svc-section { background-color: transparent !important; background-image: none !important; }
html.seam-on .svc-section::before {
  content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
  background-color: #f8f8f8;
  background-image: radial-gradient(circle, rgba(30,60,0,.075) 1px, transparent 1.4px); background-size: 24px 24px;
  -webkit-mask-image: linear-gradient(180deg, transparent 0, #000 120px, #000 calc(100% - 120px), transparent 100%);
          mask-image: linear-gradient(180deg, transparent 0, #000 120px, #000 calc(100% - 120px), transparent 100%);
}

/* chapter rail */
.seam-rail { position: fixed; right: 20px; top: 50%; transform: translateY(-50%); z-index: 60; display: flex; flex-direction: column; gap: 10px; }
.seam-rail a { position: relative; display: flex; align-items: center; justify-content: center; width: 14px; height: 16px; color: rgba(255,255,255,.5); transition: color .35s; }
.seam-rail i { width: 6px; height: 6px; border-radius: 3px; background: currentColor; opacity: .55; transition: height .45s var(--ease), background .3s, opacity .3s; }
.seam-rail span {
  position: absolute; right: 22px; top: 50%; translate: 6px -50%; white-space: nowrap; pointer-events: none;
  padding: 4px 9px; border-radius: 100px; background: rgba(10,10,10,.85); color: var(--hi);
  font-family: var(--mono); font-size: 9px; letter-spacing: .16em; text-transform: uppercase;
  opacity: 0; transition: opacity .25s, translate .25s;
}
.seam-rail a:hover span, .seam-rail a:focus-visible span { opacity: 1; translate: 0 -50%; }
.seam-rail a.on i { height: 24px; background: var(--green); opacity: 1; }
html.seam-light .seam-rail a { color: rgba(0,0,0,.4); }
@media (max-width: 1100px) { .seam-rail { display: none; } }
@media (max-width: 700px) { .seam-words span { -webkit-text-stroke: 1px rgba(255,255,255,.06); } }
@media (prefers-reduced-motion: reduce) { .seam-words span { transition: none; } }
'''
rep('</style>', CSS + '</style>')

rep('<div class="grain"></div>', '''<div class="grain"></div>
<div class="seam-glow" id="seamGlow" aria-hidden="true"></div>
<div class="seam-words" id="seamWords" aria-hidden="true"></div>
<nav class="seam-rail" id="seamRail" aria-label="Разделы страницы"></nav>''')
rep('<div class="case-modal__box">', '<div class="case-modal__box" data-lenis-prevent>')
rep('</body>', '''<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
<script src="seamless.js" defer></script>
</body>''')

io.open(OUT, 'w', encoding='utf-8', newline='\n').write(s)
print('promo/index.html built (%d KB)' % (len(s.encode('utf-8')) // 1024))
