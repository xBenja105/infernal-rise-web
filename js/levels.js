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
    } else if (levelId === 'boss1' || levelId === 'boss_demon_slime' || levelId === 'boss_azgalor') {
      this.currentLevel = this.createBossDemonSlimeLevel();
    } else if (levelId === 'tower2') {
      this.currentLevel = this.createTower2Level();
    } else if (levelId === 'boss2' || levelId === 'boss_frost_guardian' || levelId === 'boss_flegias' || levelId === 'boss_glacior') {
      this.currentLevel = this.createBossFrostGuardianLevel();
    } else if (levelId === 'tower3') {
      this.currentLevel = this.createTower3Level();
    } else if (levelId === 'boss3' || levelId === 'boss_minotaur' || levelId === 'boss_minos') {
      this.currentLevel = this.createBossMinotaurLevel();
    } else if (levelId === 'infernal') {
      this.currentLevel = this.createInfernalModeLevel();
    } else {
      this.currentLevel = this.createTower1Level();
    }
    return this.currentLevel;
  }

  // ─── 0. PROLOGUE: UNDERWORLD CAVERNS REFUGE & HUB (DARK CAVERN SANCTUARY) ───
  createPrologueLevel() {
    return {
      id: 'prologue',
      name: 'Refugio del Inframundo — Cavernas Tenebrosas',
      danteCircle: 'Cavernas Profundas — Base de la Gran Torre',
      biome: 'prologue',
      width: 960,
      height: 540,
      spawn: { x: 75, y: 442 },
      isCombatScene: false,
      musicTrack: 'lobby',
      ambientRain: false,
      hasLava: false,
      platforms: [
        // Cavern Basalt Foundation
        { x: 0, y: 480, w: 960, h: 60, type: 'cavern_stone' },
        // Cavern Natural Stone Boundary Walls
        { x: 0, y: 0, w: 24, h: 480, type: 'cavern_stone' },
        { x: 936, y: 0, w: 24, h: 480, type: 'cavern_stone' },
        // Ceiling Hanging Rock Beam
        { x: 0, y: 0, w: 960, h: 22, type: 'cavern_stone' },

        // 1. Ruleta de las Armas — Left Rock Dais
        { x: 160, y: 460, w: 140, h: 20, type: 'cavern_stone' },

        // 2. Santuario de Almas — Grand Center 3-Tier Cavern Dais
        { x: 330, y: 460, w: 300, h: 20, type: 'cavern_stone' },
        { x: 370, y: 440, w: 220, h: 20, type: 'cavern_stone' },
        { x: 410, y: 420, w: 140, h: 20, type: 'cavern_stone' },

        // 3. Portal a la Torre — Right Rock Dais
        { x: 730, y: 460, w: 150, h: 20, type: 'cavern_stone' }
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
        // Cavern Eerie Violet Wall Sconces
        { x: 45, y: 420, color: 'purple' },
        { x: 150, y: 425, color: 'purple' },
        { x: 310, y: 425, color: 'purple' },
        { x: 355, y: 405, color: 'purple' },
        { x: 590, y: 405, color: 'purple' },
        { x: 720, y: 425, color: 'purple' },
        { x: 890, y: 425, color: 'purple' }
      ],
      enemies: [],
      urns: [
        { x: 95, y: 448, value: 25 },
        { x: 230, y: 448, value: 20 },
        { x: 655, y: 428, value: 20 },
        { x: 820, y: 448, value: 25 }
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
    const crackedWalls = [];
    const bloodAltars = [];
    const runicBells = [];
    const spectralPlatforms = [];
    const seesawPlatforms = [];
    const ascensionVortices = [];
    const familiarCages = [];
    let hermitOutpost = null;

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

    while (currY > 640) {
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
          isHaven: true,
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

      // Procedural platform patterns (14 Diverse Architectural Archetypes)
      // 0: Dual flanking platforms
      // 1: Wide center platform with stepping ledge
      // 2: Solid platform + moving platform bridge
      // 3: Solid platform + crumbling stone
      // 4: Vertical Ruined Tower Buttress & Shaft (Vertical structure with wall ledges)
      // 5: Collapsed Gothic Arch & Ruined Lintel (Multi-height broken arch slabs)
      // 6: Ruined Column Shafts with Capitals (Stepping stone pillars over gap)
      // 7: Fortress Parapet & Crenelated Stone Platform
      // 8: La Escala del Abismo (Gran Chimenea con Escalera Larga Solitaria)
      // 9: Campana Rúnica y Peldaños Espectrales (Runic Bell & Spectral Platforms)
      // 10: Puente Báscula / Balancín Dinámico (Seesaw Platform)
      // 11: Vórtice / Burbuja de Ascensión Arcana (Ascension Vortex)
      // 12: Andamios Mineros y Puentes Colgantes (Mining Scaffolding & Timber Beams)
      // 13: Cornisas Escalonadas y Arcos de Sarcófago Góticos (Corbelled Ledges)
      let pattern = Math.floor(Math.random() * 14);
      if (pattern === lastPattern) {
        pattern = (pattern + 1) % 14;
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
        // Wide Center platform with adjacent stepping ledge
        const cw = 260 + Math.floor(Math.random() * 70);
        const cx = Math.floor((width - cw) / 2) + Math.floor((Math.random() - 0.5) * 80);
        const platC = { x: cx, y: currY, w: cw, h: 22, type: pType };
        platforms.push(platC);
        layerPlatforms.push(platC);

        // Adjacent stepping stone on the wider gap side
        const stepOnLeft = cx > (width / 2);
        const stepW = 100 + Math.floor(Math.random() * 30);
        const stepX = stepOnLeft ? (80 + Math.floor(Math.random() * 30)) : (width - stepW - 80 - Math.floor(Math.random() * 30));
        const platStep = { x: stepX, y: currY - 24, w: stepW, h: 20, type: pType, isRuined: true };
        platforms.push(platStep);
        layerPlatforms.push(platStep);

        // Occasional small spike hazard on outer edge
        if (Math.random() < 0.25) {
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
      } else if (pattern === 3) {
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
      } else if (pattern === 4) {
        // ── PATRÓN 4: CONTRAFUERTE / MURO VERTICAL EN RUINAS ──
        // Estructura vertical que divide el nivel con repisas a ambos lados para plataformeo vertical
        const buttressX = Math.floor(width / 2) - 24 + Math.floor((Math.random() - 0.5) * 60);
        const buttressH = 150 + Math.floor(Math.random() * 35);
        const platVert = {
          x: buttressX,
          y: currY - 30,
          w: 48,
          h: buttressH,
          type: pType,
          isVerticalStructure: true
        };

        const sideL = {
          x: Math.max(80, buttressX - 170 - Math.floor(Math.random() * 30)),
          y: currY + 28,
          w: 160,
          h: 22,
          type: pType,
          isRuined: true
        };
        const sideR = {
          x: Math.min(width - 240, buttressX + 48 + 20 + Math.floor(Math.random() * 30)),
          y: currY - 26,
          w: 160,
          h: 22,
          type: pType,
          isRuined: true
        };

        platforms.push(platVert, sideL, sideR);
        layerPlatforms.push(sideL, sideR);

        // Ladder to scale the vertical buttress
        if (Math.random() < 0.55) {
          ladders.push({
            x: buttressX + 12,
            y: currY - 26,
            w: 24,
            h: 90,
            type: pType === 'gold' ? 'gold' : 'iron'
          });
        }
      } else if (pattern === 5) {
        // ── PATRÓN 5: ARCO GÓTICO COLAPSADO / DINTEL QUEBRADO ──
        // Losas de piedra fracturada a 3 niveles escalonados que forman los restos de un gran arco
        const archBaseX = Math.floor((width - 480) / 2) + Math.floor((Math.random() - 0.5) * 60);
        const slab1 = { x: archBaseX, y: currY + 24, w: 140, h: 22, type: pType, isRuined: true };
        const slab2 = { x: archBaseX + 160, y: currY - 20, w: 160, h: 24, type: pType, isArch: true };
        const slab3 = { x: archBaseX + 340, y: currY + 18, w: 140, h: 22, type: pType, isRuined: true };

        platforms.push(slab1, slab2, slab3);
        layerPlatforms.push(slab1, slab2, slab3);
      } else if (pattern === 6) {
        // ── PATRÓN 6: PILARES TRUNCADOS Y CAPITELES DE SALTO ──
        // Columnas quebradas rematadas por capiteles de piedra que sirven de peldaño sobre el vacío
        const col1X = 140 + Math.floor(Math.random() * 80);
        const col2X = width - 280 - Math.floor(Math.random() * 80);
        const col1 = { x: col1X, y: currY, w: 120, h: 26, type: pType, isPillarRemnant: true };
        const col2 = { x: col2X, y: currY - 26, w: 120, h: 26, type: pType, isPillarRemnant: true };
        const midX = Math.floor((col1X + col2X) / 2) - 45;
        const midStep = { x: midX, y: currY - 52, w: 90, h: 20, type: pType, isRuined: true };

        platforms.push(col1, col2, midStep);
        layerPlatforms.push(col1, col2, midStep);
      } else if (pattern === 7) {
        // ── PATRÓN 7: BALUARTE ALMENADO Y REPISA VOLADIZA ──
        // Plataforma defensiva ancha con almenas y losa voladiza
        const parapetW = 320 + Math.floor(Math.random() * 50);
        const parapetX = Math.floor((width - parapetW) / 2) + Math.floor((Math.random() - 0.5) * 60);
        const platParapet = { x: parapetX, y: currY, w: parapetW, h: 26, type: pType, isParapet: true };

        const sideX = parapetX > (width / 2) ? (parapetX - 160) : (parapetX + parapetW + 30);
        const platSide = { x: Math.max(80, Math.min(width - 200, sideX)), y: currY - 36, w: 120, h: 22, type: pType, isRuined: true };

        platforms.push(platParapet, platSide);
        layerPlatforms.push(platParapet, platSide);

        torches.push({ x: parapetX + 24, y: currY - 30, blue: isBlueTorch });
        torches.push({ x: parapetX + parapetW - 24, y: currY - 30, blue: isBlueTorch });
      } else if (pattern === 8) {
        // ── PATRÓN 8: LA ESCALA DEL ABISMO (GRAN CHIMENEA CON ESCALERA LARGA SOLITARIA) ──
        // Gran foso vertical sin plataformas intermedias a los lados: solo se puede subir trepando por la escalera
        const ladderH = 220 + Math.floor(Math.random() * 50); // 220 a 270px de escalada pura
        const shaftX = Math.floor(width / 2) - 13 + Math.floor((Math.random() - 0.5) * 80);

        // Plataforma inferior de despegue (base de salto)
        const baseW = 160 + Math.floor(Math.random() * 40);
        const baseX = Math.max(90, Math.min(width - baseW - 90, shaftX - Math.floor(baseW / 2) + 13));
        const platBase = { x: baseX, y: currY, w: baseW, h: 24, type: pType };

        // Plataforma superior de recepción (desembarco del ascenso)
        const topW = 180 + Math.floor(Math.random() * 40);
        const topY = currY - ladderH;
        const topSideLeft = Math.random() < 0.5;
        const topX = topSideLeft
          ? Math.max(90, shaftX - topW + 28)
          : Math.min(width - topW - 90, shaftX - 8);
        const platTop = { x: topX, y: topY, w: topW, h: 24, type: pType };

        // Escalera larga que cruza todo el abismo vertical
        const ladType = pType === 'gold' ? 'gold' : 'iron';
        ladders.push({
          x: shaftX,
          y: topY,
          w: 26,
          h: ladderH,
          type: ladType,
          isLongLadder: true
        });

        // Antorchas en cornisas seguras de base y cima
        torches.push({ x: baseX + 18, y: currY - 30, blue: isBlueTorch });
        torches.push({ x: topX + topW - 18, y: topY - 30, blue: isBlueTorch });

        platforms.push(platBase, platTop);
        layerPlatforms.push(platBase, platTop);

        // Compensar altura escalada para el siguiente ciclo procedural
        currY = topY;
      } else if (pattern === 9) {
        // ── PATRÓN 9: CAMPANA RÚNICA Y PELDAÑOS ESPECTRALES ──
        // La campana cuelga de una viga. Al golpearla con la espada, activa plataformas espectrales que duran 5.5s
        const onLeft = Math.random() < 0.5;
        const anchorW = 170;
        const anchorX = onLeft ? 80 : (width - anchorW - 80);
        const platAnchor = { x: anchorX, y: currY, w: anchorW, h: 24, type: pType };

        const spId1 = 'spec_' + Math.random().toString(36).substr(2, 7);
        const spId2 = 'spec_' + Math.random().toString(36).substr(2, 7);

        const bellX = onLeft ? (anchorX + 115) : (anchorX + 18);
        const bellY = currY - 60;
        runicBells.push({
          x: bellX,
          y: bellY,
          w: 36,
          h: 48,
          targetPlatformIds: [spId1, spId2]
        });

        const sp1X = onLeft ? (anchorX + anchorW + 35) : (anchorX - 125);
        const sp2X = onLeft ? (sp1X + 130) : (sp1X - 130);

        spectralPlatforms.push(
          { id: spId1, x: sp1X, y: currY - 26, w: 90, h: 18, color: '#38bdf8' },
          { id: spId2, x: sp2X, y: currY - 54, w: 90, h: 18, color: '#38bdf8' }
        );

        const destW = 180;
        const destX = onLeft ? Math.min(width - destW - 80, sp2X + 125) : Math.max(80, sp2X - destW - 35);
        const platDest = { x: destX, y: currY - 80, w: destW, h: 24, type: pType };

        torches.push({ x: anchorX + 24, y: currY - 30, blue: true });
        torches.push({ x: destX + destW - 24, y: currY - 110, blue: true });

        platforms.push(platAnchor, platDest);
        layerPlatforms.push(platAnchor, platDest);
        currY -= 55;
      } else if (pattern === 10) {
        // ── PATRÓN 10: PUENTE BÁSCULA / BALANCÍN DINÁMICO (SEESAW) ──
        // Viga basculante que se inclina con el peso del jugador sobre un foso
        const ledgeW = 160;
        const platL = { x: 80, y: currY, w: ledgeW, h: 24, type: pType };
        const platR = { x: width - ledgeW - 80, y: currY - 16, w: ledgeW, h: 24, type: pType };

        const seesawW = 220;
        const pivotX = Math.floor(width / 2);
        const pivotY = currY - 6;

        seesawPlatforms.push({
          x: pivotX,
          y: pivotY,
          w: seesawW
        });

        // Foso de pinchos bajo la báscula
        spikes.push({
          x: pivotX - 75,
          y: currY + 45,
          w: 150,
          h: 20
        });

        platforms.push(platL, platR);
        layerPlatforms.push(platL, platR);
      } else if (pattern === 11) {
        // ── PATRÓN 11: VÓRTICE / BURBUJA DE ASCENSIÓN EN CHIMENEA VERTICAL ──
        // Esfera arcana flotante que anula la gravedad e impulsa a Kael
        const launchW = 180;
        const launchX = 90 + Math.floor(Math.random() * 50);
        const platLaunch = { x: launchX, y: currY, w: launchW, h: 24, type: pType };

        const targetY = currY - 210;
        const landW = 200;
        const landX = width - landW - 90 - Math.floor(Math.random() * 50);
        const platLand = { x: landX, y: targetY, w: landW, h: 24, type: pType };

        const vortexX = Math.floor((launchX + launchW + landX) / 2);
        const vortexY = currY - 60;
        ascensionVortices.push({
          x: vortexX,
          y: vortexY,
          radius: 26,
          boostPower: 14.5
        });

        // Repisa en ruina intermedia
        const midX = Math.floor(width / 2) - 40;
        const platMid = { x: midX, y: currY - 120, w: 80, h: 18, type: pType, isRuined: true };

        torches.push({ x: launchX + 24, y: currY - 30, blue: isBlueTorch });
        torches.push({ x: landX + landW - 24, y: targetY - 30, blue: isBlueTorch });

        platforms.push(platLaunch, platLand, platMid);
        layerPlatforms.push(platLaunch, platLand, platMid);
        currY = targetY;
      } else if (pattern === 12) {
        // ── PATRÓN 12: ANDAMIOS MINEROS Y PUENTES DE VIGAS SUSPENDIDAS ──
        // Maderas estructurales con postes verticales y puentes de listones
        const scaff1W = 190;
        const scaff1X = 80 + Math.floor(Math.random() * 40);
        const platScaff1 = { x: scaff1X, y: currY, w: scaff1W, h: 20, type: pType, isWoodScaffold: true };

        const scaff2W = 190;
        const scaff2X = width - scaff2W - 80 - Math.floor(Math.random() * 40);
        const platScaff2 = { x: scaff2X, y: currY - 36, w: scaff2W, h: 20, type: pType, isWoodScaffold: true };

        // Puente colgante suspendido
        const bridgeX = scaff1X + scaff1W + 10;
        const bridgeW = Math.max(120, scaff2X - bridgeX - 10);
        const platBridge = { x: bridgeX, y: currY - 18, w: bridgeW, h: 16, type: pType, isRopeBridge: true };

        platforms.push(platScaff1, platScaff2, platBridge);
        layerPlatforms.push(platScaff1, platScaff2, platBridge);
      } else {
        // ── PATRÓN 13: CORNISAS ESCALONADAS Y ARCOS DE SARCÓFAGO GÓTICOS ──
        // Ménsulas voladizas embutidas en muros laterales y dintel central
        const corbelLW = 170;
        const corbelL = { x: 0, y: currY + 12, w: corbelLW, h: 24, type: pType, isCorbelLedge: true };

        const archW = 280;
        const archX = Math.floor((width - archW) / 2);
        const platArch = { x: archX, y: currY - 30, w: archW, h: 26, type: pType, isArch: true, isSarcophagus: true };

        const corbelRW = 170;
        const corbelR = { x: width - corbelRW, y: currY - 72, w: corbelRW, h: 24, type: pType, isCorbelLedge: true };

        platforms.push(corbelL, platArch, corbelR);
        layerPlatforms.push(corbelL, platArch, corbelR);

        torches.push({ x: 30, y: currY - 18, blue: isBlueTorch });
        torches.push({ x: width - 30, y: currY - 102, blue: isBlueTorch });
        currY -= 50;
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
            // Urn placement: Ensure urn is never directly on top of or within 45px of any torch
            let urnX = p.x + 24 + Math.floor(Math.random() * (p.w - 48));
            const nearTorch = torches.find(t => Math.abs(t.x - urnX) < 48 && Math.abs(t.y - (p.y - 26)) < 40);
            if (nearTorch) {
              urnX = nearTorch.x > p.x + p.w / 2 ? p.x + 20 : p.x + p.w - 32;
            }
            urns.push({
              x: urnX,
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
    const summitType = config.basePlatformType || 'runic';
    const summitAltar = { x: 200, y: 460, w: 560, h: 32, type: summitType, isCheckpoint: true, isHaven: true, isSummit: true, checkpointId: ckptId++ };
    const summitStep = { x: 360, y: 360, w: 240, h: 24, type: summitType, isSummit: true };
    platforms.push(summitAltar, summitStep);

    const isSummitBlue = (config.basePlatformType === 'glacial_ice' || config.biome === 'frozen_peaks');
    torches.push({ x: 240, y: 430, blue: isSummitBlue });
    torches.push({ x: 720, y: 430, blue: isSummitBlue });
    torches.push({ x: 380, y: 330, blue: isSummitBlue });
    torches.push({ x: 580, y: 330, blue: isSummitBlue });

    urns.push({ x: 640, y: 434, value: 60 });

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

    // Optional Tower Challenge Shrine (Mini-Evento del Averno en mitad de la torre)
    let challengeShrine = null;
    const midY = height * 0.5;
    const candidatePlatforms = platforms.filter(p => Math.abs(p.y - midY) < 550 && p.w >= 140 && p.y > 600 && p.y < height - 500);
    if (candidatePlatforms.length > 0) {
      const bestPlat = candidatePlatforms[Math.floor(candidatePlatforms.length / 2)];
      challengeShrine = {
        x: bestPlat.x + Math.floor(bestPlat.w / 2) - 16,
        y: bestPlat.y - 42,
        w: 32,
        h: 42,
        active: false,
        completed: false,
        enemiesLeft: 0,
        platform: bestPlat
      };
    }

    // ─── SALAS SECRETAS Y PAREDES QUEBRADIZAS (SECRET ROOMS) ───
    const secretRoomY1 = Math.floor(height * 0.62);
    const pLeft = { x: 20, y: secretRoomY1, w: 180, h: 26, type: config.basePlatformType || 'stone', isSecretFloor: true };
    const pLeftCeil = { x: 20, y: secretRoomY1 - 100, w: 180, h: 22, type: config.basePlatformType || 'stone' };
    const pLeftWall = { x: 0, y: secretRoomY1 - 100, w: 22, h: 126, type: config.basePlatformType || 'stone' };
    platforms.push(pLeft, pLeftCeil, pLeftWall);
    
    crackedWalls.push({
      x: 198,
      y: secretRoomY1 - 78,
      w: 28,
      h: 78,
      hp: 50,
      biome: config.biome
    });
    chests.push({
      x: 65,
      y: secretRoomY1 - 32,
      isRelic: true,
      id: `secret_relic_1_${config.id}`
    });
    urns.push(
      { x: 120, y: secretRoomY1 - 26, value: 50 },
      { x: 155, y: secretRoomY1 - 26, value: 70 }
    );
    torches.push({ x: 90, y: secretRoomY1 - 50, blue: true });

    // Segunda Sala Secreta en el flanco derecho
    const secretRoomY2 = Math.floor(height * 0.32);
    const pRight = { x: width - 200, y: secretRoomY2, w: 180, h: 26, type: config.basePlatformType || 'stone', isSecretFloor: true };
    const pRightCeil = { x: width - 200, y: secretRoomY2 - 100, w: 180, h: 22, type: config.basePlatformType || 'stone' };
    const pRightWall = { x: width - 22, y: secretRoomY2 - 100, w: 22, h: 126, type: config.basePlatformType || 'stone' };
    platforms.push(pRight, pRightCeil, pRightWall);

    crackedWalls.push({
      x: width - 226,
      y: secretRoomY2 - 78,
      w: 28,
      h: 78,
      hp: 60,
      biome: config.biome
    });
    chests.push({
      x: width - 150,
      y: secretRoomY2 - 32,
      isRelic: true,
      id: `secret_relic_2_${config.id}`
    });
    urns.push(
      { x: width - 105, y: secretRoomY2 - 26, value: 60 },
      { x: width - 70, y: secretRoomY2 - 26, value: 85 }
    );
    torches.push({ x: width - 120, y: secretRoomY2 - 50, blue: true });

    // ─── PUESTO DEL ERMITAÑO EN LA TORRE (MID-TOWER HAVEN OUTPOST) ───
    const midHavenY = height * 0.48;
    const havenCandidates = platforms.filter(p => p.isCheckpoint && p.checkpointId > 0 && Math.abs(p.y - midHavenY) < 450);
    if (havenCandidates.length > 0) {
      const hermitHaven = havenCandidates[0];
      hermitHaven.isHermitOutpost = true;
      hermitOutpost = {
        x: hermitHaven.x + Math.floor(hermitHaven.w / 2) - 30,
        y: hermitHaven.y - 40,
        w: 28,
        h: 40,
        name: 'Ermitaño de la Torre'
      };
      torches.push({ x: hermitHaven.x + Math.floor(hermitHaven.w / 2) + 25, y: hermitHaven.y - 20, isCampfire: true });
      for (let i = enemies.length - 1; i >= 0; i--) {
        if (Math.abs(enemies[i].y - hermitHaven.y) < 120 && Math.abs(enemies[i].x - hermitHaven.x) < hermitHaven.w + 50) {
          enemies.splice(i, 1);
        }
      }
    }

    // ─── ALTAR DE SANGRE (BLOOD SACRIFICE ALTAR) ───
    const bloodAltarTargetY = height * 0.42;
    const altarCandidates = platforms.filter(p => !p.isSecretFloor && !p.isHermitOutpost && Math.abs(p.y - bloodAltarTargetY) < 350 && p.w >= 120);
    if (altarCandidates.length > 0) {
      const altarPlat = altarCandidates[0];
      bloodAltars.push({
        x: altarPlat.x + Math.floor(altarPlat.w / 2) - 22,
        y: altarPlat.y - 50,
        w: 44,
        h: 52
      });
    }

    // ─── JAULA DE RESCATE DE FAMILIAR / MASCOTA ───
    if (config.familiarCage) {
      const targetY = config.familiarCage.y || (height * 0.55);
      const cageCandidates = platforms.filter(p => !p.isSecretFloor && !p.isHermitOutpost && !p.isCheckpoint && Math.abs(p.y - targetY) < 450 && p.w >= 120);
      const cagePlat = cageCandidates.length > 0 ? cageCandidates[0] : null;
      const cageX = cagePlat ? (cagePlat.x + cagePlat.w - 46) : Math.floor(width / 2);
      const cageY = cagePlat ? (cagePlat.y - 66) : (targetY - 50);

      familiarCages.push({
        id: `cage_${config.familiarCage.id}`,
        familiarId: config.familiarCage.id,
        x: cageX,
        y: cageY,
        w: 36,
        h: 44
      });
    }

    return {
      id: config.id,
      name: config.name,
      towerFloor: config.danteCircle,
      danteCircle: config.danteCircle,
      platformType: config.basePlatformType,
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
      lavaTheme: config.lavaTheme || (config.id === 'tower3' ? 'blood' : config.id === 'tower2' ? 'acid' : (config.id === 'tower1' ? 'infernal' : 'infernal')),
      wind: config.wind || null,
      platforms,
      ladders,
      movingPlatforms,
      crumblingPlatforms,
      spikes,
      torches,
      npc: config.npc || null,
      challengeShrine,
      crackedWalls,
      bloodAltars,
      runicBells,
      spectralPlatforms,
      seesawPlatforms,
      ascensionVortices,
      familiarCages,
      hermitOutpost,
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
      height: 5400,
      musicTrack: 'abyss',
      ambientRain: true,
      hasLava: true,
      lavaTheme: 'infernal',
      lavaSpeed: 24,
      basePlatformType: 'basalt_abyss',
      familiarCage: { id: 'ignis', y: 3200 },
      tiers: [
        { name: 'Foso de Lava Primordial', minY: 4000, maxY: 5400, platformType: 'basalt_abyss', mageChance: 0.0, enemyHp: 35, enemySkin: 'abyss', batTypes: ['abyss'] },
        { name: 'Foso de Basalto Abisal', minY: 2700, maxY: 4000, platformType: 'basalt_abyss', mageChance: 0.20, enemyHp: 45, enemySkin: 'abyss', batTypes: ['abyss'] },
        { name: 'Ascenso de Ceniza y Fuego', minY: 1400, maxY: 2700, platformType: 'basalt_abyss', mageChance: 0.30, enemyHp: 55, enemySkin: 'abyss', batTypes: ['abyss', 'blood'] },
        { name: 'Cimientos del Averno', minY: 300, maxY: 1400, platformType: 'basalt_abyss', mageChance: 0.40, enemyHp: 65, enemySkin: 'abyss', batTypes: ['abyss', 'blood'] }
      ],
      wind: { force: 0.65, activeMinY: 2000, activeMaxY: 3800 },
      portalTarget: 'boss_demon_slime',
      portalLabel: 'Cámara del Abismo — Demonio de Fuego'
    });
  }

  // ─── 2. BOSS 1: DEMONIO DE FUEGO (SEÑOR DEL FOSO ABISAL) ───
  createBossDemonSlimeLevel() {
    return {
      id: 'boss_demon_slime',
      name: 'Cámara del Abismo — Demonio de Fuego',
      danteCircle: 'Piso 1: Cámara del Abismo — Demonio de Fuego',
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
        { x: 80, y: 450, w: 1040, h: 42, type: 'basalt_abyss' },
        { x: 120, y: 350, w: 180, h: 22, type: 'basalt_abyss' },
        { x: 900, y: 350, w: 180, h: 22, type: 'basalt_abyss' },
        { x: 380, y: 300, w: 200, h: 22, type: 'basalt_abyss' },
        { x: 620, y: 300, w: 200, h: 22, type: 'basalt_abyss' }
      ],
      ladders: [],
      movingPlatforms: [],
      crumblingPlatforms: [],
      spikes: [],
      torches: [
        { x: 180, y: 420, color: 'orange' },
        { x: 1020, y: 420, color: 'orange' },
        { x: 600, y: 270, color: 'orange' }
      ],
      boss: {
        type: 'demon_slime',
        name: 'Demonio de Fuego, Azote del Foso',
        x: 860,
        y: 364,
        maxHp: 1200,
        hp: 1200,
        armor: 0.15,
        touchDamage: 38,
        dialogueKey: 'demon_slime_intro',
        nextLevel: 'tower2'
      },
      enemies: [],
      urns: [
        { x: 130, y: 424, value: 30 },
        { x: 940, y: 424, value: 30 }
      ],
      chests: []
    };
  }
  createBossAzgalorLevel() {
    return this.createBossDemonSlimeLevel();
  }

  // ─── 3. TOWER 2: PISO 2 — LAS AGUJAS GLACIARES (EL GRAN FRÍO) ───
  createTower2Level() {
    return this.generateProceduralTower({
      id: 'tower2',
      name: 'Piso 2: Las Agujas Glaciares — El Gran Frío',
      danteCircle: 'Piso 2: Cumbres Glaciares — Viento y Escarcha',
      biome: 'frozen_peaks',
      width: 960,
      height: 5800,
      musicTrack: 'frozen',
      ambientRain: false,
      hasLava: false,
      basePlatformType: 'glacial_ice',
      familiarCage: { id: 'aura', y: 3600 },
      tiers: [
        { name: 'Escarcha Baja & Fosas de Hielo', minY: 3900, maxY: 5800, platformType: 'glacial_ice', mageChance: 0.25, enemyHp: 55, enemySkin: 'frost', batTypes: ['frost'] },
        { name: 'Glaciares Colgantes & Criptas', minY: 1900, maxY: 3900, platformType: 'glacial_ice', mageChance: 0.35, enemyHp: 65, enemySkin: 'frost', batTypes: ['frost'] },
        { name: 'Agujas Árticas & Vientos', minY: 300, maxY: 1900, platformType: 'glacial_ice', mageChance: 0.45, enemyHp: 75, enemySkin: 'frost', batTypes: ['frost'] }
      ],
      wind: { force: -0.65, activeMinY: 800, activeMaxY: 4200 },
      portalTarget: 'boss_frost_guardian',
      portalLabel: 'Santuario Glaciar — Guardián de Hielo'
    });
  }

  // ─── 4. BOSS 2: GUARDIÁN DE HIELO (CENTINELA GLACIAR) ───
  createBossFrostGuardianLevel() {
    return {
      id: 'boss_frost_guardian',
      name: 'Santuario Glaciar — Guardián de Hielo',
      danteCircle: 'Piso 2: Santuario Glaciar — Guardián de Hielo',
      biome: 'frozen_peaks',
      width: 1200,
      height: 540,
      spawn: { x: 220, y: 412 },
      isCombatScene: true,
      musicTrack: 'boss',
      ambientRain: false,
      hasLava: false,
      platforms: [
        { x: 80, y: 450, w: 1040, h: 42, type: 'glacial_ice' },
        { x: 100, y: 340, w: 180, h: 22, type: 'glacial_ice' },
        { x: 920, y: 340, w: 180, h: 22, type: 'glacial_ice' },
        { x: 360, y: 290, w: 220, h: 22, type: 'glacial_ice' },
        { x: 640, y: 290, w: 220, h: 22, type: 'glacial_ice' }
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
        type: 'frost_guardian',
        name: 'Guardián de Hielo, Centinela Glaciar',
        x: 860,
        y: 372,
        maxHp: 1600,
        hp: 1600,
        armor: 0.22,
        dialogueKey: 'frost_guardian_intro',
        nextLevel: 'tower3'
      },
      enemies: [],
      urns: [
        { x: 130, y: 424, value: 45 },
        { x: 940, y: 424, value: 45 }
      ],
      chests: []
    };
  }
  createBossFlegiasLevel() {
    return this.createBossFrostGuardianLevel();
  }
  createBossGlaciorLevel() {
    return this.createBossFrostGuardianLevel();
  }

  // ─── 5. TOWER 3: PISO 3 — LAS CAVERNAS ROCOSAS (RUINAS DEL UMBRAL TERRENAL) ───
  createTower3Level() {
    return this.generateProceduralTower({
      id: 'tower3',
      name: 'Piso 3: Las Cavernas Rocosas — Ruinas del Umbral Terrenal',
      danteCircle: 'Piso 3: Grutas de Piedra y Ruinas del Alba',
      biome: 'rocky_caverns',
      width: 960,
      height: 6400,
      musicTrack: 'caverns',
      ambientRain: false,
      hasLava: false,
      risingLava: false,
      basePlatformType: 'cavern_stone',
      familiarCage: { id: 'borus', y: 4200 },
      tiers: [
        { name: 'Fosas Rocosas y Cimientos Quebrados', minY: 4200, maxY: 6400, platformType: 'cavern_stone', mageChance: 0.35, enemyHp: 65, enemySkin: 'abyss', batTypes: ['gargoyle', 'toxic'] },
        { name: 'Galerías de Escombros y Baluartes Góticos', minY: 2100, maxY: 4200, platformType: 'cavern_stone', mageChance: 0.45, enemyHp: 75, enemySkin: 'specter', batTypes: ['gargoyle', 'blood'] },
        { name: 'Bóvedas del Alba y Umbral Solar', minY: 300, maxY: 2100, platformType: 'cavern_stone', mageChance: 0.55, enemyHp: 85, enemySkin: 'ascended', batTypes: ['gargoyle', 'celestial'] }
      ],
      wind: { force: 0.45, activeMinY: 1000, activeMaxY: 3600 },
      portalTarget: 'boss_minotaur',
      portalLabel: 'Cámara Ancestral — El Minotauro, Titán de las Cavernas'
    });
  }

  // ─── 6. BOSS 3: MINOTAURO (TITÁN DE LAS CAVERNAS - FINAL BOSS) ───
  createBossMinotaurLevel() {
    return {
      id: 'boss_minotaur',
      name: 'Cámara Ancestral — Minotauro, Titán de las Cavernas',
      danteCircle: 'Piso 3: Cámara Ancestral — Minotauro',
      biome: 'rocky_caverns',
      width: 1200,
      height: 540,
      spawn: { x: 220, y: 412 },
      isCombatScene: true,
      musicTrack: 'boss',
      ambientRain: false,
      hasLava: false,
      platforms: [
        { x: 80, y: 450, w: 1040, h: 42, type: 'cavern_stone' },
        { x: 120, y: 350, w: 180, h: 22, type: 'cavern_stone' },
        { x: 900, y: 350, w: 180, h: 22, type: 'cavern_stone' },
        { x: 380, y: 300, w: 200, h: 22, type: 'cavern_stone' },
        { x: 620, y: 300, w: 200, h: 22, type: 'cavern_stone' }
      ],
      ladders: [],
      movingPlatforms: [],
      crumblingPlatforms: [],
      spikes: [],
      torches: [
        { x: 180, y: 420, color: 'orange' },
        { x: 1020, y: 420, color: 'orange' },
        { x: 600, y: 270, color: 'orange' }
      ],
      boss: {
        type: 'minotaur',
        name: 'Minotauro, Titán de las Cavernas',
        x: 860,
        y: 366,
        maxHp: 2400,
        hp: 2400,
        armor: 0.28,
        touchDamage: 60,
        dialogueKey: 'minotaur_intro',
        nextLevel: 'victory'
      },
      enemies: [],
      urns: [
        { x: 130, y: 424, value: 60 },
        { x: 940, y: 424, value: 60 }
      ],
      chests: []
    };
  }
  createBossMinosLevel() {
    return this.createBossMinotaurLevel();
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
      basePlatformType: 'glacial_ice',
      tiers: [
        { name: 'Escarcha Baja', minY: 2600, maxY: 4000, platformType: 'glacial_ice', mageChance: 0.35, enemyHp: 65, enemySkin: 'frost', batTypes: ['frost'] },
        { name: 'Glaciar Colgante', minY: 1400, maxY: 2600, platformType: 'glacial_ice', mageChance: 0.45, enemyHp: 75, enemySkin: 'frost', batTypes: ['frost'] },
        { name: 'Agujas Árticas', minY: 300, maxY: 1400, platformType: 'glacial_ice', mageChance: 0.55, enemyHp: 85, enemySkin: 'frost', batTypes: ['frost'] }
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
        { x: 80, y: 450, w: 1040, h: 42, type: 'glacial_ice' },
        { x: 100, y: 340, w: 180, h: 22, type: 'glacial_ice' },
        { x: 920, y: 340, w: 180, h: 22, type: 'glacial_ice' },
        { x: 360, y: 290, w: 220, h: 22, type: 'glacial_ice' },
        { x: 640, y: 290, w: 220, h: 22, type: 'glacial_ice' }
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
        { x: 130, y: 424, value: 60 },
        { x: 940, y: 424, value: 60 }
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
      basePlatformType: 'gold_vault',
      tiers: [
        { name: 'Galería de Oro', minY: 2800, maxY: 4200, platformType: 'gold_vault', ladderType: 'gold', mageChance: 0.40, enemyHp: 80, enemySkin: 'gold', batTypes: ['gold'] },
        { name: 'Mármol Rúnico', minY: 1450, maxY: 2800, platformType: 'gold_vault', mageChance: 0.50, enemyHp: 90, enemySkin: 'gold', batTypes: ['gold'] },
        { name: 'Bóveda Imperial', minY: 300, maxY: 1450, platformType: 'gold_vault', mageChance: 0.60, enemyHp: 100, enemySkin: 'gold', batTypes: ['gold'] }
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
        { x: 80, y: 450, w: 1040, h: 42, type: 'gold_vault' },
        { x: 100, y: 350, w: 200, h: 22, type: 'gold_vault' },
        { x: 900, y: 350, w: 200, h: 22, type: 'gold_vault' },
        { x: 480, y: 300, w: 240, h: 22, type: 'gold_vault' }
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
        { x: 130, y: 424, value: 80 },
        { x: 940, y: 424, value: 80 }
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
      basePlatformType: 'terrenal_sanctuary',
      tiers: [
        { name: 'Ruinas del Alba', minY: 2100, maxY: 3200, platformType: 'terrenal_sanctuary', mageChance: 0.45, enemyHp: 90, enemySkin: 'celestial', batTypes: ['celestial'] },
        { name: 'Jardín de Piedra Terrenal', minY: 1100, maxY: 2100, platformType: 'terrenal_sanctuary', mageChance: 0.50, enemyHp: 100, enemySkin: 'celestial', batTypes: ['celestial'] },
        { name: 'El Umbral Solar de los Vivos', minY: 300, maxY: 1100, platformType: 'terrenal_sanctuary', mageChance: 0.60, enemyHp: 110, enemySkin: 'celestial', batTypes: ['celestial'] }
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
        const urnX = (i % 3 === 0) ? (x + w - 32) : (x + 25 + Math.random() * (w - 50));
        urns.push({
          x: urnX,
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
