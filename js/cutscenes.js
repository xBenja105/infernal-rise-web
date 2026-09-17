/**
 * Infernal Rise — Cutscene System (CutsceneManager)
 * High-fidelity cinematic sequences:
 * 1. AwakeningCutscene: Kael stirs and rises from the cold dark cavern rock in the lobby.
 * 2. BossIntroCutscene: Dynamic camera tracking, letterbox bars, thematic FX, and heraldic title banners.
 * 3. EndingCutscene: Journey through the cavern mouth into the sunlit living surface world.
 */

class CutsceneManager {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.type = null; // 'awakening' | 'boss_intro' | 'ending'
    this.timer = 0;
    this.duration = 0;
    this.phase = 0;
    this.onComplete = null;

    // Visual animation states
    this.letterboxProgress = 0; // 0 (hidden) to 1 (active)
    this.targetLetterbox = 0;
    this.letterboxHeight = 52;
    this.fadeAlpha = 0; // Blackout alpha
    this.whiteoutAlpha = 0; // Pure white daylight wash
    this.eyelidProgress = 0; // 0 (fully closed) to 1 (fully open)
    this.subtitles = '';
    this.speaker = '';
    this.skipPromptAlpha = 0;
    this.skipTimer = 0;

    // Boss intro specific data
    this.bossData = null;
    this.bossTitle = '';
    this.bossSubtitle = '';
    this.bossTheme = 'fire'; // 'fire' | 'ice' | 'earth'
    this.bossBannerAlpha = 0;
    this.bossBannerScale = 0.8;
    this.bossFxTimer = 0;

    // Ending scene specific data
    this.endingStep = 0;
    this.surfaceSceneImg = null;
    this.cloudsOffset = 0;
    this.windGrassPhase = 0;
    this.surfaceParticles = [];
    this.endingTitleAlpha = 0;

    // Initialize surface ambient particles
    this.initSurfaceParticles();
  }

  initSurfaceParticles() {
    this.surfaceParticles = [];
    for (let i = 0; i < 35; i++) {
      this.surfaceParticles.push({
        x: Math.random() * 960,
        y: Math.random() * 540,
        vx: 15 + Math.random() * 30,
        vy: -5 + Math.random() * 10,
        size: 1.5 + Math.random() * 2.5,
        alpha: 0.3 + Math.random() * 0.6,
        color: Math.random() > 0.4 ? '#fef08a' : (Math.random() > 0.5 ? '#ffffff' : '#f472b6'),
        swayPhase: Math.random() * Math.PI * 2
      });
    }
  }

  // ─── 1. AWAKENING CUTSCENE (LOBBY START / RESTART) ───
  startAwakening(onComplete) {
    this.active = true;
    this.type = 'awakening';
    this.timer = 0;
    this.duration = 8.5;
    this.phase = 0;
    this.onComplete = onComplete;
    this.letterboxProgress = 0;
    this.targetLetterbox = 1;
    this.fadeAlpha = 1.0;
    this.eyelidProgress = 0;
    this.whiteoutAlpha = 0;
    this.subtitles = '¿Dónde... estoy?... La fría piedra del abismo...';
    this.speaker = 'Kael';
    this.skipPromptAlpha = 0;
    this.skipTimer = 0;

    if (this.game) {
      this.game.state = 'CUTSCENE';
      if (this.game.player) {
        this.game.player.isFrozen = true;
        this.game.player.vx = 0;
        this.game.player.vy = 0;
        this.game.player.cutscenePose = 'lying';
      }
    }

    if (window.soundEngine) {
      window.soundEngine.resume();
      if (window.soundEngine.playWhoosh) window.soundEngine.playWhoosh();
    }
  }

  // ─── 2. BOSS INTRO CUTSCENE (BOSS ROOM ENTRY) ───
  startBossIntro(boss, onComplete) {
    this.active = true;
    this.type = 'boss_intro';
    this.timer = 0;
    this.duration = 4.8;
    this.phase = 0;
    this.onComplete = onComplete;
    this.letterboxProgress = 0;
    this.targetLetterbox = 1;
    this.fadeAlpha = 0;
    this.whiteoutAlpha = 0;
    this.bossData = boss;
    this.bossBannerAlpha = 0;
    this.bossBannerScale = 0.7;
    this.bossFxTimer = 0;
    this.subtitles = '';
    this.speaker = '';
    this.skipPromptAlpha = 0;
    this.skipTimer = 0;

    // Detect boss identity and configure spectacle
    const name = (boss && boss.name) ? boss.name.toLowerCase() : '';
    const type = (boss && boss.type) ? boss.type.toLowerCase() : '';
    const dKey = (boss && boss.dialogueKey) ? boss.dialogueKey.toLowerCase() : '';

    if (name.includes('demon') || type.includes('demon') || dKey.includes('demon')) {
      this.bossTheme = 'fire';
      this.bossTitle = 'AZGALOR, EL DEMONIO ABRASADOR';
      this.bossSubtitle = 'SEÑOR DE LAS FOSAS • PISO 1';
    } else if (name.includes('frost') || name.includes('hielo') || name.includes('guardian') || type.includes('frost') || dKey.includes('frost')) {
      this.bossTheme = 'ice';
      this.bossTitle = 'KRANOR, EL GUARDIÁN GÉLIDO';
      this.bossSubtitle = 'CUSTODIO DE LAS CUMBRES HELADAS • PISO 2';
    } else {
      this.bossTheme = 'earth';
      this.bossTitle = 'ASTERIÓN, EL MINOTAURO DEL TÁRTARO';
      this.bossSubtitle = 'TITÁN DE LAS CAVERNAS • JEFE FINAL';
    }

    if (this.game) {
      this.game.state = 'CUTSCENE';
      if (this.game.player) {
        this.game.player.isFrozen = true;
        this.game.player.vx = 0;
        this.game.player.vy = 0;
      }
    }

    if (window.soundEngine) {
      window.soundEngine.resume();
      if (this.bossTheme === 'fire') {
        if (window.soundEngine.playFireCast) window.soundEngine.playFireCast();
      } else if (this.bossTheme === 'ice') {
        if (window.soundEngine.playThunder) window.soundEngine.playThunder();
      } else {
        if (window.soundEngine.playMeteorExplosion) window.soundEngine.playMeteorExplosion();
      }
    }

    if (window.particleSystem) {
      window.particleSystem.triggerScreenShake(0.8, 18);
    }
  }

  // ─── 3. ENDING CUTSCENE (SURFACE SALVATION & TRIUMPH) ───
  startEnding(onComplete) {
    this.active = true;
    this.type = 'ending';
    this.timer = 0;
    this.duration = 14.5;
    this.phase = 0;
    this.onComplete = onComplete;
    this.letterboxProgress = 0;
    this.targetLetterbox = 1;
    this.fadeAlpha = 0;
    this.whiteoutAlpha = 0;
    this.endingTitleAlpha = 0;
    this.subtitles = 'Más allá del abismo de fuego y penumbra... la luz de un nuevo amanecer.';
    this.speaker = 'Narrador';
    this.skipPromptAlpha = 0;
    this.skipTimer = 0;

    // Cache or generate surface sunlit scene canvas
    if (window.spriteManager && window.spriteManager.generateSunlitSurfaceScene) {
      this.surfaceSceneImg = window.spriteManager.generateSunlitSurfaceScene();
    }

    if (this.game) {
      this.game.state = 'CUTSCENE';
      if (this.game.player) {
        this.game.player.isFrozen = true;
        this.game.player.vx = 0;
        this.game.player.vy = 0;
      }
    }

    if (window.soundEngine) {
      window.soundEngine.resume();
      if (window.soundEngine.playHeal) window.soundEngine.playHeal();
    }
  }

  // ─── SKIP FUNCTIONALITY ───
  skip() {
    if (!this.active) return;
    this.finishCutscene();
  }

  finishCutscene() {
    this.active = false;
    this.letterboxProgress = 0;
    this.fadeAlpha = 0;
    this.whiteoutAlpha = 0;
    this.bossBannerAlpha = 0;

    if (this.game) {
      if (this.game.player) {
        this.game.player.isFrozen = false;
        this.game.player.cutscenePose = null;
      }
      if (this.type === 'awakening') {
        this.game.state = 'PLAYING';
      }
    }

    const cb = this.onComplete;
    this.onComplete = null;
    this.type = null;

    if (cb && typeof cb === 'function') {
      cb();
    }
  }

  // ─── UPDATE LOOP ───
  update(dt) {
    if (!this.active) return;

    this.timer += dt;
    this.skipTimer += dt;
    if (this.skipTimer > 1.2) {
      this.skipPromptAlpha = Math.min(1.0, this.skipPromptAlpha + dt * 2.0);
    }

    // Letterbox animation
    this.letterboxProgress += (this.targetLetterbox - this.letterboxProgress) * Math.min(1.0, dt * 6.0);

    if (this.type === 'awakening') {
      this.updateAwakening(dt);
    } else if (this.type === 'boss_intro') {
      this.updateBossIntro(dt);
    } else if (this.type === 'ending') {
      this.updateEnding(dt);
    }
  }

  updateAwakening(dt) {
    const t = this.timer;

    if (t < 1.4) {
      // Phase 0: Pitch darkness, opening thoughts
      this.fadeAlpha = 1.0;
      this.eyelidProgress = 0;
      this.subtitles = '¿Dónde... estoy?... La fría piedra del abismo...';
    } else if (t < 3.6) {
      // Phase 1: Heavy eyelids opening and closing (Blink effect)
      const blinkT = (t - 1.4) / 2.2;
      // Dual blink curve: opens slightly, dips, then opens wider
      let eye = Math.sin(blinkT * Math.PI * 2.5);
      if (blinkT > 0.55) {
        eye = Math.max(0.4, 0.4 + (blinkT - 0.55) * 1.5);
      } else {
        eye = Math.max(0, eye * 0.7);
      }
      this.eyelidProgress = Math.min(1.0, eye);
      this.fadeAlpha = Math.max(0, 1.0 - this.eyelidProgress * 0.9);
      this.subtitles = 'La masacre... la traición... Fui sentenciado a muerte y arrojado al Inframundo.';
    } else if (t < 5.8) {
      // Phase 2: Stirring, pushing off the ground
      this.eyelidProgress = 1.0;
      this.fadeAlpha = 0;
      if (this.game && this.game.player) {
        if (t < 4.6) {
          this.game.player.cutscenePose = 'stirring';
        } else {
          this.game.player.cutscenePose = 'crouching';
        }
      }
      this.subtitles = 'Mi cuerpo está maltrecho... pero mi alma se rehúsa a extinguirse.';
    } else if (t < 7.8) {
      // Phase 3: Rising to feet and drawing weapon
      if (this.game && this.game.player) {
        if (this.game.player.cutscenePose !== 'standing') {
          this.game.player.cutscenePose = 'standing';
          if (window.soundEngine && window.soundEngine.playSwordSlash) {
            window.soundEngine.playSwordSlash();
          }
          if (window.particleSystem) {
            window.particleSystem.spawnDust(this.game.player.x + 16, this.game.player.y + 36, 12);
          }
        }
      }
      this.subtitles = 'Debo ascender por esta Gran Torre. Purgaré mi culpa con sangre y alcanzaré la superficie.';
    } else {
      // Phase 4: Finish and transition to gameplay
      this.targetLetterbox = 0;
      if (t >= this.duration) {
        this.finishCutscene();
      }
    }
  }

  updateBossIntro(dt) {
    const t = this.timer;
    const boss = this.bossData;

    // Smooth camera tracking to center on boss
    if (this.game && boss && this.game.level) {
      const targetCamX = Math.max(0, Math.min(
        boss.x + (boss.w || 64) / 2 - this.game.vWidth / 2,
        (this.game.level.width || 960) - this.game.vWidth
      ));
      this.game.camX += (targetCamX - this.game.camX) * Math.min(1.0, dt * 4.5);
    }

    // Boss Title Banner Entrance
    if (t > 0.8 && t < 4.2) {
      this.bossBannerAlpha = Math.min(1.0, this.bossBannerAlpha + dt * 3.5);
      this.bossBannerScale += (1.0 - this.bossBannerScale) * Math.min(1.0, dt * 5.0);
    } else if (t >= 4.2) {
      this.bossBannerAlpha = Math.max(0, this.bossBannerAlpha - dt * 4.0);
      this.targetLetterbox = 0;
    }

    // Thematic FX Spawns
    this.bossFxTimer += dt;
    if (this.bossFxTimer > 0.12 && boss && t < 4.0) {
      this.bossFxTimer = 0;
      const bx = boss.x + (boss.w || 64) / 2;
      const by = boss.y + (boss.h || 64);

      if (window.particleSystem) {
        if (this.bossTheme === 'fire') {
          window.particleSystem.spawnSparks(bx + (Math.random() - 0.5) * 80, by - 10, '#ff4400');
          window.particleSystem.spawnSparks(bx + (Math.random() - 0.5) * 120, by - 20, '#fbbf24');
        } else if (this.bossTheme === 'ice') {
          window.particleSystem.spawnSparks(bx + (Math.random() - 0.5) * 90, by - 15, '#00f0ff');
          window.particleSystem.spawnSparks(bx + (Math.random() - 0.5) * 110, by - 30, '#ffffff');
        } else {
          // Earth
          window.particleSystem.spawnDust(bx + (Math.random() - 0.5) * 100, by, 6);
          window.particleSystem.spawnSparks(bx + (Math.random() - 0.5) * 80, by - 10, '#d97706');
        }
      }
    }

    if (t >= this.duration) {
      this.finishCutscene();
    }
  }

  updateEnding(dt) {
    const t = this.timer;

    // Phase 1: Tunnel walk and daylight whiteout (0 - 3.2s)
    if (t < 3.2) {
      const p1 = t / 3.2;
      this.whiteoutAlpha = Math.min(1.0, p1 * 1.3);
      this.subtitles = 'Más allá del abismo de fuego y penumbra... la luz de un nuevo amanecer.';
    }
    // Phase 2: Revelation of the Living Surface World (3.2s - 8.5s)
    else if (t < 8.5) {
      this.whiteoutAlpha = Math.max(0, this.whiteoutAlpha - dt * 1.4);
      if (t < 5.8) {
        this.subtitles = 'Kael contempla el cielo abierto. El aire puro del mundo terrenal llena sus pulmones tras una eternidad en las sombras.';
      } else {
        this.subtitles = 'La sangre derramada en las fosas ha purgado su culpa. Su condena ha concluido; la redención ha comenzado.';
      }
    }
    // Phase 3: Grand Epilogue and Triumphant Title (8.5s - 14.5s)
    else {
      this.endingTitleAlpha = Math.min(1.0, this.endingTitleAlpha + dt * 2.0);
      this.subtitles = 'Has conquistado la Gran Torre Infernal y renacido bajo la luz del sol.';
    }

    // Update surface ambient drifting particles
    this.cloudsOffset += dt * 12;
    this.windGrassPhase += dt * 3.5;
    for (const p of this.surfaceParticles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt + Math.sin(this.windGrassPhase + p.swayPhase) * 0.4;
      if (p.x > 980) p.x = -20;
      if (p.y < 40) p.y = 520;
      if (p.y > 530) p.y = 60;
    }

    if (t >= this.duration) {
      this.finishCutscene();
    }
  }

  // ─── RENDER PIPELINE ───
  draw(ctx, vWidth, vHeight, camX, camY) {
    if (!this.active) return;

    ctx.save();

    // 1. Ending: Render full surface world backdrop if in surface phases
    if (this.type === 'ending' && this.timer >= 2.6) {
      this.drawSurfaceSalvationScene(ctx, vWidth, vHeight);
    }

    // 2. Boss Intro: Render Title Banner
    if (this.type === 'boss_intro' && this.bossBannerAlpha > 0.02) {
      this.drawBossTitleBanner(ctx, vWidth, vHeight);
    }

    // 3. Awakening: Render Eyelid Blinking Curves & Darkness
    if (this.type === 'awakening' && this.eyelidProgress < 0.98) {
      this.drawEyelidBlink(ctx, vWidth, vHeight);
    }

    // 4. Whiteout Daylight Wash (Ending transition)
    if (this.whiteoutAlpha > 0.005) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.whiteoutAlpha})`;
      ctx.fillRect(0, 0, vWidth, vHeight);
    }

    // 5. Blackout Fade
    if (this.fadeAlpha > 0.005) {
      ctx.fillStyle = `rgba(3, 2, 6, ${this.fadeAlpha})`;
      ctx.fillRect(0, 0, vWidth, vHeight);
    }

    // 6. Cinematic Letterbox Bars (Top and Bottom)
    if (this.letterboxProgress > 0.01) {
      const curH = this.letterboxHeight * this.letterboxProgress;
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, vWidth, curH);
      ctx.fillRect(0, vHeight - curH, vWidth, curH);

      // Gold border accent lines
      ctx.fillStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.fillRect(0, curH - 1.5, vWidth, 1.5);
      ctx.fillRect(0, vHeight - curH, vWidth, 1.5);
    }

    // 7. Subtitles Display
    if (this.subtitles) {
      this.drawSubtitles(ctx, vWidth, vHeight);
    }

    // 8. Skip Prompt Pill
    if (this.skipPromptAlpha > 0.02) {
      this.drawSkipPrompt(ctx, vWidth, vHeight);
    }

    ctx.restore();
  }

  drawEyelidBlink(ctx, vWidth, vHeight) {
    const eye = this.eyelidProgress; // 0 = closed, 1 = fully open
    const halfH = vHeight / 2;
    const openY = halfH * eye;

    ctx.save();
    ctx.fillStyle = '#030106';

    // Upper eyelid (curves down)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(vWidth, 0);
    ctx.lineTo(vWidth, halfH - openY);
    ctx.quadraticCurveTo(vWidth / 2, halfH - openY + 35 * (1 - eye), 0, halfH - openY);
    ctx.closePath();
    ctx.fill();

    // Lower eyelid (curves up)
    ctx.beginPath();
    ctx.moveTo(0, vHeight);
    ctx.lineTo(vWidth, vHeight);
    ctx.lineTo(vWidth, halfH + openY);
    ctx.quadraticCurveTo(vWidth / 2, halfH + openY - 35 * (1 - eye), 0, halfH + openY);
    ctx.closePath();
    ctx.fill();

    // Dark vignette blur around edges
    const grad = ctx.createRadialGradient(vWidth / 2, vHeight / 2, Math.max(10, openY * 0.8), vWidth / 2, vHeight / 2, vWidth * 0.6);
    grad.addColorStop(0, 'rgba(3, 1, 6, 0)');
    grad.addColorStop(0.7, `rgba(3, 1, 6, ${0.75 * (1 - eye)})`);
    grad.addColorStop(1, '#030106');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, vWidth, vHeight);

    ctx.restore();
  }

  drawBossTitleBanner(ctx, vWidth, vHeight) {
    ctx.save();
    ctx.globalAlpha = this.bossBannerAlpha;

    const bannerY = vHeight * 0.28;
    ctx.translate(vWidth / 2, bannerY);
    ctx.scale(this.bossBannerScale, this.bossBannerScale);

    // Dynamic color theme
    let primaryCol = '#fbbf24'; // Gold
    let glowCol = 'rgba(251, 191, 36, 0.6)';
    let subCol = '#f87171';
    let runeIcon = '🔥';

    if (this.bossTheme === 'ice') {
      primaryCol = '#38bdf8';
      glowCol = 'rgba(56, 189, 248, 0.6)';
      subCol = '#bae6fd';
      runeIcon = '❄';
    } else if (this.bossTheme === 'earth') {
      primaryCol = '#f59e0b';
      glowCol = 'rgba(245, 158, 11, 0.6)';
      subCol = '#fed7aa';
      runeIcon = '⚔';
    }

    // Shadow backdrop ribbon
    const ribbonW = 540;
    const ribbonH = 68;
    const rGrad = ctx.createLinearGradient(-ribbonW / 2, 0, ribbonW / 2, 0);
    rGrad.addColorStop(0, 'rgba(10, 5, 12, 0)');
    rGrad.addColorStop(0.2, 'rgba(10, 5, 12, 0.88)');
    rGrad.addColorStop(0.5, 'rgba(18, 8, 22, 0.95)');
    rGrad.addColorStop(0.8, 'rgba(10, 5, 12, 0.88)');
    rGrad.addColorStop(1, 'rgba(10, 5, 12, 0)');
    ctx.fillStyle = rGrad;
    ctx.fillRect(-ribbonW / 2, -ribbonH / 2, ribbonW, ribbonH);

    // Filigree heraldic lines
    ctx.strokeStyle = primaryCol;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-ribbonW / 2 + 40, -ribbonH / 2 + 4);
    ctx.lineTo(ribbonW / 2 - 40, -ribbonH / 2 + 4);
    ctx.moveTo(-ribbonW / 2 + 40, ribbonH / 2 - 4);
    ctx.lineTo(ribbonW / 2 - 40, ribbonH / 2 - 4);
    ctx.stroke();

    // Center rune ornament
    ctx.font = '16px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(runeIcon, 0, -ribbonH / 2 + 4);

    // Boss Name (Primary Gothic Title)
    ctx.font = 'bold 22px "Cinzel", "Crimson Text", Georgia, serif';
    ctx.shadowColor = glowCol;
    ctx.shadowBlur = 16;
    ctx.fillStyle = primaryCol;
    ctx.fillText(this.bossTitle, 0, -5);

    // Subtitle / Circle Title
    ctx.shadowBlur = 6;
    ctx.font = 'bold 12px "Cinzel", Georgia, serif';
    ctx.fillStyle = subCol;
    ctx.letterSpacing = '2px';
    ctx.fillText(this.bossSubtitle, 0, 18);

    ctx.restore();
  }

  drawSurfaceSalvationScene(ctx, vWidth, vHeight) {
    // 1. Draw pre-rendered or procedural sunlit surface canvas
    if (this.surfaceSceneImg) {
      ctx.drawImage(this.surfaceSceneImg, 0, 0, vWidth, vHeight);
    } else {
      // Fallback procedural sunlit surface
      const skyGrad = ctx.createLinearGradient(0, 0, 0, vHeight);
      skyGrad.addColorStop(0, '#1d4ed8');
      skyGrad.addColorStop(0.4, '#38bdf8');
      skyGrad.addColorStop(0.7, '#bae6fd');
      skyGrad.addColorStop(1.0, '#fed7aa');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, vWidth, vHeight);

      // Sun
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(720, 90, 48, 0, Math.PI * 2);
      ctx.fill();

      // Green Hills
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.moveTo(0, vHeight);
      ctx.quadraticCurveTo(vWidth * 0.4, vHeight * 0.65, vWidth, vHeight * 0.75);
      ctx.lineTo(vWidth, vHeight);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Draw Kael at the surface
    this.drawKaelAtSurface(ctx, vWidth, vHeight);

    // 3. Draw drifting ambient surface particles (sunlight motes, pollen, dandelion seeds)
    for (const p of this.surfaceParticles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // 4. Grand Epilogue Banner
    if (this.endingTitleAlpha > 0.02) {
      ctx.save();
      ctx.globalAlpha = this.endingTitleAlpha;
      ctx.translate(vWidth / 2, vHeight * 0.24);

      // Title Card Backdrop
      const bW = 580;
      const bH = 80;
      const tGrad = ctx.createLinearGradient(-bW / 2, 0, bW / 2, 0);
      tGrad.addColorStop(0, 'rgba(15, 23, 42, 0)');
      tGrad.addColorStop(0.2, 'rgba(15, 23, 42, 0.85)');
      tGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.95)');
      tGrad.addColorStop(0.8, 'rgba(15, 23, 42, 0.85)');
      tGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = tGrad;
      ctx.fillRect(-bW / 2, -bH / 2, bW, bH);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(-bW / 2 + 30, -bH / 2 + 4, bW - 60, bH - 8);

      ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
      ctx.shadowBlur = 18;
      ctx.font = 'bold 28px "Cinzel", Georgia, serif';
      ctx.fillStyle = '#fef08a';
      ctx.textAlign = 'center';
      ctx.fillText('INFERNAL RISE', 0, -8);

      ctx.shadowBlur = 8;
      ctx.font = 'bold 13px "Cinzel", Georgia, serif';
      ctx.fillStyle = '#67e8f9';
      ctx.fillText('LIBRE DEL AVERNO — REDENCIÓN ALCANZADA', 0, 18);

      ctx.restore();
    }
  }

  drawKaelAtSurface(ctx, vWidth, vHeight) {
    const sm = window.spriteManager;
    const kaelSprites = sm && sm.sprites ? sm.sprites.kael : null;

    // Kael's hill overlook position
    const kx = 450;
    const ky = 378;

    ctx.save();
    // Shadow on green grass
    ctx.fillStyle = 'rgba(15, 45, 25, 0.45)';
    ctx.beginPath();
    ctx.ellipse(kx + 20, ky + 46, 26, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const t = this.timer;
    // Before t=5.0: Kael standing, weapon drawn, looking at the sunrise
    // After t=5.0: Kael kneels touching the earth, weapon sheathed
    if (t < 5.0) {
      const idleFrame = (kaelSprites && kaelSprites.idle && kaelSprites.idle[0]) ? kaelSprites.idle[0] : null;
      if (idleFrame) {
        ctx.drawImage(idleFrame, kx - 30, ky - 20, 100, 68);
      }
    } else {
      const crouchFrame = (kaelSprites && kaelSprites.crouch) ? kaelSprites.crouch :
                          (kaelSprites && kaelSprites.idle ? kaelSprites.idle[0] : null);
      if (crouchFrame) {
        ctx.drawImage(crouchFrame, kx - 30, ky - 10, 100, 68);
      }
    }

    // Cape flutter in mountain breeze
    const capeFlutter = Math.sin(this.windGrassPhase) * 4;
    ctx.strokeStyle = '#991b1b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(kx + 4, ky + 16);
    ctx.quadraticCurveTo(kx - 12 + capeFlutter, ky + 28, kx - 18 + capeFlutter * 1.3, ky + 42);
    ctx.stroke();

    ctx.restore();
  }

  drawSubtitles(ctx, vWidth, vHeight) {
    ctx.save();
    const curH = this.letterboxHeight * this.letterboxProgress;
    const subY = vHeight - Math.max(28, curH * 0.7);

    ctx.font = 'italic 14px "Cinzel", "Crimson Text", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text metrics & backing pill
    const metrics = ctx.measureText(this.subtitles);
    const boxW = Math.min(vWidth - 80, metrics.width + 40);
    const boxH = 30;

    ctx.fillStyle = 'rgba(6, 4, 10, 0.72)';
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 1;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect((vWidth - boxW) / 2, subY - boxH / 2, boxW, boxH, 6);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.fillRect((vWidth - boxW) / 2, subY - boxH / 2, boxW, boxH);
    }

    // Glow and text
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#fef08a';
    ctx.fillText(this.subtitles, vWidth / 2, subY);

    ctx.restore();
  }

  drawSkipPrompt(ctx, vWidth, vHeight) {
    ctx.save();
    ctx.globalAlpha = this.skipPromptAlpha * (0.65 + Math.sin(this.skipTimer * 4.0) * 0.25);

    const promptText = '⯈ [Espacio] o Toca para Omitir';
    ctx.font = '10px "Cinzel", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';

    const pX = vWidth - 24;
    const pY = 16;

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(promptText, pX, pY);

    ctx.restore();
  }
}

// Global attachment
window.CutsceneManager = CutsceneManager;
