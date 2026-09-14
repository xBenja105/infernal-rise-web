/**
 * Infernal Rise — Entities (Player, Skeletons, Bosses, NPC)
 * Ultra-smooth, responsive movement with gentle acceleration curves,
 * robust platform collision detection, and zero-jolt physics.
 */

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 24;
    this.h = 38;

    // Fluid Weighted Physics (Realistic Smooth Gait)
    this.vx = 0;
    this.vy = 0;
    this.baseGravity = 0.28;
    this.gravity = this.baseGravity;

    // Fluid, Controlled Movement & Soft Air Steering
    this.baseWalkSpeed = 2.60;
    this.maxWalkSpeed = 2.60;
    this.groundAccel = 0.12;  // Responsive, fluid start
    this.groundDecel = 0.10;  // Gentle progressive braking
    this.airAccel = 0.13;     // Smooth mid-air steering
    this.airDecel = 0.06;     // Gentle air braking (silky, non-abrupt float)

    // Organic Visual Transforms (No harsh snaps)
    this.facing = 1;
    this.renderFacing = 1.0;
    this.bodyTilt = 0.0;
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.targetScaleX = 1.0;
    this.targetScaleY = 1.0;
    this.breathTimer = Math.random() * 5.0;
    this.breathY = 0;
    this.walkBobY = 0;

    this.isGrounded = true;
    this.wasGrounded = true;
    this.prevY = y;
    this.prevVy = 0;
    this.isFrozen = false;

    // Hardcore Platformer States: Ladders, Slippery Ice, Styx Mud
    this.isClimbing = false;
    this.climbTimer = 0;
    this.onIce = false;
    this.onMud = false;

    // Jump Feel Enhancements (Forgiving & Fluid)
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.coyoteMax = 0.16; // 160ms grace
    this.jumpBufferMax = 0.16;

    // Instant Responsive Jump System (Smooth, comfortable ~151px peak)
    this.baseJumpForce = 9.2;
    this.jumpForce = 9.2;
    this.isJumping = false;
    this.jumpCutApplied = false;
    this.prevJumpInput = false;

    // Combat System (Basic Dagger & Melee)
    this.maxHp = 100;
    this.hp = 100;
    this.isAttacking = false;
    this.attackCooldown = 0;
    this.attackFrame = 0;
    this.attackTimer = 0;
    this.invulnerableTimer = 0;
    this.attackHitTargets = new Set();

    // Animations
    this.animState = 'idle';
    this.animFrame = 0;
    this.animTimer = 0;
    this.stepTimer = 0;

    // Checkpoint
    this.checkpoint = { x: x, y: y };
    this.lastActivatedCheckpoint = null;

    // Rogue-lite & Incremental variables
    this.hasDoubleJumpUsed = false;
    this.applyProgressionStats();
  }

  applyProgressionStats() {
    const stats = window.progression ? window.progression.getPlayerStats() : null;
    this.maxHp = stats ? stats.maxHp : 100;
    this.hp = Math.min(this.hp, this.maxHp);
    const moveMult = stats ? (stats.moveSpeedMult || 1.0) : 1.0;
    this.maxWalkSpeed = this.baseWalkSpeed * moveMult;
    this.groundAccel = 0.12 * moveMult;
    this.airAccel = 0.13 * moveMult;
    this.jumpForce = stats ? (this.baseJumpForce * stats.jumpForceMult) : this.baseJumpForce;
    this.daggerDamage = stats ? (stats.daggerDamage || 16) : 16;
    this.hasDoubleJumpUsed = false;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.prevY = y;
    this.prevVy = 0;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1;
    this.renderFacing = 1.0;
    this.bodyTilt = 0.0;
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.targetScaleX = 1.0;
    this.targetScaleY = 1.0;
    this.coyoteTimer = 0;
    this.jumpBufferTimer = 0;
    this.isJumping = false;
    this.jumpCutApplied = false;
    this.prevJumpInput = false;
    this.isGrounded = true;
    this.wasGrounded = true;
    this.hp = this.maxHp;
    this.applyProgressionStats();
    this.isAttacking = false;
    this.isFrozen = false;
    this.invulnerableTimer = 0;
    this.lastActivatedCheckpoint = null;
    if (this.attackHitTargets) this.attackHitTargets.clear();
  }

  update(dt, input, level, particleSys, soundEng) {
    if (this.hp <= 0) return 'DEAD';
    if (this.invulnerableTimer > 0) this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);

    if (this.isFrozen) {
      this.vx = 0;
      this.animState = 'idle';
      return 'ALIVE';
    }

    const stats = window.progression ? window.progression.getPlayerStats() : null;

    // Passive HP Regen
    if (stats && stats.hpRegen > 0 && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + stats.hpRegen * dt);
    }

    const isCombat = level.isCombatScene;

    // Timers
    if (this.isGrounded) {
      this.coyoteTimer = this.coyoteMax;
      this.hasDoubleJumpUsed = false;
    } else {
      if (this.coyoteTimer > 0) this.coyoteTimer -= dt;
    }

    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dt;

    // ─── ATTACK SYSTEM (FAST BASIC DAGGER STAB) ───
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    if (input.attack && !this.isAttacking && this.attackCooldown <= 0) {
      this.isAttacking = true;
      this.attackFrame = 0;
      this.attackTimer = 0;
      this.attackCooldown = 0.24;
      if (this.attackHitTargets) this.attackHitTargets.clear();
      if (soundEng) soundEng.playSwordSlash();

      // Flame Blade Boon projectile
      if (window.progression && window.progression.hasBoon('flameBlade') && window.game) {
        window.game.spawnFlameWave(this.x + (this.facing === 1 ? this.w : 0), this.y + 10, this.facing);
      }

      input.attack = false;
    }

    if (this.isAttacking) {
      this.attackTimer += dt;
      this.attackFrame = Math.floor(this.attackTimer / 0.045);
      if (this.attackFrame >= 6) {
        this.isAttacking = false;
        this.attackFrame = 0;
        if (this.attackHitTargets) this.attackHitTargets.clear();
      }
    }

    // ─── LADDER CLIMBING SYSTEM ───
    let touchingLadder = null;
    if (level && level.ladders) {
      for (const lad of level.ladders) {
        if (this.x + this.w > lad.x + 2 && this.x < lad.x + lad.w - 2 &&
            this.y + this.h > lad.y && this.y < lad.y + lad.h) {
          touchingLadder = lad;
          break;
        }
      }
    }

    if (touchingLadder) {
      if (input.up || input.down) {
        if (!this.isClimbing) {
          this.isClimbing = true;
          this.vy = 0;
          this.vx = 0;
        }
      }
    } else {
      this.isClimbing = false;
    }

    if (this.isClimbing) {
      this.isGrounded = false;
      this.vx = 0;
      if (input.up) {
        this.vy = -2.4;
        this.climbTimer += dt * 8.0;
      } else if (input.down) {
        this.vy = 2.4;
        this.climbTimer += dt * 8.0;
      } else {
        this.vy = 0;
      }

      // Leap off ladder with jump
      if (input.jump && !this.prevJumpInput) {
        this.isClimbing = false;
        this.vy = -this.jumpForce * 0.92;
        const leapDir = input.left ? -1 : (input.right ? 1 : this.facing);
        this.vx = leapDir * this.maxWalkSpeed * 1.12;
        this.facing = leapDir;
        this.isJumping = true;
        this.jumpCutApplied = false;
        if (soundEng) soundEng.playJump();
        if (particleSys) particleSys.spawnDust(this.x + this.w / 2, this.y + this.h, 6);
      }

      this.y += this.vy;
      if (touchingLadder) {
        if (this.y < touchingLadder.y - 8) this.y = touchingLadder.y - 8;
        if (this.y + this.h > touchingLadder.y + touchingLadder.h + 6) {
          this.isClimbing = false;
        }
      }
      this.updateAnimation(dt);
      this.prevJumpInput = !!input.jump;
      return 'ALIVE';
    }

    // ─── SMOOTH VELOCITY CURVES & HARDCORE SURFACES ───
    let moveDir = 0;
    if (input.left) moveDir -= 1;
    if (input.right) moveDir += 1;

    if (moveDir !== 0) this.facing = moveDir;

    const targetSpeed = moveDir * this.maxWalkSpeed;

    if (this.isGrounded) {
      if (this.onIce) {
        // Ultra-low friction permafrost slide (Circle IX: Cocytus)
        const iceAccel = 0.032;
        const iceDecel = 0.016;
        if (moveDir !== 0) {
          this.vx += (targetSpeed - this.vx) * iceAccel;
        } else {
          this.vx += (0 - this.vx) * iceDecel;
        }
        if (Math.sign(moveDir) !== Math.sign(this.vx) && Math.abs(this.vx) > 0.8 && particleSys && Math.random() < 0.25) {
          particleSys.spawnDust(this.x + this.w / 2, this.y + this.h, 1);
        }
      } else if (this.onMud) {
        // Viscous Styx mud (Circle V: Wrath) - sluggish wading
        const mudSpeed = moveDir * 1.35;
        if (moveDir !== 0) {
          this.vx += (mudSpeed - this.vx) * 0.05;
        } else {
          this.vx += (0 - this.vx) * 0.24;
        }
      } else {
        // Standard masonry - smooth progressive inertia & fluid turning
        if (moveDir !== 0) {
          const accelRate = (Math.sign(moveDir) !== Math.sign(this.vx) && this.vx !== 0) ? 0.15 : this.groundAccel;
          this.vx += (targetSpeed - this.vx) * accelRate;
        } else {
          this.vx += (0 - this.vx) * this.groundDecel;
        }
      }
    } else {
      // In air: smooth responsive steering + soft counter-braking + wind currents
      if (moveDir !== 0) {
        const airRate = (Math.sign(moveDir) !== Math.sign(this.vx) && this.vx !== 0) ? 0.18 : this.airAccel;
        this.vx += (targetSpeed - this.vx) * airRate;
      } else {
        this.vx += (0 - this.vx) * this.airDecel;
      }

      // Wind currents (only if level has wind and within active zone)
      if (level && level.wind) {
        const inWindZone = (level.wind.activeMinY === undefined || this.y >= level.wind.activeMinY) &&
                           (level.wind.activeMaxY === undefined || this.y <= level.wind.activeMaxY);
        if (inWindZone) {
          this.vx += (level.wind.force || 0) * dt;
        }
      }
    }

    if (Math.abs(this.vx) < 0.05) this.vx = 0;

    // Footsteps cadence
    if (this.isGrounded && Math.abs(this.vx) > 0.6) {
      this.stepTimer += dt;
      if (this.stepTimer > 0.3) {
        this.stepTimer = 0;
        if (soundEng) soundEng.playFootstep();
      }
    }

    // ─── INSTANT RESPONSIVE JUMP SYSTEM (SMOOTH & CONTROLLED) ───
    const jumpJustPressed = (input.jump && !this.prevJumpInput) || (this.jumpBufferTimer > 0);

    if ((this.isGrounded || this.coyoteTimer > 0) && jumpJustPressed) {
      this.vy = -this.jumpForce;
      this.scaleY = 1.14; // Crisp launch stretch
      this.scaleX = 0.90;

      if (moveDir !== 0) {
        this.vx = moveDir * this.maxWalkSpeed;
      }

      this.isGrounded = false;
      this.isJumping = true;
      this.jumpCutApplied = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;

      // Shockwave jump boon on launch
      if (window.progression && window.progression.hasBoon('shockwaveJump')) {
        if (particleSys) particleSys.triggerScreenShake(0.25, 6);
        if (soundEng) soundEng.playMeteorExplosion();
        if (window.game) window.game.triggerShockwave(this.x + this.w / 2, this.y + this.h / 2, 130);
      }

      if (soundEng) soundEng.playJump();
      if (particleSys) particleSys.spawnDust(this.x + this.w / 2, this.y + this.h, 8);
    } else if (!this.isGrounded) {
      // Variable jump height cut: Smooth deceleration when space is released while rising
      if (this.isJumping && !this.jumpCutApplied && !input.jump && this.vy < -2.0) {
        this.vy *= 0.60;
        this.jumpCutApplied = true;
      }

      // Mid-Air Double Jump (if unlocked via Humanity Shards)
      if (stats && stats.hasDoubleJump && !this.hasDoubleJumpUsed && (input.jump && !this.prevJumpInput)) {
        this.vy = -8.5 * stats.jumpForceMult;
        this.scaleY = 1.14;
        this.scaleX = 0.90;
        this.hasDoubleJumpUsed = true;
        this.isJumping = true;
        this.jumpCutApplied = false;
        if (soundEng) soundEng.playJump();
        if (particleSys) particleSys.spawnDust(this.x + this.w / 2, this.y + this.h, 12);
      }
    }

    // Feather Fall Glide (Boon)
    if (window.progression && window.progression.hasBoon('featherFall') && !this.isGrounded && input.jump && this.vy > 1.2) {
      this.vy = Math.min(this.vy, 2.2);
      if (Math.random() < 0.25 && particleSys) {
        particleSys.spawnDust(this.x + this.w / 2, this.y + this.h, 1);
      }
    }

    // Apex Float & Controlled Fall (Snappy, non-floaty descent)
    if (Math.abs(this.vy) < 2.0 && !this.isGrounded) {
      this.gravity = this.baseGravity * 0.70;
    } else if (this.vy > 0) {
      this.gravity = this.baseGravity * 1.12;
    } else {
      this.gravity = this.baseGravity;
    }

    this.vy += this.gravity;
    if (this.vy > 10.0) this.vy = 10.0;

    this.prevY = this.y;
    this.prevVy = this.vy;

    // Move X
    this.x += this.vx;

    // Boundaries
    if (this.x < 10) { this.x = 10; this.vx = 0; }
    if (this.x + this.w > level.width - 10) { this.x = level.width - 10 - this.w; this.vx = 0; }

    // Move Y
    this.y += this.vy;
    this.wasGrounded = this.isGrounded;
    this.isGrounded = false;

    // Platform Collisions (Semi-Solid / One-Way: can jump up through, land on top)
    this.resolvePlatformCollisions(level.platforms);

    // Landing feedback with gentle elastic impact squash (no harsh flattening)
    if (!this.wasGrounded && this.isGrounded) {
      const impact = Math.min(0.20, Math.max(0.06, Math.abs(this.prevVy) * 0.018));
      this.scaleY = 1.0 - impact;
      this.scaleX = 1.0 + impact * 0.60;
      if (soundEng) soundEng.playLand();
      if (particleSys) particleSys.spawnDust(this.x + this.w / 2, this.y + this.h, 6);
    }

    // ─── HAZARD COLLISIONS ───
    const hazard = this.checkHazardCollisions(level);
    if (hazard === 'LAVA' || hazard === 'PIT') {
      return 'DEAD';
    } else if (hazard === 'SPIKES') {
      if (stats && stats.hasSpikeResist) {
        if (this.invulnerableTimer <= 0) {
          const dmg = Math.round(this.maxHp * stats.spikeDamageRatio);
          this.takeDamage(dmg, soundEng, particleSys);
          this.vy = -7.2; // Bounce safely off spikes
          this.y -= 8;
          if (this.hp <= 0) return 'DEAD';
        }
      } else {
        return 'DEAD';
      }
    }

    // ─── CHECKPOINTS ───
    if (!level.isCombatScene && level.platforms) {
      for (const p of level.platforms) {
        if (p.isCheckpoint && this.x >= p.x - 10 && this.x <= p.x + p.w + 10 && Math.abs(this.y + this.h - p.y) < 6) {
          const ckptId = p.checkpointId !== undefined ? p.checkpointId : `${Math.round(p.x)}_${Math.round(p.y)}`;
          if (this.lastActivatedCheckpoint !== ckptId) {
            this.lastActivatedCheckpoint = ckptId;
            this.checkpoint = { x: p.x + p.w / 2 - this.w / 2, y: p.y - this.h };
            this.hp = this.maxHp;
            if (particleSys) particleSys.spawnDust(this.x + this.w / 2, this.y + this.h, 12);
          }
        }
      }
    }

    this.updateAnimation(dt);
    this.prevJumpInput = !!input.jump;

    if (this.hp <= 0) return 'DEAD';
    return 'ALIVE';
  }

  resolvePlatformCollisions(platforms) {
    if (!platforms || !Array.isArray(platforms)) return;
    const feetY = this.y + this.h;
    const prevFeetY = this.prevY + this.h;
    this.onIce = false;
    this.onMud = false;

    for (const p of platforms) {
      if (p.isCollapsed) continue; // Skip collapsed crumbling platforms

      // Horizontal overlap check
      if (this.x + this.w > p.x + 2 && this.x < p.x + p.w - 2) {
        // Land condition: descending OR resting near top
        if (this.vy >= 0) {
          if ((prevFeetY <= p.y + 10 && feetY >= p.y - 1) || (Math.abs(feetY - p.y) <= 4)) {
            this.y = p.y - this.h;
            this.vy = 0;
            this.isGrounded = true;
            this.isJumping = false;
            this.jumpCutApplied = false;

            // Surface friction flags
            if (p.type === 'ice') this.onIce = true;
            if (p.type === 'mud') this.onMud = true;

            // Trigger crumbling platform
            if (p.isCrumbling && !p.isTriggered) {
              p.trigger();
            }

            // Carry player with moving platform
            if (p.deltaX) this.x += p.deltaX;
            if (p.deltaY) this.y += p.deltaY;

            break;
          }
        }
      }
    }
  }

  checkHazardCollisions(level) {
    // Spikes (floor, ceiling, wall hazards)
    if (level.spikes) {
      for (const sp of level.spikes) {
        if (this.x + this.w > sp.x + 4 && this.x < sp.x + sp.w - 4 &&
            this.y + this.h > sp.y + 4 && this.y < sp.y + sp.h - 2) {
          return 'SPIKES';
        }
      }
    }

    // Lava
    if (level.hasLava && (this.y + this.h >= level.lavaY)) {
      return 'LAVA';
    }

    // Fall off bottom of level
    if (this.y > level.height + 60) {
      return 'PIT';
    }

    return null;
  }

  takeDamage(amount, soundEng, particleSys) {
    if (this.invulnerableTimer > 0) return;
    if (window.progression && window.progression.hasBoon('ironWill')) {
      amount = Math.round(amount * 0.65);
    }
    this.hp -= amount;
    this.invulnerableTimer = 1.1; // 1.1s of i-frame grace period to prevent unfair consecutive stuns
    this.vy = -5.0;
    this.vx = -this.facing * 3.4;
    if (soundEng) soundEng.playHit();
    if (particleSys) particleSys.spawnSlashSparks(this.x + this.w / 2, this.y + this.h / 2, -this.facing);
    if (window.game) {
      if (window.game.triggerHitStop) window.game.triggerHitStop(0.045);
      if (window.game.triggerScreenShake) window.game.triggerScreenShake(8, 0.3);
      if (window.game.triggerGamepadRumble) window.game.triggerGamepadRumble(250, 0.6, 0.8);
    }
  }

  updateAnimation(dt) {
    // Immediate directional snap (no horizontal flattening or disappearing)
    this.renderFacing = this.facing;

    // Dynamic body tilt (leaning into speed & momentum - subtle & natural)
    const targetTilt = this.isGrounded ? (this.vx * 0.024) : (this.vx * 0.016);
    this.bodyTilt += (targetTilt - this.bodyTilt) * Math.min(1.0, dt * 7.5);

    // Natural human breathing & walk step bob
    this.breathTimer += dt;
    this.breathY = (this.isGrounded && Math.abs(this.vx) < 0.2) ? Math.sin(this.breathTimer * 2.8) * 1.2 : 0;
    this.walkBobY = (this.isGrounded && Math.abs(this.vx) >= 0.2) ? Math.abs(Math.sin(this.stepTimer * Math.PI / 0.3)) * 1.6 : 0;

    // Elastic squash & stretch recovery
    this.scaleX += (1.0 - this.scaleX) * Math.min(1.0, dt * 12.0);
    this.scaleY += (1.0 - this.scaleY) * Math.min(1.0, dt * 12.0);

    if (this.isAttacking) {
      this.animState = 'attack';
      return;
    }

    if (this.invulnerableTimer > 0.45) {
      this.animState = 'hurt';
      this.animFrame = Math.min(2, Math.floor((0.8 - this.invulnerableTimer) / 0.12));
      return;
    }

    if (this.isClimbing) {
      this.animState = 'climb';
      this.animFrame = Math.floor(this.climbTimer) % 6;
      return;
    }

    if (!this.isGrounded) {
      this.animState = this.vy < 0 ? 'jump' : 'fall';
      if (this.vy < -6.0) {
        this.animFrame = 1; // Stretch launch
      } else if (this.vy < -1.5) {
        this.animFrame = 2; // Ascent tuck
      } else if (Math.abs(this.vy) <= 1.5) {
        this.animFrame = 3; // Apex float
      } else if (this.vy < 7.0) {
        this.animFrame = 4; // Descent ready
      } else {
        this.animFrame = 5; // Rapid fall
      }
      return;
    }

    if (Math.abs(this.vx) > 0.3) {
      this.animState = 'run';
      this.animTimer += dt;
      this.animFrame = Math.floor(this.animTimer / 0.08) % 10;
    } else {
      this.animState = 'idle';
      this.animTimer += dt;
      this.animFrame = Math.floor(this.animTimer / 0.15) % 8;
    }
  }

  draw(ctx, camX, camY) {
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();

    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Anchor at feet bottom-center for smooth squash, stretch, and lean
    ctx.translate(rx + this.w / 2, ry + this.h + this.breathY - this.walkBobY);
    ctx.scale(this.facing * this.scaleX, this.scaleY);
    ctx.rotate(this.bodyTilt * Math.sign(this.facing));
    ctx.translate(-this.w / 2, -this.h);

    const pwm = window.game ? window.game.passiveWeaponsManager : null;
    const visuals = pwm ? pwm.getActiveVisuals() : null;
    const activeSkin = (window.progression && window.progression.selectedSkin) ? window.progression.selectedSkin : 'soldier';

    // ── WARDROBE SKIN BACK EFFECTS ──
    if (activeSkin === 'crimson') {
      ctx.save();
      const capeWave = Math.sin(Date.now() * 0.006) * 3;
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(3, 10);
      ctx.lineTo(-9 + capeWave, 32);
      ctx.lineTo(2 + capeWave, 34);
      ctx.lineTo(10, 14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-2 + capeWave * 0.5, 14, 5, 16);
      ctx.restore();
    } else if (activeSkin === 'abyss') {
      ctx.save();
      const abyssPulse = 0.25 + Math.sin(Date.now() * 0.007) * 0.12;
      ctx.fillStyle = `rgba(147, 51, 234, ${abyssPulse})`;
      ctx.beginPath();
      ctx.arc(8, 16, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (activeSkin === 'paladin') {
      ctx.save();
      const haloPulse = 0.22 + Math.sin(Date.now() * 0.005) * 0.08;
      ctx.fillStyle = `rgba(250, 204, 21, ${haloPulse})`;
      ctx.beginPath();
      ctx.arc(8, 10, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(8, 10, 13, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ── ASCENDED ARCHON SKIN: SERAPH WINGS & CELESTIAL BACK GLOW ──
    if ((visuals && visuals.hasAllWeapons) || activeSkin === 'ascended') {
      ctx.save();
      const wingTime = Date.now() * 0.005;
      const flapAngle = Math.sin(wingTime) * 0.18 + (this.animState === 'jump' || this.animState === 'fall' ? 0.35 : 0);

      // Back Holy Halo
      ctx.fillStyle = 'rgba(255, 215, 0, 0.16)';
      ctx.beginPath();
      ctx.arc(8, 12, 28, 0, Math.PI * 2);
      ctx.fill();

      // Wing drawing helper
      const drawWing = (dir) => {
        ctx.save();
        ctx.translate(8, 14);
        ctx.scale(dir, 1);
        ctx.rotate(flapAngle);

        // Golden Outer Feathers
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffb703';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-14, -22, -32, -18);
        ctx.quadraticCurveTo(-38, -4, -24, 8);
        ctx.quadraticCurveTo(-12, 6, 0, 0);
        ctx.closePath();
        ctx.fill();

        // Inner Crimson Flame Feather Layer
        ctx.fillStyle = '#ff3b30';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-10, -16, -24, -12);
        ctx.quadraticCurveTo(-28, -2, -18, 5);
        ctx.quadraticCurveTo(-8, 4, 0, 0);
        ctx.closePath();
        ctx.fill();

        // Starlight Diamond Shaft
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-28, -14);
        ctx.stroke();

        ctx.restore();
      };

      drawWing(-1); // Left Seraph Wing
      drawWing(1);  // Right Seraph Wing
      ctx.restore();
    }

    // ── DYNAMIC PASSIVE EQUIPMENT: BACK LAYER (Spectral Javelin) ──
    if (visuals && visuals.hasJavelin) {
      ctx.save();
      // Spectral cyan javelin diagonally across back (opposite angle)
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(18, 28);
      ctx.lineTo(2, -4);
      ctx.stroke();

      // Trident / Javelin Head
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(2, -4);
      ctx.lineTo(-2, -10);
      ctx.lineTo(2, -8);
      ctx.lineTo(6, -10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // ── DYNAMIC PASSIVE EQUIPMENT: BACK LAYER (Death Scythe) ──
    if (visuals && visuals.hasScythe) {
      ctx.save();
      // Obsidian haft angled diagonally across back
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(4, 30);
      ctx.lineTo(-4, 0);
      ctx.stroke();

      // Spectral cyan crescent scythe blade extending over shoulder
      ctx.fillStyle = '#00f5d4';
      ctx.beginPath();
      ctx.arc(-4, 0, 10, -Math.PI / 1.8, Math.PI / 3.5, false);
      ctx.lineTo(-1, -3);
      ctx.closePath();
      ctx.fill();

      // Blade sharp glint
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-6, -4, 4, 1.5);
      ctx.restore();
    }

    const kaelSprites = window.spriteManager.sprites.kael;
    let frameCanvas = null;

    if (this.animState === 'attack' && kaelSprites && kaelSprites.attack) {
      frameCanvas = kaelSprites.attack[this.attackFrame] || kaelSprites.attack[0];
    } else if (this.animState === 'hurt' && kaelSprites && kaelSprites.hurt) {
      frameCanvas = kaelSprites.hurt[this.animFrame] || kaelSprites.hurt[0];
    } else if (this.animState === 'climb' && kaelSprites && kaelSprites.climb) {
      frameCanvas = kaelSprites.climb[this.animFrame] || kaelSprites.climb[0];
    } else if ((this.animState === 'jump' || this.animState === 'fall') && kaelSprites && kaelSprites.jump) {
      frameCanvas = kaelSprites.jump[this.animFrame] || kaelSprites.jump[0];
    } else if (this.animState === 'run' && kaelSprites && kaelSprites.run) {
      frameCanvas = kaelSprites.run[this.animFrame] || kaelSprites.run[0];
    } else if (kaelSprites && kaelSprites.idle) {
      frameCanvas = kaelSprites.idle[this.animFrame] || kaelSprites.idle[0];
    }

    if (frameCanvas) {
      const dw = frameCanvas.width / 2;
      const dh = frameCanvas.height / 2;
      const ox = this.animState === 'attack' ? -10 : -6;
      const oy = -3;
      ctx.drawImage(frameCanvas, ox, oy, dw, dh);
    }

    // ── DYNAMIC PASSIVE EQUIPMENT: FRONT LAYERS ──
    if (visuals) {
      // 1. Blood Garlic Aura Ring (Pulsing around torso)
      if (visuals.hasGarlic) {
        ctx.save();
        const pulse = 0.45 + Math.sin(Date.now() * 0.005) * 0.2;
        ctx.strokeStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(12, 22, 16, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Holy Cross Pectoral Amulet & Golden Gleam
      if (visuals.hasHolyCross) {
        ctx.save();
        // Golden Chain
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(7, 12);
        ctx.lineTo(12, 16);
        ctx.lineTo(17, 12);
        ctx.stroke();
        // Golden Cross Pendant
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(11, 15, 3, 7);
        ctx.fillRect(9, 17, 7, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(12, 17, 1, 1);
        // Holy sparkle
        if (Math.floor(Date.now() / 200) % 2 === 0) {
          ctx.fillStyle = '#ffea75';
          ctx.fillRect(11, 14, 3, 1);
        }
        ctx.restore();
      }

      // 3. Hellfire Magma Orb (Floating above rear shoulder)
      if (visuals.hasHellfireOrb) {
        ctx.save();
        const orbBob = Math.sin(Date.now() * 0.006) * 3;
        const ox = -6, oy = 4 + orbBob;
        // Fiery glow
        ctx.fillStyle = 'rgba(255, 68, 0, 0.35)';
        ctx.beginPath();
        ctx.arc(ox, oy, 7, 0, Math.PI * 2);
        ctx.fill();
        // Magma core
        ctx.fillStyle = '#ff2200';
        ctx.beginPath();
        ctx.arc(ox, oy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(ox + 1, oy - 1, 2, 0, Math.PI * 2);
        ctx.fill();
        // Orbiting ember spark
        const spAng = Date.now() * 0.008;
        ctx.fillStyle = '#ffff66';
        ctx.fillRect(ox + Math.cos(spAng) * 6 - 1, oy + Math.sin(spAng) * 6 - 1, 2, 2);
        ctx.restore();
      }

      // 4. Celestial Lightning Arcs (Crackling over arms & hands)
      if (visuals.hasLightning) {
        ctx.save();
        const now = Date.now();
        if (Math.floor(now / 90) % 3 !== 0) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(14, 18);
          ctx.lineTo(18 + (now % 5 - 2), 22);
          ctx.lineTo(22, 24 + (now % 3 - 1));
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(4, 12);
          ctx.lineTo(8 + (now % 4 - 2), 10);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. Infernal Chakram (Orbiting razor disc near hip)
      if (visuals.hasChakram) {
        ctx.save();
        const spinAng = Date.now() * 0.012;
        const cx = 16 + Math.cos(spinAng * 0.5) * 4;
        const cy = 18 + Math.sin(spinAng * 0.5) * 3;
        ctx.translate(cx, cy);
        ctx.rotate(spinAng);
        ctx.shadowColor = '#ff0055';
        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.stroke();
        // Cross blades
        ctx.fillStyle = '#ff0055';
        ctx.fillRect(-7, -1.5, 14, 3);
        ctx.fillRect(-1.5, -7, 3, 14);
        ctx.restore();
      }

      // 6. ASCENDED ARCHON CROWN & PAULDRONS (Skin Definitiva al tener todas las armas o Skin Ascendida)
      if ((visuals && visuals.hasAllWeapons) || activeSkin === 'ascended') {
        ctx.save();
        // A. Golden Crown of Radiant Flame
        const crownBob = Math.sin(Date.now() * 0.006) * 1.5;
        const headX = 6, headY = -9 + crownBob;

        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 14;
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        // 5-Point Golden Crown
        ctx.moveTo(headX - 8, headY);
        ctx.lineTo(headX - 9, headY - 8);
        ctx.lineTo(headX - 4, headY - 4);
        ctx.lineTo(headX, headY - 11);
        ctx.lineTo(headX + 4, headY - 4);
        ctx.lineTo(headX + 9, headY - 8);
        ctx.lineTo(headX + 8, headY);
        ctx.closePath();
        ctx.fill();

        // Crown Crown Jewels (Ruby center & emerald sides)
        ctx.fillStyle = '#ff2a2a';
        ctx.fillRect(headX - 1.5, headY - 5, 3, 3);
        ctx.fillStyle = '#00f5d4';
        ctx.fillRect(headX - 6, headY - 4, 2, 2);
        ctx.fillRect(headX + 4, headY - 4, 2, 2);

        // B. Radiant Pauldrons (Golden armored shoulders)
        ctx.fillStyle = '#d4af37';
        ctx.strokeStyle = '#fff275';
        ctx.lineWidth = 1;
        // Left pauldron
        ctx.beginPath();
        ctx.arc(0, 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // Right pauldron
        ctx.beginPath();
        ctx.arc(14, 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // C. Orbiting Seraphic Embers
        const emberT = Date.now() * 0.007;
        for (let e = 0; e < 3; e++) {
          const eAng = emberT + (e * Math.PI * 2) / 3;
          const ex = 7 + Math.cos(eAng) * 18;
          const ey = 14 + Math.sin(eAng) * 12;
          ctx.fillStyle = e % 2 === 0 ? '#ffd700' : '#00f5d4';
          ctx.fillRect(ex, ey, 2, 2);
        }
        ctx.restore();
      }
    }

    // ── WARDROBE SKIN FRONT DETAILS ──
    if (activeSkin === 'crimson') {
      ctx.save();
      ctx.fillStyle = '#ef4444';
      ctx.strokeStyle = '#fee2e2';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(1, 9, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ff1e38';
      ctx.fillRect(8, 3, 2, 2);
      ctx.restore();
    } else if (activeSkin === 'abyss') {
      ctx.save();
      ctx.fillStyle = '#00f5d4';
      ctx.shadowColor = '#00f5d4';
      ctx.shadowBlur = 6;
      ctx.fillRect(8, 3, 2, 2);
      ctx.restore();
    } else if (activeSkin === 'paladin') {
      ctx.save();
      ctx.fillStyle = '#ffd700';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(1, 9, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(4, -1, 8, 2);
      ctx.restore();
    }

    ctx.restore();

    // ─── OVERHEAD FLOATING HEALTH BAR FOR KAEL (ALWAYS VISIBLE) ───
    if (this.hp > 0) {
      const barW = 36;
      const barH = 5;
      const barX = Math.round(rx + (this.w - barW) / 2);
      const barY = Math.round(ry - 13);

      // Overhead Ascended Avatar Distinction
      if (visuals && visuals.hasAllWeapons) {
        ctx.save();
        ctx.font = 'bold 8px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffd700';
        ctx.fillText('✦ AVATAR ASCENDIDO ✦', rx + this.w / 2, barY - 4);
        ctx.restore();
      }

      ctx.save();
      // Drop shadow for crisp readability against any background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
      ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

      // Dark background inner
      ctx.fillStyle = 'rgba(18, 8, 12, 0.92)';
      ctx.fillRect(barX, barY, barW, barH);

      // Health bar fill with gradient
      const hpPct = Math.max(0, Math.min(1, this.hp / this.maxHp));
      const fillW = Math.round(barW * hpPct);
      if (fillW > 0) {
        let fillStyle = hpPct > 0.5 ? '#16a34a' : (hpPct > 0.25 ? '#ea580c' : '#dc2626');
        if (ctx.createLinearGradient) {
          const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
          if (hpPct > 0.5) {
            grad.addColorStop(0, '#22c55e');
            grad.addColorStop(1, '#16a34a');
          } else if (hpPct > 0.25) {
            grad.addColorStop(0, '#eab308');
            grad.addColorStop(1, '#ea580c');
          } else {
            grad.addColorStop(0, '#ef4444');
            grad.addColorStop(1, '#991b1b');
          }
          fillStyle = grad;
        }
        ctx.fillStyle = fillStyle;
        ctx.fillRect(barX, barY, fillW, barH);
      }

      // Border: Frame, pulsing red when in critical health (< 30%)
      if (this.hp <= this.maxHp * 0.3) {
        const pulse = 0.5 + Math.sin(Date.now() * 0.012) * 0.5;
        ctx.strokeStyle = `rgba(255, 34, 68, ${pulse})`;
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = '#5a1820';
        ctx.lineWidth = 1;
      }
      if (ctx.strokeRect) ctx.strokeRect(barX - 0.5, barY - 0.5, barW + 1, barH + 1);

      ctx.restore();
    }
  }
}

// ─── AGGRESSIVE PURSUIT & PATROLLING SKELETON ENEMY ───
class SkeletonEnemy {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.isElite = !!data.isElite;
    this.scaleMultiplier = data.scaleMultiplier || (this.isElite ? 1.45 : 1.0);
    this.skin = data.skin || 'abyss';
    this.variant = data.variant !== undefined ? data.variant : Math.floor(Math.random() * 4);

    this.w = Math.round(26 * this.scaleMultiplier);
    this.h = Math.round(34 * this.scaleMultiplier);
    this.minX = data.minX;
    this.maxX = data.maxX;
    this.hp = data.hp || (this.isElite ? 85 : 30);
    this.maxHp = this.hp;
    this.touchDamage = this.isElite ? 26 : 18; // Rebalanced from 44/30 to prevent early-run instant death
    this.isMage = data.isMage || data.type === 'skeleton_mage';

    // Platform & Gravity Physics (Strict ground anchoring, zero floating)
    this.vy = 0;
    this.gravity = 0.32;
    this.isGrounded = false;
    this.onPlatform = null;
    this.initializedGround = false;

    // Movement Speeds
    this.patrolSpeed = 0.82;
    this.chaseSpeed = data.chaseSpeed || (this.isElite ? 2.4 : 2.2);
    this.currentVx = 0;
    this.dir = 1;
    this.renderFacing = 1.0;
    this.isDead = false;
    this.hasDropped = false;

    // States: 'walk', 'pause_turn', 'alert', 'chase', 'attack', 'shoot', 'hit', 'dead'
    this.state = data.state || 'chase';
    this.pauseTimer = 0;
    this.alertTimer = 0;
    this.hasAlerted = true;
    this.alertPulse = 0;
    this.lostSightTimer = 0;
    this.jumpCooldown = 0;
    this.shootCooldown = 1.6 + Math.random() * 1.5;
    this.shootTimer = 0;

    this.attackCooldown = 0.8 + Math.random() * 0.8;
    this.attackTimer = 0;
    this.attackHasHit = false;
    this.hitTimer = 0;
    this.deathTimer = 0;
    this.wobbleTimer = Math.random() * 10;
    this.wobbleAngle = 0;
    this.stepBob = 0;

    this.animTimer = 0;
    this.animFrame = 0;
  }

  getSkinData() {
    switch (this.skin) {
      case 'celestial':
        return {
          tint: 'rgba(255, 235, 120, 0.45)',
          eyeColor: '#ffd700',
          eyeGlow: 'rgba(255, 215, 0, 0.9)',
          auraColor: 'rgba(255, 215, 0, 0.35)',
          name: 'Centinela del Umbral Terrenal'
        };
      case 'gold':
        return {
          tint: 'rgba(255, 215, 0, 0.38)',
          eyeColor: '#ffb703',
          eyeGlow: 'rgba(255, 183, 3, 0.8)',
          auraColor: 'rgba(255, 215, 0, 0.28)',
          name: 'Guardia Avaro de la Torre'
        };
      case 'mud':
        return {
          tint: 'rgba(60, 85, 40, 0.42)',
          eyeColor: '#70e000',
          eyeGlow: 'rgba(112, 224, 0, 0.8)',
          auraColor: 'rgba(112, 224, 0, 0.28)',
          name: 'Caminante de las Catacumbas'
        };
      case 'obsidian':
        return {
          tint: 'rgba(20, 12, 16, 0.65)',
          eyeColor: '#ff3c00',
          eyeGlow: 'rgba(255, 60, 0, 0.85)',
          auraColor: 'rgba(255, 60, 0, 0.32)',
          name: 'Esqueleto de Obsidiana Ígnea'
        };
      case 'blood':
        return {
          tint: 'rgba(130, 12, 30, 0.45)',
          eyeColor: '#ff0054',
          eyeGlow: 'rgba(255, 0, 84, 0.85)',
          auraColor: 'rgba(255, 0, 84, 0.32)',
          name: 'Guardia Óseo de la Fortaleza'
        };
      case 'ice':
        return {
          tint: 'rgba(160, 225, 255, 0.38)',
          eyeColor: '#00b4d8',
          eyeGlow: 'rgba(0, 180, 216, 0.85)',
          auraColor: 'rgba(0, 180, 216, 0.32)',
          name: 'Espectro de las Agujas Heladas'
        };
      case 'ashen':
        return {
          tint: 'rgba(190, 195, 205, 0.22)',
          eyeColor: '#90e0ef',
          eyeGlow: 'rgba(144, 224, 239, 0.75)',
          auraColor: 'rgba(144, 224, 239, 0.2)',
          name: 'Centinela de Ceniza'
        };
      case 'abyss':
      default:
        return {
          tint: 'rgba(160, 185, 205, 0.18)',
          eyeColor: '#00f5d4',
          eyeGlow: 'rgba(0, 245, 212, 0.75)',
          auraColor: 'rgba(0, 245, 212, 0.2)',
          name: 'Esqueleto del Foso Abisal'
        };
    }
  }

  update(dt, player, level, soundEng, particleSys) {
    if (this.isDead) return;

    // Parameter flexibility
    if (level && !level.platforms && (level.playHit || level.audioCtx)) {
      particleSys = soundEng;
      soundEng = level;
      level = window.game ? window.game.level : null;
    }

    // Death crumble playback
    if (this.state === 'dead') {
      this.deathTimer -= dt;
      this.animFrame = Math.min(14, Math.floor((0.9 - this.deathTimer) / 0.06));
      if (this.deathTimer <= 0) {
        this.isDead = true;
      }
      return;
    }

    // Hit reaction playback (Megabonk Domino Collisions & Overkill)
    if (this.state === 'hit') {
      this.hitTimer -= dt;
      this.animFrame = Math.min(7, Math.floor((0.35 - this.hitTimer) / 0.044));
      this.currentVx *= 0.88;
      if (this.onPlatform) {
        this.y = this.onPlatform.y - this.h;
        this.vy = 0;
        this.isGrounded = true;
        const minX = this.onPlatform.x + 4;
        const maxX = this.onPlatform.x + this.onPlatform.w - this.w - 4;
        if (minX <= maxX) {
          this.x = Math.max(minX, Math.min(maxX, this.x + this.currentVx));
        } else {
          this.x += this.currentVx;
        }
      } else {
        this.x += this.currentVx;
        this.vy += this.gravity;
        if (this.vy > 10.5) this.vy = 10.5;
        const prevY = this.y;
        this.y += this.vy;

        if (level && level.platforms && this.vy >= 0) {
          for (const p of level.platforms) {
            const enemyLeft = this.x + 4;
            const enemyRight = this.x + this.w - 4;
            if (enemyRight > p.x && enemyLeft < p.x + p.w) {
              if (prevY + this.h <= p.y + 8 && this.y + this.h >= p.y) {
                this.y = p.y - this.h;
                this.vy = 0;
                this.isGrounded = true;
                this.onPlatform = p;
                break;
              }
            }
          }
        }
      }

      // Megabonk Domino Collision: Flying enemy crashes into other enemies
      if (Math.abs(this.currentVx) > 2.6) {
        const enemiesList = (level && Array.isArray(level.enemies)) ? level.enemies : ((window.game && Array.isArray(window.game.enemies)) ? window.game.enemies : []);
        const dominoMult = (window.progression && window.progression.hasBoon('tome_gauntlet')) ? 2.0 : 1.0;
        for (const other of enemiesList) {
          if (other !== this && !other.isDead && other.hp > 0 && other.state !== 'dead') {
            if (Math.abs((this.x + this.w / 2) - (other.x + other.w / 2)) < (this.w + other.w) * 0.48 &&
                Math.abs((this.y + this.h / 2) - (other.y + other.h / 2)) < (this.h + other.h) * 0.48) {
              const dominoDmg = Math.round(26 * dominoMult);
              other.takeDamage(dominoDmg, this.x, soundEng, particleSys);
              this.currentVx *= 0.5;
              if (particleSys && particleSys.spawnFloatingText) {
                particleSys.spawnFloatingText('⚡ ¡CADENA INFERNAL!', other.x + other.w / 2, other.y - 12, { isMegabonk: true });
                particleSys.triggerScreenShake(0.12, 4);
              }
              if (window.progression && window.progression.unlockAchievement) {
                window.progression.unlockAchievement('bonk_chain');
              }
              break;
            }
          }
        }
      }

      // Spike / Lava Overkill
      if (level) {
        if (level.spikes) {
          for (const sp of level.spikes) {
            if (this.x + this.w > sp.x && this.x < sp.x + sp.w &&
                this.y + this.h >= sp.y && this.y < sp.y + sp.h) {
              if (particleSys && particleSys.spawnFloatingText) {
                particleSys.spawnFloatingText('🔥 ¡ANIQUILACIÓN! +4 🔮', this.x + this.w / 2, this.y - 15, { isMegabonk: true });
                particleSys.spawnBloodExplosion(this.x + this.w / 2, this.y + this.h / 2, 40);
              }
              if (window.progression) window.progression.addSouls(4);
              this.hp = 0;
              this.hasDropped = true;
              this.state = 'dead';
              this.deathTimer = 0.8;
              if (soundEng && soundEng.playHit) soundEng.playHit();
              return;
            }
          }
        }
        if (level.lavaY !== undefined && (this.y + this.h >= level.lavaY)) {
          if (particleSys && particleSys.spawnFloatingText) {
            particleSys.spawnFloatingText('🔥 ¡ANIQUILACIÓN! +4 🔮', this.x + this.w / 2, this.y - 15, { isMegabonk: true });
            particleSys.spawnBloodExplosion(this.x + this.w / 2, this.y + this.h / 2, 40);
          }
          if (window.progression) window.progression.addSouls(4);
          this.hp = 0;
          this.hasDropped = true;
          this.state = 'dead';
          this.deathTimer = 0.8;
          if (soundEng && soundEng.playHit) soundEng.playHit();
          return;
        }
      }

      if (this.hitTimer <= 0) {
        this.state = 'chase'; // Immediately turn around and chase aggressor!
        this.hasAlerted = true;
        this.animTimer = 0;
      }
      return;
    }

    // 1. Initial platform snap
    if (!this.initializedGround && level && level.platforms) {
      this.initializedGround = true;
      let bestPlat = null;
      let minDist = 99999;
      const centerX = this.x + this.w / 2;
      for (const p of level.platforms) {
        if (centerX >= p.x - 10 && centerX <= p.x + p.w + 10) {
          const dist = p.y - (this.y + this.h);
          if (dist >= -24 && dist < minDist) {
            minDist = dist;
            bestPlat = p;
          }
        }
      }
      if (bestPlat) {
        this.y = bestPlat.y - this.h;
        this.vy = 0;
        this.isGrounded = true;
        this.onPlatform = bestPlat;
        this.minX = Math.max(this.minX !== undefined ? this.minX : bestPlat.x + 8, bestPlat.x + 6);
        this.maxX = Math.min(this.maxX !== undefined ? this.maxX : (bestPlat.x + bestPlat.w - this.w - 8), bestPlat.x + bestPlat.w - this.w - 6);
        if (this.minX > this.maxX) {
          const mid = bestPlat.x + bestPlat.w / 2 - this.w / 2;
          this.minX = mid - 4;
          this.maxX = mid + 4;
        }
      }
    }

    // 2. Dagger attack hit detection (1 hit per attack swing)
    if (player.isAttacking && (player.attackFrame >= 1 && player.attackFrame <= 3)) {
      const hitX = player.x + (player.facing === 1 ? player.w : -32);
      if (Math.abs(hitX - this.x) < 42 && Math.abs(player.y - this.y) < 34) {
        if (!player.attackHitTargets || !player.attackHitTargets.has(this)) {
          if (player.attackHitTargets) player.attackHitTargets.add(this);
          const stats = window.progression ? window.progression.getPlayerStats() : null;
          let dmg = stats ? (stats.daggerDamage || stats.swordDamage || 16) : 16;
          let isCrit = false;
          if (window.progression && window.progression.hasBoon('critStrike') && Math.random() < 0.3) {
            dmg = Math.round(dmg * 2.5);
            isCrit = true;
          }
          if (isCrit && particleSys) particleSys.triggerScreenShake(0.15, 4);
          this.takeDamage(dmg, player.x, soundEng, particleSys);
          return;
        }
      }
    }

    // 3. Platform Gravity & Collision
    const prevY = this.y;
    if (!this.isGrounded) {
      this.vy += this.gravity;
      if (this.vy > 10.5) this.vy = 10.5;
      this.y += this.vy;

      if (level && level.platforms && this.vy >= 0) {
        for (const p of level.platforms) {
          const enemyLeft = this.x + 4;
          const enemyRight = this.x + this.w - 4;
          if (enemyRight > p.x && enemyLeft < p.x + p.w) {
            if (prevY + this.h <= p.y + 8 && this.y + this.h >= p.y) {
              this.y = p.y - this.h;
              this.vy = 0;
              this.isGrounded = true;
              this.onPlatform = p;
              this.minX = Math.max(p.x + 6, p.x + 6);
              this.maxX = Math.min(p.x + p.w - this.w - 6, p.x + p.w - this.w - 6);
              break;
            }
          }
        }
      }
    } else if (this.onPlatform) {
      this.y = this.onPlatform.y - this.h;
      this.vy = 0;
      this.isGrounded = true;
      const minX = this.onPlatform.x + 4;
      const maxX = this.onPlatform.x + this.onPlatform.w - this.w - 4;
      if (minX <= maxX) {
        this.x = Math.max(minX, Math.min(maxX, this.x));
      }
    }

    // Fall off level cleanup
    if (level && this.y > level.height + 60) {
      this.isDead = true;
      return;
    }

    // 4. Attack Sequences & Cooldowns
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.jumpCooldown > 0) this.jumpCooldown -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.alertPulse > 0) this.alertPulse -= dt * 1.5;

    // A. Melee Attack State
    if (this.state === 'attack') {
      this.attackTimer -= dt;
      this.animFrame = Math.min(17, Math.floor((0.9 - this.attackTimer) / 0.05));
      if (this.animFrame >= 7 && this.animFrame <= 9 && !this.attackHasHit) {
        this.attackHasHit = true;
        if (Math.abs(player.x - this.x) < 38 && Math.abs(player.y - this.y) < 28) {
          player.takeDamage(this.isElite ? 30 : 22, soundEng, particleSys);
        }
      }
      if (this.attackTimer <= 0) {
        this.state = 'chase';
        this.attackCooldown = 1.0 + Math.random() * 0.6;
        this.animTimer = 0;
      }
      return;
    }

    // B. Ranged Shoot State (Mage Skeletons)
    if (this.state === 'shoot') {
      this.shootTimer -= dt;
      this.currentVx *= 0.8;
      this.x += this.currentVx;
      if (this.shootTimer <= 0) {
        this.state = 'chase';
        this.shootCooldown = 2.2 + Math.random() * 1.0;
        if (window.game) {
          const projX = this.x + (this.dir > 0 ? this.w + 2 : -18);
          const projY = this.y + 6;
          const pAngle = Math.atan2((player.y + player.h / 2) - projY, (player.x + player.w / 2) - projX);
          const spd = 3.8;
          let pType = 'skull';
          if (this.skin === 'ice' || this.skin === 'frost') pType = 'frost';
          else if (this.skin === 'mud' || this.skin === 'toxic') pType = 'toxic';
          else if (this.skin === 'ashen' || this.skin === 'spectral' || this.skin === 'obsidian' || this.skin === 'shadow') pType = 'necrotic';

          window.game.spawnEnemyProjectile(new EnemyProjectile({
            x: projX,
            y: projY,
            vx: Math.cos(pAngle) * spd,
            vy: Math.sin(pAngle) * spd,
            type: pType,
            damage: 20
          }));
        }
      }
      return;
    }

    // 5. Vision & Perception Check (Global aggressive hunting)
    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const dy = (player.y + player.h / 2) - (this.y + this.h / 2);
    const distToPlayer = Math.hypot(dx, dy);

    // Omnipresent hunting senses: Skeletons smell mortal blood and hear footfalls
    const canSee = (Math.abs(dx) < 750 && Math.abs(dy) < 450) || (distToPlayer < 700);

    if (canSee && (this.state === 'walk' || this.state === 'pause_turn')) {
      if (!this.hasAlerted) {
        this.state = 'alert';
        this.alertTimer = 0.2;
        this.hasAlerted = true;
        this.alertPulse = 1.0;
        this.dir = dx < 0 ? -1 : 1;
        this.currentVx = 0;
        if (soundEng && soundEng.playAlert) soundEng.playAlert();
        if (particleSys) particleSys.spawnSlashSparks(this.x + this.w / 2, this.y - 4, this.dir);
        return;
      } else {
        this.state = 'chase';
      }
    }

    // 6. Alert Telegraph State
    if (this.state === 'alert') {
      this.alertTimer -= dt;
      this.currentVx *= 0.8;
      this.x += this.currentVx;
      this.dir = dx < 0 ? -1 : 1;
      this.renderFacing = this.dir;
      if (this.alertTimer <= 0) {
        this.state = 'chase';
        this.animTimer = 0;
      }
      return;
    }

    // 7. Ledge & Boundary Bounds
    let effectiveMinX = this.minX !== undefined ? this.minX : (this.x - 40);
    let effectiveMaxX = this.maxX !== undefined ? this.maxX : (this.x + 40);
    if (this.onPlatform) {
      effectiveMinX = Math.max(this.minX !== undefined ? this.minX : this.onPlatform.x + 6, this.onPlatform.x + 6);
      effectiveMaxX = Math.min(this.maxX !== undefined ? this.maxX : (this.onPlatform.x + this.onPlatform.w - this.w - 6), this.onPlatform.x + this.onPlatform.w - this.w - 6);
    }

    const atRightEdge = this.dir > 0 && this.x >= (effectiveMaxX - 3);
    const atLeftEdge = this.dir < 0 && this.x <= (effectiveMinX + 3);

    // 8. Chase / Pursuit State
    if (this.state === 'chase') {
      this.dir = dx < 0 ? -1 : 1;

      // Close combat trigger
      if (Math.abs(dx) < 34 && Math.abs(dy) < 26 && this.attackCooldown <= 0 && this.isGrounded) {
        this.state = 'attack';
        this.attackTimer = 0.9;
        this.attackHasHit = false;
        this.animFrame = 0;
        this.currentVx = 0;
        return;
      }

      // Ranged mage spell trigger
      if (this.isMage && Math.abs(dx) > 70 && Math.abs(dx) < 260 && Math.abs(dy) < 120 && this.shootCooldown <= 0 && this.isGrounded) {
        this.state = 'shoot';
        this.shootTimer = 0.42;
        this.currentVx = 0;
        if (soundEng && soundEng.playFireCast) soundEng.playFireCast();
        return;
      }

      // Ledge boundary handling: Stay firmly anchored on platform during combat
      if (atRightEdge || atLeftEdge) {
        if (atRightEdge) this.x = effectiveMaxX;
        if (atLeftEdge) this.x = effectiveMinX;
        this.currentVx = 0;
      } else {
        const targetVx = this.dir * this.chaseSpeed;
        this.currentVx += (targetVx - this.currentVx) * Math.min(1.0, dt * 8.0);
        this.x += this.currentVx;
      }

      // Shambling run sway
      this.wobbleTimer += dt * 7.5;
      this.wobbleAngle = Math.sin(this.wobbleTimer) * 0.08;
      this.stepBob = Math.abs(Math.sin(this.wobbleTimer)) * 2.2;

      // Accelerated chase animation
      this.animTimer += dt;
      this.animFrame = Math.floor(this.animTimer / 0.055) % 13;

      // Lost sight timeout (only if player is far away across the tower)
      if (distToPlayer > 1100) {
        this.lostSightTimer += dt;
        if (this.lostSightTimer > 4.5) {
          this.state = 'walk';
          this.hasAlerted = false;
          this.lostSightTimer = 0;
        }
      } else {
        this.lostSightTimer = 0;
      }
    }
    // 9. Calm Patrol State
    else if (this.state === 'walk') {
      if (atRightEdge || atLeftEdge) {
        this.state = 'pause_turn';
        this.pauseTimer = 0.55 + Math.random() * 0.35;
        this.animTimer = 0;
        if (atRightEdge) this.x = effectiveMaxX;
        if (atLeftEdge) this.x = effectiveMinX;
      } else {
        const targetVx = this.dir * this.patrolSpeed;
        this.currentVx += (targetVx - this.currentVx) * Math.min(1.0, dt * 5.0);
        this.x += this.currentVx;

        if (this.x > effectiveMaxX) { this.x = effectiveMaxX; this.dir = -1; }
        if (this.x < effectiveMinX) { this.x = effectiveMinX; this.dir = 1; }

        this.wobbleTimer += dt * 4.2;
        this.wobbleAngle = Math.sin(this.wobbleTimer) * 0.055;
        this.stepBob = Math.abs(Math.sin(this.wobbleTimer)) * 1.5;

        this.animTimer += dt;
        this.animFrame = Math.floor(this.animTimer / 0.08) % 13;
      }
    } else if (this.state === 'pause_turn') {
      this.currentVx += (0 - this.currentVx) * Math.min(1.0, dt * 7.0);
      this.x += this.currentVx;
      this.wobbleAngle += (0 - this.wobbleAngle) * Math.min(1.0, dt * 6.0);
      this.stepBob += (0 - this.stepBob) * Math.min(1.0, dt * 6.0);

      this.animTimer += dt;
      this.animFrame = Math.floor(this.animTimer / 0.11) % 11;

      this.pauseTimer -= dt;
      if (this.pauseTimer <= 0) {
        this.dir = -this.dir;
        this.state = 'walk';
        this.animTimer = 0;
      }
    }

    // Immediate render facing
    this.renderFacing = this.dir;

    // Touch damage
    if (Math.abs(player.x - this.x) < Math.max(22, this.w * 0.8) && Math.abs(player.y - this.y) < Math.max(28, this.h * 0.8)) {
      player.takeDamage(this.touchDamage || 18, soundEng, particleSys);
    }
  }

  draw(ctx, camX, camY) {
    if (this.isDead) return;
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    const skinData = this.getSkinData();

    ctx.save();
    ctx.translate(rx + this.w / 2, ry + this.h - this.stepBob);
    ctx.scale(this.dir * this.scaleMultiplier, this.scaleMultiplier);
    ctx.rotate(this.wobbleAngle);
    ctx.translate(-13, -34); // Center at standard frame reference base

    // Elite Ground Ring Aura
    if (this.isElite) {
      ctx.save();
      ctx.fillStyle = skinData.auraColor;
      ctx.beginPath();
      ctx.ellipse(13, 34, 18, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const sm = window.spriteManager;
    let sheet = null;
    let totalFrames = 13;

    if (sm) {
      const getSheet = (action) => sm.getTintedSkeletonSheet ? sm.getTintedSkeletonSheet(action, this.skin) : (sm.skeletonSprites ? sm.skeletonSprites[action] : null);
      if (this.state === 'attack') {
        sheet = getSheet('Attack');
        totalFrames = 18;
      } else if (this.state === 'dead') {
        sheet = getSheet('Dead');
        totalFrames = 15;
      } else if (this.state === 'hit') {
        sheet = getSheet('Hit');
        totalFrames = 8;
      } else if (this.state === 'pause_turn' || this.state === 'alert' || this.state === 'shoot') {
        sheet = getSheet('Idle');
        totalFrames = 11;
      } else {
        sheet = getSheet('Walk');
        totalFrames = 13;
      }
    }

    if (sheet && sheet.complete && sheet.naturalWidth > 0) {
      const frameW = Math.floor(sheet.width / totalFrames);
      const frameH = sheet.height;
      const f = Math.min(totalFrames - 1, Math.max(0, this.animFrame));
      const drawX = -Math.floor((frameW - 26) / 2);
      const drawY = -Math.floor(frameH - 34);
      ctx.drawImage(sheet, f * frameW, 0, frameW, frameH, drawX, drawY, frameW, frameH);
    } else if (sm && sm.sprites && sm.sprites.skeleton) {
      let frames = sm.sprites.skeleton.walk;
      if (this.state === 'hit' || this.state === 'dead') frames = sm.sprites.skeleton.hit;
      else if (this.state === 'pause_turn' || this.state === 'alert') frames = sm.sprites.skeleton.idle;
      const fc = frames[this.animFrame % frames.length] || frames[0];
      if (fc) {
        ctx.drawImage(fc, -11, -12);
      }
    }

    // Glowing Eyes matching Zone Skin
    ctx.save();
    ctx.fillStyle = skinData.eyeColor;
    ctx.shadowColor = skinData.eyeGlow;
    ctx.shadowBlur = this.isElite ? 8 : 4;
    ctx.fillRect(15, 8, 2, 2);
    ctx.fillRect(19, 8, 2, 2);
    ctx.shadowBlur = 0;
    ctx.restore();

    // ─── VISUAL EQUIPMENT & WEAPON OVERLAYS (VARIANTS 0-3, MAGE & ELITE) ───
    if (this.state !== 'dead') {
      ctx.save();

      if (this.isMage) {
        // ── MAGE SKELETON: SORCERER HOOD, SHAWL & BONE STAFF ──
        ctx.fillStyle = '#2e1065';
        ctx.fillRect(12, 0, 11, 7); // Hood dome
        ctx.fillStyle = '#7e22ce';
        ctx.fillRect(11, 6, 3, 6);  // Draped cowl sides
        ctx.fillRect(21, 6, 3, 6);
        ctx.fillStyle = '#a855f7';  // Diadem rune stone
        ctx.fillRect(16, 2, 3, 3);
        ctx.fillStyle = '#f3e8ff';
        ctx.fillRect(17, 3, 1, 1);

        // Arcane Shawl
        ctx.fillStyle = '#3b0764';
        ctx.fillRect(12, 14, 10, 6);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(14, 16, 6, 2);

        // Twisted Bone Staff with Arcane Skull Orb
        ctx.fillStyle = '#78716c';
        ctx.fillRect(24, 5, 2, 23); // Staff shaft
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(23, 3, 4, 3);  // Staff bone claw
        ctx.fillStyle = '#a855f7';  // Glowing magic orb
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 8;
        ctx.fillRect(24, 1, 3, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(25, 2, 1, 1);
        ctx.shadowBlur = 0;

        // Floating Arcane Rune Circle
        ctx.fillStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.beginPath();
        ctx.arc(17, 7, 12, 0, Math.PI * 2);
        ctx.fill();

      } else if (this.isElite) {
        // ── ELITE CHAMPION: GIANT DEMON HORNED CROWN, GOTHIC CUIRASS & GREATSWORD ──
        // Horned crown
        ctx.fillStyle = '#ffd700';
        ctx.shadowColor = '#ffb703';
        ctx.shadowBlur = 6;
        ctx.fillRect(10, 2, 14, 3);
        ctx.fillRect(9, -4, 3, 6);
        ctx.fillRect(16, -6, 2, 8);
        ctx.fillRect(22, -4, 3, 6);
        ctx.fillStyle = '#ff0054';
        ctx.fillRect(16, -1, 2, 2);
        ctx.shadowBlur = 0;

        // Obsidian Gothic Pauldrons
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(7, 12, 6, 7);
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(7, 11, 6, 2);

        // Gothic Cuirass
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(13, 15, 9, 8);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(16, 17, 3, 4);

        // Colossal Obsidian Greatsword
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(24, 20, 3, 6); // Hilt
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(22, 18, 7, 3); // Crossguard
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(26, 4, 4, 15); // Broad Greatsword Blade
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(29, 4, 1, 15); // Gleam
        ctx.fillStyle = '#f43f5e';  // Runes
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 5;
        ctx.fillRect(27, 7, 2, 9);
        ctx.shadowBlur = 0;

      } else if (this.variant === 1) {
        // ── VARIANT 1: ARMORED BRUTE (SPIKED BARBUTE HELM, PAULDRON & CLEAVER) ──
        ctx.fillStyle = '#334155';
        ctx.fillRect(13, 0, 9, 6);  // Helm dome
        ctx.fillRect(13, 5, 2, 6);  // Cheek guard
        ctx.fillRect(20, 5, 2, 6);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(14, 1, 7, 2);
        ctx.fillStyle = '#94a3b8';  // Top spike
        ctx.fillRect(17, -3, 2, 4);

        // Iron Pauldron
        ctx.fillStyle = '#475569';
        ctx.fillRect(10, 13, 4, 5);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(9, 14, 2, 3);

        // Segmented Chestplate
        ctx.fillStyle = '#334155';
        ctx.fillRect(14, 16, 7, 4);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(15, 17, 5, 1);

        // Executioner Cleaver
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(20, 20, 4, 2); // Shaft
        ctx.fillStyle = '#475569';
        ctx.fillRect(24, 14, 7, 9); // Cleaver head
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(30, 14, 1, 9); // Sharp bevel
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(26, 20, 3, 2); // Bloodstain

      } else if (this.variant === 2) {
        // ── VARIANT 2: BARBARIAN BERSERKER (DUAL HORNS, SASH & SCIMITAR) ──
        ctx.fillStyle = '#b45309';
        ctx.fillRect(13, 4, 9, 2); // Bronze brow band
        ctx.fillStyle = '#d97706';
        ctx.fillRect(16, 3, 3, 2);
        // Dual curved beast horns
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(11, 0, 2, 4);
        ctx.fillRect(9, -2, 2, 3);
        ctx.fillRect(21, 0, 2, 4);
        ctx.fillRect(23, -2, 2, 3);

        // Tattered Crimson Sash
        ctx.fillStyle = '#881337';
        ctx.fillRect(14, 24, 7, 6);
        ctx.fillStyle = '#be123c';
        ctx.fillRect(15, 25, 4, 4);

        // Curved Falchion / Scimitar
        ctx.fillStyle = '#b45309';
        ctx.fillRect(21, 20, 2, 3); // Bronze hilt
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(23, 19, 5, 2);
        ctx.fillRect(27, 17, 4, 3);
        ctx.fillRect(30, 15, 3, 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(32, 14, 1, 2);

      } else if (this.variant === 3) {
        // ── VARIANT 3: SHADOW CULTIST (DARK COWL, RAGGED CAPE & DUAL DAGGERS) ──
        ctx.fillStyle = '#09090b';
        ctx.fillRect(12, 1, 11, 7); // Dark cowl
        ctx.fillRect(11, 7, 3, 6);  // Draped neck
        ctx.fillRect(20, 7, 3, 6);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(13, 2, 9, 3);

        // Ragged Shadow Capelet
        ctx.fillStyle = '#09090b';
        ctx.fillRect(6, 13, 6, 13);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(7, 15, 4, 9);

        // Dual Spectral Daggers
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(22, 17, 7, 2);
        ctx.fillRect(9, 21, 5, 2);
        ctx.fillStyle = '#c7d2fe';
        ctx.fillRect(23, 17, 5, 1);
        ctx.fillRect(9, 21, 3, 1);

      } else {
        // ── VARIANT 0: RUSTED GRUNT (CRACKED SKULL RIVETS, LEATHER STRAP & BROADSWORD) ──
        ctx.fillStyle = '#57534e';
        ctx.fillRect(14, 2, 7, 2);  // Rusty skull plate
        ctx.fillStyle = '#b45309';
        ctx.fillRect(17, 1, 3, 2);
        ctx.fillStyle = '#292524';
        ctx.fillRect(15, 3, 1, 1);

        // Cross-chest Leather Strap
        ctx.fillStyle = '#451a03';
        ctx.fillRect(14, 16, 3, 8);
        ctx.fillStyle = '#78716c';
        ctx.fillRect(15, 19, 2, 2); // Buckle

        // Rusted Notched Broadsword
        ctx.fillStyle = '#78716c';
        ctx.fillRect(21, 19, 2, 6); // Crossguard
        ctx.fillStyle = '#d6d3d1';
        ctx.fillRect(23, 17, 10, 2); // Blade
        ctx.fillStyle = '#b45309';
        ctx.fillRect(27, 17, 2, 1);  // Rust notch
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(32, 17, 1, 2);  // Tip
      }

      ctx.restore();
    }

    ctx.restore();

    // ─── FLOATING ELITE HEALTH BAR ───
    if (this.isElite && this.hp > 0) {
      ctx.save();
      const hpPct = Math.max(0, this.hp / this.maxHp);
      const barW = Math.round(34 * this.scaleMultiplier);
      const barH = 4;
      const barX = rx + (this.w - barW) / 2;
      const barY = ry - 14;

      // Dark background
      ctx.fillStyle = 'rgba(10, 4, 14, 0.85)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      // Golden border
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX - 1, barY - 1, barW + 2, barH + 2);
      // Health fill
      ctx.fillStyle = hpPct > 0.35 ? '#d90429' : '#ff0054';
      ctx.fillRect(barX, barY, Math.round(barW * hpPct), barH);
      ctx.restore();
    }

    // ─── FLOATING ALERT "!" FEEDBACK ───
    if (this.state === 'alert' || (this.state === 'chase' && this.alertPulse > 0)) {
      ctx.save();
      const exX = rx + this.w / 2;
      const exY = ry - (this.isElite ? 22 : 14) - Math.sin(Date.now() * 0.015) * 2;
      // Glowing halo
      ctx.fillStyle = 'rgba(255, 34, 0, 0.55)';
      ctx.beginPath();
      ctx.arc(exX, exY + 4, 10, 0, Math.PI * 2);
      ctx.fill();
      // Exclamation Mark
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(exX - 1.5, exY - 2, 3, 7);
      ctx.fillRect(exX - 1.5, exY + 7, 3, 3);
      ctx.fillStyle = '#ff1e38';
      ctx.fillRect(exX - 1, exY - 1, 2, 5);
      ctx.fillRect(exX - 1, exY + 7.5, 2, 2);
      ctx.restore();
    }
  }

  takeDamage(amount, sourceX, soundEng, particleSys) {
    if (this.isDead || this.hp <= 0) return;
    this.hp -= amount;
    const hitDir = sourceX !== undefined ? (this.x > sourceX ? 1 : -1) : (this.dir ? -this.dir : 1);

    // Megabonk & Kinetic Knockback Physics
    const pwm = window.game ? window.game.passiveWeaponsManager : null;
    const knockbackMult = pwm && pwm.getTomeKnockbackMultiplier ? pwm.getTomeKnockbackMultiplier() : 1.0;
    const critBonus = pwm && pwm.getTomeCritBonus ? pwm.getTomeCritBonus() : 0;
    const isMegabonk = amount >= 32 || (Math.random() < (0.16 + critBonus));

    const baseForce = this.isElite ? 4.8 : 6.8;
    const finalForce = baseForce * knockbackMult * (isMegabonk ? 1.75 : 1.0);
    this.currentVx = hitDir * finalForce;
    if (this.onPlatform) {
      this.vy = 0;
      this.isGrounded = true;
      this.y = this.onPlatform.y - this.h;
      const minX = this.onPlatform.x + 4;
      const maxX = this.onPlatform.x + this.onPlatform.w - this.w - 4;
      if (minX <= maxX) {
        this.x = Math.max(minX, Math.min(maxX, this.x + hitDir * 4));
      } else {
        this.x += hitDir * 4;
      }
    } else {
      this.vy = isMegabonk ? -5.2 : -3.2;
      this.isGrounded = false;
      this.x += hitDir * 4;
    }

    // Megabonk Combo & Comic-book Floating Text
    if (window.progression) {
      window.progression.addBonkHit(isMegabonk);

      // Comic-book Floating Text
      if (particleSys && particleSys.spawnFloatingText) {
        if (isMegabonk) {
          particleSys.spawnFloatingText(`💥 ¡IMPACTO TITÁNICO! -${amount}`, this.x + this.w / 2, this.y - 12, { isMegabonk: true });
          particleSys.triggerScreenShake(0.16, 5);
          if (window.game) {
            if (window.game.triggerHitStop) window.game.triggerHitStop(0.055);
            if (window.game.triggerScreenShake) window.game.triggerScreenShake(6, 0.22);
          }
          if (window.progression && window.progression.unlockAchievement) {
            window.progression.unlockAchievement('megabonk');
          }
        } else {
          particleSys.spawnFloatingText(`-${amount}`, this.x + this.w / 2, this.y - 4);
        }
      }
    }

    if (particleSys) particleSys.spawnSlashSparks(this.x + this.w / 2, this.y + this.h / 2, hitDir);
    if (soundEng && soundEng.playHit) soundEng.playHit();
    if (isMegabonk && soundEng && soundEng.playMeteorExplosion) soundEng.playMeteorExplosion();

    if (window.progression && window.progression.hasBoon('vampirism') && window.game && window.game.player) {
      window.game.player.hp = Math.min(window.game.player.maxHp, window.game.player.hp + 5);
    }

    if (this.hp <= 0 && !this.hasDropped) {
      this.hasDropped = true;
      this.state = 'dead';
      this.deathTimer = 0.9;
      this.animFrame = 0;
      if (window.progression) {
        if (window.progression.unlockAchievement) window.progression.unlockAchievement('first_blood');
        if (window.progression.recordEnemyKill) window.progression.recordEnemyKill(this.isElite ? 'elite' : 'skeleton');
      }
      if (window.game && window.game.triggerHitStop) {
        window.game.triggerHitStop(0.04);
      }
      if (particleSys) particleSys.spawnBloodExplosion(this.x + this.w / 2, this.y + this.h / 2, this.isElite ? 45 : 25);
      if (window.game) {
        // Balanced Soul Orbs: 4 souls for normal, 14 souls for elite
        const orbCount = 2;
        const totalSouls = this.isElite ? 14 : 4;
        if (window.game.spawnSoulOrbs) {
          window.game.spawnSoulOrbs(this.x + this.w / 2, this.y + this.h / 2, orbCount, totalSouls);
        }

        // Balatro Scoring Engine triggered ONLY on enemy death (capped bonus tribute)
        if (window.progression) {
          const isPlayerInAir = (window.game && window.game.player) ? !window.game.player.isGrounded : false;
          window.progression.calculateBalatroScore(this.isElite ? 6 : 2, { isMegabonk, inAir: isPlayerInAir });
        }

        // Vampire Survivors In-Run XP Gems
        if (window.game.spawnXpGems) {
          const xpVal = this.isElite ? 30 : 15;
          window.game.spawnXpGems(this.x + this.w / 2, this.y + this.h / 2, this.isElite ? 2 : 1, xpVal);
        }

        if (window.game.spawnHealthOrb && Math.random() < (this.isElite ? 0.40 : 0.15)) {
          window.game.spawnHealthOrb(this.x + this.w / 2, this.y + this.h / 2, this.isElite ? 25 : 15);
        }
        // BoonChest drop from Giant / Elite enemies (35% drop chance to reward player for defeating health-bar elites)
        if (this.isElite && window.game.spawnBoonChest && Math.random() < 0.35) {
          window.game.spawnBoonChest(this.x + this.w / 2 - 17, this.y + this.h - 26);
        }
      }
    } else if (this.hp > 0) {
      this.state = 'hit';
      this.hitTimer = 0.35;
      this.animFrame = 0;
      this.hasAlerted = true;
    }
  }
}

// ─── GUARDIAN BOSSES (MINOS, FLEGIAS, AZGALOR, MALACODA, GLACIOR) ───
class Boss {
  constructor(data) {
    this.type = data.type; // 'minos', 'flegias', 'azgalor', 'malacoda', 'glacior'
    this.name = data.name;
    this.x = data.x;
    this.y = data.y;
    this.w = data.w || (data.type === 'flegias' ? 68 : (data.type === 'minos' ? 64 : (data.type === 'malacoda' ? 60 : 56)));
    this.h = data.h || (data.type === 'minos' ? 76 : (data.type === 'malacoda' ? 74 : 68));
    this.maxHp = data.maxHp || 550;
    this.hp = data.hp || this.maxHp;
    this.dialogueKey = data.dialogueKey;
    this.nextLevel = data.nextLevel;
    this.invulnerableTimer = 0;
    this.armor = data.armor !== undefined ? data.armor : 0.20;
    this.touchDamage = data.touchDamage || 50;

    // Movement & Physics
    this.dir = -1;
    this.renderFacing = -1.0;
    this.vx = 0;
    this.vy = 0;
    this.groundY = data.y || 374;
    this.baseWalkSpeed = data.type === 'malacoda' ? 2.3 : (data.type === 'azgalor' ? 2.1 : (data.type === 'flegias' ? 1.9 : 1.8));
    this.maxWalkSpeed = this.baseWalkSpeed;
    this.turnCooldown = 0;
    this.turnCooldownMax = 0.45;

    // Multi-Phase & Signature Ultimate
    this.phase = 1;
    this.isEnraged = false;
    this.ultimateCooldown = 10.0;
    this.ultimateTimer = 4.0; // First ultimate triggered ~6s into the fight
    this.ultimateName = data.type === 'minos' ? 'El Juicio del Abismo' :
      (data.type === 'flegias' ? 'Maremoto del Estigia' :
      (data.type === 'azgalor' ? 'Tormenta de Flegetonte' :
      (data.type === 'malacoda' ? 'Cacería de los Malebranche' : 'Cero Absoluto')));

    // Combat State Machine: 'idle', 'walk', 'windup', 'attack', 'ultimate_windup', 'ultimate_cast', 'recovery', 'dead'
    this.state = 'idle';
    this.stateTimer = 0;
    this.animTimer = 0;
    this.animFrame = 0;
    this.attackTimer = 0;
    this.baseAttackCooldown = data.type === 'malacoda' ? 1.5 : 1.75;
    this.attackCooldown = this.baseAttackCooldown;
    this.attackType = 'melee';
    this.attackHitPlayer = false;

    // Organic Transforms
    this.scaleX = 1.0;
    this.scaleY = 1.0;
    this.breathTimer = Math.random() * 5.0;
    this.footstepTimer = 0;

    this.isDead = false;
    this.hasDropped = false;
    this.hasVictoryTriggered = false;
  }

  triggerEnrage(soundEng, particleSys) {
    if (this.isEnraged) return;
    this.isEnraged = true;
    this.phase = 2;
    this.maxWalkSpeed = this.baseWalkSpeed * 1.38;
    this.attackCooldown = this.baseAttackCooldown * 0.62;
    this.ultimateTimer = this.ultimateCooldown; // Immediately cast ultimate!

    if (particleSys) {
      particleSys.triggerScreenShake(0.85, 18);
      particleSys.spawnBloodExplosion(this.x + this.w / 2, this.y + this.h / 2, 75);
      for (let i = 0; i < 20; i++) {
        particleSys.spawnSlashSparks(this.x + this.w / 2, this.y + this.h / 2, (Math.random() - 0.5) * 2);
      }
    }
    if (soundEng && soundEng.playMeteorExplosion) soundEng.playMeteorExplosion();
  }

  chooseAttackPattern(dist, dy) {
    if (this.type === 'minos') {
      if (dist > 220) {
        this.attackType = Math.random() < 0.6 ? 'tornado' : 'leap_slam';
      } else if (dist < 155 && Math.random() < 0.6) {
        this.attackType = 'tail_sweep';
      } else {
        this.attackType = Math.random() < 0.5 ? 'leap_slam' : 'tail_sweep';
      }
    } else if (this.type === 'flegias') {
      if (dist > 200) {
        this.attackType = Math.random() < 0.55 ? 'mud_charge' : 'mud_bomb';
      } else if (Math.random() < 0.5) {
        this.attackType = 'oar_crush';
      } else {
        this.attackType = 'mud_charge';
      }
    } else if (this.type === 'azgalor') {
      if (dist > 220) {
        const r = Math.random();
        this.attackType = r < 0.45 ? 'flame_dash' : (r < 0.75 ? 'hellfire_cleave' : 'lava_burst');
      } else if (Math.random() < 0.5) {
        this.attackType = 'flame_dash';
      } else {
        this.attackType = 'hellfire_cleave';
      }
    } else if (this.type === 'malacoda') {
      if (dist > 220) {
        this.attackType = Math.random() < 0.5 ? 'spear_fan' : 'trident_dive';
      } else if (Math.random() < 0.55) {
        this.attackType = 'trident_dive';
      } else {
        this.attackType = 'malebranche_dash';
      }
    } else {
      // Glacior
      if (dist > 200) {
        this.attackType = Math.random() < 0.5 ? 'frost_fan' : 'glacial_slam';
      } else if (Math.random() < 0.5) {
        this.attackType = 'frost_nova';
      } else {
        this.attackType = 'glacial_slam';
      }
    }
  }

  executeAttack(player, soundEng, particleSys, dist) {
    const dy = (player.y + player.h / 2) - (this.y + this.h / 2);
    if (this.type === 'minos') {
      if (this.attackType === 'tail_sweep') {
        if (particleSys) particleSys.triggerScreenShake(0.35, 8);
        if (soundEng && soundEng.playSwordSlash) soundEng.playSwordSlash();
        // Tail sweep hits wide low and mid area
        if (dist < 210 && Math.abs(dy) < 65) {
          player.takeDamage(56, soundEng, particleSys);
        }
      } else if (this.attackType === 'leap_slam') {
        this.vy = -11.2;
        this.vx = this.dir * Math.max(3.8, Math.min(7.5, dist / 22));
        if (soundEng && soundEng.playSwordSlash) soundEng.playSwordSlash();
      } else {
        // Dark Tornado projectile
        if (soundEng && soundEng.playMeteorExplosion) soundEng.playMeteorExplosion();
        if (window.game) {
          window.game.spawnBossProjectile(new BossProjectile({
            x: this.x + (this.dir > 0 ? this.w : -24),
            y: this.y + 20,
            vx: this.dir * (this.isEnraged ? 5.8 : 4.8),
            vy: 0,
            type: 'tornado',
            damage: 46
          }));
        }
      }
    } else if (this.type === 'flegias') {
      if (this.attackType === 'mud_charge') {
        this.vx = this.dir * (this.isEnraged ? 8.2 : 6.8);
        if (particleSys) particleSys.triggerScreenShake(0.38, 9);
        if (dist < 110) player.takeDamage(58, soundEng, particleSys);
      } else if (this.attackType === 'mud_bomb') {
        const bombCount = this.isEnraged ? 3 : 2;
        for (let b = 0; b < bombCount; b++) {
          if (window.game) {
            window.game.spawnBossProjectile(new BossProjectile({
              x: this.x + (this.dir > 0 ? this.w : -20),
              y: this.y + 10,
              vx: this.dir * (3.5 + b * 1.2),
              vy: -(5.8 + b * 1.2),
              type: 'mud_bomb',
              damage: 48
            }));
          }
        }
      } else {
        // Oar ground crush
        if (particleSys) particleSys.triggerScreenShake(0.42, 10);
        if (soundEng && soundEng.playHit) soundEng.playHit();
        if (dist < 155 && Math.abs(dy) < 65) player.takeDamage(62, soundEng, particleSys);
      }
    } else if (this.type === 'azgalor') {
      if (this.attackType === 'flame_dash') {
        this.vx = this.dir * (this.isEnraged ? 8.8 : 7.2);
        if (particleSys) particleSys.triggerScreenShake(0.4, 10);
        if (dist < 110) player.takeDamage(60, soundEng, particleSys);
      } else if (this.attackType === 'hellfire_cleave') {
        if (particleSys) particleSys.triggerScreenShake(0.4, 10);
        if (soundEng && soundEng.playMeteorExplosion) soundEng.playMeteorExplosion();
        if (dist < 155 && Math.abs(dy) < 65) player.takeDamage(62, soundEng, particleSys);
        if (window.game) {
          [-1.0, 0, 1.0].forEach(vyOffset => {
            window.game.spawnBossProjectile(new BossProjectile({
              x: this.x + (this.dir > 0 ? this.w : -20),
              y: this.y + 20,
              vx: this.dir * 5.2,
              vy: vyOffset * 1.6,
              type: 'meteor',
              damage: 48
            }));
          });
        }
      } else {
        // Lava burst near player
        if (particleSys) particleSys.triggerScreenShake(0.45, 12);
        if (soundEng && soundEng.playMeteorExplosion) soundEng.playMeteorExplosion();
        if (window.game) {
          window.game.spawnBossProjectile(new BossProjectile({
            x: player.x,
            y: 40,
            vx: 0,
            vy: 6.8,
            type: 'meteor',
            damage: 55
          }));
        }
      }
    } else if (this.type === 'malacoda') {
      if (this.attackType === 'trident_dive') {
        this.vx = this.dir * (this.isEnraged ? 9.2 : 7.6);
        if (particleSys) particleSys.triggerScreenShake(0.42, 10);
        if (soundEng && soundEng.playSwordSlash) soundEng.playSwordSlash();
        if (dist < 140) player.takeDamage(64, soundEng, particleSys);
      } else if (this.attackType === 'spear_fan') {
        if (soundEng && soundEng.playSwordSlash) soundEng.playSwordSlash();
        if (window.game) {
          const offsets = this.isEnraged ? [-1.8, -0.9, 0, 0.9, 1.8] : [-1.3, 0, 1.3];
          offsets.forEach(vyOffset => {
            window.game.spawnBossProjectile(new BossProjectile({
              x: this.x + (this.dir > 0 ? this.w : -20),
              y: this.y + 20,
              vx: this.dir * 5.6,
              vy: vyOffset * 1.6,
              type: 'sulphur_spear',
              damage: 48
            }));
          });
        }
      } else {
        // Malebranche dash
        this.vx = this.dir * 8.2;
        if (dist < 125) player.takeDamage(60, soundEng, particleSys);
      }
    } else {
      // Glacior
      if (this.attackType === 'frost_fan') {
        if (soundEng && soundEng.playSwordSlash) soundEng.playSwordSlash();
        if (window.game) {
          const shardAngles = [-0.4, -0.2, 0, 0.2, 0.4];
          shardAngles.forEach(ang => {
            window.game.spawnBossProjectile(new BossProjectile({
              x: this.x + (this.dir > 0 ? this.w : -16),
              y: this.y + 24,
              vx: this.dir * Math.cos(ang) * 5.4,
              vy: Math.sin(ang) * 5.4,
              type: 'frost_lance',
              damage: 46
            }));
          });
        }
      } else if (this.attackType === 'glacial_slam') {
        this.vy = -10.8;
        this.vx = this.dir * 4.4;
        if (particleSys) particleSys.triggerScreenShake(0.4, 10);
      } else {
        // Frost Nova
        if (soundEng && soundEng.playSwordSlash) soundEng.playSwordSlash();
        if (dist < 170 && Math.abs(dy) < 70) player.takeDamage(60, soundEng, particleSys);
        if (window.game) {
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            window.game.spawnBossProjectile(new BossProjectile({
              x: this.x + this.w / 2,
              y: this.y + this.h / 2,
              vx: Math.cos(a) * 4.6,
              vy: Math.sin(a) * 4.6,
              type: 'frost_lance',
              damage: 45
            }));
          }
        }
      }
    }
  }

  executeUltimate(player, soundEng, particleSys) {
    if (particleSys) particleSys.triggerScreenShake(0.8, 16);
    if (soundEng && soundEng.playMeteorExplosion) soundEng.playMeteorExplosion();

    if (this.type === 'minos') {
      // "El Juicio del Abismo": 6 pillars of judgment lightning across the arena + twin tornadoes
      const pillars = [120, 300, 480, 660, 840, 1020];
      if (window.game) {
        pillars.forEach(lx => {
          window.game.spawnBossProjectile(new BossProjectile({
            type: 'judgment_lightning',
            x: lx,
            y: 0,
            w: 36,
            h: 460,
            damage: 75
          }));
        });
        // Twin tornadoes going left and right
        [-1, 1].forEach(d => {
          window.game.spawnBossProjectile(new BossProjectile({
            type: 'tornado',
            x: this.x + this.w / 2,
            y: this.y + 20,
            vx: d * 5.6,
            vy: 0,
            damage: 48
          }));
        });
      }
    } else if (this.type === 'flegias') {
      // "Maremoto del Estigia": floor acid wave + 4 falling mud boulders
      if (window.game) {
        window.game.spawnBossProjectile(new BossProjectile({
          type: 'styx_wave',
          x: 80,
          y: 440,
          w: 1040,
          h: 42,
          damage: 36,
          maxLife: 5.0
        }));
        [220, 460, 700, 940].forEach(bx => {
          window.game.spawnBossProjectile(new BossProjectile({
            type: 'mud_bomb',
            x: bx,
            y: 30,
            vx: (Math.random() - 0.5) * 2,
            vy: 5.2,
            damage: 52
          }));
        });
      }
    } else if (this.type === 'azgalor') {
      // "Tormenta de Flegetonte": 7 falling hellfire meteors across arena
      if (window.game) {
        const meteors = [160, 300, 440, 580, 720, 860, 1000];
        meteors.forEach(mx => {
          window.game.spawnBossProjectile(new BossProjectile({
            type: 'meteor',
            x: mx,
            y: 15,
            vx: (player.x - mx) * 0.007,
            vy: 5.8,
            damage: 68
          }));
        });
      }
    } else if (this.type === 'malacoda') {
      // "Cacería de los Malebranche": Supersonic dive across arena + 8-spear radial burst
      this.vx = this.dir * 9.5;
      if (window.game) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          window.game.spawnBossProjectile(new BossProjectile({
            type: 'sulphur_spear',
            x: this.x + this.w / 2,
            y: this.y + this.h / 2,
            vx: Math.cos(a) * 5.8,
            vy: Math.sin(a) * 5.8,
            damage: 52
          }));
        }
      }
    } else {
      // Glacior: "Cero Absoluto": 360-degree spiral of 12 frost lances + 6 falling icicles
      if (window.game) {
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2;
          window.game.spawnBossProjectile(new BossProjectile({
            type: 'frost_lance',
            x: this.x + this.w / 2,
            y: this.y + this.h / 2,
            vx: Math.cos(a) * 5.2,
            vy: Math.sin(a) * 5.2,
            damage: 52
          }));
        }
        [180, 360, 540, 720, 900, 1080].forEach(ix => {
          window.game.spawnBossProjectile(new BossProjectile({
            type: 'icicle',
            x: ix,
            y: 20,
            vx: 0,
            vy: 2.6,
            damage: 62
          }));
        });
      }
    }
  }

  update(dt, player, soundEng, particleSys) {
    if (this.isDead || this.hp <= 0) return;
    if (this.invulnerableTimer > 0) this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);

    // Check Enrage (< 50% HP)
    if (this.hp <= this.maxHp * 0.5 && !this.isEnraged) {
      this.triggerEnrage(soundEng, particleSys);
    }

    // Directional tracking
    this.turnCooldown -= dt;
    if (this.turnCooldown <= 0 && this.state !== 'windup' && this.state !== 'attack' && this.state !== 'ultimate_windup' && this.state !== 'ultimate_cast') {
      const desiredDir = player.x < (this.x + this.w / 2) ? -1 : 1;
      if (desiredDir !== this.dir) {
        this.dir = desiredDir;
        this.turnCooldown = this.turnCooldownMax;
      }
    }
    this.renderFacing = this.dir;

    const dist = Math.abs((player.x + player.w / 2) - (this.x + this.w / 2));
    const dy = (player.y + player.h / 2) - (this.y + this.h / 2);

    // ─── 1. ACTIVE PHYSICAL BODY CONTACT DAMAGE ───
    const pCenterX = player.x + player.w / 2;
    const pCenterY = player.y + player.h / 2;
    const bCenterX = this.x + this.w / 2;
    const bCenterY = this.y + this.h / 2;
    const touchDistX = (this.w * 0.55 + player.w / 2 + 12);
    const touchDistY = (this.h * 0.55 + player.h / 2 + 12);
    const xOverlap = Math.abs(pCenterX - bCenterX) < touchDistX;
    const yOverlap = Math.abs(pCenterY - bCenterY) < touchDistY;
    if (xOverlap && yOverlap && player.hp > 0) {
      player.takeDamage(this.touchDamage || 50, soundEng, particleSys);
    }

    // Airborne physics (for leap slams)
    if (this.y < this.groundY || this.vy < 0) {
      this.vy += 0.42;
      this.y += this.vy;
      this.x += this.vx;
      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.vy = 0;
        this.vx = 0;
        if (particleSys) {
          particleSys.triggerScreenShake(0.5, 12);
          for (let i = 0; i < 16; i++) {
            particleSys.spawnDust(this.x + this.w / 2, this.y + this.h, 2);
          }
        }
        if (dist < 185) {
          player.takeDamage(62, soundEng, particleSys);
        }
      }
    }

    // State machine transitions
    if (this.state === 'idle' || this.state === 'walk') {
      // Ultimate Timer Check
      this.ultimateTimer += dt;
      if (this.ultimateTimer >= this.ultimateCooldown) {
        this.state = 'ultimate_windup';
        this.stateTimer = 1.25; // 1.25s telegraph channel
        this.vx = 0;
        this.scaleY = 1.25;
        this.scaleX = 0.85;
        if (particleSys) particleSys.triggerScreenShake(0.2, 5);
        if (soundEng && soundEng.playSwordSlash) soundEng.playSwordSlash();
      } else {
        // Regular Attack Timer Check - aggressive across whole arena
        this.attackTimer += dt;
        if (this.attackTimer >= this.attackCooldown) {
          this.state = 'windup';
          this.stateTimer = this.isEnraged ? 0.38 : 0.52;
          this.vx = 0;
          this.scaleY = 1.18;
          this.scaleX = 0.88;
          this.chooseAttackPattern(dist, dy);
          if (particleSys) {
            particleSys.spawnSlashSparks(this.x + this.w / 2, this.y + 20, this.dir);
          }
        } else if (dist > 28) {
          this.state = 'walk';
          const targetVx = this.dir * this.maxWalkSpeed;
          this.vx += (targetVx - this.vx) * Math.min(1.0, dt * 4.5);
          this.x += this.vx;

          this.footstepTimer += dt;
          if (this.footstepTimer > 0.45) {
            this.footstepTimer = 0;
            if (particleSys) particleSys.triggerScreenShake(0.08, 2);
          }
        } else {
          this.state = 'idle';
          this.vx += (0 - this.vx) * Math.min(1.0, dt * 6.0);
          this.x += this.vx;
        }
      }
    } else if (this.state === 'windup') {
      this.stateTimer -= dt;
      this.attackHitPlayer = false;
      // Visual telegraph particles
      if (Math.random() < 0.4 && particleSys) {
        if (this.type === 'azgalor') {
          particleSys.spawnLavaBubble(this.x + (this.dir > 0 ? this.w : 0), this.y + this.h);
        } else if (this.type === 'flegias') {
          particleSys.spawnDust(this.x + this.w / 2, this.y + this.h, 2);
        } else {
          particleSys.spawnSlashSparks(this.x + this.w / 2, this.y + 20, this.dir);
        }
      }

      if (this.stateTimer <= 0) {
        this.state = 'attack';
        this.stateTimer = 0.38;
        this.scaleY = 0.82;
        this.scaleX = 1.22;
        this.executeAttack(player, soundEng, particleSys, dist);
      }
    } else if (this.state === 'attack') {
      this.stateTimer -= dt;
      // Active melee hit checking throughout attack duration
      if (!this.attackHitPlayer && player.hp > 0) {
        const isMeleeAttack = (this.attackType === 'tail_sweep' || this.attackType === 'oar_crush' ||
                               this.attackType === 'hellfire_cleave' || this.attackType === 'frost_nova' ||
                               this.attackType === 'glacial_slam');
        if (isMeleeAttack) {
          const reachX = this.attackType === 'tail_sweep' ? 220 : 165;
          if (dist < reachX && Math.abs(dy) < 70) {
            const meleeDmg = this.isEnraged ? 64 : 56;
            player.takeDamage(meleeDmg, soundEng, particleSys);
            this.attackHitPlayer = true;
          }
        }
      }
      // If charge or dash attack, move continuously and damage player every frame!
      const isChargeAttack = (this.attackType === 'mud_charge' || this.attackType === 'flame_dash' ||
                              this.attackType === 'trident_dive' || this.attackType === 'malebranche_dash');
      if (isChargeAttack) {
        this.x += this.vx * dt * 60;
        const arenaMaxX = (window.game && window.game.level ? (window.game.level.width || 1200) : 1200) - 80;
        if (this.x < 60) {
          this.x = 60;
          this.vx = -this.vx;
          this.dir = 1;
        } else if (this.x > arenaMaxX) {
          this.x = arenaMaxX;
          this.vx = -this.vx;
          this.dir = -1;
        }
        // Continuous lethal collision
        if (Math.abs(pCenterX - (this.x + this.w / 2)) < (this.w * 0.5 + player.w / 2) &&
            Math.abs(pCenterY - (this.y + this.h / 2)) < (this.h * 0.5 + player.h / 2) && player.hp > 0) {
          player.takeDamage(this.isEnraged ? 66 : 58, soundEng, particleSys);
        }
        if (particleSys && Math.random() < 0.4) {
          if (this.type === 'azgalor') particleSys.spawnLavaBubble(this.x + this.w / 2, this.y + this.h);
          else if (this.type === 'flegias') particleSys.spawnDust(this.x + this.w / 2, this.y + this.h, 3);
          else particleSys.spawnSlashSparks(this.x + this.w / 2, this.y + this.h / 2, this.dir);
        }
      }
      if (this.stateTimer <= 0) {
        this.state = 'recovery';
        this.stateTimer = this.isEnraged ? 0.28 : 0.42;
        this.vx = 0;
      }
    } else if (this.state === 'ultimate_windup') {
      this.stateTimer -= dt;
      // Swirling ultimate energy particles
      if (particleSys) {
        if (Math.random() < 0.6) {
          particleSys.spawnTeleportSparks(this.x + this.w / 2 + (Math.random() - 0.5) * 40, this.y + this.h / 2);
        }
      }
      if (this.stateTimer <= 0) {
        this.state = 'ultimate_cast';
        this.stateTimer = 0.7;
        this.executeUltimate(player, soundEng, particleSys);
      }
    } else if (this.state === 'ultimate_cast') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'recovery';
        this.stateTimer = 0.8;
        this.ultimateTimer = 0;
      }
    } else if (this.state === 'recovery') {
      this.stateTimer -= dt;
      if (this.stateTimer <= 0) {
        this.state = 'idle';
        this.attackTimer = 0;
      }
    }

    // Elastic scale relaxation
    this.scaleX += (1.0 - this.scaleX) * Math.min(1.0, dt * 7.0);
    this.scaleY += (1.0 - this.scaleY) * Math.min(1.0, dt * 7.0);

    // Player melee dagger hit on boss (1 hit per attack swing, respecting i-frames)
    if (player.isAttacking && (player.attackFrame >= 1 && player.attackFrame <= 3)) {
      const hitX = player.x + (player.facing === 1 ? player.w : -32);
      if (Math.abs(hitX - (this.x + this.w / 2)) < 58 && Math.abs(player.y - this.y) < 58) {
        if (!player.attackHitTargets || (!player.attackHitTargets.has(this) && this.invulnerableTimer <= 0)) {
          if (player.attackHitTargets) player.attackHitTargets.add(this);
          const stats = window.progression ? window.progression.getPlayerStats() : null;
          let dmg = stats ? (stats.daggerDamage || stats.swordDamage || 16) : 16;
          let isCrit = false;
          if (window.progression && window.progression.hasBoon('critStrike') && Math.random() < 0.3) {
            dmg = Math.round(dmg * 2.5);
            isCrit = true;
          }
          if (isCrit && particleSys) particleSys.triggerScreenShake(0.2, 5);
          this.takeDamage(dmg, player.x, soundEng, particleSys);
        }
      }
    }

    this.breathTimer += dt;
    this.animTimer += dt;
    this.animFrame = Math.floor(this.animTimer / 0.12) % 8;
  }

  draw(ctx, camX, camY) {
    if (this.isDead) return;
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 65) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }
    const breathY = Math.sin(this.breathTimer * 2.2) * 1.6;

    // Anchor transform at feet bottom-center
    ctx.translate(rx + this.w / 2, ry + this.h + breathY);
    ctx.scale(-this.dir * this.scaleX, this.scaleY);
    ctx.translate(-this.w / 2, -this.h);

    const bossMap = window.spriteManager.sprites;
    const bossSprites = bossMap ? bossMap[this.type] : null;
    const frame = bossSprites && bossSprites.idle ? (bossSprites.idle[this.animFrame % bossSprites.idle.length] || bossSprites.idle[0]) : null;

    if (frame) {
      if (this.isEnraged) {
        ctx.shadowColor = this.type === 'glacior' ? '#00e5ff' : (this.type === 'flegias' ? '#2ec4b6' : '#ff1a35');
        ctx.shadowBlur = 24 + Math.sin(Date.now() / 120) * 8;
      } else if (this.state === 'windup' || this.state === 'ultimate_windup') {
        ctx.shadowColor = (this.type === 'azgalor' ? '#ff4400' : (this.type === 'minos' ? '#9d4edd' : (this.type === 'flegias' ? '#2ec4b6' : (this.type === 'malacoda' ? '#e63946' : '#00e5ff'))));
        ctx.shadowBlur = 20;
      }
      const dw = frame.width / 2;
      const dh = frame.height / 2;
      ctx.drawImage(frame, -8, -4, dw, dh);
    }

    ctx.restore();

    // ─── OVERHEAD TELEGRAPH BANNER & PHASE 2 BADGE ───
    // Rendered in screen space (not flipped by direction)
    if (this.state === 'ultimate_windup' || this.state === 'ultimate_cast') {
      ctx.save();
      const bannerY = ry - 32;
      const bannerText = `⚠️ ¡ULTIMATE: ${this.ultimateName.toUpperCase()}! ⚠️`;
      ctx.font = 'bold 14px MedievalSharp, sans-serif';
      const tw = ctx.measureText(bannerText).width;
      const bx = rx + this.w / 2 - tw / 2 - 12;

      // Dark pulsing container
      ctx.fillStyle = 'rgba(15, 5, 25, 0.9)';
      ctx.strokeStyle = this.type === 'glacior' ? '#00e5ff' : (this.type === 'flegias' ? '#2ec4b6' : '#ff3300');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(bx, bannerY - 18, tw + 24, 26, 6);
      ctx.fill();
      ctx.stroke();

      // Glowing text
      ctx.fillStyle = '#ffdf00';
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.fillText(bannerText, rx + this.w / 2, bannerY);
      ctx.restore();
    } else if (this.isEnraged) {
      ctx.save();
      const badgeY = ry - 18;
      ctx.font = 'bold 11px MedievalSharp, sans-serif';
      ctx.fillStyle = '#ff3333';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 8;
      ctx.textAlign = 'center';
      ctx.fillText('🔥 FASE 2: ENFURECIDO 🔥', rx + this.w / 2, badgeY);
      ctx.restore();
    }
  }

  takeDamage(amount, sourceX, soundEng, particleSys) {
    if (this.isDead || this.hp <= 0 || this.invulnerableTimer > 0) return;
    const armorMitigation = this.armor !== undefined ? this.armor : 0.15;
    const effectiveDmg = Math.max(4, Math.round(amount * (1 - armorMitigation)));
    this.hp -= effectiveDmg;
    this.invulnerableTimer = 0.22;

    const hitDir = sourceX !== undefined ? (this.x > sourceX ? 1 : -1) : -this.dir;
    if (particleSys) {
      particleSys.spawnSlashSparks(this.x + this.w / 2, this.y + this.h / 2, hitDir);
    }
    if (soundEng && soundEng.playHit) soundEng.playHit();
    if (window.game) {
      if (window.game.triggerHitStop) window.game.triggerHitStop(0.045);
      if (window.game.triggerScreenShake) window.game.triggerScreenShake(5, 0.2);
    }
    if (window.progression && window.progression.hasBoon('vampirism') && window.game && window.game.player) {
      window.game.player.hp = Math.min(window.game.player.maxHp, window.game.player.hp + 5);
    }

    // Check enrage trigger (< 50% HP)
    if (this.hp <= this.maxHp * 0.5 && !this.isEnraged && this.hp > 0) {
      this.triggerEnrage(soundEng, particleSys);
    }

    if (this.hp <= 0) {
      this.hp = 0;
      this.isDead = true;
      this.state = 'dead';
      if (window.progression) {
        if (window.progression.unlockAchievement) window.progression.unlockAchievement('boss_slayer');
        if (window.progression.recordEnemyKill) window.progression.recordEnemyKill('boss');
      }
      if (window.game) {
        if (window.game.triggerBossDefeatCinematic) {
          window.game.triggerBossDefeatCinematic();
        } else if (window.game.triggerBossDefeat) {
          window.game.triggerBossDefeat();
        }
      }
    }
  }
}

// ─── INCREMENTAL & ROGUELITE ENTITIES ───

// 1. COLLECTIBLE SOUL ORB
class SoulOrb {
  constructor(x, y, value = 5, isGolden = false) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4.5;
    this.vy = -(2.8 + Math.random() * 3.5);
    this.value = value;
    this.isGolden = isGolden;
    this.radius = isGolden ? 6 : 4;
    this.life = 0;
    this.maxLife = 24.0;
    this.isCollected = false;
  }

  update(dt, player, soundEng, particleSys) {
    if (this.isCollected) return;
    this.life += dt;
    if (this.life > this.maxLife) {
      this.isCollected = true;
      return;
    }

    // Floating physics
    this.vy += 0.11;
    this.vx *= 0.95;
    this.x += this.vx;
    this.y += this.vy;

    // Magnetic pull to Kael
    const stats = window.progression ? window.progression.getPlayerStats() : { magnetRadius: 70 };
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < stats.magnetRadius) {
      const pull = Math.min(14, 520 / Math.max(20, dist));
      this.vx += (dx / dist) * pull * 0.42;
      this.vy += (dy / dist) * pull * 0.42;
    }

    // Pickup collision
    if (dist < 22) {
      this.isCollected = true;
      if (window.progression) window.progression.addSouls(this.value);
      if (soundEng) soundEng.playSoulPickup();
      if (particleSys) particleSys.spawnSlashSparks(this.x, this.y, 1);
    }
  }

  draw(ctx, camX, camY) {
    if (this.isCollected) return;
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    const pulse = Math.sin(this.life * 9) * 1.5;
    const r = Math.max(2, this.radius + pulse);

    // Outer glow
    ctx.fillStyle = this.isGolden ? 'rgba(255, 215, 0, 0.45)' : 'rgba(0, 240, 255, 0.48)';
    ctx.beginPath();
    ctx.arc(rx, ry, r * 2.3, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = this.isGolden ? '#fff7ba' : '#e0f7fa';
    ctx.beginPath();
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ─── VAMPIRE SURVIVORS IN-RUN XP GEMS ───
class XpGem {
  constructor(x, y, value = 15) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4.0;
    this.vy = -(2.8 + Math.random() * 3.2);
    this.value = value;
    this.life = 0;
    this.maxLife = 35.0;
    this.isCollected = false;
  }

  update(dt, player, soundEng, particleSys) {
    if (this.isCollected) return;
    this.life += dt;
    if (this.life > this.maxLife) {
      this.isCollected = true;
      return;
    }

    // Floating physics
    this.vy += 0.12;
    this.vx *= 0.95;
    this.x += this.vx;
    this.y += this.vy;

    if (!player || player.hp <= 0) return;

    // Magnetic pull to Kael
    const stats = window.progression ? window.progression.getPlayerStats() : { magnetRadius: 70 };
    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < stats.magnetRadius + 45) {
      const pull = Math.min(16, 600 / Math.max(20, dist));
      this.vx += (dx / dist) * pull * 0.45;
      this.vy += (dy / dist) * pull * 0.45;
    }

    // Pickup collision
    if (dist < 28) {
      this.isCollected = true;
      if (window.progression) {
        const levelsGained = window.progression.addRunXp(this.value);
        if (levelsGained > 0 && window.game) {
          if (window.game.queueLevelUps) {
            window.game.queueLevelUps(levelsGained);
          } else if (window.game.openLevelUpModal) {
            window.game.openLevelUpModal();
          }
        }
      }
      if (soundEng && soundEng.playSoulPickup) soundEng.playSoulPickup();
      if (particleSys) particleSys.spawnSlashSparks(this.x, this.y, 1);
    }
  }

  draw(ctx, camX, camY) {
    if (this.isCollected) return;
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    const pulse = Math.sin(this.life * 8) * 1.2;
    const size = 5 + pulse;

    // Outer glow (emerald green)
    ctx.fillStyle = 'rgba(46, 213, 115, 0.45)';
    ctx.beginPath();
    ctx.arc(rx, ry, size * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Diamond faceted gem shape
    ctx.fillStyle = '#2ed573';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rx, ry - size);
    ctx.lineTo(rx + size * 0.85, ry);
    ctx.lineTo(rx, ry + size);
    ctx.lineTo(rx - size * 0.85, ry);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner bright facet
    ctx.fillStyle = '#7bed9f';
    ctx.beginPath();
    ctx.moveTo(rx, ry - size * 0.6);
    ctx.lineTo(rx + size * 0.45, ry);
    ctx.lineTo(rx, ry + size * 0.6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

window.XpGem = XpGem;

// 2. ROGUE-LITE BOON CHEST
class BoonChest {
  constructor(data) {
    this.id = data.id || Math.random().toString();
    this.x = data.x;
    this.y = data.y;
    this.isRelic = !!data.isRelic;
    this.bossName = data.bossName || '';
    this.w = this.isRelic ? 40 : 34;
    this.h = this.isRelic ? 28 : 26;
    this.isOpened = false;
    this.isNear = false;
  }

  update(dt, player, soundEng) {
    if (this.isOpened) {
      this.isNear = false;
      return;
    }
    const dist = Math.hypot(
      (player.x + player.w / 2) - (this.x + this.w / 2),
      (player.y + player.h / 2) - (this.y + this.h / 2)
    );
    this.isNear = dist < (this.isRelic ? 70 : 55);
  }

  open(soundEng) {
    if (this.isOpened) return;
    this.isOpened = true;
    if (soundEng) {
      soundEng.playChestOpen();
      if (this.isRelic && soundEng.playBoonSelect) soundEng.playBoonSelect();
    }
    if (this.isRelic && window.particleSystem) {
      window.particleSystem.spawnLevelUpFireworks(this.x + this.w / 2, this.y + this.h / 2);
    }
  }

  draw(ctx, camX, camY) {
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    if (this.isRelic) {
      // ─── EPIC BOSS RELIC CHEST ───
      // Base
      ctx.fillStyle = '#140508';
      ctx.fillRect(rx, ry + 8, this.w, this.h - 8);
      ctx.fillStyle = '#660708';
      ctx.fillRect(rx + 3, ry + 10, this.w - 6, this.h - 12);

      // Ornate Gold Trim
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(rx + 4, ry + 8, 4, this.h - 8);
      ctx.fillRect(rx + this.w - 8, ry + 8, 4, this.h - 8);
      ctx.fillRect(rx + 4, ry + this.h - 4, this.w - 8, 3);

      if (!this.isOpened) {
        // Closed lid
        ctx.fillStyle = '#3a090d';
        ctx.fillRect(rx, ry, this.w, 11);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(rx + 2, ry + 1, this.w - 4, 3);

        // Ruby Crown Lock
        ctx.fillStyle = '#e63946';
        ctx.fillRect(rx + this.w / 2 - 4, ry + 7, 8, 7);
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(rx + this.w / 2 - 2, ry + 9, 4, 3);

        // Divine Crimson & Gold Relic Aura
        const pulse = Math.sin(Date.now() / 200) * 0.25 + 0.55;
        const grad = ctx.createRadialGradient(rx + this.w / 2, ry + 14, 4, rx + this.w / 2, ry + 14, 34);
        grad.addColorStop(0, `rgba(255, 215, 0, ${pulse})`);
        grad.addColorStop(0.6, `rgba(230, 57, 70, ${pulse * 0.6})`);
        grad.addColorStop(1, 'rgba(230, 57, 70, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(rx + this.w / 2, ry + 14, 34, 0, Math.PI * 2);
        ctx.fill();

        // Floating Title above relic chest
        ctx.font = 'bold 11px Cinzel, serif';
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#e63946';
        ctx.shadowBlur = 6;
        ctx.fillText('👑 Cofre de Reliquia', rx + this.w / 2, ry - 8);
        ctx.shadowBlur = 0;
      } else {
        // Opened lid
        ctx.fillStyle = '#3a090d';
        ctx.fillRect(rx - 3, ry - 7, this.w + 6, 9);
        const grad = ctx.createRadialGradient(rx + this.w / 2, ry + 6, 2, rx + this.w / 2, ry + 6, 50);
        grad.addColorStop(0, 'rgba(255, 215, 0, 0.85)');
        grad.addColorStop(0.5, 'rgba(230, 57, 70, 0.45)');
        grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(rx + this.w / 2, ry + 6, 50, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Standard Boon Chest
      ctx.fillStyle = '#1b1220';
      ctx.fillRect(rx, ry + 8, this.w, this.h - 8);
      ctx.fillStyle = '#4a3728';
      ctx.fillRect(rx + 3, ry + 10, this.w - 6, this.h - 12);

      // Gold trim
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(rx + 5, ry + 8, 3, this.h - 8);
      ctx.fillRect(rx + this.w - 8, ry + 8, 3, this.h - 8);

      if (!this.isOpened) {
        // Closed lid
        ctx.fillStyle = '#2d1f14';
        ctx.fillRect(rx, ry, this.w, 10);
        ctx.fillStyle = '#f4d06f';
        ctx.fillRect(rx + this.w / 2 - 3, ry + 6, 6, 6); // Lock

        // Holy aura
        const pulse = Math.sin(Date.now() / 250) * 0.2 + 0.35;
        ctx.fillStyle = `rgba(244, 208, 111, ${pulse})`;
        ctx.beginPath();
        ctx.arc(rx + this.w / 2, ry + 12, 26, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Opened lid
        ctx.fillStyle = '#2d1f14';
        ctx.fillRect(rx - 2, ry - 6, this.w + 4, 8);
        const grad = ctx.createRadialGradient(rx + this.w / 2, ry + 6, 2, rx + this.w / 2, ry + 6, 40);
        grad.addColorStop(0, 'rgba(255, 235, 130, 0.7)');
        grad.addColorStop(1, 'rgba(255, 235, 130, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(rx + this.w / 2, ry + 6, 40, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

// 3. BREAKABLE URN
class BreakableUrn {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.w = 20;
    this.h = 26;
    this.isBroken = false;
    this.value = data.value || 15;
  }

  checkHit(attackHitbox, soundEng, particleSys) {
    if (this.isBroken) return null;
    if (attackHitbox.x + attackHitbox.w > this.x && attackHitbox.x < this.x + this.w &&
        attackHitbox.y + attackHitbox.h > this.y && attackHitbox.y < this.y + this.h) {
      return this.break(soundEng, particleSys);
    }
    return null;
  }

  break(soundEng, particleSys) {
    if (this.isBroken) return null;
    this.isBroken = true;
    if (soundEng) soundEng.playUrnBreak();
    if (particleSys) particleSys.spawnDust(this.x + this.w / 2, this.y + this.h / 2, 14);

    // Spawn 2 to 4 soul orbs
    const orbs = [];
    const count = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      orbs.push(new SoulOrb(this.x + this.w / 2, this.y + 10, Math.round(this.value / count)));
    }
    return orbs;
  }

  draw(ctx, camX, camY) {
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    if (!this.isBroken) {
      // Vase belly
      ctx.fillStyle = '#9c5a3c';
      ctx.beginPath();
      ctx.ellipse(rx + 10, ry + 16, 9, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      // Neck & rim
      ctx.fillStyle = '#b87352';
      ctx.fillRect(rx + 6, ry + 3, 8, 6);
      ctx.fillRect(rx + 4, ry + 1, 12, 3);
      // Gold rune band
      ctx.fillStyle = '#f4d06f';
      ctx.fillRect(rx + 4, ry + 14, 12, 2);
    } else {
      // Shards on floor
      ctx.fillStyle = '#7a3e28';
      ctx.fillRect(rx + 2, ry + 22, 6, 4);
      ctx.fillRect(rx + 11, ry + 21, 7, 5);
    }
    ctx.restore();
  }
}

// 4. FLAME WAVE PROJECTILE (From Flame Blade Boon)
class FlameWave {
  constructor(x, y, dir, damage = 25) {
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.vx = dir * 7.5;
    this.damage = damage;
    this.w = 26;
    this.h = 24;
    this.life = 0;
    this.maxLife = 0.8;
    this.isDead = false;
  }

  update(dt, enemies, boss, soundEng, particleSys) {
    this.life += dt;
    if (this.life > this.maxLife) {
      this.isDead = true;
      return;
    }
    this.x += this.vx;

    // Check hit against regular enemies
    for (const en of enemies) {
      if (!en.isDead && Math.abs((this.x + 13) - (en.x + en.w / 2)) < 26 && Math.abs((this.y + 12) - (en.y + en.h / 2)) < 28) {
        en.hp -= this.damage;
        if (particleSys) particleSys.spawnSlashSparks(en.x + en.w / 2, en.y + en.h / 2, this.dir);
        if (soundEng) soundEng.playHit();
        if (en.hp <= 0 && !en.hasDropped) {
          en.hasDropped = true;
          en.isDead = true;
          en.state = 'dead';
          if (particleSys) particleSys.spawnBloodExplosion(en.x + en.w / 2, en.y + en.h / 2, 25);
          if (window.game) window.game.spawnSoulOrbs(en.x + en.w / 2, en.y + en.h / 2, 2, en.isElite ? 14 : 4);
        }
        this.isDead = true;
        return;
      }
    }

    // Check hit against boss
    if (boss && !boss.isDead && Math.abs((this.x + 13) - (boss.x + boss.w / 2)) < 38 && Math.abs((this.y + 12) - (boss.y + boss.h / 2)) < 42) {
      boss.hp -= this.damage;
      if (particleSys) particleSys.spawnSlashSparks(boss.x + boss.w / 2, boss.y + boss.h / 2, this.dir);
      if (soundEng) soundEng.playHit();
      if (boss.hp <= 0 && !boss.hasDropped) {
        boss.hasDropped = true;
        boss.isDead = true;
        boss.state = 'dead';
        if (particleSys) {
          particleSys.triggerScreenShake(0.8, 16);
          particleSys.spawnBloodExplosion(boss.x + boss.w / 2, boss.y + boss.h / 2, 80);
        }
        if (soundEng) soundEng.playDeath();
        if (window.game) window.game.spawnSoulOrbs(boss.x + boss.w / 2, boss.y + boss.h / 2, 6, 120, true);
        if (window.progression) window.progression.addHumanityShards(1);
      }
      this.isDead = true;
    }
  }

  draw(ctx, camX, camY) {
    if (this.isDead) return;
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    const grad = ctx.createRadialGradient(rx + 13, ry + 12, 2, rx + 13, ry + 12, 16);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#ff9800');
    grad.addColorStop(0.8, '#ff2200');
    grad.addColorStop(1, 'rgba(255, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(rx + 13, ry + 12, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 5. LADDER (Escaleras verticales trepables)
class Ladder {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.w = data.w || 24;
    this.h = data.h || 120;
    this.type = data.type || 'iron';
  }

  draw(ctx, camX, camY) {
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    // Side rails
    ctx.fillStyle = this.type === 'gold' ? '#b45309' : '#1e1622';
    ctx.fillRect(rx, ry, 4, this.h);
    ctx.fillRect(rx + this.w - 4, ry, 4, this.h);

    ctx.fillStyle = this.type === 'gold' ? '#f59e0b' : '#47364f';
    ctx.fillRect(rx + 1, ry, 1, this.h);
    ctx.fillRect(rx + this.w - 3, ry, 1, this.h);

    // Rungs every 14px
    for (let sy = ry + 8; sy < ry + this.h; sy += 14) {
      ctx.fillStyle = this.type === 'gold' ? '#78350f' : '#120d15';
      ctx.fillRect(rx + 4, sy + 1, this.w - 8, 4);
      ctx.fillStyle = this.type === 'gold' ? '#fbbf24' : '#5b4566';
      ctx.fillRect(rx + 4, sy, this.w - 8, 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(rx + 2, sy, 2, 2);
      ctx.fillRect(rx + this.w - 4, sy, 2, 2);
    }
    ctx.restore();
  }
}

// 6. MOVING PLATFORM (Plataformas móviles sincronizadas)
class MovingPlatform {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.w = data.w || 140;
    this.h = data.h || 24;
    this.type = data.type || 'stone';
    this.axis = data.axis || 'x'; // 'x' or 'y'
    this.startX = data.x;
    this.startY = data.y;
    this.range = data.range || 160;
    this.speed = data.speed || 1.2;
    this.phase = data.phase || 0;
    this.prevX = this.x;
    this.prevY = this.y;
    this.deltaX = 0;
    this.deltaY = 0;
    this.isMovingPlatform = true;

    // Handle minX/maxX or minY/maxY
    if (data.minX !== undefined && data.maxX !== undefined) {
      this.axis = 'x';
      this.startX = (data.minX + data.maxX) / 2;
      this.range = Math.max(10, (data.maxX - data.minX) / 2);
      this.speed = (data.speedX || 70) / this.range;
    }
    if (data.minY !== undefined && data.maxY !== undefined) {
      this.axis = 'y';
      this.startY = (data.minY + data.maxY) / 2;
      this.range = Math.max(10, (data.maxY - data.minY) / 2);
      this.speed = (data.speedY || 60) / this.range;
    }

    this.time = this.phase;
  }

  update(dt) {
    this.prevX = this.x;
    this.prevY = this.y;
    this.time += dt * this.speed;

    if (this.axis === 'x') {
      this.x = this.startX + Math.sin(this.time) * this.range;
    } else {
      this.y = this.startY + Math.sin(this.time) * this.range;
    }

    this.deltaX = this.x - this.prevX;
    this.deltaY = this.y - this.prevY;
  }

  draw(ctx, camX, camY) {
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    // Drop shadow
    ctx.fillStyle = '#060207';
    ctx.fillRect(rx - 1, ry - 1, this.w + 2, this.h + 2);

    const props = window.spriteManager ? window.spriteManager.sprites.props : null;
    const tileMap = props ? {
      stone: props.stoneTile,
      obsidian: props.obsidianTile,
      bone: props.boneTile,
      runic: props.runicTile,
      ice: props.iceTile,
      gold: props.goldTile,
      mud: props.mudTile
    } : null;

    const tile = tileMap ? (tileMap[this.type] || tileMap.stone) : null;
    if (tile && ctx.createPattern) {
      const ptrn = ctx.createPattern(tile, 'repeat');
      ctx.fillStyle = ptrn;
      ctx.save();
      ctx.translate(rx, ry);
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.restore();
    } else {
      ctx.fillStyle = '#2c2235';
      ctx.fillRect(rx, ry, this.w, this.h);
    }

    // Top coping highlight
    const rimColor = this.type === 'obsidian' ? '#ff5500' :
                     this.type === 'gold' ? '#fbbf24' :
                     this.type === 'ice' ? '#00b4d8' :
                     this.type === 'bone' ? '#dcd2c4' :
                     this.type === 'runic' ? '#c026d3' :
                     this.type === 'mud' ? '#4ade80' : '#7c5295';
    ctx.fillStyle = rimColor;
    ctx.fillRect(rx, ry, this.w, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(rx, ry, this.w, 1);

    // Mechanical side brackets (moving platform pulleys / rivets)
    ctx.fillStyle = '#18121d';
    ctx.fillRect(rx, ry + 3, 4, this.h - 3);
    ctx.fillRect(rx + this.w - 4, ry + 3, 4, this.h - 3);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(rx + 1, ry + 6, 2, 2);
    ctx.fillRect(rx + this.w - 3, ry + 6, 2, 2);

    // Pulsing central glyph or warning light
    const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 215, 0, ${pulse * 0.8})`;
    ctx.fillRect(rx + Math.floor(this.w / 2) - 4, ry + 4, 8, 2);
    ctx.restore();
  }
}

// 7. CRUMBLING PLATFORM (Plataformas que tiemblan y se desmoronan)
class CrumblingPlatform {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.w = data.w || 110;
    this.h = data.h || 22;
    this.type = data.type || 'crumbling';
    this.isCrumbling = true;
    this.isTriggered = false;
    this.triggerTimer = 0.55; // 550ms warning shake
    this.isCollapsed = false;
    this.respawnTimer = 3.2; // Respawns after 3.2s
    this.shakeX = 0;
    this.shakeY = 0;
  }

  trigger() {
    if (!this.isTriggered && !this.isCollapsed) {
      this.isTriggered = true;
      this.triggerTimer = 0.55;
    }
  }

  update(dt, soundEng, particleSys) {
    if (this.isTriggered && !this.isCollapsed) {
      this.triggerTimer -= dt;
      this.shakeX = Math.sin(this.triggerTimer * 65) * 3;
      this.shakeY = (Math.random() - 0.5) * 2;

      if (particleSys && Math.random() < 0.35) {
        particleSys.spawnDust(this.x + Math.random() * this.w, this.y + this.h, 1);
      }

      if (this.triggerTimer <= 0) {
        this.isCollapsed = true;
        this.isTriggered = false;
        this.respawnTimer = 3.2;
        this.shakeX = 0;
        this.shakeY = 0;
        if (soundEng) soundEng.playLand();
        if (particleSys) {
          particleSys.triggerScreenShake(0.12, 3);
          particleSys.spawnDust(this.x + this.w / 2, this.y + this.h / 2, 14);
        }
      }
    } else if (this.isCollapsed) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.isCollapsed = false;
        this.isTriggered = false;
        this.triggerTimer = 0.55;
        if (particleSys) particleSys.spawnDust(this.x + this.w / 2, this.y + 4, 8);
      }
    }
  }

  draw(ctx, camX, camY) {
    if (this.isCollapsed) return;
    const rx = Math.round(this.x + this.shakeX - camX);
    const ry = Math.round(this.y + this.shakeY - camY);

    ctx.save();
    ctx.fillStyle = '#22191b';
    ctx.fillRect(rx, ry, this.w, this.h);
    ctx.fillStyle = '#3d2e32';
    ctx.fillRect(rx + 2, ry + 2, this.w - 4, this.h - 4);

    // Cracks
    ctx.fillStyle = this.isTriggered ? '#ff3300' : '#0f0a0c';
    for (let fx = rx + 16; fx < rx + this.w; fx += 26) {
      ctx.fillRect(fx, ry, 2, this.h - 4);
      ctx.fillRect(fx - 4, ry + 8, 8, 2);
    }

    ctx.fillStyle = this.isTriggered ? '#ffaa00' : '#8f7773';
    ctx.fillRect(rx, ry, this.w, 3);
    if (this.isTriggered) {
      ctx.fillStyle = '#ff2200';
      ctx.fillRect(rx, ry, this.w, 2);
    }
    ctx.restore();
  }
}

// 8. BOSS PROJECTILES & ULTIMATE HAZARDS
class BossProjectile {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.vx = data.vx || 0;
    this.vy = data.vy || 0;
    this.w = data.w || 20;
    this.h = data.h || 20;
    this.type = data.type; // 'tornado', 'mud_bomb', 'sulphur_spear', 'judgment_lightning', 'styx_wave', 'meteor', 'frost_lance', 'icicle'
    this.damage = data.damage || 20;
    this.life = 0;
    this.maxLife = data.maxLife || (data.type === 'judgment_lightning' ? 1.25 : (data.type === 'styx_wave' ? 5.0 : 4.5));
    this.isDead = false;
    this.isPuddle = false;
    this.telegraphTime = data.telegraphTime || (data.type === 'judgment_lightning' ? 0.55 : 0);
    this.hasStruck = false;
    this.hasHit = false;
    this.tickTimer = 0;
  }

  update(dt, player, soundEng, particleSys) {
    this.life += dt;
    if (this.life > this.maxLife) {
      this.isDead = true;
      return;
    }

    if (this.type === 'judgment_lightning') {
      if (this.life >= this.telegraphTime) {
        if (!this.hasStruck) {
          this.hasStruck = true;
          if (particleSys) particleSys.triggerScreenShake(0.35, 9);
          if (soundEng && soundEng.playSwordSlash) soundEng.playSwordSlash();
          if (particleSys) {
            for (let i = 0; i < 8; i++) {
              particleSys.spawnSlashSparks(this.x + this.w / 2, 440, (Math.random() - 0.5) * 2);
            }
          }
        }
        // Check collision during active strike
        if (!this.hasHit) {
          const px = player.x + player.w / 2;
          if (Math.abs(px - (this.x + this.w / 2)) < (this.w / 2 + player.w / 2) && player.y + player.h > 40) {
            player.takeDamage(this.damage, soundEng, particleSys);
            this.hasHit = true;
          }
        }
      }
      return;
    }

    if (this.type === 'styx_wave') {
      this.tickTimer += dt;
      if (this.tickTimer >= 0.45) {
        this.tickTimer = 0;
        // Damages player only if standing on the flooded ground floor
        if (player.x + player.w > this.x && player.x < this.x + this.w && player.y + player.h >= 435) {
          player.takeDamage(this.damage, soundEng, particleSys);
          if (particleSys) {
            particleSys.spawnDust(player.x + player.w / 2, player.y + player.h, 3);
          }
        }
      }
      return;
    }

    if (this.type === 'meteor') {
      this.x += this.vx * dt * 60;
      this.y += this.vy * dt * 60;
      if (particleSys && Math.random() < 0.35) {
        particleSys.spawnLavaBubble(this.x + this.w / 2, this.y + this.h / 2);
      }
      if (this.y >= 436) {
        // Explode on ground
        if (particleSys) {
          particleSys.triggerScreenShake(0.32, 8);
          particleSys.spawnBloodExplosion(this.x + this.w / 2, 440, 20);
        }
        if (soundEng && soundEng.playMeteorExplosion) soundEng.playMeteorExplosion();
        const dist = Math.hypot((this.x + this.w / 2) - (player.x + player.w / 2), 440 - (player.y + player.h / 2));
        if (dist < 65) {
          player.takeDamage(this.damage, soundEng, particleSys);
        }
        this.isDead = true;
      }
      return;
    }

    if (this.type === 'icicle') {
      this.vy += 0.38;
      this.y += this.vy * dt * 60;
      if (this.y >= 440) {
        if (particleSys) {
          particleSys.spawnSlashSparks(this.x + this.w / 2, 440, 0);
        }
        this.isDead = true;
      } else if (Math.abs((this.x + this.w / 2) - (player.x + player.w / 2)) < (this.w / 2 + player.w / 2) &&
                 Math.abs((this.y + this.h / 2) - (player.y + player.h / 2)) < (this.h / 2 + player.h / 2)) {
        player.takeDamage(this.damage, soundEng, particleSys);
        this.isDead = true;
      }
      return;
    }

    // Standard moving projectiles (tornado, mud_bomb, sulphur_spear, frost_lance)
    if (!this.isPuddle) {
      this.x += this.vx * dt * 60;
      this.y += this.vy * dt * 60;

      if (this.type === 'mud_bomb') {
        this.vy += 0.32;
        if (this.y > 440) {
          this.isPuddle = true;
          this.y = 444;
          this.vx = 0;
          this.vy = 0;
          this.w = 56;
          this.h = 14;
          this.life = 0;
          this.maxLife = 4.0;
          if (particleSys) particleSys.spawnLavaBubble(this.x + 28, this.y);
        }
      }
    }

    // Player collision
    if (Math.abs((this.x + this.w / 2) - (player.x + player.w / 2)) < (this.w / 2 + player.w / 2) &&
        Math.abs((this.y + this.h / 2) - (player.y + player.h / 2)) < (this.h / 2 + player.h / 2)) {
      player.takeDamage(this.damage, soundEng, particleSys);
      if (this.type === 'tornado') {
        player.vx = Math.sign(this.vx) * 7.5;
      }
      if (!this.isPuddle) this.isDead = true;
    }
  }

  draw(ctx, camX, camY) {
    if (this.isDead) return;
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();

    if (this.type === 'judgment_lightning') {
      if (this.life < this.telegraphTime) {
        // Warning telegraph beam (translucent purple / pink hazard)
        const alpha = 0.25 + Math.sin(this.life * 25) * 0.15;
        ctx.fillStyle = `rgba(217, 70, 239, ${alpha})`;
        ctx.fillRect(rx, 0, this.w, 450);

        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(rx + this.w / 2, 0);
        ctx.lineTo(rx + this.w / 2, 450);
        ctx.stroke();
        ctx.setLineDash([]);

        // Ground hazard chevron
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.moveTo(rx + this.w / 2, 436);
        ctx.lineTo(rx + this.w / 2 - 8, 448);
        ctx.lineTo(rx + this.w / 2 + 8, 448);
        ctx.closePath();
        ctx.fill();
      } else {
        // Thunderous electric lightning pillar
        ctx.fillStyle = 'rgba(192, 132, 252, 0.4)';
        ctx.fillRect(rx - 6, 0, this.w + 12, 450);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(rx + 4, 0, this.w - 8, 450);

        // Electric core arcs
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        let curX = rx + this.w / 2;
        ctx.moveTo(curX, 0);
        for (let y = 30; y < 450; y += 30) {
          curX += (Math.random() - 0.5) * 16;
          ctx.lineTo(curX, y);
        }
        ctx.stroke();
      }
    } else if (this.type === 'styx_wave') {
      // Flooded toxic acid wave covering lower floor
      const waveAlpha = Math.min(1.0, (this.maxLife - this.life) / 0.5);
      ctx.globalAlpha = waveAlpha;

      // Dark sludge base
      ctx.fillStyle = 'rgba(15, 45, 30, 0.85)';
      ctx.fillRect(rx, ry, this.w, this.h);

      // Bubbling acid wave top
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      for (let i = 0; i <= this.w; i += 20) {
        const wy = ry + Math.sin(this.life * 8 + i * 0.1) * 4;
        ctx.lineTo(rx + i, wy);
      }
      ctx.lineTo(rx + this.w, ry + this.h);
      ctx.lineTo(rx, ry + this.h);
      ctx.closePath();
      ctx.fill();

      // Hazard notification banner in arena
      ctx.font = 'bold 12px MedievalSharp, sans-serif';
      ctx.fillStyle = '#6ee7b7';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ ¡MAREMOTO DEL ESTIGIA! SUBE A LAS PLATAFORMAS ⚠️', rx + this.w / 2, ry - 8);
    } else if (this.type === 'meteor') {
      // Blazing hellfire meteor
      ctx.fillStyle = '#ff4500';
      ctx.beginPath();
      ctx.arc(rx + 10, ry + 10, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffea00';
      ctx.beginPath();
      ctx.arc(rx + 9, ry + 9, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'frost_lance') {
      // Crystalline ice lance
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(rx + this.w, ry + this.h / 2);
      ctx.lineTo(rx, ry);
      ctx.lineTo(rx + 4, ry + this.h / 2);
      ctx.lineTo(rx, ry + this.h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx + 4, ry + this.h / 2 - 2, this.w - 8, 4);
    } else if (this.type === 'icicle') {
      // Falling ceiling icicle
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + this.w, ry);
      ctx.lineTo(rx + this.w / 2, ry + this.h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx + this.w / 2 - 1, ry, 2, this.h - 4);
    } else if (this.type === 'tornado') {
      const whirl = Math.sin(this.life * 25) * 5;
      ctx.fillStyle = 'rgba(75, 0, 130, 0.7)';
      ctx.beginPath();
      ctx.arc(rx + 12 + whirl, ry + 16, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e0aaff';
      ctx.beginPath();
      ctx.arc(rx + 12 - whirl, ry + 12, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'mud_bomb') {
      if (this.isPuddle) {
        ctx.fillStyle = '#1b4332';
        ctx.fillRect(rx, ry, this.w, this.h);
        ctx.fillStyle = '#52b788';
        ctx.fillRect(rx + 4, ry + 2, this.w - 8, 4);
        ctx.fillStyle = '#ff5500';
        ctx.fillRect(rx + 14, ry, 6, 3);
        ctx.fillRect(rx + 36, ry, 8, 3);
      } else {
        ctx.fillStyle = '#2d6a4f';
        ctx.beginPath();
        ctx.arc(rx + 10, ry + 10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#74c69d';
        ctx.beginPath();
        ctx.arc(rx + 8, ry + 8, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (this.type === 'sulphur_spear') {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(rx, ry, this.w, this.h);
      ctx.fillStyle = '#ff7700';
      ctx.fillRect(rx + 2, ry + 2, this.w - 4, this.h - 4);
      ctx.fillStyle = '#ffff55';
      ctx.fillRect(rx + 4, ry + 4, 4, 4);
    }

    ctx.restore();
  }
}

// 9. ABYSSAL BAT / GARGOYLE (FLYING HARASSER, 5 SPECIES)
class AbyssalBat {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.startX = data.x;
    this.startY = data.y;
    this.w = 26;
    this.h = 20;
    this.subType = data.subType || 'abyss';
    this.hp = data.hp || (this.subType === 'gargoyle' ? 26 : 18);
    this.maxHp = this.hp;
    this.damage = data.damage || 16; // Rebalanced from 28 to 16
    if (this.subType === 'gargoyle') this.damage = data.damage || 20;

    this.vx = 0;
    this.vy = 0;
    this.speed = data.speed || 3.1;
    this.dir = -1;
    this.renderFacing = -1.0;
    this.isDead = false;
    this.hasDropped = false;

    // States: 'roost', 'alert', 'swoop', 'return'
    this.state = 'roost';
    this.alertTimer = 0;
    this.animTimer = 0;
    this.animFrame = 0;
    this.swoopPhase = Math.random() * Math.PI * 2;
    this.cooldown = 0;
    this.alertPulse = 0;
  }

  update(dt, player, level, soundEng, particleSys) {
    if (this.isDead) return;

    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.alertPulse > 0) this.alertPulse -= dt * 2.0;

    const dx = (player.x + player.w / 2) - (this.x + this.w / 2);
    const dy = (player.y + player.h / 2) - (this.y + this.h / 2);
    const dist = Math.hypot(dx, dy);

    // Player dagger strike hit (1 hit per attack swing)
    if (player.isAttacking && (player.attackFrame >= 1 && player.attackFrame <= 3)) {
      const hitX = player.x + (player.facing === 1 ? player.w : -30);
      if (Math.abs(hitX - (this.x + this.w / 2)) < 38 && Math.abs(player.y - this.y) < 34) {
        if (!player.attackHitTargets || !player.attackHitTargets.has(this)) {
          if (player.attackHitTargets) player.attackHitTargets.add(this);
          const stats = window.progression ? window.progression.getPlayerStats() : null;
          let dmg = stats ? (stats.daggerDamage || stats.swordDamage || 16) : 16;
          this.takeDamage(dmg, player.x, soundEng, particleSys);
          return;
        }
      }
    }

    // State Machine
    if (this.state === 'roost') {
      // Senses player from high distance
      if (dist < 700 && this.cooldown <= 0) {
        this.state = 'alert';
        this.alertTimer = 0.22;
        this.alertPulse = 1.0;
        if (soundEng && soundEng.playBatScreech) soundEng.playBatScreech();
        if (particleSys) particleSys.spawnSlashSparks(this.x + this.w / 2, this.y, Math.sign(dx));
      }
    } else if (this.state === 'alert') {
      this.alertTimer -= dt;
      this.dir = dx < 0 ? -1 : 1;
      if (this.alertTimer <= 0) {
        this.state = 'swoop';
      }
    } else if (this.state === 'swoop') {
      this.dir = dx < 0 ? -1 : 1;
      this.swoopPhase += dt * 8.0;

      // Accelerated dive towards player with sinusoidal wave
      const angle = Math.atan2(dy, dx);
      const wave = Math.cos(this.swoopPhase) * 1.8;
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed + wave;

      this.x += this.vx;
      this.y += this.vy;

      // Damage player on touch
      if (dist < 26) {
        player.takeDamage(this.damage, soundEng, particleSys);
        this.state = 'return';
        this.cooldown = 0.9;
      }

      // If passed player or swooped far enough
      if (dist > 440) {
        this.state = 'return';
        this.cooldown = 0.7;
      }
    } else if (this.state === 'return') {
      // Reposition above player to immediately swoop again rather than retreating forever
      if (this.cooldown <= 0 && dist < 700) {
        this.state = 'swoop';
      } else {
        const targetX = player.x + Math.sin(this.swoopPhase) * 120;
        const targetY = player.y - 120;
        const rdx = targetX - this.x;
        const rdy = targetY - this.y;
        const rdist = Math.hypot(rdx, rdy);
        this.dir = rdx < 0 ? -1 : 1;

        if (rdist < 30 || this.cooldown <= 0) {
          this.state = 'swoop';
        } else {
          this.vx = (rdx / Math.max(1, rdist)) * (this.speed * 0.85);
          this.vy = (rdy / Math.max(1, rdist)) * (this.speed * 0.85);
          this.x += this.vx;
          this.y += this.vy;
        }
      }
    }

    // Animation
    this.animTimer += dt;
    this.animFrame = Math.floor(this.animTimer / 0.08) % 6;
    this.renderFacing = this.dir;
  }

  draw(ctx, camX, camY) {
    if (this.isDead) return;
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    ctx.translate(rx + this.w / 2, ry + this.h / 2);
    ctx.scale(this.dir, 1.0);
    ctx.translate(-this.w / 2, -this.h / 2);

    const sm = window.spriteManager;
    let batFrames = null;
    if (sm && sm.sprites) {
      if (sm.sprites.batTypes && sm.sprites.batTypes[this.subType]) {
        batFrames = sm.sprites.batTypes[this.subType];
      } else {
        batFrames = sm.sprites.bat;
      }
    }

    if (batFrames && batFrames[this.animFrame]) {
      ctx.drawImage(batFrames[this.animFrame], -6, -6);
    } else {
      // Fallback
      ctx.fillStyle = '#2b1028';
      ctx.fillRect(2, 4, 22, 12);
      ctx.fillStyle = '#ff1133';
      ctx.fillRect(this.dir > 0 ? 18 : 6, 6, 3, 3);
    }
    ctx.restore();

    // Alert "!" feedback
    if (this.state === 'alert' || this.alertPulse > 0) {
      ctx.save();
      const exX = rx + this.w / 2;
      const exY = ry - 12;
      ctx.fillStyle = 'rgba(255, 30, 40, 0.6)';
      ctx.beginPath();
      ctx.arc(exX, exY + 3, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(exX - 1, exY - 2, 2, 5);
      ctx.fillRect(exX - 1, exY + 5, 2, 2);
      ctx.restore();
    }
  }

  takeDamage(amount, sourceX, soundEng, particleSys) {
    if (this.isDead || this.hp <= 0) return;
    this.hp -= amount;
    const hitDir = sourceX !== undefined ? (this.x > sourceX ? 1 : -1) : (this.dir ? -this.dir : 1);
    this.vx = hitDir * 3.5;
    this.vy = -2.5;
    if (particleSys) particleSys.spawnSlashSparks(this.x + this.w / 2, this.y + this.h / 2, hitDir);
    if (soundEng && soundEng.playHit) soundEng.playHit();
    if (window.progression && window.progression.hasBoon('vampirism') && window.game && window.game.player) {
      window.game.player.hp = Math.min(window.game.player.maxHp, window.game.player.hp + 5);
    }

    if (this.hp <= 0 && !this.hasDropped) {
      this.hasDropped = true;
      this.isDead = true;
      if (window.progression && window.progression.recordEnemyKill) {
        window.progression.recordEnemyKill('bat');
      }
      if (window.game && window.game.triggerHitStop) {
        window.game.triggerHitStop(0.035);
      }
      if (particleSys) particleSys.spawnBloodExplosion(this.x + this.w / 2, this.y + this.h / 2, 20);
      if (window.game) {
        window.game.spawnSoulOrbs(this.x + this.w / 2, this.y + this.h / 2, 1, 2);
        // Vampire Survivors In-Run XP Gem Drop (Fix: Bats now grant XP gems on kill!)
        if (window.game.spawnXpGems) {
          const xpVal = this.subType === 'gargoyle' ? 14 : 10;
          window.game.spawnXpGems(this.x + this.w / 2, this.y + this.h / 2, 1, xpVal);
        }
        if (window.game.spawnHealthOrb && Math.random() < 0.25) {
          window.game.spawnHealthOrb(this.x + this.w / 2, this.y + this.h / 2, 15);
        }
      }
    }
  }
}

// 10. ENEMY PROJECTILE (BONE ARROW / FLAMING CRANIUM)
class EnemyProjectile {
  constructor(data) {
    this.x = data.x;
    this.y = data.y;
    this.vx = data.vx || 0;
    this.vy = data.vy || 0;
    this.w = 20;
    this.h = 20;
    this.damage = data.damage || 20; // Rebalanced from 35 to 20
    this.type = data.type || 'skull';
    this.life = 0;
    this.maxLife = data.maxLife || 4.2;
    this.isDead = false;
    this.animTimer = 0;
    this.animFrame = 0;
  }

  update(dt, player, soundEng, particleSys) {
    if (this.isDead) return;
    this.life += dt;
    if (this.life > this.maxLife) {
      this.isDead = true;
      return;
    }

    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;

    this.animTimer += dt;
    this.animFrame = Math.floor(this.animTimer / 0.08) % 4;

    // Player collision
    if (Math.abs((this.x + this.w / 2) - (player.x + player.w / 2)) < (this.w / 2 + player.w / 2 - 2) &&
        Math.abs((this.y + this.h / 2) - (player.y + player.h / 2)) < (this.h / 2 + player.h / 2 - 2)) {
      player.takeDamage(this.damage, soundEng, particleSys);
      this.isDead = true;
      if (particleSys) particleSys.spawnSlashSparks(this.x + this.w / 2, this.y + this.h / 2, 1);
    }
  }

  // Can be destroyed or parried by player's sword
  checkSwordDeflection(hitbox, soundEng, particleSys) {
    if (this.isDead) return false;
    if (hitbox.x + hitbox.w > this.x && hitbox.x < this.x + this.w &&
        hitbox.y + hitbox.h > this.y && hitbox.y < this.y + this.h) {
      this.isDead = true;
      if (soundEng) soundEng.playHit();
      if (particleSys) {
        particleSys.spawnSlashSparks(this.x + this.w / 2, this.y + this.h / 2, 1);
        particleSys.spawnDust(this.x + this.w / 2, this.y + this.h / 2, 6);
      }
      return true;
    }
    return false;
  }

  draw(ctx, camX, camY) {
    if (this.isDead) return;
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    const sm = window.spriteManager;
    let skullFrames = null;
    if (sm && sm.sprites) {
      if (sm.sprites.skullProjectiles && sm.sprites.skullProjectiles[this.type]) {
        skullFrames = sm.sprites.skullProjectiles[this.type];
      } else {
        skullFrames = sm.sprites.skullProjectile;
      }
    }

    if (skullFrames && skullFrames[this.animFrame]) {
      const facing = this.vx < 0 ? -1 : 1;
      ctx.translate(rx + this.w / 2, ry + this.h / 2);
      ctx.scale(facing, 1.0);
      ctx.drawImage(skullFrames[this.animFrame], -12, -12);
    } else {
      const col = this.type === 'frost' ? '#38bdf8' : (this.type === 'toxic' ? '#22c55e' : (this.type === 'necrotic' ? '#c084fc' : '#ff4400'));
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(rx + 10, ry + 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rx + 10, ry + 10, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// 11. HEALTH ORB (VITALITY RESTORATION)
class HealthOrb {
  constructor(x, y, value = 15) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 3.5;
    this.vy = -(2.5 + Math.random() * 2.5);
    this.value = value;
    this.radius = 5;
    this.life = 0;
    this.maxLife = 18.0;
    this.isCollected = false;
  }

  update(dt, player, soundEng, particleSys) {
    if (this.isCollected) return;
    this.life += dt;
    if (this.life > this.maxLife) {
      this.isCollected = true;
      return;
    }

    this.vy += 0.1;
    this.vx *= 0.95;
    this.x += this.vx;
    this.y += this.vy;

    const px = player.x + player.w / 2;
    const py = player.y + player.h / 2;
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 85) {
      const pull = Math.min(12, 450 / Math.max(20, dist));
      this.vx += (dx / dist) * pull * 0.45;
      this.vy += (dy / dist) * pull * 0.45;
    }

    if (dist < 22) {
      this.isCollected = true;
      player.hp = Math.min(player.maxHp, player.hp + this.value);
      if (soundEng && soundEng.playHeal) soundEng.playHeal();
      if (particleSys) particleSys.spawnSlashSparks(this.x, this.y, 1);
    }
  }

  draw(ctx, camX, camY) {
    if (this.isCollected) return;
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    const pulse = Math.sin(this.life * 10) * 1.5;
    const r = Math.max(3, this.radius + pulse);

    // Heartbeat aura
    ctx.fillStyle = 'rgba(255, 30, 60, 0.45)';
    ctx.beginPath();
    ctx.arc(rx, ry, r * 2.4, 0, Math.PI * 2);
    ctx.fill();

    // Crimson core
    ctx.fillStyle = '#ff1e44';
    ctx.beginPath();
    ctx.arc(rx, ry, r, 0, Math.PI * 2);
    ctx.fill();

    // Specular Highlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(rx - 1, ry - 1, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

if (typeof window !== 'undefined') {
  window.Player = Player;
  window.SkeletonEnemy = SkeletonEnemy;
  window.AbyssalBat = AbyssalBat;
  window.EnemyProjectile = EnemyProjectile;
  window.Boss = Boss;
  window.SoulOrb = SoulOrb;
  window.XpGem = XpGem;
  window.BoonChest = BoonChest;
  window.BreakableUrn = BreakableUrn;
  window.HealthOrb = HealthOrb;
}
