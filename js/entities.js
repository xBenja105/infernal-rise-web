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
    this.attackComboStep = 1;
    this.comboResetTimer = 0;

    // Animations
    this.animState = 'idle';
    this.animFrame = 0;
    this.animTimer = 0;
    this.stepTimer = 0;

    // Tactical Dash System (Shadows & i-Frames)
    this.dashCooldown = 0;
    this.dashCooldownMax = 0.75;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDuration = 0.18;
    this.dashSpeed = 9.8;
    this.dashDir = 1;
    this.dashTrail = [];

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
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.dashTrail = [];
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
    this.attackComboStep = 1;
    this.comboResetTimer = 0;
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

    // ─── TACTICAL DASH & SHADOW TRAIL ───
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - dt);

    if (this.dashTrail && this.dashTrail.length > 0) {
      for (let i = this.dashTrail.length - 1; i >= 0; i--) {
        this.dashTrail[i].alpha -= dt * 4.2;
        if (this.dashTrail[i].alpha <= 0) {
          this.dashTrail.splice(i, 1);
        }
      }
    }

    const hasHermes = window.progression && window.progression.hasRelic('relic_dash_master');
    const cdMax = hasHermes ? 0.38 : this.dashCooldownMax;

    if (input.dash && this.dashCooldown <= 0 && !this.isClimbing && !this.isFrozen) {
      this.isDashing = true;
      this.dashTimer = this.dashDuration;
      this.dashCooldown = cdMax;
      const dDir = input.left ? -1 : (input.right ? 1 : this.facing);
      this.dashDir = dDir !== 0 ? dDir : this.facing;
      this.facing = this.dashDir;
      this.vx = this.dashDir * this.dashSpeed;
      this.vy = 0;
      this.invulnerableTimer = Math.max(this.invulnerableTimer, 0.22); // i-frames!

      this.dashTrail.push({ x: this.x, y: this.y, facing: this.facing, alpha: 0.75 });

      if (particleSys) {
        particleSys.spawnSlashSparks(this.x + this.w / 2, this.y + this.h / 2, this.dashDir);
        if (hasHermes) {
          particleSys.spawnBloodExplosion(this.x + this.w / 2, this.y + this.h / 2, 8);
        }
      }
      if (soundEng) soundEng.playSwordSlash();
      input.dash = false;
    }

    if (this.isDashing) {
      this.dashTimer -= dt;
      this.vx = this.dashDir * this.dashSpeed;
      this.vy = 0;
      this.invulnerableTimer = Math.max(this.invulnerableTimer, 0.08);

      if (Math.random() < 0.6) {
        this.dashTrail.push({ x: this.x, y: this.y, facing: this.facing, alpha: 0.65 });
      }

      if (hasHermes && window.game && Math.random() < 0.25) {
        window.game.spawnFlameWave(this.x, this.y + 10, -this.dashDir);
      }

      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.vx = this.dashDir * this.maxWalkSpeed;
      }
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

    // Combo reset timer
    if (this.comboResetTimer > 0) {
      this.comboResetTimer -= dt;
      if (this.comboResetTimer <= 0) {
        this.attackComboStep = 1;
      }
    }

    // ─── ATTACK SYSTEM (FREEKNIGHT SWORD COMBOS) ───
    if (this.attackCooldown > 0) this.attackCooldown -= dt;

    if (input.attack && !this.isAttacking && this.attackCooldown <= 0) {
      this.isAttacking = true;
      this.attackFrame = 0;
      this.attackTimer = 0;
      this.attackComboStep = (this.attackComboStep === 1) ? 2 : 1;
      this.comboResetTimer = 0.55;
      this.attackCooldown = this.attackComboStep === 2 ? 0.28 : 0.22;
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
      const maxFrames = this.attackComboStep === 2 ? 6 : 4;
      const frameDur = this.attackComboStep === 2 ? 0.045 : 0.055;
      this.attackFrame = Math.floor(this.attackTimer / frameDur);
      if (this.attackFrame >= maxFrames) {
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
    if (window.progression && window.progression.hasBoon('curse_damage')) {
      amount = Math.round(amount * 1.15);
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

    // Natural human breathing & walk step bob (handled directly by FreeKnight pixel art frames)
    this.breathTimer += dt;
    this.breathY = 0;
    this.walkBobY = 0;

    // Elastic squash & stretch recovery
    this.scaleX += (1.0 - this.scaleX) * Math.min(1.0, dt * 12.0);
    this.scaleY += (1.0 - this.scaleY) * Math.min(1.0, dt * 12.0);

    if (this.isDashing) {
      this.animState = 'dash';
      this.animFrame = Math.floor((this.dashDuration - this.dashTimer) / (this.dashDuration / 2)) % 2;
      return;
    }

    if (this.isAttacking) {
      this.animState = 'attack';
      return;
    }

    if (this.invulnerableTimer > 0.45) {
      this.animState = 'hurt';
      this.animFrame = 0;
      return;
    }

    if (this.isClimbing) {
      this.animState = 'climb';
      this.animFrame = Math.floor(this.climbTimer * 6) % 7;
      return;
    }

    if (!this.isGrounded) {
      if (this.vy < -2.5) {
        this.animState = 'jump';
        this.animFrame = this.vy < -6.0 ? 0 : (this.vy < -4.0 ? 1 : 2);
      } else if (Math.abs(this.vy) <= 2.5) {
        this.animState = 'apex';
        this.animFrame = this.vy < 0 ? 0 : 1;
      } else {
        this.animState = 'fall';
        this.animFrame = this.vy < 5.0 ? 0 : (this.vy < 8.0 ? 1 : 2);
      }
      return;
    }

    if (Math.abs(this.vx) > 0.3) {
      this.animState = 'run';
      this.animTimer += dt;
      this.animFrame = Math.floor(this.animTimer / 0.075) % 10;
    } else {
      this.animState = 'idle';
      this.animTimer += dt;
      this.animFrame = Math.floor(this.animTimer / 0.12) % 10;
    }
  }

  draw(ctx, camX, camY) {
    // ─── DASH ETHEREAL SHADOW TRAIL ───
    if (this.dashTrail && this.dashTrail.length > 0) {
      const sm = window.spriteManager;
      const ghostFrame = (sm && sm.sprites.kael && sm.sprites.kael.dash) ? sm.sprites.kael.dash[0] : null;
      for (const ghost of this.dashTrail) {
        if (ghost.alpha <= 0.02) continue;
        const gx = Math.round(ghost.x - camX);
        const gy = Math.round(ghost.y - camY);
        ctx.save();
        ctx.globalAlpha = ghost.alpha * 0.45;
        ctx.translate(gx + this.w / 2, gy + this.h);
        ctx.scale(ghost.facing, 1.0);
        ctx.translate(-this.w / 2, -this.h);
        if (ghostFrame) {
          ctx.drawImage(ghostFrame, -42, -41, 120, 80);
        } else {
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(4, 6, 16, 26);
        }
        ctx.restore();
      }
    }

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

    const sm = window.spriteManager;
    const kaelSprites = sm ? sm.sprites.kael : null;
    let frameCanvas = null;

    if (this.cutscenePose && kaelSprites) {
      if (this.cutscenePose === 'lying') {
        const deathList = kaelSprites.death;
        frameCanvas = (deathList && deathList.length > 0) ? deathList[deathList.length - 1] : (kaelSprites.crouch || (kaelSprites.idle ? kaelSprites.idle[0] : null));
      } else if (this.cutscenePose === 'stirring') {
        const deathList = kaelSprites.death;
        const sIdx = Math.max(0, (deathList ? deathList.length - 3 : 0));
        frameCanvas = (deathList && deathList[sIdx]) ? deathList[sIdx] : (kaelSprites.crouch || (kaelSprites.idle ? kaelSprites.idle[0] : null));
      } else if (this.cutscenePose === 'crouching') {
        frameCanvas = kaelSprites.crouch || (kaelSprites.death ? kaelSprites.death[4] : (kaelSprites.idle ? kaelSprites.idle[0] : null));
      } else if (this.cutscenePose === 'standing') {
        frameCanvas = (kaelSprites.idle && kaelSprites.idle.length > 0) ? kaelSprites.idle[0] : null;
      }
    } else if (this.animState === 'dash' && kaelSprites && kaelSprites.dash) {
      const fIdx = Math.min(kaelSprites.dash.length - 1, this.animFrame || 0);
      frameCanvas = sm.getTintedKaelFrame ? sm.getTintedKaelFrame('dash', fIdx, activeSkin) : kaelSprites.dash[fIdx];
    } else if (this.animState === 'attack' && kaelSprites) {
      const act = (this.attackComboStep === 2 && kaelSprites.attack2) ? 'attack2' : 'attack';
      const maxF = kaelSprites[act] ? kaelSprites[act].length - 1 : 3;
      const fIdx = Math.max(0, Math.min(maxF, this.attackFrame || 0));
      frameCanvas = sm.getTintedKaelFrame ? sm.getTintedKaelFrame(act, fIdx, activeSkin) : (kaelSprites[act] ? kaelSprites[act][fIdx] : null);
    } else if (this.animState === 'hurt' && kaelSprites && kaelSprites.hurt) {
      frameCanvas = sm.getTintedKaelFrame ? sm.getTintedKaelFrame('hurt', 0, activeSkin) : kaelSprites.hurt[0];
    } else if (this.animState === 'climb' && kaelSprites && kaelSprites.climb) {
      const fIdx = (this.animFrame || 0) % kaelSprites.climb.length;
      frameCanvas = sm.getTintedKaelFrame ? sm.getTintedKaelFrame('climb', fIdx, activeSkin) : kaelSprites.climb[fIdx];
    } else if (this.animState === 'jump' && kaelSprites && kaelSprites.jump) {
      const fIdx = Math.min(kaelSprites.jump.length - 1, this.animFrame || 0);
      frameCanvas = sm.getTintedKaelFrame ? sm.getTintedKaelFrame('jump', fIdx, activeSkin) : kaelSprites.jump[fIdx];
    } else if (this.animState === 'apex' && kaelSprites && kaelSprites.jumpFall) {
      const fIdx = Math.min(kaelSprites.jumpFall.length - 1, this.animFrame || 0);
      frameCanvas = sm.getTintedKaelFrame ? sm.getTintedKaelFrame('jumpFall', fIdx, activeSkin) : kaelSprites.jumpFall[fIdx];
    } else if (this.animState === 'fall' && kaelSprites && kaelSprites.fall) {
      const fIdx = Math.min(kaelSprites.fall.length - 1, this.animFrame || 0);
      frameCanvas = sm.getTintedKaelFrame ? sm.getTintedKaelFrame('fall', fIdx, activeSkin) : kaelSprites.fall[fIdx];
    } else if (this.animState === 'run' && kaelSprites && kaelSprites.run) {
      const fIdx = (this.animFrame || 0) % kaelSprites.run.length;
      frameCanvas = sm.getTintedKaelFrame ? sm.getTintedKaelFrame('run', fIdx, activeSkin) : kaelSprites.run[fIdx];
    } else if (kaelSprites && kaelSprites.idle && kaelSprites.idle.length > 0) {
      const fIdx = (this.animFrame || 0) % kaelSprites.idle.length;
      frameCanvas = sm.getTintedKaelFrame ? sm.getTintedKaelFrame('idle', fIdx, activeSkin) : kaelSprites.idle[fIdx];
    }

    if (frameCanvas) {
      if (frameCanvas.width === 120) {
        ctx.drawImage(frameCanvas, -42, -41, 120, 80);
      } else {
        const dw = frameCanvas.width / 2;
        const dh = frameCanvas.height / 2;
        const ox = this.animState === 'attack' ? -10 : -6;
        const oy = -3;
        ctx.drawImage(frameCanvas, ox, oy, dw, dh);
      }
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
    this.isElite = !!data.isElite || !!data.isChallenge;
    this.isChallenge = !!data.isChallenge;
    this.scaleMultiplier = data.scaleMultiplier || (this.isChallenge ? 1.72 : (this.isElite ? 1.62 : 1.0));
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
          eyeGlow: 'rgba(255, 215, 0, 0.95)',
          auraColor: 'rgba(255, 215, 0, 0.42)',
          auraGlow: 'rgba(255, 215, 0, 0.85)',
          lightCore: '#ffffff',
          name: 'Centinela del Umbral Terrenal'
        };
      case 'gold':
        return {
          tint: 'rgba(255, 215, 0, 0.38)',
          eyeColor: '#ffb703',
          eyeGlow: 'rgba(255, 183, 3, 0.9)',
          auraColor: 'rgba(255, 183, 3, 0.38)',
          auraGlow: 'rgba(255, 183, 3, 0.85)',
          lightCore: '#ffea75',
          name: 'Guardia Avaro de la Torre'
        };
      case 'mud':
        return {
          tint: 'rgba(60, 85, 40, 0.42)',
          eyeColor: '#70e000',
          eyeGlow: 'rgba(112, 224, 0, 0.9)',
          auraColor: 'rgba(112, 224, 0, 0.38)',
          auraGlow: 'rgba(112, 224, 0, 0.85)',
          lightCore: '#ccff33',
          name: 'Caminante de las Catacumbas'
        };
      case 'obsidian':
        return {
          tint: 'rgba(20, 12, 16, 0.65)',
          eyeColor: '#ff3c00',
          eyeGlow: 'rgba(255, 60, 0, 0.95)',
          auraColor: 'rgba(255, 60, 0, 0.45)',
          auraGlow: 'rgba(255, 60, 0, 0.9)',
          lightCore: '#ffaa00',
          name: 'Esqueleto de Obsidiana Ígnea'
        };
      case 'blood':
        return {
          tint: 'rgba(130, 12, 30, 0.45)',
          eyeColor: '#ff0054',
          eyeGlow: 'rgba(255, 0, 84, 0.95)',
          auraColor: 'rgba(255, 0, 84, 0.45)',
          auraGlow: 'rgba(255, 0, 84, 0.9)',
          lightCore: '#ff4d6d',
          name: 'Guardia Óseo de la Fortaleza'
        };
      case 'ice':
        return {
          tint: 'rgba(160, 225, 255, 0.38)',
          eyeColor: '#00b4d8',
          eyeGlow: 'rgba(0, 229, 255, 0.95)',
          auraColor: 'rgba(0, 180, 216, 0.42)',
          auraGlow: 'rgba(0, 229, 255, 0.85)',
          lightCore: '#e0f7fa',
          name: 'Espectro de las Agujas Heladas'
        };
      case 'ashen':
        return {
          tint: 'rgba(190, 195, 205, 0.22)',
          eyeColor: '#c084fc',
          eyeGlow: 'rgba(192, 132, 252, 0.95)',
          auraColor: 'rgba(192, 132, 252, 0.42)',
          auraGlow: 'rgba(192, 132, 252, 0.85)',
          lightCore: '#f3e8ff',
          name: 'Centinela de Ceniza'
        };
      case 'abyss':
      default:
        return {
          tint: 'rgba(160, 185, 205, 0.18)',
          eyeColor: '#00f5d4',
          eyeGlow: 'rgba(0, 245, 212, 0.95)',
          auraColor: 'rgba(0, 245, 212, 0.38)',
          auraGlow: 'rgba(0, 245, 212, 0.85)',
          lightCore: '#ccfbf1',
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
    // Skeletons in Skeleton Sprite Pack naturally face RIGHT by default:
    // multiply by this.dir so dir=1 (right) stays right, and dir=-1 (left) flips to left
    ctx.scale(this.dir * this.scaleMultiplier, this.scaleMultiplier);
    ctx.rotate(this.wobbleAngle);
    ctx.translate(-13, -34); // Center at standard frame reference base

    // ─── SPECIAL / ELITE RUNIC SUMMONING SEAL ON GROUND ───
    if (this.isElite) {
      ctx.save();
      ctx.translate(13, 34);
      ctx.scale(1.0, 0.35); // Isometric perspective
      const sealPulse = 0.65 + Math.sin(Date.now() * 0.005) * 0.25;
      ctx.globalAlpha = sealPulse;
      ctx.strokeStyle = skinData.eyeGlow || '#ff3c00';
      ctx.shadowColor = skinData.eyeGlow || '#ff3c00';
      ctx.shadowBlur = 10;
      // Concentric runes
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.stroke();
      // Rotating cardinal tick runes
      const rAng = Date.now() * 0.0025;
      for (let i = 0; i < 4; i++) {
        const ang = rAng + (i * Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * 16, Math.sin(ang) * 16);
        ctx.lineTo(Math.cos(ang) * 24, Math.sin(ang) * 24);
        ctx.stroke();
      }
      ctx.restore();
    }

    // ─── SPECIAL / ELITE RADIANT LIGHT AURA & CORONA BEAMS ───
    if (this.isElite) {
      ctx.save();
      const auraPulse = 0.55 + Math.sin(Date.now() * 0.004) * 0.25;
      const grad = ctx.createRadialGradient(13, 17, 4, 13, 17, 30 + Math.sin(Date.now() * 0.006) * 4);
      grad.addColorStop(0, skinData.auraGlow || 'rgba(255, 60, 0, 0.7)');
      grad.addColorStop(0.5, skinData.auraColor || 'rgba(255, 30, 0, 0.35)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.globalAlpha = auraPulse;
      ctx.beginPath();
      ctx.arc(13, 17, 32, 0, Math.PI * 2);
      ctx.fill();

      // Coronal rotating light rays
      const beamTime = Date.now() * 0.002;
      ctx.strokeStyle = skinData.eyeGlow || '#ff3c00';
      ctx.lineWidth = 1.2;
      ctx.shadowColor = skinData.eyeGlow || '#ff3c00';
      ctx.shadowBlur = 8;
      ctx.globalAlpha = auraPulse * 0.6;
      for (let i = 0; i < 6; i++) {
        const bAng = beamTime + (i * Math.PI / 3);
        const len = 14 + Math.sin(beamTime * 3 + i) * 6;
        ctx.beginPath();
        ctx.moveTo(13 + Math.cos(bAng) * 9, 17 + Math.sin(bAng) * 9);
        ctx.lineTo(13 + Math.cos(bAng) * (9 + len), 17 + Math.sin(bAng) * (9 + len));
        ctx.stroke();
      }
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

    // Accept both HTMLImageElement and tinted HTMLCanvasElement
    const isReady = sheet && ((sheet.complete && sheet.naturalWidth > 0) || (sheet.width > 0 && sheet.height > 0));

    if (isReady) {
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

    // Glowing Eyes & Flare Streaks (aligned with skull face)
    ctx.save();
    ctx.fillStyle = skinData.eyeColor;
    ctx.shadowColor = skinData.eyeGlow;
    ctx.shadowBlur = this.isElite ? 12 : 4;
    ctx.fillRect(8, 10, 2, 2);
    if (this.isElite) {
      ctx.fillStyle = skinData.eyeColor;
      ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.009) * 0.25;
      ctx.fillRect(6, 10.5, 4, 1);
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    // ─── SPECIAL / ELITE HORNED CROWN DIADEM ───
    if (this.isElite && this.state !== 'dead') {
      ctx.save();
      const crownBob = Math.sin(Date.now() * 0.006) * 1.5;
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = skinData.eyeGlow || '#ffd700';
      ctx.shadowBlur = 8;
      // 3 Golden Jagged Spikes
      ctx.beginPath();
      ctx.moveTo(8, 2 + crownBob);
      ctx.lineTo(10, -3 + crownBob);
      ctx.lineTo(12, 0 + crownBob);
      ctx.lineTo(13.5, -6 + crownBob);
      ctx.lineTo(15, 0 + crownBob);
      ctx.lineTo(17, -3 + crownBob);
      ctx.lineTo(19, 2 + crownBob);
      ctx.closePath();
      ctx.fill();
      // Center jewel
      ctx.fillStyle = skinData.eyeColor;
      ctx.fillRect(12.5, 0 + crownBob, 2, 2);
      ctx.restore();
    }

    // ─── SPECIAL / ELITE ORBITING AURA LIGHT WISPS ───
    if (this.isElite && this.state !== 'dead') {
      ctx.save();
      const orbTime = Date.now() * 0.004;
      for (let i = 0; i < 3; i++) {
        const ang = orbTime + (i * (Math.PI * 2 / 3));
        const ox = 13 + Math.cos(ang) * 20;
        const oy = 17 + Math.sin(ang) * 8;
        ctx.fillStyle = skinData.lightCore || skinData.eyeColor;
        ctx.shadowColor = skinData.eyeGlow;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ox - 0.75, oy - 0.75, 1.5, 1.5);
      }
      ctx.restore();
    }

    // ─── PROCEDURAL FALLBACK OVERLAYS (ONLY IF REAL SPRITE SHEET IS NOT READY) ───
    if (!isReady && this.state !== 'dead') {
      ctx.save();
      const s = this.skin || 'abyss';

      if (this.isMage) {
        this.drawFloorMageOverlay(ctx, s);
      } else if (this.isElite) {
        this.drawFloorEliteOverlay(ctx, s);
      } else {
        this.drawFloorSoldierOverlay(ctx, s);
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

  drawFloorSoldierOverlay(ctx, skin) {
    if (skin === 'mud' || skin === 'toxic') {
      // ── PISO 2: CAMINANTE DE LA PESTE (Capucha de Cripta, Musgo y Maza Tóxica) ──
      ctx.fillStyle = '#143828';
      ctx.fillRect(11, 0, 13, 8); // Crypt hood
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(10, 6, 4, 8);
      ctx.fillRect(21, 6, 4, 8);
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(13, 2, 9, 3);
      // Rotten Moss Shroud on Chest
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(12, 14, 10, 8);
      ctx.fillStyle = '#52b788';
      ctx.fillRect(14, 16, 6, 3);
      // Spiked Crypt Mace with Dripping Poison
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(21, 18, 3, 5); // Wood handle
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(24, 10, 7, 9); // Spiked mace head
      ctx.fillStyle = '#52b788';
      ctx.fillRect(30, 11, 2, 2);
      ctx.fillRect(23, 9, 2, 2);
      ctx.fillStyle = '#a7f3d0';
      ctx.fillRect(27, 19, 2, 4); // Toxic drip

    } else if (skin === 'blood') {
      // ── PISO 3: GLADIADOR ACORAZADO CARMESÍ (Yelmo de Guerra, Armadura Pesada y Gran Hacha) ──
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(12, -2, 11, 9); // Heavy barbute helm
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(12, 4, 3, 7);
      ctx.fillRect(20, 4, 3, 7);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(15, -7, 4, 6);  // War plume crest
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(16, -7, 2, 6);
      // Iron Fortress Cuirass & Spiked Pauldron
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(8, 12, 6, 6);   // Iron pauldron
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(9, 11, 4, 2);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(13, 14, 9, 8);  // Crimson breastplate
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(15, 16, 5, 4);
      // Colossal Double-Edged Executioner Battleaxe
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(24, 5, 3, 25);  // Axe haft
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(20, 4, 10, 8);  // Blade collar
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(17, 2, 6, 13);  // Broad crescent axe head
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(16, 3, 1, 11);  // Razor steel edge

    } else if (skin === 'frost' || skin === 'ice') {
      // ── PISO 4: ESPECTRO GLACIAL (Corona de Carámbanos, Capa de Escarcha y Alabarda de Hielo) ──
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(12, 3, 11, 3); // Frost circlet
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(11, -3, 2, 6);
      ctx.fillRect(22, -3, 2, 6);
      ctx.fillStyle = '#caf0f8';
      ctx.fillRect(16, -6, 3, 9); // Central towering icicle
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(17, -6, 1, 9);
      // Permafrost Mantle & Crystal Pauldron
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(8, 12, 6, 6);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(8, 11, 6, 2);
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(13, 15, 8, 5); // Frozen chestplate
      // Diamond Glacial Lance
      ctx.fillStyle = '#0c4a6e';
      ctx.fillRect(24, 4, 2, 26); // Frost shaft
      ctx.fillStyle = '#00b4d8';
      ctx.fillRect(22, -1, 6, 7);
      ctx.fillStyle = '#caf0f8';
      ctx.fillRect(23, -6, 4, 8); // Diamond spear tip
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(24, -6, 2, 10);

    } else if (skin === 'gold') {
      // ── PISO 5: CENTINELA IMPERIAL ÁUREO (Yelmo con Alas, Escudo y Espada de Oro 24k) ──
      ctx.fillStyle = '#b45309';
      ctx.fillRect(12, 0, 11, 7);  // Gold helm
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(13, 1, 9, 3);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(16, -4, 3, 5);  // Golden crest
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(17, -1, 1, 1);  // Ruby inset
      ctx.fillStyle = '#fde047';
      ctx.fillRect(9, 2, 3, 4);    // Winged ear guard
      ctx.fillRect(23, 2, 3, 4);
      // 24k Imperial Golden Cuirass & Pauldron
      ctx.fillStyle = '#b45309';
      ctx.fillRect(8, 12, 6, 6);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(8, 11, 6, 2);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(13, 14, 9, 8);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(15, 16, 5, 4);  // Solar emblem
      // Radiant Golden Sunblade & Imperial Shield
      ctx.fillStyle = '#78350f';
      ctx.fillRect(23, 19, 3, 5);  // Gold hilt
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(21, 17, 7, 2);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(24, 4, 3, 15);  // Blade
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(25, 4, 1, 15);
      // Left Hand Tower Shield
      ctx.fillStyle = '#b45309';
      ctx.fillRect(4, 13, 6, 13);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(5, 14, 4, 11);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(6, 18, 2, 4);

    } else if (skin === 'celestial') {
      // ── PISO 6: GUARDIÁN DEL UMBRAL TERRENAL (Halo Solar, Alas de Serafín y Toga Blanca) ──
      // Floating Solar Halo
      ctx.save();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(17, -3, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(16, -4, 2, 2);
      ctx.restore();
      // Ethereal Seraph Angel Wings on Back
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(3, 4, 5, 11);
      ctx.fillRect(0, 1, 4, 9);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(1, 2, 3, 7);
      ctx.fillRect(4, 6, 3, 8);
      // Pure White Living World Silk Toga with Gold Trim
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(13, 13, 9, 11);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(13, 13, 9, 2);
      ctx.fillRect(16, 15, 3, 8);
      // Sunburst Halberd of Dawn
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(24, 2, 2, 28);  // Golden spear shaft
      ctx.fillStyle = '#fde047';
      ctx.fillRect(21, -3, 8, 8);  // Sunburst head
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(24, -6, 2, 11); // Radiant tip
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(24, 0, 2, 2);

    } else {
      // ── PISO 1: DEMONIO ÍGNEO DE BASALTO (Cuernos de Magma, Pauldron y Espada Volcánica) ──
      ctx.fillStyle = '#ff4500';
      ctx.fillRect(10, 0, 3, 4);
      ctx.fillRect(8, -5, 3, 6);   // Left curved magma horn
      ctx.fillRect(22, 0, 3, 4);
      ctx.fillRect(24, -5, 3, 6);  // Right curved magma horn
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(9, -3, 1, 4);
      ctx.fillRect(25, -3, 1, 4);
      // Molten Basalt Pauldron & Magma Heart Core
      ctx.fillStyle = '#1c0c17';
      ctx.fillRect(8, 12, 6, 6);
      ctx.fillStyle = '#ff4500';
      ctx.fillRect(8, 11, 6, 2);
      ctx.fillStyle = '#ff3300';
      ctx.fillRect(15, 16, 4, 4);  // Glowing magma rib furnace
      ctx.fillStyle = '#ffee44';
      ctx.fillRect(16, 17, 2, 2);
      // Blazing Obsidian Broadsword
      ctx.fillStyle = '#1c0c17';
      ctx.fillRect(22, 19, 3, 5);  // Hilt
      ctx.fillStyle = '#ff4500';
      ctx.fillRect(24, 5, 4, 15);  // Magma blade
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(25, 6, 2, 13);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(25, 7, 1, 11);  // Superheated edge
    }
  }

  drawFloorMageOverlay(ctx, skin) {
    let hoodColor = '#2e1065', shawlColor = '#7e22ce', orbColor = '#a855f7';
    if (skin === 'mud' || skin === 'toxic') {
      hoodColor = '#143828'; shawlColor = '#2d6a4f'; orbColor = '#22c55e';
    } else if (skin === 'blood') {
      hoodColor = '#4c0519'; shawlColor = '#881337'; orbColor = '#ef4444';
    } else if (skin === 'frost' || skin === 'ice') {
      hoodColor = '#082f49'; shawlColor = '#0369a1'; orbColor = '#38bdf8';
    } else if (skin === 'gold') {
      hoodColor = '#451a03'; shawlColor = '#b45309'; orbColor = '#fbbf24';
    } else if (skin === 'celestial') {
      hoodColor = '#1e1b4b'; shawlColor = '#eab308'; orbColor = '#ffd700';
    }

    ctx.fillStyle = hoodColor;
    ctx.fillRect(12, 0, 11, 7);
    ctx.fillRect(11, 6, 3, 6);
    ctx.fillRect(21, 6, 3, 6);
    ctx.fillStyle = shawlColor;
    ctx.fillRect(12, 14, 10, 6);

    // Twisted Elemental Staff with Glowing Orb
    ctx.fillStyle = '#78716c';
    ctx.fillRect(24, 5, 2, 23);
    ctx.fillStyle = orbColor;
    ctx.shadowColor = orbColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(23, 2, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(24, 3, 2, 2);
    ctx.shadowBlur = 0;
  }

  drawFloorEliteOverlay(ctx, skin) {
    // Colossal Horned Warlord Crown & Massive Greatsword
    let crownColor = '#ffd700', runeColor = '#ff0054';
    if (skin === 'frost' || skin === 'ice') {
      crownColor = '#38bdf8'; runeColor = '#ffffff';
    } else if (skin === 'mud' || skin === 'toxic') {
      crownColor = '#22c55e'; runeColor = '#a7f3d0';
    } else if (skin === 'celestial') {
      crownColor = '#fde047'; runeColor = '#38bdf8';
    }

    ctx.fillStyle = crownColor;
    ctx.shadowColor = crownColor;
    ctx.shadowBlur = 6;
    ctx.fillRect(9, 1, 15, 3);
    ctx.fillRect(8, -5, 3, 7);
    ctx.fillRect(15, -8, 3, 10);
    ctx.fillRect(22, -5, 3, 7);
    ctx.fillStyle = runeColor;
    ctx.fillRect(16, -2, 2, 2);
    ctx.shadowBlur = 0;

    // Colossal Armor & Greatsword
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(6, 11, 7, 8);
    ctx.fillRect(13, 14, 10, 9);
    ctx.fillStyle = crownColor;
    ctx.fillRect(15, 16, 6, 5);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(24, 18, 3, 7);
    ctx.fillStyle = crownColor;
    ctx.fillRect(22, 16, 8, 3);
    ctx.fillStyle = '#334155';
    ctx.fillRect(25, 2, 5, 16);
    ctx.fillStyle = runeColor;
    ctx.fillRect(26, 4, 3, 11);
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
    if (isMegabonk && window.progression && window.progression.hasRelic('relic_vampiric_eye') && window.game && window.game.player) {
      window.game.player.hp = Math.min(window.game.player.maxHp, window.game.player.hp + 12);
    }

    if (this.hp <= 0 && !this.hasDropped) {
      this.hasDropped = true;
      this.state = 'dead';
      this.deathTimer = 0.9;
      this.animFrame = 0;

      // Corazón de Magma (Reliquia: Ignición en Cadena)
      if (window.progression && window.progression.hasRelic('relic_chain_burn') && window.game) {
        window.game.spawnFlameWave(this.x + this.w / 2, this.y + 10, 1);
        window.game.spawnFlameWave(this.x + this.w / 2, this.y + 10, -1);
      }

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

// ─── 3 OFFICIAL BOSSES: MINOTAUR, FROST GUARDIAN, DEMON SLIME ───
class Boss {
  constructor(data) {
    this.type = data.type; // 'minotaur', 'frost_guardian', 'demon_slime' (plus legacy aliases)
    this.name = data.name;
    this.x = data.x;
    this.y = data.y;

    const bType = (this.type === 'minotaur' || this.type === 'minos') ? 'minotaur' :
                  (this.type === 'frost_guardian' || this.type === 'glacior' || this.type === 'flegias') ? 'frost_guardian' :
                  'demon_slime';

    if (bType === 'minotaur') {
      this.w = data.w || 72;
      this.h = data.h || 84;
      this.baseWalkSpeed = 1.8;
      this.ultimateName = data.ultimateName || 'Furia del Laberinto';
    } else if (bType === 'frost_guardian') {
      this.w = data.w || 64;
      this.h = data.h || 78;
      this.baseWalkSpeed = 2.0;
      this.ultimateName = data.ultimateName || 'Cero Absoluto';
    } else {
      this.w = data.w || 72;
      this.h = data.h || 86;
      this.baseWalkSpeed = 2.2;
      this.ultimateName = data.ultimateName || 'Apocalipsis Ígneo';
    }

    this.maxHp = data.maxHp || (bType === 'demon_slime' ? 2200 : (bType === 'frost_guardian' ? 1600 : 1100));
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
    this.groundY = data.y || 366;
    this.maxWalkSpeed = this.baseWalkSpeed;
    this.turnCooldown = 0;
    this.turnCooldownMax = 0.45;

    // Multi-Phase & Signature Ultimate
    this.phase = 1;
    this.isEnraged = false;
    this.ultimateCooldown = 10.0;
    this.ultimateTimer = 4.0; // First ultimate triggered ~6s into the fight

    // Combat State Machine: 'idle', 'walk', 'windup', 'attack', 'ultimate_windup', 'ultimate_cast', 'recovery', 'dead'
    this.state = 'idle';
    this.lastState = 'idle';
    this.stateTimer = 0;
    this.animTimer = 0;
    this.animFrame = 0;
    this.attackTimer = 0;
    this.baseAttackCooldown = bType === 'demon_slime' ? 1.5 : 1.75;
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
    this.deathAnimDone = false;
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
    const bType = (this.type === 'minotaur' || this.type === 'minos') ? 'minotaur' :
                  (this.type === 'frost_guardian' || this.type === 'glacior' || this.type === 'flegias') ? 'frost_guardian' :
                  'demon_slime';

    if (bType === 'minotaur') {
      if (dist > 220) {
        this.attackType = Math.random() < 0.5 ? 'bull_charge' : 'tremor_stomp';
      } else if (dist < 150 && Math.random() < 0.6) {
        this.attackType = 'axe_slam';
      } else {
        const r = Math.random();
        this.attackType = r < 0.4 ? 'axe_slam' : (r < 0.7 ? 'bull_charge' : 'tremor_stomp');
      }
    } else if (bType === 'frost_guardian') {
      if (dist > 200) {
        this.attackType = Math.random() < 0.5 ? 'icicle_salvo' : 'frost_slam';
      } else if (Math.random() < 0.5) {
        this.attackType = 'frost_sweep';
      } else {
        this.attackType = 'frost_slam';
      }
    } else {
      // demon_slime
      if (dist > 220) {
        const r = Math.random();
        this.attackType = r < 0.4 ? 'flame_dash' : (r < 0.7 ? 'hellfire_cleave' : 'magma_burst');
      } else if (Math.random() < 0.5) {
        this.attackType = 'flame_dash';
      } else {
        this.attackType = 'hellfire_cleave';
      }
    }
  }

  executeAttack(player, soundEng, particleSys, dist) {
    const dy = (player.y + player.h / 2) - (this.y + this.h / 2);
    const bType = (this.type === 'minotaur' || this.type === 'minos') ? 'minotaur' :
                  (this.type === 'frost_guardian' || this.type === 'glacior' || this.type === 'flegias') ? 'frost_guardian' :
                  'demon_slime';

    if (bType === 'minotaur') {
      if (this.attackType === 'axe_slam') {
        // Colossal battleaxe slam: shatters earth and launches traveling ground shockwave
        if (particleSys) particleSys.triggerScreenShake(0.50, 12);
        if (soundEng && soundEng.playSwordSlash) soundEng.playSwordSlash();
        if (dist < 210 && Math.abs(dy) < 70) {
          player.takeDamage(this.isEnraged ? 64 : 54, soundEng, particleSys);
        }
        if (window.game) {
          window.game.spawnBossProjectile(new BossProjectile({
            x: this.x + (this.dir > 0 ? this.w : -32),
            y: 420,
            vx: this.dir * (this.isEnraged ? 7.2 : 5.8),
            vy: 0,
            w: 36,
            h: 36,
            type: 'earth_shockwave',
            damage: this.isEnraged ? 56 : 46
          }));
        }
      } else if (this.attackType === 'tremor_stomp') {
        // Leaps into air and crashes down; cavern ceiling fractures into falling rocks
        this.vy = -10.5;
        this.vx = this.dir * Math.max(3.5, Math.min(6.5, dist / 26));
        if (particleSys) particleSys.triggerScreenShake(0.55, 14);
        if (soundEng && soundEng.playMeteorExplosion) soundEng.playMeteorExplosion();
        if (window.game) {
          const count = this.isEnraged ? 4 : 3;
          for (let r = 0; r < count; r++) {
            const rx = player.x + (r - 1) * 120 + (Math.random() - 0.5) * 50;
            window.game.spawnBossProjectile(new BossProjectile({
              x: Math.max(80, Math.min(1120, rx)),
              y: 20,
              vx: (Math.random() - 0.5) * 1.5,
              vy: 4.8 + Math.random() * 1.2,
              w: 28,
              h: 28,
              type: 'falling_rock',
              damage: 48
            }));
          }
        }
      } else {
        // bull_charge: Lowers horns and charges across arena
        this.vx = this.dir * (this.isEnraged ? 9.2 : 7.6);
        if (particleSys) particleSys.triggerScreenShake(0.40, 9);
        if (dist < 130) player.takeDamage(58, soundEng, particleSys);
      }
    } else if (bType === 'frost_guardian') {
      if (this.attackType === 'frost_sweep') {
        // Heavy frost fist sweep
        if (particleSys) particleSys.triggerScreenShake(0.38, 9);
        if (soundEng && soundEng.playSwordSlash) soundEng.playSwordSlash();
        if (dist < 190 && Math.abs(dy) < 65) {
          player.takeDamage(this.isEnraged ? 62 : 52, soundEng, particleSys);
          player.vx = this.dir * 8; // Frost chill knockback
        }
      } else if (this.attackType === 'icicle_salvo') {
        // Ranged fan of razor frost lances
        const count = this.isEnraged ? 5 : 4;
        for (let b = 0; b < count; b++) {
          if (window.game) {
            window.game.spawnBossProjectile(new BossProjectile({
              x: this.x + (this.dir > 0 ? this.w : -20),
              y: this.y + 15,
              vx: this.dir * (4.2 + b * 0.9),
              vy: -(3.5 - b * 1.8),
              w: 24,
              h: 12,
              type: 'frost_lance',
              damage: 46
            }));
          }
        }
      } else {
        // frost_slam: Slams icy fists into ground; erupts line of crystalline ice spikes
        if (particleSys) particleSys.triggerScreenShake(0.48, 12);
        if (soundEng && soundEng.playSwordSlash) soundEng.playSwordSlash();
        if (dist < 180 && Math.abs(dy) < 70) player.takeDamage(58, soundEng, particleSys);
        if (window.game) {
          for (let s = 1; s <= 4; s++) {
            const spikeX = this.x + this.w / 2 + this.dir * (s * 62);
            if (spikeX > 60 && spikeX < 1140) {
              window.game.spawnBossProjectile(new BossProjectile({
                x: spikeX,
                y: 412,
                w: 36,
                h: 38,
                type: 'ice_spike',
                damage: 50,
                delay: s * 0.12
              }));
            }
          }
        }
      }
    } else {
      // demon_slime
      if (this.attackType === 'flame_dash') {
        this.vx = this.dir * (this.isEnraged ? 9.5 : 8.0);
        if (particleSys) particleSys.triggerScreenShake(0.40, 9);
        if (dist < 130) player.takeDamage(62, soundEng, particleSys);
      } else if (this.attackType === 'magma_burst') {
        // Launches molten lava orbs from shoulder flames
        if (soundEng && soundEng.playMeteorExplosion) soundEng.playMeteorExplosion();
        if (window.game) {
          for (let m = 0; m < 3; m++) {
            window.game.spawnBossProjectile(new BossProjectile({
              x: this.x + this.w / 2 + (m - 1) * 30,
              y: this.y + 10,
              vx: this.dir * (3.8 + m * 1.4) + (Math.random() - 0.5) * 1.5,
              vy: -(5.8 + Math.random() * 2.0),
              w: 22,
              h: 22,
              type: 'magma_orb',
              damage: 52
            }));
          }
        }
      } else {
        // hellfire_cleave: Slams blazing cleaver down, releasing traveling wave of infernal fire
        if (particleSys) particleSys.triggerScreenShake(0.48, 12);
        if (soundEng && soundEng.playSwordSlash) soundEng.playSwordSlash();
        if (dist < 210 && Math.abs(dy) < 70) player.takeDamage(64, soundEng, particleSys);
        if (window.game) {
          window.game.spawnBossProjectile(new BossProjectile({
            x: this.x + (this.dir > 0 ? this.w : -32),
            y: 414,
            vx: this.dir * (this.isEnraged ? 7.0 : 5.5),
            vy: 0,
            w: 38,
            h: 42,
            type: 'hellfire_wave',
            damage: 56
          }));
        }
      }
    }
  }

  executeUltimate(player, soundEng, particleSys) {
    if (particleSys) particleSys.triggerScreenShake(0.85, 18);
    if (soundEng && soundEng.playMeteorExplosion) soundEng.playMeteorExplosion();

    const bType = (this.type === 'minotaur' || this.type === 'minos') ? 'minotaur' :
                  (this.type === 'frost_guardian' || this.type === 'glacior' || this.type === 'flegias') ? 'frost_guardian' :
                  'demon_slime';

    if (bType === 'minotaur') {
      // "Cataclismo del Titán": Roars with primal fury, slams axe into ground sending dual shockwaves and collapsing ceiling boulders
      this.ultimateName = 'Cataclismo del Titán';
      if (window.game) {
        [-1, 1].forEach(d => {
          for (let i = 0; i < 2; i++) {
            window.game.spawnBossProjectile(new BossProjectile({
              type: 'earth_shockwave',
              x: this.x + this.w / 2,
              y: 420,
              vx: d * (5.5 + i * 2.2),
              vy: 0,
              w: 36,
              h: 36,
              damage: 58
            }));
          }
        });
        const rockSpawns = [160, 320, 480, 640, 800, 960, 1080];
        rockSpawns.forEach((rx, idx) => {
          setTimeout(() => {
            if (window.game) {
              window.game.spawnBossProjectile(new BossProjectile({
                type: 'falling_rock',
                x: rx,
                y: 10,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 5.0 + Math.random() * 1.5,
                w: 30,
                h: 30,
                damage: 66
              }));
            }
          }, idx * 120);
        });
      }
    } else if (bType === 'frost_guardian') {
      // "Cero Absoluto": Ice storm raining 8 heavy icicles across arena and radiating frost lances
      this.ultimateName = 'Cero Absoluto';
      if (window.game) {
        const icicles = [140, 280, 420, 560, 700, 840, 980, 1080];
        icicles.forEach((ix, idx) => {
          setTimeout(() => {
            if (window.game) {
              window.game.spawnBossProjectile(new BossProjectile({
                type: 'icicle',
                x: ix,
                y: 15,
                vx: 0,
                vy: 3.8,
                damage: 64
              }));
            }
          }, idx * 100);
        });
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          window.game.spawnBossProjectile(new BossProjectile({
            x: this.x + this.w / 2,
            y: this.y + this.h / 2,
            vx: Math.cos(a) * 5.0,
            vy: Math.sin(a) * 5.0,
            w: 24,
            h: 12,
            type: 'frost_lance',
            damage: 48
          }));
        }
      }
    } else {
      // "Apocalipsis del Averno": Demon Slime unleashes twin hellfire waves and rains 7 burning meteors
      this.ultimateName = 'Apocalipsis del Averno';
      if (window.game) {
        [-1, 1].forEach(d => {
          window.game.spawnBossProjectile(new BossProjectile({
            type: 'hellfire_wave',
            x: this.x + this.w / 2,
            y: 414,
            vx: d * 6.0,
            vy: 0,
            w: 38,
            h: 42,
            damage: 60
          }));
        });
        for (let m = 0; m < 7; m++) {
          setTimeout(() => {
            if (window.game) {
              window.game.spawnBossProjectile(new BossProjectile({
                type: 'meteor',
                x: 150 + m * 140 + (Math.random() - 0.5) * 50,
                y: 10,
                vx: (Math.random() - 0.5) * 2.0,
                vy: 5.5 + Math.random() * 1.5,
                damage: 68
              }));
            }
          }, 140 * m);
        }
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
        const isMeleeAttack = (this.attackType === 'axe_slam' ||
                               this.attackType === 'frost_sweep' ||
                               this.attackType === 'frost_slam' ||
                               this.attackType === 'hellfire_cleave');
        if (isMeleeAttack) {
          const reachX = (this.attackType === 'axe_slam' || this.attackType === 'hellfire_cleave') ? 220 : 190;
          if (dist < reachX && Math.abs(dy) < 75) {
            const meleeDmg = this.isEnraged ? 64 : 56;
            player.takeDamage(meleeDmg, soundEng, particleSys);
            this.attackHitPlayer = true;
          }
        }
      }
      // If charge or dash attack, move continuously and damage player every frame!
      const isChargeAttack = (this.attackType === 'mud_charge' || this.attackType === 'flame_dash' ||
                              this.attackType === 'trident_dive' || this.attackType === 'malebranche_dash' ||
                              this.attackType === 'bull_charge');
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
          if (this.type === 'demon_slime' || this.type === 'azgalor') particleSys.spawnLavaBubble(this.x + this.w / 2, this.y + this.h);
          else if (this.type === 'minotaur') particleSys.spawnDust(this.x + this.w / 2, this.y + this.h, 3);
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

    if (this.state !== this.lastState) {
      this.lastState = this.state;
      this.animTimer = 0;
    }

    this.breathTimer += dt;
    this.animTimer += dt;
    this.animFrame = Math.floor(this.animTimer / 0.10);
  }

  draw(ctx, camX, camY) {
    if (this.isDead && this.deathAnimDone) return;
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    if (this.invulnerableTimer > 0 && Math.floor(Date.now() / 65) % 2 === 0) {
      ctx.globalAlpha = 0.55;
    }
    const breathY = (this.isDead || this.state === 'dead') ? 0 : Math.sin(this.breathTimer * 2.2) * 1.6;

    const bossMap = window.spriteManager ? window.spriteManager.sprites : null;
    let bossKey = this.type;
    if (bossKey === 'minos') bossKey = 'minotaur';
    else if (bossKey === 'glacior' || bossKey === 'flegias') bossKey = 'frost_guardian';
    else if (bossKey === 'azgalor' || bossKey === 'malacoda') bossKey = 'demon_slime';

    const bossSprites = (bossMap && bossMap.bosses && bossMap.bosses[bossKey]) ? bossMap.bosses[bossKey] :
                        (bossMap ? bossMap[bossKey] : null);

    let animList = null;
    let animSpeed = 0.10;
    let isLooping = true;

    if (this.isDead || this.state === 'dead') {
      if (bossSprites && bossSprites.death && bossSprites.death.length > 0) {
        animList = bossSprites.death;
        animSpeed = 0.09;
        isLooping = false;
      } else {
        this.deathAnimDone = true;
        ctx.restore();
        return;
      }
    } else if (this.state === 'windup' || this.state === 'attack' || this.state === 'ultimate_windup' || this.state === 'ultimate_cast') {
      if (bossSprites && bossSprites.attack && bossSprites.attack.length > 0) {
        animList = bossSprites.attack;
        animSpeed = 0.08;
      }
    } else if (this.invulnerableTimer > 0 && bossSprites && bossSprites.hurt && bossSprites.hurt.length > 0) {
      animList = bossSprites.hurt;
      animSpeed = 0.08;
    } else if (this.state === 'walk') {
      if (bossSprites && bossSprites.walk && bossSprites.walk.length > 0) {
        animList = bossSprites.walk;
        animSpeed = 0.09;
      }
    }

    if (!animList && bossSprites) {
      animList = bossSprites.idle;
      animSpeed = 0.10;
    }

    let frame = null;
    if (animList && animList.length > 0) {
      if (isLooping) {
        const idx = Math.floor(this.animTimer / animSpeed) % animList.length;
        frame = animList[idx] || animList[0];
      } else {
        const idx = Math.floor(this.animTimer / animSpeed);
        if (idx >= animList.length) {
          this.deathAnimDone = true;
          ctx.restore();
          return;
        }
        frame = animList[idx];
      }
    }

    // Anchor transform at feet bottom-center
    // Source boss sprites (Minotaur, Frost Guardian, Demon Slime) face LEFT by default:
    // multiply by -this.dir so dir=1 (moving right) flips right, and dir=-1 (moving left) faces left
    ctx.translate(rx + this.w / 2, ry + this.h + breathY);
    ctx.scale(-this.dir * this.scaleX, this.scaleY);

    if (frame) {
      if (this.isEnraged) {
        ctx.shadowColor = (bossKey === 'frost_guardian' ? '#00e5ff' : '#ff1a35');
        ctx.shadowBlur = 24 + Math.sin(Date.now() / 120) * 8;
      } else if (this.state === 'windup' || this.state === 'ultimate_windup') {
        ctx.shadowColor = (bossKey === 'frost_guardian' ? '#00e5ff' : (bossKey === 'demon_slime' ? '#ff3300' : '#ffaa00'));
        ctx.shadowBlur = 20;
      }

      // Exact pixel-perfect content anchors:
      // Minotaur (288x160): content center ~154, feet ~144
      // Frost Guardian (192x128): content center ~95, feet ~110
      // Demon Slime (288x160): content center ~145, feet ~158
      let offX = -154, offY = -144, dw = 288, dh = 160;
      if (bossKey === 'frost_guardian') {
        offX = -95;
        offY = -110;
        dw = 192;
        dh = 128;
      } else if (bossKey === 'demon_slime') {
        offX = -145;
        offY = -158;
        dw = 288;
        dh = 160;
      } else { // minotaur
        offX = -154;
        offY = -144;
        dw = 288;
        dh = 160;
      }

      ctx.drawImage(frame, offX, offY, dw, dh);
    } else {
      ctx.fillStyle = this.isEnraged ? '#ff2222' : '#882222';
      ctx.fillRect(-this.w / 2, -this.h, this.w, this.h);
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

// 3b. CRACKED BREAKABLE WALL (Secret Room Gate)
class CrackedWall {
  constructor(data) {
    this.id = data.id || ('cracked_wall_' + Math.random().toString(36).substr(2, 9));
    this.x = data.x;
    this.y = data.y;
    this.w = data.w || 32;
    this.h = data.h || 80;
    this.maxHp = data.hp || 50;
    this.hp = this.maxHp;
    this.isBroken = false;
    this.hitCooldown = 0;
    this.shakeTimer = 0;
    this.biome = data.biome || 'abyss';
  }

  update(dt) {
    if (this.hitCooldown > 0) this.hitCooldown -= dt;
    if (this.shakeTimer > 0) this.shakeTimer -= dt;
  }

  checkHit(attackHitbox, damage = 25, soundEng, particleSys) {
    if (this.isBroken || this.hitCooldown > 0) return false;
    if (attackHitbox.x + attackHitbox.w > this.x && attackHitbox.x < this.x + this.w &&
        attackHitbox.y + attackHitbox.h > this.y && attackHitbox.y < this.y + this.h) {
      this.hitCooldown = 0.2;
      this.shakeTimer = 0.18;
      this.hp -= damage;
      if (soundEng && soundEng.playHit) soundEng.playHit();
      if (particleSys) {
        particleSys.spawnDust(this.x + this.w / 2, this.y + this.h / 2, 8);
        if (particleSys.spawnSlashSparks) particleSys.spawnSlashSparks(this.x + this.w / 2, this.y + this.h / 2, 1);
      }
      if (this.hp <= 0) {
        this.break(soundEng, particleSys);
      }
      return true;
    }
    return false;
  }

  break(soundEng, particleSys) {
    if (this.isBroken) return;
    this.isBroken = true;
    this.hp = 0;
    if (soundEng) {
      if (soundEng.playUrnBreak) soundEng.playUrnBreak();
      if (soundEng.playChestOpen) soundEng.playChestOpen();
    }
    if (particleSys) {
      particleSys.spawnDust(this.x + this.w / 2, this.y + this.h / 2, 30);
      if (particleSys.spawnBloodExplosion) {
        particleSys.spawnBloodExplosion(this.x + this.w / 2, this.y + this.h / 2, 20);
      }
    }
    if (window.game && window.game.triggerScreenShake) {
      window.game.triggerScreenShake(7, 0.25);
    }
  }

  draw(ctx, camX, camY) {
    if (this.isBroken) return;
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    const shakeX = this.shakeTimer > 0 ? (Math.random() - 0.5) * 4 : 0;
    const shakeY = this.shakeTimer > 0 ? (Math.random() - 0.5) * 4 : 0;
    const drawX = rx + shakeX;
    const drawY = ry + shakeY;

    ctx.save();
    // Base dark basalt / stone wall block
    ctx.fillStyle = '#100b14';
    ctx.fillRect(drawX, drawY, this.w, this.h);

    // Stone blocks texture
    ctx.fillStyle = '#1c1524';
    ctx.fillRect(drawX + 2, drawY + 2, this.w - 4, this.h - 4);

    // Horizontal joints
    ctx.strokeStyle = '#08050a';
    ctx.lineWidth = 2;
    for (let yOffset = 20; yOffset < this.h; yOffset += 20) {
      ctx.beginPath();
      ctx.moveTo(drawX + 2, drawY + yOffset);
      ctx.lineTo(drawX + this.w - 2, drawY + yOffset);
      ctx.stroke();
    }

    // Cracks based on health damage
    const damageRatio = 1 - (this.hp / this.maxHp);
    ctx.strokeStyle = damageRatio > 0.5 ? '#ff3b30' : '#8b5cf6';
    ctx.shadowColor = damageRatio > 0.5 ? 'rgba(255, 59, 48, 0.7)' : 'rgba(139, 92, 246, 0.6)';
    ctx.shadowBlur = 6;
    ctx.lineWidth = damageRatio > 0.5 ? 2.5 : 1.5;

    // Fissure 1 (vertical jagged line)
    ctx.beginPath();
    ctx.moveTo(drawX + this.w * 0.4, drawY + 6);
    ctx.lineTo(drawX + this.w * 0.6, drawY + 24);
    ctx.lineTo(drawX + this.w * 0.35, drawY + 48);
    ctx.lineTo(drawX + this.w * 0.55, drawY + 70);
    ctx.stroke();

    // Fissure 2 (if damaged)
    if (damageRatio > 0.3) {
      ctx.beginPath();
      ctx.moveTo(drawX + this.w * 0.6, drawY + 24);
      ctx.lineTo(drawX + this.w * 0.8, drawY + 36);
      ctx.lineTo(drawX + this.w * 0.7, drawY + 60);
      ctx.stroke();
    }
    if (damageRatio > 0.6) {
      ctx.beginPath();
      ctx.moveTo(drawX + this.w * 0.35, drawY + 48);
      ctx.lineTo(drawX + this.w * 0.15, drawY + 58);
      ctx.stroke();
    }

    // Glowing crack pulse
    ctx.fillStyle = damageRatio > 0.5 ? 'rgba(255, 60, 60, 0.25)' : 'rgba(147, 51, 234, 0.2)';
    ctx.fillRect(drawX + 4, drawY + 4, this.w - 8, this.h - 8);

    ctx.restore();
  }
}

// 3c. BLOOD SACRIFICE ALTAR (Dark Pacts)
class BloodAltar {
  constructor(data) {
    this.id = data.id || ('blood_altar_' + Math.random().toString(36).substr(2, 9));
    this.x = data.x;
    this.y = data.y;
    this.w = data.w || 44;
    this.h = data.h || 52;
    this.isUsed = false;
    this.isNear = false;
    this.pulseTime = 0;
  }

  update(dt, player) {
    this.pulseTime += dt;
    if (this.isUsed) {
      this.isNear = false;
      return;
    }
    const dist = Math.hypot(
      (player.x + player.w / 2) - (this.x + this.w / 2),
      (player.y + player.h / 2) - (this.y + this.h / 2)
    );
    this.isNear = dist < 70;
  }

  use() {
    this.isUsed = true;
    this.isNear = false;
  }

  draw(ctx, camX, camY) {
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    // Pedestal Base (Obsidian steps)
    ctx.fillStyle = '#0f0507';
    ctx.fillRect(rx, ry + this.h - 12, this.w, 12);
    ctx.fillStyle = '#22090e';
    ctx.fillRect(rx + 4, ry + this.h - 22, this.w - 8, 10);
    ctx.fillStyle = '#140508';
    ctx.fillRect(rx + 8, ry + 16, this.w - 16, this.h - 38);

    // Glowing Crimson Veins
    const pulse = Math.sin(this.pulseTime * 3) * 0.3 + 0.7;
    ctx.strokeStyle = this.isUsed ? '#4a151b' : `rgba(239, 68, 68, ${pulse})`;
    ctx.shadowColor = this.isUsed ? 'transparent' : '#ef4444';
    ctx.shadowBlur = this.isUsed ? 0 : 8;
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(rx + 14, ry + this.h - 10);
    ctx.lineTo(rx + 18, ry + this.h - 24);
    ctx.lineTo(rx + 14, ry + 24);
    ctx.lineTo(rx + 22, ry + 14);
    ctx.moveTo(rx + this.w - 14, ry + this.h - 10);
    ctx.lineTo(rx + this.w - 18, ry + this.h - 24);
    ctx.lineTo(rx + this.w - 14, ry + 24);
    ctx.lineTo(rx + 22, ry + 14);
    ctx.stroke();

    // Chalice Basin atop the Altar
    ctx.fillStyle = '#4a0e17';
    ctx.beginPath();
    ctx.ellipse(rx + this.w / 2, ry + 14, 12, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Blood Flame / Orb in chalice
    if (!this.isUsed) {
      const flameWobble = Math.sin(this.pulseTime * 6) * 1.5;
      const flameGrad = ctx.createRadialGradient(
        rx + this.w / 2, ry + 9 + flameWobble, 1,
        rx + this.w / 2, ry + 9 + flameWobble, 9
      );
      flameGrad.addColorStop(0, '#ffffff');
      flameGrad.addColorStop(0.3, '#ff2244');
      flameGrad.addColorStop(0.8, '#880015');
      flameGrad.addColorStop(1, 'rgba(40, 0, 8, 0)');

      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.arc(rx + this.w / 2, ry + 9 + flameWobble, 9, 0, Math.PI * 2);
      ctx.fill();

      // Floating Skull Rune above
      ctx.fillStyle = `rgba(255, 100, 100, ${pulse * 0.8})`;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🩸', rx + this.w / 2, ry - 4 + flameWobble);
    } else {
      // Extinguished ashes in chalice
      ctx.fillStyle = '#2b1b1d';
      ctx.beginPath();
      ctx.arc(rx + this.w / 2, ry + 13, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3d. RUNIC BELL & SPECTRAL PLATFORMS (Interactive Platform Puzzle)
// ─────────────────────────────────────────────────────────────────────────────

class SpectralPlatform {
  constructor(data) {
    this.id = data.id || ('spectral_' + Math.random().toString(36).substr(2, 9));
    this.x = data.x;
    this.y = data.y;
    this.w = data.w || 96;
    this.h = data.h || 16;
    this.activeTimer = 0;
    this.maxDuration = data.duration || 5.5;
    this.pulseTime = 0;
    this.color = data.color || '#38bdf8';
    this.isSpectral = true;
    this.isSemiSolid = true;
  }

  get isSolid() {
    return this.activeTimer > 0;
  }

  activate(duration = 5.5) {
    this.activeTimer = duration;
    this.maxDuration = duration;
  }

  update(dt) {
    this.pulseTime += dt;
    if (this.activeTimer > 0) {
      this.activeTimer = Math.max(0, this.activeTimer - dt);
    }
  }

  draw(ctx, camX, camY) {
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    if (this.activeTimer > 0) {
      let alpha = 0.85;
      if (this.activeTimer < 1.5) {
        alpha = Math.floor(this.activeTimer * 8) % 2 === 0 ? 0.3 : 0.9;
      }

      ctx.fillStyle = `rgba(14, 165, 233, ${alpha * 0.35})`;
      ctx.fillRect(rx, ry, this.w, this.h);

      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(rx, ry, this.w, this.h);

      // Top glowing bar
      ctx.fillStyle = `rgba(224, 242, 254, ${alpha})`;
      ctx.fillRect(rx + 2, ry + 1, this.w - 4, 3);

      // Runic glyphs along the body
      ctx.fillStyle = `rgba(186, 230, 253, ${alpha * 0.9})`;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      const step = 24;
      for (let gx = rx + step; gx < rx + this.w; gx += step) {
        ctx.fillText('ᚱ', gx, ry + 12);
      }
    } else {
      const ghostPulse = (Math.sin(this.pulseTime * 2) * 0.12) + 0.15;
      ctx.strokeStyle = `rgba(56, 189, 248, ${ghostPulse})`;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeRect(rx, ry, this.w, this.h);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
}

class RunicBell {
  constructor(data) {
    this.id = data.id || ('bell_' + Math.random().toString(36).substr(2, 9));
    this.x = data.x;
    this.y = data.y;
    this.w = data.w || 36;
    this.h = data.h || 48;
    this.swingAngle = 0;
    this.swingVel = 0;
    this.cooldown = 0;
    this.targetPlatformIds = data.targetPlatformIds || [];
    this.ringTime = 0;
  }

  checkHit(swordHitbox, soundEngine, particleSys, camera) {
    if (this.cooldown > 0) return false;
    if (
      swordHitbox.x < this.x + this.w &&
      swordHitbox.x + swordHitbox.w > this.x &&
      swordHitbox.y < this.y + this.h &&
      swordHitbox.y + swordHitbox.h > this.y
    ) {
      this.strike(soundEngine, particleSys, camera);
      return true;
    }
    return false;
  }

  strike(soundEngine, particleSys, camera) {
    this.cooldown = 0.6;
    this.swingVel = 8.0;
    this.ringTime = 1.0;

    if (soundEngine && soundEngine.play) {
      soundEngine.play('altar_use', 1.2);
    }
    if (camera && camera.shake) {
      camera.shake(3, 0.25);
    }
    if (particleSys && particleSys.spawnSparks) {
      particleSys.spawnSparks(this.x + this.w / 2, this.y + this.h / 2, 16, '#38bdf8');
    }
  }

  update(dt, spectralPlatforms) {
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.ringTime > 0) {
      this.ringTime -= dt;
      if (spectralPlatforms) {
        for (const sp of spectralPlatforms) {
          if (this.targetPlatformIds.includes(sp.id)) {
            sp.activate(5.5);
          }
        }
      }
    }

    const springK = 35.0;
    const damping = 4.5;
    const accel = -springK * this.swingAngle - damping * this.swingVel;
    this.swingVel += accel * dt;
    this.swingAngle += this.swingVel * dt;
  }

  draw(ctx, camX, camY) {
    const rx = Math.round(this.x + this.w / 2 - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    ctx.translate(rx, ry);

    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 0);
    ctx.stroke();

    ctx.rotate(this.swingAngle);

    const bellGrad = ctx.createLinearGradient(-14, 0, 14, this.h);
    bellGrad.addColorStop(0, '#f59e0b');
    bellGrad.addColorStop(0.5, '#b45309');
    bellGrad.addColorStop(1, '#78350f');

    ctx.fillStyle = bellGrad;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(6, 0);
    ctx.quadraticCurveTo(12, 18, 16, this.h - 6);
    ctx.lineTo(-16, this.h - 6);
    ctx.quadraticCurveTo(-12, 18, -6, 0);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.fillRect(-18, this.h - 6, 36, 6);

    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(0, this.h + 2, 4, 0, Math.PI * 2);
    ctx.fill();

    if (this.ringTime > 0) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.beginPath();
      ctx.arc(0, this.h / 2, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3e. SEESAW TILTING PLATFORM (Báscula / Balancín Dinámico)
// ─────────────────────────────────────────────────────────────────────────────

class SeesawPlatform {
  constructor(data) {
    this.id = data.id || ('seesaw_' + Math.random().toString(36).substr(2, 9));
    this.pivotX = data.x;
    this.pivotY = data.y;
    this.w = data.w || 180;
    this.h = 14;
    this.angle = 0;
    this.angleVel = 0;
    this.maxAngle = 0.42;
    this.isSemiSolid = true;
    this.isSeesaw = true;
  }

  get bounds() {
    return {
      x: this.pivotX - this.w / 2 - 10,
      y: this.pivotY - 40,
      w: this.w + 20,
      h: 80
    };
  }

  update(dt, player) {
    const springK = 8.0;
    const damping = 4.0;
    let torque = -springK * this.angle - damping * this.angleVel;

    if (player) {
      const pCenterX = player.x + player.w / 2;
      const pBottom = player.y + player.h;
      const beamHalf = this.w / 2;

      if (pCenterX >= this.pivotX - beamHalf && pCenterX <= this.pivotX + beamHalf) {
        const relX = pCenterX - this.pivotX;
        const beamSurfaceY = this.pivotY + relX * Math.tan(this.angle) - 4;

        if (pBottom >= beamSurfaceY - 8 && pBottom <= beamSurfaceY + 18 && player.vy >= 0) {
          player.y = beamSurfaceY - player.h;
          player.vy = 0;
          player.isGrounded = true;

          const playerWeightTorque = (relX / beamHalf) * 45.0;
          torque += playerWeightTorque;

          if (Math.abs(this.angle) > 0.22) {
            player.x += Math.sin(this.angle) * 110 * dt;
          }
        }
      }
    }

    this.angleVel += torque * dt;
    this.angle += this.angleVel * dt;

    if (this.angle > this.maxAngle) {
      this.angle = this.maxAngle;
      this.angleVel = 0;
    } else if (this.angle < -this.maxAngle) {
      this.angle = -this.maxAngle;
      this.angleVel = 0;
    }
  }

  draw(ctx, camX, camY) {
    const rx = Math.round(this.pivotX - camX);
    const ry = Math.round(this.pivotY - camY);

    ctx.save();

    // Pivot Stand
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.moveTo(rx - 14, ry + 22);
    ctx.lineTo(rx + 14, ry + 22);
    ctx.lineTo(rx, ry);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rotating Beam
    ctx.translate(rx, ry);
    ctx.rotate(this.angle);

    ctx.fillStyle = '#451a03';
    ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);

    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.strokeRect(-this.w / 2, -this.h / 2, this.w, this.h);

    ctx.fillStyle = '#52525b';
    ctx.fillRect(-8, -this.h / 2 - 2, 16, this.h + 4);
    ctx.fillRect(-this.w / 2, -this.h / 2 - 1, 8, this.h + 2);
    ctx.fillRect(this.w / 2 - 8, -this.h / 2 - 1, 8, this.h + 2);

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3f. ASCENSION VORTEX (Esferas / Vórtices de Salto Arcana)
// ─────────────────────────────────────────────────────────────────────────────

class AscensionVortex {
  constructor(data) {
    this.id = data.id || ('vortex_' + Math.random().toString(36).substr(2, 9));
    this.x = data.x;
    this.y = data.y;
    this.baseY = data.y;
    this.radius = data.radius || 24;
    this.boostPower = data.boostPower || 13.5;
    this.cooldown = 0;
    this.floatTimer = Math.random() * Math.PI * 2;
  }

  update(dt, player, soundEngine, particleSys) {
    this.floatTimer += dt * 2.5;
    this.y = this.baseY + Math.sin(this.floatTimer) * 6;
    if (this.cooldown > 0) {
      this.cooldown -= dt;
      return;
    }

    if (!player) return;
    const pCenterX = player.x + player.w / 2;
    const pCenterY = player.y + player.h / 2;
    const dist = Math.hypot(pCenterX - this.x, pCenterY - this.y);

    if (dist < this.radius + 12) {
      player.vy = -this.boostPower;
      player.vx *= 0.6;
      player.isGrounded = false;
      this.cooldown = 1.0;

      if (soundEngine && soundEngine.play) {
        soundEngine.play('whoosh', 1.4);
      }
      if (particleSys && particleSys.spawnSparks) {
        particleSys.spawnSparks(this.x, this.y, 22, '#38bdf8');
      }
      if (particleSys && particleSys.spawnHealingCrosses) {
        particleSys.spawnHealingCrosses(this.x, this.y, 6);
      }
    }
  }

  draw(ctx, camX, camY) {
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();
    const ready = this.cooldown <= 0;
    const alpha = ready ? 0.75 : 0.25;

    const grad = ctx.createRadialGradient(rx, ry, 4, rx, ry, this.radius);
    grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    grad.addColorStop(0.4, `rgba(56, 189, 248, ${alpha * 0.8})`);
    grad.addColorStop(0.8, `rgba(99, 102, 241, ${alpha * 0.4})`);
    grad.addColorStop(1, 'rgba(79, 70, 229, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(rx, ry, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = ready ? '#bae6fd' : '#64748b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    const rot = this.floatTimer * 3;
    for (let i = 0; i < 3; i++) {
      const angle = rot + (i * Math.PI * 2) / 3;
      const cx = rx + Math.cos(angle) * (this.radius * 0.55);
      const cy = ry + Math.sin(angle) * (this.radius * 0.55);
      ctx.moveTo(rx, ry);
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3g. FAMILIAR CAGE & FAMILIAR COMPANIONS (Mascotas Rescatables)
// ─────────────────────────────────────────────────────────────────────────────

class FamiliarCage {
  constructor(data) {
    this.id = data.id || ('cage_' + Math.random().toString(36).substr(2, 9));
    this.x = data.x;
    this.y = data.y;
    this.w = 36;
    this.h = 44;
    this.familiarId = data.familiarId || 'ignis'; // 'ignis', 'aura', or 'borus'
    this.hp = 25;
    this.maxHp = 25;
    this.isBroken = false;
    this.shakeTimer = 0;
  }

  checkHit(swordHitbox, soundEngine, particleSys, camera, progression) {
    if (this.isBroken) return false;
    if (
      swordHitbox.x < this.x + this.w &&
      swordHitbox.x + swordHitbox.w > this.x &&
      swordHitbox.y < this.y + this.h &&
      swordHitbox.y + swordHitbox.h > this.y
    ) {
      this.hp -= swordHitbox.damage || 25;
      this.shakeTimer = 0.25;

      if (soundEngine && soundEngine.play) {
        soundEngine.play('clank', 1.0);
      }
      if (particleSys && particleSys.spawnSparks) {
        particleSys.spawnSparks(this.x + this.w / 2, this.y + this.h / 2, 10, '#fbbf24');
      }

      if (this.hp <= 0) {
        this.isBroken = true;
        if (soundEngine && soundEngine.play) {
          soundEngine.play('secret_found', 1.2);
        }
        if (camera && camera.shake) {
          camera.shake(5, 0.4);
        }
        if (particleSys && particleSys.spawnLevelUpFireworks) {
          particleSys.spawnLevelUpFireworks(this.x + this.w / 2, this.y + this.h / 2);
        }
        if (progression && progression.unlockFamiliar) {
          progression.unlockFamiliar(this.familiarId);
        }
      }
      return true;
    }
    return false;
  }

  update(dt) {
    if (this.shakeTimer > 0) this.shakeTimer -= dt;
  }

  draw(ctx, camX, camY) {
    if (this.isBroken) return;
    const rx = Math.round(this.x - camX + (this.shakeTimer > 0 ? (Math.random() - 0.5) * 4 : 0));
    const ry = Math.round(this.y - camY);

    ctx.save();
    ctx.strokeStyle = '#71717a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(rx + this.w / 2, ry - 30);
    ctx.lineTo(rx + this.w / 2, ry);
    ctx.stroke();

    const glowColor = this.familiarId === 'ignis' ? '#ef4444' : (this.familiarId === 'aura' ? '#fbbf24' : '#94a3b8');
    ctx.fillStyle = glowColor;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(rx + this.w / 2, ry + this.h / 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#18181b';
    ctx.fillRect(rx, ry, this.w, 4);
    ctx.fillRect(rx, ry + this.h - 4, this.w, 4);

    ctx.strokeStyle = '#a1a1aa';
    ctx.lineWidth = 2;
    for (let bx = rx + 6; bx < rx + this.w; bx += 8) {
      ctx.beginPath();
      ctx.moveTo(bx, ry);
      ctx.lineTo(bx, ry + this.h);
      ctx.stroke();
    }

    ctx.restore();
  }
}

class Familiar {
  constructor(familiarId = null) {
    this.id = familiarId; // 'ignis', 'aura', 'borus' or null
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.bobTimer = 0;
    this.attackCooldown = 0;
    this.projectiles = [];
  }

  setFamiliar(familiarId) {
    this.id = familiarId;
  }

  update(dt, player, enemies, bats, soulOrbs, soundEngine, particleSys) {
    if (!this.id || !player) return;
    this.bobTimer += dt * 3.5;

    const targetX = player.x + (player.facing === 'right' ? -22 : player.w + 14);
    const targetY = player.y - 18 + Math.sin(this.bobTimer) * 5;

    if (this.x === 0 && this.y === 0) {
      this.x = targetX;
      this.y = targetY;
    }

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    this.vx += (dx * 12.0 - this.vx * 6.0) * dt;
    this.vy += (dy * 12.0 - this.vy * 6.0) * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Update active projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      let hit = false;
      const allTargets = (enemies || []).concat(bats || []);
      for (const t of allTargets) {
        if (!t || t.isDead || t.hp <= 0) continue;
        if (Math.hypot(p.x - (t.x + (t.w || 24) / 2), p.y - (t.y + (t.h || 24) / 2)) < 24) {
          if (t.takeDamage) {
            t.takeDamage(p.damage, 0, particleSys, soundEngine);
          } else {
            t.hp -= p.damage;
          }
          hit = true;
          if (particleSys && particleSys.spawnSparks) {
            particleSys.spawnSparks(p.x, p.y, 8, '#ef4444');
          }
          break;
        }
      }

      if (hit || p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }

    if (this.id === 'ignis') {
      if (this.attackCooldown > 0) {
        this.attackCooldown -= dt;
      } else {
        const allTargets = (enemies || []).concat(bats || []);
        let closest = null;
        let closestDist = 220;
        for (const t of allTargets) {
          if (!t || t.isDead || t.hp <= 0) continue;
          const d = Math.hypot(this.x - (t.x + (t.w || 24) / 2), this.y - (t.y + (t.h || 24) / 2));
          if (d < closestDist) {
            closestDist = d;
            closest = t;
          }
        }

        if (closest) {
          const tX = closest.x + (closest.w || 24) / 2;
          const tY = closest.y + (closest.h || 24) / 2;
          const angle = Math.atan2(tY - this.y, tX - this.x);
          this.projectiles.push({
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * 320,
            vy: Math.sin(angle) * 320,
            damage: 18,
            life: 1.2
          });
          this.attackCooldown = 1.8;
          if (soundEngine && soundEngine.play) soundEngine.play('fireball', 0.8);
        }
      }

      if (soulOrbs) {
        for (const orb of soulOrbs) {
          if (!orb || orb.collected) continue;
          const d = Math.hypot(this.x - orb.x, this.y - orb.y);
          if (d < 140 && d > 4) {
            const pullAngle = Math.atan2(this.y - orb.y, this.x - orb.x);
            orb.vx = (orb.vx || 0) + Math.cos(pullAngle) * 350 * dt;
            orb.vy = (orb.vy || 0) + Math.sin(pullAngle) * 350 * dt;
          }
        }
      }
    } else if (this.id === 'aura') {
      if (Math.random() < 0.2 && particleSys && particleSys.spawnSparks) {
        particleSys.spawnSparks(this.x + (Math.random() - 0.5) * 8, this.y + (Math.random() - 0.5) * 8, 1, '#fde047');
      }
    } else if (this.id === 'borus') {
      if (player.vy > 6.0 && !player.isGrounded) {
        player.vy = Math.min(player.vy, 4.2);
        if (Math.random() < 0.25 && particleSys && particleSys.spawnSparks) {
          particleSys.spawnSparks(player.x + player.w / 2, player.y + player.h, 2, '#94a3b8');
        }
      }
    }
  }

  draw(ctx, camX, camY) {
    if (!this.id) return;
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();

    for (const p of this.projectiles) {
      const px = Math.round(p.x - camX);
      const py = Math.round(p.y - camY);
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(px, py, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    if (this.id === 'ignis') {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(rx, ry, 6, 0, Math.PI * 2);
      ctx.fill();

      const wingFlap = Math.sin(this.bobTimer * 4) * 5;
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(rx - 6, ry);
      ctx.lineTo(rx - 14, ry - wingFlap);
      ctx.lineTo(rx - 8, ry + 4);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(rx + 6, ry);
      ctx.lineTo(rx + 14, ry - wingFlap);
      ctx.lineTo(rx + 8, ry + 4);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.fillRect(rx - 3, ry - 2, 2, 2);
      ctx.fillRect(rx + 1, ry - 2, 2, 2);
    } else if (this.id === 'aura') {
      const grad = ctx.createRadialGradient(rx, ry, 2, rx, ry, 16);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, '#fde047');
      grad.addColorStop(0.8, 'rgba(234, 179, 8, 0.4)');
      grad.addColorStop(1, 'rgba(234, 179, 8, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rx, ry, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(rx, ry, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.id === 'borus') {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(rx, ry, 7, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(rx - 4, ry - 5);
      ctx.lineTo(rx - 6, ry - 11);
      ctx.lineTo(rx - 1, ry - 6);
      ctx.moveTo(rx + 4, ry - 5);
      ctx.lineTo(rx + 6, ry - 11);
      ctx.lineTo(rx + 1, ry - 6);
      ctx.fill();

      const wingFlap = Math.sin(this.bobTimer * 3) * 4;
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(rx - 5, ry);
      ctx.lineTo(rx - 12, ry - wingFlap);
      ctx.lineTo(rx - 6, ry + 5);
      ctx.moveTo(rx + 5, ry);
      ctx.lineTo(rx + 12, ry - wingFlap);
      ctx.lineTo(rx + 6, ry + 5);
      ctx.fill();
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
    this.isLongLadder = !!data.isLongLadder || (this.h >= 200);
  }

  draw(ctx, camX, camY) {
    const rx = Math.round(this.x - camX);
    const ry = Math.round(this.y - camY);

    ctx.save();

    // Heavy iron anchor plates for solitary long ladders into the dungeon wall
    if (this.isLongLadder) {
      for (let ay = ry + 20; ay < ry + this.h - 12; ay += 48) {
        ctx.fillStyle = '#0f0c14';
        ctx.fillRect(rx - 7, ay, 6, 7);
        ctx.fillRect(rx + this.w + 1, ay, 6, 7);
        ctx.fillStyle = this.type === 'gold' ? '#92400e' : '#392d42';
        ctx.fillRect(rx - 6, ay + 1, 4, 5);
        ctx.fillRect(rx + this.w + 2, ay + 1, 4, 5);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(rx - 5, ay + 2, 2, 2);
        ctx.fillRect(rx + this.w + 3, ay + 2, 2, 2);
      }
    }

    // Top and bottom mounting flanges
    ctx.fillStyle = this.type === 'gold' ? '#78350f' : '#17111b';
    ctx.fillRect(rx - 3, ry, this.w + 6, 4);
    ctx.fillRect(rx - 3, ry + this.h - 4, this.w + 6, 4);

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

    // Natural stone fractures & fissures
    ctx.fillStyle = this.isTriggered ? '#ff4400' : '#140c0f';
    const numCracks = Math.max(2, Math.floor(this.w / 34));
    for (let c = 1; c <= numCracks; c++) {
      const cx = rx + Math.floor((c * this.w) / (numCracks + 1));
      ctx.fillRect(cx, ry + 2, 2, 4);
      ctx.fillRect(cx + 1, ry + 6, 2, 5);
      ctx.fillRect(cx - 1, ry + 11, 2, 5);
      ctx.fillRect(cx, ry + 16, 2, Math.max(2, this.h - 18));
      if (this.isTriggered) {
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(cx, ry + 3, 1, 3);
        ctx.fillStyle = '#ff4400';
      }
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
    this.type = data.type; // 'earth_shockwave', 'falling_rock', 'ice_spike', 'hellfire_wave', 'magma_orb', 'frost_lance', 'icicle', 'meteor', 'tornado', 'styx_wave', 'judgment_lightning'
    this.damage = data.damage || 20;
    this.life = 0;
    this.delay = data.delay || 0;
    this.maxLife = data.maxLife || (data.type === 'ice_spike' ? 1.4 : (data.type === 'earth_shockwave' || data.type === 'hellfire_wave' ? 3.5 : (data.type === 'judgment_lightning' ? 1.25 : (data.type === 'styx_wave' ? 5.0 : 4.5))));
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

    // 1. Earth Shockwave (Minotaur Axe Ground Fissure) & Hellfire Wave (Demon Slime Cleaver Wave)
    if (this.type === 'earth_shockwave' || this.type === 'hellfire_wave') {
      this.x += this.vx * dt * 60;
      if (particleSys && Math.random() < 0.35) {
        if (this.type === 'earth_shockwave') particleSys.spawnDust(this.x + this.w / 2, 448, 2);
        else particleSys.spawnSlashSparks(this.x + this.w / 2, 436, this.vx * 0.1);
      }
      if (Math.abs((this.x + this.w / 2) - (player.x + player.w / 2)) < (this.w / 2 + player.w / 2) &&
          Math.abs((this.y + this.h / 2) - (player.y + player.h / 2)) < (this.h / 2 + player.h / 2)) {
        player.takeDamage(this.damage, soundEng, particleSys);
        player.vx = Math.sign(this.vx) * 6.5;
        this.isDead = true;
      }
      return;
    }

    // 2. Falling Cavern Rock (Minotaur Tremor Stomp / Cataclysm)
    if (this.type === 'falling_rock') {
      this.vy += 0.36;
      this.y += this.vy * dt * 60;
      this.x += this.vx * dt * 60;
      if (this.y >= 436) {
        if (particleSys) {
          particleSys.triggerScreenShake(0.32, 8);
          particleSys.spawnDust(this.x + this.w / 2, 442, 14);
        }
        if (soundEng && soundEng.playMeteorExplosion) soundEng.playMeteorExplosion();
        const dist = Math.hypot((this.x + this.w / 2) - (player.x + player.w / 2), 440 - (player.y + player.h / 2));
        if (dist < 55) {
          player.takeDamage(this.damage, soundEng, particleSys);
        }
        this.isDead = true;
      } else if (Math.abs((this.x + this.w / 2) - (player.x + player.w / 2)) < (this.w / 2 + player.w / 2) &&
                 Math.abs((this.y + this.h / 2) - (player.y + player.h / 2)) < (this.h / 2 + player.h / 2)) {
        player.takeDamage(this.damage, soundEng, particleSys);
        this.isDead = true;
      }
      return;
    }

    // 3. Ice Spike (Frost Guardian Fists Slam)
    if (this.type === 'ice_spike') {
      if (this.delay && this.delay > 0) {
        this.delay -= dt;
        return;
      }
      if (!this.hasStruck) {
        this.hasStruck = true;
        if (particleSys) particleSys.spawnSlashSparks(this.x + this.w / 2, 440, 0);
      }
      if (!this.hasHit && Math.abs((this.x + this.w / 2) - (player.x + player.w / 2)) < (this.w / 2 + player.w / 2) &&
          player.y + player.h >= 410) {
        player.takeDamage(this.damage, soundEng, particleSys);
        player.vy = -6.0;
        this.hasHit = true;
      }
      return;
    }

    // 4. Magma Orb (Demon Slime Shoulder Flames)
    if (this.type === 'magma_orb') {
      if (!this.isPuddle) {
        this.vy += 0.35;
        this.x += this.vx * dt * 60;
        this.y += this.vy * dt * 60;
        if (this.y >= 440) {
          this.isPuddle = true;
          this.y = 444;
          this.vx = 0;
          this.vy = 0;
          this.w = 50;
          this.h = 12;
          this.life = 0;
          this.maxLife = 3.2;
          if (particleSys) particleSys.spawnLavaBubble(this.x + 25, this.y);
        }
      }
      if (Math.abs((this.x + this.w / 2) - (player.x + player.w / 2)) < (this.w / 2 + player.w / 2) &&
          Math.abs((this.y + this.h / 2) - (player.y + player.h / 2)) < (this.h / 2 + player.h / 2)) {
        player.takeDamage(this.damage, soundEng, particleSys);
        if (!this.isPuddle) this.isDead = true;
      }
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

    if (this.type === 'earth_shockwave') {
      // Jagged earth fissure / rock spikes moving along the floor
      const dir = Math.sign(this.vx) || 1;
      ctx.save();
      ctx.translate(rx + this.w / 2, ry + this.h);
      if (dir < 0) ctx.scale(-1, 1);

      // Dark earth back
      ctx.fillStyle = '#2d1b00';
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(-8, -26);
      ctx.lineTo(2, -34);
      ctx.lineTo(8, -24);
      ctx.lineTo(16, 0);
      ctx.closePath();
      ctx.fill();

      // Sharp craggy stone slabs
      ctx.fillStyle = '#5c4033';
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(-6, -24);
      ctx.lineTo(0, -32);
      ctx.lineTo(6, -20);
      ctx.lineTo(12, 0);
      ctx.closePath();
      ctx.fill();

      // Stone highlights & jagged crack lines
      ctx.fillStyle = '#8b6f4e';
      ctx.beginPath();
      ctx.moveTo(-4, -6);
      ctx.lineTo(0, -32);
      ctx.lineTo(4, -18);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#c4a482';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(-3, -12);
      ctx.lineTo(2, 0);
      ctx.stroke();

      ctx.restore();
    } else if (this.type === 'falling_rock') {
      // Rotating craggy cavern boulder
      ctx.save();
      ctx.translate(rx + this.w / 2, ry + this.h / 2);
      ctx.rotate(this.life * 5.0 * (Math.sign(this.vx) || 1));

      // Boulder body
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.moveTo(-14, -6);
      ctx.lineTo(-8, -14);
      ctx.lineTo(6, -13);
      ctx.lineTo(14, -4);
      ctx.lineTo(12, 10);
      ctx.lineTo(2, 14);
      ctx.lineTo(-11, 11);
      ctx.closePath();
      ctx.fill();

      // Surface facet shading
      ctx.fillStyle = '#44403c';
      ctx.beginPath();
      ctx.moveTo(-8, -14);
      ctx.lineTo(6, -13);
      ctx.lineTo(2, -2);
      ctx.lineTo(-6, 2);
      ctx.closePath();
      ctx.fill();

      // Rough rock highlight & fracture
      ctx.strokeStyle = '#78716c';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-4, -10);
      ctx.lineTo(0, 0);
      ctx.lineTo(8, 6);
      ctx.stroke();

      ctx.restore();
    } else if (this.type === 'ice_spike') {
      if (this.delay && this.delay > 0) {
        // Frost telegraph rune on floor
        const pulse = Math.sin(this.life * 25) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(56, 189, 248, ${0.4 * pulse})`;
        ctx.beginPath();
        ctx.ellipse(rx + this.w / 2, 444 - camY, 18, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e0f2fe';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // Erupting sharp glacier crystal
        const growProgress = Math.min(1.0, (this.life - (this.delay || 0)) / 0.12);
        const spikeH = this.h * Math.sin(growProgress * Math.PI * 0.5);
        const spikeBottom = ry + this.h;
        const spikeTop = spikeBottom - spikeH;

        ctx.save();
        // Deep ice base
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.moveTo(rx, spikeBottom);
        ctx.lineTo(rx + this.w / 2, spikeTop);
        ctx.lineTo(rx + this.w, spikeBottom);
        ctx.closePath();
        ctx.fill();

        // Crystalline bright facet
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(rx + 4, spikeBottom);
        ctx.lineTo(rx + this.w / 2, spikeTop);
        ctx.lineTo(rx + this.w - 3, spikeBottom);
        ctx.closePath();
        ctx.fill();

        // Brilliant glacial spine / specular glint
        ctx.fillStyle = '#f0f9ff';
        ctx.beginPath();
        ctx.moveTo(rx + this.w / 2 - 2, spikeBottom);
        ctx.lineTo(rx + this.w / 2, spikeTop + 2);
        ctx.lineTo(rx + this.w / 2 + 2, spikeBottom);
        ctx.closePath();
        ctx.fill();

        // Shimmering outline
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rx + 2, spikeBottom);
        ctx.lineTo(rx + this.w / 2, spikeTop);
        ctx.lineTo(rx + this.w - 2, spikeBottom);
        ctx.stroke();
        ctx.restore();
      }
    } else if (this.type === 'hellfire_wave') {
      const dir = Math.sign(this.vx) || 1;
      const flicker = Math.sin(this.life * 24) * 4;
      ctx.save();
      ctx.translate(rx + this.w / 2, ry + this.h);
      if (dir < 0) ctx.scale(-1, 1);

      // Dark crimson fire foundation
      ctx.fillStyle = 'rgba(153, 27, 27, 0.9)';
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.quadraticCurveTo(-6, -20, 4, -36 + flicker);
      ctx.quadraticCurveTo(10, -22, 18, 0);
      ctx.closePath();
      ctx.fill();

      // Blazing orange inner flame
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.quadraticCurveTo(-3, -16, 4, -30 + flicker);
      ctx.quadraticCurveTo(8, -16, 14, 0);
      ctx.closePath();
      ctx.fill();

      // Golden solar core
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(-6, 0);
      ctx.quadraticCurveTo(0, -12, 3, -22 + flicker);
      ctx.quadraticCurveTo(5, -10, 8, 0);
      ctx.closePath();
      ctx.fill();

      // White hot heart
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2, -10, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else if (this.type === 'magma_orb') {
      if (this.isPuddle) {
        // Boiling lava pool on floor
        const pulse = Math.sin(this.life * 12) * 2;
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(rx, ry, this.w, this.h);

        ctx.fillStyle = '#ea580c';
        ctx.fillRect(rx + 3, ry + 2, this.w - 6, this.h - 4);

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(rx + this.w / 2, ry + 4 + pulse * 0.5, this.w / 3, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Magma bubble
        const bubbleX = rx + 14 + ((this.life * 28) % 24);
        ctx.fillStyle = '#ffedd5';
        ctx.beginPath();
        ctx.arc(bubbleX, ry + 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Flying molten lava bomb
        ctx.save();
        ctx.translate(rx + this.w / 2, ry + this.h / 2);

        // Molten outer shell
        ctx.fillStyle = '#c2410c';
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();

        // Bright orange core
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
        ctx.fill();

        // Yellow-hot nucleus
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-1, -1, 4, 0, Math.PI * 2);
        ctx.fill();

        // Searing sparkles
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-2, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    } else if (this.type === 'judgment_lightning') {
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

    this.drawFloorBatOverlay(ctx, this.subType);
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

  drawFloorBatOverlay(ctx, type) {
    if (type === 'abyss') {
      // Piso 1: Magma horn tips & incandescent chest core
      ctx.fillStyle = '#ff4500';
      ctx.fillRect(11, -2, 2, 4);
      ctx.fillRect(16, -2, 2, 4);
      ctx.fillStyle = '#ffaa00';
      ctx.fillRect(13, 9, 3, 3);
    } else if (type === 'toxic') {
      // Piso 2: Bioluminescent poisonous pustules & acid drops
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(12, 6, 2, 0, Math.PI * 2);
      ctx.arc(17, 7, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(14, 12, 2, 3);
    } else if (type === 'gargoyle' || type === 'blood') {
      // Piso 3: Iron barbute crest & serrated steel wing claws
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(12, 1, 5, 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(14, -2, 2, 4);
      ctx.fillRect(2, 4, 3, 2);
      ctx.fillRect(24, 4, 3, 2);
    } else if (type === 'frost') {
      // Piso 4: Sharp crystalline frost horns & permafrost core
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.moveTo(11, 2);
      ctx.lineTo(9, -4);
      ctx.lineTo(13, 1);
      ctx.moveTo(16, 1);
      ctx.lineTo(19, -4);
      ctx.lineTo(18, 2);
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(13, 9, 3, 3);
    } else if (type === 'gold') {
      // Piso 5: Golden royal crown with rubies & gilded talons
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(11, 2);
      ctx.lineTo(11, -3);
      ctx.lineTo(13, 0);
      ctx.lineTo(15, -4);
      ctx.lineTo(16, 0);
      ctx.lineTo(18, -3);
      ctx.lineTo(18, 2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(14, -1, 1, 1);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(13, 15, 3, 2);
    } else if (type === 'celestial') {
      // Piso 6: Radiating solar halo ring & celestial seraph radiance
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(14, -4, 7, 2.5, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(13, -5, 3, 1);
      ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
      ctx.beginPath();
      ctx.arc(14, 10, 8, 0, Math.PI * 2);
      ctx.fill();
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
  window.RunicBell = RunicBell;
  window.SpectralPlatform = SpectralPlatform;
  window.SeesawPlatform = SeesawPlatform;
  window.AscensionVortex = AscensionVortex;
  window.FamiliarCage = FamiliarCage;
  window.Familiar = Familiar;
}
