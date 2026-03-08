export interface FluidConfig {
  viscosity: number;
  diffusion: number;
  pressure: number;
  gravityX: number;
  gravityY: number;
  color: string;
  resolution: number;
}

export class FluidEngine {
  N: number;
  size: number;
  density: Float32Array;
  densityPrev: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  vxPrev: Float32Array;
  vyPrev: Float32Array;
  config: FluidConfig;

  constructor(config: FluidConfig) {
    this.config = config;
    this.N = config.resolution;
    this.size = (this.N + 2) * (this.N + 2);
    this.density = new Float32Array(this.size);
    this.densityPrev = new Float32Array(this.size);
    this.vx = new Float32Array(this.size);
    this.vy = new Float32Array(this.size);
    this.vxPrev = new Float32Array(this.size);
    this.vyPrev = new Float32Array(this.size);
  }

  private IX(x: number, y: number) {
    return x + (this.N + 2) * y;
  }

  reset() {
    this.density.fill(0);
    this.densityPrev.fill(0);
    this.vx.fill(0);
    this.vy.fill(0);
    this.vxPrev.fill(0);
    this.vyPrev.fill(0);
  }

  addDensity(x: number, y: number, amount: number) {
    const idx = this.IX(Math.floor(x), Math.floor(y));
    if (idx >= 0 && idx < this.size) this.density[idx] += amount;
  }

  addVelocity(x: number, y: number, amountX: number, amountY: number) {
    const idx = this.IX(Math.floor(x), Math.floor(y));
    if (idx >= 0 && idx < this.size) {
      this.vx[idx] += amountX;
      this.vy[idx] += amountY;
    }
  }

  private setBnd(b: number, x: Float32Array) {
    const N = this.N;
    for (let i = 1; i <= N; i++) {
      x[this.IX(0, i)] = b === 1 ? -x[this.IX(1, i)] : x[this.IX(1, i)];
      x[this.IX(N + 1, i)] = b === 1 ? -x[this.IX(N, i)] : x[this.IX(N, i)];
      x[this.IX(i, 0)] = b === 2 ? -x[this.IX(i, 1)] : x[this.IX(i, 1)];
      x[this.IX(i, N + 1)] = b === 2 ? -x[this.IX(i, N)] : x[this.IX(i, N)];
    }
    x[this.IX(0, 0)] = 0.5 * (x[this.IX(1, 0)] + x[this.IX(0, 1)]);
    x[this.IX(0, N + 1)] = 0.5 * (x[this.IX(1, N + 1)] + x[this.IX(0, N)]);
    x[this.IX(N + 1, 0)] = 0.5 * (x[this.IX(N, 0)] + x[this.IX(N + 1, 1)]);
    x[this.IX(N + 1, N + 1)] = 0.5 * (x[this.IX(N, N + 1)] + x[this.IX(N + 1, N)]);
  }

  private diffuse(b: number, x: Float32Array, x0: Float32Array, diff: number, dt: number) {
    const N = this.N;
    const a = dt * diff * N * N;
    for (let k = 0; k < 4; k++) {
      for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
          x[this.IX(i, j)] =
            (x0[this.IX(i, j)] + a * (x[this.IX(i - 1, j)] + x[this.IX(i + 1, j)] +
              x[this.IX(i, j - 1)] + x[this.IX(i, j + 1)])) / (1 + 4 * a);
        }
      }
      this.setBnd(b, x);
    }
  }

  private advect(b: number, d: Float32Array, d0: Float32Array, u: Float32Array, v: Float32Array, dt: number) {
    const N = this.N;
    const dt0 = dt * N;
    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        let x = i - dt0 * u[this.IX(i, j)];
        let y = j - dt0 * v[this.IX(i, j)];
        if (x < 0.5) x = 0.5;
        if (x > N + 0.5) x = N + 0.5;
        if (y < 0.5) y = 0.5;
        if (y > N + 0.5) y = N + 0.5;
        const i0 = Math.floor(x), i1 = i0 + 1;
        const j0 = Math.floor(y), j1 = j0 + 1;
        const s1 = x - i0, s0 = 1 - s1;
        const t1 = y - j0, t0 = 1 - t1;
        d[this.IX(i, j)] =
          s0 * (t0 * d0[this.IX(i0, j0)] + t1 * d0[this.IX(i0, j1)]) +
          s1 * (t0 * d0[this.IX(i1, j0)] + t1 * d0[this.IX(i1, j1)]);
      }
    }
    this.setBnd(b, d);
  }

  private project() {
    const N = this.N;
    const div = this.vxPrev;
    const p = this.vyPrev;
    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        div[this.IX(i, j)] = -0.5 * (
          this.vx[this.IX(i + 1, j)] - this.vx[this.IX(i - 1, j)] +
          this.vy[this.IX(i, j + 1)] - this.vy[this.IX(i, j - 1)]
        ) / N;
        p[this.IX(i, j)] = 0;
      }
    }
    this.setBnd(0, div);
    this.setBnd(0, p);
    for (let k = 0; k < 4; k++) {
      for (let j = 1; j <= N; j++) {
        for (let i = 1; i <= N; i++) {
          p[this.IX(i, j)] = (div[this.IX(i, j)] +
            p[this.IX(i - 1, j)] + p[this.IX(i + 1, j)] +
            p[this.IX(i, j - 1)] + p[this.IX(i, j + 1)]) / 4;
        }
      }
      this.setBnd(0, p);
    }
    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        this.vx[this.IX(i, j)] -= 0.5 * N * (p[this.IX(i + 1, j)] - p[this.IX(i - 1, j)]);
        this.vy[this.IX(i, j)] -= 0.5 * N * (p[this.IX(i, j + 1)] - p[this.IX(i, j - 1)]);
      }
    }
    this.setBnd(1, this.vx);
    this.setBnd(2, this.vy);
  }

  step(dt: number = 0.1) {
    const N = this.N;
    // Add gravity
    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        this.vx[this.IX(i, j)] += this.config.gravityX * dt;
        this.vy[this.IX(i, j)] += this.config.gravityY * dt;
      }
    }

    // Velocity step
    this.vxPrev.set(this.vx);
    this.vyPrev.set(this.vy);
    this.diffuse(1, this.vx, this.vxPrev, this.config.viscosity, dt);
    this.diffuse(2, this.vy, this.vyPrev, this.config.viscosity, dt);
    this.project();
    this.vxPrev.set(this.vx);
    this.vyPrev.set(this.vy);
    this.advect(1, this.vx, this.vxPrev, this.vxPrev, this.vyPrev, dt);
    this.advect(2, this.vy, this.vyPrev, this.vxPrev, this.vyPrev, dt);
    this.project();

    // Density step
    this.densityPrev.set(this.density);
    this.diffuse(0, this.density, this.densityPrev, this.config.diffusion, dt);
    this.densityPrev.set(this.density);
    this.advect(0, this.density, this.densityPrev, this.vx, this.vy, dt);
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    const N = this.N;
    const cellW = width / N;
    const cellH = height / N;
    const r = parseInt(this.config.color.slice(1, 3), 16);
    const g = parseInt(this.config.color.slice(3, 5), 16);
    const b = parseInt(this.config.color.slice(5, 7), 16);

    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        const d = Math.min(1, this.density[this.IX(i, j)]);
        if (d > 0.01) {
          ctx.fillStyle = `rgba(${r},${g},${b},${d})`;
          ctx.fillRect(
            Math.floor((i - 1) * cellW),
            Math.floor((j - 1) * cellH),
            Math.ceil(cellW),
            Math.ceil(cellH)
          );
        }
      }
    }
  }
}
