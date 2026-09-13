/**
 * Infernal Rise 2.0 — Sistema de Reliquias y Armas Autónomas del Inframundo
 * Armas arcanas que Kael adquiere en cofres o en la Ruleta del Averno que atacan automáticamente.
 * for nearby enemies, fire projectiles, strike lightning, orbit holy blades, and pulse auras.
 */

class PassiveWeaponsManager {
  constructor(game) {
    this.game = game;
    // Map of weaponType -> { level, timer, maxCooldown, count, damage, range }
    this.weapons = new Map();
    this.projectiles = [];
    this.lightningStrikes = []; // Visual lightning bolts: { x, y, endY, timer, maxTimer, damage }
    this.garlicPulse = { active: false, radius: 0, maxRadius: 60, timer: 0, pulseCooldown: 0.6 };
    this.holyOrbitAngle = 0;
  }

  reset() {
    this.weapons.clear();
    this.projectiles = [];
    this.lightningStrikes = [];
    this.garlicPulse.active = false;
    this.updateHUD();
  }

  hasWeapon(type) {
    return this.weapons.has(type);
  }

  getLevel(type) {
    const w = this.weapons.get(type);
    return w ? w.level : 0;
  }

  getActiveVisuals() {
    return {
      hasHolyCross: this.hasWeapon('holy_cross'),
      holyCrossLevel: this.getLevel('holy_cross'),
      hasHellfireOrb: this.hasWeapon('hellfire_orb'),
      hellfireOrbLevel: this.getLevel('hellfire_orb'),
      hasLightning: this.hasWeapon('celestial_lightning'),
      lightningLevel: this.getLevel('celestial_lightning'),
      hasScythe: this.hasWeapon('death_scythe'),
      scytheLevel: this.getLevel('death_scythe'),
      hasGarlic: this.hasWeapon('blood_garlic'),
      garlicLevel: this.getLevel('blood_garlic'),
      totalEquipped: (this.hasWeapon('holy_cross') ? 1 : 0) +
                     (this.hasWeapon('hellfire_orb') ? 1 : 0) +
                     (this.hasWeapon('celestial_lightning') ? 1 : 0) +
                     (this.hasWeapon('death_scythe') ? 1 : 0) +
                     (this.hasWeapon('blood_garlic') ? 1 : 0)
    };
  }

  acquireOrUpgrade(type) {
    if (this.weapons.has(type)) {
      const w = this.weapons.get(type);
      if (w.level < 5) {
        w.level++;
        this.applyLevelStats(w);
      }
      this.updateHUD();
      return w;
    }

    const newWeapon = {
      type: type,
      level: 1,
      timer: 0.2, // Ready to attack quickly after acquisition
      maxCooldown: 1.5,
      damage: 20,
      range: 360,
      count: 1
    };
    this.applyLevelStats(newWeapon);
    this.weapons.set(type, newWeapon);
    this.updateHUD();
    return newWeapon;
  }

  isEvolved(type) {
    const w = this.weapons.get(type);
    return !!(w && w.isEvolved);
  }

  canEvolve(type) {
    const w = this.weapons.get(type);
    return !!(w && w.level >= 5 && !w.isEvolved);
  }

  getTomeAreaMultiplier() {
    const count = (window.progression && window.progression.activeBoons) ? window.progression.activeBoons.filter(b => b.id === 'tome_candelabro').length : 0;
    return 1.0 + count * 0.25;
  }

  getTomeDamageMultiplier() {
    const count = (window.progression && window.progression.activeBoons) ? window.progression.activeBoons.filter(b => b.id === 'tome_spinach').length : 0;
    return 1.0 + count * 0.20;
  }

  getTomeCooldownMultiplier() {
    const count = (window.progression && window.progression.activeBoons) ? window.progression.activeBoons.filter(b => b.id === 'tome_hourglass').length : 0;
    return Math.max(0.35, 1.0 - count * 0.15);
  }

  getTomeCritBonus() {
    const count = (window.progression && window.progression.activeBoons) ? window.progression.activeBoons.filter(b => b.id === 'tome_clover').length : 0;
    return count * 0.15;
  }

  getTomeKnockbackMultiplier() {
    const count = (window.progression && window.progression.activeBoons) ? window.progression.activeBoons.filter(b => b.id === 'tome_gauntlet').length : 0;
    return 1.0 + count * 0.60;
  }

  getAvailableEvolutions() {
    const evolutions = [];
    for (const [type, w] of this.weapons.entries()) {
      if (w.level >= 5 && !w.isEvolved) {
        switch (type) {
          case 'holy_cross':
            evolutions.push({
              id: 'evo_holy_cross',
              isEvolution: true,
              baseWeaponType: 'holy_cross',
              name: 'Corona Sagrada del Serafín',
              rarity: 'Legendaria',
              desc: 'SUPER EVOLUCIÓN: 8 cruces giratorias titánicas que vaporizan proyectiles e infligen 60 de daño.',
              icon: '👑'
            });
            break;
          case 'hellfire_orb':
            evolutions.push({
              id: 'evo_hellfire_orb',
              isEvolution: true,
              baseWeaponType: 'hellfire_orb',
              name: 'Cataclismo de Belcebú',
              rarity: 'Legendaria',
              desc: 'SUPER EVOLUCIÓN: 3 meteoros colosales teledirigidos con rastro de fuego y 80 de daño explosivo.',
              icon: '☄️'
            });
            break;
          case 'celestial_lightning':
            evolutions.push({
              id: 'evo_celestial_lightning',
              isEvolution: true,
              baseWeaponType: 'celestial_lightning',
              name: 'Ira del Trueno de Zeus',
              rarity: 'Legendaria',
              desc: 'SUPER EVOLUCIÓN: 4 rayos celestes simultáneos devastadores con radio de choque expandido a 85px.',
              icon: '⚡'
            });
            break;
          case 'death_scythe':
            evolutions.push({
              id: 'evo_death_scythe',
              isEvolution: true,
              baseWeaponType: 'death_scythe',
              name: 'Guadaña de la Muerte Eterna',
              rarity: 'Legendaria',
              desc: 'SUPER EVOLUCIÓN: 4 guadañas gigantes en cruz omnidireccional que atraviesan todas las dimensiones.',
              icon: '🪓'
            });
            break;
          case 'blood_garlic':
            evolutions.push({
              id: 'evo_blood_garlic',
              isEvolution: true,
              baseWeaponType: 'blood_garlic',
              name: 'Devorador Carmesí de Almas',
              rarity: 'Legendaria',
              desc: 'SUPER EVOLUCIÓN: Halo titánico vampírico (115px) que drena vida para curar a Kael y succiona todas las almas.',
              icon: '📿'
            });
            break;
        }
      }
    }
    return evolutions;
  }

  evolveWeapon(type) {
    const w = this.weapons.get(type);
    if (!w) return null;
    w.isEvolved = true;
    switch (type) {
      case 'holy_cross':
        w.name = 'Corona Sagrada del Serafín';
        w.icon = '👑';
        w.count = 8;
        w.radius = 78;
        w.damage = 60;
        w.orbitSpeed = 5.6;
        break;
      case 'hellfire_orb':
        w.name = 'Cataclismo de Belcebú';
        w.icon = '☄️';
        w.count = 3;
        w.maxCooldown = 0.55;
        w.damage = 80;
        w.range = 460;
        w.speed = 7.4;
        break;
      case 'celestial_lightning':
        w.name = 'Ira del Trueno de Zeus';
        w.icon = '⚡';
        w.count = 4;
        w.maxCooldown = 0.85;
        w.damage = 110;
        w.range = 480;
        w.radius = 85;
        break;
      case 'death_scythe':
        w.name = 'Guadaña de la Muerte Eterna';
        w.icon = '🪓';
        w.count = 4;
        w.maxCooldown = 0.75;
        w.damage = 65;
        w.speed = 6.8;
        w.scale = 1.8;
        break;
      case 'blood_garlic':
        w.name = 'Devorador Carmesí de Almas';
        w.icon = '📿';
        w.maxCooldown = 0.35;
        w.damage = 38;
        w.radius = 115;
        break;
    }
    if (window.particleSystem) {
      window.particleSystem.triggerScreenShake(0.3, 8);
      if (window.game && window.game.player) {
        window.particleSystem.spawnTeleportSparks(window.game.player.x + 12, window.game.player.y + 19);
      }
    }
    if (window.soundEngine && window.soundEngine.playPrestige) {
      window.soundEngine.playPrestige();
    }
    this.updateHUD();
    return w;
  }

  applyLevelStats(w) {
    if (w.isEvolved) return;
    switch (w.type) {
      case 'holy_cross':
        w.name = 'Cruces de Luz';
        w.icon = '✝️';
        w.count = 1 + w.level; // 2 crosses at lvl 1, 3 at lvl 2, 4 at lvl 3, etc.
        w.radius = 52 + w.level * 8;
        w.damage = 16 + w.level * 6;
        w.orbitSpeed = 3.6 + w.level * 0.4;
        break;

      case 'hellfire_orb':
        w.name = 'Orbe del Averno';
        w.icon = '☄️';
        w.maxCooldown = Math.max(0.65, 1.35 - (w.level - 1) * 0.16);
        w.damage = 28 + (w.level - 1) * 10;
        w.count = w.level >= 3 ? 2 : 1;
        w.range = 380;
        w.speed = 6.4;
        break;

      case 'celestial_lightning':
        w.name = 'Ira del Cielo';
        w.icon = '⚡';
        w.maxCooldown = Math.max(1.1, 2.1 - (w.level - 1) * 0.24);
        w.damage = 44 + (w.level - 1) * 16;
        w.count = w.level >= 2 ? 2 : 1;
        w.range = 420;
        w.radius = 50 + (w.level - 1) * 10;
        break;

      case 'death_scythe':
        w.name = 'Guadaña Espectral';
        w.icon = '🪓';
        w.maxCooldown = Math.max(0.85, 1.7 - (w.level - 1) * 0.2);
        w.damage = 24 + (w.level - 1) * 8;
        w.count = w.level >= 2 ? 2 : 1;
        w.speed = 5.8;
        break;

      case 'blood_garlic':
        w.name = 'Aura de Penitencia';
        w.icon = '📿';
        w.maxCooldown = 0.55;
        w.damage = 14 + (w.level - 1) * 6;
        w.radius = 58 + (w.level - 1) * 12;
        break;
    }
  }

  update(dt, player, level, enemies, bats, boss, enemyProjectiles, soundEng, particleSys) {
    if (!player || player.hp <= 0) return;

    const areaMult = this.getTomeAreaMultiplier();
    const dmgMult = this.getTomeDamageMultiplier();
    const cdMult = this.getTomeCooldownMultiplier();

    // Collect all living targets for auto-targeting
    const targets = [];
    if (enemies) {
      for (const e of enemies) {
        if (!e.isDead && e.hp > 0) targets.push(e);
      }
    }
    if (bats) {
      for (const b of bats) {
        if (!b.isDead && b.hp > 0) targets.push(b);
      }
    }
    if (boss && !boss.isDead && boss.hp > 0) {
      targets.push(boss);
    }

    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;

    // ─── 1. UPDATE HOLY CROSS ORBIT ───
    const crossWeapon = this.weapons.get('holy_cross');
    if (crossWeapon) {
      this.holyOrbitAngle += dt * crossWeapon.orbitSpeed;
      const step = (Math.PI * 2) / crossWeapon.count;
      const effectiveRadius = crossWeapon.radius * areaMult;
      const effectiveDmg = Math.round(crossWeapon.damage * dmgMult);

      for (let i = 0; i < crossWeapon.count; i++) {
        const angle = this.holyOrbitAngle + i * step;
        const cx = px + Math.cos(angle) * effectiveRadius;
        const cy = py + Math.sin(angle) * effectiveRadius;

        // Sparkle particles occasionally
        if (Math.random() < (crossWeapon.isEvolved ? 0.25 : 0.12) && particleSys) {
          particleSys.spawnDust(cx, cy, 1);
        }

        // Damage nearby enemies
        for (const t of targets) {
          const tx = t.x + (t.w ? t.w / 2 : 12);
          const ty = t.y + (t.h ? t.h / 2 : 16);
          const dist = Math.hypot(tx - cx, ty - cy);
          if (dist < (crossWeapon.isEvolved ? 34 : 26)) {
            if (!t._holyCrossCooldown || t._holyCrossCooldown <= 0) {
              if (t.takeDamage) t.takeDamage(effectiveDmg, px, soundEng, particleSys);
              t._holyCrossCooldown = crossWeapon.isEvolved ? 0.22 : 0.32;
              if (particleSys) particleSys.spawnSlashSparks(cx, cy, Math.sign(Math.cos(angle)));
            }
          }
        }

        // Deflect/destroy enemy projectiles
        if (enemyProjectiles) {
          for (const ep of enemyProjectiles) {
            if (!ep.isDead) {
              if (Math.hypot(ep.x - cx, ep.y - cy) < (crossWeapon.isEvolved ? 30 : 22)) {
                ep.isDead = true;
                if (soundEng && soundEng.playParry) soundEng.playParry();
                if (particleSys) particleSys.spawnSlashSparks(ep.x, ep.y, 1);
              }
            }
          }
        }
      }
    }

    // Cooldown ticks for targets hit by holy cross
    for (const t of targets) {
      if (t._holyCrossCooldown > 0) t._holyCrossCooldown -= dt;
      if (t._garlicCooldown > 0) t._garlicCooldown -= dt;
    }

    // ─── 2. UPDATE HELLFIRE ORBS ───
    const fireWeapon = this.weapons.get('hellfire_orb');
    if (fireWeapon) {
      fireWeapon.timer -= dt / cdMult;
      if (fireWeapon.timer <= 0) {
        // Find nearest living target
        let nearest = null;
        let nearestDist = fireWeapon.range;
        for (const t of targets) {
          const tx = t.x + (t.w ? t.w / 2 : 12);
          const ty = t.y + (t.h ? t.h / 2 : 16);
          const d = Math.hypot(tx - px, ty - py);
          if (d < nearestDist) {
            nearestDist = d;
            nearest = t;
          }
        }

        if (nearest) {
          fireWeapon.timer = fireWeapon.maxCooldown;
          const count = fireWeapon.count;
          const effectiveDmg = Math.round(fireWeapon.damage * dmgMult);

          for (let i = 0; i < count; i++) {
            const spread = (i - (count - 1) / 2) * 0.24;
            const targetX = nearest.x + (nearest.w ? nearest.w / 2 : 12);
            const targetY = nearest.y + (nearest.h ? nearest.h / 2 : 16);
            const baseAngle = Math.atan2(targetY - py, targetX - px) + spread;
            this.projectiles.push({
              type: 'hellfire',
              x: px,
              y: py,
              vx: Math.cos(baseAngle) * fireWeapon.speed,
              vy: Math.sin(baseAngle) * fireWeapon.speed,
              damage: effectiveDmg,
              isEvolved: !!fireWeapon.isEvolved,
              target: nearest,
              life: 2.5,
              trailTimer: 0
            });
          }
          if (soundEng && soundEng.playFireCast) soundEng.playFireCast();
        }
      }
    }

    // ─── 3. UPDATE CELESTIAL LIGHTNING ───
    const lightningWeapon = this.weapons.get('celestial_lightning');
    if (lightningWeapon) {
      lightningWeapon.timer -= dt / cdMult;
      if (lightningWeapon.timer <= 0) {
        // Select target(s) within range
        const inRange = targets.filter(t => {
          const tx = t.x + (t.w ? t.w / 2 : 12);
          const ty = t.y + (t.h ? t.h / 2 : 16);
          return Math.hypot(tx - px, ty - py) <= lightningWeapon.range;
        });

        if (inRange.length > 0) {
          lightningWeapon.timer = lightningWeapon.maxCooldown;
          const strikesCount = Math.min(inRange.length, lightningWeapon.count);
          const effectiveDmg = Math.round(lightningWeapon.damage * dmgMult);
          const effectiveRadius = lightningWeapon.radius * areaMult;

          // Pick distinct targets
          const chosen = [];
          for (let i = 0; i < strikesCount; i++) {
            const randIdx = Math.floor(Math.random() * inRange.length);
            chosen.push(inRange.splice(randIdx, 1)[0]);
          }

          for (const target of chosen) {
            const tx = target.x + (target.w ? target.w / 2 : 12);
            const ty = target.y + (target.h ? target.h / 2 : 16);
            this.lightningStrikes.push({
              x: tx,
              y: ty,
              topY: ty - 450,
              timer: 0.18,
              maxTimer: 0.18,
              segments: this.generateLightningPath(tx, ty - 450, tx, ty)
            });

            // Area burst damage
            for (const t of targets) {
              const ex = t.x + (t.w ? t.w / 2 : 12);
              const ey = t.y + (t.h ? t.h / 2 : 16);
              if (Math.hypot(ex - tx, ey - ty) <= effectiveRadius) {
                if (t.takeDamage) t.takeDamage(effectiveDmg, tx, soundEng, particleSys);
              }
            }

            if (particleSys) {
              particleSys.triggerScreenShake(0.18, 5);
              particleSys.spawnSlashSparks(tx, ty, 1);
            }
          }

          if (soundEng && soundEng.playLightningStrike) {
            soundEng.playLightningStrike();
          } else if (soundEng && soundEng.playMeteorExplosion) {
            soundEng.playMeteorExplosion();
          }
        }
      }
    }

    // ─── 4. UPDATE DEATH SCYTHES ───
    const scytheWeapon = this.weapons.get('death_scythe');
    if (scytheWeapon) {
      scytheWeapon.timer -= dt / cdMult;
      if (scytheWeapon.timer <= 0) {
        scytheWeapon.timer = scytheWeapon.maxCooldown;
        const facing = player.facing || 1;
        const count = scytheWeapon.count;
        const effectiveDmg = Math.round(scytheWeapon.damage * dmgMult);
        const effectiveScale = (scytheWeapon.scale || (scytheWeapon.level >= 3 ? 1.4 : 1.1)) * areaMult;

        for (let i = 0; i < count; i++) {
          let vx = 0;
          let vy = 0;
          if (scytheWeapon.isEvolved && count >= 4) {
            // Omnidirectional cross: Right, Left, Up, Down
            if (i === 0) vx = scytheWeapon.speed;
            else if (i === 1) vx = -scytheWeapon.speed;
            else if (i === 2) vy = -scytheWeapon.speed;
            else if (i === 3) vy = scytheWeapon.speed;
          } else {
            const dir = (count === 2 && i === 1) ? -facing : facing;
            vx = dir * scytheWeapon.speed;
          }

          this.projectiles.push({
            type: 'scythe',
            x: px,
            y: py - 4,
            vx: vx,
            vy: vy,
            angle: 0,
            damage: effectiveDmg,
            pierced: new Set(),
            life: 2.0,
            scale: effectiveScale
          });
        }
        if (soundEng && soundEng.playScytheThrow) {
          soundEng.playScytheThrow();
        } else if (soundEng && soundEng.playSwordSlash) {
          soundEng.playSwordSlash();
        }
      }
    }

    // ─── 5. UPDATE BLOOD GARLIC AURA ───
    const garlicWeapon = this.weapons.get('blood_garlic');
    if (garlicWeapon) {
      garlicWeapon.timer -= dt / cdMult;
      if (garlicWeapon.timer <= 0) {
        garlicWeapon.timer = garlicWeapon.maxCooldown;
        this.garlicPulse.active = true;
        this.garlicPulse.timer = 0.22;
        const effectiveRadius = garlicWeapon.radius * areaMult;
        const effectiveDmg = Math.round(garlicWeapon.damage * dmgMult);
        this.garlicPulse.radius = effectiveRadius;

        let hitAnyEnemy = false;
        // Damage & push all enemies inside the aura
        for (const t of targets) {
          const tx = t.x + (t.w ? t.w / 2 : 12);
          const ty = t.y + (t.h ? t.h / 2 : 16);
          const dist = Math.hypot(tx - px, ty - py);
          if (dist <= effectiveRadius) {
            if (t.takeDamage) t.takeDamage(effectiveDmg, px, soundEng, particleSys);
            if (particleSys) particleSys.spawnSlashSparks(tx, ty, Math.sign(tx - px));
            hitAnyEnemy = true;
          }
        }

        // Vampire Evolution Leech: Heal player +2 HP when dealing damage
        if (garlicWeapon.isEvolved && hitAnyEnemy && player.hp < player.maxHp) {
          player.hp = Math.min(player.maxHp, player.hp + 2);
          if (particleSys) particleSys.spawnDust(player.x + 12, player.y + 19, 3);
        }

        // Vampire Evolution Vacuum: Draw all nearby soul orbs aggressively towards player
        if (garlicWeapon.isEvolved && window.game && window.game.soulOrbs) {
          for (const s of window.game.soulOrbs) {
            if (!s.isCollected && Math.hypot(s.x - px, s.y - py) < effectiveRadius * 1.6) {
              const d = Math.max(10, Math.hypot(px - s.x, py - s.y));
              s.vx += ((px - s.x) / d) * 4.2;
              s.vy += ((py - s.y) / d) * 4.2;
            }
          }
        }

        // Destroy any nearby skull projectiles
        if (enemyProjectiles) {
          for (const ep of enemyProjectiles) {
            if (!ep.isDead && Math.hypot(ep.x - px, ep.y - py) <= effectiveRadius) {
              ep.isDead = true;
              if (particleSys) particleSys.spawnDust(ep.x, ep.y, 6);
            }
          }
        }

        if (soundEng && soundEng.playGarlicPulse) {
          soundEng.playGarlicPulse();
        }
      }
    }

    // ─── 6. UPDATE FLYING PROJECTILES ───
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.type === 'hellfire') {
        // Homing steering towards living target
        if (p.target && !p.target.isDead && p.target.hp > 0) {
          const tx = p.target.x + (p.target.w ? p.target.w / 2 : 12);
          const ty = p.target.y + (p.target.h ? p.target.h / 2 : 16);
          const desiredAngle = Math.atan2(ty - p.y, tx - p.x);
          const currentAngle = Math.atan2(p.vy, p.vx);
          let diff = desiredAngle - currentAngle;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          const turnSpeed = Math.min(Math.abs(diff), dt * 8.0) * Math.sign(diff);
          const newAngle = currentAngle + turnSpeed;
          const speed = Math.hypot(p.vx, p.vy);
          p.vx = Math.cos(newAngle) * speed;
          p.vy = Math.sin(newAngle) * speed;
        }

        p.x += p.vx;
        p.y += p.vy;

        p.trailTimer += dt;
        if (p.trailTimer > 0.04 && particleSys) {
          p.trailTimer = 0;
          particleSys.spawnLavaBubble(p.x, p.y);
        }

        // Check collision with any target
        let hit = false;
        for (const t of targets) {
          const tx = t.x + (t.w ? t.w / 2 : 12);
          const ty = t.y + (t.h ? t.h / 2 : 16);
          if (Math.hypot(tx - p.x, ty - p.y) < 26) {
            if (t.takeDamage) t.takeDamage(p.damage, p.x - p.vx, soundEng, particleSys);
            hit = true;
            break;
          }
        }

        if (hit) {
          if (particleSys) {
            particleSys.spawnBloodExplosion(p.x, p.y, 14);
            particleSys.triggerScreenShake(0.08, 2);
          }
          this.projectiles.splice(i, 1);
          continue;
        }
      } else if (p.type === 'scythe') {
        p.x += p.vx;
        p.y += p.vy;
        p.angle += dt * 14.0; // Fast 360° spin

        // Piercing collision with all targets
        for (const t of targets) {
          if (!p.pierced.has(t)) {
            const tx = t.x + (t.w ? t.w / 2 : 12);
            const ty = t.y + (t.h ? t.h / 2 : 16);
            if (Math.hypot(tx - p.x, ty - p.y) < 32 * p.scale) {
              p.pierced.add(t);
              if (t.takeDamage) t.takeDamage(p.damage, p.x, soundEng, particleSys);
              if (particleSys) particleSys.spawnSlashSparks(tx, ty, Math.sign(p.vx));
            }
          }
        }
      }
    }

    // ─── 7. UPDATE LIGHTNING TIMERS ───
    for (let i = this.lightningStrikes.length - 1; i >= 0; i--) {
      const ls = this.lightningStrikes[i];
      ls.timer -= dt;
      if (ls.timer <= 0) {
        this.lightningStrikes.splice(i, 1);
      }
    }

    // ─── 8. UPDATE GARLIC PULSE ───
    if (this.garlicPulse.active) {
      this.garlicPulse.timer -= dt;
      if (this.garlicPulse.timer <= 0) {
        this.garlicPulse.active = false;
      }
    }
  }

  generateLightningPath(x1, y1, x2, y2) {
    const points = [{ x: x1, y: y1 }];
    const segments = 8;
    const dy = (y2 - y1) / segments;
    for (let i = 1; i < segments; i++) {
      const segY = y1 + dy * i;
      const jitter = (Math.random() - 0.5) * 28;
      points.push({ x: x1 + jitter, y: segY });
    }
    points.push({ x: x2, y: y2 });
    return points;
  }

  draw(ctx, camX, camY) {
    if (!this.game.player) return;
    const px = Math.round(this.game.player.x + this.game.player.w / 2 - camX);
    const py = Math.round(this.game.player.y + this.game.player.h / 2 - camY);

    // 1. Draw Garlic Aura
    const garlicWeapon = this.weapons.get('blood_garlic');
    if (garlicWeapon) {
      const rad = garlicWeapon.radius;
      ctx.save();
      // Base glowing boundary
      ctx.strokeStyle = 'rgba(230, 57, 70, 0.45)';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#e63946';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.stroke();

      // Soft crimson tint fill
      ctx.fillStyle = 'rgba(230, 57, 70, 0.06)';
      ctx.fill();

      // Pulse wave when active
      if (this.garlicPulse.active) {
        const pulseRatio = 1.0 - (this.garlicPulse.timer / 0.22);
        ctx.strokeStyle = `rgba(255, 100, 120, ${1.0 - pulseRatio})`;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(px, py, rad * (0.6 + pulseRatio * 0.45), 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 2. Draw Holy Crosses
    const crossWeapon = this.weapons.get('holy_cross');
    if (crossWeapon) {
      ctx.save();
      const step = (Math.PI * 2) / crossWeapon.count;
      for (let i = 0; i < crossWeapon.count; i++) {
        const angle = this.holyOrbitAngle + i * step;
        const cx = px + Math.cos(angle) * crossWeapon.radius;
        const cy = py + Math.sin(angle) * crossWeapon.radius;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle * 2.5); // Spin on own axis

        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#fff4cc';
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 2;

        // Draw luminous Latin Cross
        ctx.beginPath();
        // Vertical beam
        ctx.rect(-3, -12, 6, 24);
        // Horizontal bar
        ctx.rect(-8, -6, 16, 6);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }
      ctx.restore();
    }

    // 3. Draw Flying Projectiles (Hellfire & Scythes)
    for (const p of this.projectiles) {
      const rx = Math.round(p.x - camX);
      const ry = Math.round(p.y - camY);

      if (p.type === 'hellfire') {
        ctx.save();
        ctx.translate(rx, ry);
        ctx.shadowColor = '#ff5500';
        ctx.shadowBlur = 16;
        ctx.fillStyle = '#ff8800';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffff66';
        ctx.beginPath();
        ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (p.type === 'scythe') {
        ctx.save();
        ctx.translate(rx, ry);
        ctx.rotate(p.angle);
        ctx.scale(p.scale, p.scale);

        ctx.shadowColor = '#c77dff';
        ctx.shadowBlur = 14;
        ctx.strokeStyle = '#e0aaff';
        ctx.lineWidth = 3;

        // Draw crescent blade
        ctx.beginPath();
        ctx.arc(0, 0, 14, -0.8 * Math.PI, 0.4 * Math.PI, false);
        ctx.stroke();

        // Handle
        ctx.strokeStyle = '#5a189a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(8, 14);
        ctx.stroke();

        ctx.restore();
      }
    }

    // 4. Draw Celestial Lightning Strikes
    for (const ls of this.lightningStrikes) {
      const alpha = ls.timer / ls.maxTimer;
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, alpha * 1.5);
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;

      ctx.beginPath();
      for (let i = 0; i < ls.segments.length; i++) {
        const pt = ls.segments[i];
        const sx = Math.round(pt.x - camX);
        const sy = Math.round(pt.y - camY);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();

      // Cyan outer glow pass
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Impact blast ring on ground
      const gsx = Math.round(ls.x - camX);
      const gsy = Math.round(ls.y - camY);
      ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(gsx, gsy, 18 * (1.0 - alpha + 0.3), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  updateHUD() {
    if (typeof document === 'undefined' || !document.getElementById || !document.createElement) return;
    const container = document.getElementById('hud-passive-weapons');
    if (!container) return;

    container.innerHTML = '';

    // 1. Primary Starter Weapon: Daga Básica
    const bladeMastery = (window.progression && window.progression.upgrades) ? (window.progression.upgrades.bladeMastery || 0) : 0;
    const daggerLvl = bladeMastery + 1;
    const daggerDmg = (window.game && window.game.player) ? window.game.player.daggerDamage : Math.round(16 + bladeMastery * 2.5);

    const daggerSlot = document.createElement('div');
    daggerSlot.className = 'weapon-hud-slot primary-weapon-slot';
    daggerSlot.title = `Daga de Penitente (Nv.${daggerLvl}): Arma principal cuerpo a cuerpo. Inflige ${daggerDmg} de daño por estocada rápida.`;
    daggerSlot.innerHTML = `
      <span class="weapon-hud-icon">🗡️</span>
      <div class="weapon-hud-info">
        <span class="weapon-hud-name">Daga Básica</span>
        <span class="weapon-hud-lvl">Nv.${daggerLvl}</span>
      </div>
    `;
    container.appendChild(daggerSlot);

    // 2. Equipped Passive Weapons (Auto-attacks & Evolutions)
    for (const [type, w] of this.weapons.entries()) {
      const slot = document.createElement('div');
      const isEvo = !!w.isEvolved;
      slot.className = `weapon-hud-slot ${isEvo ? 'weapon-evolved-slot' : ''}`;
      slot.title = `${w.name} ${isEvo ? '★ SUPER EVOLUCIÓN ★' : `(Nivel ${w.level})`}: Auto-ataque pasivo devastador.`;

      slot.innerHTML = `
        <span class="weapon-hud-icon">${w.icon}</span>
        <div class="weapon-hud-info">
          <span class="weapon-hud-name">${w.name}</span>
          <span class="weapon-hud-lvl ${isEvo ? 'lvl-evolved' : ''}">${isEvo ? '★ MÁX' : `Nv.${w.level}`}</span>
        </div>
      `;
      container.appendChild(slot);
    }
  }
}

window.PassiveWeaponsManager = PassiveWeaponsManager;
