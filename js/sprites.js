/**
 * Infernal Rise — Sprite Manager & Asset Loader
 * Loads real background and skeleton sprite sheets, and synthesizes crisp pixel art for Kael, Bosses, NPC, and Props.
 */

class SpriteManager {
  constructor() {
    this.backgrounds = [];
    this.skeletonSprites = {};
    this.sprites = {};
    this.loaded = false;
    this.tintedSkeletonCache = {};
  }

  getSkeletonSkinPalette(skin) {
    switch (skin) {
      case 'celestial':
        return { tint: '#fde047', mode: 'source-atop', alpha: 0.42, eyeColor: '#ffd700', eyeGlow: 'rgba(255,215,0,0.9)', name: 'Centinela del Umbral Terrenal' };
      case 'blood':
        return { tint: '#ef4444', mode: 'source-atop', alpha: 0.38, eyeColor: '#ff0054', eyeGlow: 'rgba(255,0,84,0.85)', name: 'Guardia Óseo de la Fortaleza' };
      case 'gold':
      case 'avarice':
        return { tint: '#f59e0b', mode: 'source-atop', alpha: 0.42, eyeColor: '#ffb703', eyeGlow: 'rgba(255,183,3,0.85)', name: 'Guardia Avaro de la Torre' };
      case 'shadow':
      case 'obsidian':
        return { tint: '#312e81', mode: 'source-atop', alpha: 0.55, eyeColor: '#ff3c00', eyeGlow: 'rgba(255,60,0,0.85)', name: 'Esqueleto de Obsidiana Ígnea' };
      case 'frost':
      case 'ice':
        return { tint: '#38bdf8', mode: 'source-atop', alpha: 0.45, eyeColor: '#00e5ff', eyeGlow: 'rgba(0,229,255,0.85)', name: 'Espectro de las Agujas Heladas' };
      case 'toxic':
      case 'mud':
        return { tint: '#22c55e', mode: 'source-atop', alpha: 0.42, eyeColor: '#70e000', eyeGlow: 'rgba(112,224,0,0.85)', name: 'Caminante de las Catacumbas' };
      case 'spectral':
      case 'ashen':
        return { tint: '#c084fc', mode: 'source-atop', alpha: 0.38, eyeColor: '#c084fc', eyeGlow: 'rgba(192,132,252,0.85)', name: 'Centinela de Ceniza' };
      case 'infernal':
        return { tint: '#f97316', mode: 'source-atop', alpha: 0.45, eyeColor: '#ff2200', eyeGlow: 'rgba(255,34,0,0.85)', name: 'Esqueleto de Fuego Infernal' };
      case 'abyss':
      case 'normal':
      default:
        return { tint: '#94a3b8', mode: 'source-atop', alpha: 0.18, eyeColor: '#00f5d4', eyeGlow: 'rgba(0,245,212,0.85)', name: 'Condenado del Foso Abisal' };
    }
  }

  getTintedSkeletonSheet(action, skin = 'abyss') {
    if (!this.tintedSkeletonCache) this.tintedSkeletonCache = {};
    const key = `${action}_${skin}`;
    if (this.tintedSkeletonCache[key]) {
      return this.tintedSkeletonCache[key];
    }
    const sourceImg = this.skeletonSprites ? this.skeletonSprites[action] : null;
    if (!sourceImg || !sourceImg.complete || sourceImg.naturalWidth === 0) {
      return sourceImg;
    }
    const pal = this.getSkeletonSkinPalette(skin);
    if (!pal || !pal.tint || pal.alpha === 0) {
      this.tintedSkeletonCache[key] = sourceImg;
      return sourceImg;
    }

    const { canvas, ctx } = this.createCanvas(sourceImg.naturalWidth, sourceImg.naturalHeight);
    ctx.drawImage(sourceImg, 0, 0);

    ctx.save();
    ctx.globalCompositeOperation = pal.mode || 'source-atop';
    ctx.globalAlpha = pal.alpha;
    ctx.fillStyle = pal.tint;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    this.tintedSkeletonCache[key] = canvas;
    return canvas;
  }

  async loadAll() {
    // 1. Load Background Parallax Layers
    const bgPromises = [];
    for (let i = 1; i <= 6; i++) {
      bgPromises.push(new Promise((resolve) => {
        const img = new Image();
        img.src = `assets/background/background${i}.png`;
        img.onload = () => resolve(img);
        img.onerror = () => {
          console.warn(`Could not load background${i}.png, using procedural fallback.`);
          resolve(this.createFallbackBg(i));
        };
      }));
    }
    this.backgrounds = await Promise.all(bgPromises);

    // 2. Load Skeleton Sheets
    const skelNames = ['Attack', 'Dead', 'Hit', 'Idle', 'React', 'Walk'];
    for (const name of skelNames) {
      const img = new Image();
      img.src = `assets/sprites/Skeleton ${name}.png`;
      this.skeletonSprites[name] = img;
    }

    // 3. Generate Procedural Pixel Art Spritesheets
    this.generateKaelSprites();
    this.generateSkeletonSprites();
    this.generateBatSprites();
    this.generateSkullProjectileSprites();
    this.generateBossSprites();
    this.generateNpcSprites();
    this.generateEnvironmentSprites();
    this.generateInfernalBackgrounds();
    this.generatePortraits();

    this.loaded = true;
    console.log('All sprites and assets initialized.');
  }

  createFallbackBg(layer) {
    const c = document.createElement('canvas');
    c.width = 426;
    c.height = 384;
    const ctx = c.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 384);
    if (layer === 1) {
      grad.addColorStop(0, '#0a0206');
      grad.addColorStop(1, '#24060e');
    } else {
      grad.addColorStop(0, 'rgba(30, 5, 12, 0.4)');
      grad.addColorStop(1, 'rgba(80, 10, 20, 0.7)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 426, 384);
    return c;
  }

  // Helper to create a canvas frame
  createCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas: c, ctx };
  }

  // ─── KAEL (THE FALLEN KNIGHT) ───
  // ─── KAEL (THE FALLEN KNIGHT) — HIGH-DENSITY ARTICULATED PIXEL ART ───
  generateKaelSprites() {
    this.sprites.kael = {
      idle: [],
      run: [],
      charge: [],
      jump: [],
      climb: [],
      attack: [],
      hurt: []
    };

    const w = 72, h = 88;

    // Helper to draw segmented armored limb between (x1, y1) and (x2, y2)
    const drawSegment = (ctx, x1, y1, x2, y2, thickness, cBody, cMid, cHigh, cEdge) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 0.5) return;
      ctx.save();
      const ang = Math.atan2(dy, dx);
      ctx.translate(x1, y1);
      ctx.rotate(ang);
      const half = thickness / 2;
      // Outer shadow/contour
      ctx.fillStyle = cEdge || '#080a0e';
      ctx.fillRect(0, -half - 1, len, thickness + 2);
      // Main armor plate body
      ctx.fillStyle = cBody;
      ctx.fillRect(0, -half, len, thickness);
      // Mid-tone plate
      if (cMid && thickness >= 3) {
        ctx.fillStyle = cMid;
        ctx.fillRect(1, -half + 1, len - 2, thickness - 2);
      }
      // Specular highlight line
      if (cHigh && thickness >= 4) {
        ctx.fillStyle = cHigh;
        ctx.fillRect(2, -half + 1, len - 4, 1.5);
      }
      ctx.restore();
    };

    // Master renderer for multi-joint articulated Kael
    const renderArticulatedKael = (cw, ch, opt) => {
      const { canvas, ctx } = this.createCanvas(cw, ch);
      const bob = opt.bob || 0;
      const crouch = opt.crouch || 0;
      const torsoShift = opt.torsoShift || 0;
      const torsoTilt = opt.torsoTilt || 0;
      const headTilt = opt.headTilt || 0;
      const capeFlow = opt.capeFlow || 0;
      const capeLift = opt.capeLift || 0;
      const swordMode = opt.swordMode || 'sheathed';
      const eyeColor = opt.eyeColor || '#ff1e33';
      const auraLevel = opt.auraLevel || 0;

      // Leg Angles (radians)
      const tAngF = opt.tAngF || 0;
      const kAngF = opt.kAngF || 0;
      const fAngF = opt.fAngF || 0;
      const tAngB = opt.tAngB || 0;
      const kAngB = opt.kAngB || 0;
      const fAngB = opt.fAngB || 0;

      // Arm Angles (radians)
      const aAngF = opt.aAngF || 0;
      const eAngF = opt.eAngF || 0;
      const aAngB = opt.aAngB || 0;
      const eAngB = opt.eAngB || 0;

      const hipX = 36 + torsoShift;
      const hipY = 46 + bob + crouch;
      const shoulderX = 36 + torsoShift;
      const shoulderY = 28 + bob + crouch;

      // ── 1. BILLOWING CAPE (Back layer) ──
      ctx.save();
      const cx = 30 + torsoShift + capeFlow;
      const cy = 26 + bob + crouch;
      const cHeight = Math.max(18, 44 - crouch * 0.35 - capeLift);

      ctx.fillStyle = '#140104'; // Deepest velvet fold shadow
      ctx.fillRect(cx - 5, cy, 18, cHeight + 2);
      ctx.fillStyle = '#2d030b';
      ctx.fillRect(cx - 3, cy + 2, 16, cHeight);
      ctx.fillStyle = '#540816';
      ctx.fillRect(cx - 1, cy + 3, 13, cHeight - 2);
      ctx.fillStyle = '#830f24';
      ctx.fillRect(cx + 1, cy + 4, 10, cHeight - 4);
      // Highlights on dynamic cloth ripples
      ctx.fillStyle = '#b91834';
      ctx.fillRect(cx + 3, cy + 6, 4, Math.max(6, cHeight - 8));
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(cx + 4, cy + 8, 2, Math.max(4, cHeight - 14));
      // Tattered hem notches
      ctx.fillStyle = '#0a0102';
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(cx - 4 + i * 3, cy + cHeight - (i % 3) * 2, 2, 4);
      }
      ctx.restore();

      // ── 2. BACK ARM (Far layer) ──
      const sBx = shoulderX - 4;
      const sBy = shoulderY + 2;
      const L_arm1 = 11, L_arm2 = 10;
      const eBx = sBx + Math.sin(aAngB) * L_arm1;
      const eBy = sBy + Math.cos(aAngB) * L_arm1;
      const wBx = eBx + Math.sin(aAngB + eAngB) * L_arm2;
      const wBy = eBy + Math.cos(aAngB + eAngB) * L_arm2;

      drawSegment(ctx, sBx, sBy, eBx, eBy, 6, '#0f1217', '#1a202a', '#2d3748', '#080a0e');
      ctx.fillStyle = '#1a202a';
      ctx.fillRect(eBx - 3, eBy - 3, 6, 6);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(eBx - 1, eBy - 1, 2, 2);
      drawSegment(ctx, eBx, eBy, wBx, wBy, 5, '#0f1217', '#1a202a', '#2d3748', '#080a0e');
      ctx.fillStyle = '#141820';
      ctx.fillRect(wBx - 3, wBy - 3, 6, 6);
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(wBx - 2, wBy - 2, 4, 4);

      // ── 3. BACK LEG (Far layer, behind torso) ──
      const hBx = hipX - 3;
      const hBy = hipY;
      const L_thigh = 13, L_shin = 13;
      const kBx = hBx + Math.sin(tAngB) * L_thigh;
      const kBy = hBy + Math.cos(tAngB) * L_thigh;
      const aBx = kBx + Math.sin(tAngB + kAngB) * L_shin;
      const aBy = kBy + Math.cos(tAngB + kAngB) * L_shin;

      drawSegment(ctx, hBx, hBy, kBx, kBy, 8, '#0b0e12', '#161a22', '#283140', '#06080a');
      ctx.fillStyle = '#161a22';
      ctx.fillRect(kBx - 3.5, kBy - 3.5, 7, 7);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(kBx - 1, kBy - 1, 2, 2);
      drawSegment(ctx, kBx, kBy, aBx, aBy, 7, '#0b0e12', '#161a22', '#283140', '#06080a');
      ctx.save();
      ctx.translate(aBx, aBy);
      ctx.rotate(fAngB);
      ctx.fillStyle = '#080a0e';
      ctx.fillRect(-3, -1, 13, 6);
      ctx.fillStyle = '#161a22';
      ctx.fillRect(-2, 0, 11, 4);
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(-1, 0, 6, 2);
      ctx.restore();

      // ── 4. SHEATHED BASIC DAGGER (at left hip when not stabbing) ──
      if (swordMode === 'sheathed') {
        const sx = hipX - 10, sy = hipY - 6;
        // Dagger leather sheath
        ctx.fillStyle = '#1e1410';
        ctx.fillRect(sx, sy + 6, 4, 14);
        ctx.fillStyle = '#3a2318';
        ctx.fillRect(sx + 1, sy + 7, 2, 11);
        // Bronze/iron sheath tip
        ctx.fillStyle = '#64748b';
        ctx.fillRect(sx, sy + 18, 4, 3);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(sx + 1, sy + 19, 2, 2);
        // Dagger guard / hilt
        ctx.fillStyle = '#475569';
        ctx.fillRect(sx - 3, sy + 4, 10, 2);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(sx - 2, sy + 4, 8, 1);
        // Grip & pommel
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(sx + 1, sy - 2, 2, 6);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(sx, sy - 4, 4, 2);
      }

      // ── 5. GAUNT UNDEAD TORSO & PENITENT WRAPPINGS (Middle layer) ──
      const ty = shoulderY - 4;
      ctx.save();
      ctx.translate(hipX, hipY);
      ctx.rotate(torsoTilt);
      ctx.translate(-hipX, -hipY);

      // Dark undertunic / shadowed ribs
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(hipX - 12, ty, 24, 26);
      ctx.fillStyle = '#171c26';
      ctx.fillRect(hipX - 10, ty + 2, 20, 22);

      // Tattered linen burial wrappings & exposed gaunt ribs
      ctx.fillStyle = '#283141';
      ctx.fillRect(hipX - 9, ty + 3, 18, 5);
      ctx.fillStyle = '#475569';
      ctx.fillRect(hipX - 8, ty + 4, 16, 2);
      ctx.fillStyle = '#8d99ae'; // Ashen flesh peeking
      ctx.fillRect(hipX - 4, ty + 7, 8, 2);

      // Criss-cross ragged bandages
      ctx.fillStyle = '#334155';
      ctx.fillRect(hipX - 9, ty + 9, 18, 3);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(hipX - 8, ty + 10, 16, 1);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(hipX - 9, ty + 13, 18, 4);
      ctx.fillStyle = '#475569';
      ctx.fillRect(hipX - 7, ty + 14, 14, 2);

      // Penitent worn leather belt & rusted iron buckle
      ctx.fillStyle = '#18120e';
      ctx.fillRect(hipX - 11, hipY - 5, 22, 6);
      ctx.fillStyle = '#3a251a';
      ctx.fillRect(hipX - 10, hipY - 4, 20, 4);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(hipX - 3, hipY - 4, 6, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(hipX - 2, hipY - 3, 4, 2);

      // Frayed ragged cloth tassets hanging over thighs
      ctx.fillStyle = '#0f141d';
      ctx.fillRect(hipX - 10, hipY + 1, 6, 6);
      ctx.fillRect(hipX + 4, hipY + 1, 6, 6);
      ctx.fillStyle = '#202736';
      ctx.fillRect(hipX - 9, hipY + 1, 4, 4);
      ctx.fillRect(hipX + 5, hipY + 1, 4, 4);
      ctx.restore();

      // ── 6. FRONT LEG (Near layer, fully illuminated) ──
      const hFx = hipX + 3;
      const hFy = hipY;
      const kFx = hFx + Math.sin(tAngF) * L_thigh;
      const kFy = hFy + Math.cos(tAngF) * L_thigh;
      const aFx = kFx + Math.sin(tAngF + kAngF) * L_shin;
      const aFy = kFy + Math.cos(tAngF + kAngF) * L_shin;

      drawSegment(ctx, hFx, hFy, kFx, kFy, 8, '#0f131a', '#1e2633', '#334155', '#080a0e');
      ctx.fillStyle = '#1e2633';
      ctx.fillRect(kFx - 3.5, kFy - 3.5, 7, 7);
      ctx.fillStyle = '#334155';
      ctx.fillRect(kFx - 2.5, kFy - 2.5, 5, 5);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(kFx - 1, kFy - 1, 2, 2);
      drawSegment(ctx, kFx, kFy, aFx, aFy, 7, '#0f131a', '#1e2633', '#334155', '#080a0e');

      ctx.save();
      const sAng = Math.atan2(aFy - kFy, aFx - kFx);
      ctx.translate(kFx, kFy);
      ctx.rotate(sAng);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(2, -1, Math.max(1, L_shin - 4), 1.5);
      ctx.restore();

      ctx.save();
      ctx.translate(aFx, aFy);
      ctx.rotate(fAngF);
      ctx.fillStyle = '#080a0e';
      ctx.fillRect(-3, -1, 13, 6);
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(-2, 0, 11, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-1, 0, 7, 2);
      ctx.restore();

      // ── 7. SEMI-UNDEAD HUMAN HEAD & TATTERED PENITENT HOOD ──
      const hy = 8 + bob + crouch;
      const hx = 36 + torsoShift;
      ctx.save();
      ctx.translate(hx, hy + 12);
      ctx.rotate(headTilt);
      ctx.translate(-hx, -(hy + 12));

      // Tattered Hood Cowl (Outer silhouette)
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(hx - 12, hy - 1, 24, 24);
      ctx.fillStyle = '#1b222d';
      ctx.fillRect(hx - 10, hy, 20, 20);
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(hx - 9, hy + 1, 18, 6);

      // Matted, disheveled dark hair strands peeking under cowl
      ctx.fillStyle = '#070a0f';
      ctx.fillRect(hx - 8, hy + 6, 16, 5);
      ctx.fillRect(hx - 9, hy + 8, 3, 6);
      ctx.fillRect(hx + 6, hy + 8, 3, 6);

      // Ashen, gaunt undead face
      ctx.fillStyle = '#8d99ae'; // Pale necrotic flesh
      ctx.fillRect(hx - 7, hy + 8, 14, 12);
      ctx.fillStyle = '#a0aec0'; // Brow highlight
      ctx.fillRect(hx - 6, hy + 8, 12, 2);

      // Sunken, dark hollow eye sockets
      ctx.fillStyle = '#05070a';
      ctx.fillRect(hx - 6, hy + 11, 12, 4);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(hx - 5, hy + 11, 4, 3);
      ctx.fillRect(hx + 1, hy + 11, 4, 3);

      // Glowing Spectral Soul Pupils (Necrotic / Soul flame glow)
      const pupilColor = opt.eyeColor || '#00f5d4';
      ctx.fillStyle = pupilColor;
      ctx.fillRect(hx - 4, hy + 12, 2, 2);
      ctx.fillRect(hx + 2, hy + 12, 2, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hx - 3, hy + 12, 1, 1);
      ctx.fillRect(hx + 3, hy + 12, 1, 1);

      // Hollow gaunt cheeks & grim mouth / exposed teeth contour
      ctx.fillStyle = '#64748b'; // Cheek shadow
      ctx.fillRect(hx - 6, hy + 15, 3, 3);
      ctx.fillRect(hx + 3, hy + 15, 3, 3);
      ctx.fillStyle = '#334155'; // Grim mouth line
      ctx.fillRect(hx - 4, hy + 17, 8, 1);
      ctx.fillStyle = '#cbd5e1'; // Teeth glint
      ctx.fillRect(hx - 3, hy + 18, 2, 1);
      ctx.fillRect(hx + 1, hy + 18, 2, 1);

      // Necrotic Jaw contour & neck wrappings
      ctx.fillStyle = '#475569';
      ctx.fillRect(hx - 5, hy + 19, 10, 2);
      ctx.fillStyle = '#171f2b'; // Cowl folds around neck
      ctx.fillRect(hx - 8, hy + 20, 16, 4);
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(hx - 6, hy + 21, 12, 2);
      ctx.restore();

      // ── 8. FRONT ARM (Near layer, gaunt undead & wrappings) ──
      const sFx = shoulderX + 4;
      const sFy = shoulderY + 1;
      const eFx = sFx + Math.sin(aAngF) * L_arm1;
      const eFy = sFy + Math.cos(aAngF) * L_arm1;
      const wFx = eFx + Math.sin(aAngF + eAngF) * L_arm2;
      const wFy = eFy + Math.cos(aAngF + eAngF) * L_arm2;

      // Weathered iron shoulder guard & wrappings
      ctx.fillStyle = '#0f131a';
      ctx.fillRect(sFx - 5, sFy - 4, 10, 11);
      ctx.fillStyle = '#1e2633';
      ctx.fillRect(sFx - 4, sFy - 3, 8, 9);
      ctx.fillStyle = '#475569';
      ctx.fillRect(sFx - 3, sFy - 1, 6, 6);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(sFx - 4, sFy - 3, 8, 2);

      drawSegment(ctx, sFx, sFy + 3, eFx, eFy, 6, '#0f131a', '#1e2633', '#334155', '#080a0e');
      ctx.fillStyle = '#1e2633';
      ctx.fillRect(eFx - 3, eFy - 3, 6, 6);
      ctx.fillStyle = '#475569';
      ctx.fillRect(eFx - 1, eFy - 1, 2, 2);
      drawSegment(ctx, eFx, eFy, wFx, wFy, 5, '#0f131a', '#1e2633', '#334155', '#080a0e');
      // Gaunt ashen hand & fingers
      ctx.fillStyle = '#141820';
      ctx.fillRect(wFx - 3, wFy - 3, 6, 6);
      ctx.fillStyle = '#8d99ae';
      ctx.fillRect(wFx - 2, wFy - 2, 4, 4);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(wFx - 1, wFy - 1, 2, 2);

      // ── 9. AURA / CHARGE SPARK PARTICLES ──
      if (auraLevel > 0) {
        ctx.fillStyle = auraLevel > 1 ? '#ff3300' : '#ff9900';
        ctx.fillRect(12, 70, 3, 3);
        ctx.fillRect(58, 66, 3, 3);
        ctx.fillRect(16, 42, 2, 2);
        ctx.fillRect(56, 34, 2, 2);
        ctx.fillStyle = '#ffff66';
        ctx.fillRect(22, 76, 2, 2);
        ctx.fillRect(50, 74, 2, 2);
      }

      return canvas;
    };

    // ─── 1. KAEL IDLE (8 frames with fluid anatomical breathing & contrapposto) ───
    for (let f = 0; f < 8; f++) {
      const phase = f * Math.PI * 2 / 8;
      const bob = Math.sin(phase) * 1.5;
      const capeFlow = Math.sin(phase) * 1.8;
      const tAngF = 0.08 + Math.sin(phase) * 0.04;
      const kAngF = 0.12 - Math.sin(phase) * 0.03;
      const tAngB = -0.06 - Math.sin(phase) * 0.04;
      const kAngB = 0.14 + Math.sin(phase) * 0.03;
      const aAngF = 0.10 + Math.sin(phase) * 0.05;
      const aAngB = -0.08 - Math.sin(phase) * 0.05;

      this.sprites.kael.idle.push(renderArticulatedKael(w, h, {
        bob, capeFlow,
        tAngF, kAngF, tAngB, kAngB,
        aAngF, aAngB,
        swordMode: 'sheathed'
      }));
    }

    // ─── 2. KAEL RUN (10 frames: realistic passing gait, arm swing, & foot roll) ───
    for (let f = 0; f < 10; f++) {
      const p = f * Math.PI * 2 / 10;
      const bob = Math.abs(Math.sin(p)) * 2.5 - 1.2;
      const torsoTilt = 0.10;
      const headTilt = -0.04;
      const capeFlow = -Math.sin(p) * 4.5;
      const capeLift = Math.abs(Math.cos(p)) * 6.0;

      const tAngF = Math.sin(p) * 0.55;
      const kAngF = tAngF > 0 ? Math.sin(p) * 0.70 : Math.max(0, -Math.sin(p) * 0.4);
      const fAngF = tAngF > 0.2 ? -0.2 : 0.1;

      const tAngB = Math.sin(p + Math.PI) * 0.55;
      const kAngB = tAngB > 0 ? Math.sin(p + Math.PI) * 0.70 : Math.max(0, -Math.sin(p + Math.PI) * 0.4);
      const fAngB = tAngB > 0.2 ? -0.2 : 0.1;

      const aAngF = -Math.sin(p) * 0.45;
      const eAngF = Math.max(0.1, Math.sin(p) * 0.4);
      const aAngB = -Math.sin(p + Math.PI) * 0.45;
      const eAngB = Math.max(0.1, Math.sin(p + Math.PI) * 0.4);

      this.sprites.kael.run.push(renderArticulatedKael(w, h, {
        bob, torsoTilt, headTilt, capeFlow, capeLift,
        tAngF, kAngF, fAngF, tAngB, kAngB, fAngB,
        aAngF, eAngF, aAngB, eAngB,
        swordMode: 'sheathed'
      }));
    }

    // ─── 3. KAEL JUMP & AIRBORNE PHASES (6 keyframes: Launch -> Apex -> Fall) ───
    // F0: Launch Compression
    this.sprites.kael.jump.push(renderArticulatedKael(w, h, {
      bob: 2, crouch: 4, torsoTilt: 0.15, headTilt: -0.1, capeLift: 2,
      tAngF: -0.4, kAngF: 0.8, tAngB: 0.3, kAngB: 0.6,
      aAngF: -0.3, eAngF: 0.5, aAngB: 0.3, eAngB: 0.4
    }));
    // F1: Ascending Stretch
    this.sprites.kael.jump.push(renderArticulatedKael(w, h, {
      bob: -2, crouch: -2, torsoTilt: -0.08, headTilt: 0.1, capeLift: 10,
      tAngF: 0.2, kAngF: 0.2, tAngB: -0.1, kAngB: 0.3,
      aAngF: 0.5, eAngF: 0.2, aAngB: -0.4, eAngB: 0.3
    }));
    // F2: Mid Ascent Tuck
    this.sprites.kael.jump.push(renderArticulatedKael(w, h, {
      bob: -1, torsoTilt: 0.05, headTilt: 0.05, capeLift: 7,
      tAngF: -0.2, kAngF: 0.6, tAngB: 0.2, kAngB: 0.5,
      aAngF: 0.2, eAngF: 0.4, aAngB: -0.2, eAngB: 0.4
    }));
    // F3: Apex Float
    this.sprites.kael.jump.push(renderArticulatedKael(w, h, {
      bob: 0, torsoTilt: 0, headTilt: 0, capeLift: 4,
      tAngF: 0.05, kAngF: 0.3, tAngB: -0.05, kAngB: 0.3,
      aAngF: 0.1, eAngF: 0.3, aAngB: -0.1, eAngB: 0.3
    }));
    // F4: Early Descent
    this.sprites.kael.jump.push(renderArticulatedKael(w, h, {
      bob: 1, torsoTilt: 0.08, headTilt: -0.05, capeLift: 8,
      tAngF: 0.15, kAngF: 0.4, tAngB: -0.15, kAngB: 0.4,
      aAngF: -0.2, eAngF: 0.3, aAngB: 0.2, eAngB: 0.3
    }));
    // F5: Fast Fall Windstream
    this.sprites.kael.jump.push(renderArticulatedKael(w, h, {
      bob: 1, torsoTilt: 0.12, headTilt: -0.1, capeLift: 14,
      tAngF: 0.25, kAngF: 0.5, tAngB: -0.2, kAngB: 0.5,
      aAngF: -0.4, eAngF: 0.2, aAngB: 0.3, eAngB: 0.2
    }));

    // ─── 4. KAEL CROUCH (Deep stealth & preparation stance) ───
    this.sprites.kael.crouch = renderArticulatedKael(w, h, {
      bob: 0, crouch: 8, torsoTilt: 0.22, headTilt: -0.15,
      tAngF: -0.5, kAngF: 1.2, tAngB: 0.5, kAngB: 1.1,
      aAngF: 0.4, eAngF: 0.8, aAngB: -0.2, eAngB: 0.6,
      swordMode: 'sheathed'
    });

    // ─── 5. KAEL CLIMB (6 frames: alternating hand/foot ascent) ───
    for (let f = 0; f < 6; f++) {
      const p = f * Math.PI * 2 / 6;
      const aAngF = Math.sin(p) * 0.6 + 0.3;
      const aAngB = -Math.sin(p) * 0.6 + 0.3;
      const tAngF = -Math.sin(p) * 0.4 + 0.2;
      const tAngB = Math.sin(p) * 0.4 + 0.2;
      this.sprites.kael.climb.push(renderArticulatedKael(w, h, {
        bob: Math.sin(p * 2) * 1.5,
        tAngF, kAngF: 0.6, tAngB, kAngB: 0.6,
        aAngF, eAngF: 0.5, aAngB, eAngB: 0.5,
        swordMode: 'sheathed'
      }));
    }

    // ─── 6. KAEL ATTACK (6 frames: Swift Stabbing Thrusts with Basic Dagger) ───
    for (let f = 0; f < 6; f++) {
      const aw = 96, ah = 84;
      const { canvas, ctx } = this.createCanvas(aw, ah);

      if (f === 0) {
        // Windup: Dagger drawn back close to hip/chest, tensed forward crouch
        const base = renderArticulatedKael(w, h, {
          bob: 0, torsoTilt: -0.12, headTilt: 0.08,
          tAngF: 0.12, kAngF: 0.25, tAngB: -0.2, kAngB: 0.25,
          aAngF: 0.9, eAngF: 1.1, aAngB: -0.3, eAngB: 0.4,
          swordMode: 'none'
        });
        ctx.drawImage(base, 0, 0);

        // Dagger poised at hip
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(26, 38, 4, 6);
        ctx.fillStyle = '#475569';
        ctx.fillRect(24, 44, 8, 2);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(32, 44, 12, 3);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(42, 45, 4, 1);
      } else if (f === 1) {
        // Forward Lunge Initiation: Arm extending, thrusting dagger forward
        const base = renderArticulatedKael(w, h, {
          bob: 1, torsoTilt: 0.16, headTilt: -0.04,
          tAngF: -0.28, kAngF: 0.5, tAngB: 0.35, kAngB: 0.2,
          aAngF: -0.3, eAngF: 0.2, aAngB: 0.3, eAngB: 0.3,
          swordMode: 'none'
        });
        ctx.drawImage(base, 0, 0);

        // Dagger thrusting forward
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(38, 36, 6, 3);
        ctx.fillStyle = '#475569';
        ctx.fillRect(44, 34, 2, 7);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(46, 36, 26, 3);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(70, 37, 4, 1);

        // Swift stabbing kinetic trail
        ctx.fillStyle = 'rgba(0, 245, 212, 0.6)';
        ctx.fillRect(40, 37, 34, 1);
      } else if (f === 2) {
        // Explosive Forward Penetration Thrust & Puncturing Shockwave!
        const base = renderArticulatedKael(w, h, {
          bob: 2, torsoTilt: 0.24, headTilt: 0.04,
          tAngF: -0.42, kAngF: 0.65, tAngB: 0.48, kAngB: 0.15,
          aAngF: -0.55, eAngF: 0.05, aAngB: 0.5, eAngB: 0.2,
          swordMode: 'none'
        });
        ctx.drawImage(base, 0, 0);

        // Fully extended stabbing dagger
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(44, 34, 6, 3);
        ctx.fillStyle = '#475569';
        ctx.fillRect(50, 32, 2, 7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(52, 34, 32, 3);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(52, 34, 32, 1);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(82, 35, 4, 1);

        // Piercing stab shockwave & puncturing sparks
        ctx.save();
        ctx.strokeStyle = '#00f5d4';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(82, 35);
        ctx.lineTo(94, 35);
        ctx.stroke();

        // Puncture impact star
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(86, 30);
        ctx.lineTo(86, 40);
        ctx.moveTo(82, 32);
        ctx.lineTo(90, 38);
        ctx.moveTo(82, 38);
        ctx.lineTo(90, 32);
        ctx.stroke();
        ctx.restore();

        // Piercing sparks
        ctx.fillStyle = '#ff1e38';
        ctx.fillRect(84, 28, 2, 2);
        ctx.fillRect(88, 42, 2, 2);
        ctx.fillStyle = '#00f5d4';
        ctx.fillRect(92, 34, 3, 2);
        ctx.fillRect(80, 26, 2, 2);
      } else if (f === 3) {
        // Penetration Depth Apex & Blade Twist
        const base = renderArticulatedKael(w, h, {
          bob: 1, torsoTilt: 0.20, headTilt: 0.02,
          tAngF: -0.38, kAngF: 0.55, tAngB: 0.42, kAngB: 0.18,
          aAngF: -0.5, eAngF: 0.1, aAngB: 0.4, eAngB: 0.3,
          swordMode: 'none'
        });
        ctx.drawImage(base, 0, 0);

        // Dagger in twist position
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(44, 35, 6, 3);
        ctx.fillStyle = '#475569';
        ctx.fillRect(50, 33, 2, 7);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(52, 35, 28, 3);
        ctx.fillStyle = '#ff2a3b';
        ctx.fillRect(54, 36, 24, 1);

        // Lingering puncture trail
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 245, 212, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(46, 36);
        ctx.lineTo(84, 36);
        ctx.stroke();
        ctx.restore();
      } else if (f === 4) {
        // Swift Retraction / Pull-back
        const base = renderArticulatedKael(w, h, {
          bob: 1, torsoTilt: 0.08, headTilt: 0,
          tAngF: -0.2, kAngF: 0.35, tAngB: 0.2, kAngB: 0.25,
          aAngF: -0.2, eAngF: 0.35, aAngB: 0.2, eAngB: 0.35,
          swordMode: 'none'
        });
        ctx.drawImage(base, 0, 0);

        // Dagger pulled back
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(38, 38, 5, 3);
        ctx.fillStyle = '#475569';
        ctx.fillRect(43, 36, 2, 6);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(45, 38, 20, 3);
      } else {
        // Recovery to poised ready stance
        const base = renderArticulatedKael(w, h, {
          bob: 0, torsoTilt: 0, headTilt: 0,
          tAngF: 0.08, tAngB: -0.06,
          swordMode: 'sheathed'
        });
        ctx.drawImage(base, 0, 0);
      }

      this.sprites.kael.attack.push(canvas);
    }

    // ─── 7. KAEL HURT (3 frames: impact recoil & stagger) ───
    for (let f = 0; f < 3; f++) {
      const torsoTilt = f === 0 ? -0.25 : (f === 1 ? -0.15 : -0.05);
      const headTilt = f === 0 ? -0.2 : (f === 1 ? -0.1 : 0);
      const aAngF = f === 0 ? -0.4 : -0.2;
      const aAngB = f === 0 ? 0.4 : 0.2;
      const tAngF = f === 0 ? 0.3 : 0.15;
      const kAngF = f === 0 ? 0.4 : 0.2;
      const tAngB = f === 0 ? -0.3 : -0.15;
      const kAngB = f === 0 ? 0.4 : 0.2;
      this.sprites.kael.hurt.push(renderArticulatedKael(w, h, {
        bob: f === 0 ? -2 : 1,
        torsoTilt, headTilt,
        aAngF, aAngB,
        tAngF, kAngF, tAngB, kAngB,
        eyeColor: '#ffffff',
        swordMode: 'sheathed'
      }));
    }
  }

  // ─── ARTICULATED PROCEDURAL SKELETON (HIGH-DENSITY BONE FALLBACK) ───
  generateSkeletonSprites() {
    this.sprites.skeleton = { walk: [], idle: [], hit: [] };
    const sw = 48, sh = 48;

    // Helper for drawing an articulated bone segment
    const drawBone = (ctx, x1, y1, x2, y2, thick, col) => {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.hypot(dx, dy);
      if (len < 0.5) return;
      ctx.save();
      ctx.translate(x1, y1);
      ctx.rotate(Math.atan2(dy, dx));
      ctx.fillStyle = col || '#cbd5e1';
      ctx.fillRect(0, -thick / 2, len, thick);
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(1, -thick / 2 + 0.5, len - 2, Math.max(1, thick - 1));
      ctx.restore();
    };

    const renderArticulatedSkeleton = (opt) => {
      const { canvas, ctx } = this.createCanvas(sw, sh);
      const bob = opt.bob || 0;
      const sway = opt.sway || 0;
      const tAngF = opt.tAngF || 0;
      const kAngF = opt.kAngF || 0;
      const tAngB = opt.tAngB || 0;
      const kAngB = opt.kAngB || 0;
      const aAngF = opt.aAngF || 0;
      const aAngB = opt.aAngB || 0;

      const hipX = 24 + sway;
      const hipY = 24 + bob;
      const spineTopX = hipX;
      const spineTopY = hipY - 10;

      // 1. Back Arm with Scimitar
      const sBx = spineTopX - 3, sBy = spineTopY + 1;
      const eBx = sBx + Math.sin(aAngB) * 6, eBy = sBy + Math.cos(aAngB) * 6;
      const wBx = eBx + Math.sin(aAngB) * 6, wBy = eBy + Math.cos(aAngB) * 6;
      drawBone(ctx, sBx, sBy, eBx, eBy, 2, '#94a3b8');
      drawBone(ctx, eBx, eBy, wBx, wBy, 1.8, '#94a3b8');

      // 2. Back Leg
      const hBx = hipX - 2, hBy = hipY;
      const kBx = hBx + Math.sin(tAngB) * 7, kBy = hBy + Math.cos(tAngB) * 7;
      const aBx = kBx + Math.sin(tAngB + kAngB) * 7, aBy = kBy + Math.cos(tAngB + kAngB) * 7;
      drawBone(ctx, hBx, hBy, kBx, kBy, 2.2, '#94a3b8');
      drawBone(ctx, kBx, kBy, aBx, aBy, 2, '#94a3b8');
      ctx.fillStyle = '#64748b';
      ctx.fillRect(aBx - 1, aBy, 4, 2);

      // 3. Spine & Ribcage & Pelvis
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(hipX - 1, spineTopY, 2, 10);
      // Ribs
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(hipX - 4, spineTopY + 2, 8, 1.5);
      ctx.fillRect(hipX - 5, spineTopY + 4, 10, 1.5);
      ctx.fillRect(hipX - 4, spineTopY + 6, 8, 1.5);
      // Pelvis
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(hipX - 4, hipY - 2, 8, 3);

      // 4. Skull & Glowing Eye Sockets
      const skX = spineTopX;
      const skY = spineTopY - 9;
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(skX - 4, skY, 9, 8);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(skX - 3, skY + 1, 7, 7);
      ctx.fillStyle = '#0f172a'; // Eye Sockets
      ctx.fillRect(skX - 2, skY + 3, 2, 2);
      ctx.fillRect(skX + 2, skY + 3, 2, 2);
      ctx.fillStyle = '#ff1e38'; // Glowing red pupil pinpricks
      ctx.fillRect(skX - 2, skY + 3, 1, 1);
      ctx.fillRect(skX + 2, skY + 3, 1, 1);
      ctx.fillStyle = '#0f172a'; // Teeth / Jaw
      ctx.fillRect(skX - 2, skY + 6, 5, 2);

      // 5. Front Leg
      const hFx = hipX + 2, hFy = hipY;
      const kFx = hFx + Math.sin(tAngF) * 7, kFy = hFy + Math.cos(tAngF) * 7;
      const aFx = kFx + Math.sin(tAngF + kAngF) * 7, aFy = kFy + Math.cos(tAngF + kAngF) * 7;
      drawBone(ctx, hFx, hFy, kFx, kFy, 2.5, '#cbd5e1');
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(kFx - 1.5, kFy - 1.5, 3, 3);
      drawBone(ctx, kFx, kFy, aFx, aFy, 2.2, '#cbd5e1');
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(aFx - 1, aFy, 5, 2);

      // 6. Front Arm & Scimitar
      const sFx = spineTopX + 3, sFy = spineTopY + 1;
      const eFx = sFx + Math.sin(aAngF) * 6, eFy = sFy + Math.cos(aAngF) * 6;
      const wFx = eFx + Math.sin(aAngF) * 6, wFy = eFy + Math.cos(aAngF) * 6;
      drawBone(ctx, sFx, sFy, eFx, eFy, 2.2, '#e2e8f0');
      drawBone(ctx, eFx, eFy, wFx, wFy, 2, '#e2e8f0');
      // Jagged Scimitar in hand
      ctx.fillStyle = '#b45309';
      ctx.fillRect(wFx, wFy - 1, 3, 2);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(wFx + 2, wFy - 6, 2, 10);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(wFx + 3, wFy - 8, 1, 8);

      return canvas;
    };

    // 8 Walk frames
    for (let f = 0; f < 8; f++) {
      const p = f * Math.PI * 2 / 8;
      this.sprites.skeleton.walk.push(renderArticulatedSkeleton({
        bob: Math.abs(Math.sin(p)) * 1.5,
        sway: Math.sin(p) * 0.8,
        tAngF: Math.sin(p) * 0.55,
        kAngF: Math.max(0, -Math.sin(p + 0.4) * 0.7),
        tAngB: Math.sin(p + Math.PI) * 0.55,
        kAngB: Math.max(0, -Math.sin(p + Math.PI + 0.4) * 0.7),
        aAngF: -Math.sin(p) * 0.4,
        aAngB: Math.sin(p) * 0.4
      }));
    }

    // 6 Idle frames
    for (let f = 0; f < 6; f++) {
      const p = f * Math.PI * 2 / 6;
      this.sprites.skeleton.idle.push(renderArticulatedSkeleton({
        bob: Math.sin(p) * 0.8,
        sway: Math.sin(p) * 0.4,
        tAngF: 0.05, tAngB: -0.05,
        aAngF: 0.1, aAngB: -0.1
      }));
    }

    // 3 Hit frames
    for (let f = 0; f < 3; f++) {
      this.sprites.skeleton.hit.push(renderArticulatedSkeleton({
        bob: -1,
        sway: -2,
        tAngF: 0.3, kAngF: 0.3,
        tAngB: -0.2, kAngB: 0.2,
        aAngF: -0.4, aAngB: 0.4
      }));
    }
  }

  // ─── ABYSSAL BAT / GARGOYLE (FLYING HARASSER, 5 SPECIES × 6 FRAMES) ───
  generateBatSprites() {
    this.sprites.batTypes = {
      abyss: [],
      blood: [],
      gargoyle: [],
      frost: [],
      toxic: []
    };
    const bw = 40, bh = 32;

    const palettes = {
      abyss: {
        bodyDark: '#160917',
        bodyMid: '#2d142c',
        bodyLight: '#451c44',
        earInner: '#801336',
        eyeIris: '#ff0033',
        eyePupil: '#ffaa00',
        wingMem1: '#3b1c2b',
        wingMem2: '#2b1220',
        wingBone: '#6e2b47',
        claw: '#cbd5e1'
      },
      blood: {
        bodyDark: '#2a050d',
        bodyMid: '#4d0b1a',
        bodyLight: '#7a1129',
        earInner: '#b51736',
        eyeIris: '#ff1a40',
        eyePupil: '#ffe6eb',
        wingMem1: '#5c0a1a',
        wingMem2: '#420713',
        wingBone: '#9e152e',
        claw: '#fca5a5'
      },
      gargoyle: {
        bodyDark: '#1e242b',
        bodyMid: '#334155',
        bodyLight: '#475569',
        earInner: '#64748b',
        eyeIris: '#facc15',
        eyePupil: '#fef08a',
        wingMem1: '#334155',
        wingMem2: '#1e293b',
        wingBone: '#64748b',
        claw: '#94a3b8'
      },
      frost: {
        bodyDark: '#082f49',
        bodyMid: '#0369a1',
        bodyLight: '#0284c7',
        earInner: '#38bdf8',
        eyeIris: '#67e8f9',
        eyePupil: '#ffffff',
        wingMem1: '#0c4a6e',
        wingMem2: '#075985',
        wingBone: '#38bdf8',
        claw: '#e0f2fe'
      },
      toxic: {
        bodyDark: '#052e16',
        bodyMid: '#14532d',
        bodyLight: '#166534',
        earInner: '#22c55e',
        eyeIris: '#a855f7',
        eyePupil: '#f3e8ff',
        wingMem1: '#14532d',
        wingMem2: '#0f3d21',
        wingBone: '#22c55e',
        claw: '#86efac'
      }
    };

    for (const [typeKey, pal] of Object.entries(palettes)) {
      for (let f = 0; f < 6; f++) {
        const { canvas, ctx } = this.createCanvas(bw, bh);
        const phase = f * Math.PI * 2 / 6;

        // Wing animation angle & vertical body bob
        const wingElevation = Math.sin(phase); // -1 (down) to +1 (up)
        const bodyBob = Math.cos(phase) * 1.5;

        const cx = 20;
        const cy = 16 + bodyBob;

        // 1. Torso & Abdomen
        ctx.fillStyle = pal.bodyDark;
        ctx.fillRect(cx - 3, cy - 2, 6, 8);
        ctx.fillStyle = pal.bodyMid;
        ctx.fillRect(cx - 2, cy - 1, 4, 6);
        ctx.fillStyle = pal.bodyLight;
        ctx.fillRect(cx - 1, cy, 2, 4);

        // 2. Head with pointed ears & fangs
        ctx.fillStyle = pal.bodyDark;
        ctx.fillRect(cx - 4, cy - 8, 8, 7);
        // Ears / horns
        ctx.fillRect(cx - 4, cy - 11, 2, 4);
        ctx.fillRect(cx + 2, cy - 11, 2, 4);
        ctx.fillStyle = pal.earInner;
        ctx.fillRect(cx - 3, cy - 10, 1, 3);
        ctx.fillRect(cx + 2, cy - 10, 1, 3);

        // Glowing eyes
        ctx.fillStyle = pal.eyeIris;
        ctx.fillRect(cx - 3, cy - 6, 2, 2);
        ctx.fillRect(cx + 1, cy - 6, 2, 2);
        ctx.fillStyle = pal.eyePupil;
        ctx.fillRect(cx - 2, cy - 6, 1, 1);
        ctx.fillRect(cx + 1, cy - 6, 1, 1);

        // Fangs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx - 2, cy - 2, 1, 2);
        ctx.fillRect(cx + 1, cy - 2, 1, 2);

        // 3. Articulated Wings (Left and Right)
        const wingTipY = cy - 2 - wingElevation * 10;
        const wingElbowY = cy - 4 - wingElevation * 6;
        const wingElbowSpread = 10;
        const wingTipSpread = 18;

        [-1, 1].forEach(side => {
          const sx = cx + side * 3;
          const ex = cx + side * (3 + wingElbowSpread);
          const tx = cx + side * (3 + wingTipSpread);

          // Wing membrane polygon
          ctx.fillStyle = f % 2 === 0 ? pal.wingMem1 : pal.wingMem2;
          ctx.beginPath();
          ctx.moveTo(sx, cy);
          ctx.lineTo(ex, wingElbowY);
          ctx.lineTo(tx, wingTipY);
          ctx.lineTo(ex + side * 2, cy + 4);
          ctx.lineTo(sx, cy + 5);
          ctx.closePath();
          ctx.fill();

          // Bone struts
          ctx.strokeStyle = pal.wingBone;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(sx, cy - 2);
          ctx.lineTo(ex, wingElbowY);
          ctx.lineTo(tx, wingTipY);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(ex, wingElbowY);
          ctx.lineTo(ex + side * 2, cy + 4);
          ctx.stroke();

          // Knuckle claw
          ctx.fillStyle = pal.claw;
          ctx.fillRect(ex - 1, wingElbowY - 1, 2, 2);
        });

        // 4. Little clawed feet
        ctx.fillStyle = '#0f0511';
        ctx.fillRect(cx - 3, cy + 6, 2, 3);
        ctx.fillRect(cx + 1, cy + 6, 2, 3);

        this.sprites.batTypes[typeKey].push(canvas);
      }
    }

    // Default reference
    this.sprites.bat = this.sprites.batTypes.abyss;
  }

  // ─── SKULL PROJECTILE (ELEMENTAL CRANIUMS, 4 FRAMES) ───
  generateSkullProjectileSprites() {
    this.sprites.skullProjectiles = {
      skull: [],
      frost: [],
      necrotic: [],
      toxic: []
    };
    const pw = 24, ph = 24;

    const configs = {
      skull: {
        flameGrad: ['#ffffff', '#ffaa00', '#ff2200', 'rgba(255, 0, 0, 0)'],
        boneBase: '#cbd5e1',
        boneLight: '#f1f5f9',
        boneBrow: '#94a3b8',
        eyeOuter: '#ff2200',
        eyeInner: '#ffea00',
        flameCrown: ['#ff7700', '#ff3300']
      },
      frost: {
        flameGrad: ['#ffffff', '#7dd3fc', '#0284c7', 'rgba(2, 132, 199, 0)'],
        boneBase: '#bae6fd',
        boneLight: '#f0f9ff',
        boneBrow: '#38bdf8',
        eyeOuter: '#00e5ff',
        eyeInner: '#ffffff',
        flameCrown: ['#38bdf8', '#0284c7']
      },
      necrotic: {
        flameGrad: ['#f5d0fe', '#c084fc', '#7e22ce', 'rgba(126, 34, 206, 0)'],
        boneBase: '#e9d5ff',
        boneLight: '#faf5ff',
        boneBrow: '#a855f7',
        eyeOuter: '#d946ef',
        eyeInner: '#fdf4ff',
        flameCrown: ['#c084fc', '#7e22ce']
      },
      toxic: {
        flameGrad: ['#dcfce7', '#4ade80', '#15803d', 'rgba(21, 128, 61, 0)'],
        boneBase: '#bbf7d0',
        boneLight: '#f0fdf4',
        boneBrow: '#22c55e',
        eyeOuter: '#84cc16',
        eyeInner: '#facc15',
        flameCrown: ['#4ade80', '#15803d']
      }
    };

    for (const [key, cfg] of Object.entries(configs)) {
      for (let f = 0; f < 4; f++) {
        const { canvas, ctx } = this.createCanvas(pw, ph);
        const fireWobble = Math.sin(f * Math.PI / 2) * 1.5;

        // Trailing elemental wake
        const grad = ctx.createRadialGradient(8, 12, 1, 8, 12, 10);
        grad.addColorStop(0, cfg.flameGrad[0]);
        grad.addColorStop(0.3, cfg.flameGrad[1]);
        grad.addColorStop(0.7, cfg.flameGrad[2]);
        grad.addColorStop(1, cfg.flameGrad[3]);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(8 - f, 12 + fireWobble, 9, 0, Math.PI * 2);
        ctx.fill();

        // Skull Cranium
        ctx.fillStyle = cfg.boneBase;
        ctx.fillRect(10, 6, 9, 10);
        ctx.fillStyle = cfg.boneLight;
        ctx.fillRect(11, 7, 7, 8);

        // Brow ridge
        ctx.fillStyle = cfg.boneBrow;
        ctx.fillRect(10, 9, 9, 2);

        // Glowing eye sockets
        ctx.fillStyle = cfg.eyeOuter;
        ctx.fillRect(13, 10, 2, 2);
        ctx.fillRect(16, 10, 2, 2);
        ctx.fillStyle = cfg.eyeInner;
        ctx.fillRect(14, 10, 1, 1);
        ctx.fillRect(17, 10, 1, 1);

        // Nose cavity
        ctx.fillStyle = '#475569';
        ctx.fillRect(15, 12, 1, 2);

        // Teeth
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(12, 14, 6, 2);
        ctx.fillStyle = '#334155';
        ctx.fillRect(13, 14, 1, 2);
        ctx.fillRect(15, 14, 1, 2);

        // Flickering elemental crown on skull top
        ctx.fillStyle = f % 2 === 0 ? cfg.flameCrown[0] : cfg.flameCrown[1];
        ctx.fillRect(11, 4 + (f % 2), 2, 3);
        ctx.fillRect(14, 3 + ((f + 1) % 2), 2, 4);
        ctx.fillRect(17, 4 + (f % 2), 2, 3);

        this.sprites.skullProjectiles[key].push(canvas);
      }
    }

    this.sprites.skullProjectile = this.sprites.skullProjectiles.skull;
  }

  // ─── BOSSES: AZGALOR & GLACIOR (HIGH-DENSITY 144x144 CANVAS) ───
  generateBossSprites() {
    this.sprites.azgalor = { idle: [], attack: [], hurt: [] };
    this.sprites.glacior = { idle: [], attack: [], hurt: [] };
    this.sprites.minos = { idle: [], attack: [], hurt: [] };
    this.sprites.flegias = { idle: [], attack: [], hurt: [] };
    this.sprites.malacoda = { idle: [], attack: [], hurt: [] };

    const bw = 144, bh = 144;

    // ─── AZGALOR (SEÑOR DE LA LAVA Y EL FUEGO) ───
    for (let f = 0; f < 8; f++) {
      const { canvas, ctx } = this.createCanvas(bw, bh);
      const breath = Math.sin(f * Math.PI / 4) * 3.5;

      // 1. Demonic Colossal Obsidian Body
      ctx.fillStyle = '#0a0508';
      ctx.fillRect(36, 40 + breath, 72, 70);
      ctx.fillStyle = '#170c12';
      ctx.fillRect(40, 44 + breath, 64, 62);
      ctx.fillStyle = '#26141e';
      ctx.fillRect(46, 48 + breath, 52, 54);

      // 2. Pulsing Magma Fissures & Veins
      const glow = f % 2 === 0 ? '#ff8800' : '#ff4500';
      const core = f % 2 === 0 ? '#ffff66' : '#ffcc00';

      ctx.fillStyle = '#8b0000';
      ctx.fillRect(48, 54 + breath, 10, 32);
      ctx.fillRect(86, 58 + breath, 12, 30);
      ctx.fillRect(58, 86 + breath, 30, 10);

      ctx.fillStyle = glow;
      ctx.fillRect(50, 56 + breath, 6, 28);
      ctx.fillRect(88, 60 + breath, 8, 26);
      ctx.fillRect(60, 88 + breath, 26, 6);

      ctx.fillStyle = core;
      ctx.fillRect(52, 60 + breath, 2, 20);
      ctx.fillRect(90, 64 + breath, 3, 18);
      ctx.fillRect(64, 90 + breath, 18, 2);

      // 3. Horned Demonic Skull & Crown
      ctx.fillStyle = '#0e070c';
      ctx.fillRect(50, 18 + breath, 44, 30);
      ctx.fillStyle = '#21111a';
      ctx.fillRect(54, 22 + breath, 36, 22);

      // Giant Curling Obsidian Horns
      // Left horn
      ctx.fillStyle = '#0a0508';
      ctx.fillRect(34, 16 + breath, 16, 14);
      ctx.fillRect(24, 6 + breath, 14, 14);
      ctx.fillRect(16, -2 + breath, 10, 12);
      ctx.fillStyle = '#ff4500';
      ctx.fillRect(18, 0 + breath, 6, 6);
      ctx.fillStyle = '#ffff66';
      ctx.fillRect(20, 2 + breath, 2, 2);

      // Right horn
      ctx.fillStyle = '#0a0508';
      ctx.fillRect(94, 16 + breath, 16, 14);
      ctx.fillRect(106, 6 + breath, 14, 14);
      ctx.fillRect(118, -2 + breath, 10, 12);
      ctx.fillStyle = '#ff4500';
      ctx.fillRect(120, 0 + breath, 6, 6);
      ctx.fillStyle = '#ffff66';
      ctx.fillRect(122, 2 + breath, 2, 2);

      // Blazing Molten Eyes
      ctx.fillStyle = '#000000';
      ctx.fillRect(58, 28 + breath, 11, 7);
      ctx.fillRect(75, 28 + breath, 11, 7);
      ctx.fillStyle = '#ff3300';
      ctx.fillRect(59, 29 + breath, 9, 5);
      ctx.fillRect(76, 29 + breath, 9, 5);
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(61, 30 + breath, 5, 3);
      ctx.fillRect(78, 30 + breath, 5, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(62, 31 + breath, 2, 2);
      ctx.fillRect(79, 31 + breath, 2, 2);

      // Demonic Fanged Jaw
      ctx.fillStyle = '#170c12';
      ctx.fillRect(56, 40 + breath, 32, 10);
      ctx.fillStyle = '#ffffcc';
      for (let tx = 58; tx < 86; tx += 6) {
        ctx.fillRect(tx, 40 + breath, 3, 5);
      }

      // 4. Massive Spiked Magma Warhammer
      // Shaft
      ctx.fillStyle = '#262626';
      ctx.fillRect(110, 26, 10, 88);
      ctx.fillStyle = '#ffd700'; // Gold binding rings
      ctx.fillRect(108, 40, 14, 4);
      ctx.fillRect(108, 70, 14, 4);
      // Giant Stone Hammer Head
      ctx.fillStyle = '#140c10';
      ctx.fillRect(96, 18, 38, 28);
      ctx.fillStyle = '#2c1922';
      ctx.fillRect(98, 20, 34, 24);
      // Fiery Cracks on Hammer
      ctx.fillStyle = '#ff4500';
      ctx.fillRect(104, 24, 22, 6);
      ctx.fillRect(112, 30, 8, 10);
      ctx.fillStyle = '#ffff66';
      ctx.fillRect(108, 26, 14, 2);
      // Obsidian Spikes on Hammer
      ctx.fillStyle = '#0a0508';
      ctx.fillRect(92, 24, 4, 8);
      ctx.fillRect(134, 24, 4, 8);
      ctx.fillRect(110, 14, 8, 4);

      // 5. Heavy Armored Legs & Clawed Sabatons
      ctx.fillStyle = '#0a0508';
      ctx.fillRect(42, 110, 22, 28);
      ctx.fillRect(80, 110, 22, 28);
      ctx.fillStyle = '#1f1019';
      ctx.fillRect(45, 112, 16, 24);
      ctx.fillRect(83, 112, 16, 24);
      // Magma knees
      ctx.fillStyle = '#ff4500';
      ctx.fillRect(48, 116, 10, 6);
      ctx.fillRect(86, 116, 10, 6);
      // Claw feet
      ctx.fillStyle = '#0a0508';
      ctx.fillRect(38, 134, 28, 8);
      ctx.fillRect(78, 134, 28, 8);

      this.sprites.azgalor.idle.push(canvas);
    }

    // ─── GLACIOR (SEÑOR DE LA ESCARCHA Y EL HIELO PROFUNDO) ───
    for (let f = 0; f < 8; f++) {
      const { canvas, ctx } = this.createCanvas(bw, bh);
      const floatY = Math.sin(f * Math.PI / 4) * 6;

      // 1. Ethereal Spectral Wraith Robes
      ctx.fillStyle = '#040d1a';
      ctx.fillRect(42, 44 + floatY, 60, 72);
      ctx.fillStyle = '#0b233a';
      ctx.fillRect(46, 48 + floatY, 52, 64);
      ctx.fillStyle = '#164366';
      ctx.fillRect(52, 54 + floatY, 40, 52);
      ctx.fillStyle = '#3a86b7';
      ctx.fillRect(58, 60 + floatY, 28, 40);

      // Spectral frost tears / folds
      ctx.fillStyle = '#90e0ef';
      ctx.fillRect(64, 68 + floatY, 4, 28);
      ctx.fillRect(76, 72 + floatY, 4, 24);

      // Tattered icy fringe at bottom
      ctx.fillStyle = '#03045e';
      for (let tx = 44; tx < 100; tx += 6) {
        ctx.fillRect(tx, 114 + floatY - (tx % 4) * 2, 4, 8);
      }

      // 2. Glacial Crystal Shards (Orbiting around shoulders)
      const shardBob = Math.cos(f * Math.PI / 2) * 4;
      // Left Floating Ice Shard
      ctx.fillStyle = '#caf0f8';
      ctx.fillRect(28, 50 + floatY + shardBob, 8, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(30, 52 + floatY + shardBob, 4, 12);
      // Right Floating Ice Shard
      ctx.fillStyle = '#caf0f8';
      ctx.fillRect(108, 50 + floatY - shardBob, 8, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(110, 52 + floatY - shardBob, 4, 12);

      // 3. Crystal Ice Crown & Head
      ctx.fillStyle = '#0d2b45';
      ctx.fillRect(52, 20 + floatY, 40, 28);
      ctx.fillStyle = '#1d527d';
      ctx.fillRect(56, 24 + floatY, 32, 20);

      // Crystalline Spires (Diamond Ice Crown)
      ctx.fillStyle = '#90e0ef';
      ctx.fillRect(56, 8 + floatY, 6, 16);
      ctx.fillRect(68, 2 + floatY, 8, 22);
      ctx.fillRect(82, 8 + floatY, 6, 16);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(58, 10 + floatY, 2, 12);
      ctx.fillRect(71, 4 + floatY, 3, 18);
      ctx.fillRect(84, 10 + floatY, 2, 12);

      // Cold Ethereal Phantom Eyes
      ctx.fillStyle = '#020b14';
      ctx.fillRect(60, 30 + floatY, 10, 6);
      ctx.fillRect(74, 30 + floatY, 10, 6);
      ctx.fillStyle = '#48cae4';
      ctx.fillRect(61, 31 + floatY, 8, 4);
      ctx.fillRect(75, 31 + floatY, 8, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(63, 32 + floatY, 4, 2);
      ctx.fillRect(77, 32 + floatY, 4, 2);

      // 4. Glacial Runic Claymore (Frost Greatsword)
      ctx.fillStyle = '#0077b6';
      ctx.fillRect(108, 20, 8, 90);
      ctx.fillStyle = '#90e0ef';
      ctx.fillRect(110, 22, 4, 86);
      ctx.fillStyle = '#ffffff'; // Crystalline edge highlight
      ctx.fillRect(109, 24, 2, 82);
      // Ice Quillons
      ctx.fillStyle = '#03045e';
      ctx.fillRect(100, 36, 24, 6);
      ctx.fillStyle = '#00b4d8';
      ctx.fillRect(102, 38, 20, 2);
      // Glowing Frost Runes
      ctx.fillStyle = '#00ffff';
      ctx.fillRect(111, 44, 2, 8);
      ctx.fillRect(111, 60, 2, 10);
      ctx.fillRect(111, 78, 2, 8);

      this.sprites.glacior.idle.push(canvas);
    }

    // ─── MINOS (REY MINOS — JUEZ DEL INFIERNO) ───
    for (let f = 0; f < 8; f++) {
      const { canvas, ctx } = this.createCanvas(bw, bh);
      const breath = Math.sin(f * Math.PI / 4) * 3;
      const tailSway = Math.sin(f * Math.PI / 4) * 6;

      // 1. Serpentine Coiling Lower Body / Tail
      ctx.fillStyle = '#180a22';
      ctx.fillRect(32, 90, 80, 48);
      ctx.fillStyle = '#2d143e';
      ctx.fillRect(36, 94, 72, 40);
      ctx.fillStyle = '#4c1d6b';
      ctx.fillRect(42, 100, 60, 28);
      // Coiling tail curves to left and right
      ctx.fillStyle = '#180a22';
      ctx.fillRect(16 + tailSway, 108, 24, 28);
      ctx.fillRect(100 - tailSway, 112, 28, 24);
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(18 + tailSway, 112, 18, 20);
      ctx.fillRect(104 - tailSway, 116, 20, 16);
      // Tail scales & gold bands of judgment
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(30 + tailSway, 114, 6, 18);
      ctx.fillRect(108 - tailSway, 118, 6, 14);
      ctx.fillRect(66, 104, 12, 6);

      // 2. Royal Abyssal Robes & Muscular Torso
      ctx.fillStyle = '#12071a';
      ctx.fillRect(44, 46 + breath, 56, 52);
      ctx.fillStyle = '#261036';
      ctx.fillRect(48, 50 + breath, 48, 44);
      ctx.fillStyle = '#581c87';
      ctx.fillRect(54, 56 + breath, 36, 32);
      // Gold ornate chasuble trim
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(52, 48 + breath, 40, 4);
      ctx.fillRect(70, 52 + breath, 4, 38);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(54, 50 + breath, 36, 2);

      // 3. Demonic Royal Head & Crown of Ivory Bones
      ctx.fillStyle = '#1e0c29';
      ctx.fillRect(54, 20 + breath, 36, 28);
      ctx.fillStyle = '#3b1850';
      ctx.fillRect(58, 24 + breath, 28, 20);

      // Bone Crown Spikes
      ctx.fillStyle = '#f5f3ff';
      ctx.fillRect(52, 10 + breath, 6, 16);
      ctx.fillRect(62, 4 + breath, 8, 22);
      ctx.fillRect(74, 4 + breath, 8, 22);
      ctx.fillRect(86, 10 + breath, 6, 16);
      ctx.fillStyle = '#d8b4fe';
      ctx.fillRect(54, 12 + breath, 2, 12);
      ctx.fillRect(65, 6 + breath, 2, 18);
      ctx.fillRect(77, 6 + breath, 2, 18);
      ctx.fillRect(88, 12 + breath, 2, 12);

      // Crown Gold Base & Amethyst
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(52, 20 + breath, 40, 5);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(70, 19 + breath, 4, 6);

      // Piercing Void Purple Eyes of Judgment
      ctx.fillStyle = '#06010a';
      ctx.fillRect(60, 28 + breath, 10, 6);
      ctx.fillRect(74, 28 + breath, 10, 6);
      ctx.fillStyle = '#c084fc';
      ctx.fillRect(61, 29 + breath, 8, 4);
      ctx.fillRect(75, 29 + breath, 8, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(63, 30 + breath, 3, 2);
      ctx.fillRect(77, 30 + breath, 3, 2);

      // 4. Sceptre of Damnation (Held in Left Hand)
      ctx.fillStyle = '#b45309';
      ctx.fillRect(20, 22, 8, 92);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(22, 24, 4, 88);
      // Sceptre Head (Eye of Damnation)
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(14, 12, 20, 16);
      ctx.fillStyle = '#581c87';
      ctx.fillRect(18, 16, 12, 8);
      ctx.fillStyle = '#e879f9';
      ctx.fillRect(22, 18, 4, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(23, 19, 2, 2);

      this.sprites.minos.idle.push(canvas);
    }

    // ─── FLEGIAS (PHLEGYAS — BARQUERO DE LA LAGUNA ESTIGIA) ───
    for (let f = 0; f < 8; f++) {
      const { canvas, ctx } = this.createCanvas(bw, bh);
      const heave = Math.sin(f * Math.PI / 4) * 3.5;

      // 1. Hulking Swamp-Drenched Ogre Torso
      ctx.fillStyle = '#0f2419';
      ctx.fillRect(36, 42 + heave, 72, 70);
      ctx.fillStyle = '#1c4530';
      ctx.fillRect(40, 46 + heave, 64, 62);
      ctx.fillStyle = '#2d6a4f';
      ctx.fillRect(46, 52 + heave, 52, 50);

      // Dripping Toxic Swamp Slime
      ctx.fillStyle = '#52b788';
      ctx.fillRect(48, 64 + heave, 6, 26);
      ctx.fillRect(62, 74 + heave, 8, 28);
      ctx.fillRect(82, 60 + heave, 6, 30);
      ctx.fillStyle = '#74c69d';
      ctx.fillRect(49, 70 + heave, 3, 18);
      ctx.fillRect(64, 80 + heave, 4, 20);
      ctx.fillRect(83, 68 + heave, 3, 20);

      // 2. Brutish Hunched Head & Iron Swamp Brow
      ctx.fillStyle = '#142e20';
      ctx.fillRect(48, 18 + heave, 48, 30);
      ctx.fillStyle = '#1f4532';
      ctx.fillRect(52, 22 + heave, 40, 22);

      // Heavy Brow & Rotten Iron Band
      ctx.fillStyle = '#262626';
      ctx.fillRect(46, 22 + heave, 52, 6);
      ctx.fillStyle = '#78350f'; // Rust
      ctx.fillRect(50, 24 + heave, 44, 2);

      // Glowing Bile Green Eyes
      ctx.fillStyle = '#05130b';
      ctx.fillRect(56, 30 + heave, 11, 6);
      ctx.fillRect(77, 30 + heave, 11, 6);
      ctx.fillStyle = '#00ff88';
      ctx.fillRect(57, 31 + heave, 9, 4);
      ctx.fillRect(78, 31 + heave, 9, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(60, 32 + heave, 3, 2);
      ctx.fillRect(81, 32 + heave, 3, 2);

      // Jagged Bog Tusks
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(56, 42 + heave, 5, 8);
      ctx.fillRect(83, 42 + heave, 5, 8);

      // 3. Styx Barge Oar / War Halberd (Rotting timber with iron blade)
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(112, 14, 12, 112);
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(115, 6, 6, 108);
      // Rotten Iron Oar Blade
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(100, 10, 36, 32);
      ctx.fillStyle = '#374151';
      ctx.fillRect(104, 14, 28, 24);
      ctx.fillStyle = '#52b788'; // Slime on blade
      ctx.fillRect(102, 34, 32, 6);

      // 4. Heavy Mud-Soaked Legs
      ctx.fillStyle = '#0f2419';
      ctx.fillRect(40, 110, 26, 28);
      ctx.fillRect(78, 110, 26, 28);
      ctx.fillStyle = '#1c4530';
      ctx.fillRect(44, 114, 18, 22);
      ctx.fillRect(82, 114, 18, 22);
      // Muddy Sabatons
      ctx.fillStyle = '#1b4332';
      ctx.fillRect(34, 132, 36, 10);
      ctx.fillRect(74, 132, 36, 10);

      this.sprites.flegias.idle.push(canvas);
    }

    // ─── MALACODA (CAPITÁN DE LOS DIABLOS MALEBRANCHE) ───
    for (let f = 0; f < 8; f++) {
      const { canvas, ctx } = this.createCanvas(bw, bh);
      const flap = Math.sin(f * Math.PI / 4) * 7;

      // 1. Giant Leathery Bat / Demon Wings
      ctx.fillStyle = '#3b0d11';
      // Left wing
      ctx.beginPath();
      ctx.moveTo(48, 56);
      ctx.lineTo(12, 20 + flap);
      ctx.lineTo(26, 68 + flap);
      ctx.lineTo(10, 92 + flap);
      ctx.lineTo(48, 80);
      ctx.closePath();
      ctx.fill();
      // Right wing
      ctx.beginPath();
      ctx.moveTo(96, 56);
      ctx.lineTo(132, 20 + flap);
      ctx.lineTo(118, 68 + flap);
      ctx.lineTo(134, 92 + flap);
      ctx.lineTo(96, 80);
      ctx.closePath();
      ctx.fill();

      // Wing struts
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(20, 36 + flap, 24, 4);
      ctx.fillRect(100, 36 + flap, 24, 4);

      // 2. Barbed Sinewy Demon Body
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(44, 44, 56, 66);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(48, 48, 48, 58);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(54, 54, 36, 46);

      // Sulphur glowing cracks
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(58, 62, 4, 20);
      ctx.fillRect(82, 66, 4, 18);
      ctx.fillRect(66, 82, 12, 4);

      // 3. Gargoyle Head & Sharp Horns
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(52, 18, 40, 28);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(56, 22, 32, 20);

      // Curling Sharp Red Horns
      ctx.fillStyle = '#1c0406';
      ctx.fillRect(42, 12, 12, 10);
      ctx.fillRect(36, 4, 8, 10);
      ctx.fillRect(90, 12, 12, 10);
      ctx.fillRect(100, 4, 8, 10);
      ctx.fillStyle = '#f59e0b'; // Sulphur horn tips
      ctx.fillRect(34, 2, 4, 4);
      ctx.fillRect(106, 2, 4, 4);

      // Sulphur Fire Eyes
      ctx.fillStyle = '#000000';
      ctx.fillRect(60, 28, 10, 6);
      ctx.fillRect(74, 28, 10, 6);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(61, 29, 8, 4);
      ctx.fillRect(75, 29, 8, 4);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(63, 30, 4, 2);
      ctx.fillRect(77, 30, 4, 2);

      // 4. Barbed Pitchfork / Sulphur Trident
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(106, 12, 8, 108);
      ctx.fillStyle = '#475569';
      ctx.fillRect(108, 14, 4, 104);
      // Three Barbed Prongs
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(94, 8, 4, 22);
      ctx.fillRect(108, 0, 4, 30);
      ctx.fillRect(122, 8, 4, 22);
      ctx.fillRect(94, 26, 32, 5);

      // 5. Claws & Legs
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(48, 108, 20, 28);
      ctx.fillRect(76, 108, 20, 28);
      ctx.fillStyle = '#1c0406';
      ctx.fillRect(42, 130, 28, 8);
      ctx.fillRect(74, 130, 28, 8);

      this.sprites.malacoda.idle.push(canvas);
    }
  }

  // ─── SOLDIER (NPC IN PROLOGUE / HUB) — HIGH-DENSITY 64x76 CANVAS ───
  generateNpcSprites() {
    this.sprites.soldier = { idle: [] };
    const w = 64, h = 76;

    for (let f = 0; f < 8; f++) {
      const { canvas, ctx } = this.createCanvas(w, h);
      const breath = Math.sin(f * Math.PI / 4) * 1.5;

      // 1. Cape / Cloak (Dark Royal Blue back)
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(18, 28 + breath, 28, 42);
      ctx.fillStyle = '#172554';
      ctx.fillRect(20, 32 + breath, 24, 38);

      // 2. Armor Legs & Steel Boots
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(24, 56 + breath, 7, 16);
      ctx.fillRect(33, 56 + breath, 7, 16);
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(24, 68 + breath, 7, 4);
      ctx.fillRect(33, 68 + breath, 7, 4);

      // 3. Steel Plate Cuirass & Belt
      ctx.fillStyle = '#374151';
      ctx.fillRect(22, 28 + breath, 20, 28);
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(24, 30 + breath, 16, 24);
      ctx.fillStyle = '#6b7280'; // Plate highlight
      ctx.fillRect(26, 32 + breath, 12, 10);
      // Gold/Bronze Buckle & Belt
      ctx.fillStyle = '#78350f';
      ctx.fillRect(22, 48 + breath, 20, 4);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(30, 47 + breath, 4, 6);

      // 4. Shoulder Pauldrons
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(18, 26 + breath, 6, 8);
      ctx.fillRect(40, 26 + breath, 6, 8);
      ctx.fillStyle = '#9ca3af';
      ctx.fillRect(19, 27 + breath, 4, 2);
      ctx.fillRect(41, 27 + breath, 4, 2);

      // 5. Steel Helmet (matches Soldado portrait)
      ctx.fillStyle = '#374151';
      ctx.fillRect(24, 10 + breath, 16, 18);
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(25, 11 + breath, 14, 16);
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(26, 12 + breath, 12, 6);
      // Helmet plume / crest
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(30, 5 + breath, 4, 7);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(31, 6 + breath, 2, 5);
      // Visor Eye Slit
      ctx.fillStyle = '#111827';
      ctx.fillRect(26, 20 + breath, 12, 4);
      ctx.fillStyle = '#93c5fd'; // Eye glint
      ctx.fillRect(28, 21 + breath, 2, 2);
      ctx.fillRect(34, 21 + breath, 2, 2);

      // 6. Guard Halberd / Spear
      // Wooden Pole
      ctx.fillStyle = '#5a3825';
      ctx.fillRect(48, 6, 4, 64);
      ctx.fillStyle = '#7c4d32';
      ctx.fillRect(49, 8, 2, 60);
      // Steel Spearhead & Blade
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(47, 4, 6, 12);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(48, 2, 4, 14);
      ctx.fillRect(49, 0, 2, 6);
      // Halberd side axe blade
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(52, 6, 6, 8);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(56, 7, 2, 6);

      this.sprites.soldier.idle.push(canvas);
    }
  }

  // ─── PROPS & ENVIRONMENT ───
  generateEnvironmentSprites() {
    this.sprites.props = {};

    // Torches (4 animated frames)
    this.sprites.props.torch = [];
    for (let f = 0; f < 4; f++) {
      const { canvas, ctx } = this.createCanvas(16, 24);
      // Metal bracket
      ctx.fillStyle = '#333';
      ctx.fillRect(6, 12, 4, 10);
      // Flame
      const fh = 7 + (f % 2) * 2;
      ctx.fillStyle = '#ff3300';
      ctx.fillRect(5, 12 - fh, 6, fh);
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(6, 14 - fh, 4, fh - 2);
      this.sprites.props.torch.push(canvas);
    }

    // Blue Torch (for cold/dark sections)
    this.sprites.props.blueTorch = [];
    for (let f = 0; f < 4; f++) {
      const { canvas, ctx } = this.createCanvas(16, 24);
      ctx.fillStyle = '#333';
      ctx.fillRect(6, 12, 4, 10);
      const fh = 7 + (f % 2) * 2;
      ctx.fillStyle = '#0077b6';
      ctx.fillRect(5, 12 - fh, 6, fh);
      ctx.fillStyle = '#90e0ef';
      ctx.fillRect(6, 14 - fh, 4, fh - 2);
      this.sprites.props.blueTorch.push(canvas);
    }

    // Spikes (Pinchos)
    const { canvas: sc, ctx: sctx } = this.createCanvas(32, 16);
    sctx.fillStyle = '#666';
    for (let i = 0; i < 4; i++) {
      sctx.beginPath();
      sctx.moveTo(i * 8, 16);
      sctx.lineTo(i * 8 + 4, 0);
      sctx.lineTo(i * 8 + 8, 16);
      sctx.fill();
    }
    // Dried blood on spikes
    sctx.fillStyle = '#8a0f1d';
    sctx.fillRect(3, 4, 2, 6);
    sctx.fillRect(11, 2, 2, 8);
    sctx.fillRect(19, 5, 2, 5);
    sctx.fillRect(27, 3, 2, 7);
    this.sprites.props.spikes = sc;

    // 1. Platform Stone Tile (Gothic Basalt Masonry)
    const { canvas: sc2, ctx: spctx } = this.createCanvas(32, 32);
    spctx.fillStyle = '#1c1622';
    spctx.fillRect(0, 0, 32, 32);
    spctx.fillStyle = '#34293e';
    spctx.fillRect(0, 0, 32, 4); // Top bevel
    spctx.fillStyle = '#0f0a14';
    spctx.fillRect(0, 30, 32, 2); // Bottom shadow
    // Mortar grid & weathered blocks
    spctx.fillStyle = '#100c16';
    spctx.fillRect(0, 16, 32, 1);
    spctx.fillRect(16, 0, 1, 16);
    spctx.fillRect(8, 17, 1, 15);
    spctx.fillRect(24, 17, 1, 15);
    // Stone chiseling highlights
    spctx.fillStyle = '#453653';
    spctx.fillRect(1, 1, 14, 1);
    spctx.fillRect(17, 1, 14, 1);
    spctx.fillRect(1, 17, 6, 1);
    spctx.fillRect(9, 17, 14, 1);
    this.sprites.props.stoneTile = sc2;

    // 2. Platform Obsidian Tile (Cracked Magma Obsidian)
    const { canvas: oc, ctx: opctx } = this.createCanvas(32, 32);
    opctx.fillStyle = '#0a0408';
    opctx.fillRect(0, 0, 32, 32);
    // Vitreous glass facets
    opctx.fillStyle = '#1c0c17';
    opctx.fillRect(2, 2, 12, 12);
    opctx.fillRect(18, 16, 12, 14);
    // Glowing Molten Magma Fissures
    opctx.fillStyle = '#b31500'; // Dark magma crust
    opctx.fillRect(14, 0, 3, 32);
    opctx.fillRect(0, 14, 32, 3);
    opctx.fillStyle = '#ff4500'; // Fiery red vein
    opctx.fillRect(15, 0, 2, 32);
    opctx.fillRect(0, 15, 32, 2);
    opctx.fillStyle = '#ffaa00'; // Core heat
    opctx.fillRect(15, 6, 1, 20);
    opctx.fillRect(6, 15, 20, 1);
    opctx.fillStyle = '#ffff66'; // Superheated core intersection
    opctx.fillRect(15, 15, 2, 2);
    // Obsidian top coping
    opctx.fillStyle = '#ff5500';
    opctx.fillRect(0, 0, 32, 3);
    opctx.fillStyle = '#ffbb33';
    opctx.fillRect(0, 0, 32, 1);
    this.sprites.props.obsidianTile = oc;

    // 3. Platform Bone Tile (Corrupted Titan Bone)
    const { canvas: bc, ctx: bpctx } = this.createCanvas(32, 32);
    bpctx.fillStyle = '#261f22';
    bpctx.fillRect(0, 0, 32, 32);
    // Fossilized bone plates
    bpctx.fillStyle = '#42363b';
    bpctx.fillRect(2, 4, 13, 12);
    bpctx.fillRect(17, 4, 13, 12);
    bpctx.fillRect(2, 18, 28, 12);
    // Calcified ivory highlights
    bpctx.fillStyle = '#8f7b7f';
    bpctx.fillRect(2, 4, 13, 2);
    bpctx.fillRect(17, 4, 13, 2);
    bpctx.fillRect(2, 18, 28, 2);
    // Bone fissures / marrow cavities
    bpctx.fillStyle = '#140e11';
    bpctx.fillRect(6, 8, 4, 4);
    bpctx.fillRect(22, 9, 3, 5);
    bpctx.fillRect(12, 22, 6, 4);
    // Top calcified ivory rim
    bpctx.fillStyle = '#c4b3a5';
    bpctx.fillRect(0, 0, 32, 3);
    bpctx.fillStyle = '#f0e6dc';
    bpctx.fillRect(0, 0, 32, 1);
    this.sprites.props.boneTile = bc;

    // 4. Platform Runic Tile (Brimstone Runic Stone)
    const { canvas: rc, ctx: rpctx } = this.createCanvas(32, 32);
    rpctx.fillStyle = '#14091e';
    rpctx.fillRect(0, 0, 32, 32);
    rpctx.fillStyle = '#28133a';
    rpctx.fillRect(2, 2, 28, 28);
    // Carved Runic Glyph (Demonic Seal)
    rpctx.fillStyle = '#7a0099';
    rpctx.fillRect(10, 8, 12, 16);
    rpctx.fillStyle = '#ff0055'; // Glowing runic stroke
    rpctx.fillRect(11, 9, 10, 2);
    rpctx.fillRect(15, 11, 2, 10);
    rpctx.fillRect(12, 17, 8, 2);
    rpctx.fillRect(11, 21, 10, 2);
    // Arcane sparkle core
    rpctx.fillStyle = '#ffaae5';
    rpctx.fillRect(15, 16, 2, 2);
    // Top glowing amethyst rim
    rpctx.fillStyle = '#d000ff';
    rpctx.fillRect(0, 0, 32, 3);
    rpctx.fillStyle = '#ff88ff';
    rpctx.fillRect(0, 0, 32, 1);
    this.sprites.props.runicTile = rc;

    // 5. Platform Ice Tile (Glacial Permafrost)
    const { canvas: ic, ctx: ipctx } = this.createCanvas(32, 32);
    ipctx.fillStyle = '#0b1d30';
    ipctx.fillRect(0, 0, 32, 32);
    // Crystalline ice refraction facets
    ipctx.fillStyle = '#174066';
    ipctx.fillRect(2, 2, 14, 14);
    ipctx.fillRect(18, 16, 12, 14);
    // Crystalline frost fractures
    ipctx.fillStyle = '#48cae4';
    ipctx.fillRect(0, 15, 14, 1);
    ipctx.fillRect(14, 10, 1, 12);
    ipctx.fillRect(15, 21, 17, 1);
    ipctx.fillRect(24, 6, 1, 15);
    // Glistening prism highlights
    ipctx.fillStyle = '#caf0f8';
    ipctx.fillRect(4, 4, 3, 3);
    ipctx.fillRect(20, 20, 3, 3);
    // Glacial top frost coping
    ipctx.fillStyle = '#00b4d8';
    ipctx.fillRect(0, 0, 32, 3);
    ipctx.fillStyle = '#ffffff';
    ipctx.fillRect(0, 0, 32, 1);
    this.sprites.props.iceTile = ic;

    // 6. Platform Gold Tile (Greed Vault - Círculo IV: Avaricia)
    const { canvas: gc, ctx: gpctx } = this.createCanvas(32, 32);
    gpctx.fillStyle = '#451a03';
    gpctx.fillRect(0, 0, 32, 32);
    gpctx.fillStyle = '#78350f';
    gpctx.fillRect(2, 2, 28, 28);
    // Gold Ingots & Coins embedded in stone
    gpctx.fillStyle = '#b45309';
    gpctx.fillRect(4, 6, 11, 8);
    gpctx.fillRect(17, 6, 11, 8);
    gpctx.fillRect(4, 18, 24, 10);
    // Gleaming 24k Gold Luster
    gpctx.fillStyle = '#f59e0b';
    gpctx.fillRect(5, 7, 9, 6);
    gpctx.fillRect(18, 7, 9, 6);
    gpctx.fillRect(5, 19, 22, 8);
    gpctx.fillStyle = '#fef08a';
    gpctx.fillRect(5, 7, 9, 2);
    gpctx.fillRect(18, 7, 9, 2);
    gpctx.fillRect(5, 19, 22, 2);
    // Embedded gems (Ruby & Emerald)
    gpctx.fillStyle = '#ef4444';
    gpctx.fillRect(8, 22, 4, 4);
    gpctx.fillStyle = '#ffffff';
    gpctx.fillRect(9, 23, 1, 1);
    gpctx.fillStyle = '#10b981';
    gpctx.fillRect(20, 22, 4, 4);
    // Top Gold Trim
    gpctx.fillStyle = '#fbbf24';
    gpctx.fillRect(0, 0, 32, 3);
    gpctx.fillStyle = '#ffffff';
    gpctx.fillRect(0, 0, 32, 1);
    this.sprites.props.goldTile = gc;

    // 7. Platform Mud Tile (Styx Bog - Círculo V: Estigia / Ira)
    const { canvas: mc, ctx: mpctx } = this.createCanvas(32, 32);
    mpctx.fillStyle = '#0f1f17';
    mpctx.fillRect(0, 0, 32, 32);
    // Swirling Viscous Mud Patches
    mpctx.fillStyle = '#1b382b';
    mpctx.fillRect(2, 2, 28, 28);
    mpctx.fillStyle = '#2d5a45';
    mpctx.fillRect(4, 6, 12, 10);
    mpctx.fillRect(16, 14, 12, 12);
    // Toxic Slime Bubbles
    mpctx.fillStyle = '#52b788';
    mpctx.fillRect(6, 8, 4, 4);
    mpctx.fillRect(20, 18, 5, 5);
    mpctx.fillRect(14, 22, 3, 3);
    mpctx.fillStyle = '#74c69d';
    mpctx.fillRect(7, 9, 2, 2);
    mpctx.fillRect(21, 19, 2, 2);
    // Putrid Swamp Gas highlight
    mpctx.fillStyle = '#95d5b2';
    mpctx.fillRect(7, 9, 1, 1);
    // Top Slime layer
    mpctx.fillStyle = '#40916c';
    mpctx.fillRect(0, 0, 32, 3);
    mpctx.fillStyle = '#74c69d';
    mpctx.fillRect(0, 0, 32, 1);
    this.sprites.props.mudTile = mc;
  }

  // ─── PROCEDURAL MULTI-BIOME NEXUS PARALLAX BACKGROUNDS ───
  generateInfernalBackgrounds() {
    this.sprites.biomes = {
      abyss: this.generateAbyssBg(),
      sunken: this.generateSunkenBg(),
      frozen: this.generateFrozenBg(),
      surface: this.generateSurfaceBg(),
      prologue: this.generatePrologueBg()
    };
    // Backward compatibility
    this.sprites.infernalBg = this.sprites.biomes.abyss;
  }

  // 1. BIOME: ABYSS (Torre 1 & Boss 1 — Mar de Lava, Luna de Sangre y Basalto)
  generateAbyssBg() {
    // Layer 1: Eclipsed Blood Moon & Volcanic Needle Spires (960 x 540, Seamless X)
    const { canvas: sc, ctx: sctx } = this.createCanvas(960, 540);
    for (let i = 0; i < 110; i++) {
      const sx = (i * 79 + 23) % 960;
      const sy = (i * 41 + 17) % 460;
      const sz = (i % 6 === 0) ? 2 : 1;
      sctx.fillStyle = (i % 3 === 0) ? '#ff8899' : (i % 2 === 0 ? '#ff3355' : '#881133');
      sctx.fillRect(sx, sy, sz, sz);
    }
    const moonX = 480, moonY = 140, moonR = 56;
    const coronaGrad = sctx.createRadialGradient(moonX, moonY, moonR - 6, moonX, moonY, moonR + 46);
    coronaGrad.addColorStop(0, 'rgba(255, 35, 65, 0.9)');
    coronaGrad.addColorStop(0.35, 'rgba(255, 95, 20, 0.5)');
    coronaGrad.addColorStop(0.7, 'rgba(180, 20, 45, 0.18)');
    coronaGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = coronaGrad;
    sctx.beginPath();
    sctx.arc(moonX, moonY, moonR + 46, 0, Math.PI * 2);
    sctx.fill();

    sctx.fillStyle = 'rgba(255, 120, 30, 0.38)';
    for (let a = 0; a < Math.PI * 2; a += 0.35) {
      const flLen = 14 + (Math.sin(a * 5) + 1) * 16;
      sctx.beginPath();
      sctx.moveTo(moonX + Math.cos(a) * moonR, moonY + Math.sin(a) * moonR);
      sctx.lineTo(moonX + Math.cos(a + 0.1) * (moonR + flLen), moonY + Math.sin(a + 0.1) * (moonR + flLen));
      sctx.lineTo(moonX + Math.cos(a + 0.2) * moonR, moonY + Math.sin(a + 0.2) * moonR);
      sctx.fill();
    }
    sctx.fillStyle = '#060107';
    sctx.beginPath();
    sctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    sctx.fill();
    sctx.strokeStyle = '#ff2a3b';
    sctx.lineWidth = 2.5;
    sctx.stroke();

    sctx.fillStyle = '#0e030a';
    sctx.beginPath();
    sctx.moveTo(0, 540);
    const spireHeights = [
      [0, 380], [70, 310], [130, 420], [210, 290], [290, 410],
      [380, 330], [450, 440], [520, 300], [610, 430], [700, 320],
      [790, 400], [870, 280], [960, 380]
    ];
    sctx.lineTo(spireHeights[0][0], spireHeights[0][1]);
    for (let p = 1; p < spireHeights.length; p++) sctx.lineTo(spireHeights[p][0], spireHeights[p][1]);
    sctx.lineTo(960, 540);
    sctx.closePath();
    sctx.fill();

    sctx.strokeStyle = '#180712';
    sctx.lineWidth = 3;
    sctx.beginPath();
    sctx.moveTo(70, 310); sctx.quadraticCurveTo(140, 370, 210, 290);
    sctx.moveTo(520, 300); sctx.quadraticCurveTo(610, 380, 700, 320);
    sctx.moveTo(870, 280); sctx.quadraticCurveTo(915, 340, 960, 380);
    sctx.moveTo(0, 380); sctx.quadraticCurveTo(35, 340, 70, 310);
    sctx.stroke();

    // Layer 2: Midground Basalt Ridges & Magma Cascades (960 x 540)
    const { canvas: mc, ctx: mctx } = this.createCanvas(960, 540);
    mctx.fillStyle = '#14050e';
    mctx.beginPath();
    mctx.moveTo(0, 540);
    const ridgePts = [
      [0, 410], [80, 340], [160, 390], [250, 310], [340, 420],
      [420, 330], [510, 440], [600, 320], [690, 400], [780, 315],
      [860, 390], [960, 410]
    ];
    mctx.lineTo(ridgePts[0][0], ridgePts[0][1]);
    for (let p = 1; p < ridgePts.length; p++) mctx.lineTo(ridgePts[p][0], ridgePts[p][1]);
    mctx.lineTo(960, 540);
    mctx.closePath();
    mctx.fill();

    const magmaVents = [
      { x: 80, y: 340, h: 180 }, { x: 250, y: 310, h: 210 },
      { x: 420, y: 330, h: 190 }, { x: 600, y: 320, h: 200 }, { x: 780, y: 315, h: 205 }
    ];
    for (const v of magmaVents) {
      mctx.fillStyle = 'rgba(255, 60, 0, 0.22)'; mctx.fillRect(v.x - 14, v.y, 32, v.h);
      mctx.fillStyle = '#ff3300'; mctx.fillRect(v.x - 4, v.y, 10, v.h);
      mctx.fillStyle = '#ff9900'; mctx.fillRect(v.x - 2, v.y, 6, v.h);
      mctx.fillStyle = '#ffff66'; mctx.fillRect(v.x, v.y, 2, v.h);
      mctx.fillStyle = '#ff6600'; mctx.fillRect(v.x - 8, v.y + v.h - 6, 18, 8);
    }

    // Layer 3: Tower Gothic Architecture & Arches (480 x 540)
    const { canvas: tc, ctx: tctx } = this.createCanvas(480, 540);
    tctx.fillStyle = '#0b060f';
    tctx.fillRect(0, 0, 46, 540); tctx.fillRect(434, 0, 46, 540);
    tctx.fillStyle = '#160c1d';
    tctx.fillRect(10, 0, 26, 540); tctx.fillRect(444, 0, 26, 540);
    tctx.fillStyle = '#241430';
    tctx.fillRect(18, 0, 10, 540); tctx.fillRect(452, 0, 10, 540);

    tctx.fillStyle = '#0b060f';
    tctx.beginPath();
    tctx.moveTo(46, 210); tctx.quadraticCurveTo(120, 85, 240, 65); tctx.lineTo(240, 25); tctx.quadraticCurveTo(100, 45, 46, 170);
    tctx.closePath(); tctx.fill();
    tctx.beginPath();
    tctx.moveTo(434, 210); tctx.quadraticCurveTo(360, 85, 240, 65); tctx.lineTo(240, 25); tctx.quadraticCurveTo(380, 45, 434, 170);
    tctx.closePath(); tctx.fill();
    tctx.strokeStyle = '#241430'; tctx.lineWidth = 3;
    tctx.beginPath();
    tctx.moveTo(46, 170); tctx.quadraticCurveTo(100, 45, 240, 25); tctx.quadraticCurveTo(380, 45, 434, 170);
    tctx.stroke();

    tctx.fillStyle = '#0b060f'; tctx.fillRect(46, 360, 388, 22);
    tctx.fillStyle = '#1b0e24'; tctx.fillRect(46, 364, 388, 6);
    tctx.fillStyle = '#07030a'; tctx.fillRect(220, 364, 40, 14);

    return { skySpires: sc, magmaPeaks: mc, towerArch: tc };
  }

  // 2. BIOME: SUNKEN NECROPOLIS (Torre 2 & Boss 2 — Laguna Estigia, Bóvedas de Oro Maldito y Sepulcros)
  generateSunkenBg() {
    // Layer 1: Subterranean Cavern Vaults & Spectral Moon (960 x 540)
    const { canvas: sc, ctx: sctx } = this.createCanvas(960, 540);
    // Bioluminescent spores and spectral wisps
    for (let i = 0; i < 120; i++) {
      const sx = (i * 83 + 19) % 960;
      const sy = (i * 47 + 29) % 480;
      const sz = (i % 5 === 0) ? 2 : 1;
      sctx.fillStyle = (i % 3 === 0) ? '#34d399' : (i % 2 === 0 ? '#10b981' : '#059669');
      sctx.fillRect(sx, sy, sz, sz);
    }
    // Ethereal Seafoam/Turquoise Moon behind subterranean mists
    const moonX = 480, moonY = 150, moonR = 50;
    const halo = sctx.createRadialGradient(moonX, moonY, moonR - 8, moonX, moonY, moonR + 50);
    halo.addColorStop(0, 'rgba(52, 211, 153, 0.85)');
    halo.addColorStop(0.4, 'rgba(16, 185, 129, 0.35)');
    halo.addColorStop(0.8, 'rgba(6, 78, 59, 0.12)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = halo;
    sctx.beginPath();
    sctx.arc(moonX, moonY, moonR + 50, 0, Math.PI * 2);
    sctx.fill();

    sctx.fillStyle = '#041612';
    sctx.beginPath();
    sctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    sctx.fill();
    sctx.strokeStyle = '#34d399';
    sctx.lineWidth = 2;
    sctx.stroke();

    // Drowned mausoleum spires and hanging stalactites (Seamless X: ends at 390)
    sctx.fillStyle = '#061a15';
    sctx.beginPath();
    sctx.moveTo(0, 540);
    const sunkenHeights = [
      [0, 390], [60, 320], [120, 430], [200, 310], [280, 410],
      [360, 330], [440, 440], [530, 300], [620, 420], [710, 325],
      [800, 405], [880, 295], [960, 390]
    ];
    sctx.lineTo(sunkenHeights[0][0], sunkenHeights[0][1]);
    for (let p = 1; p < sunkenHeights.length; p++) sctx.lineTo(sunkenHeights[p][0], sunkenHeights[p][1]);
    sctx.lineTo(960, 540);
    sctx.closePath();
    sctx.fill();

    // Hanging waterlogged rusted chains
    sctx.strokeStyle = '#0f2f27';
    sctx.lineWidth = 2.5;
    sctx.beginPath();
    sctx.moveTo(60, 320); sctx.quadraticCurveTo(130, 380, 200, 310);
    sctx.moveTo(530, 300); sctx.quadraticCurveTo(620, 370, 710, 325);
    sctx.moveTo(880, 295); sctx.quadraticCurveTo(920, 350, 960, 390);
    sctx.moveTo(0, 390); sctx.quadraticCurveTo(30, 350, 60, 320);
    sctx.stroke();

    // Layer 2: Midground Sunken Colonnade & Glowing Emerald Styx Waterfalls (960 x 540)
    const { canvas: mc, ctx: mctx } = this.createCanvas(960, 540);
    mctx.fillStyle = '#08231c';
    mctx.beginPath();
    mctx.moveTo(0, 540);
    const sunkenRidge = [
      [0, 415], [90, 335], [180, 395], [270, 325], [360, 425],
      [450, 345], [540, 435], [630, 330], [720, 410], [810, 335],
      [890, 395], [960, 415]
    ];
    mctx.lineTo(sunkenRidge[0][0], sunkenRidge[0][1]);
    for (let p = 1; p < sunkenRidge.length; p++) mctx.lineTo(sunkenRidge[p][0], sunkenRidge[p][1]);
    mctx.lineTo(960, 540);
    mctx.closePath();
    mctx.fill();

    // Cascading Emerald Styx Waterfalls
    const styxCascades = [
      { x: 90, y: 335, h: 190 }, { x: 270, y: 325, h: 200 },
      { x: 450, y: 345, h: 180 }, { x: 630, y: 330, h: 195 }, { x: 810, y: 335, h: 190 }
    ];
    for (const c of styxCascades) {
      mctx.fillStyle = 'rgba(16, 185, 129, 0.25)'; mctx.fillRect(c.x - 16, c.y, 36, c.h);
      mctx.fillStyle = '#059669'; mctx.fillRect(c.x - 5, c.y, 12, c.h);
      mctx.fillStyle = '#10b981'; mctx.fillRect(c.x - 3, c.y, 8, c.h);
      mctx.fillStyle = '#a7f3d0'; mctx.fillRect(c.x - 1, c.y, 3, c.h);
      // Phosphorescent splash
      mctx.fillStyle = '#34d399'; mctx.fillRect(c.x - 10, c.y + c.h - 6, 22, 8);
      // Tarnished gold vein highlights on stone rims
      mctx.fillStyle = '#fbbf24'; mctx.fillRect(c.x + 14, c.y + 4, 18, 3);
    }

    // Layer 3: Sunken Mossy Colonnades & Arches (480 x 540)
    const { canvas: tc, ctx: tctx } = this.createCanvas(480, 540);
    tctx.fillStyle = '#071612';
    tctx.fillRect(0, 0, 46, 540); tctx.fillRect(434, 0, 46, 540);
    tctx.fillStyle = '#0f2922';
    tctx.fillRect(10, 0, 26, 540); tctx.fillRect(444, 0, 26, 540);
    tctx.fillStyle = '#1b4337';
    tctx.fillRect(18, 0, 10, 540); tctx.fillRect(452, 0, 10, 540);
    // Moss & verdigris accents on pillars
    tctx.fillStyle = '#22c55e';
    tctx.fillRect(6, 120, 4, 45); tctx.fillRect(436, 180, 4, 50);
    tctx.fillRect(14, 280, 4, 35); tctx.fillRect(446, 320, 4, 40);

    tctx.fillStyle = '#071612';
    tctx.beginPath();
    tctx.moveTo(46, 210); tctx.quadraticCurveTo(120, 85, 240, 65); tctx.lineTo(240, 25); tctx.quadraticCurveTo(100, 45, 46, 170);
    tctx.closePath(); tctx.fill();
    tctx.beginPath();
    tctx.moveTo(434, 210); tctx.quadraticCurveTo(360, 85, 240, 65); tctx.lineTo(240, 25); tctx.quadraticCurveTo(380, 45, 434, 170);
    tctx.closePath(); tctx.fill();
    tctx.strokeStyle = '#1b4337'; tctx.lineWidth = 3;
    tctx.beginPath();
    tctx.moveTo(46, 170); tctx.quadraticCurveTo(100, 45, 240, 25); tctx.quadraticCurveTo(380, 45, 434, 170);
    tctx.stroke();

    // Beam & tarnished bronze relief
    tctx.fillStyle = '#071612'; tctx.fillRect(46, 360, 388, 22);
    tctx.fillStyle = '#13352c'; tctx.fillRect(46, 364, 388, 6);
    tctx.fillStyle = '#b45309'; tctx.fillRect(215, 364, 50, 14); // Tarnished gold plate
    tctx.fillStyle = '#fbbf24'; tctx.fillRect(230, 367, 20, 8);

    return { skySpires: sc, magmaPeaks: mc, towerArch: tc };
  }

  // 3. BIOME: FROZEN PEAKS (Torre 3 Base/Medio & Boss 3 — Cocito Glacial, Cumbres de Hielo y Ventiscas)
  generateFrozenBg() {
    // Layer 1: Arctic Celestial Aurora & Jagged Ice Spires (960 x 540)
    const { canvas: sc, ctx: sctx } = this.createCanvas(960, 540);
    for (let i = 0; i < 130; i++) {
      const sx = (i * 91 + 13) % 960;
      const sy = (i * 37 + 11) % 450;
      const sz = (i % 7 === 0) ? 2 : 1;
      sctx.fillStyle = (i % 3 === 0) ? '#e0f2fe' : (i % 2 === 0 ? '#7dd3fc' : '#38bdf8');
      sctx.fillRect(sx, sy, sz, sz);
    }
    // Ethereal Aurora Borealis cyan/blue ribbons across upper sky
    sctx.save();
    sctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    sctx.lineWidth = 18;
    sctx.beginPath();
    sctx.moveTo(0, 120); sctx.bezierCurveTo(240, 70, 480, 160, 720, 80); sctx.lineTo(960, 110);
    sctx.stroke();
    sctx.strokeStyle = 'rgba(167, 243, 208, 0.2)';
    sctx.lineWidth = 10;
    sctx.beginPath();
    sctx.moveTo(0, 95); sctx.bezierCurveTo(280, 140, 520, 60, 760, 130); sctx.lineTo(960, 85);
    sctx.stroke();
    sctx.restore();

    // Crystalline Permafrost Halo Moon
    const moonX = 480, moonY = 135, moonR = 52;
    const frostHalo = sctx.createRadialGradient(moonX, moonY, moonR - 8, moonX, moonY, moonR + 48);
    frostHalo.addColorStop(0, 'rgba(224, 242, 254, 0.9)');
    frostHalo.addColorStop(0.35, 'rgba(56, 189, 248, 0.45)');
    frostHalo.addColorStop(0.7, 'rgba(14, 165, 233, 0.16)');
    frostHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = frostHalo;
    sctx.beginPath();
    sctx.arc(moonX, moonY, moonR + 48, 0, Math.PI * 2);
    sctx.fill();

    sctx.fillStyle = '#061524';
    sctx.beginPath();
    sctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    sctx.fill();
    sctx.strokeStyle = '#bae6fd';
    sctx.lineWidth = 2.5;
    sctx.stroke();

    // Razor Ice Spires & Glacial Needles (Seamless X: ends at 370)
    sctx.fillStyle = '#071a2c';
    sctx.beginPath();
    sctx.moveTo(0, 540);
    const iceHeights = [
      [0, 370], [60, 280], [120, 410], [200, 270], [280, 390],
      [370, 310], [450, 420], [530, 260], [620, 410], [710, 290],
      [800, 390], [880, 265], [960, 370]
    ];
    sctx.lineTo(iceHeights[0][0], iceHeights[0][1]);
    for (let p = 1; p < iceHeights.length; p++) sctx.lineTo(iceHeights[p][0], iceHeights[p][1]);
    sctx.lineTo(960, 540);
    sctx.closePath();
    sctx.fill();

    // Layer 2: Glacial Ridges & Frozen Waterfalls (960 x 540)
    const { canvas: mc, ctx: mctx } = this.createCanvas(960, 540);
    mctx.fillStyle = '#0c243d';
    mctx.beginPath();
    mctx.moveTo(0, 540);
    const glacialPts = [
      [0, 400], [80, 320], [170, 380], [260, 300], [350, 410],
      [440, 320], [530, 420], [620, 310], [710, 390], [800, 305],
      [890, 380], [960, 400]
    ];
    mctx.lineTo(glacialPts[0][0], glacialPts[0][1]);
    for (let p = 1; p < glacialPts.length; p++) mctx.lineTo(glacialPts[p][0], glacialPts[p][1]);
    mctx.lineTo(960, 540);
    mctx.closePath();
    mctx.fill();

    // Cascades of solid frozen ice and crevasses
    const frozenWaterfalls = [
      { x: 80, y: 320, h: 200 }, { x: 260, y: 300, h: 220 },
      { x: 440, y: 320, h: 200 }, { x: 620, y: 310, h: 210 }, { x: 800, y: 305, h: 215 }
    ];
    for (const f of frozenWaterfalls) {
      mctx.fillStyle = 'rgba(56, 189, 248, 0.28)'; mctx.fillRect(f.x - 14, f.y, 32, f.h);
      mctx.fillStyle = '#0284c7'; mctx.fillRect(f.x - 5, f.y, 12, f.h);
      mctx.fillStyle = '#38bdf8'; mctx.fillRect(f.x - 3, f.y, 8, f.h);
      mctx.fillStyle = '#e0f2fe'; mctx.fillRect(f.x - 1, f.y, 3, f.h);
      // Ice crystal spikes at base
      mctx.fillStyle = '#ffffff'; mctx.fillRect(f.x - 8, f.y + f.h - 6, 18, 8);
      // Crystalline frost highlights along cliff ridges
      mctx.fillStyle = '#7dd3fc'; mctx.fillRect(f.x + 12, f.y + 2, 22, 2);
    }

    // Layer 3: Frostbitten Cathedral Arches with Hanging Icicles (480 x 540)
    const { canvas: tc, ctx: tctx } = this.createCanvas(480, 540);
    tctx.fillStyle = '#081726';
    tctx.fillRect(0, 0, 46, 540); tctx.fillRect(434, 0, 46, 540);
    tctx.fillStyle = '#102940';
    tctx.fillRect(10, 0, 26, 540); tctx.fillRect(444, 0, 26, 540);
    tctx.fillStyle = '#1c3d5c';
    tctx.fillRect(18, 0, 10, 540); tctx.fillRect(452, 0, 10, 540);

    // Frost crystalline rim on pillars
    tctx.fillStyle = '#38bdf8';
    tctx.fillRect(0, 0, 3, 540); tctx.fillRect(477, 0, 3, 540);

    tctx.fillStyle = '#081726';
    tctx.beginPath();
    tctx.moveTo(46, 210); tctx.quadraticCurveTo(120, 85, 240, 65); tctx.lineTo(240, 25); tctx.quadraticCurveTo(100, 45, 46, 170);
    tctx.closePath(); tctx.fill();
    tctx.beginPath();
    tctx.moveTo(434, 210); tctx.quadraticCurveTo(360, 85, 240, 65); tctx.lineTo(240, 25); tctx.quadraticCurveTo(380, 45, 434, 170);
    tctx.closePath(); tctx.fill();
    tctx.strokeStyle = '#38bdf8'; tctx.lineWidth = 2.5;
    tctx.beginPath();
    tctx.moveTo(46, 170); tctx.quadraticCurveTo(100, 45, 240, 25); tctx.quadraticCurveTo(380, 45, 434, 170);
    tctx.stroke();

    // Giant Hanging Icicles underneath arch
    tctx.fillStyle = '#e0f2fe';
    const icicleX = [70, 110, 160, 210, 250, 300, 350, 400];
    for (const ix of icicleX) {
      tctx.beginPath();
      tctx.moveTo(ix - 5, 210); tctx.lineTo(ix + 5, 210); tctx.lineTo(ix, 235 + (ix % 3) * 12);
      tctx.closePath(); tctx.fill();
    }

    tctx.fillStyle = '#081726'; tctx.fillRect(46, 360, 388, 22);
    tctx.fillStyle = '#16334f'; tctx.fillRect(46, 364, 388, 6);
    tctx.fillStyle = '#bae6fd'; tctx.fillRect(220, 364, 40, 3); // Frost line

    return { skySpires: sc, magmaPeaks: mc, towerArch: tc };
  }

  // 4. BIOME: SURFACE THRESHOLD (Torre 3 Cúspide & Salida — El Alba del Mundo Humano)
  generateSurfaceBg() {
    // Layer 1: Radiant Dawn Sky, Distant Human Mountains & Sunbeams (960 x 540)
    const { canvas: sc, ctx: sctx } = this.createCanvas(960, 540);
    // Morning star
    sctx.fillStyle = '#ffffff';
    sctx.fillRect(480, 70, 3, 3);
    sctx.fillStyle = '#fef08a';
    sctx.fillRect(479, 71, 5, 1); sctx.fillRect(481, 69, 1, 5);

    // Radiant Golden Dawn Sun cresting horizon
    const sunX = 480, sunY = 220, sunR = 64;
    const sunGlow = sctx.createRadialGradient(sunX, sunY, sunR - 10, sunX, sunY, sunR + 110);
    sunGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
    sunGlow.addColorStop(0.3, 'rgba(251, 191, 36, 0.7)');
    sunGlow.addColorStop(0.65, 'rgba(249, 115, 22, 0.25)');
    sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = sunGlow;
    sctx.beginPath();
    sctx.arc(sunX, sunY, sunR + 110, 0, Math.PI * 2);
    sctx.fill();

    // Crepuscular Rays (God rays) radiating from dawn horizon
    sctx.save();
    sctx.fillStyle = 'rgba(254, 240, 138, 0.15)';
    for (let angle = -0.9; angle <= 0.9; angle += 0.24) {
      sctx.beginPath();
      sctx.moveTo(sunX, sunY);
      sctx.lineTo(sunX + Math.sin(angle - 0.08) * 450, sunY - Math.cos(angle - 0.08) * 450);
      sctx.lineTo(sunX + Math.sin(angle + 0.08) * 450, sunY - Math.cos(angle + 0.08) * 450);
      sctx.closePath();
      sctx.fill();
    }
    sctx.restore();

    // Distant mountain ranges of the mortal realm (Seamless X: ends at 350)
    sctx.fillStyle = '#1e1b38';
    sctx.beginPath();
    sctx.moveTo(0, 540);
    const mtnHeights = [
      [0, 350], [80, 270], [160, 360], [250, 250], [350, 370],
      [450, 280], [550, 370], [640, 260], [730, 365], [820, 275],
      [900, 350], [960, 350]
    ];
    sctx.lineTo(mtnHeights[0][0], mtnHeights[0][1]);
    for (let p = 1; p < mtnHeights.length; p++) sctx.lineTo(mtnHeights[p][0], mtnHeights[p][1]);
    sctx.lineTo(960, 540);
    sctx.closePath();
    sctx.fill();

    // Layer 2: Medieval Human Citadel Ramparts & Forest Ridges (960 x 540)
    const { canvas: mc, ctx: mctx } = this.createCanvas(960, 540);
    mctx.fillStyle = '#1e293b';
    mctx.beginPath();
    mctx.moveTo(0, 540);
    const ramparts = [
      [0, 390], [90, 310], [180, 370], [270, 290], [360, 380],
      [450, 300], [540, 390], [630, 295], [720, 375], [810, 305],
      [890, 365], [960, 390]
    ];
    mctx.lineTo(ramparts[0][0], ramparts[0][1]);
    for (let p = 1; p < ramparts.length; p++) mctx.lineTo(ramparts[p][0], ramparts[p][1]);
    mctx.lineTo(960, 540);
    mctx.closePath();
    mctx.fill();

    // Watchtower battlements and green pine trees on peaks
    const towers = [
      { x: 90, y: 310, w: 28, h: 45 }, { x: 270, y: 290, w: 32, h: 50 },
      { x: 450, y: 300, w: 26, h: 42 }, { x: 630, y: 295, w: 30, h: 48 }, { x: 810, y: 305, w: 28, h: 45 }
    ];
    for (const tw of towers) {
      mctx.fillStyle = '#0f172a';
      mctx.fillRect(tw.x - tw.w / 2, tw.y - tw.h, tw.w, tw.h);
      // Battlements crenels
      mctx.fillRect(tw.x - tw.w / 2 - 2, tw.y - tw.h - 6, 8, 6);
      mctx.fillRect(tw.x + tw.w / 2 - 6, tw.y - tw.h - 6, 8, 6);
      // Red fluttering kingdom pennant / flag on top!
      mctx.fillStyle = '#ef4444';
      mctx.fillRect(tw.x - 1, tw.y - tw.h - 18, 2, 12);
      mctx.beginPath();
      mctx.moveTo(tw.x + 1, tw.y - tw.h - 18);
      mctx.lineTo(tw.x + 14, tw.y - tw.h - 14);
      mctx.lineTo(tw.x + 1, tw.y - tw.h - 10);
      mctx.closePath();
      mctx.fill();

      // Wild ivy & moss clinging to the ancient stone battlements
      mctx.fillStyle = '#22c55e';
      mctx.fillRect(tw.x - tw.w / 2 + 3, tw.y - 15, 6, 12);
      mctx.fillRect(tw.x + tw.w / 2 - 8, tw.y - 22, 5, 16);
      // Wild yellow flowers
      mctx.fillStyle = '#fde047';
      mctx.fillRect(tw.x - tw.w / 2 + 5, tw.y - 12, 2, 2);
    }

    // Layer 3: Ancient White Limestone Arches Open to the Free Sky (480 x 540)
    const { canvas: tc, ctx: tctx } = this.createCanvas(480, 540);
    tctx.fillStyle = '#1c1917';
    tctx.fillRect(0, 0, 46, 540); tctx.fillRect(434, 0, 46, 540);
    tctx.fillStyle = '#292524';
    tctx.fillRect(10, 0, 26, 540); tctx.fillRect(444, 0, 26, 540);
    tctx.fillStyle = '#44403c';
    tctx.fillRect(18, 0, 10, 540); tctx.fillRect(452, 0, 10, 540);

    // Warm morning sunlight edge on pillars
    tctx.fillStyle = '#fef08a';
    tctx.fillRect(44, 0, 2, 540); tctx.fillRect(434, 0, 2, 540);

    tctx.fillStyle = '#1c1917';
    tctx.beginPath();
    tctx.moveTo(46, 210); tctx.quadraticCurveTo(120, 85, 240, 65); tctx.lineTo(240, 25); tctx.quadraticCurveTo(100, 45, 46, 170);
    tctx.closePath(); tctx.fill();
    tctx.beginPath();
    tctx.moveTo(434, 210); tctx.quadraticCurveTo(360, 85, 240, 65); tctx.lineTo(240, 25); tctx.quadraticCurveTo(380, 45, 434, 170);
    tctx.closePath(); tctx.fill();
    tctx.strokeStyle = '#fef08a'; tctx.lineWidth = 2;
    tctx.beginPath();
    tctx.moveTo(46, 170); tctx.quadraticCurveTo(100, 45, 240, 25); tctx.quadraticCurveTo(380, 45, 434, 170);
    tctx.stroke();

    // Wild climbing green ivy hanging down the broken arch
    tctx.fillStyle = '#15803d';
    tctx.fillRect(120, 85, 8, 30); tctx.fillRect(124, 115, 6, 25);
    tctx.fillRect(340, 90, 8, 35); tctx.fillRect(344, 125, 5, 20);
    tctx.fillStyle = '#4ade80';
    tctx.fillRect(122, 95, 3, 4); tctx.fillRect(342, 105, 3, 4);

    tctx.fillStyle = '#1c1917'; tctx.fillRect(46, 360, 388, 22);
    tctx.fillStyle = '#292524'; tctx.fillRect(46, 364, 388, 6);
    tctx.fillStyle = '#f59e0b'; tctx.fillRect(215, 364, 50, 4); // Sunlit marble cornice

    return { skySpires: sc, magmaPeaks: mc, towerArch: tc };
  }

  // 5. BIOME: PROLOGUE (Santuario de los Caídos — Catedral Gótica y Forja de Almas)
  generatePrologueBg() {
    // Single unified 960x540 master canvas for zero layer drift, perfect alignment, and crisp aesthetics
    const { canvas: ch, ctx: cctx } = this.createCanvas(960, 540);

    // 1. Midnight Gothic Sky Gradient (Upper cathedral clerestory)
    const skyGrad = cctx.createLinearGradient(0, 0, 0, 320);
    skyGrad.addColorStop(0, '#030712');
    skyGrad.addColorStop(0.35, '#0b1022');
    skyGrad.addColorStop(0.7, '#19122c');
    skyGrad.addColorStop(1, '#11101d');
    cctx.fillStyle = skyGrad;
    cctx.fillRect(0, 0, 960, 320);

    // 2. Cathedral Lower Ashlar Wall Masonry
    cctx.fillStyle = '#11101d';
    cctx.fillRect(0, 200, 960, 340);

    // Subtle stone brick masonry lines
    cctx.strokeStyle = 'rgba(45, 40, 68, 0.4)';
    cctx.lineWidth = 1;
    for (let y = 80; y < 480; y += 24) {
      cctx.beginPath();
      cctx.moveTo(0, y);
      cctx.lineTo(960, y);
      cctx.stroke();
      const offset = (y % 48 === 0) ? 0 : 30;
      for (let x = offset; x < 960; x += 60) {
        cctx.beginPath();
        cctx.moveTo(x, y);
        cctx.lineTo(x, y + 24);
        cctx.stroke();
      }
    }

    // 3. Celestial Twinkling Stars in Clerestory
    const starCoords = [
      [50, 35], [110, 60], [175, 28], [270, 55], [370, 35],
      [590, 40], [680, 65], [775, 25], [845, 50], [910, 38],
      [75, 110], [240, 95], [720, 90], [885, 105]
    ];
    for (const [sx, sy] of starCoords) {
      cctx.fillStyle = '#bae6fd';
      cctx.fillRect(sx, sy, 2, 2);
      cctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      cctx.fillRect(sx - 1, sy, 4, 2);
      cctx.fillRect(sx, sy - 1, 2, 4);
    }

    // 4. Luminous Cathedral Moon behind the Rose Window
    const moonX = 480, moonY = 125, moonR = 58;
    const mHalo = cctx.createRadialGradient(moonX, moonY, moonR - 10, moonX, moonY, moonR + 90);
    mHalo.addColorStop(0, 'rgba(254, 240, 138, 0.75)');
    mHalo.addColorStop(0.3, 'rgba(216, 180, 254, 0.4)');
    mHalo.addColorStop(0.7, 'rgba(147, 197, 253, 0.15)');
    mHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    cctx.fillStyle = mHalo;
    cctx.beginPath();
    cctx.arc(moonX, moonY, moonR + 90, 0, Math.PI * 2);
    cctx.fill();

    // Moon disc
    cctx.fillStyle = '#f8fafc';
    cctx.beginPath();
    cctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    cctx.fill();

    // Subtle craters
    cctx.fillStyle = '#e2e8f0';
    cctx.beginPath();
    cctx.arc(moonX - 18, moonY - 14, 14, 0, Math.PI * 2);
    cctx.arc(moonX + 16, moonY + 12, 18, 0, Math.PI * 2);
    cctx.arc(moonX + 6, moonY - 24, 10, 0, Math.PI * 2);
    cctx.fill();

    // 5. Grand Gothic Rose Window (Vitral Gótico Central — directly above Sanctuary Altar)
    const winX = 480, winY = 125, winR = 56;
    // Outer stone frame moulding
    cctx.fillStyle = '#1e1a2e';
    cctx.beginPath();
    cctx.arc(winX, winY, winR + 8, 0, Math.PI * 2);
    cctx.fill();
    cctx.strokeStyle = '#d4af37';
    cctx.lineWidth = 3.5;
    cctx.stroke();

    // Inner gold leaded rim
    cctx.strokeStyle = '#b48c28';
    cctx.lineWidth = 2;
    cctx.beginPath();
    cctx.arc(winX, winY, winR, 0, Math.PI * 2);
    cctx.stroke();

    // 12 Stained Glass Segments
    const glassColors = [
      '#e63946', '#f59e0b', '#9d4edd', '#0077b6', '#2a9d8f', '#ff006e',
      '#e63946', '#f59e0b', '#9d4edd', '#0077b6', '#2a9d8f', '#ff006e'
    ];
    for (let i = 0; i < 12; i++) {
      const a1 = (i * Math.PI * 2) / 12;
      const a2 = ((i + 1) * Math.PI * 2) / 12;
      cctx.fillStyle = glassColors[i];
      cctx.beginPath();
      cctx.moveTo(winX, winY);
      cctx.arc(winX, winY, winR - 2, a1, a2);
      cctx.closePath();
      cctx.fill();
      // Stone tracery spoke
      cctx.strokeStyle = '#1e1a2e';
      cctx.lineWidth = 2;
      cctx.stroke();
    }

    // Inner rosette ring & core
    cctx.fillStyle = '#ffd166';
    cctx.beginPath();
    cctx.arc(winX, winY, 18, 0, Math.PI * 2);
    cctx.fill();
    cctx.fillStyle = '#7b2cbf';
    cctx.beginPath();
    cctx.arc(winX, winY, 12, 0, Math.PI * 2);
    cctx.fill();
    cctx.fillStyle = '#ffffff';
    cctx.beginPath();
    cctx.arc(winX, winY, 5, 0, Math.PI * 2);
    cctx.fill();

    // Divine Volumetric Light Rays radiating down from the Rose Window onto the Altar
    const lightGrad = cctx.createLinearGradient(winX, winY, winX, 480);
    lightGrad.addColorStop(0, 'rgba(233, 213, 255, 0.32)');
    lightGrad.addColorStop(0.3, 'rgba(253, 224, 71, 0.18)');
    lightGrad.addColorStop(0.7, 'rgba(167, 139, 250, 0.10)');
    lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    cctx.fillStyle = lightGrad;
    cctx.beginPath();
    cctx.moveTo(winX - 32, winY + 20);
    cctx.lineTo(winX + 32, winY + 20);
    cctx.lineTo(winX + 160, 480);
    cctx.lineTo(winX - 160, 480);
    cctx.closePath();
    cctx.fill();

    // 6. Flanking Pointed Gothic Lancet Windows (above Ruleta & Portal)
    const drawLancet = (lx, ly, col1, col2) => {
      cctx.fillStyle = '#171424';
      cctx.fillRect(lx - 20, ly, 40, 110);
      cctx.beginPath();
      cctx.arc(lx, ly, 20, Math.PI, 0);
      cctx.fill();

      // Glass inside
      const lGrad = cctx.createLinearGradient(lx, ly - 20, lx, ly + 110);
      lGrad.addColorStop(0, col1);
      lGrad.addColorStop(1, col2);
      cctx.fillStyle = lGrad;
      cctx.fillRect(lx - 16, ly + 4, 32, 102);
      cctx.beginPath();
      cctx.arc(lx, ly + 4, 16, Math.PI, 0);
      cctx.fill();

      // Stone Mullions & Tracery
      cctx.fillStyle = '#171424';
      cctx.fillRect(lx - 1, ly - 16, 2, 126);
      cctx.fillRect(lx - 16, ly + 35, 32, 2);
      cctx.fillRect(lx - 16, ly + 70, 32, 2);
      cctx.strokeStyle = '#d4af37';
      cctx.lineWidth = 1.5;
      cctx.strokeRect(lx - 16, ly + 4, 32, 102);
    };

    drawLancet(200, 140, '#f59e0b', '#78350f'); // Warm amber gold above Ruleta
    drawLancet(770, 140, '#38bdf8', '#0369a1'); // Mystic sapphire cyan above Portal

    // 7. High Ribbed Vault Arches (Bóvedas de Crucería)
    cctx.strokeStyle = '#2b2542';
    cctx.lineWidth = 6;
    cctx.beginPath();
    // Arch 1 (Left to center-left)
    cctx.moveTo(90, 200);
    cctx.quadraticCurveTo(210, 60, 330, 200);
    // Arch 2 (Center-left to center-right, framing Rose Window & Altar)
    cctx.moveTo(330, 200);
    cctx.quadraticCurveTo(480, 48, 630, 200);
    // Arch 3 (Center-right to right)
    cctx.moveTo(630, 200);
    cctx.quadraticCurveTo(750, 60, 870, 200);
    cctx.stroke();

    // Arch gold keystones
    for (const kx of [210, 480, 750]) {
      cctx.fillStyle = '#d4af37';
      cctx.fillRect(kx - 6, 56, 12, 10);
    }

    // 8. Four Monumental Carved Stone Pillars
    const drawPillar = (px) => {
      // Capital top
      cctx.fillStyle = '#3f375c';
      cctx.fillRect(px - 22, 180, 44, 12);
      cctx.fillStyle = '#524874';
      cctx.fillRect(px - 18, 192, 36, 10);
      cctx.fillStyle = '#d4af37'; // Gold capital ring
      cctx.fillRect(px - 16, 202, 32, 4);

      // Fluted Column Shaft
      cctx.fillStyle = '#1c182b';
      cctx.fillRect(px - 14, 206, 28, 254);
      cctx.fillStyle = '#2b2542';
      cctx.fillRect(px - 10, 206, 20, 254);
      cctx.fillStyle = '#3f375c';
      cctx.fillRect(px - 4, 206, 8, 254); // Center highlight

      // Column Base
      cctx.fillStyle = '#3f375c';
      cctx.fillRect(px - 18, 460, 36, 10);
      cctx.fillStyle = '#231d36';
      cctx.fillRect(px - 22, 470, 44, 10);
    };

    drawPillar(90);
    drawPillar(330);
    drawPillar(630);
    drawPillar(870);

    // 9. Hanging Royal Velvet Banners with Gold Fringe
    const drawBanner = (bx, by, bw, bh, color, crest) => {
      cctx.save();
      // Wall brass rod
      cctx.fillStyle = '#d4af37';
      cctx.fillRect(bx - 4, by, bw + 8, 5);

      // Velvet body
      cctx.fillStyle = color;
      cctx.beginPath();
      cctx.moveTo(bx, by + 5);
      cctx.lineTo(bx + bw, by + 5);
      cctx.lineTo(bx + bw, by + bh);
      cctx.lineTo(bx + bw / 2, by + bh + 14);
      cctx.lineTo(bx, by + bh);
      cctx.closePath();
      cctx.fill();

      // Gold embroidery trim
      cctx.strokeStyle = '#ffd700';
      cctx.lineWidth = 1.8;
      cctx.stroke();

      // Emblem
      cctx.fillStyle = '#ffd700';
      cctx.font = 'bold 12px serif';
      cctx.textAlign = 'center';
      cctx.fillText(crest, bx + bw / 2, by + bh / 2 + 4);
      cctx.restore();
    };

    drawBanner(130, 210, 28, 70, '#1e3a8a', '⚔'); // Left entrance heraldry
    drawBanner(270, 210, 28, 70, '#831843', '🎰'); // Ruleta heraldry
    drawBanner(650, 210, 28, 70, '#581c87', '🔮'); // Altar heraldry
    drawBanner(810, 210, 28, 70, '#7f1d1d', '🔥'); // Portal heraldry

    // 10. Ornate Gothic Chandeliers with Candles
    const drawChandelier = (cx, cy) => {
      // Iron chain
      cctx.strokeStyle = '#27272a';
      cctx.lineWidth = 1.5;
      cctx.beginPath();
      cctx.moveTo(cx, 0);
      cctx.lineTo(cx, cy);
      cctx.stroke();

      // Iron hoop & scrolls
      cctx.strokeStyle = '#3f3f46';
      cctx.lineWidth = 3;
      cctx.beginPath();
      cctx.ellipse(cx, cy, 32, 10, 0, 0, Math.PI * 2);
      cctx.stroke();

      // Candles with glowing flames
      const candleOffsets = [-24, -12, 0, 12, 24];
      for (const off of candleOffsets) {
        cctx.fillStyle = '#fef08a';
        cctx.fillRect(cx + off - 1.5, cy - 8, 3, 8);
        // Flame
        cctx.fillStyle = '#f59e0b';
        cctx.beginPath();
        cctx.arc(cx + off, cy - 10, 3, 0, Math.PI * 2);
        cctx.fill();
        cctx.fillStyle = '#fef08a';
        cctx.fillRect(cx + off - 1, cy - 11, 2, 2);
      }
    };

    drawChandelier(200, 140);
    drawChandelier(480, 115);
    drawChandelier(770, 140);

    // 11. Side Framing Pilasters & Gold Crown Valance
    cctx.fillStyle = '#08070e';
    cctx.fillRect(0, 0, 24, 540);
    cctx.fillRect(936, 0, 24, 540);

    cctx.fillStyle = '#161324';
    cctx.fillRect(6, 0, 12, 540);
    cctx.fillRect(942, 0, 12, 540);

    cctx.fillStyle = '#08070e';
    cctx.fillRect(0, 0, 960, 22);
    cctx.fillStyle = '#d4af37'; // Gold crown trim
    cctx.fillRect(0, 20, 960, 2);

    return { cathedralHall: ch, skySpires: ch, magmaPeaks: ch, towerArch: null };
  }

  // ─── DIALOGUE PORTRAITS (96x96) ───
  generatePortraits() {
    this.portraits = {};

    // 1. Kael Portrait
    const { canvas: kc, ctx: kctx } = this.createCanvas(96, 96);
    kctx.fillStyle = '#0d0912';
    kctx.fillRect(0, 0, 96, 96);
    // Horned Greathelm
    kctx.fillStyle = '#2c313d';
    kctx.fillRect(20, 16, 56, 54);
    kctx.fillStyle = '#3e4554';
    kctx.fillRect(28, 20, 40, 24);
    // Horns
    kctx.fillStyle = '#1a1c22';
    kctx.fillRect(14, 8, 10, 20);
    kctx.fillRect(72, 8, 10, 20);
    // Visor with crimson fiery eye glow
    kctx.fillStyle = '#0a0a0e';
    kctx.fillRect(26, 42, 44, 12);
    kctx.fillStyle = '#ff2a3b';
    kctx.fillRect(32, 46, 12, 4);
    kctx.fillRect(52, 46, 12, 4);
    // Gorget / Armor neck
    kctx.fillStyle = '#1e2129';
    kctx.fillRect(22, 70, 52, 22);
    kctx.fillStyle = '#d4af37'; // Gold trim
    kctx.fillRect(44, 76, 8, 14);
    this.portraits.Kael = kc;

    // 2. Soldado Portrait
    const { canvas: sc, ctx: sctx } = this.createCanvas(96, 96);
    sctx.fillStyle = '#0d0912';
    sctx.fillRect(0, 0, 96, 96);
    // Castle Guard Steel Helmet
    sctx.fillStyle = '#4a5568';
    sctx.fillRect(22, 14, 52, 54);
    sctx.fillStyle = '#718096';
    sctx.fillRect(30, 18, 36, 20);
    // Eye slot
    sctx.fillStyle = '#1a202c';
    sctx.fillRect(28, 38, 40, 10);
    sctx.fillStyle = '#e2e8f0';
    sctx.fillRect(36, 41, 6, 4);
    sctx.fillRect(54, 41, 6, 4);
    // Mail collar
    sctx.fillStyle = '#2d3748';
    sctx.fillRect(24, 68, 48, 22);
    this.portraits.Soldado = sc;

    // 4. Minos Portrait
    const { canvas: mpc, ctx: mpctx } = this.createCanvas(96, 96);
    mpctx.fillStyle = '#0d0714';
    mpctx.fillRect(0, 0, 96, 96);
    // Dark amethyst cowl
    mpctx.fillStyle = '#261036';
    mpctx.fillRect(18, 14, 60, 68);
    // Bone Crown
    mpctx.fillStyle = '#f5f3ff';
    mpctx.fillRect(24, 10, 8, 18);
    mpctx.fillRect(40, 4, 16, 24);
    mpctx.fillRect(64, 10, 8, 18);
    mpctx.fillStyle = '#ffd700'; // Gold band
    mpctx.fillRect(22, 22, 52, 6);
    // Pale demonic visage
    mpctx.fillStyle = '#4c1d6b';
    mpctx.fillRect(28, 28, 40, 36);
    // Glowing Void Eyes of Judgment
    mpctx.fillStyle = '#06010a';
    mpctx.fillRect(32, 40, 12, 6);
    mpctx.fillRect(52, 40, 12, 6);
    mpctx.fillStyle = '#c084fc';
    mpctx.fillRect(34, 42, 8, 3);
    mpctx.fillRect(54, 42, 8, 3);
    mpctx.fillStyle = '#ffffff';
    mpctx.fillRect(37, 43, 2, 2);
    mpctx.fillRect(57, 43, 2, 2);
    // Ivory royal beard
    mpctx.fillStyle = '#e9d5ff';
    mpctx.fillRect(32, 58, 32, 26);
    this.portraits.Minos = mpc;

    // 5. Flegias Portrait
    const { canvas: fpc, ctx: fpctx } = this.createCanvas(96, 96);
    fpctx.fillStyle = '#05130b';
    fpctx.fillRect(0, 0, 96, 96);
    // Swamp ogre brute head
    fpctx.fillStyle = '#1c4530';
    fpctx.fillRect(16, 16, 64, 66);
    // Rust iron brow ring
    fpctx.fillStyle = '#262626';
    fpctx.fillRect(14, 24, 68, 8);
    fpctx.fillStyle = '#78350f';
    fpctx.fillRect(18, 26, 60, 4);
    // Venomous bile green eyes
    fpctx.fillStyle = '#000000';
    fpctx.fillRect(26, 38, 14, 7);
    fpctx.fillRect(56, 38, 14, 7);
    fpctx.fillStyle = '#00ff88';
    fpctx.fillRect(28, 40, 10, 4);
    fpctx.fillRect(58, 40, 10, 4);
    fpctx.fillStyle = '#ffffff';
    fpctx.fillRect(32, 41, 3, 2);
    fpctx.fillRect(62, 41, 3, 2);
    // Yellowed Bog Tusks
    fpctx.fillStyle = '#fef08a';
    fpctx.fillRect(26, 56, 8, 14);
    fpctx.fillRect(62, 56, 8, 14);
    // Dripping toxic slime
    fpctx.fillStyle = '#52b788';
    fpctx.fillRect(20, 68, 6, 20);
    fpctx.fillRect(70, 68, 6, 20);
    this.portraits.Flegias = fpc;

    // 6. Malacoda Portrait
    const { canvas: mlc, ctx: mlctx } = this.createCanvas(96, 96);
    mlctx.fillStyle = '#120204';
    mlctx.fillRect(0, 0, 96, 96);
    // Crimson gargoyle demon head
    mlctx.fillStyle = '#7f1d1d';
    mlctx.fillRect(20, 20, 56, 60);
    mlctx.fillStyle = '#991b1b';
    mlctx.fillRect(26, 26, 44, 48);
    // Curling horns
    mlctx.fillStyle = '#1c0406';
    mlctx.fillRect(10, 8, 16, 18);
    mlctx.fillRect(70, 8, 16, 18);
    mlctx.fillStyle = '#f59e0b'; // Sulphur horn tips
    mlctx.fillRect(8, 6, 8, 6);
    mlctx.fillRect(80, 6, 8, 6);
    // Glowing sulphur yellow eyes
    mlctx.fillStyle = '#000000';
    mlctx.fillRect(28, 40, 12, 6);
    mlctx.fillRect(56, 40, 12, 6);
    mlctx.fillStyle = '#facc15';
    mlctx.fillRect(30, 41, 9, 4);
    mlctx.fillRect(58, 41, 9, 4);
    mlctx.fillStyle = '#ffffff';
    mlctx.fillRect(33, 42, 3, 2);
    mlctx.fillRect(61, 42, 3, 2);
    // Sharp razor fangs
    mlctx.fillStyle = '#fef08a';
    mlctx.fillRect(36, 60, 6, 8);
    mlctx.fillRect(54, 60, 6, 8);
    this.portraits.Malacoda = mlc;

    // 7. Azgalor Portrait
    const { canvas: azc, ctx: azctx } = this.createCanvas(96, 96);
    azctx.fillStyle = '#0a0508';
    azctx.fillRect(0, 0, 96, 96);
    // Obsidian Demon Skull
    azctx.fillStyle = '#170c12';
    azctx.fillRect(22, 18, 52, 58);
    // Curling Obsidian Horns
    azctx.fillStyle = '#0a0508';
    azctx.fillRect(12, 6, 16, 18);
    azctx.fillRect(68, 6, 16, 18);
    azctx.fillStyle = '#ff4500';
    azctx.fillRect(10, 4, 8, 6);
    azctx.fillRect(78, 4, 8, 6);
    // Molten Lava Veins
    azctx.fillStyle = '#ff4500';
    azctx.fillRect(28, 24, 40, 4);
    azctx.fillRect(46, 28, 4, 20);
    // Blazing Eyes
    azctx.fillStyle = '#000000';
    azctx.fillRect(28, 38, 12, 7);
    azctx.fillRect(56, 38, 12, 7);
    azctx.fillStyle = '#ff3300';
    azctx.fillRect(30, 39, 10, 5);
    azctx.fillRect(58, 39, 10, 5);
    azctx.fillStyle = '#ffff00';
    azctx.fillRect(33, 40, 5, 3);
    azctx.fillRect(61, 40, 5, 3);
    this.portraits.Azgalor = azc;

    // 8. Glacior Portrait
    const { canvas: glc, ctx: glctx } = this.createCanvas(96, 96);
    glctx.fillStyle = '#020b14';
    glctx.fillRect(0, 0, 96, 96);
    // Glacial Phantom Cowl
    glctx.fillStyle = '#0b233a';
    glctx.fillRect(20, 20, 56, 60);
    // Crystalline Diamond Ice Spires
    glctx.fillStyle = '#90e0ef';
    glctx.fillRect(24, 6, 8, 20);
    glctx.fillRect(42, 2, 12, 24);
    glctx.fillRect(64, 6, 8, 20);
    glctx.fillStyle = '#ffffff';
    glctx.fillRect(26, 8, 4, 14);
    glctx.fillRect(46, 4, 4, 18);
    glctx.fillRect(66, 8, 4, 14);
    // Cold Cyan Spectral Eyes
    glctx.fillStyle = '#020b14';
    glctx.fillRect(30, 40, 12, 6);
    glctx.fillRect(54, 40, 12, 6);
    glctx.fillStyle = '#48cae4';
    glctx.fillRect(32, 41, 10, 4);
    glctx.fillRect(56, 41, 10, 4);
    glctx.fillStyle = '#ffffff';
    glctx.fillRect(36, 42, 4, 2);
    glctx.fillRect(60, 42, 4, 2);
    this.portraits.Glacior = glc;
  }
}

if (typeof window !== 'undefined') {
  window.SpriteManager = SpriteManager;
  window.spriteManager = new SpriteManager();
}
