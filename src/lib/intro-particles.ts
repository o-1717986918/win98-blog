export type IntroRgb = [number, number, number];

export interface IntroPalette {
  primary: IntroRgb;
  secondary: IntroRgb;
  warm: IntroRgb;
  text: IntroRgb;
  light: boolean;
}

export interface IntroParticleController {
  scatter: () => void;
  destroy: () => void;
}

type Particle = {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  depth: number;
  size: number;
  phase: number;
  color: number;
  mark: number;
  kicked: boolean;
};

const clamp = (value: number, minimum = 0, maximum = 1) => Math.min(maximum, Math.max(minimum, value));
const smoothstep = (from: number, to: number, value: number) => {
  const amount = clamp((value - from) / Math.max(to - from, 0.0001));
  return amount * amount * (3 - 2 * amount);
};
const rgb = (color: IntroRgb, alpha: number) => `rgba(${color[0]},${color[1]},${color[2]},${alpha})`;

export function mountIntroParticles(
  canvas: HTMLCanvasElement,
  palette: IntroPalette,
  label = SITE.title,
): IntroParticleController | undefined {
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) return;

  const compact = matchMedia('(max-width: 640px)').matches;
  const colors = [palette.primary, palette.secondary, palette.warm, palette.text];
  const particles: Particle[] = [];
  let width = innerWidth;
  let height = innerHeight;
  let frame = 0;
  let resizeFrame = 0;
  let lastFrame = performance.now();
  let startedAt = lastFrame;
  let exitStartedAt = Number.POSITIVE_INFINITY;
  let pointerX = width * 0.5;
  let pointerY = height * 0.5;
  let pointerActive = false;
  let seed = 917321;
  const random = () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };

  const sampleText = () => {
    const mask = document.createElement('canvas');
    mask.width = width;
    mask.height = height;
    const maskContext = mask.getContext('2d', { willReadFrequently: true });
    if (!maskContext) return [] as Array<[number, number]>;
    let fontSize = Math.min(compact ? width * 0.19 : width * 0.115, compact ? 86 : 154);
    const fontFamily = "Bahnschrift, 'Microsoft YaHei UI', 'PingFang SC', sans-serif";
    maskContext.font = `760 ${fontSize}px ${fontFamily}`;
    const characters = [...label];
    const textWidth = () => characters.reduce((sum, character) => sum + maskContext.measureText(character).width, 0) - fontSize * 0.09 * (characters.length - 1);
    while (textWidth() > width * (compact ? 0.9 : 0.72) && fontSize > 42) {
      fontSize -= 2;
      maskContext.font = `760 ${fontSize}px ${fontFamily}`;
    }
    maskContext.textAlign = 'left';
    maskContext.textBaseline = 'middle';
    maskContext.fillStyle = '#fff';
    let characterX = (width - textWidth()) * 0.5;
    for (const character of characters) {
      maskContext.fillText(character, characterX, height * (compact ? 0.47 : 0.46));
      characterX += maskContext.measureText(character).width - fontSize * 0.09;
    }
    const pixels = maskContext.getImageData(0, 0, width, height).data;
    const step = compact ? 5 : 6;
    const samples: Array<[number, number]> = [];
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        if ((pixels[(y * width + x) * 4 + 3] ?? 0) > 90) samples.push([x, y]);
      }
    }
    for (let index = samples.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(random() * (index + 1));
      [samples[index], samples[swap]] = [samples[swap]!, samples[index]!];
    }
    return samples.slice(0, compact ? 520 : 900);
  };

  const rebuild = () => {
    width = innerWidth;
    height = innerHeight;
    const density = Math.min(devicePixelRatio || 1, compact ? 1.35 : 1.7);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(density, 0, 0, density, 0, 0);
    particles.length = 0;
    const targets = sampleText();
    for (let index = 0; index < targets.length; index += 1) {
      const [targetX, targetY] = targets[index]!;
      const edge = Math.floor(random() * 4);
      const margin = 60 + random() * 180;
      const x = edge === 0 ? -margin : edge === 1 ? width + margin : random() * width;
      const y = edge === 2 ? -margin : edge === 3 ? height + margin : random() * height;
      particles.push({
        x,
        y,
        previousX: x,
        previousY: y,
        targetX,
        targetY,
        vx: (random() - 0.5) * 2.2,
        vy: (random() - 0.5) * 2.2,
        depth: 0.32 + random() * 0.68,
        size: 0.45 + random() * (compact ? 1.25 : 1.65),
        phase: random() * Math.PI * 2,
        color: random() > 0.96 ? 2 : random() > 0.67 ? 1 : random() > 0.18 ? 0 : 3,
        mark: Math.floor(random() * 3),
        kicked: false,
      });
    }
    startedAt = performance.now();
    lastFrame = startedAt;
  };

  const onResize = () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      rebuild();
    });
  };
  const onPointerMove = (event: PointerEvent) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerActive = true;
  };
  const onPointerLeave = () => { pointerActive = false; };

  const render = (now: number) => {
    const elapsed = (now - startedAt) * 0.001;
    const delta = Math.min((now - lastFrame) / 16.667, 2.2);
    lastFrame = now;
    const gather = smoothstep(0.18, 1.75, elapsed);
    const reveal = smoothstep(0.72, 2.05, elapsed);
    const exiting = Number.isFinite(exitStartedAt);
    const scatterAmount = exiting ? smoothstep(0, 1.05, (now - exitStartedAt) * 0.001) : 0;
    context.clearRect(0, 0, width, height);

    const atmosphere = context.createRadialGradient(
      pointerActive ? pointerX : width * 0.58,
      pointerActive ? pointerY : height * 0.44,
      0,
      pointerActive ? pointerX : width * 0.58,
      pointerActive ? pointerY : height * 0.44,
      Math.max(width, height) * 0.52,
    );
    atmosphere.addColorStop(0, rgb(palette.secondary, palette.light ? 0.035 : 0.05));
    atmosphere.addColorStop(0.42, rgb(palette.primary, palette.light ? 0.012 : 0.02));
    atmosphere.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = atmosphere;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';

    for (const particle of particles) {
      particle.previousX = particle.x;
      particle.previousY = particle.y;
      if (exiting) {
        if (!particle.kicked) {
          const dx = particle.x - width * 0.5;
          const dy = particle.y - height * 0.46;
          const distance = Math.max(28, Math.hypot(dx, dy));
          const impulse = 2.4 + particle.depth * 7.8 + random() * 3.4;
          particle.vx += dx / distance * impulse + (random() - 0.5) * 3.2;
          particle.vy += dy / distance * impulse + (random() - 0.5) * 3.2;
          particle.kicked = true;
        }
      } else {
        const spring = (0.0025 + gather * 0.025) * particle.depth * delta;
        particle.vx += (particle.targetX - particle.x) * spring;
        particle.vy += (particle.targetY - particle.y) * spring;
        const turbulence = (1 - gather) * (0.07 + particle.depth * 0.08);
        particle.vx += Math.sin(elapsed * 0.8 + particle.phase) * turbulence * delta;
        particle.vy += Math.cos(elapsed * 0.7 + particle.phase * 1.31) * turbulence * delta;
      }

      if (pointerActive && !exiting) {
        const dx = particle.x - pointerX;
        const dy = particle.y - pointerY;
        const distance = Math.max(18, Math.hypot(dx, dy));
        if (distance < 190) {
          const force = Math.pow(1 - distance / 190, 2) * 0.42 * particle.depth * delta;
          particle.vx += dx / distance * force - dy / distance * force * 0.34;
          particle.vy += dy / distance * force + dx / distance * force * 0.34;
        }
      }

      const damping = exiting ? 0.982 : 0.86 + gather * 0.055;
      particle.vx *= Math.pow(damping, delta);
      particle.vy *= Math.pow(damping, delta);
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;

      const color = colors[particle.color] ?? colors[0]!;
      const fadeOut = 1 - scatterAmount;
      const alpha = (0.12 + particle.depth * 0.48) * (0.34 + reveal * 0.66) * fadeOut;
      const trailAlpha = alpha * clamp(Math.hypot(particle.vx, particle.vy) * 0.08, 0.06, 0.32);
      context.strokeStyle = rgb(color, trailAlpha);
      context.lineWidth = Math.max(0.35, particle.size * 0.42);
      context.beginPath();
      context.moveTo(particle.previousX, particle.previousY);
      context.lineTo(particle.x, particle.y);
      context.stroke();

      context.fillStyle = rgb(color, alpha);
      if (particle.mark === 2) {
        const arm = particle.size * 2.2;
        context.strokeStyle = rgb(color, alpha);
        context.lineWidth = Math.max(.45, particle.size * .55);
        context.beginPath();
        context.moveTo(particle.x - arm, particle.y + arm);
        context.lineTo(particle.x - arm, particle.y - arm);
        context.lineTo(particle.x + arm, particle.y - arm);
        context.stroke();
      } else {
        const widthScale = particle.mark === 1 ? 3.6 : 1.25;
        context.fillRect(
          particle.x - particle.size * widthScale * .5,
          particle.y - particle.size * .52,
          particle.size * widthScale,
          Math.max(.7, particle.size * 1.04),
        );
      }
    }
    context.globalCompositeOperation = 'source-over';
    frame = requestAnimationFrame(render);
  };

  const scatter = () => {
    if (!Number.isFinite(exitStartedAt)) exitStartedAt = performance.now();
  };
  const destroy = () => {
    cancelAnimationFrame(frame);
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    removeEventListener('resize', onResize);
    removeEventListener('pointermove', onPointerMove);
    document.documentElement.removeEventListener('mouseleave', onPointerLeave);
  };

  rebuild();
  addEventListener('resize', onResize, { passive: true });
  addEventListener('pointermove', onPointerMove, { passive: true });
  document.documentElement.addEventListener('mouseleave', onPointerLeave);
  frame = requestAnimationFrame(render);
  return { scatter, destroy };
}
import { SITE } from '../config/site';
