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
      vitality: 0,        // +10 Max HP per level & 0.08 HP/s regen
      spikeResist: 0,     // Level 1 allows surviving spikes! Reduces spike damage further each lvl
      agility: 0,         // Movement & air control speed (+3.5% per lvl)
      jumpPower: 0,       // Jump force (+2% per lvl)
      bladeMastery: 0,    // Sword damage (+2.5 dmg per lvl)
      soulGreed: 0,       // +12% souls gained from height & kills per lvl
      altarOfTorment: 0,  // Passive souls per second (+0.4/s per lvl base)
      doubleJump: 0       // Unlocks mid-air double jump (costs 2 Humanity Shards)
    };

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
      }
    ];

    this.upgradeDefinitions = {
      vitality: {
        name: 'Vitalidad de Kael',
        desc: 'Incrementa la vida máxima en +10 HP y regenera salud gradualmente (+0.08 HP/s).',
        currency: 'souls',
        baseCost: 50,
        costMult: 1.45,
        maxLvl: 10,
        icon: '❤️'
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
        desc: '+12% de almas obtenidas por altura y por cada enemigo derrotado.',
        currency: 'souls',
        baseCost: 75,
        costMult: 1.5,
        maxLvl: 8,
        icon: '💰'
      },
      altarOfTorment: {
        name: 'Altar del Tormento',
        desc: 'Genera almas pasivas continuamente (+0.4 almas/segundo por nivel base).',
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

  loadSave() {
    try {
      const data = JSON.parse(localStorage.getItem(this.SAVE_KEY));
      if (data) {
        this.souls = data.souls || 0;
        this.humanityShards = data.humanityShards || 0;
        this.penitenceAshes = data.penitenceAshes || 0;
        this.totalSoulsEver = data.totalSoulsEver || 0;
        this.maxHeightClimbed = data.maxHeightClimbed || 0;
        if (data.upgrades) {
          if (data.upgrades.chargeSpeed !== undefined && data.upgrades.agility === undefined) {
            data.upgrades.agility = data.upgrades.chargeSpeed;
          }
          for (const k in this.upgrades) {
            if (data.upgrades[k] !== undefined) {
              this.upgrades[k] = data.upgrades[k];
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not load save data', e);
    }
  }

  save() {
    try {
      const data = {
        souls: Math.floor(this.souls),
        humanityShards: this.humanityShards,
        penitenceAshes: this.penitenceAshes,
        totalSoulsEver: Math.floor(this.totalSoulsEver),
        maxHeightClimbed: Math.floor(this.maxHeightClimbed),
        upgrades: this.upgrades
      };
      localStorage.setItem(this.SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not save data', e);
    }
  }

  // ─── ECONOMY & GAINS ───
  getPrestigeMultiplier() {
    // Each ash of penitence gives +5% permanent multiplier to all souls and combat stats
    return 1.0 + (this.penitenceAshes * 0.05);
  }

  getPassiveAPS() {
    const lvl = this.upgrades.altarOfTorment;
    if (lvl <= 0) return 0;
    const baseAPS = lvl * 0.4;
    const greedMult = 1.0 + (this.upgrades.soulGreed * 0.12);
    const prestigeMult = this.getPrestigeMultiplier();
    return baseAPS * greedMult * prestigeMult;
  }

  addSouls(amount) {
    const greedMult = 1.0 + (this.upgrades.soulGreed * 0.12);
    const boonMult = this.hasBoon('goldenTouch') ? 2.0 : 1.0;
    const prestigeMult = this.getPrestigeMultiplier();
    const finalAmount = amount * greedMult * boonMult * prestigeMult;

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
    const prestige = this.getPrestigeMultiplier();

    return {
      maxHp: Math.round((100 + (this.upgrades.vitality * 10)) * prestige),
      hpRegen: this.upgrades.vitality * 0.08,
      hasSpikeResist: this.upgrades.spikeResist > 0,
      spikeDamageRatio: Math.max(0.35, 0.70 - (this.upgrades.spikeResist * 0.07)),
      moveSpeedMult: 1.0 + (this.upgrades.agility * 0.035),
      jumpForceMult: 1.0 + (this.upgrades.jumpPower * 0.02),
      weaponName: 'Daga Básica',
      weaponType: 'dagger',
      daggerDamage: Math.round((16 + (this.upgrades.bladeMastery * 2.5)) * prestige),
      swordDamage: Math.round((16 + (this.upgrades.bladeMastery * 2.5)) * prestige),
      hasDoubleJump: this.upgrades.doubleJump > 0,
      magnetRadius: this.hasBoon('soulMagnet') ? 260 : 70
    };
  }

  // ─── ROGUE-LITE BOONS & PASSIVE WEAPONS PER RUN ───
  resetRunBoons() {
    this.activeBoons = [];
    if (window.game && window.game.resetPassiveWeapons) {
      window.game.resetPassiveWeapons();
    }
    this.updateHUD();
  }

  getRandomBoons(count = 3, isRelic = false) {
    const pwm = window.game ? window.game.passiveWeaponsManager : null;
    let available = this.boonPool.filter(b => {
      if (b.isWeapon) {
        if (!pwm) return true;
        const lvl = pwm.getLevel(b.weaponType);
        if (lvl >= 5) return false; // Max level reached
        // If not owned, allow if player has fewer than 4 weapons
        if (lvl === 0 && pwm.weapons.size >= 4) return false;
        return true;
      } else {
        // Standard boon: once per run
        return !this.activeBoons.some(a => a.id === b.id);
      }
    });

    if (isRelic) {
      // Prioritize Weapons and Rare/Epic Boons for Boss Relics!
      const highTier = available.filter(b => b.isWeapon || b.rarity === 'Épica' || b.rarity === 'Rara');
      if (highTier.length >= count) {
        available = highTier;
      }
    }

    // Shuffle
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
    // 1 ash per 300 total souls ever earned
    const potentialTotalAshes = Math.floor(Math.sqrt(this.totalSoulsEver / 40));
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
      localStorage.removeItem(this.SAVE_KEY);
      localStorage.removeItem('infernal_rise_deaths');
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
