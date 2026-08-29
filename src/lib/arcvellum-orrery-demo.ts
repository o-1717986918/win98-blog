import { Application, Graphics } from 'pixi.js';

type Point3 = { x: number; y: number; z: number };
type ParallaxView = { x: number; y: number; z: number; w: number };
type Grammar = 'constellation' | 'spine' | 'braid' | 'strata' | 'loop' | 'stage';
type DemoNode = {
  id: string; type: string; signal: string; element: HTMLButtonElement;
  point: Point3; target: Point3; screen: { x: number; y: number; depth: number };
};

const PARENTS: Record<string, string> = {
  ch1: 'book', ch2: 'book', ch3: 'book', s1: 'ch1', s2: 'ch1', s3: 'ch2', s4: 'ch3',
  c1: 'book', c2: 'ch3', task: 's3', review: 's3', style: 'book', reader: 's4',
};
const COLORS: Record<string, number> = { book: 0xd1b875, chapter: 0xd77a60, scene: 0x9db69f, character: 0x8baed1, task: 0xc79bd6, evidence: 0xb9aa83 };

function seeded(seed = 42099) {
  let value = seed;
  return () => ((value = value * 48271 % 2147483647) / 2147483647);
}

function layoutFor(grammar: Grammar, nodes: DemoNode[]): Map<string, Point3> {
  const result = new Map<string, Point3>();
  const chapters = nodes.filter((node) => node.type === 'chapter');
  const primary = nodes.filter((node) => node.type === 'chapter' || node.type === 'scene');
  result.set('book', { x: 0, y: 0, z: 0 });
  const chapterPoint = (index: number): Point3 => {
    if (grammar === 'constellation') {
      const angle = index / Math.max(1, chapters.length) * Math.PI * 2 + .3;
      return { x: Math.cos(angle) * 25, y: (index - 1) * 8.2, z: Math.sin(angle) * 25 };
    }
    if (grammar === 'spine') return { x: (index - 1) * 25, y: 5, z: Math.sin(index * 1.2) * 3 };
    if (grammar === 'braid') return { x: (index - 1) * 23, y: Math.sin(index * Math.PI) * 10 + 5, z: Math.cos(index * Math.PI) * 12 };
    if (grammar === 'strata') return { x: (index - 1) * 24, y: 14, z: (index % 2 ? 8 : -8) };
    if (grammar === 'loop') { const angle = index / Math.max(1, chapters.length) * Math.PI * 2; return { x: Math.cos(angle) * 28, y: Math.sin(angle) * 7, z: Math.sin(angle) * 28 }; }
    return { x: (index - 1) * 25, y: index % 2 ? 9 : -6, z: index % 2 ? -10 : 10 };
  };
  chapters.forEach((node, index) => result.set(node.id, chapterPoint(index)));
  const golden = Math.PI * (3 - Math.sqrt(5));
  nodes.filter((node) => node.type === 'scene').forEach((node, index) => {
    const parent = result.get(PARENTS[node.id] ?? '') ?? { x: 0, y: 0, z: 0 };
    const localIndex = node.id === 's2' ? 1 : 0;
    const angle = localIndex * golden + index * .61;
    const radius = 7 + localIndex * 2.3;
    result.set(node.id, grammar === 'strata'
      ? { x: parent.x + Math.cos(angle) * radius, y: -2, z: parent.z + Math.sin(angle) * 3 }
      : { x: parent.x + Math.cos(angle) * radius, y: parent.y + Math.sin(angle * .82) * 3.8, z: parent.z + Math.sin(angle) * radius * .86 });
  });
  nodes.filter((node) => !result.has(node.id)).forEach((node, index) => {
    const parent = result.get(PARENTS[node.id] ?? '') ?? result.get('book')!;
    const angle = index * golden + (node.type === 'character' ? .8 : 2.1);
    const radius = node.type === 'character' ? 13 : 9;
    const lift = node.type === 'character' ? 10 : -8;
    result.set(node.id, { x: parent.x + Math.cos(angle) * radius, y: parent.y + lift + (index % 3) * 2, z: parent.z + Math.sin(angle) * radius });
  });
  if (grammar === 'braid') primary.forEach((node, index) => result.set(node.id, { x: (index - primary.length / 2) * 8, y: Math.sin(index * .9) * 10, z: Math.cos(index * .9) * 13 }));
  return result;
}

function normalizeView(view: ParallaxView): ParallaxView {
  const length = Math.hypot(view.x, view.y, view.z, view.w);
  if (!Number.isFinite(length) || length < 1e-8) return { x: 0, y: 0, z: 0, w: 1 };
  return { x: view.x / length, y: view.y / length, z: view.z / length, w: view.w / length };
}

function axisAngle(axis: Point3, angle: number): ParallaxView {
  const half = angle / 2, sine = Math.sin(half);
  return { x: axis.x * sine, y: axis.y * sine, z: axis.z * sine, w: Math.cos(half) };
}

function multiplyView(left: ParallaxView, right: ParallaxView): ParallaxView {
  return {
    x: left.w * right.x + left.x * right.w + left.y * right.z - left.z * right.y,
    y: left.w * right.y - left.x * right.z + left.y * right.w + left.z * right.x,
    z: left.w * right.z + left.x * right.y - left.y * right.x + left.z * right.w,
    w: left.w * right.w - left.x * right.x - left.y * right.y - left.z * right.z,
  };
}

function viewFromAngles(yaw: number, pitch: number): ParallaxView {
  return normalizeView(multiplyView(axisAngle({ x: 1, y: 0, z: 0 }, pitch), axisAngle({ x: 0, y: 1, z: 0 }, yaw)));
}

// Adapted from ArcVellum's parallaxProjection.ts: blank-field drag composes an
// unrestricted unit-quaternion orbit instead of rotating a decorative 2D map.
function viewFromDrag(origin: ParallaxView, deltaX: number, deltaY: number): ParallaxView {
  const yaw = axisAngle({ x: 0, y: 1, z: 0 }, deltaX * .0052);
  const pitch = axisAngle({ x: 1, y: 0, z: 0 }, -deltaY * .0038);
  return normalizeView(multiplyView(pitch, multiplyView(yaw, normalizeView(origin))));
}

function orientPoint(point: Point3, view: ParallaxView): Point3 {
  const q = normalizeView(view);
  const tx = 2 * (q.y * point.z - q.z * point.y);
  const ty = 2 * (q.z * point.x - q.x * point.z);
  const tz = 2 * (q.x * point.y - q.y * point.x);
  return {
    x: point.x + q.w * tx + (q.y * tz - q.z * ty),
    y: point.y + q.w * ty + (q.z * tx - q.x * tz),
    z: point.z + q.w * tz + (q.x * ty - q.y * tx),
  };
}

function viewAngles(view: ParallaxView) {
  const q = normalizeView(view);
  return {
    yaw: Math.atan2(2 * (q.w * q.y + q.x * q.z), 1 - 2 * (q.y * q.y + q.x * q.x)),
    pitch: Math.asin(Math.max(-1, Math.min(1, 2 * (q.w * q.x - q.y * q.z)))),
  };
}

function project(point: Point3, width: number, height: number, view: ParallaxView, zoom: number) {
  const oriented = orientPoint(point, view);
  const scale = Math.min(width, height) / 70 * zoom;
  // Preserve the production renderer's oblique 126:29 / 58:88 projection and
  // depthScale contract while fitting it to this compact documentation stage.
  const depth = Math.max(.72, Math.min(1.28, .99 + oriented.z * .025 + oriented.y * .012));
  return {
    x: width / 2 + (oriented.x + oriented.z * (29 / 126)) * scale,
    y: height / 2 + (oriented.z * (58 / 126) - oriented.y * (88 / 126)) * scale,
    depth,
  };
}

export async function mountArcVellumOrrery(demo: HTMLElement) {
  if (demo.dataset.spatialMounted === 'true') return () => {};
  demo.dataset.spatialMounted = 'true';
  const stage = demo.querySelector<HTMLElement>('[data-stage]')!;
  const host = demo.querySelector<HTMLElement>('[data-parallax-canvas]')!;
  const buttons = [...demo.querySelectorAll<HTMLButtonElement>('[data-node]')];
  const nodes: DemoNode[] = buttons.map((element) => ({ id: element.dataset.node!, type: element.dataset.type!, signal: element.dataset.signal!, element, point: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 }, screen: { x: 0, y: 0, depth: 1 } }));
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const relations = JSON.parse(demo.dataset.relations ?? '[]') as Array<[string, string]>;
  const app = new Application();
  await app.init({ resizeTo: host, backgroundAlpha: 0, antialias: true, autoDensity: true, resolution: Math.min(devicePixelRatio || 1, 1.5), preference: 'webgl', powerPreference: 'low-power' });
  app.canvas.className = 'orrery-parallax-canvas'; app.canvas.setAttribute('aria-hidden', 'true'); host.replaceChildren(app.canvas);
  const sky = new Graphics(), instruments = new Graphics(), relationsLayer = new Graphics(), glyphs = new Graphics();
  app.stage.addChild(sky, instruments, relationsLayer, glyphs);
  const random = seeded();
  const stars = Array.from({ length: 150 }, (_, index) => ({ x: random(), y: random(), size: .35 + random() * (index % 17 === 0 ? 2.2 : 1.1), depth: .15 + random() * .85, phase: random() * Math.PI * 2 }));
  let grammar: Grammar = 'constellation', focus = 'all', signalMode = 'main';
  let view = viewFromAngles(-.18, .11), dragOriginView = { ...view }, zoom = .92, targetZoom = zoom;
  let dragging = false, pointerX = 0, pointerY = 0, selected = 'book';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const applyLayout = (next: Grammar) => {
    grammar = next; stage.dataset.grammar = next;
    const positions = layoutFor(next, nodes); nodes.forEach((node) => { node.target = positions.get(node.id) ?? node.target; });
    targetZoom = next === 'spine' || next === 'braid' ? .78 : .92;
  };
  applyLayout(grammar); nodes.forEach((node) => { node.point = { ...node.target }; });
  const setExclusive = (selector: string, active: HTMLButtonElement) => demo.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => button.setAttribute('aria-pressed', String(button === active)));
  const updateInspector = (node: DemoNode) => {
    selected = node.id; buttons.forEach((item) => item.classList.toggle('selected', item === node.element));
    demo.querySelector<HTMLElement>('[data-node-type]')!.textContent = node.type.toUpperCase();
    demo.querySelector<HTMLElement>('[data-node-title]')!.textContent = node.element.dataset.title ?? '';
    demo.querySelector<HTMLElement>('[data-node-status]')!.textContent = node.element.dataset.status ?? '';
    demo.querySelector<HTMLElement>('[data-node-brief]')!.textContent = node.element.dataset.brief ?? '';
    demo.querySelector<HTMLElement>('[data-node-evidence]')!.textContent = node.element.dataset.evidence ?? '';
    demo.querySelector<HTMLElement>('[data-node-action]')!.firstChild!.textContent = `${node.element.dataset.action ?? '打开'} `;
    targetZoom = 1.18;
  };
  demo.querySelectorAll<HTMLButtonElement>('[data-grammar]').forEach((button) => button.addEventListener('click', () => { setExclusive('[data-grammar]', button); applyLayout((button.dataset.grammar ?? 'constellation') as Grammar); }));
  demo.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((button) => button.addEventListener('click', () => { setExclusive('[data-level]', button); focus = button.dataset.level ?? 'all'; stage.dataset.focus = focus; targetZoom = focus === 'all' ? .92 : 1.08; }));
  demo.querySelectorAll<HTMLButtonElement>('[data-signal]').forEach((button) => button.addEventListener('click', () => { setExclusive('[data-signal]', button); signalMode = button.dataset.signal ?? 'main'; stage.dataset.signalMode = signalMode; }));
  nodes.forEach((node) => node.element.addEventListener('click', () => updateInspector(node)));
  demo.querySelectorAll<HTMLButtonElement>('[data-list-node]').forEach((button) => button.addEventListener('click', () => { const node = nodeMap.get(button.dataset.listNode ?? ''); if (node) { updateInspector(node); node.element.focus(); } }));

  const onPointerDown = (event: PointerEvent) => { if ((event.target as Element).closest('button')) return; dragging = true; pointerX = event.clientX; pointerY = event.clientY; dragOriginView = { ...view }; stage.setPointerCapture(event.pointerId); };
  const onPointerMove = (event: PointerEvent) => { if (!dragging) return; view = viewFromDrag(dragOriginView, event.clientX - pointerX, event.clientY - pointerY); };
  const onPointerUp = (event: PointerEvent) => { dragging = false; if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId); };
  const onWheel = (event: WheelEvent) => { event.preventDefault(); targetZoom = Math.max(.5, Math.min(1.65, targetZoom * Math.exp(-event.deltaY * .001))); };
  stage.addEventListener('pointerdown', onPointerDown); stage.addEventListener('pointermove', onPointerMove); stage.addEventListener('pointerup', onPointerUp); stage.addEventListener('pointercancel', onPointerUp); stage.addEventListener('wheel', onWheel, { passive: false });

  let elapsed = 0;
  const render = (ticker: { deltaMS: number }) => {
    elapsed += ticker.deltaMS;
    const ease = reduced ? 1 : .085; zoom += (targetZoom - zoom) * ease;
    const angles = viewAngles(view);
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
    sky.clear();
    for (const star of stars) {
      const driftX = angles.yaw * width * .035 * star.depth, driftY = angles.pitch * height * .04 * star.depth;
      const x = ((star.x * width + driftX) % width + width) % width, y = ((star.y * height + driftY) % height + height) % height;
      const alpha = .18 + star.depth * .48 + (reduced ? 0 : Math.sin(elapsed * .0012 + star.phase) * .08);
      sky.circle(x, y, star.size * (.5 + star.depth)).fill({ color: star.depth > .78 ? 0xd1b875 : 0x9db69f, alpha });
    }
    const nebulaY = height * (.47 + Math.sin(angles.pitch) * .08);
    sky.moveTo(-20, nebulaY - 35).bezierCurveTo(width * .28, nebulaY + 50, width * .68, nebulaY - 65, width + 20, nebulaY + 20).stroke({ color: 0x678b78, alpha: .08, width: Math.max(35, height * .1) });
    instruments.clear();
    for (const radius of [16, 28, 39]) {
      let started = false;
      for (let index = 0; index <= 80; index++) {
        const angle = index / 80 * Math.PI * 2;
        const point = project({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius * .42, z: Math.sin(angle) * radius }, width, height, view, zoom);
        if (!started) { instruments.moveTo(point.x, point.y); started = true; } else instruments.lineTo(point.x, point.y);
      }
      instruments.stroke({ color: radius === 28 ? 0xd1b875 : 0x789b84, alpha: radius === 28 ? .15 : .08, width: 1 });
    }
    nodes.forEach((node) => {
      node.point.x += (node.target.x - node.point.x) * (reduced ? 1 : .08); node.point.y += (node.target.y - node.point.y) * (reduced ? 1 : .08); node.point.z += (node.target.z - node.point.z) * (reduced ? 1 : .08);
      const ambient = reduced ? 0 : Math.sin(elapsed * .0007 + node.id.length * 1.7) * .35;
      node.screen = project({ ...node.point, y: node.point.y + ambient }, width, height, view, zoom);
    });
    relationsLayer.clear();
    relations.forEach(([from, to]) => { const a = nodeMap.get(from), b = nodeMap.get(to); if (!a || !b || (signalMode === 'main' && (a.signal === 'extra' || b.signal === 'extra'))) return; relationsLayer.moveTo(a.screen.x, a.screen.y).lineTo(b.screen.x, b.screen.y).stroke({ color: 0x9db69f, alpha: .18 * Math.min(a.screen.depth, b.screen.depth), width: Math.max(.7, zoom) }); });
    glyphs.clear();
    nodes.slice().sort((a, b) => a.screen.depth - b.screen.depth).forEach((node) => {
      const signalVisible = signalMode === 'all' || node.signal === 'main';
      const focused = focus === 'all' || node.type === focus;
      const visible = signalVisible && node.screen.x > -80 && node.screen.x < width + 80 && node.screen.y > -50 && node.screen.y < height + 50;
      const radius = (node.type === 'book' ? 8 : node.type === 'chapter' ? 5.5 : 3.5) * node.screen.depth;
      if (visible) {
        glyphs.circle(node.screen.x, node.screen.y, radius * 2.4).fill({ color: COLORS[node.type] ?? 0x9db69f, alpha: node.id === selected ? .09 : .025 });
        glyphs.circle(node.screen.x, node.screen.y, radius).fill({ color: COLORS[node.type] ?? 0x9db69f, alpha: focused ? .85 : .26 });
        if (node.type === 'chapter') glyphs.circle(node.screen.x, node.screen.y, radius * 1.75).stroke({ color: COLORS.chapter!, alpha: .35, width: 1 });
      }
      node.element.style.left = `${node.screen.x}px`; node.element.style.top = `${node.screen.y}px`;
      node.element.style.setProperty('--depth-scale', String(node.screen.depth));
      node.element.dataset.lod = zoom * node.screen.depth < .72 ? 'far' : zoom * node.screen.depth < 1 ? 'mid' : 'near';
      node.element.style.opacity = visible ? String(focused ? Math.min(1, .62 + node.screen.depth * .32) : .25) : '0';
      node.element.style.pointerEvents = visible ? 'auto' : 'none';
    });
    const camera = demo.querySelector<HTMLElement>('.orrery-demo__camera span'); if (camera) camera.textContent = `FIELD / ${Math.round(zoom * 100)}% · Y ${Math.round(angles.yaw * 57.3)}°`;
  };
  app.ticker.add(render);
  return () => { stage.removeEventListener('pointerdown', onPointerDown); stage.removeEventListener('pointermove', onPointerMove); stage.removeEventListener('pointerup', onPointerUp); stage.removeEventListener('pointercancel', onPointerUp); stage.removeEventListener('wheel', onWheel); app.destroy(true, { children: true }); delete demo.dataset.spatialMounted; };
}
