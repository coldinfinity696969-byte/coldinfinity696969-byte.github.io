"""Build the promo variant: promo/index.html = ../index.html + showreel block under the hero.

The main site (../index.html) is never modified. Re-run after changing the main site:
    python promo/build.py
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
/* ============ SHOWREEL (promo variant) ============ */
/* overflow-x:hidden on both html and body turns body into a scroll container and kills position:sticky;
   clip hides horizontal overflow the same way without that side effect */
html, body { overflow-x: clip !important; }
@supports not (overflow: clip) { html, body { overflow-x: visible !important; } }
.reel { position: relative; height: 330vh; background: #070707; border-top: 1px solid var(--line); }
.reel__sticky {
  position: sticky; top: 0; height: 100vh; height: 100svh; overflow: hidden;
  background: radial-gradient(60% 55% at 50% 60%, rgba(192,255,51,.07), transparent 70%), #070707;
}
.reel__gl { position: absolute; inset: 0; width: 100%; height: 100%; display: block; z-index: 1; touch-action: pan-y; cursor: grab; }
.reel__title {
  position: absolute; left: 0; right: 0; top: 12vh; z-index: 0; text-align: center; pointer-events: none;
  font-family: var(--display); font-weight: 800; text-transform: uppercase;
  font-size: clamp(34px, 7.3vw, 128px); line-height: .9; letter-spacing: -.045em;
}
.reel__title span { display: block; white-space: nowrap; }
.reel__t1 { color: #ededed; }
.reel__t2 { color: transparent; -webkit-text-stroke: 1.5px #333; }
.reel__title b { color: var(--green); -webkit-text-stroke: 0; }
.reel__top {
  position: absolute; top: 88px; left: var(--gutter); right: var(--gutter); z-index: 2;
  display: flex; justify-content: space-between; gap: 20px; pointer-events: none;
  font-family: var(--mono); font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: var(--ink-3);
}
.reel__label { display: inline-flex; align-items: center; gap: 10px; color: var(--ink-2); }
.reel__label em { font-style: normal; }
.reel__label i { width: 7px; height: 7px; border-radius: 50%; background: var(--green); box-shadow: 0 0 10px var(--green); }
.reel__hud {
  position: absolute; left: var(--gutter); right: var(--gutter); bottom: 34px; z-index: 2;
  display: grid; grid-template-columns: auto 1fr auto; align-items: end; gap: 28px; pointer-events: none;
}
.reel__hud a, .reel__hud button { pointer-events: auto; }
.reel__count { font-family: var(--display); font-weight: 800; font-size: 68px; line-height: .78; letter-spacing: -.05em; color: var(--hi); }
.reel__count small { font-family: var(--mono); font-size: 12px; font-weight: 500; letter-spacing: .1em; color: var(--ink-3); margin-left: 8px; }
.reel__name {
  overflow: hidden; font-family: var(--display); font-weight: 800; text-transform: uppercase;
  font-size: clamp(20px, 2.5vw, 36px); line-height: 1.12; letter-spacing: -.015em; color: var(--hi);
}
.reel__name span { display: inline-block; }
.reel__meta { margin-top: 8px; font-family: var(--mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--ink-2); }
.reel__ticks { display: flex; gap: 6px; margin-top: 16px; }
.reel__ticks i { width: 20px; height: 2px; background: #2a2a2a; transition: background .3s, width .4s var(--ease); }
.reel__ticks i.on { width: 42px; background: var(--green); }
.reel__btns { display: flex; gap: 10px; }
.reel__btns .btn-green, .reel__btns .btn-ghost { padding: 15px 22px; cursor: pointer; background-color: transparent; }
.reel__btns .btn-green { background: var(--green); }
.reel__bar { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; z-index: 2; background: #151515; }
.reel__bar i { display: block; height: 100%; background: var(--green); transform-origin: 0 50%; transform: scaleX(0); }
.reel__cursor {
  position: absolute; left: 0; top: 0; z-index: 3; pointer-events: none;
  margin: 16px 0 0 16px; padding: 8px 12px; border-radius: 100px;
  background: var(--green); color: #000; font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: .16em;
  opacity: 0; scale: .6; transition: opacity .2s, scale .25s var(--ease);
}
.reel__cursor.on { opacity: 1; scale: 1; }
.reel__fallback { display: none; }
@media (max-width: 700px) {
  .reel { height: 270vh; }
  .reel__title { top: 14vh; font-size: 7vw; }
  .reel__t2 { -webkit-text-stroke-width: 1px; }
  .reel__top { top: 80px; }
  .reel__label em, .reel__hint { display: none; }
  .reel__hud { grid-template-columns: auto 1fr; gap: 14px 18px; bottom: 22px; }
  .reel__count { font-size: 46px; }
  .reel__name { font-size: 18px; }
  .reel__meta { font-size: 9px; }
  .reel__ticks { margin-top: 12px; }
  .reel__ticks i { width: 12px; }
  .reel__ticks i.on { width: 26px; }
  .reel__btns { grid-column: 1 / -1; }
  .reel__btns > * { flex: 1; justify-content: center; }
  .reel__btns .btn-green, .reel__btns .btn-ghost { padding: 14px 10px; font-size: 11px; }
}
/* no WebGL: static strip of screenshots instead of the ring */
.reel.no-gl { height: auto; }
.reel.no-gl .reel__sticky { position: relative; height: auto; padding: 150px 0 70px; }
.reel.no-gl .reel__title { position: relative; top: 0; }
.reel.no-gl .reel__gl, .reel.no-gl .reel__hud, .reel.no-gl .reel__bar, .reel.no-gl .reel__top { display: none; }
.reel.no-gl .reel__fallback { display: block; overflow: hidden; margin-top: 48px; }
.reel__strip { display: flex; gap: 16px; width: max-content; animation: reelStrip 60s linear infinite; }
.reel__strip img { width: 380px; height: 238px; object-fit: cover; object-position: top; border-radius: 10px; border: 1px solid var(--line-2); }
@keyframes reelStrip { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .reel__strip { animation: none; } }
'''
rep('</style>', CSS + '</style>')

THUMBS = ['osminog', 'olga', 'phytoclone', 'kovriki', 'steklo', 'snyato', 'taro', 'sayty', 'zapis', 'lumora']
strip = ''.join('<img src="../assets/portfolio/web-%s-t.webp" alt="" loading="lazy">' % t for t in THUMBS * 2)

SECTION = '''
<!-- ============ SHOWREEL ============ -->
<section class="reel" id="reel" aria-label="Шоурил: 10 сайтов, которые я сделал">
  <div class="reel__sticky">
    <div class="reel__title" aria-hidden="true">
      <span class="reel__t1"><b>10</b> САЙТОВ</span>
      <span class="reel__t2"><b>0</b> КОНСТРУКТОРОВ</span>
    </div>
    <canvas class="reel__gl" aria-hidden="true"></canvas>
    <div class="reel__top">
      <span class="reel__label"><i></i>ШОУРИЛ<em>&nbsp;/ САЙТЫ НА КОДЕ</em></span>
      <span class="reel__hint">ЛИСТАЙТЕ ИЛИ ТЯНИТЕ</span>
    </div>
    <div class="reel__hud">
      <div class="reel__count"><span id="reelNum">01</span><small>/10</small></div>
      <div class="reel__info">
        <div class="reel__name"><span id="reelName">OSMINOG</span></div>
        <div class="reel__meta" id="reelMeta">Клиент / лендинг веб-студии</div>
        <div class="reel__ticks" id="reelTicks"></div>
      </div>
      <div class="reel__btns">
        <button class="btn-ghost" id="reelMore" type="button">ПОДРОБНЕЕ</button>
        <a class="btn-green" id="reelOpen" href="https://coldinfinity696969-byte.github.io/osminog/" target="_blank" rel="noopener">ОТКРЫТЬ САЙТ <i class="i-arr" aria-hidden="true"></i></a>
      </div>
    </div>
    <div class="reel__bar"><i id="reelFill"></i></div>
    <div class="reel__cursor" id="reelCursor">ОТКРЫТЬ</div>
    <div class="reel__fallback"><div class="reel__strip">%s</div></div>
  </div>
</section>
''' % strip
rep('<!-- ============ MARQUEE ============ -->', SECTION + '\n<!-- ============ MARQUEE ============ -->')

rep('</body>', '''<script type="module" src="reel.js"></script>
<script>
  // if WebGL or the CDN is unavailable, show the static strip instead of an empty stage
  setTimeout(function () { var r = document.getElementById('reel'); if (r && !r.classList.contains('gl-ready')) r.classList.add('no-gl'); }, 8000);
</script>
</body>''')
rep('</head>', '<link rel="modulepreload" href="https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js" crossorigin>\n</head>')

io.open(OUT, 'w', encoding='utf-8', newline='\n').write(s)
print('promo/index.html built (%d KB)' % (len(s.encode('utf-8')) // 1024))
