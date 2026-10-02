/**
 * Infernal Rise — Incremental Rogue-lite Progression Engine
 * Manages currencies (Souls, Humanity Shards, Penitence Ashes),
 * passive soul generation (APS), permanent meta-upgrades tree,
 * in-run rogue-lite boons/blessings, and prestige resets.
 */

class ProgressionManager {
  constructor() {
    this.SAVE_KEY = 'infernal_rise_save_v1';

    // Currencies
    this.souls = 0;
    this.humanityShards = 0;
    this.penitenceAshes = 0;
    this.totalSoulsEver = 0;
    this.maxHeightClimbed = 0;

    // Upgrades: level of each upgrade in the Withered Soul Tree
    this.upgrades = {
      vitality: 0,          // Raíces: +15 Max HP per level (up to 175 HP)
      spikeResist: 0,       // Raíces: Spike immunity lvl 1, reduces trap/spike damage
      healthRegen: 0,       // Raíces: Continuous HP regen (+0.6 HP/s per level)
      agility: 0,           // Tronco: Movement speed & air control (+4% per level)
      bladeMastery: 0,      // Tronco: Melee dagger damage (+3.5 dmg per level)
      megabonkPower: 0,     // Tronco: Knockback & kinetic wall-slam damage (+20% per level)
      doubleJump: 0,        // Tronco: Mid-air double jump (costs 2 Humanity Shards)
      soulHarvest: 0,       // Rama Izq: +15% souls & +70px magnet aura per level
      altarOfTorment: 0,    // Rama Izq: Passive soul generation (+0.15/s per level)
      wrathFervor: 0,       // Rama Der: +1 starting Balatro fervor & +5% crit chance per level
      eternalAscension: 0   // Copa: +25% boss damage & fatal death prevention shield (costs 3 Shards)
    };

    // ─── VAMPIRE SURVIVORS XP & LEVELING ───
    this.runLevel = 1;
    this.runXp = 0;
    this.runXpToNext = 75;

    // ─── MEGABONK COMBO & MULTIPLIER ───
    this.bonkCombo = 0;
    this.bonkComboTimer = 0;
    this.bonkMaxComboTimer = 3.5;

    // ─── BALATRO CHIPS × MULT ENGINE ───
    this.activeJokers = [];
    this.maxJokers = 5;
    this.lastBalatroScore = null;
    this.balatroScoreTimeout = null;
    this.rerollCost = 15;

    // ─── IN-GAME ACHIEVEMENTS (LOGROS DEL AVERNO) ───
    this.achievements = {};
    this.achievementDefinitions = [
      { id: 'first_blood', name: 'Primer Escarmiento', icon: '💀', desc: 'Derrota a tu primer esqueleto en la Torre.', reward: 25 },
      { id: 'megabonk', name: 'Impacto Titánico', icon: '💥', desc: 'Ejecuta un Megabonk con un golpe devastador.', reward: 35 },
      { id: 'bonk_chain', name: 'Cadena Infernal', icon: '⚡', desc: 'Provoca una colisión dominó entre enemigos.', reward: 45 },
      { id: 'balatro_jackpot', name: 'Tributo Dorado', icon: '🎰', desc: 'Alcanza un multiplicador Balatro superior a 8x.', reward: 50 },
      { id: 'weapon_master', name: 'Maestro del Arsenal', icon: '🗡️', desc: 'Adquiere tu primera arma pasiva automática.', reward: 30 },
      { id: 'super_evolution', name: 'Evolución Legendaria', icon: '👑', desc: 'Super-evoluciona un arma al nivel 5.', reward: 65 },
      { id: 'arsenal_complete', name: 'Ascensión Celestial', icon: '🌟', desc: 'Desbloquea las 7 armas y despierta la Skin Ascendida.', reward: 150, shards: 1 },
      { id: 'boss_slayer', name: 'Verdugo de la Cripta', icon: '👹', desc: 'Derrota al Gran Guardián de la Cripta.', reward: 100, shards: 1 },
      { id: 'lucky_spin', name: 'Suerte del Averno', icon: '🎲', desc: 'Gana un premio en la Ruleta / Tragaperras.', reward: 40 },
      { id: 'speed_demon', name: 'Velocista del Abismo', icon: '⚡', desc: 'Alcanza los 200m de altura en la torre.', reward: 50 },
      { id: 'penitence', name: 'Fénix del Averno', icon: '🔥', desc: 'Realiza tu primer Sacrificio de Cenizas (Prestigio).', reward: 120 },
      { id: 'immortal_run', name: 'Inmortal del Abismo', icon: '🩸', desc: 'Alcanza el nivel 5 de personaje en una sola partida.', reward: 80 }
    ];

    // ─── RUN STATS & END-RUN SUMMARY TRACKING ───
    this.runStartTime = Date.now();
    this.runEnemiesDefeated = 0;
    this.runMegabonks = 0;
    this.runTotalDamageDealt = 0;
    this.runDamageByWeapon = {};
    this.runMaxAltitude = 0;
    this.runSoulsCollected = 0;
    this.runShardsCollected = 0;

    // ─── BESTIARY & SKINS PERSISTENCE ───
    this.bestiaryKills = { skeleton: 0, elite: 0, bat: 0, boss: 0 };
    this.selectedSkin = 'soldier';

    // ─── FAMILIARS & COMPANIONS (PET SYSTEM) ───
    this.unlockedFamiliars = [];
    this.activeFamiliar = null;

    // ─── RELIQUIAS PASIVAS Y MEJORAS DE TIENDA EN RUN ───
    this.runRelics = [];
    this.runBonusDaggerDmg = 0;
    this.runBonusRegen = 0;
    this.relicDefinitions = [
      {
        id: 'relic_double_jump',
        name: 'Pluma Celeste',
        icon: '🪶',
        desc: 'Permite ejecutar un salto doble sagrado en el aire.',
        rarity: 'Legendaria'
      },
      {
        id: 'relic_chain_burn',
        name: 'Corazón de Magma',
        icon: '🔥',
        desc: 'Los impactos causan ignición que se propaga en cadena entre enemigos.',
        rarity: 'Épica'
      },
      {
        id: 'relic_bouncing_projectiles',
        name: 'Espejo Espectral',
        icon: '🪞',
        desc: 'Tus proyectiles rebotan en muros y ganan +25% de velocidad y daño.',
        rarity: 'Rara'
      },
      {
        id: 'relic_dash_master',
        name: 'Sandalias de Hermes',
        icon: '👟',
        desc: 'Reduce el enfriamiento del Dash a 0.4s y deja una estela de fuego.',
        rarity: 'Épica'
      },
      {
        id: 'relic_vampiric_eye',
        name: 'Ojo Vampírico',
        icon: '👁️',
        desc: 'Los Megabonks y críticos de espada restauran +12 HP.',
        rarity: 'Rara'
      },
      {
        id: 'relic_soul_magnet_aura',
        name: 'Vórtice de Almas',
        icon: '🌀',
        desc: 'Atrae automáticamente orbes y gemas desde 400px de distancia.',
        rarity: 'Común'
      }
    ];

    // Active rogue-lite boons for the current run
    this.activeBoons = [];

    // All available boons pool
    this.boonPool = [
      {
        id: 'vampirism',
        name: 'Vampirismo Carmesí',
        rarity: 'Rara',
        desc: 'Recuperas +5 HP cada vez que golpeas a un enemigo o jefe con la espada.',
        icon: '🩸'
      },
      {
        id: 'soulMagnet',
        name: 'Imán Espiritual',
        rarity: 'Común',
        desc: 'Atrae automáticamente los orbes de almas desde una gran distancia (250px).',
        icon: '🧲'
      },
      {
        id: 'shockwaveJump',
        name: 'Salto Sísmico',
        rarity: 'Rara',
        desc: 'Al saltar desde el suelo, desatas una onda de choque sísmica que daña a los enemigos cercanos.',
        icon: '⚡'
      },
      {
        id: 'featherFall',
        name: 'Plumas del Abismo',
        rarity: 'Épica',
        desc: 'Mantener presionado Espacio mientras caes te permite planear suavemente en el aire.',
        icon: '🪶'
      },
      {
        id: 'critStrike',
        name: 'Sed de Verdugo',
        rarity: 'Común',
        desc: 'Tus ataques con espada tienen un 30% de probabilidad de infligir daño crítico (x2.5).',
        icon: '🗡️'
      },
      {
        id: 'flameBlade',
        name: 'Filo Ígneo',
        rarity: 'Épica',
        desc: 'Cada golpe de espada dispara una onda de fuego cortante que viaja hacia adelante.',
        icon: '🔥'
      },
      {
        id: 'ironWill',
        name: 'Voluntad de Hierro',
        rarity: 'Común',
        desc: 'Recibes un 35% menos de daño de todos los ataques enemigos y jefes.',
        icon: '🛡️'
      },
      {
        id: 'goldenTouch',
        name: 'Cosecha Dorada',
        rarity: 'Común',
        desc: 'Los enemigos y urnas sueltan el doble de orbes de almas durante este ascenso.',
        icon: '✨'
      },
      // ─── BENDICIONES MALDITAS (ALTAR DE SANGRE) ───
      {
        id: 'curse_damage',
        isCursed: true,
        name: 'Sed Maldita',
        rarity: 'Maldita',
        desc: '+40% de daño con la espada, pero recibes +15% de daño adicional.',
        icon: '🩸'
      },
      {
        id: 'curse_greed',
        isCursed: true,
        name: 'Avaricia Abisal',
        rarity: 'Maldita',
        desc: 'Triplica el valor de todas las almas recolectadas (x3), pero reduce tu velocidad en un 10%.',
        icon: '🪙'
      },
      {
        id: 'curse_dash',
        isCursed: true,
        name: 'Pacto de Sombras',
        rarity: 'Maldita',
        desc: 'El enfriamiento del Dash se reinicia instantáneamente cada vez que aniquilas a un enemigo.',
        icon: '⚡'
      },
      // ─── ARMAS PASIVAS (VAMPIRE SURVIVORS AUTO-ATTACK) ───
      {
        id: 'weapon_holy_cross',
        isWeapon: true,
        weaponType: 'holy_cross',
        name: 'Cruces de Luz',
        rarity: 'Rara',
        desc: 'Arma Pasiva: Cruces de oro orbitan a Kael, rebanando enemigos cercanos y destruyendo proyectiles.',
        icon: '✝️'
      },
      {
        id: 'weapon_hellfire_orb',
        isWeapon: true,
        weaponType: 'hellfire_orb',
        name: 'Orbe del Averno',
        rarity: 'Rara',
        desc: 'Arma Pasiva: Dispara bolas de fuego teledirigidas al enemigo más cercano que estallan al impactar.',
        icon: '☄️'
      },
      {
        id: 'weapon_celestial_lightning',
        isWeapon: true,
        weaponType: 'celestial_lightning',
        name: 'Ira del Cielo',
        rarity: 'Épica',
        desc: 'Arma Pasiva: Relámpagos celestiales caen del cielo automáticamente sobre los enemigos en área.',
        icon: '⚡'
      },
      {
        id: 'weapon_death_scythe',
        isWeapon: true,
        weaponType: 'death_scythe',
        name: 'Guadaña Espectral',
        rarity: 'Épica',
        desc: 'Arma Pasiva: Lanza guadañas giratorias que atraviesan y desgarran a todos los enemigos en pantalla.',
        icon: '🪓'
      },
      {
        id: 'weapon_blood_garlic',
        isWeapon: true,
        weaponType: 'blood_garlic',
        name: 'Aura de Penitencia',
        rarity: 'Común',
        desc: 'Arma Pasiva: Un halo carmesí continuo rodea a Kael, dañando y repeliendo a cualquier criatura.',
        icon: '📿'
      },
      {
        id: 'weapon_spectral_javelin',
        isWeapon: true,
        weaponType: 'spectral_javelin',
        name: 'Lanza Espectral',
        rarity: 'Épica',
        desc: 'Arma Pasiva: Dispara jabalinas de luz etérea que perforan a todos los enemigos en fila a gran velocidad.',
        icon: '🔱'
      },
      {
        id: 'weapon_infernal_chakram',
        isWeapon: true,
        weaponType: 'infernal_chakram',
        name: 'Chakram del Averno',
        rarity: 'Épica',
        desc: 'Arma Pasiva: Lanza discos cortantes ardientes en arco que regresan a Kael como bumerán, rebanando a su paso.',
        icon: '🌀'
      },
      // ─── TOMOS PASIVOS (VAMPIRE SURVIVORS SYNERGY TOMES) ───
      {
        id: 'tome_candelabro',
        isTome: true,
        name: 'Cáliz de Fuego Negro',
        rarity: 'Rara',
        desc: 'Tomo Pasivo: +25% de tamaño y radio de alcance a todas las armas, ondas y auras.',
        icon: '🕯️'
      },
      {
        id: 'tome_spinach',
        isTome: true,
        name: 'Extracto de Sangre Impía',
        rarity: 'Rara',
        desc: 'Tomo Pasivo: +20% de daño a todos los ataques, proyectiles y armas.',
        icon: '🌿'
      },
      {
        id: 'tome_hourglass',
        isTome: true,
        name: 'Reliquia del Tiempo Condenado',
        rarity: 'Épica',
        desc: 'Tomo Pasivo: -15% de tiempo de recarga en todas las armas automáticas.',
        icon: '⏳'
      },
      {
        id: 'tome_clover',
        isTome: true,
        name: 'Sello de Fortuna Infernal',
        rarity: 'Común',
        desc: 'Tomo Pasivo: +15% de probabilidad de asestar Golpes Críticos e Impactos Demoledores.',
        icon: '🍀'
      },
      {
        id: 'tome_gauntlet',
        isTome: true,
        name: 'Guantelete de los Gigantes',
        rarity: 'Rara',
        desc: 'Tomo Pasivo: +60% de fuerza de empuje demoledor y doble daño por reacción en cadena.',
        icon: '🥊'
      },
      // ─── ARCANOS DEL AVERNO (TALISMANES Y BENDICIONES DE DANTE) ───
      {
        id: 'joker_fool',
        isJoker: true,
        name: 'Arcano: El Hereje del Limbo',
        rarity: 'Común',
        desc: 'Arcano: Otorga +4 Fervor 🔴 en cada muerte enemiga ejecutada en el aire.',
        icon: '🃏'
      },
      {
        id: 'joker_greedy',
        isJoker: true,
        name: 'Arcano: El Avaro de Dite',
        rarity: 'Rara',
        desc: 'Arcano: Si posees más de 150 almas, otorga ×1.5 Cólera 🟣 a todas las almas obtenidas.',
        icon: '💰'
      },
      {
        id: 'joker_wheel',
        isJoker: true,
        name: 'Arcano: La Rueda del Destino',
        rarity: 'Épica',
        desc: 'Arcano: 25% de probabilidad de triplicar (×3.0 🟣) el valor de almas.',
        icon: '🎡'
      },
      {
        id: 'joker_hanged',
        isJoker: true,
        name: 'Arcano: El Penitente Colgado',
        rarity: 'Rara',
        desc: 'Arcano: Al sufrir daño, detona una onda sísmica que aniquila enemigos menores.',
        icon: '🪢'
      },
      {
        id: 'joker_death',
        isJoker: true,
        name: 'Arcano: El Juicio Carmesí',
        rarity: 'Épica',
        desc: 'Arcano: Las explosiones de enemigos transmiten fuego ardiente a los adyacentes.',
        icon: '☠️'
      },
      {
        id: 'joker_bonk',
        isJoker: true,
        name: 'Arcano: El Rompehuesos Titánico',
        rarity: 'Rara',
        desc: 'Arcano: Cada Impacto Demoledor añade +10 Fervor 🔴 temporal a la racha de almas.',
        icon: '🔨'
      }
    ];

    this.upgradeDefinitions = {
      // ── RAÍCES DEL AVERNO (SUPERVIVENCIA & FORTALEZA) ──
      vitality: {
        id: 'vitality',
        category: 'roots',
        tier: 1,
        gridX: 20,
        gridY: 82,
        name: 'Raíz de Vitalidad',
        desc: 'Nutre la fuerza vital de Kael (+15 HP máximo por nivel).',
        currency: 'souls',
        baseCost: 45,
        costMult: 1.45,
        maxLvl: 5,
        icon: '❤️',
        statUnit: 'HP',
        statPerLvl: 15,
        prerequisites: []
      },
      spikeResist: {
        id: 'spikeResist',
        category: 'roots',
        tier: 1,
        gridX: 50,
        gridY: 88,
        name: 'Corteza de Obsidiana',
        desc: 'Inmunidad a muerte súbita por pinchos y -12% daño recibido de trampas.',
        currency: 'souls',
        baseCost: 65,
        costMult: 1.5,
        maxLvl: 5,
        icon: '🛡️',
        statUnit: '% Def',
        statPerLvl: 12,
        prerequisites: []
      },
      healthRegen: {
        id: 'healthRegen',
        category: 'roots',
        tier: 2,
        gridX: 80,
        gridY: 82,
        name: 'Savia Carmesí',
        desc: 'Regenera la salud continuamente en el averno (+0.6 HP/s por nivel).',
        currency: 'souls',
        baseCost: 75,
        costMult: 1.55,
        maxLvl: 4,
        icon: '🩸',
        statUnit: 'HP/s',
        statPerLvl: 0.6,
        prerequisites: ['vitality']
      },

      // ── TRONCO DEL SUPLICIO (COMBATE & DESTREZA CENTRAL) ──
      agility: {
        id: 'agility',
        category: 'trunk',
        tier: 2,
        gridX: 50,
        gridY: 68,
        name: 'Impulso de las Sombras',
        desc: '+4% velocidad de movimiento horizontal y maniobrabilidad aérea.',
        currency: 'souls',
        baseCost: 60,
        costMult: 1.45,
        maxLvl: 5,
        icon: '👟',
        statUnit: '% Vel',
        statPerLvl: 4,
        prerequisites: ['vitality', 'spikeResist']
      },
      bladeMastery: {
        id: 'bladeMastery',
        category: 'trunk',
        tier: 3,
        gridX: 50,
        gridY: 52,
        name: 'Filo del Averno',
        desc: 'Temple ígneo en la daga (+3.5 de daño base por nivel a cada estocada).',
        currency: 'souls',
        baseCost: 75,
        costMult: 1.5,
        maxLvl: 5,
        icon: '⚔️',
        statUnit: 'Dmg',
        statPerLvl: 3.5,
        prerequisites: ['agility']
      },
      megabonkPower: {
        id: 'megabonkPower',
        category: 'trunk',
        tier: 4,
        gridX: 50,
        gridY: 38,
        name: 'Impacto Devastador',
        desc: '+20% fuerza de empuje cinético y daño al estrellar enemigos contra muros.',
        currency: 'souls',
        baseCost: 90,
        costMult: 1.55,
        maxLvl: 3,
        icon: '💥',
        statUnit: '% Empuje',
        statPerLvl: 20,
        prerequisites: ['bladeMastery']
      },
      doubleJump: {
        id: 'doubleJump',
        category: 'trunk',
        tier: 5,
        gridX: 50,
        gridY: 24,
        name: 'Gracia de Ceniza (Doble Salto)',
        desc: 'Permite a Kael ejecutar un segundo salto libre y acrobático en el aire.',
        currency: 'humanityShards',
        baseCost: 2,
        costMult: 1.0,
        maxLvl: 1,
        icon: '🪽',
        statUnit: 'Salto',
        statPerLvl: 1,
        prerequisites: ['megabonkPower']
      },

      // ── RAMAS ARCANAS (ALMAS & SINERGIAS) ──
      soulHarvest: {
        id: 'soulHarvest',
        category: 'branches',
        branch: 'left',
        tier: 5,
        gridX: 22,
        gridY: 34,
        name: 'Cosecha de Almas',
        desc: '+15% de almas obtenidas y +70px de radio magnético de absorción.',
        currency: 'souls',
        baseCost: 90,
        costMult: 1.55,
        maxLvl: 4,
        icon: '🔮',
        statUnit: '% Almas',
        statPerLvl: 15,
        prerequisites: ['doubleJump']
      },
      altarOfTorment: {
        id: 'altarOfTorment',
        category: 'branches',
        branch: 'left',
        tier: 6,
        gridX: 16,
        gridY: 18,
        name: 'Tributo del Inframundo',
        desc: 'Genera almas pasivas continuamente (+0.15 almas/segundo por nivel).',
        currency: 'souls',
        baseCost: 110,
        costMult: 1.55,
        maxLvl: 5,
        icon: '🕯️',
        statUnit: 'APS',
        statPerLvl: 0.15,
        prerequisites: ['soulHarvest']
      },
      wrathFervor: {
        id: 'wrathFervor',
        category: 'branches',
        branch: 'right',
        tier: 5,
        gridX: 78,
        gridY: 34,
        name: 'Cólera y Fervor',
        desc: '+1 Fervor inicial en combate Balatro y +5% de probabilidad de golpe crítico.',
        currency: 'souls',
        baseCost: 90,
        costMult: 1.55,
        maxLvl: 4,
        icon: '🔥',
        statUnit: '% Crítico',
        statPerLvl: 5,
        prerequisites: ['doubleJump']
      },

      // ── COPA MARCHITA (MAESTRÍA SUPREMA) ──
      eternalAscension: {
        id: 'eternalAscension',
        category: 'crown',
        tier: 7,
        gridX: 50,
        gridY: 8,
        name: 'Ascensión Eterna',
        desc: '+25% daño a Jefes y 1 protección contra muerte letal por partida.',
        currency: 'humanityShards',
        baseCost: 3,
        costMult: 1.0,
        maxLvl: 1,
        icon: '👑',
        statUnit: 'Poder',
        statPerLvl: 1,
        requiresAll: true,
        prerequisites: ['soulHarvest', 'wrathFervor']
      }
    };

    this.loadSave();
  }

  getStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) {}
    return null;
  }

  loadSave() {
    try {
      const storage = this.getStorage();
      const raw = storage ? (storage.getItem('infernal_rise_save_v2') || storage.getItem('infernal_rise_save_v1') || storage.getItem(this.SAVE_KEY)) : null;
      const data = raw ? JSON.parse(raw) : null;
      if (data) {
        this.souls = data.souls || 0;
        this.humanityShards = data.humanityShards || 0;
        this.penitenceAshes = data.penitenceAshes || 0;
        this.totalSoulsEver = data.totalSoulsEver || 0;
        this.maxHeightClimbed = data.maxHeightClimbed || 0;

        // Auto-sanitize broken or overflowed save data from previous exponential bug
        let neededSanitizing = false;
        if (this.souls > 10000) {
          this.souls = 350;
          neededSanitizing = true;
        }
        if (this.penitenceAshes > 25) {
          this.penitenceAshes = 4;
          neededSanitizing = true;
        }
        if (this.totalSoulsEver > 25000) {
          this.totalSoulsEver = 1500;
          neededSanitizing = true;
        }
        if (this.humanityShards > 40) {
          this.humanityShards = 10;
          neededSanitizing = true;
        }

        if (data.upgrades) {
          if (data.upgrades.chargeSpeed !== undefined && data.upgrades.agility === undefined) {
            data.upgrades.agility = data.upgrades.chargeSpeed;
          }
          if (data.upgrades.soulGreed !== undefined && data.upgrades.soulHarvest === undefined) {
            data.upgrades.soulHarvest = Math.min(4, data.upgrades.soulGreed);
          }
          for (const k in this.upgrades) {
            if (data.upgrades[k] !== undefined) {
              const maxAllowed = this.upgradeDefinitions[k] ? this.upgradeDefinitions[k].maxLvl : 10;
              this.upgrades[k] = Math.min(maxAllowed, Math.max(0, data.upgrades[k]));
            }
          }
        }

        if (data.achievements && typeof data.achievements === 'object') {
          this.achievements = data.achievements;
        }

        if (data.bestiaryKills && typeof data.bestiaryKills === 'object') {
          this.bestiaryKills = Object.assign({ skeleton: 0, elite: 0, bat: 0, boss: 0 }, data.bestiaryKills);
        }

        if (data.selectedSkin && typeof data.selectedSkin === 'string') {
          this.selectedSkin = data.selectedSkin;
        }

        if (Array.isArray(data.unlockedFamiliars)) {
          this.unlockedFamiliars = data.unlockedFamiliars;
        }
        if (typeof data.activeFamiliar === 'string') {
          this.activeFamiliar = data.activeFamiliar;
        }

        if (neededSanitizing) {
          this.save();
        }
      }
    } catch (e) {
      console.warn('Could not load save data', e);
    }
  }

  save() {
    try {
      const storage = this.getStorage();
      if (!storage) return;
      const data = {
        souls: Math.floor(this.souls),
        humanityShards: this.humanityShards,
        penitenceAshes: this.penitenceAshes,
        totalSoulsEver: Math.floor(this.totalSoulsEver),
        maxHeightClimbed: Math.floor(this.maxHeightClimbed),
        upgrades: this.upgrades,
        achievements: this.achievements,
        bestiaryKills: this.bestiaryKills,
        selectedSkin: this.selectedSkin,
        unlockedFamiliars: this.unlockedFamiliars,
        activeFamiliar: this.activeFamiliar
      };
      storage.setItem(this.SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save data', e);
    }
  }

  unlockFamiliar(familiarId) {
    if (!familiarId) return false;
    if (!this.unlockedFamiliars) this.unlockedFamiliars = [];
    if (!this.unlockedFamiliars.includes(familiarId)) {
      this.unlockedFamiliars.push(familiarId);
      this.activeFamiliar = familiarId; // Auto-equip newly rescued companion
      this.save();
      if (window.game && window.game.familiar) {
        window.game.familiar.setFamiliar(familiarId);
      }
      return true;
    }
    return false;
  }

  setActiveFamiliar(familiarId) {
    if (familiarId === null || (this.unlockedFamiliars && this.unlockedFamiliars.includes(familiarId))) {
      this.activeFamiliar = familiarId;
      this.save();
      if (window.game && window.game.familiar) {
        window.game.familiar.setFamiliar(familiarId);
      }
      return true;
    }
    return false;
  }

  unlockAchievement(id) {
    if (!this.achievements) this.achievements = {};
    if (this.achievements[id]) return false; // Already unlocked

    const def = this.achievementDefinitions ? this.achievementDefinitions.find(a => a.id === id) : null;
    if (!def) return false;

    this.achievements[id] = { unlockedAt: Date.now() };
    if (def.reward) this.souls += def.reward;
    if (def.shards) this.humanityShards += def.shards;
    this.save();
    this.updateHUD();

    if (window.soundEngine && window.soundEngine.playAchievementUnlock) {
      window.soundEngine.playAchievementUnlock();
    }

    if (window.game && window.game.showAchievementToast) {
      window.game.showAchievementToast(def);
    }

    return true;
  }

  isAchievementUnlocked(id) {
    return !!(this.achievements && this.achievements[id]);
  }

  getAchievementsProgress() {
    const total = this.achievementDefinitions ? this.achievementDefinitions.length : 12;
    let unlocked = 0;
    if (this.achievementDefinitions) {
      for (const def of this.achievementDefinitions) {
        if (this.isAchievementUnlocked(def.id)) unlocked++;
      }
    }
    return {
      unlocked,
      total,
      percent: Math.round((unlocked / total) * 100)
    };
  }

  exportSaveJSON() {
    let deaths = 0;
    try {
      deaths = Number.parseInt(localStorage.getItem('infernal_rise_deaths') || '0', 10);
    } catch (e) {}

    let unlockedWeapons = [];
    try {
      unlockedWeapons = JSON.parse(localStorage.getItem('infernal_rise_unlocked_weapons') || '[]');
    } catch (e) {}

    const data = {
      game: 'Infernal Rise',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      souls: Math.floor(this.souls),
      humanityShards: this.humanityShards,
      penitenceAshes: this.penitenceAshes,
      totalSoulsEver: Math.floor(this.totalSoulsEver),
      maxHeightClimbed: Math.floor(this.maxHeightClimbed),
      upgrades: this.upgrades,
      achievements: this.achievements,
      bestiaryKills: this.bestiaryKills || {},
      selectedSkin: this.selectedSkin || 'soldier',
      deaths: deaths,
      unlockedWeapons: unlockedWeapons
    };
    return JSON.stringify(data, null, 2);
  }

  importSaveJSON(jsonStr) {
    try {
      const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      if (!parsed || typeof parsed !== 'object') throw new Error('Formato JSON inválido');

      if (typeof parsed.souls === 'number') this.souls = Math.max(0, Math.floor(parsed.souls));
      if (typeof parsed.humanityShards === 'number') this.humanityShards = Math.max(0, parsed.humanityShards);
      if (typeof parsed.penitenceAshes === 'number') this.penitenceAshes = Math.max(0, parsed.penitenceAshes);
      if (typeof parsed.totalSoulsEver === 'number') this.totalSoulsEver = Math.max(0, Math.floor(parsed.totalSoulsEver));
      if (typeof parsed.maxHeightClimbed === 'number') this.maxHeightClimbed = Math.max(0, Math.floor(parsed.maxHeightClimbed));

      if (parsed.upgrades && typeof parsed.upgrades === 'object') {
        for (const [k, v] of Object.entries(parsed.upgrades)) {
          if (this.upgrades[k] !== undefined && typeof v === 'number') {
            this.upgrades[k] = Math.max(0, Math.floor(v));
          }
        }
      }

      if (parsed.achievements && typeof parsed.achievements === 'object') {
        this.achievements = parsed.achievements;
      }

      if (parsed.bestiaryKills && typeof parsed.bestiaryKills === 'object') {
        this.bestiaryKills = Object.assign({ skeleton: 0, elite: 0, bat: 0, boss: 0 }, parsed.bestiaryKills);
      }

      if (parsed.selectedSkin && typeof parsed.selectedSkin === 'string') {
        this.selectedSkin = parsed.selectedSkin;
      }

      if (typeof parsed.deaths === 'number') {
        try {
          localStorage.setItem('infernal_rise_deaths', String(parsed.deaths));
          if (window.game) window.game.deathCount = parsed.deaths;
        } catch (e) {}
      }

      if (Array.isArray(parsed.unlockedWeapons)) {
        try {
          localStorage.setItem('infernal_rise_unlocked_weapons', JSON.stringify(parsed.unlockedWeapons));
        } catch (e) {}
      }

      this.save();
      this.updateHUD();
      if (window.game && window.game.updateDeathCounterUI) window.game.updateDeathCounterUI();
      if (window.game && window.game.updateSanctuaryUI) window.game.updateSanctuaryUI();
      return true;
    } catch (e) {
      console.error('Error importing save data:', e);
      return false;
    }
  }

  resetAllSaveData() {
    this.souls = 0;
    this.humanityShards = 0;
    this.penitenceAshes = 0;
    this.totalSoulsEver = 0;
    this.maxHeightClimbed = 0;
    for (const k of Object.keys(this.upgrades)) {
      this.upgrades[k] = 0;
    }
    this.achievements = {};
    this.bestiaryKills = { skeleton: 0, elite: 0, bat: 0, boss: 0 };
    this.selectedSkin = 'soldier';
    this.resetRunStats();
    try {
      localStorage.removeItem(this.SAVE_KEY);
      localStorage.removeItem('infernal_rise_deaths');
      localStorage.removeItem('infernal_rise_unlocked_weapons');
      localStorage.removeItem('infernal_rise_skin');
      if (window.game) window.game.deathCount = 0;
    } catch (e) {}
    this.save();
    this.updateHUD();
    if (window.game && window.game.updateDeathCounterUI) window.game.updateDeathCounterUI();
    if (window.game && window.game.updateSanctuaryUI) window.game.updateSanctuaryUI();
  }

  // ─── RUN STATS & END-RUN SUMMARY ───
  resetRunStats() {
    this.runStartTime = Date.now();
    this.runEnemiesDefeated = 0;
    this.runMegabonks = 0;
    this.runTotalDamageDealt = 0;
    this.runDamageByWeapon = {};
    this.runMaxAltitude = 0;
    this.runSoulsCollected = 0;
    this.runShardsCollected = 0;
  }

  recordWeaponDamage(weaponId, amount) {
    if (!weaponId || amount <= 0) return;
    if (!this.runDamageByWeapon) this.runDamageByWeapon = {};
    this.runDamageByWeapon[weaponId] = (this.runDamageByWeapon[weaponId] || 0) + amount;
    this.runTotalDamageDealt = (this.runTotalDamageDealt || 0) + amount;
  }

  recordEnemyKill(enemyType = 'skeleton') {
    this.runEnemiesDefeated = (this.runEnemiesDefeated || 0) + 1;
    if (!this.bestiaryKills) this.bestiaryKills = { skeleton: 0, elite: 0, bat: 0, boss: 0 };
    this.bestiaryKills[enemyType] = (this.bestiaryKills[enemyType] || 0) + 1;
    if (this.hasBoon('curse_dash') && window.game && window.game.player) {
      window.game.player.dashCooldown = 0;
    }
    this.save();
  }

  recordMegabonk() {
    this.runMegabonks = (this.runMegabonks || 0) + 1;
  }

  getMostLethalWeapon() {
    if (!this.runDamageByWeapon || Object.keys(this.runDamageByWeapon).length === 0) {
      return { id: 'dagger', name: 'Daga Sombría', icon: '🗡️', damage: 0, percent: 100 };
    }
    let maxId = null;
    let maxDmg = -1;
    for (const [id, dmg] of Object.entries(this.runDamageByWeapon)) {
      if (dmg > maxDmg) {
        maxDmg = dmg;
        maxId = id;
      }
    }
    const weaponNames = {
      dagger: { name: 'Daga Sombría', icon: '🗡️' },
      holyCross: { name: 'Cruces Celestiales', icon: '✝️' },
      hellfireOrb: { name: 'Orbe de Fuego', icon: '☄️' },
      lightning: { name: 'Ira del Trueno', icon: '⚡' },
      scythe: { name: 'Guadaña Espectral', icon: '🪓' },
      garlic: { name: 'Rosario de Penitencia', icon: '📿' },
      javelin: { name: 'Jabalina Espectral', icon: '🔱' },
      chakram: { name: 'Chakram Infernal', icon: '🪃' }
    };
    const def = weaponNames[maxId] || { name: maxId, icon: '⚔️' };
    const pct = this.runTotalDamageDealt > 0 ? Math.round((maxDmg / this.runTotalDamageDealt) * 100) : 100;
    return { id: maxId, name: def.name, icon: def.icon, damage: Math.round(maxDmg), percent: pct };
  }

  getRunSummary() {
    const elapsedSec = Math.max(1, Math.floor((Date.now() - (this.runStartTime || Date.now())) / 1000));
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const lethal = this.getMostLethalWeapon();

    return {
      timeStr,
      duration: timeStr,
      elapsedSec,
      maxAltitude: Math.round(this.runMaxAltitude || 0),
      enemiesDefeated: this.runEnemiesDefeated || 0,
      megabonks: this.runMegabonks || 0,
      totalDamage: Math.round(this.runTotalDamageDealt || 0),
      lethalWeapon: lethal,
      mostLethal: lethal,
      soulsCollected: Math.round(this.runSoulsCollected || 0),
      shardsCollected: this.runShardsCollected || 0
    };
  }

  // ─── BESTIARY DEFINITIONS ───
  getBestiaryList() {
    if (!this.bestiaryKills) this.bestiaryKills = { skeleton: 0, elite: 0, bat: 0, boss: 0 };
    return [
      {
        id: 'skeleton',
        name: 'Esqueleto Guerrero',
        title: 'Soldado Caído del Rey',
        icon: '💀',
        badge: 'Común',
        hp: '30 - 45 HP',
        damage: '18 Daño',
        behavior: 'Patrulla las plataformas de la torre y persigue implacablemente a Kael al detectarlo.',
        weakness: 'Vulnerable a ataques de empuje y colisiones dominó (Cadena Infernal).',
        kills: this.bestiaryKills.skeleton || 0
      },
      {
        id: 'elite',
        name: 'Esqueleto Bruto de Élite',
        title: 'Comandante del Averno',
        icon: '👹',
        badge: 'Élite',
        hp: '85 - 120 HP',
        damage: '26 Daño',
        behavior: 'Posee un aura dorada, mayor masa corporal y resistencia al empuje. Suelta cofres de reliquias.',
        weakness: 'Megabonks cargados y ataques a distancia con Chakram o Jabalina.',
        kills: this.bestiaryKills.elite || 0
      },
      {
        id: 'bat',
        name: 'Murciélago Abisal',
        title: 'Vampiro de las Cavernas',
        icon: '🦇',
        badge: 'Volador',
        hp: '24 - 30 HP',
        damage: '15 Daño',
        behavior: 'Se lanza en picada rasante a gran velocidad aprovechando la verticalidad de la torre.',
        weakness: 'El Rosario de Penitencia y las Cruces Celestiales lo aniquilan al instante.',
        kills: this.bestiaryKills.bat || 0
      },
      {
        id: 'boss',
        name: 'Gran Guardián de la Cripta',
        title: 'El Juez de Huesos',
        icon: '👑',
        badge: 'Jefe',
        hp: '280 - 450 HP',
        damage: '30 - 40 Daño',
        behavior: 'Lanza orbes de magma, invoca pilares de fuego y entra en furia al perder el 50% de su vida.',
        weakness: 'Aprovechar las plataformas superiores y desviar sus proyectiles con la espada.',
        kills: this.bestiaryKills.boss || 0
      }
    ];
  }

  // ─── SKINS & WARDROBE DEFINITIONS ───
  getSkinsList() {
    return [
      {
        id: 'soldier',
        name: 'Soldado Real',
        title: 'Aspecto Clásico',
        desc: 'La armadura de acero y capa carmesí con la que Kael sirvió a la corona.',
        icon: '🛡️',
        unlocked: true,
        colors: { cape: '#c0392b', trim: '#bdc3c7', glow: '#ffffff' }
      },
      {
        id: 'crimson',
        name: 'Caballero Carmesí',
        title: 'Bautismo de Cenizas',
        desc: 'Forjada en el fuego de la Penitencia. Imbuida del ardor de los sacrificios.',
        icon: '🔥',
        unlocked: (this.penitenceAshes || 0) > 0 || this.isAchievementUnlocked('penitence'),
        unlockHint: 'Realiza tu primer Sacrificio de Cenizas (Prestigio).',
        colors: { cape: '#780000', trim: '#ff4d6d', glow: '#ff758f' }
      },
      {
        id: 'specter',
        name: 'Espectro del Abismo',
        title: 'Sombra de la Torre',
        desc: 'Una silueta etérea alimentada por las almas errantes de los condenados.',
        icon: '🌌',
        unlocked: (this.totalSoulsEver || 0) >= 300 || (this.bestiaryKills && (this.bestiaryKills.skeleton || 0) >= 20),
        unlockHint: 'Cosecha 300 almas o derrota a 20 esqueletos.',
        colors: { cape: '#1e1b4b', trim: '#818cf8', glow: '#c7d2fe' }
      },
      {
        id: 'paladin',
        name: 'Paladín Dorado',
        title: 'Favor de la Fortuna',
        desc: 'Engalanado con oro bendito forjado por la suerte del gran multiplicador Balatro.',
        icon: '✨',
        unlocked: this.isAchievementUnlocked('balatro_jackpot') || this.isAchievementUnlocked('lucky_spin'),
        unlockHint: 'Alcanza un multiplicador 8x en Balatro o gana en la Ruleta.',
        colors: { cape: '#b45309', trim: '#fbbf24', glow: '#fef08a' }
      },
      {
        id: 'ascended',
        name: 'Kael Ascendido',
        title: 'Rey Celestial del Averno',
        desc: 'El despertar supremo con alas doradas celestiales y la corona del Averno.',
        icon: '👑',
        unlocked: this.isAchievementUnlocked('arsenal_complete'),
        unlockHint: 'Reúne las 7 armas simultáneamente.',
        colors: { cape: '#0284c7', trim: '#38bdf8', glow: '#ffd700', hasWings: true, hasCrown: true }
      }
    ];
  }

  isSkinUnlocked(skinId) {
    if (skinId === 'soldier') return true;
    const skin = this.getSkinsList().find(s => s.id === skinId);
    return skin ? !!skin.unlocked : false;
  }

  selectSkin(skinId) {
    if (!this.isSkinUnlocked(skinId)) return false;
    this.selectedSkin = skinId;
    try {
      localStorage.setItem('infernal_rise_skin', skinId);
    } catch (_) {}
    return true;
  }

  resetAllProgress() {
    return this.resetAllSaveData();
  }

  // ─── ECONOMY & GAINS ───
  getPrestigeMultiplier() {
    // Each ash gives +2% bonus souls, up to a maximum multiplier of 2.5x (+150%)
    return Math.min(2.5, 1.0 + (this.penitenceAshes * 0.02));
  }

  getPassiveAPS() {
    const lvl = this.upgrades.altarOfTorment || 0;
    if (lvl <= 0) return 0;
    const baseAPS = lvl * 0.15;
    const harvestMult = 1.0 + ((this.upgrades.soulHarvest || 0) * 0.15);
    const prestigeMult = this.getPrestigeMultiplier();
    return baseAPS * harvestMult * prestigeMult;
  }

  addSouls(amount) {
    const harvestMult = 1.0 + ((this.upgrades.soulHarvest || 0) * 0.15);
    const boonMult = this.hasBoon('goldenTouch') ? 1.5 : 1.0;
    const curseMult = this.hasBoon('curse_greed') ? 3.0 : 1.0;
    const prestigeMult = this.getPrestigeMultiplier();
    const finalAmount = Math.max(1, Math.round(amount * harvestMult * boonMult * prestigeMult * curseMult));

    this.souls += finalAmount;
    this.totalSoulsEver += finalAmount;
    this.updateHUD();
    return finalAmount;
  }

  addHumanityShards(count = 1) {
    this.humanityShards += count;
    this.updateHUD();
    this.save();
  }

  // ─── TICK PASSIVE GENERATION ───
  tick(dt) {
    const aps = this.getPassiveAPS();
    if (aps > 0) {
      this.souls += aps * dt;
      this.totalSoulsEver += aps * dt;
      this.updateHUD();
    }
  }

  // ─── UPGRADES LOGIC (WITHERED SOUL TREE) ───
  getUpgradeCost(key) {
    const def = this.upgradeDefinitions[key];
    if (!def) return Infinity;
    const lvl = this.upgrades[key] || 0;
    if (lvl >= def.maxLvl) return Infinity;
    if (def.currency === 'humanityShards') {
      return def.baseCost;
    }
    return Math.floor(def.baseCost * Math.pow(def.costMult, lvl));
  }

  isNodeUnlocked(key) {
    return (this.upgrades[key] || 0) > 0;
  }

  arePrerequisitesMet(key) {
    const def = this.upgradeDefinitions[key];
    if (!def || !def.prerequisites || def.prerequisites.length === 0) return true;
    if (def.requiresAll) {
      return def.prerequisites.every(p => this.isNodeUnlocked(p));
    }
    return def.prerequisites.some(p => this.isNodeUnlocked(p));
  }

  canBuyUpgrade(key) {
    const def = this.upgradeDefinitions[key];
    if (!def) return false;
    const lvl = this.upgrades[key] || 0;
    if (lvl >= def.maxLvl) return false;
    if (!this.arePrerequisitesMet(key)) return false;
    const cost = this.getUpgradeCost(key);
    if (def.currency === 'humanityShards') {
      return this.humanityShards >= cost;
    }
    return this.souls >= cost;
  }

  buyUpgrade(key) {
    if (!this.canBuyUpgrade(key)) return false;
    const def = this.upgradeDefinitions[key];
    const cost = this.getUpgradeCost(key);

    if (def.currency === 'humanityShards') {
      this.humanityShards -= cost;
    } else {
      this.souls -= cost;
    }

    this.upgrades[key] = (this.upgrades[key] || 0) + 1;
    this.save();
    this.updateHUD();
    if (window.soundEngine) window.soundEngine.playUpgradePurchase();
    return true;
  }

  // ─── CALCULATE COMBAT & MOVEMENT STATS ───
  getPlayerStats() {
    const doubleJumpActive = (this.upgrades.doubleJump || 0) > 0 || this.hasRelic('relic_double_jump');
    const baseMagnet = 70 + ((this.upgrades.soulHarvest || 0) * 70);
    const magnetRange = this.hasRelic('relic_soul_magnet_aura') ? (baseMagnet + 300) : (this.hasBoon('soulMagnet') ? (baseMagnet + 180) : baseMagnet);
    const bonusDmg = this.runBonusDaggerDmg || 0;
    const bonusRegen = this.runBonusRegen || 0;

    let baseDmg = 16 + ((this.upgrades.bladeMastery || 0) * 3.5) + bonusDmg;
    if (this.hasBoon('curse_damage')) {
      baseDmg *= 1.40; // +40% sword damage
    }

    let speedMult = 1.0 + ((this.upgrades.agility || 0) * 0.04);
    if (this.hasBoon('curse_greed')) {
      speedMult *= 0.90; // -10% speed
    }

    const maxHpPenalty = this.bloodAltarMaxHpPenalty || 0;
    const computedMaxHp = Math.max(25, 100 + ((this.upgrades.vitality || 0) * 15) - maxHpPenalty);

    return {
      maxHp: computedMaxHp,
      hpRegen: ((this.upgrades.healthRegen || 0) * 0.6) + bonusRegen,
      hasSpikeResist: (this.upgrades.spikeResist || 0) > 0,
      spikeDamageRatio: Math.max(0.28, 0.68 - ((this.upgrades.spikeResist || 0) * 0.08)),
      moveSpeedMult: speedMult,
      jumpForceMult: 1.0,
      weaponName: 'Daga Básica',
      weaponType: 'dagger',
      daggerDamage: Math.round(baseDmg),
      swordDamage: Math.round(baseDmg),
      hasDoubleJump: doubleJumpActive,
      magnetRadius: magnetRange,
      megabonkMult: 1.0 + ((this.upgrades.megabonkPower || 0) * 0.20),
      critChance: (this.upgrades.wrathFervor || 0) * 0.05,
      extraStartingFervor: (this.upgrades.wrathFervor || 0) * 1,
      hasSecondChance: (this.upgrades.eternalAscension || 0) > 0,
      bossDamageMult: (this.upgrades.eternalAscension || 0) > 0 ? 1.25 : 1.0
    };
  }

  // ─── RELIC MANAGEMENT ───
  hasRelic(id) {
    if (!this.runRelics) return false;
    return this.runRelics.some(r => (typeof r === 'string' ? r === id : r.id === id));
  }

  addRelic(relicOrId) {
    if (!this.runRelics) this.runRelics = [];
    const id = typeof relicOrId === 'string' ? relicOrId : (relicOrId && relicOrId.id);
    if (!id || this.hasRelic(id)) return;

    const relicDef = this.relicDefinitions.find(r => r.id === id) || (typeof relicOrId === 'object' ? relicOrId : { id, name: id, icon: '🔮', desc: '' });
    this.runRelics.push(relicDef);

    if (window.game && window.game.showGothicAnnouncement) {
      window.game.showGothicAnnouncement(`${relicDef.icon || '🔮'} ¡RELIQUIA OBTENIDA!`, `${relicDef.name}: ${relicDef.desc}`);
    }
    if (window.soundEngine && window.soundEngine.playAchievementUnlocked) {
      window.soundEngine.playAchievementUnlocked();
    }
    this.updateHUD();
  }

  // ─── ROGUE-LITE BOONS & PASSIVE WEAPONS PER RUN ───
  resetRunBoons() {
    this.activeBoons = [];
    this.activeJokers = [];
    this.runRelics = [];
    this.bloodAltarMaxHpPenalty = 0;
    this.runBonusDaggerDmg = 0;
    this.runBonusRegen = 0;
    this.runLevel = 1;
    this.runXp = 0;
    this.runXpToNext = 75;
    this.bonkCombo = 0;
    this.bonkComboTimer = 0;
    this.lastBalatroScore = null;
    if (this.balatroScoreTimeout) {
      clearTimeout(this.balatroScoreTimeout);
      this.balatroScoreTimeout = null;
    }
    if (window.game && window.game.resetPassiveWeapons) {
      window.game.resetPassiveWeapons();
    }
    this.updateHUD();
  }

  // ─── VAMPIRE SURVIVORS XP & LEVELING ───
  addRunXp(amount) {
    this.runXp += amount;
    let levelsGained = 0;
    while (this.runXp >= this.runXpToNext) {
      this.runXp -= this.runXpToNext;
      this.runLevel++;
      this.runXpToNext = Math.round(this.runXpToNext * 1.30 + 25);
      levelsGained++;
      if (this.runLevel >= 5) {
        this.unlockAchievement('immortal_run');
      }
    }
    this.updateHUD();
    return levelsGained;
  }

  // ─── MEGABONK COMBO SYSTEM ───
  updateBonkCombo(dt) {
    if (this.bonkComboTimer > 0) {
      this.bonkComboTimer -= dt;
      if (this.bonkComboTimer <= 0) {
        this.bonkCombo = 0;
        this.updateHUD();
      }
    }
  }

  addBonkHit(isMegabonk = false) {
    this.bonkCombo++;
    this.bonkComboTimer = this.bonkMaxComboTimer;
    if (isMegabonk) {
      this.bonkCombo += 1;
    }
    this.updateHUD();
    return this.bonkCombo;
  }

  // ─── BALATRO CHIPS × MULT SCORING ENGINE ───
  calculateBalatroScore(baseChips = 2, context = {}) {
    let bonusChips = 0;
    let addMult = Math.min(4, Math.floor(this.bonkCombo * 0.2));
    let xMult = context.isMegabonk ? 1.5 : 1.0;

    // Apply Jokers
    for (const joker of this.activeJokers) {
      if (joker.edition === 'foil') bonusChips += 2;
      else if (joker.edition === 'holo') addMult += 2;
      else if (joker.edition === 'polychrome') xMult *= 1.25;

      switch (joker.id) {
        case 'joker_fool':
          if (context.inAir) addMult += 2;
          break;
        case 'joker_greedy':
          if (this.souls >= 150) xMult *= 1.2;
          break;
        case 'joker_wheel':
          if (Math.random() < 0.20) xMult *= 1.5;
          break;
        case 'joker_bonk':
          if (context.isMegabonk) addMult += 2;
          break;
        case 'joker_golden':
          bonusChips += 4;
          break;
      }
    }

    const finalChips = baseChips + bonusChips;
    const finalMult = Math.max(1, 1 + addMult);
    const rawSouls = Math.round(finalChips * finalMult * xMult);
    const totalSouls = Math.min(20, Math.max(1, rawSouls));

    if (finalChips * finalMult >= 8 || totalSouls >= 8) {
      this.unlockAchievement('balatro_jackpot');
    }

    this.addSouls(totalSouls);
    this.lastBalatroScore = { chips: finalChips, mult: finalMult, xMult: xMult, totalSouls: totalSouls };
    if (this.balatroScoreTimeout) clearTimeout(this.balatroScoreTimeout);
    this.balatroScoreTimeout = setTimeout(() => {
      this.lastBalatroScore = null;
      this.updateHUD();
    }, 3500);
    this.updateHUD();

    return {
      chips: finalChips,
      mult: finalMult,
      xMult: xMult,
      totalSouls: totalSouls
    };
  }

  acquireJoker(jokerData) {
    if (this.activeJokers.length >= this.maxJokers) {
      this.activeJokers.shift();
    }
    const r = Math.random();
    const edition = r < 0.05 ? 'polychrome' : (r < 0.18 ? 'holo' : (r < 0.38 ? 'foil' : 'standard'));
    const joker = {
      ...jokerData,
      edition: jokerData.edition || edition,
      instanceId: 'joker_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4)
    };
    this.activeJokers.push(joker);
    this.updateHUD();
    return joker;
  }

  // ─── REROLL SYSTEM (BALATRO / VAMPIRE SURVIVORS) ───
  canReroll() {
    return this.souls >= this.rerollCost;
  }

  performReroll() {
    if (!this.canReroll()) return false;
    this.souls -= this.rerollCost;
    this.updateHUD();
    if (window.soundEngine && window.soundEngine.playUiClick) {
      window.soundEngine.playUiClick();
    }
    return true;
  }

  getRandomBoons(count = 3, isRelic = false) {
    const pwm = window.game ? window.game.passiveWeaponsManager : null;
    let available = this.boonPool.filter(b => {
      if (b.isCursed) return false;
      if (b.isWeapon) {
        if (!pwm) return true;
        const lvl = pwm.getLevel(b.weaponType);
        if (lvl >= 5) return false;
        if (lvl === 0 && pwm.weapons.size >= 7) return false;
        return true;
      }
      if (b.isTome) {
        const tCount = this.activeBoons.filter(a => a.id === b.id).length;
        return tCount < 3;
      }
      if (b.isJoker) {
        return this.activeJokers.length < this.maxJokers;
      }
      return !this.activeBoons.some(a => a.id === b.id);
    });

    // Check weapon evolutions
    if (pwm && pwm.getAvailableEvolutions) {
      const evoList = pwm.getAvailableEvolutions();
      if (evoList.length > 0) {
        available = [...evoList, ...available];
      }
    }

    if (isRelic) {
      const highTier = available.filter(b => b.isEvolution || b.isWeapon || b.isJoker || b.rarity === 'Épica' || b.rarity === 'Rara');
      if (highTier.length >= count) {
        available = highTier;
      }
    }

    const shuffled = [...available].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  chooseBoon(boon) {
    if (boon.isWeapon) {
      if (window.game && window.game.acquireOrUpgradePassiveWeapon) {
        window.game.acquireOrUpgradePassiveWeapon(boon.weaponType);
      }
      if (!this.activeBoons.some(b => b.id === boon.id)) {
        this.activeBoons.push(boon);
      }
    } else if (boon.isEvolution) {
      if (window.game && window.game.passiveWeaponsManager) {
        window.game.passiveWeaponsManager.evolveWeapon(boon.baseWeaponType);
      }
      if (!this.activeBoons.some(b => b.id === boon.id)) {
        this.activeBoons.push(boon);
      }
    } else if (boon.isJoker) {
      this.acquireJoker(boon);
    } else {
      this.activeBoons.push(boon);
    }
    this.updateHUD();
    if (window.soundEngine) window.soundEngine.playBoonSelect();
  }

  hasBoon(id) {
    return this.activeBoons.some(b => b.id === id);
  }

  // ─── PRESTIGE (PENITENCIA / PURGATORIO) ───
  calculatePendingAshes() {
    // 1 ash per 500 total souls ever earned (capped at 30 max)
    const potentialTotalAshes = Math.min(30, Math.floor(Math.sqrt(this.totalSoulsEver / 500)));
    return Math.max(0, potentialTotalAshes - this.penitenceAshes);
  }

  canPrestige() {
    return this.calculatePendingAshes() >= 1;
  }

  performPrestige() {
    const pending = this.calculatePendingAshes();
    if (pending < 1) return false;

    this.penitenceAshes += pending;

    // Reset base tree upgrades and current souls (keep humanity shards, doubleJump & eternalAscension)
    this.souls = 0;
    this.upgrades.vitality = 0;
    this.upgrades.healthRegen = 0;
    this.upgrades.spikeResist = 0;
    this.upgrades.agility = 0;
    this.upgrades.bladeMastery = 0;
    this.upgrades.megabonkPower = 0;
    this.upgrades.soulHarvest = 0;
    this.upgrades.altarOfTorment = 0;
    this.upgrades.wrathFervor = 0;

    this.resetRunBoons();
    this.save();
    this.updateHUD();
    this.unlockAchievement('penitence');
    if (window.soundEngine) window.soundEngine.playPrestige();
    return true;
  }

  // ─── COMPLETE RESET OF ALL SAVED PROGRESS & STATS ───
  resetAllProgress() {
    this.souls = 0;
    this.humanityShards = 0;
    this.penitenceAshes = 0;
    this.totalSoulsEver = 0;
    this.maxHeightClimbed = 0;
    for (const k in this.upgrades) {
      this.upgrades[k] = 0;
    }
    this.activeBoons = [];
    this.bloodAltarMaxHpPenalty = 0;
    try {
      const storage = this.getStorage();
      if (storage) {
        storage.removeItem(this.SAVE_KEY);
        storage.removeItem('infernal_rise_deaths');
      }
    } catch (e) {
      console.warn('Could not clear localStorage save data', e);
    }
    this.save();
    this.updateHUD();
    return true;
  }

  // ─── HUD UPDATE ───
  updateHUD() {
    const soulsEl = document.getElementById('hud-souls-count');
    if (soulsEl) {
      const aps = this.getPassiveAPS();
      soulsEl.innerHTML = `${Math.floor(this.souls)} <span style="font-size:14px;color:#f4d06f;">(+${aps.toFixed(1)}/s)</span>`;
    }

    const shardsEl = document.getElementById('hud-shards-count');
    if (shardsEl) shardsEl.textContent = this.humanityShards;

    const ashesEl = document.getElementById('hud-ashes-count');
    if (ashesEl) ashesEl.textContent = this.penitenceAshes;

    // Vampire Survivors Run Level & XP Bar
    const runLvlEl = document.getElementById('hud-run-level');
    if (runLvlEl) runLvlEl.textContent = this.runLevel;

    const modalLvlEl = document.getElementById('modal-run-level');
    if (modalLvlEl) modalLvlEl.textContent = this.runLevel;

    const xpFill = document.getElementById('hud-xp-fill');
    if (xpFill) {
      const pct = Math.min(100, Math.max(0, (this.runXp / this.runXpToNext) * 100));
      xpFill.style.width = `${pct.toFixed(1)}%`;
    }

    // Notificación de Mejora / Banco de Niveles en el HUD
    const levelupBadge = document.getElementById('hud-levelup-badge');
    const pendingCount = (window.game && window.game.pendingLevelUps) ? window.game.pendingLevelUps : 0;
    if (levelupBadge) {
      if (pendingCount > 0 && window.game && window.game.state === 'PLAYING') {
        levelupBadge.classList.remove('hidden');
        const countEl = document.getElementById('hud-pending-levels');
        if (countEl) countEl.textContent = pendingCount;
        const keyEl = levelupBadge.querySelector('.hud-levelup-key');
        if (keyEl) {
          keyEl.textContent = (window.game && window.game.lastInputDevice === 'gamepad') ? '[LB]' : '[TAB]';
        }
      } else {
        levelupBadge.classList.add('hidden');
      }
    }

    // Combo de Impactos Demoledores
    const comboEl = document.getElementById('hud-bonk-combo');
    if (comboEl) {
      if (this.bonkCombo > 1) {
        comboEl.classList.remove('hidden');
        comboEl.textContent = this.bonkCombo >= 5 ? `⚡ ¡FRENESÍ TITÁNICO! ×${this.bonkCombo}` : `🔥 IMPACTO ×${this.bonkCombo}!`;
        comboEl.style.transform = `scale(${Math.min(1.35, 1.0 + this.bonkCombo * 0.03)})`;
      } else {
        comboEl.classList.add('hidden');
      }
    }

    // Tributo del Averno (Esencia × Fervor × Cólera = Almas)
    const balatroEl = document.getElementById('hud-balatro-score');
    if (balatroEl) {
      const isPrologue = window.game && window.game.level && window.game.level.id === 'prologue';
      if (!isPrologue && this.lastBalatroScore && this.lastBalatroScore.totalSouls > 0) {
        balatroEl.classList.remove('hidden');
        const xMultText = this.lastBalatroScore.xMult > 1.05 ? ` <span class="xmult-val">(×${this.lastBalatroScore.xMult.toFixed(1)} 🟣)</span>` : '';
        balatroEl.innerHTML = `<span class="chips-val" title="Esencia Base">${this.lastBalatroScore.chips} 🔵</span> × <span class="mult-val" title="+Fervor">+${this.lastBalatroScore.mult} 🔴</span>${xMultText} = <b style="color:#f4d06f;" title="Almas Ganadas">+${this.lastBalatroScore.totalSouls} 🔮</b>`;
      } else {
        balatroEl.classList.add('hidden');
      }
    }

    // Arcanos del Averno Activos
    const jokersContainer = document.getElementById('hud-jokers-container');
    if (jokersContainer) {
      jokersContainer.innerHTML = '';
      for (const j of this.activeJokers) {
        const badge = document.createElement('span');
        const editionClass = j.edition ? `joker-${j.edition}` : 'joker-standard';
        const editionName = j.edition === 'polychrome' ? 'PRISMÁTICO' : (j.edition === 'holo' ? 'RELUCIENTE' : (j.edition === 'foil' ? 'ESPECTRAL' : 'ESTÁNDAR'));
        badge.className = `joker-badge ${editionClass}`;
        badge.title = `${j.name} [${editionName}]: ${j.desc}`;
        badge.textContent = j.icon || '🃏';
        jokersContainer.appendChild(badge);
      }
    }

    // Boons & Relics icons
    const boonsContainer = document.getElementById('hud-active-boons');
    if (boonsContainer) {
      boonsContainer.innerHTML = '';
      // Render Relics first with glowing gold frame
      if (this.runRelics) {
        for (const r of this.runRelics) {
          const badge = document.createElement('span');
          badge.className = 'boon-badge relic-badge';
          badge.style.border = '1px solid #ffd700';
          badge.style.boxShadow = '0 0 6px rgba(255, 215, 0, 0.4)';
          badge.title = `[RELIQUIA] ${r.name}: ${r.desc}`;
          badge.textContent = r.icon || '🔮';
          boonsContainer.appendChild(badge);
        }
      }
      for (const b of this.activeBoons) {
        const badge = document.createElement('span');
        badge.className = 'boon-badge' + (b.isCursed ? ' cursed-boon-badge' : '');
        if (b.isCursed) {
          badge.style.border = '1px solid #ef4444';
          badge.style.boxShadow = '0 0 6px rgba(239, 68, 68, 0.6)';
        }
        badge.title = `${b.isCursed ? '[MALDICIÓN] ' : ''}${b.name}: ${b.desc}`;
        badge.textContent = b.icon;
        boonsContainer.appendChild(badge);
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.ProgressionManager = ProgressionManager;
  window.progression = new ProgressionManager();
}
