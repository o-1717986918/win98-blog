const TAU = Math.PI * 2;

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function cssColor(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export class CelestialMatrix {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.options = {
      dense: false,
      inverted: false,
      seed: 1247,
      onCoordinate: null,
      ...options,
    };
    this.colors = {};
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.time = 0;
    this.scrollPhase = 0;
    this.activeSector = null;
    this.pointer = { x: .58, y: .42, targetX: .58, targetY: .42, inside: false };
    this.paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.visible = true;
    this.frame = 0;
    this.seed = this.options.seed;
    this.nodes = [];
    this.edges = [];
    this.boundRender = this.render.bind(this);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.visibilityObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.requestFrame();
    }, { rootMargin: '160px' });
    this.visibilityObserver.observe(canvas);

    canvas.addEventListener('pointermove', (event) => this.onPointer(event), { passive: true });
    canvas.addEventListener('pointerenter', () => { this.pointer.inside = true; this.requestFrame(); });
    canvas.addEventListener('pointerleave', () => { this.pointer.inside = false; this.requestFrame(); });
    canvas.addEventListener('pointerdown', (event) => {
      if (!this.options.inverted) return;
      this.onPointer(event);
      this.regenerate();
    });

    this.resize();
  }

  refreshColors() {
    this.colors = {
      panel: cssColor('--panel'),
      panelBright: cssColor('--panel-bright'),
      ink: cssColor('--ink'),
      inkSoft: cssColor('--ink-soft'),
      cobalt: cssColor('--cobalt'),
      signal: cssColor('--signal'),
      energy: cssColor('--energy'),
    };
  }

  resize() {
    const bounds = this.canvas.getBoundingClientRect();
    if (bounds.width < 2 || bounds.height < 2) return;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.width = bounds.width;
    this.height = bounds.height;
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.refreshColors();
    this.buildField();
    this.draw(performance.now());
  }

  buildField() {
    const random = mulberry32(this.seed);
    const count = this.options.dense
      ? Math.min(760, Math.max(360, Math.round(this.width * this.height / 1600)))
      : Math.min(430, Math.max(220, Math.round(this.width * this.height / 2300)));
    this.nodes = [];
    this.edges = [];

    for (let index = 0; index < count; index += 1) {
      const sector = index % 28;
      const radius = .12 + Math.pow(random(), .62) * .82;
      const angle = ((sector + .1 + random() * .8) / 28) * TAU;
      this.nodes.push({
        angle,
        radius,
        sector,
        size: random() < .07 ? 2.5 + random() * 1.8 : .65 + random() * 1.15,
        kind: random() < .08 ? 2 : random() < .18 ? 1 : 0,
        weight: .35 + random() * .65,
      });
    }

    for (let sector = 0; sector < 28; sector += 1) {
      const group = this.nodes.filter((node) => node.sector === sector).sort((a, b) => a.radius - b.radius);
      for (let index = 1; index < group.length; index += 1) {
        if (random() > .48) this.edges.push([group[index - 1], group[index]]);
        if (index > 2 && random() > .82) this.edges.push([group[index - 3], group[index]]);
      }
    }
  }

  regenerate() {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    this.buildField();
    this.requestFrame();
  }

  setPaused(value) {
    this.paused = value;
    this.requestFrame();
  }

  setScrollPhase(value) {
    this.scrollPhase = Math.max(0, Math.min(1, value));
    this.requestFrame();
  }

  setActiveSector(value) {
    this.activeSector = Number.isInteger(value) ? value : null;
    this.requestFrame();
  }

  onPointer(event) {
    const bounds = this.canvas.getBoundingClientRect();
    this.pointer.targetX = (event.clientX - bounds.left) / bounds.width;
    this.pointer.targetY = (event.clientY - bounds.top) / bounds.height;
    this.pointer.inside = true;
    this.requestFrame();
  }

  requestFrame() {
    if (!this.frame && this.visible) this.frame = requestAnimationFrame(this.boundRender);
  }

  render(now) {
    this.frame = 0;
    this.pointer.x += (this.pointer.targetX - this.pointer.x) * .08;
    this.pointer.y += (this.pointer.targetY - this.pointer.y) * .08;
    if (!this.paused) this.time = now;
    this.draw(now);

    const pointerMoving = Math.abs(this.pointer.targetX - this.pointer.x) > .001 || Math.abs(this.pointer.targetY - this.pointer.y) > .001;
    if (this.visible && (!this.paused || pointerMoving)) this.requestFrame();
  }

  getGeometry(now) {
    const radius = Math.min(this.width, this.height) * (this.options.inverted ? .43 : .46);
    const centerX = this.width * (this.options.inverted ? .68 : .5) + (this.pointer.x - .5) * (this.options.inverted ? 22 : 10);
    const centerY = this.height * .5 + (this.pointer.y - .5) * 12;
    const timePhase = this.paused ? 0 : now * .000012;
    const rotation = -.42 + this.scrollPhase * .68 + timePhase + (this.pointer.x - .5) * .045;
    return { centerX, centerY, radius, rotation };
  }

  pointFor(node, geometry) {
    const angle = node.angle + geometry.rotation;
    const radial = node.radius * geometry.radius;
    let x = geometry.centerX + Math.cos(angle) * radial;
    let y = geometry.centerY + Math.sin(angle) * radial;

    if (this.pointer.inside) {
      const px = this.pointer.x * this.width;
      const py = this.pointer.y * this.height;
      const dx = x - px;
      const dy = y - py;
      const distance = Math.hypot(dx, dy);
      const lens = Math.min(150, geometry.radius * .32);
      if (distance < lens) {
        const force = Math.pow(1 - distance / lens, 2) * (this.options.inverted ? 30 : 17);
        x += (-dy / Math.max(1, distance)) * force;
        y += (dx / Math.max(1, distance)) * force;
      }
    }
    return { x, y };
  }

  draw(now) {
    const ctx = this.ctx;
    const geometry = this.getGeometry(now);
    const inverted = this.options.inverted;
    const foreground = inverted ? this.colors.panelBright : this.colors.ink;
    const muted = inverted ? 'rgba(243,245,239,.28)' : 'rgba(17,18,15,.26)';
    const subtle = inverted ? 'rgba(243,245,239,.12)' : 'rgba(17,18,15,.11)';
    const active = inverted ? this.colors.energy : this.colors.cobalt;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = inverted ? this.colors.cobalt : this.colors.panel;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';

    const selected = this.activeSector ?? this.pointerSector(geometry);
    if (selected !== null) {
      const start = geometry.rotation + selected / 28 * TAU;
      ctx.beginPath();
      ctx.moveTo(geometry.centerX, geometry.centerY);
      ctx.arc(geometry.centerX, geometry.centerY, geometry.radius * 1.02, start, start + TAU / 28);
      ctx.closePath();
      ctx.fillStyle = inverted ? 'rgba(232,255,79,.12)' : 'rgba(20,56,255,.13)';
      ctx.fill();
    }

    ctx.strokeStyle = subtle;
    ctx.lineWidth = 1;
    for (let ring = 1; ring <= 7; ring += 1) {
      ctx.beginPath();
      ctx.arc(geometry.centerX, geometry.centerY, geometry.radius * ring / 7, 0, TAU);
      ctx.stroke();
    }

    for (let sector = 0; sector < 28; sector += 1) {
      const angle = geometry.rotation + sector / 28 * TAU;
      const inner = geometry.radius * .08;
      const outer = geometry.radius * 1.08;
      ctx.strokeStyle = sector === selected ? active : muted;
      ctx.lineWidth = sector === selected ? 1.8 : .75;
      ctx.beginPath();
      ctx.moveTo(geometry.centerX + Math.cos(angle) * inner, geometry.centerY + Math.sin(angle) * inner);
      ctx.lineTo(geometry.centerX + Math.cos(angle) * outer, geometry.centerY + Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(geometry.centerX, geometry.centerY);
    ctx.rotate(geometry.rotation * -.42);
    ctx.scale(1, .46);
    ctx.strokeStyle = inverted ? this.colors.signal : this.colors.signal;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, geometry.radius * .82, 0, TAU);
    ctx.stroke();
    ctx.restore();
    ctx.setLineDash([]);

    ctx.strokeStyle = muted;
    ctx.lineWidth = .6;
    ctx.beginPath();
    for (const [from, to] of this.edges) {
      const a = this.pointFor(from, geometry);
      const b = this.pointFor(to, geometry);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();

    for (const node of this.nodes) {
      const point = this.pointFor(node, geometry);
      const nodeActive = node.sector === selected;
      ctx.strokeStyle = nodeActive ? active : foreground;
      ctx.fillStyle = nodeActive ? active : foreground;
      ctx.globalAlpha = nodeActive ? 1 : node.weight;
      if (node.kind === 2) {
        const size = node.size * 2.2;
        ctx.lineWidth = .9;
        ctx.beginPath();
        ctx.moveTo(point.x - size, point.y);
        ctx.lineTo(point.x + size, point.y);
        ctx.moveTo(point.x, point.y - size);
        ctx.lineTo(point.x, point.y + size);
        ctx.stroke();
      } else if (node.kind === 1) {
        ctx.lineWidth = .8;
        ctx.beginPath();
        ctx.arc(point.x, point.y, node.size * 1.5, 0, TAU);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(point.x, point.y, node.size, 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    this.drawOuterScale(ctx, geometry, foreground, muted, selected, active);
    this.drawReticle(ctx, geometry, foreground, active);

    if (typeof this.options.onCoordinate === 'function') {
      const ra = ((this.pointer.x * 24) + 24) % 24;
      const dec = (0.5 - this.pointer.y) * 110;
      this.options.onCoordinate({ ra, dec, sector: selected ?? 0 });
    }
  }

  pointerSector(geometry) {
    if (!this.pointer.inside) return this.activeSector;
    const x = this.pointer.x * this.width - geometry.centerX;
    const y = this.pointer.y * this.height - geometry.centerY;
    let angle = Math.atan2(y, x) - geometry.rotation;
    angle = (angle % TAU + TAU) % TAU;
    return Math.floor(angle / TAU * 28) % 28;
  }

  drawOuterScale(ctx, geometry, foreground, muted, selected, active) {
    const ticks = 112;
    for (let tick = 0; tick < ticks; tick += 1) {
      const angle = geometry.rotation + tick / ticks * TAU;
      const major = tick % 4 === 0;
      const outer = geometry.radius * 1.08;
      const inner = outer - (major ? 10 : 4);
      ctx.strokeStyle = Math.floor(tick / 4) === selected ? active : muted;
      ctx.lineWidth = major ? 1.1 : .6;
      ctx.beginPath();
      ctx.moveTo(geometry.centerX + Math.cos(angle) * inner, geometry.centerY + Math.sin(angle) * inner);
      ctx.lineTo(geometry.centerX + Math.cos(angle) * outer, geometry.centerY + Math.sin(angle) * outer);
      ctx.stroke();
    }

    ctx.fillStyle = foreground;
    ctx.font = `700 9px ${cssColor('--mono') || 'monospace'}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let sector = 0; sector < 28; sector += 4) {
      const angle = geometry.rotation + (sector + .5) / 28 * TAU;
      const radius = geometry.radius * 1.17;
      ctx.fillStyle = sector === selected ? active : foreground;
      ctx.fillText(`A${String(sector + 1).padStart(2, '0')}`, geometry.centerX + Math.cos(angle) * radius, geometry.centerY + Math.sin(angle) * radius);
    }
  }

  drawReticle(ctx, geometry, foreground, active) {
    const x = this.pointer.x * this.width;
    const y = this.pointer.y * this.height;
    const radius = Math.min(150, geometry.radius * .32);
    ctx.strokeStyle = this.pointer.inside ? active : foreground;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, this.pointer.inside ? radius : 16, 0, TAU);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 18, y);
    ctx.lineTo(x + 18, y);
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x, y + 18);
    ctx.stroke();

    ctx.fillStyle = this.pointer.inside ? active : foreground;
    ctx.fillRect(geometry.centerX - 3, geometry.centerY - 3, 6, 6);
  }
}
