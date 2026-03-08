export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ParticleConfig {
  spawnRate: number;
  lifetime: number;
  gravity: number;
  velocityX: number;
  velocityY: number;
  spread: number;
  color: string;
  size: number;
  fadeOut: boolean;
}

export class ParticleEngine {
  particles: Particle[] = [];
  config: ParticleConfig;
  width: number;
  height: number;
  emitterX: number;
  emitterY: number;

  constructor(width: number, height: number, config: ParticleConfig) {
    this.width = width;
    this.height = height;
    this.config = config;
    this.emitterX = width / 2;
    this.emitterY = height / 2;
  }

  reset() {
    this.particles = [];
  }

  step() {
    // Spawn
    for (let i = 0; i < this.config.spawnRate; i++) {
      const angle = (Math.random() - 0.5) * this.config.spread * Math.PI;
      const speed = 0.5 + Math.random() * 1.5;
      this.particles.push({
        x: this.emitterX,
        y: this.emitterY,
        vx: this.config.velocityX + Math.sin(angle) * speed,
        vy: this.config.velocityY + Math.cos(angle) * speed,
        life: this.config.lifetime,
        maxLife: this.config.lifetime,
        color: this.config.color,
        size: this.config.size,
      });
    }

    // Update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.vy += this.config.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const p of this.particles) {
      const alpha = this.config.fadeOut ? p.life / p.maxLife : 1;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      // Pixel-snap
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      ctx.fillRect(px, py, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }
}
