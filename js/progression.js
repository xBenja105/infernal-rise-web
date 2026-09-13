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

    // Upgrades: level of each upgrade
    this.upgrades = {
      vitality: 0,        // +10 Max HP per level (up to 200 HP)
      healthRegen: 0,     // Health regen per second (+0.5 HP/s per level)
      spikeResist: 0,     // Level 1 allows surviving spikes! Reduces spike damage further each lvl
      agility: 0,         // Movement & air control speed (+3.5% per lvl)
      jumpPower: 0,       // Jump force (+2% per lvl)
      bladeMastery: 0,    // Sword damage (+2.5 dmg per lvl)
      soulGreed: 0,       // +10% souls gained from height & kills per lvl
      altarOfTorment: 0,  // Passive souls per second (+0.08/s per lvl base)
      doubleJump: 0       // Unlocks mid-air double jump (costs 2 Humanity Shards)
    };

    // ─── VAMPIRE SURVIVORS XP & LEVELING ───
    this.runLevel = 1;
    this.runXp = 0;
    this.runXpToNext = 50;

    // ─── MEGABONK COMBO & MULTIPLIER ───
    this.bonkCombo = 0;
    this.bonkComboTimer = 0;
    this.bonkMaxComboTimer = 3.5;

    // ─── BALATRO CHIPS × MULT ENGINE ───
    this.activeJokers = [];
    this.maxJokers = 5;
    this.lastBalatroScore = { chips: 0, mult: 1, xMult: 1, totalSouls: 0 };
    this.rerollCost = 15;

    // ─── SCRITCHY SCRATCHY ───
    this.activeScratchCard = null;

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
      },
      // ─── TABLILLA RASCABLE DEL DESTINO ───
      {
        id: 'scratch_card_ticket',
        isScratchCard: true,
        name: 'Tablilla Rascable del Destino',
        rarity: 'Épica',
        desc: '¡Tablilla Arcana! Rasca las 3 runas malditas para ganar almas instantáneas, arcanos o el Gran Tributo.',
        icon: '🎟️'
      }
    ];

    this.upgradeDefinitions = {
      vitality: {
        name: 'Vitalidad de Kael',
        desc: 'Incrementa la vida máxima en +10 HP por nivel (hasta 200 HP totales).',
        currency: 'souls',
        baseCost: 50,
        costMult: 1.45,
        maxLvl: 10,
        icon: '❤️'
      },
      healthRegen: {
        name: 'Regeneración Carmesí',
        desc: 'Regenera la salud de Kael continuamente en el tiempo (+0.5 HP/segundo por nivel).',
        currency: 'souls',
        baseCost: 65,
        costMult: 1.5,
        maxLvl: 8,
        icon: '🩸'
      },
      spikeResist: {
        name: 'Piel de Obsidiana',
        desc: 'Nivel 1: ¡Los pinchos ya no te matan al instante! Reduce el daño recibido por trampas y pinchos.',
        currency: 'souls',
        baseCost: 90,
        costMult: 1.6,
        maxLvl: 5,
        icon: '🛡️'
      },
      agility: {
        name: 'Agilidad Abisal',
        desc: 'Aumenta la velocidad de movimiento horizontal y maniobrabilidad aérea en un +3.5% por nivel.',
        currency: 'souls',
        baseCost: 60,
        costMult: 1.45,
        maxLvl: 8,
        icon: '👟'
      },
      jumpPower: {
        name: 'Impulso Titánico',
        desc: 'Aumenta la fuerza base y máxima de salto en un +2% por nivel.',
        currency: 'souls',
        baseCost: 65,
        costMult: 1.5,
        maxLvl: 8,
        icon: '🚀'
      },
      bladeMastery: {
        name: 'Filo del Purgatorio',
        desc: 'Aumenta el filo de tu daga y daño de estocadas en +2.5 por nivel.',
        currency: 'souls',
        baseCost: 70,
        costMult: 1.5,
        maxLvl: 10,
        icon: '⚔️'
      },
      soulGreed: {
        name: 'Codicia del Condenado',
        desc: '+10% de almas obtenidas por altura y por cada enemigo derrotado.',
        currency: 'souls',
        baseCost: 75,
        costMult: 1.5,
        maxLvl: 8,
        icon: '💰'
      },
      altarOfTorment: {
        name: 'Altar del Tormento',
        desc: 'Genera almas pasivas continuamente (+0.08 almas/segundo por nivel base).',
        currency: 'souls',
        baseCost: 90,
        costMult: 1.55,
        maxLvl: 10,
        icon: '🕯️'
      },
      doubleJump: {
        name: 'Doble Salto (Gracia Perdida)',
        desc: 'Permite a Kael realizar un segundo salto libre en el aire.',
        currency: 'humanityShards',
        baseCost: 2,
        costMult: 1.0,
        maxLvl: 1,
        icon: '🪽'
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
          for (const k in this.upgrades) {
            if (data.upgrades[k] !== undefined) {
              const maxAllowed = this.upgradeDefinitions[k] ? this.upgradeDefinitions[k].maxLvl : 10;
              this.upgrades[k] = Math.min(maxAllowed, Math.max(0, data.upgrades[k]));
            }
          }
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
        upgrades: this.upgrades
      };
      storage.setItem(this.SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save data', e);
    }
  }

  // ─── ECONOMY & GAINS ───
  getPrestigeMultiplier() {
    // Each ash gives +2% bonus souls, up to a maximum multiplier of 2.5x (+150%)
    return Math.min(2.5, 1.0 + (this.penitenceAshes * 0.02));
  }

  getPassiveAPS() {
    const lvl = this.upgrades.altarOfTorment;
    if (lvl <= 0) return 0;
    const baseAPS = lvl * 0.08;
    const greedMult = 1.0 + (this.upgrades.soulGreed * 0.10);
    const prestigeMult = this.getPrestigeMultiplier();
    return baseAPS * greedMult * prestigeMult;
  }

  addSouls(amount) {
    const greedMult = 1.0 + (this.upgrades.soulGreed * 0.10);
    const boonMult = this.hasBoon('goldenTouch') ? 1.5 : 1.0;
    const prestigeMult = this.getPrestigeMultiplier();
    const finalAmount = Math.max(1, Math.round(amount * greedMult * boonMult * prestigeMult));

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

  // ─── UPGRADES LOGIC ───
  getUpgradeCost(key) {
    const def = this.upgradeDefinitions[key];
    const lvl = this.upgrades[key];
    if (lvl >= def.maxLvl) return Infinity;
    if (def.currency === 'humanityShards') {
      return def.baseCost;
    }
    return Math.floor(def.baseCost * Math.pow(def.costMult, lvl));
  }

  canBuyUpgrade(key) {
    const def = this.upgradeDefinitions[key];
    const lvl = this.upgrades[key];
    if (lvl >= def.maxLvl) return false;
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

    this.upgrades[key]++;
    this.save();
    this.updateHUD();
    if (window.soundEngine) window.soundEngine.playUpgradePurchase();
    return true;
  }

  // ─── CALCULATE COMBAT & MOVEMENT STATS ───
  getPlayerStats() {
    return {
      maxHp: 100 + (this.upgrades.vitality * 10),
      hpRegen: (this.upgrades.healthRegen || 0) * 0.5,
      hasSpikeResist: this.upgrades.spikeResist > 0,
      spikeDamageRatio: Math.max(0.35, 0.70 - (this.upgrades.spikeResist * 0.07)),
      moveSpeedMult: 1.0 + (this.upgrades.agility * 0.035),
      jumpForceMult: 1.0 + (this.upgrades.jumpPower * 0.02),
      weaponName: 'Daga Básica',
      weaponType: 'dagger',
      daggerDamage: 16 + (this.upgrades.bladeMastery * 2.5),
      swordDamage: 16 + (this.upgrades.bladeMastery * 2.5),
      hasDoubleJump: this.upgrades.doubleJump > 0,
      magnetRadius: this.hasBoon('soulMagnet') ? 260 : 70
    };
  }

  // ─── ROGUE-LITE BOONS & PASSIVE WEAPONS PER RUN ───
  resetRunBoons() {
    this.activeBoons = [];
    this.activeJokers = [];
    this.runLevel = 1;
    this.runXp = 0;
    this.runXpToNext = 50;
    this.bonkCombo = 0;
    this.bonkComboTimer = 0;
    if (window.game && window.game.resetPassiveWeapons) {
      window.game.resetPassiveWeapons();
    }
    this.updateHUD();
  }

  // ─── VAMPIRE SURVIVORS XP & LEVELING ───
  addRunXp(amount) {
    this.runXp += amount;
    let leveledUp = false;
    while (this.runXp >= this.runXpToNext) {
      this.runXp -= this.runXpToNext;
      this.runLevel++;
      this.runXpToNext = Math.round(this.runXpToNext * 1.35 + 20);
      leveledUp = true;
    }
    this.updateHUD();
    return leveledUp;
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

    this.addSouls(totalSouls);
    this.lastBalatroScore = { chips: finalChips, mult: finalMult, xMult: xMult, totalSouls: totalSouls };
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

  // ─── SCRITCHY SCRATCHY (RASCADOR DEL INFRAMUNDO) ───
  generateScratchCard() {
    const symbols = [
      { id: 'souls_8', icon: '🔮', name: '8 Almas', type: 'souls', value: 8 },
      { id: 'souls_15', icon: '🔮', name: '15 Almas', type: 'souls', value: 15 },
      { id: 'souls_25', icon: '✨', name: '25 Almas', type: 'souls', value: 25 },
      { id: 'shard', icon: '💠', name: '1 Fragmento', type: 'shard', value: 1 },
      { id: 'megabonk', icon: '💥', name: 'Impacto Titánico', type: 'megabonk', value: 2 },
      { id: 'joker', icon: '🃏', name: 'Arcano', type: 'joker', value: 1 }
    ];

    const isJackpot = Math.random() < 0.28;
    let cells;
    if (isJackpot) {
      const pick = symbols[Math.floor(Math.random() * symbols.length)];
      cells = [{ ...pick }, { ...pick }, { ...pick }];
    } else {
      cells = [
        { ...symbols[Math.floor(Math.random() * symbols.length)] },
        { ...symbols[Math.floor(Math.random() * symbols.length)] },
        { ...symbols[Math.floor(Math.random() * symbols.length)] }
      ];
      if (cells[0].id === cells[1].id && cells[1].id === cells[2].id) {
        cells[2] = { ...symbols[(symbols.indexOf(cells[0]) + 1) % symbols.length] };
      }
    }

    this.activeScratchCard = {
      id: 'scritch_' + Date.now(),
      cells: cells,
      scratched: [false, false, false],
      isClaimed: false,
      isJackpot: cells[0].id === cells[1].id && cells[1].id === cells[2].id
    };

    return this.activeScratchCard;
  }

  claimScratchReward(card) {
    if (!card || card.isClaimed) return 0;
    card.isClaimed = true;
    let totalSoulsAwarded = 0;

    if (card.isJackpot) {
      const sym = card.cells[0];
      if (sym.type === 'souls') {
        totalSoulsAwarded = sym.value * 3;
        this.addSouls(totalSoulsAwarded);
      } else if (sym.type === 'shard') {
        this.addHumanityShards(2);
      } else if (sym.type === 'joker') {
        this.acquireJoker({ id: 'joker_wheel', name: 'Arcano: La Rueda del Destino', rarity: 'Épica', desc: 'Arcano: 20% prob potenciar almas', icon: '🎡', edition: 'polychrome' });
      } else {
        totalSoulsAwarded = 45;
        this.addSouls(45);
      }
    } else {
      for (const c of card.cells) {
        if (c.type === 'souls') {
          totalSoulsAwarded += c.value;
          this.addSouls(c.value);
        } else if (c.type === 'shard') {
          this.addHumanityShards(c.value);
        } else {
          totalSoulsAwarded += 10;
          this.addSouls(10);
        }
      }
    }

    this.updateHUD();
    return totalSoulsAwarded;
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
      const highTier = available.filter(b => b.isEvolution || b.isWeapon || b.isJoker || b.isScratchCard || b.rarity === 'Épica' || b.rarity === 'Rara');
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
    } else if (boon.isScratchCard) {
      if (window.game && window.game.openScratchCardModal) {
        window.game.openScratchCardModal(this.generateScratchCard());
      }
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

    // Reset base upgrades and current souls (keep humanity shards & prestige ashes)
    this.souls = 0;
    this.upgrades.vitality = 0;
    this.upgrades.healthRegen = 0;
    this.upgrades.spikeResist = 0;
    this.upgrades.agility = 0;
    this.upgrades.jumpPower = 0;
    this.upgrades.bladeMastery = 0;
    this.upgrades.soulGreed = 0;
    this.upgrades.altarOfTorment = 0;

    this.resetRunBoons();
    this.save();
    this.updateHUD();
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
    if (balatroEl && this.lastBalatroScore) {
      balatroEl.classList.remove('hidden');
      const xMultText = this.lastBalatroScore.xMult > 1.05 ? ` <span class="xmult-val">(×${this.lastBalatroScore.xMult.toFixed(1)} 🟣)</span>` : '';
      balatroEl.innerHTML = `<span class="chips-val" title="Esencia Base">${this.lastBalatroScore.chips} 🔵</span> × <span class="mult-val" title="+Fervor">+${this.lastBalatroScore.mult} 🔴</span>${xMultText} = <b style="color:#f4d06f;" title="Almas Ganadas">+${this.lastBalatroScore.totalSouls} 🔮</b>`;
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

    // Boons icons
    const boonsContainer = document.getElementById('hud-active-boons');
    if (boonsContainer) {
      boonsContainer.innerHTML = '';
      for (const b of this.activeBoons) {
        const badge = document.createElement('span');
        badge.className = 'boon-badge';
        badge.title = `${b.name}: ${b.desc}`;
        badge.textContent = b.icon;
        boonsContainer.appendChild(badge);
      }
    }
  }
}

window.progression = new ProgressionManager();
