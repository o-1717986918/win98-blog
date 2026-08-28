import { Application, Sprite, Texture } from 'pixi.js';

export type Rgb = [number, number, number];

export interface FieldPalette {
  primary: Rgb;
  secondary: Rgb;
  warm: Rgb;
  light: number;
}

export interface FieldController {
  setPalette: (palette: FieldPalette) => void;
  setRunning: (running: boolean) => void;
  destroy: () => void;
}

type Mote = {
  sprite: Sprite;
  x: number;
  y: number;
  vx: number;
  vy: number;
  depth: number;
  phase: number;
  drift: number;
  colorSlot: number;
  alpha: number;
  scale: number;
};

const tint = ([red, green, blue]: Rgb) => (
  (Math.round(red * 255) << 16) | (Math.round(green * 255) << 8) | Math.round(blue * 255)
);

function makeMoteTexture(): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (!context) return Texture.WHITE;
  const glow = context.createRadialGradient(32, 32, 0, 32, 32, 31);
  glow.addColorStop(0, 'rgba(255,255,255,1)');
  glow.addColorStop(0.08, 'rgba(255,255,255,.92)');
  glow.addColorStop(0.25, 'rgba(255,255,255,.28)');
  glow.addColorStop(0.58, 'rgba(255,255,255,.055)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 64, 64);
  return Texture.from(canvas);
}

export async function mountPixiField(host: HTMLElement, initialPalette: FieldPalette): Promise<FieldController> {
  const compact = matchMedia('(max-width: 720px)').matches;
  const app = new Application();
  await app.init({
    preference: 'webgl',
    resizeTo: window,
    backgroundAlpha: 0,
    antialias: false,
    autoDensity: true,
    resolution: Math.min(devicePixelRatio || 1, compact ? 1 : 1.25),
    powerPreference: 'low-power',
    autoStart: false,
  });

  app.canvas.className = 'pixi-field-canvas';
  app.canvas.setAttribute('aria-hidden', 'true');
  host.replaceChildren(app.canvas);

  const texture = makeMoteTexture();
  const motes: Mote[] = [];
  const count = compact ? 108 : Math.min(246, Math.max(168, Math.round(innerWidth * innerHeight / 6500)));
  let seed = 421337;
  const random = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };

  const paletteTints = [tint(initialPalette.primary), tint(initialPalette.secondary), tint(initialPalette.warm)];
  for (let index = 0; index < count; index += 1) {
    const depth = 0.14 + Math.pow(random(), 1.5) * 0.86;
    const sprite = new Sprite(texture);
    const scale = 0.065 + depth * depth * 0.235 + random() * 0.05;
    const colorSlot = random() > 0.94 ? 2 : random() > 0.58 ? 1 : 0;
    const alpha = (initialPalette.light ? 0.12 : 0.14) + depth * (initialPalette.light ? 0.32 : 0.42);
    sprite.anchor.set(0.5);
    sprite.scale.set(scale);
    sprite.alpha = alpha;
    sprite.tint = paletteTints[colorSlot] ?? paletteTints[0]!;
    const x = random() * innerWidth;
    const y = random() * innerHeight;
    sprite.position.set(x, y);
    app.stage.addChild(sprite);
    motes.push({
      sprite,
      x,
      y,
      vx: 0,
      vy: 0,
      depth,
      phase: random() * Math.PI * 2,
      drift: random() > 0.5 ? 1 : -1,
      colorSlot,
      alpha,
      scale,
    });
  }

  let pointerX = innerWidth * 0.5;
  let pointerY = innerHeight * 0.46;
  let previousPointerX = pointerX;
  let previousPointerY = pointerY;
  let pointerEnergy = 0;
  let pointerPresent = false;
  let viewTargetX = 0;
  let viewTargetY = 0;
  let viewX = 0;
  let viewY = 0;
  let resizeFrame = 0;
  let running = false;
  let elapsed = 0;
  let palette = initialPalette;

  const layout = () => {
    resizeFrame = 0;
    for (const mote of motes) {
      mote.x = Math.min(mote.x, innerWidth + 18);
      mote.y = Math.min(mote.y, innerHeight + 18);
    }
  };
  const onResize = () => {
    if (!resizeFrame) resizeFrame = requestAnimationFrame(layout);
  };
  const readingAttenuation = (target: EventTarget | null) => (
    target instanceof Element && target.closest('.prose, [data-reading-surface]') ? 0.28 : 1
  );
  const onPointerMove = (event: PointerEvent) => {
    previousPointerX = pointerX;
    previousPointerY = pointerY;
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerPresent = true;
    viewTargetX = event.clientX / Math.max(innerWidth, 1) * 2 - 1;
    viewTargetY = event.clientY / Math.max(innerHeight, 1) * 2 - 1;
    const field = host.closest<HTMLElement>('[data-ambient-field]');
    field?.style.setProperty('--view-x', viewTargetX.toFixed(3));
    field?.style.setProperty('--view-y', viewTargetY.toFixed(3));
    const speed = Math.hypot(pointerX - previousPointerX, pointerY - previousPointerY);
    pointerEnergy = Math.min(1, pointerEnergy + speed * 0.018 * readingAttenuation(event.target));
  };
  const onPointerDown = (event: PointerEvent) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    const attenuation = readingAttenuation(event.target);
    for (const mote of motes) {
      const dx = mote.x - pointerX;
      const dy = mote.y - pointerY;
      const distance = Math.max(18, Math.hypot(dx, dy));
      if (distance > 340) continue;
      const force = Math.pow(1 - distance / 340, 2) * (3.2 + mote.depth * 7.2) * attenuation;
      mote.vx += dx / distance * force;
      mote.vy += dy / distance * force;
    }
    pointerEnergy = Math.min(1, pointerEnergy + 0.46 * attenuation);
  };
  const onPointerLeave = () => {
    pointerPresent = false;
    viewTargetX = 0;
    viewTargetY = 0;
    const field = host.closest<HTMLElement>('[data-ambient-field]');
    field?.style.setProperty('--view-x', '0');
    field?.style.setProperty('--view-y', '0');
  };

  app.ticker.maxFPS = compact ? 28 : 36;
  app.ticker.add((ticker) => {
    const delta = Math.min(ticker.deltaTime, 2.2);
    elapsed += ticker.deltaMS * 0.001;
    pointerEnergy *= Math.pow(0.9, delta);
    const pointerDx = pointerX - previousPointerX;
    const pointerDy = pointerY - previousPointerY;
    previousPointerX += pointerDx * 0.14;
    previousPointerY += pointerDy * 0.14;
    viewX += (viewTargetX - viewX) * Math.min(1, .045 * delta);
    viewY += (viewTargetY - viewY) * Math.min(1, .045 * delta);

    for (const mote of motes) {
      const idleX = Math.sin(elapsed * (0.11 + mote.depth * 0.07) + mote.phase) * mote.drift;
      const idleY = Math.cos(elapsed * (0.09 + mote.depth * 0.05) + mote.phase * 1.37);
      mote.vx += idleX * 0.0018 * mote.depth * delta;
      mote.vy += idleY * 0.0014 * mote.depth * delta;

      if (pointerPresent) {
        const dx = pointerX - mote.x;
        const dy = pointerY - mote.y;
        const distance = Math.max(24, Math.hypot(dx, dy));
        if (distance < 285) {
          const proximity = Math.pow(1 - distance / 285, 2) * mote.depth;
          const pull = proximity * (0.014 + pointerEnergy * 0.038) * delta;
          const swirl = proximity * pointerEnergy * 0.026 * delta;
          mote.vx += dx / distance * pull - dy / distance * swirl;
          mote.vy += dy / distance * pull + dx / distance * swirl;
          mote.vx += pointerDx * proximity * 0.0038;
          mote.vy += pointerDy * proximity * 0.0038;
          mote.sprite.alpha = Math.min(mote.alpha * 2.15, mote.alpha + proximity * 0.28);
          mote.sprite.scale.set(mote.scale * (1 + proximity * 0.48));
        } else {
          mote.sprite.alpha += (mote.alpha - mote.sprite.alpha) * 0.035 * delta;
          mote.sprite.scale.set(mote.sprite.scale.x + (mote.scale - mote.sprite.scale.x) * 0.035 * delta);
        }
      } else {
        mote.sprite.alpha += (mote.alpha - mote.sprite.alpha) * 0.035 * delta;
        mote.sprite.scale.set(mote.sprite.scale.x + (mote.scale - mote.sprite.scale.x) * 0.035 * delta);
      }

      mote.vx *= Math.pow(0.965, delta);
      mote.vy *= Math.pow(0.965, delta);
      mote.x += (0.022 + mote.depth * 0.045 + mote.vx) * delta;
      mote.y += (mote.vy - 0.004 * mote.depth) * delta;
      const margin = 26;
      if (mote.x > innerWidth + margin) mote.x = -margin;
      if (mote.x < -margin) mote.x = innerWidth + margin;
      if (mote.y > innerHeight + margin) mote.y = -margin;
      if (mote.y < -margin) mote.y = innerHeight + margin;
      const perspective = 7 + mote.depth * 27;
      mote.sprite.position.set(mote.x + viewX * perspective, mote.y + viewY * perspective * .72);
      const twinkle = 0.94 + Math.sin(elapsed * (0.32 + mote.depth * 0.24) + mote.phase) * 0.06;
      mote.sprite.alpha *= twinkle;
    }
  });

  addEventListener('resize', onResize, { passive: true });
  addEventListener('pointermove', onPointerMove, { passive: true });
  addEventListener('pointerdown', onPointerDown, { passive: true });
  document.documentElement.addEventListener('mouseleave', onPointerLeave);
  layout();
  app.render();

  const setPalette = (nextPalette: FieldPalette) => {
    palette = nextPalette;
    const nextTints = [tint(palette.primary), tint(palette.secondary), tint(palette.warm)];
    for (const mote of motes) {
      mote.sprite.tint = nextTints[mote.colorSlot] ?? nextTints[0]!;
      mote.alpha = (palette.light ? 0.12 : 0.14) + mote.depth * (palette.light ? 0.32 : 0.42);
    }
    if (!running) app.render();
  };
  const setRunning = (shouldRun: boolean) => {
    if (running === shouldRun) return;
    running = shouldRun;
    if (running) app.start();
    else {
      app.stop();
      app.render();
    }
  };
  const destroy = () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    removeEventListener('resize', onResize);
    removeEventListener('pointermove', onPointerMove);
    removeEventListener('pointerdown', onPointerDown);
    document.documentElement.removeEventListener('mouseleave', onPointerLeave);
    texture.destroy(true);
    app.destroy({ removeView: true }, { children: true });
  };

  return { setPalette, setRunning, destroy };
}
