/**
 * Infernal Rise — Particle System & Screen Shake
 * Implements Criterion 9 (Ambient particles: Rain, falling meteorites, embers)
 * and Criterion 10 (Special effects: Blood explosions on death, shockwaves, slash sparks, lava bursts).
 */

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.meteorites = [];
    this.rainDrops = [];
    this.maxRain = 140;

    // Screen shake state
    this.shakeDuration = 0;
    this.shakeIntensity = 0;
    this.shakeX = 0;
    this.shakeY = 0;

    this.floatingTexts = [];

    this.initRain();
  }

  initRain() {
    this.rainDrops = [];
    for (let i = 0; i < this.maxRain; i++) {
      this.rainDrops.push({
        x: Math.random() * 1200 - 100,
        y: Math.random() * 800 - 100,
        speedY: 12 + Math.random() * 6,
        speedX: -2.5 - Math.random() * 1.5,
        length: 8 + Math.random() * 6,
        opacity: 0.15 + Math.random() * 0.25
      });
    }
  }

  triggerScreenShake(duration = 0.2, intensity = 4) {
    // Dampen duration and intensity to avoid disorienting/violent camera jitter
    this.shakeDuration = Math.min(0.20, Math.max(0.08, duration * 0.5));
    this.shakeIntensity = Math.min(3.2, Math.max(1.0, intensity * 0.3));
    this.shakeMaxDuration = this.shakeDuration;
  }

  // ─── FLOATING COMBAT & BALATRO TEXTS (MEGABONK, CRITS, CHIPS & MULT) ───
  spawnFloatingText(text, x, y, options = {}) {
    const isBonk = !!options.isBonk;
    const isCrit = !!options.isCrit;
    const isBalatro = !!options.isBalatro;

    let defaultColor = '#ffffff';
    let defaultSize = 15;
    let defaultVy = -2.6;

    if (isBonk) {
      defaultColor = '#ff0055';
      defaultSize = 22;
      defaultVy = -3.8;
      this.triggerScreenShake(0.15, 3);
    } else if (isCrit) {
      defaultColor = '#ffd700';
      defaultSize = 18;
      defaultVy = -3.2;
    } else if (isBalatro) {
      defaultColor = options.color || '#38bdf8';
      defaultSize = 16;
      defaultVy = -2.2;
    }

    this.floatingTexts.push({
      text: String(text),
      x: x + (Math.random() - 0.5) * 14,
      y: y,
      vx: options.vx !== undefined ? options.vx : (Math.random() - 0.5) * 1.8,
      vy: options.vy !== undefined ? options.vy : defaultVy,
      color: options.color || defaultColor,
      size: options.size || defaultSize,
      isBonk: isBonk,
      isCrit: isCrit,
      isBalatro: isBalatro,
      life: options.life || (isBonk ? 1.25 : 0.95),
      maxLife: options.life || (isBonk ? 1.25 : 0.95)
    });
  }

  // ─── BLOOD EXPLOSION (ON DEATH BY TRAP OR ENEMY) ───
  spawnBloodExplosion(x, y, count = 50) {
    this.triggerScreenShake(0.4, 12);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 9;
      this.particles.push({
        type: 'blood',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        gravity: 0.35,
        size: 2 + Math.random() * 3.5,
        color: Math.random() > 0.3 ? '#b80d22' : '#680512',
        life: 1.0,
        decay: 0.012 + Math.random() * 0.018
      });
    }
  }

  // ─── SWORD SLASH SPARKS ───
  spawnSlashSparks(x, y, dir = 1) {
    for (let i = 0; i < 14; i++) {
      const angle = (dir > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 1.2;
      const speed = 3 + Math.random() * 5;
      this.particles.push({
        type: 'spark',
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        gravity: 0.2,
        size: 1.5 + Math.random() * 2,
        color: Math.random() > 0.5 ? '#ffe600' : '#ff4500',
        life: 1.0,
        decay: 0.035 + Math.random() * 0.02
      });
    }
  }

  // ─── ASCENSION / TELEPORT SPARKS ───
  spawnTeleportSparks(x, y, count = 10) {
    for (let i = 0; i < count; i++) {
      const colors = ['#c084fc', '#e879f9', '#38bdf8', '#fbbf24'];
      this.particles.push({
        type: 'spark',
        x: x + (Math.random() - 0.5) * 24,
        y: y + (Math.random() - 0.5) * 24,
        vx: (Math.random() - 0.5) * 4.0,
        vy: -1.0 - Math.random() * 3.5,
        gravity: -0.02,
        size: 2.0 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: 0.025 + Math.random() * 0.02
      });
    }
  }

  // ─── JUMP / LANDING DUST ───
  spawnDust(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        type: 'dust',
        x: x + (Math.random() - 0.5) * 16,
        y: y,
        vx: (Math.random() - 0.5) * 3,
        vy: -0.5 - Math.random() * 1.5,
        gravity: 0.05,
        size: 2 + Math.random() * 3,
        color: 'rgba(90, 80, 70, 0.6)',
        life: 1.0,
        decay: 0.04 + Math.random() * 0.03
      });
    }
  }

  // ─── AMBIENT METEORITES ───
  spawnMeteor(camX, camY) {
    const startX = camX + 200 + Math.random() * 600;
    const startY = camY - 200;
    this.meteorites.push({
      x: startX,
      y: startY,
      vx: -7 - Math.random() * 3,
      vy: 11 + Math.random() * 4,
      size: 4 + Math.random() * 4,
      color: '#ff4500',
      life: 180
    });
  }

  // ─── LAVA SPARK / BUBBLE ───
  spawnLavaBubble(x, y) {
    this.particles.push({
      type: 'lava',
      x: x + (Math.random() - 0.5) * 40,
      y: y,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -2 - Math.random() * 3,
      gravity: 0.15,
      size: 2 + Math.random() * 3,
      color: Math.random() > 0.4 ? '#ff6600' : '#ffcc00',
      life: 1.0,
      decay: 0.025 + Math.random() * 0.02
    });
  }

  update(dt, camX, camY, viewW, viewH, platforms = []) {
    // Smooth camera screen shake update with decay
    if (this.shakeDuration > 0) {
      this.shakeDuration -= dt;
      const progress = Math.max(0, this.shakeDuration / (this.shakeMaxDuration || 0.15));
      const decayedIntensity = this.shakeIntensity * (progress * progress);
      this.shakeX = (Math.random() * 2 - 1) * decayedIntensity;
      this.shakeY = (Math.random() * 2 - 1) * decayedIntensity;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    // 1. Update Rain
    for (const r of this.rainDrops) {
      r.x += r.speedX;
      r.y += r.speedY;
      if (r.y > viewH + 50) {
        r.y = -50;
        r.x = Math.random() * (viewW + 200) - 100;
      }
      if (r.x < -100) {
        r.x = viewW + 100;
      }
    }

    // 2. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life -= p.decay;

      // Platform collision for blood droplets
      if (p.type === 'blood' && p.life > 0.2) {
        for (const plat of platforms) {
          if (p.x >= plat.x && p.x <= plat.x + plat.w &&
              p.y >= plat.y && p.y <= plat.y + 8 && p.vy > 0) {
            p.vy = 0;
            p.vx *= 0.2;
            p.y = plat.y;
            break;
          }
        }
      }

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 3. Update Meteorites
    for (let i = this.meteorites.length - 1; i >= 0; i--) {
      const m = this.meteorites[i];
      m.x += m.vx;
      m.y += m.vy;
      m.life--;

      // Spawn smoke/fire trail
      if (Math.random() > 0.2) {
        this.particles.push({
          type: 'ember',
          x: m.x,
          y: m.y,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5,
          gravity: -0.05,
          size: 2 + Math.random() * 3,
          color: Math.random() > 0.5 ? '#ff3300' : '#888888',
          life: 0.6,
          decay: 0.03
        });
      }

      // Check collision with platforms or timeout
      let hit = false;
      for (const plat of platforms) {
        if (m.x >= plat.x && m.x <= plat.x + plat.w &&
            m.y >= plat.y && m.y <= plat.y + plat.h) {
          hit = true;
          break;
        }
      }

      if (hit || m.life <= 0) {
        // Explode meteor
        this.triggerScreenShake(0.25, 6);
        if (window.soundEngine) window.soundEngine.playMeteorExplosion();
        for (let k = 0; k < 18; k++) {
          const angle = Math.random() * Math.PI * 2;
          const spd = 2 + Math.random() * 5;
          this.particles.push({
            type: 'spark',
            x: m.x,
            y: m.y,
            vx: Math.cos(angle) * spd,
            vy: Math.sin(angle) * spd - 1,
            gravity: 0.15,
            size: 2 + Math.random() * 2.5,
            color: '#ff7700',
            life: 0.8,
            decay: 0.03
          });
        }
        this.meteorites.splice(i, 1);
      }
    }

    // 4. Update Floating Combat & Balatro Texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.x += ft.vx * dt * 60;
      ft.y += ft.vy * dt * 60;
      ft.vy += 0.08; // subtle gravity curve
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  draw(ctx, camX, camY) {
    ctx.save();

    // 1. Draw Rain (Screen space)
    ctx.strokeStyle = '#6a7888';
    ctx.lineWidth = 1.2;
    for (const r of this.rainDrops) {
      ctx.globalAlpha = r.opacity;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x + r.speedX * 0.8, r.y + r.length);
      ctx.stroke();
    }

    // 2. Draw World Particles (offset by camera)
    for (const p of this.particles) {
      const rx = p.x - camX;
      const ry = p.y - camY;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(rx - p.size / 2, ry - p.size / 2, p.size, p.size);
    }

    // 3. Draw Meteorites
    for (const m of this.meteorites) {
      const rx = m.x - camX;
      const ry = m.y - camY;
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#fff';
      ctx.fillRect(rx - m.size / 2, ry - m.size / 2, m.size, m.size);
      // Fiery halo
      ctx.fillStyle = 'rgba(255, 69, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(rx, ry, m.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Draw Floating Combat & Balatro Texts
    for (const ft of this.floatingTexts) {
      const rx = Math.round(ft.x - camX);
      const ry = Math.round(ft.y - camY);
      const alpha = Math.min(1.0, ft.life / 0.28);
      ctx.save();
      ctx.globalAlpha = Math.max(0, alpha);
      ctx.font = `${ft.isBonk ? '900' : (ft.isCrit ? 'bold' : '700')} ${ft.size}px 'Cinzel', 'Segoe UI', sans-serif`;
      ctx.textAlign = 'center';
      // Thick comic outline
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = ft.isBonk ? 4.5 : 3.0;
      ctx.strokeText(ft.text, rx, ry);
      ctx.fillStyle = ft.color || '#ffffff';
      ctx.fillText(ft.text, rx, ry);
      ctx.restore();
    }

    ctx.restore();
  }
}

window.particleSystem = new ParticleSystem();
