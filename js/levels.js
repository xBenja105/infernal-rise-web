/**
 * Infernal Rise — Level Design & Maps (Dante's Inferno Architecture)
 * 9 Circles of the Underworld, 5 Canonical Bosses, Ladders, Moving/Crumbling Platforms,
 * Extreme Precision Hardcore Platforming, and Fair Safe Spawns.
 */

class LevelManager {
  constructor() {
    this.currentLevelId = null;
    this.currentLevel = null;
  }

  loadLevel(levelId) {
    this.currentLevelId = levelId;
    if (levelId === 'prologue') {
      this.currentLevel = this.createPrologueLevel();
    } else if (levelId === 'tower' || levelId === 'tower1') {
      this.currentLevel = this.createTower1Level();
    } else if (levelId === 'boss1' || levelId === 'boss_minos') {
      this.currentLevel = this.createBossMinosLevel();
    } else if (levelId === 'tower2') {
      this.currentLevel = this.createTower2Level();
    } else if (levelId === 'boss2' || levelId === 'boss_flegias') {
      this.currentLevel = this.createBossFlegiasLevel();
    } else if (levelId === 'tower3') {
      this.currentLevel = this.createTower3Level();
    } else if (levelId === 'boss_azgalor') {
      this.currentLevel = this.createBossAzgalorLevel();
    } else if (levelId === 'tower4') {
      this.currentLevel = this.createTower4Level();
    } else if (levelId === 'boss_malacoda') {
      this.currentLevel = this.createBossMalacodaLevel();
    } else if (levelId === 'tower5') {
      this.currentLevel = this.createTower5Level();
    } else if (levelId === 'boss3' || levelId === 'boss5' || levelId === 'boss_glacior') {
      this.currentLevel = this.createBossGlaciorLevel();
    } else if (levelId === 'tower6') {
      this.currentLevel = this.createTower6Level();
    } else if (levelId === 'infernal') {
      this.currentLevel = this.createInfernalModeLevel();
    } else {
      this.currentLevel = this.createTower1Level();
    }
    return this.currentLevel;
  }

  // ─── 0. PROLOGUE: CASTLE RUINS & REFUGE LOBBY (COMPACT GOTHIC SANCTUARY) ───
  createPrologueLevel() {
    return {
      id: 'prologue',
      name: 'Refugio del Inframundo — El Santuario de los Caídos',
      danteCircle: 'El Santuario de los Caídos — Falda de la Gran Torre',
      biome: 'prologue',
      width: 960,
      height: 540,
      spawn: { x: 75, y: 442 },
      isCombatScene: false,
      musicTrack: 'menu',
      ambientRain: false,
      hasLava: false,
      platforms: [
        // Grand Cathedral Stone Foundation
        { x: 0, y: 480, w: 960, h: 60, type: 'stone' },
        // Sanctuary Boundary Enclosure Columns
        { x: 0, y: 0, w: 24, h: 480, type: 'stone' },
        { x: 936, y: 0, w: 24, h: 480, type: 'stone' },
        // Ceiling Cornice Beam
        { x: 0, y: 0, w: 960, h: 22, type: 'stone' },

        // 1. Ruleta de las Armas — Left Dais
        { x: 160, y: 460, w: 140, h: 20, type: 'stone' },

        // 2. Santuario de Almas — Grand Center 3-Tier Sacred Dais
        { x: 330, y: 460, w: 300, h: 20, type: 'stone' },
        { x: 370, y: 440, w: 220, h: 20, type: 'stone' },
        { x: 410, y: 420, w: 140, h: 20, type: 'stone' },

        // 3. Portal a la Torre — Right Dais
        { x: 730, y: 460, w: 150, h: 20, type: 'stone' }
      ],
      // In-World Sanctuary Altar (Upgrade Shop) — Center Stage
      sanctuary: {
        x: 435,
        y: 330,
        w: 90,
        h: 90,
        label: 'Santuario de Mejoras'
      },
      // In-World Slot Machine / Ruleta de Armas (80 Almas) — Left Wing
      slotMachine: {
        x: 200,
        y: 390,
        w: 60,
        h: 70,
        cost: 80,
        label: 'Ruleta de las Armas'
      },
      ladders: [],
      movingPlatforms: [],
      crumblingPlatforms: [],
      spikes: [],
      torches: [
        // Ground & Dais Torches
        { x: 45, y: 420, blue: false },
        { x: 150, y: 425, blue: false },
        { x: 310, y: 425, blue: false },
        { x: 355, y: 405, blue: true },
        { x: 590, y: 405, blue: true },
        { x: 720, y: 425, blue: true },
        { x: 890, y: 425, blue: true }
      ],
      enemies: [],
      urns: [
        { x: 110, y: 448, value: 25 },
        { x: 340, y: 428, value: 20 },
        { x: 595, y: 428, value: 20 },
        { x: 890, y: 448, value: 25 }
      ],
      chests: [],
      portal: {
        x: 770,
        y: 365,
        w: 70,
        h: 95,
        targetLevel: 'tower1',
        label: 'Entrar a la Gran Torre (Piso 1)'
      }
    };
  }

  // ─── PROCEDURAL TOWER MAP GENERATOR ───
  // Every run generates a unique, dynamically varied tower floor while guaranteeing 100% climbability
  generateProceduralTower(config) {
    const width = config.width || 960;
    const height = config.height || 3600;
    const baseY = height - 100;

    const platforms = [];
    const ladders = [];
    const movingPlatforms = [];
    const crumblingPlatforms = [];
    const spikes = [];
    const torches = [];
    const enemies = [];
    const bats = [];
    const urns = [];
    const chests = [];

    // Starting ground platform
    platforms.push({
      x: 140,
      y: baseY,
      w: 680,
      h: 36,
      type: config.basePlatformType || 'stone',
      isCheckpoint: true,
      checkpointId: 0
    });
    torches.push({ x: 200, y: baseY - 30, blue: false });
    torches.push({ x: 760, y: baseY - 30, blue: false });

    let currY = baseY;
    let ckptId = 1;
    let nextCkptY = baseY - 700;
    let nextChestY = baseY - 500;
    let chestCount = 0;
    let lastPattern = -1;

    // Helper: identify active tier by altitude
    const getTier = (y) => {
      if (!config.tiers || config.tiers.length === 0) {
        return { platformType: 'stone', hasWind: false, mageChance: 0.2, enemyHp: 40 };
      }
      for (const t of config.tiers) {
        if (y <= t.maxY && y >= t.minY) return t;
      }
      return config.tiers[config.tiers.length - 1];
    };

    while (currY > 520) {
      // Step delta strictly between 90 and 112px (player jump reach with soft gravity is ~151px)
      const stepY = 90 + Math.floor(Math.random() * 23);
      currY -= stepY;

      const tier = getTier(currY);
      const pType = tier.platformType || 'stone';
      const isBlueTorch = pType === 'ice' || pType === 'bone';

      // Safe Checkpoint Haven Plateau every ~700-800px
      if (currY <= nextCkptY && currY > 650) {
        const ckptW = 460 + Math.floor(Math.random() * 80);
        const ckptX = Math.floor((width - ckptW) / 2) + Math.floor((Math.random() - 0.5) * 60);
        const havenPlat = {
          x: ckptX,
          y: currY,
          w: ckptW,
          h: 28,
          type: pType,
          isCheckpoint: true,
          checkpointId: ckptId++
        };
        platforms.push(havenPlat);
        torches.push({ x: ckptX + 30, y: currY - 30, blue: isBlueTorch });
        torches.push({ x: ckptX + ckptW - 30, y: currY - 30, blue: isBlueTorch });

        // Urn with Humanity Shards
        urns.push({
          x: ckptX + Math.floor(ckptW / 2) + (Math.random() < 0.5 ? -60 : 60),
          y: currY - 26,
          value: 25 + Math.floor((1 - currY / height) * 35)
        });

        nextCkptY = currY - (680 + Math.floor(Math.random() * 100));
        continue;
      }

      // Procedural platform patterns
      // 0: Dual flanking platforms
      // 1: Wide center platform
      // 2: Solid platform + moving platform bridge
      // 3: Solid platform + crumbling stone
      let pattern = Math.floor(Math.random() * 4);
      if (pattern === lastPattern) {
        pattern = (pattern + 1) % 4;
      }
      lastPattern = pattern;

      const layerPlatforms = [];

      if (pattern === 0) {
        // Dual flanking platforms
        const lw = 220 + Math.floor(Math.random() * 50);
        const lx = 80 + Math.floor(Math.random() * 40);
        const rw = 220 + Math.floor(Math.random() * 50);
        const rx = width - rw - 80 - Math.floor(Math.random() * 40);

        const platL = { x: lx, y: currY, w: lw, h: 22, type: pType };
        const platR = { x: rx, y: currY, w: rw, h: 22, type: pType };
        platforms.push(platL, platR);
        layerPlatforms.push(platL, platR);

        // Ladder linking one of the sides
        if (Math.random() < 0.35) {
          const ladSide = Math.random() < 0.5 ? platL : platR;
          ladders.push({
            x: ladSide.x + Math.floor(ladSide.w / 2) - 12,
            y: currY,
            w: 24,
            h: stepY + 12,
            type: pType === 'gold' ? 'gold' : 'iron'
          });
        }
      } else if (pattern === 1) {
        // Center platform
        const cw = 260 + Math.floor(Math.random() * 70);
        const cx = Math.floor((width - cw) / 2) + Math.floor((Math.random() - 0.5) * 80);
        const platC = { x: cx, y: currY, w: cw, h: 22, type: pType };
        platforms.push(platC);
        layerPlatforms.push(platC);

        // Occasional small spike hazard on outer edge
        if (Math.random() < 0.28) {
          spikes.push({
            x: Math.random() < 0.5 ? cx + 10 : cx + cw - 70,
            y: currY - 20,
            w: 60,
            h: 20
          });
        }
      } else if (pattern === 2) {
        // Solid platform on one side + moving platform across the gap
        const onLeft = Math.random() < 0.5;
        const sw = 220 + Math.floor(Math.random() * 40);
        const sx = onLeft ? (80 + Math.floor(Math.random() * 30)) : (width - sw - 80 - Math.floor(Math.random() * 30));
        const platSolid = { x: sx, y: currY, w: sw, h: 22, type: pType };
        platforms.push(platSolid);
        layerPlatforms.push(platSolid);

        const mw = 95 + Math.floor(Math.random() * 20);
        const minX = onLeft ? (sx + sw + 20) : Math.max(80, sx - 260);
        const maxX = onLeft ? Math.min(width - mw - 80, minX + 220) : (sx - 20 - mw);
        if (maxX > minX + 40) {
          movingPlatforms.push({
            x: minX,
            y: currY,
            w: mw,
            h: 18,
            minX,
            maxX,
            speedX: 65 + Math.floor(Math.random() * 30),
            type: pType
          });
        }
      } else {
        // Solid platform + crumbling stepping stone
        const sw = 220 + Math.floor(Math.random() * 40);
        const sx = Math.random() < 0.5 ? 90 : 650;
        const platSolid = { x: sx, y: currY, w: sw, h: 22, type: pType };
        platforms.push(platSolid);
        layerPlatforms.push(platSolid);

        const crX = sx < 300 ? (sx + sw + 50) : (sx - 160);
        crumblingPlatforms.push({
          x: Math.max(100, Math.min(width - 200, crX)),
          y: currY,
          w: 100,
          h: 20
        });
      }

      // Spawn patrolling enemies and urns
      for (const p of layerPlatforms) {
        if (p.w >= 200) {
          const spawnRoll = Math.random();
          if (spawnRoll < 0.45) {
            const isMage = Math.random() < (tier.mageChance || 0.2);
            const isElite = Math.random() < 0.22;
            const scaleMultiplier = isElite ? (1.4 + Math.random() * 0.18) : 1.0;
            const baseHp = tier.enemyHp || 40;
            const hp = isElite ? Math.round(baseHp * 2.4) : baseHp;
            const variant = Math.floor(Math.random() * 4);
            enemies.push({
              x: p.x + 30 + Math.floor(Math.random() * (p.w - 80)),
              y: p.y - Math.round(34 * scaleMultiplier),
              type: isMage ? 'skeleton_mage' : 'skeleton',
              isMage,
              isElite,
              scaleMultiplier,
              skin: tier.enemySkin || 'abyss',
              variant: variant,
              minX: p.x + 8,
              maxX: p.x + p.w - 8,
              hp: hp
            });
          } else if (spawnRoll < 0.75) {
            urns.push({
              x: p.x + 20 + Math.floor(Math.random() * (p.w - 40)),
              y: p.y - 26,
              value: 15 + Math.floor((1 - currY / height) * 35)
            });
          }
        }
      }

      // Flying bat in open air
      if (Math.random() < 0.18) {
        const batSubTypes = tier.batTypes || ['abyss', 'blood', 'gargoyle', 'frost', 'toxic'];
        const subType = batSubTypes[Math.floor(Math.random() * batSubTypes.length)];
        bats.push({
          x: 180 + Math.floor(Math.random() * 600),
          y: currY + 30,
          type: 'bat',
          subType: subType,
          speed: 2.8 + Math.random() * 0.8
        });
      }
    }

    // ─── SUMMIT PLATEAU & ASCENSION PORTAL ───
    const summitAltar = { x: 200, y: 460, w: 560, h: 32, type: 'runic', isCheckpoint: true, checkpointId: ckptId++ };
    const summitStep = { x: 360, y: 360, w: 240, h: 24, type: 'runic' };
    platforms.push(summitAltar, summitStep);

    torches.push({ x: 240, y: 430, blue: true });
    torches.push({ x: 720, y: 430, blue: true });
    torches.push({ x: 380, y: 330, blue: true });
    torches.push({ x: 580, y: 330, blue: true });

    urns.push({ x: 680, y: 434, value: 60 });

    const isFinalPortal = (config.portalTarget === 'victory');
    const portal = {
      x: 450,
      y: 260,
      w: 60,
      h: 100,
      targetLevel: config.portalTarget,
      isFinalPortal: isFinalPortal,
      label: config.portalLabel
    };

    return {
      id: config.id,
      name: config.name,
      towerFloor: config.danteCircle,
      danteCircle: config.danteCircle,
      biome: config.biome,
      width,
      height,
      spawn: { x: 480, y: baseY - 38 },
      isCombatScene: false,
      musicTrack: config.musicTrack || 'tower',
      ambientRain: config.ambientRain || false,
      hasLava: config.hasLava !== undefined ? config.hasLava : true,
      risingLava: config.risingLava !== undefined ? config.risingLava : true,
      lavaY: height + 80,
      lavaSpeed: config.lavaSpeed !== undefined ? config.lavaSpeed : 21,
      lavaTheme: config.lavaTheme || (config.id === 'tower3' ? 'blood' : config.id === 'tower2' ? 'acid' : 'spectral'),
      wind: config.wind || null,
      platforms,
      ladders,
      movingPlatforms,
      crumblingPlatforms,
      spikes,
      torches,
      npc: config.npc || null,
      enemies,
      bats,
      urns,
      chests,
      tiers: config.tiers || [],
      portal
    };
  }

  // ─── 1. TOWER 1: PISO 1 — EL FOSO ABISAL (CIMIENTOS DE OBSIDIANA) ───
  createTower1Level() {
    return this.generateProceduralTower({
      id: 'tower1',
      name: 'Piso 1: El Foso Abisal — Cimientos de Basalto',
      danteCircle: 'Piso 1: El Foso Abisal — Basalto y Fuego',
      biome: 'abyss',
      width: 960,
      height: 3600,
      musicTrack: 'tower',
      ambientRain: true,
      hasLava: true,
      basePlatformType: 'stone',
      tiers: [
        { name: 'Foso Profundo', minY: 2500, maxY: 3600, platformType: 'stone', mageChance: 0.0, enemyHp: 35, enemySkin: 'abyss', batTypes: ['abyss', 'gargoyle'] },
        { name: 'Ascenso de Ceniza', minY: 1450, maxY: 2500, platformType: 'stone', mageChance: 0.25, enemyHp: 45, enemySkin: 'ashen', batTypes: ['abyss', 'blood'] },
        { name: 'Cimientos de Obsidiana', minY: 300, maxY: 1450, platformType: 'obsidian', mageChance: 0.35, enemyHp: 55, enemySkin: 'obsidian', batTypes: ['abyss', 'gargoyle'] }
      ],
      wind: { force: 0.65, activeMinY: 1500, activeMaxY: 2500 },
      portalTarget: 'boss_minos',
      portalLabel: 'Cámara de Juicio — Minos'
    });
  }

  // ─── 2. BOSS 1: MINOS (JUEZ DE LAS FOSAS ABISALES) ───
  createBossMinosLevel() {
    return {
      id: 'boss_minos',
      name: 'Cámara de Juicio — Minos, Juez de las Fosas',
      danteCircle: 'Piso 1: Cámara de Juicio — Minos',
      biome: 'abyss',
      width: 1200,
      height: 540,
      spawn: { x: 220, y: 412 },
      isCombatScene: true,
      musicTrack: 'boss',
      ambientRain: false,
      hasLava: false,
      platforms: [
        { x: 80, y: 450, w: 1040, h: 42, type: 'runic' },
        { x: 120, y: 350, w: 180, h: 22, type: 'stone' },
        { x: 900, y: 350, w: 180, h: 22, type: 'stone' },
        { x: 380, y: 300, w: 200, h: 22, type: 'stone' },
        { x: 620, y: 300, w: 200, h: 22, type: 'stone' }
      ],
      ladders: [],
      movingPlatforms: [],
      crumblingPlatforms: [],
      spikes: [],
      torches: [
        { x: 180, y: 420, blue: true },
        { x: 1020, y: 420, blue: true },
        { x: 600, y: 270, blue: true }
      ],
      boss: {
        type: 'minos',
        name: 'Minos, Juez de las Fosas Abisales',
        x: 860,
        y: 374,
        maxHp: 850,
        hp: 850,
        armor: 0.15,
        dialogueKey: 'minos_intro',
        nextLevel: 'tower2'
      },
      enemies: [],
      urns: [
        { x: 140, y: 424, value: 30 },
        { x: 1020, y: 424, value: 30 }
      ],
      chests: []
    };
  }

  // ─── 3. TOWER 2: PISO 2 — LAS CATACUMBAS HUNDIDAS (GALERÍA ESPECTRAL) ───
  createTower2Level() {
    return this.generateProceduralTower({
      id: 'tower2',
      name: 'Piso 2: Las Catacumbas Hundidas — Galería Espectral',
      danteCircle: 'Piso 2: Catacumbas Hundidas — Bruma y Criptas',
      biome: 'sunken_necropolis',
      width: 960,
      height: 3800,
      musicTrack: 'ascent',
      ambientRain: false,
      hasLava: true,
      basePlatformType: 'stone',
      tiers: [
        { name: 'Galería de Huesos', minY: 2600, maxY: 3800, platformType: 'bone', ladderType: 'bone', mageChance: 0.2, enemyHp: 48, enemySkin: 'mud', batTypes: ['gargoyle', 'toxic'] },
        { name: 'Pantano Subterráneo', minY: 1450, maxY: 2600, platformType: 'mud', mageChance: 0.3, enemyHp: 58, enemySkin: 'toxic', batTypes: ['toxic', 'gargoyle'] },
        { name: 'Murallas Sumergidas', minY: 300, maxY: 1450, platformType: 'stone', mageChance: 0.45, enemyHp: 68, enemySkin: 'toxic', batTypes: ['toxic', 'abyss'] }
      ],
      portalTarget: 'boss_flegias',
      portalLabel: 'Santuario del Fango — Flegias'
    });
  }

  // ─── 4. BOSS 2: FLEGIAS (BARQUERO DEL ABISMO HUNDIDO) ───
  createBossFlegiasLevel() {
    return {
      id: 'boss_flegias',
      name: 'Santuario del Fango — Guardián Flegias',
      danteCircle: 'Piso 2: Santuario del Fango — Flegias',
      biome: 'sunken_necropolis',
      width: 1200,
      height: 540,
      spawn: { x: 220, y: 412 },
      isCombatScene: true,
      musicTrack: 'boss',
      ambientRain: true,
      hasLava: false,
      platforms: [
        { x: 80, y: 450, w: 1040, h: 42, type: 'stone' },
        { x: 120, y: 350, w: 180, h: 22, type: 'stone' },
        { x: 900, y: 350, w: 180, h: 22, type: 'stone' },
        { x: 380, y: 300, w: 200, h: 22, type: 'stone' },
        { x: 620, y: 300, w: 200, h: 22, type: 'stone' }
      ],
      ladders: [],
      movingPlatforms: [],
      crumblingPlatforms: [],
      spikes: [],
      torches: [
        { x: 180, y: 420, blue: true },
        { x: 1020, y: 420, blue: true },
        { x: 600, y: 270, blue: true }
      ],
      boss: {
        type: 'flegias',
        name: 'Flegias, Barquero del Abismo Hundido',
        x: 860,
        y: 382,
        maxHp: 1250,
        hp: 1250,
        armor: 0.20,
        dialogueKey: 'flegias_intro',
        nextLevel: 'tower3'
      },
      enemies: [],
      urns: [
        { x: 140, y: 424, value: 40 },
        { x: 1020, y: 424, value: 40 }
      ],
      chests: []
    };
  }

  // ─── 5. TOWER 3: PISO 3 — LAS MURALLAS CARMESÍ (FORTALEZA DE HIERRO) ───
  createTower3Level() {
    return this.generateProceduralTower({
      id: 'tower3',
      name: 'Piso 3: Las Murallas Carmesí — Fortaleza de Hierro',
      danteCircle: 'Piso 3: Murallas Carmesí — Fortaleza de Hierro',
      biome: 'abyss',
      width: 960,
      height: 4000,
      musicTrack: 'tower',
      ambientRain: false,
      hasLava: true,
      basePlatformType: 'obsidian',
      tiers: [
        { name: 'Bastión de Hierro', minY: 2600, maxY: 4000, platformType: 'obsidian', mageChance: 0.3, enemyHp: 65, enemySkin: 'obsidian', batTypes: ['blood', 'gargoyle'] },
        { name: 'Torreón Carmesí', minY: 1400, maxY: 2600, platformType: 'runic', mageChance: 0.4, enemyHp: 75, enemySkin: 'blood', batTypes: ['blood', 'abyss'] },
        { name: 'Almenas de Fuego', minY: 300, maxY: 1400, platformType: 'obsidian', mageChance: 0.5, enemyHp: 85, enemySkin: 'blood', batTypes: ['blood', 'gargoyle'] }
      ],
      wind: { force: 0.5, activeMinY: 800, activeMaxY: 2400 },
      portalTarget: 'boss_azgalor',
      portalLabel: 'Fortaleza del Fuego — Azgalor'
    });
  }

  // ─── 6. BOSS 3: AZGALOR (SEÑOR DEL FUEGO CARMESÍ) ───
  createBossAzgalorLevel() {
    return {
      id: 'boss_azgalor',
      name: 'Fortaleza del Fuego — Azgalor, el Abrasador',
      danteCircle: 'Piso 3: Fortaleza del Fuego — Azgalor',
      biome: 'abyss',
      width: 1200,
      height: 540,
      spawn: { x: 220, y: 412 },
      isCombatScene: true,
      musicTrack: 'boss',
      ambientRain: false,
      hasLava: true,
      lavaY: 515,
      platforms: [
        { x: 80, y: 450, w: 1040, h: 42, type: 'obsidian' },
        { x: 100, y: 360, w: 180, h: 22, type: 'obsidian' },
        { x: 920, y: 360, w: 180, h: 22, type: 'obsidian' },
        { x: 380, y: 310, w: 200, h: 22, type: 'obsidian' },
        { x: 620, y: 310, w: 200, h: 22, type: 'obsidian' }
      ],
      ladders: [],
      movingPlatforms: [],
      crumblingPlatforms: [],
      spikes: [],
      torches: [
        { x: 180, y: 420, blue: false },
        { x: 1020, y: 420, blue: false },
        { x: 600, y: 280, blue: false }
      ],
      boss: {
        type: 'azgalor',
        name: 'Azgalor, el Abrasador de la Fortaleza',
        x: 860,
        y: 382,
        maxHp: 1750,
        hp: 1750,
        armor: 0.25,
        dialogueKey: 'azgalor_intro',
        nextLevel: 'tower4'
      },
      enemies: [],
      urns: [
        { x: 140, y: 424, value: 50 },
        { x: 1020, y: 424, value: 50 }
      ],
      chests: []
    };
  }

  // ─── 7. TOWER 4: PISO 4 — LAS AGUJAS GLACIARES (EL GRAN FRÍO) ───
  createTower4Level() {
    return this.generateProceduralTower({
      id: 'tower4',
      name: 'Piso 4: Las Agujas Glaciares — El Gran Frío',
      danteCircle: 'Piso 4: Agujas Glaciares — Viento y Escarcha',
      biome: 'frozen_peaks',
      width: 960,
      height: 4000,
      musicTrack: 'frozen',
      ambientRain: false,
      hasLava: false,
      basePlatformType: 'ice',
      tiers: [
        { name: 'Escarcha Baja', minY: 2600, maxY: 4000, platformType: 'ice', mageChance: 0.35, enemyHp: 65, enemySkin: 'ice', batTypes: ['frost', 'gargoyle'] },
        { name: 'Glaciar Colgante', minY: 1400, maxY: 2600, platformType: 'stone', mageChance: 0.45, enemyHp: 75, enemySkin: 'ice', batTypes: ['frost', 'blood'] },
        { name: 'Agujas Árticas', minY: 300, maxY: 1400, platformType: 'ice', mageChance: 0.55, enemyHp: 85, enemySkin: 'ice', batTypes: ['frost', 'gargoyle'] }
      ],
      wind: { force: -0.75, activeMinY: 500, activeMaxY: 2800 },
      portalTarget: 'boss_malacoda',
      portalLabel: 'Cumbres Heladas — Bestia Malacoda'
    });
  }

  // ─── 8. BOSS 4: MALACODA (BESTIA DE LAS AGUJAS) ───
  createBossMalacodaLevel() {
    return {
      id: 'boss_malacoda',
      name: 'Cumbres Heladas — Bestia Malacoda',
      danteCircle: 'Piso 4: Cumbres Heladas — Malacoda',
      biome: 'frozen_peaks',
      width: 1200,
      height: 540,
      spawn: { x: 220, y: 412 },
      isCombatScene: true,
      musicTrack: 'boss',
      ambientRain: false,
      hasLava: false,
      platforms: [
        { x: 80, y: 450, w: 1040, h: 42, type: 'ice' },
        { x: 100, y: 340, w: 180, h: 22, type: 'ice' },
        { x: 920, y: 340, w: 180, h: 22, type: 'ice' },
        { x: 360, y: 290, w: 220, h: 22, type: 'stone' },
        { x: 640, y: 290, w: 220, h: 22, type: 'stone' }
      ],
      ladders: [],
      movingPlatforms: [],
      crumblingPlatforms: [],
      spikes: [],
      torches: [
        { x: 180, y: 420, blue: true },
        { x: 1020, y: 420, blue: true },
        { x: 600, y: 260, blue: true }
      ],
      boss: {
        type: 'malacoda',
        name: 'Malacoda, Bestia de las Agujas',
        x: 860,
        y: 376,
        maxHp: 2300,
        hp: 2300,
        armor: 0.30,
        dialogueKey: 'malacoda_intro',
        nextLevel: 'tower5'
      },
      enemies: [],
      urns: [
        { x: 140, y: 424, value: 60 },
        { x: 1020, y: 424, value: 60 }
      ],
      chests: []
    };
  }

  // ─── 9. TOWER 5: PISO 5 — EL ATRIO DORADO (CÚPULA PRE-TERRENAL) ───
  createTower5Level() {
    return this.generateProceduralTower({
      id: 'tower5',
      name: 'Piso 5: El Atrio Dorado — Cúpula Pre-Terrenal',
      danteCircle: 'Piso 5: Atrio Dorado — El Velo de la Cúpula',
      biome: 'surface_threshold',
      width: 960,
      height: 4200,
      musicTrack: 'summit',
      ambientRain: false,
      hasLava: false,
      basePlatformType: 'gold',
      tiers: [
        { name: 'Galería de Oro', minY: 2800, maxY: 4200, platformType: 'gold', ladderType: 'gold', mageChance: 0.40, enemyHp: 80, enemySkin: 'gold', batTypes: ['gargoyle', 'abyss'] },
        { name: 'Mármol Rúnico', minY: 1450, maxY: 2800, platformType: 'runic', mageChance: 0.50, enemyHp: 90, enemySkin: 'gold', batTypes: ['gargoyle', 'blood'] },
        { name: 'Bóveda Pre-Terrenal', minY: 300, maxY: 1450, platformType: 'gold', mageChance: 0.60, enemyHp: 100, enemySkin: 'gold', batTypes: ['gargoyle', 'frost'] }
      ],
      portalTarget: 'boss_glacior',
      portalLabel: 'Sagrario de la Cúpula — Centinela Glacior'
    });
  }

  // ─── 10. BOSS 5: GLACIOR (CENTINELA DEL UMBRAL) ───
  createBossGlaciorLevel() {
    return {
      id: 'boss_glacior',
      name: 'Cúpula Pre-Terrenal — Centinela Glacior',
      danteCircle: 'Piso 5: Cúpula Pre-Terrenal — Glacior',
      biome: 'surface_threshold',
      width: 1200,
      height: 540,
      spawn: { x: 220, y: 412 },
      isCombatScene: true,
      musicTrack: 'summit',
      ambientRain: false,
      hasLava: false,
      platforms: [
        { x: 80, y: 450, w: 1040, h: 42, type: 'gold' },
        { x: 100, y: 350, w: 200, h: 22, type: 'runic' },
        { x: 900, y: 350, w: 200, h: 22, type: 'runic' },
        { x: 480, y: 300, w: 240, h: 22, type: 'gold' }
      ],
      ladders: [],
      movingPlatforms: [],
      crumblingPlatforms: [],
      spikes: [
        { x: 360, y: 428, w: 80, h: 22 },
        { x: 760, y: 428, w: 80, h: 22 }
      ],
      torches: [
        { x: 180, y: 420, blue: true },
        { x: 1020, y: 420, blue: true },
        { x: 600, y: 270, blue: true }
      ],
      boss: {
        type: 'glacior',
        name: 'Glacior, Centinela del Umbral',
        x: 860,
        y: 382,
        maxHp: 3000,
        hp: 3000,
        armor: 0.35,
        dialogueKey: 'glacior_intro',
        nextLevel: 'tower6'
      },
      enemies: [],
      urns: [
        { x: 140, y: 424, value: 80 },
        { x: 1020, y: 424, value: 80 }
      ],
      chests: []
    };
  }

  // ─── 11. TOWER 6: PISO 6 — LA GRAN PUERTA TERRENAL (EL UMBRAL DE LOS VIVOS) ───
  createTower6Level() {
    return this.generateProceduralTower({
      id: 'tower6',
      name: 'Piso 6: La Gran Puerta Terrenal — El Umbral de los Vivos',
      danteCircle: 'Piso 6: Cumbre Terrenal — La Luz del Sol',
      biome: 'surface_threshold',
      width: 960,
      height: 3200,
      musicTrack: 'summit',
      ambientRain: false,
      hasLava: false,
      basePlatformType: 'runic',
      tiers: [
        { name: 'Ruinas del Alba', minY: 2100, maxY: 3200, platformType: 'runic', mageChance: 0.45, enemyHp: 90, enemySkin: 'gold', batTypes: ['gargoyle', 'frost'] },
        { name: 'Jardín de Piedra', minY: 1100, maxY: 2100, platformType: 'stone', mageChance: 0.50, enemyHp: 100, enemySkin: 'celestial', batTypes: ['gargoyle'] },
        { name: 'El Umbral Solar', minY: 300, maxY: 1100, platformType: 'gold', mageChance: 0.60, enemyHp: 110, enemySkin: 'celestial', batTypes: ['gargoyle'] }
      ],
      portalTarget: 'victory',
      portalLabel: '☀️ El Gran Portal Terrenal (Cruzar a los Vivos)'
    });
  }

  // ─── 9. MODO INFERNAL (PROCEDURAL ROGUELITE SURVIVAL) ───
  createInfernalModeLevel() {
    const platforms = [];
    const ladders = [];
    const movingPlatforms = [];
    const crumblingPlatforms = [];
    const spikes = [];
    const torches = [];
    const enemies = [];
    const bats = [];
    const urns = [];
    const chests = [];

    platforms.push({ x: 200, y: 2950, w: 560, h: 36, type: 'obsidian' });

    let currY = 2840;
    let lastX = 480;

    for (let i = 0; i < 64; i++) {
      let pType = 'stone';
      if (i < 8) pType = 'stone';
      else if (i < 16) pType = 'stone';
      else if (i < 24) pType = 'bone';
      else if (i < 32) pType = 'gold';
      else if (i < 42) pType = 'mud';
      else if (i < 52) pType = 'obsidian';
      else if (i < 60) pType = 'runic';
      else pType = 'ice';

      const w = 140 + Math.floor(Math.random() * 110);
      const h = 20 + Math.floor(Math.random() * 6);
      let x = lastX + (Math.random() - 0.5) * 240;
      x = Math.max(80, Math.min(880 - w, x));
      lastX = x;

      const roll = Math.random();
      if (i > 4 && roll < 0.18) {
        movingPlatforms.push({
          x: x,
          y: currY,
          w: w,
          h: h,
          minX: Math.max(60, x - 100),
          maxX: Math.min(900 - w, x + 100),
          speedX: 60 + Math.random() * 40,
          type: pType
        });
      } else if (i > 4 && roll < 0.32) {
        crumblingPlatforms.push({
          x: x,
          y: currY,
          w: Math.min(110, w),
          h: h
        });
      } else {
        platforms.push({
          x: x,
          y: currY,
          w: w,
          h: h,
          type: pType
        });
      }

      if (i > 2 && i % 8 === 0) {
        ladders.push({
          x: Math.min(860, Math.max(100, x + w / 2 - 12)),
          y: currY,
          w: 24,
          h: 110,
          type: pType === 'gold' ? 'gold' : 'iron'
        });
      }

      if (i > 4 && Math.random() > 0.72) {
        spikes.push({
          x: x + 12,
          y: currY - 20,
          w: Math.min(60, w - 24),
          h: 20
        });
      }
      if (i > 8 && Math.random() > 0.85) {
        spikes.push({
          x: x + 20,
          y: currY - 130,
          w: Math.min(70, w - 40),
          h: 18
        });
      }

      if (i % 3 === 0) {
        torches.push({
          x: x + 16,
          y: currY - 28,
          blue: i > 35
        });
      }

      if (i > 3 && w >= 130 && roll >= 0.22 && Math.random() < 0.65) {
        const isMage = Math.random() < 0.35;
        enemies.push({
          x: x + 30,
          y: currY - 34,
          type: isMage ? 'skeleton_mage' : 'skeleton',
          isMage: isMage,
          minX: x + 8,
          maxX: x + w - 34,
          hp: 25 + Math.floor(i * 1.1)
        });
      }

      if (i > 4 && Math.random() < 0.35) {
        bats.push({
          x: x + w / 2,
          y: currY - 50,
          type: 'bat',
          speed: 3.2 + Math.min(1.2, i * 0.02)
        });
      }

      if (i > 1 && i % 4 === 0) {
        urns.push({
          x: x + 25 + Math.random() * (w - 50),
          y: currY - 26,
          value: 15 + i * 2
        });
      }

      currY -= (86 + Math.random() * 16);
    }

    return {
      id: 'infernal',
      name: 'Modo Infernal — Marea de Fuego',
      towerFloor: 'Ascenso Infinito — La Gran Torre del Inframundo',
      danteCircle: 'Ascenso Infinito — La Gran Torre del Inframundo',
      biome: 'dynamic_nexus',
      width: 960,
      height: 3000,
      spawn: { x: 480, y: 2912 },
      isCombatScene: false,
      musicTrack: 'infernal',
      ambientRain: true,
      hasLava: true,
      lavaY: 3080,
      lavaSpeed: 32,
      wind: {
        force: 25,
        dir: 1,
        activeMinY: 800,
        activeMaxY: 2200
      },
      platforms: platforms,
      ladders: ladders,
      movingPlatforms: movingPlatforms,
      crumblingPlatforms: crumblingPlatforms,
      spikes: spikes,
      torches: torches,
      enemies: enemies,
      bats: bats,
      urns: urns,
      chests: chests
    };
  }
}

if (typeof window !== 'undefined') {
  window.LevelManager = LevelManager;
  window.levelManager = new LevelManager();
}
