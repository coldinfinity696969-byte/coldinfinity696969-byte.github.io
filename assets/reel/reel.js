/* ============ SHOWREEL: ring of live website screens (Three.js) ============
   10 curved browser screens on a tilted ring. Each texture is a stack of
   viewport-sized bands: the site's hero first, then its most striking blocks.
   Idle screens show the hero; the screen in front holds the hero, then glides
   band to band and back, so every site starts from its best frame.
   Page scroll (sticky section) spins the ring and brings sites to the front
   one by one; fast scrolling bends the screens and splits RGB a little.
   Drag to spin, click a screen to open the case card. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js';

const G = 'https://coldinfinity696969-byte.github.io/';
const SITES = [
  { key: 'sites',     slug: 'osminog', name: 'OSMINOG',         meta: 'Клиент / лендинг веб-студии',       path: 'osminog' },
  { key: 'w-olga',    slug: 'olga',    name: 'Ольга Калинкина', meta: 'Клиент / концертный директор',      path: 'olga-kalinkina' },
  { key: 'w-phyto',   slug: 'phyto',   name: 'PhytoClone',      meta: 'Клиент / лаборатория растений',     path: 'phytoclone' },
  { key: 'w-kovriki', slug: 'kovriki', name: '3D-коврики',      meta: 'Демо для клиента / Three.js',       path: 'kovriki-3d' },
  { key: 'w-steklo',  slug: 'steklo',  name: 'СтеклА',          meta: 'Клиент / стекло, Новосибирск',      path: 'steklo' },
  { key: 'w-snyato',  slug: 'snyato',  name: 'СНЯТО',           meta: 'Свой проект / AI-фото',             path: 'snyato' },
  { key: 'w-taro',    slug: 'taro',    name: 'NOCTARO',         meta: 'Свой проект / таро-расклады',       path: 'taro' },
  { key: 'w-sayty',   slug: 'sayty',   name: 'Сайты через ИИ',  meta: 'Свой проект / лендинг курса',       path: 'sayty' },
  { key: 'w-zapis',   slug: 'zapis',   name: 'ЗаписьИИ',        meta: 'Демо продукта / ИИ-администратор',  path: 'zapis-ai' },
  { key: 'w-lumora',  slug: 'lumora',  name: 'Lumora',          meta: 'Концепт / сайт студии дизайна',     path: 'lumora' },
];

const root = document.getElementById('reel');
const canvas = root && root.querySelector('.reel__gl');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

function fail(e) { if (root) root.classList.add('no-gl'); if (e) console.warn('reel:', e); }

try { init(); } catch (e) { fail(e); }

function init() {
  if (!root || !canvas) return;
  const isSmall = Math.min(innerWidth, innerHeight) < 700;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isSmall ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 120);

  // ---- geometry constants (world units) ----
  const N = SITES.length, STEP = Math.PI * 2 / N;
  const PW = 4.2, CH = PW * 10 / 16, BAR = 0.26, PH = CH + BAR;   // 16:10 content + browser bar
  const R = (N * (PW + 0.95)) / (Math.PI * 2);                    // ring radius from panel width + gap
  const FLOOR = -PH / 2 - 0.34;
  const GREEN = new THREE.Color('#c0ff33');

  const tilt = new THREE.Group(); tilt.rotation.set(0.05, 0, -0.07); scene.add(tilt);
  const spin = new THREE.Group(); tilt.add(spin);

  const geo = new THREE.PlaneGeometry(PW, PH, 64, 1);

  const vert = /* glsl */`
    uniform float uR; uniform float uBend;
    varying vec2 vUv; varying vec3 vWorld;
    void main() {
      vUv = uv;
      vec3 p = position;
      float a = p.x / uR;                              // wrap the plane onto the ring
      vec3 q = vec3(uR * sin(a), p.y, uR * cos(a) - uR);
      q.z += uBend * sin(uv.x * 3.14159) * (0.55 + 0.45 * sin(uv.y * 3.14159));  // jelly on fast scroll
      vec4 w = modelMatrix * vec4(q, 1.0);
      vWorld = w.xyz;
      gl_Position = projectionMatrix * viewMatrix * w;
    }`;

  const frag = /* glsl */`
    uniform sampler2D uMap; uniform sampler2D uBar;
    uniform float uLoaded, uTexAspect, uScroll, uFocus, uHover, uReveal, uVel, uReflect, uBarH, uR, uTime;
    uniform vec2 uSize; uniform vec3 uGreen;
    varying vec2 vUv; varying vec3 vWorld;

    float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }

    void main() {
      vec2 uv = vUv;
      vec2 p = (uv - 0.5) * uSize;
      float d = sdRound(p, uSize * 0.5, 0.11);
      float aa = fwidth(d) * 1.2;
      float mask = 1.0 - smoothstep(-aa, aa, d);
      if (mask < 0.002) discard;

      float barStart = 1.0 - uBarH;
      vec3 col;
      if (uv.y > barStart) {
        col = texture2D(uBar, vec2(uv.x, (uv.y - barStart) / uBarH)).rgb;
      } else {
        float vy = uv.y / barStart;                                    // 0 bottom .. 1 top of the content window
        float win = min(1.0, (uSize.y * barStart / uSize.x) / uTexAspect); // visible share of the tall capture
        float ty = uScroll * (1.0 - win) + (1.0 - vy) * win;           // 0 = top of the page
        float v = 1.0 - ty;
        float off = uVel * 0.006;
        vec3 site = vec3(
          texture2D(uMap, vec2(uv.x + off, v)).r,
          texture2D(uMap, vec2(uv.x, v)).g,
          texture2D(uMap, vec2(uv.x - off, v)).b);
        // placeholder while the capture loads: dark screen with faint code lines
        float lines = step(0.5, fract(vy * 38.0)) * step(0.08, uv.x) * step(uv.x, 0.18 + 0.6 * fract(sin(floor(vy * 38.0) * 12.9898) * 43758.5));
        vec3 ph = vec3(0.055) + uGreen * lines * 0.05;
        col = mix(ph, site, uLoaded);
        // power-on: a green scan line reveals the screen from the top
        float topY = 1.0 - vy;                                          // 0 at the top of the window
        col = mix(vec3(0.045), col, step(topY, uReveal));
        col += uGreen * exp(-abs(topY - uReveal) * 90.0) * (1.0 - step(0.999, uReveal)) * 0.9;
        col *= 1.0 - 0.18 * pow(abs(uv.x - 0.5) * 2.0, 3.0);           // soft side falloff
      }

      // back side of a screen: dark glass, no mirrored site (the reflection mesh is flipped, so its test is inverted)
      bool back = uReflect > 0.5 ? gl_FrontFacing : !gl_FrontFacing;
      if (back) col = vec3(0.06, 0.065, 0.055);

      // depth: screens on the far side of the ring fade into the dark
      float depth = smoothstep(-uR * 0.75, uR * 0.95, vWorld.z);
      col *= mix(back ? 0.55 : 0.16, 1.0, depth) * mix(0.62, 1.0, uFocus);

      // neon rim on the focused / hovered screen
      float rim = 1.0 - smoothstep(0.0, 0.028, abs(d + 0.014));
      col += uGreen * rim * (0.55 * uFocus + 0.6 * uHover) * depth;
      if (back) col += vec3(0.5, 0.56, 0.44) * rim * 0.45;               // thin glass edge so the ring reads

      float alpha = mask;
      if (back) alpha *= 0.42 + 0.5 * rim;                              // dark glass: the title shows through
      if (uReflect > 0.5) {
        alpha *= 0.2 * pow(1.0 - uv.y, 2.2) * depth;                   // mirrored copy fades into the floor
      }
      gl_FragColor = vec4(col, alpha);
    }`;

  // ---- browser bar texture per site (drawn once fonts are ready) ----
  function drawBar(tex, site) {
    const c = tex.image, g = c.getContext('2d');
    g.clearRect(0, 0, c.width, c.height);
    g.fillStyle = '#131313'; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#262626'; g.fillRect(0, c.height - 2, c.width, 2);
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(36 + i * 26, c.height / 2, 7, 0, Math.PI * 2); g.fillStyle = '#3a3a3a'; g.fill(); }
    const pw = 560, ph = 44, px = (c.width - pw) / 2, py = (c.height - ph) / 2 - 1;
    g.beginPath(); g.roundRect ? g.roundRect(px, py, pw, ph, 22) : g.rect(px, py, pw, ph); g.fillStyle = '#1d1d1d'; g.fill();
    g.font = '500 23px "JetBrains Mono", monospace'; g.fillStyle = '#8d8d8d'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('github.io/' + site.path, c.width / 2, c.height / 2);
    g.font = '600 19px "JetBrains Mono", monospace'; g.textAlign = 'right'; g.fillStyle = '#c0ff33';
    g.fillText('LIVE', c.width - 32, c.height / 2 + 1);
    const w = g.measureText('LIVE').width;
    g.beginPath(); g.arc(c.width - 32 - w - 15, c.height / 2, 5.5, 0, Math.PI * 2); g.fill();
    tex.needsUpdate = true;
  }

  // ---- panels ----
  const loader = new THREE.TextureLoader();
  const size = isSmall ? 640 : 960;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const panels = [], hitMeshes = [];

  SITES.forEach((site, k) => {
    const bc = document.createElement('canvas'); bc.width = 1152; bc.height = 72;
    const barTex = new THREE.CanvasTexture(bc); barTex.colorSpace = THREE.SRGBColorSpace; barTex.anisotropy = 4;
    drawBar(barTex, site);
    const u = {
      uMap: { value: null }, uBar: { value: barTex }, uLoaded: { value: 0 }, uTexAspect: { value: 3 },
      uScroll: { value: 0 }, uFocus: { value: 0 }, uHover: { value: 0 }, uReveal: { value: reduce ? 1 : 0 },
      uVel: { value: 0 }, uBend: { value: 0 }, uReflect: { value: 0 }, uBarH: { value: BAR / PH },
      uR: { value: R }, uTime: { value: 0 }, uSize: { value: new THREE.Vector2(PW, PH) }, uGreen: { value: GREEN },
    };
    const mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: vert, fragmentShader: frag, transparent: true, side: THREE.DoubleSide });
    const ru = { ...u, uReflect: { value: 1 } };   // shares every uniform object except the reflect flag
    const rmat = new THREE.ShaderMaterial({ uniforms: ru, vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, side: THREE.DoubleSide });

    const pivot = new THREE.Group(); pivot.rotation.y = k * STEP; spin.add(pivot);
    const mesh = new THREE.Mesh(geo, mat); mesh.position.z = R; mesh.userData.k = k; pivot.add(mesh);
    const refl = new THREE.Mesh(geo, rmat); refl.position.set(0, 2 * FLOOR, R); refl.scale.y = -1; refl.renderOrder = -1; pivot.add(refl);
    hitMeshes.push(mesh);

    const pn = { site, u, theta: k * STEP, bands: 1, band: 0, activeSince: 0, revealAt: -1, barTex };
    panels.push(pn);

    // textures sit next to this module, whatever page loads it
    loader.load(new URL(`tex/${site.slug}-${size}.webp`, import.meta.url).href, tex => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = maxAniso;
      const ar = tex.image.height / tex.image.width;
      u.uMap.value = tex; u.uTexAspect.value = ar;
      pn.bands = Math.max(1, Math.round(ar / (CH / PW)));     // one band = one 16:10 screen
      u.uLoaded.value = 1;
    });
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => panels.forEach(p => drawBar(p.barTex, p.site)));

  // ---- floor: faint green grid that fades out, same mood as the hero grid ----
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { uGreen: { value: GREEN } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uGreen; varying vec2 vUv;
      void main(){
        vec2 p = (vUv - 0.5) * 60.0; float r = length(p);
        vec2 q = p * 0.55; vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
        float line = 1.0 - min(min(g.x, g.y), 1.0);
        float fade = smoothstep(21.0, 4.0, r);
        float glow = smoothstep(11.0, 0.0, r);
        gl_FragColor = vec4(uGreen, (line * 0.16 + glow * 0.05) * fade);
      }`,
  }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR; floor.renderOrder = -2; tilt.add(floor);

  // ---- HUD ----
  const $ = id => document.getElementById(id);
  const elNum = $('reelNum'), elName = $('reelName'), elMeta = $('reelMeta'), elOpen = $('reelOpen'), elMore = $('reelMore');
  const elTicks = $('reelTicks'), elFill = $('reelFill'), elCursor = $('reelCursor');
  SITES.forEach(() => { const t = document.createElement('i'); elTicks.appendChild(t); });
  const ticks = [...elTicks.children];
  let shown = -1;
  function setActive(k) {
    if (k === shown) return; shown = k;
    const s = SITES[k];
    elNum.textContent = String(k + 1).padStart(2, '0');
    elName.textContent = s.name; elMeta.textContent = s.meta;
    elOpen.href = G + s.path + '/';
    ticks.forEach((t, i) => t.classList.toggle('on', i === k));
    if (!reduce && elName.animate) {
      const o = { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' };
      elName.animate([{ transform: 'translateY(105%)' }, { transform: 'translateY(0)' }], o);
      elMeta.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], o);
      elNum.animate([{ opacity: 0 }, { opacity: 1 }], o);
    }
  }
  function openCase(k) {
    const card = document.querySelector('.site-card[data-case="' + SITES[k].key + '"]');
    if (card) card.click(); else window.open(G + SITES[k].path + '/', '_blank', 'noopener');
  }
  elMore.addEventListener('click', () => openCase(Math.max(shown, 0)));
  setActive(0);

  // ---- scroll: sticky section, progress 0..1 while it is pinned ----
  let targetP = 0, p = 0, enterT = 0, enter = 0;
  function readScroll() {
    const r = root.getBoundingClientRect(), vh = innerHeight;
    targetP = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
    enterT = Math.min(1, Math.max(0, 1 - r.top / vh));
  }
  addEventListener('scroll', readScroll, { passive: true });
  readScroll(); enter = enterT; p = targetP;

  // ---- drag to spin, click to open ----
  let drag = 0, dragTarget = 0, down = null, hover = -1, mx = 0, my = 0, pmx = 0, pmy = 0;
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hitMeshes, false).find(h => h.point.z > 0);
    return hit ? hit.object.userData.k : -1;
  }
  canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, d: dragTarget, moved: false }; });
  const sticky = root.querySelector('.reel__sticky');
  addEventListener('pointermove', e => {
    const r = sticky.getBoundingClientRect();
    mx = (e.clientX / innerWidth) * 2 - 1; my = (e.clientY / innerHeight) * 2 - 1;
    if (down) {
      const dx = e.clientX - down.x;
      if (Math.abs(dx) > 6) down.moved = true;
      dragTarget = down.d + dx * 0.0045;
    }
    if (finePointer && e.target === canvas) {
      hover = down && down.moved ? -1 : pick(e);
      canvas.style.cursor = hover >= 0 ? 'pointer' : (down ? 'grabbing' : 'grab');
      elCursor.style.transform = `translate(${e.clientX - r.left}px, ${e.clientY - r.top}px)`;
    } else if (e.target !== canvas) hover = -1;
    elCursor.classList.toggle('on', hover >= 0);
  }, { passive: true });
  addEventListener('pointerup', e => {
    if (!down) return;
    const wasClick = !down.moved;
    down = null;
    dragTarget = Math.round(dragTarget / STEP) * STEP;     // settle on a screen
    if (wasClick && e.target === canvas) { const k = pick(e); if (k >= 0) openCase(k); }
  });
  addEventListener('pointercancel', () => { if (down) { down = null; dragTarget = Math.round(dragTarget / STEP) * STEP; } });
  canvas.addEventListener('pointerleave', () => { hover = -1; elCursor.classList.remove('on'); });

  // ---- sizing ----
  let aspect = 1;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    aspect = w / h;
    camera.fov = aspect < 1 ? 44 : 32;
    camera.aspect = aspect;
    // shift the picture down so the ring sits under the title and above the HUD
    const shift = aspect < 1 ? 0.0 : 0.11;
    camera.setViewOffset(w, h, 0, -h * shift, w, h);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas); resize();

  // ---- loop (only while the section is on screen) ----
  let running = false, raf = 0, revealed = false, lastRot = 0, vel = 0;
  new IntersectionObserver(([en]) => {
    running = en.isIntersecting;
    if (running && !raf) raf = requestAnimationFrame(frame);
  }, { rootMargin: '120px' }).observe(root);

  // front screen timeline: hold the hero, glide to each highlight, hold, then glide back to the hero
  const HOLD0 = 2.6, GLIDE = 0.95, HOLD = 2.1, BACK = 1.4;
  const easeIO = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  function bandAt(time, nb) {
    if (nb < 2) return 0;
    let e = time % (HOLD0 + (nb - 1) * (GLIDE + HOLD) + BACK);
    if (e < HOLD0) return 0;
    e -= HOLD0;
    for (let b = 1; b < nb; b++) {
      if (e < GLIDE) return b - 1 + easeIO(e / GLIDE);
      e -= GLIDE;
      if (e < HOLD) return b;
      e -= HOLD;
    }
    return (nb - 1) * (1 - easeIO(Math.min(1, e / BACK)));
  }
  let activeK = -1;

  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

  function frame(now) {
    raf = 0;
    if (!running) return;
    const t = now * 0.001;
    p += (targetP - p) * (reduce ? 1 : 0.085);
    enter += (enterT - enter) * 0.08;
    drag += (dragTarget - drag) * 0.12;
    pmx += (mx - pmx) * 0.05; pmy += (my - pmy) * 0.05;

    // rotation: dwell on each site, glide between them
    const pp = Math.min(1, Math.max(0, (p - 0.04) / 0.9));
    const f = pp * (N - 1), i = Math.floor(f), fr = f - i;
    const eased = i + smooth(0.22, 0.78, fr);
    const rot = -eased * STEP + drag + (reduce ? 0 : Math.sin(t * 0.35) * 0.03);
    spin.rotation.y = rot;
    const dr = Math.abs(rot - lastRot); lastRot = rot;
    vel += (Math.min(dr * 18, 1.4) - vel) * 0.12;
    if (reduce) vel = 0;

    // camera: flies in while the section enters, then orbits a touch with the mouse.
    // Distance keeps the front screen at a fixed share of the frame (width on phones, height on desktop).
    const e = 1 - Math.pow(1 - Math.min(1, enter), 3);
    const fovV = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2), fovH = fovV * aspect;
    const dist = Math.max(PW / ((aspect < 1 ? 0.9 : 0.5) * fovH), PH / ((aspect < 1 ? 0.3 : 0.42) * fovV));
    const lift = dist * (aspect < 1 ? 0.42 : 0.27);             // look down on the ring so the far side peeks out
    camera.position.set(pmx * 0.9, lift + (1 - e) * 4 - pmy * 0.5, R + dist + (1 - e) * 12);
    camera.lookAt(0, -(1 - e) * 1.5, R);

    // power the screens on once the ring is in view
    if (!revealed && enter > 0.35) { revealed = true; panels.forEach((pn, k) => { pn.revealAt = t + 0.15 + k * 0.09; }); }

    let best = 0, bestA = 9;
    panels.forEach((pn, k) => { const a = Math.abs(wrap(pn.theta + rot)); if (a < bestA) { bestA = a; best = k; } });
    if (best !== activeK) { activeK = best; panels[best].activeSince = t; }
    panels.forEach((pn, k) => {
      const a = Math.abs(wrap(pn.theta + rot));
      const focus = 1 - smooth(0.06, STEP * 0.8, a);
      pn.u.uFocus.value += (focus - pn.u.uFocus.value) * 0.15;
      pn.u.uHover.value += ((k === hover ? 1 : 0) - pn.u.uHover.value) * 0.18;
      // the screen in front runs its highlight timeline; the rest settle back on the hero
      const settled = bestA < 0.05 && vel < 0.08 && pn.u.uReveal.value >= 1;   // timeline starts once the screen is on and still
      if (k === activeK && settled && !reduce) pn.band = bandAt(Math.max(0, t - pn.activeSince), pn.bands);
      else { pn.band += (0 - pn.band) * 0.08; if (k === activeK) pn.activeSince = t; }
      pn.u.uScroll.value = pn.bands > 1 ? pn.band / (pn.bands - 1) : 0;
      pn.u.uVel.value = vel;
      pn.u.uBend.value = vel * 0.55;
      if (pn.revealAt > 0) pn.u.uReveal.value = Math.min(1, Math.max(0, (t - pn.revealAt) / 0.8));
    });
    setActive(best);
    if (elFill) elFill.style.transform = `scaleX(${pp.toFixed(4)})`;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  root.classList.remove('no-gl');
  root.classList.add('gl-ready');
}
