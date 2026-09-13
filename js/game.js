/**
 * Infernal Rise — Main Game Coordinator & Game Loop
 * Integrates rendering, input handling, camera tracking, scenes, audio, and UI overlays.
 */

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    // Virtual resolution (dynamically adjusted to screen aspect ratio)
    this.vWidth = 960;
    this.vHeight = 540;

    // Game state
    this._state = 'MENU'; // MENU, INTRO, PLAYING, DIALOGUE, PAUSED, DEAD, VICTORY
    this.gameMode = 'STORY'; // STORY, INFERNAL

    // Camera
    this.camX = 0;
    this.camY = 0;

    // Death counter (persistent in localStorage)
    this.deathCount = Number.parseInt(localStorage.getItem('infernal_rise_deaths') || '0', 10);
    this.updateDeathCounterUI();

    // Input state
    this.input = {
      left: false,
      right: false,
      up: false,
      down: false,
      jump: false,
      attack: false,
      interact: false
    };

    // Entities
    this.player = null;
    this.enemies = [];
    this.bats = [];
    this.enemyProjectiles = [];
    this.boss = null;
    this.bossProjectiles = [];
    this.ladders = [];
    this.movingPlatforms = [];
    this.crumblingPlatforms = [];
    this.level = null;

    // Incremental & Roguelite Collections
    this.soulOrbs = [];
    this.xpGems = [];
    this.healthOrbs = [];
    this.chests = [];
    this.urns = [];
    this.flameWaves = [];
    this.activeChest = null;
    this.activeScratchCard = null;
    this.pendingLevelUps = 0;
    this.lastReportedAltitude = 0;

    // Vampire Survivors style Passive Auto-Attacking Weapons
    this.passiveWeaponsManager = new window.PassiveWeaponsManager(this);

    // Meteors timer
    this.meteorTimer = 0;

    // Ambient atmospheric particles (biome-specific)
    this.ambientParticles = [];
    this.ambientEmbers = this.ambientParticles;
    this.initAmbientParticles('abyss');

    // Dialogue trigger flag
    this.hasTriggeredBossDialogue = false;

    // UI elements
    this.ui = {
      hud: document.getElementById('hud'),
      mainMenu: document.getElementById('main-menu'),
      menuViewHome: document.getElementById('menu-view-home'),
      menuViewCodex: document.getElementById('menu-view-codex'),
      menuViewSettings: document.getElementById('menu-view-settings'),
      btnOpenCodex: document.getElementById('btn-open-codex'),
      btnOpenSettings: document.getElementById('btn-open-settings'),
      btnBackCodex: document.getElementById('btn-back-codex'),
      btnBackSettings: document.getElementById('btn-back-settings'),
      menuStatSouls: document.getElementById('menu-stat-souls'),
      menuStatShards: document.getElementById('menu-stat-shards'),
      menuStatAshes: document.getElementById('menu-stat-ashes'),
      menuStatDeaths: document.getElementById('menu-stat-deaths'),
      settingsStatSouls: document.getElementById('settings-stat-souls'),
      settingsStatShards: document.getElementById('settings-stat-shards'),
      settingsStatAshes: document.getElementById('settings-stat-ashes'),
      settingsStatDeaths: document.getElementById('settings-stat-deaths'),
      introScreen: document.getElementById('intro-screen'),
      introTypewriter: document.getElementById('intro-typewriter'),
      pauseScreen: document.getElementById('pause-screen'),
      deathScreen: document.getElementById('death-screen'),
      deathMessage: document.getElementById('death-message'),
      victoryScreen: document.getElementById('victory-screen'),
      victoryMessage: document.getElementById('victory-message'),
      bossHud: document.getElementById('boss-hud'),
      bossName: document.getElementById('boss-name'),
      bossHealthFill: document.getElementById('boss-health-fill'),
      playerHealthWrap: document.getElementById('player-health-wrap'),
      playerHealthFill: document.getElementById('player-health-fill'),
      interactionBadge: document.getElementById('interaction-badge'),
      soundToggle: document.getElementById('btn-sound-toggle'),

      // Sanctuary & Boon Modals
      sanctuaryModal: document.getElementById('sanctuary-modal'),
      boonModal: document.getElementById('boon-modal'),
      btnOpenSanctuary: document.getElementById('btn-open-sanctuary'),
      btnCloseSanctuary: document.getElementById('btn-close-sanctuary'),
      tabBtnUpgrades: document.getElementById('tab-btn-upgrades'),
      tabBtnPrestige: document.getElementById('tab-btn-prestige'),
      tabPanelUpgrades: document.getElementById('sanctuary-tab-upgrades'),
      tabPanelPrestige: document.getElementById('sanctuary-tab-prestige'),
      upgradesGrid: document.getElementById('upgrades-grid'),
      btnPerformPrestige: document.getElementById('btn-perform-prestige'),
      boonCardsContainer: document.getElementById('boon-cards-container'),
      btnBoonReroll: document.getElementById('btn-boon-reroll'),

      // Vampire Survivors Level-Up & Reroll
      levelUpModal: document.getElementById('level-up-modal'),
      modalRunLevel: document.getElementById('modal-run-level'),
      levelupCardsContainer: document.getElementById('levelup-cards-container'),
      btnLevelupReroll: document.getElementById('btn-levelup-reroll'),

      // Scritchy Scratchy Modal
      scratchCardModal: document.getElementById('scratch-card-modal'),
      scratchGrid: document.getElementById('scratch-grid'),
      scratchResultMsg: document.getElementById('scratch-result-msg'),
      btnClaimScratch: document.getElementById('btn-claim-scratch'),
      btnScratchAll: document.getElementById('btn-scratch-all'),
      btnCloseScratch: document.getElementById('btn-close-scratch'),

      // Ruleta de Armas (Slot Machine) Modal
      slotMachineModal: document.getElementById('slot-machine-modal'),
      btnSpinSlot: document.getElementById('btn-spin-slot'),
      btnCloseSlot: document.getElementById('btn-close-slot'),
      btnSlotStartRun: document.getElementById('btn-slot-start-run'),
      slotLeverHitbox: document.getElementById('slot-lever-hitbox'),
      slotStatusBox: document.getElementById('slot-status-box'),
      slotPlayerSouls: document.getElementById('slot-player-souls'),
      slotCurrentWeapons: document.getElementById('slot-current-weapons'),

      // Mobile Touch Elements
      btnTouchPause: document.getElementById('btn-touch-pause'),
      virtualControls: document.getElementById('virtual-controls'),
      btnTouchInteract: document.getElementById('btn-touch-interact')
    };

    this.lastTime = 0;
  }

  get state() {
    return this._state;
  }

  set state(val) {
    this._state = val;
    this.updateVirtualControlsVisibility();
  }

  updateVirtualControlsVisibility() {
    const vc = this.ui && this.ui.virtualControls ? this.ui.virtualControls : (typeof document !== 'undefined' ? document.getElementById('virtual-controls') : null);
    if (!vc) return;
    const isPlaying = (this._state === 'PLAYING' || this._state === 'DIALOGUE');
    if (typeof vc.setAttribute === 'function') {
      vc.setAttribute('data-visible', isPlaying ? 'true' : 'false');
    }
    if (vc.classList) {
      if (isPlaying) {
        vc.classList.remove('hidden');
      } else {
        vc.classList.add('hidden');
      }
    }
  }

  resizeCanvas() {
    const displayW = window.innerWidth;
    const displayH = window.innerHeight;
    const aspect = displayW / displayH;

    // Strict 1:1 pixel aspect ratio calculation to prevent any distortion or stretching
    if (aspect >= (16 / 9)) {
      // Very wide screens or standard widescreen (16:9, 19.5:9, 21:9): base height 540
      this.vHeight = 540;
      this.vWidth = Math.round(540 * aspect);
    } else if (aspect >= 1) {
      // Squarish landscape or 4:3 tablet: base width 960
      this.vWidth = 960;
      this.vHeight = Math.round(960 / aspect);
    } else {
      // Portrait (smartphones held vertically)
      this.vWidth = 540;
      this.vHeight = Math.round(540 / aspect);
    }

    this.canvas.width = this.vWidth;
    this.canvas.height = this.vHeight;
    this.ctx.imageSmoothingEnabled = false;

    // Reposition ambient particles to fit new canvas bounds
    if (this.ambientParticles && this.ambientParticles.length > 0) {
      for (const p of this.ambientParticles) {
        if (p.x > this.vWidth) p.x = Math.random() * this.vWidth;
        if (p.y > this.vHeight) p.y = Math.random() * this.vHeight;
      }
    }

    if (this._state === 'PLAYING' || this._state === 'SANCTUARY' || this._state === 'SLOT_MACHINE' || this._state === 'PAUSED') {
      this.render();
    }
  }

  async init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.resizeCanvas(), 100);
    });

    // Detect touch capability and mark body
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      document.body.classList.add('touch-active');
    }

    this.updateVirtualControlsVisibility();
    this.bindInputs();
    this.bindUI();

    // Load all graphic assets
    await window.spriteManager.loadAll();

    // Initialize progression HUD
    if (window.progression) window.progression.updateHUD();

    // Start in main menu
    this.showMainMenu();

    // Game Loop
    requestAnimationFrame((ts) => this.loop(ts));
  }

  // ─── INPUT HANDLING ───
  bindInputs() {
    window.addEventListener('keydown', (e) => {
      if (window.soundEngine) window.soundEngine.resume();

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = true;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.input.up = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.input.down = true;
      if (e.code === 'Space' || e.code === 'Enter') {
        if (this.state === 'VICTORY') {
          const btn = document.getElementById('btn-victory-next');
          if (btn) btn.click();
          return;
        }
      }
      if (e.code === 'Space') {
        this.input.jump = true;
        if (this.player) this.player.jumpBufferTimer = this.player.jumpBufferMax;
        // Space advances dialogues or intro screens
        if (this.state === 'INTRO') this.advanceIntroScreen();
        if (this.state === 'DIALOGUE') window.dialogueManager.advance();
      }
      if (e.code === 'KeyZ' || e.code === 'KeyJ') this.input.attack = true;
      if (e.code === 'KeyE') {
        this.input.interact = true;
        if (this.state === 'DIALOGUE') {
          window.dialogueManager.advance();
        } else if (this.activeChest) {
          this.openBoonChest(this.activeChest);
        } else if (this.nearSlotMachine) {
          this.openSlotMachineModal();
        } else if (this.nearSanctuary) {
          this.openSanctuaryModal();
        } else {
          this.checkNpcInteraction();
        }
      }
      if (e.code === 'KeyP') {
        if (this.level && (this.level.id === 'prologue' || this.nearSanctuary)) {
          this.toggleSanctuaryModal();
        }
      }
      if (e.code === 'Escape') {
        if (this.state === 'SANCTUARY') {
          this.closeSanctuaryModal();
        } else if (this.state === 'SLOT_MACHINE') {
          this.closeSlotMachineModal();
        } else if (this.state === 'SCRATCH_CARD') {
          this.closeScratchCardModal();
        } else if (this.state === 'BOON_SELECT' || this.state === 'LEVEL_UP') {
          // Keep modal active until choice is selected
        } else {
          this.togglePause();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = false;
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.input.up = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.input.down = false;
      if (e.code === 'Space') this.input.jump = false;
      if (e.code === 'KeyZ' || e.code === 'KeyJ') this.input.attack = false;
      if (e.code === 'KeyE') this.input.interact = false;
    });

    // Canvas click attacks in combat mode
    this.canvas.addEventListener('mousedown', () => {
      if (this.state === 'PLAYING') this.input.attack = true;
    });
    this.canvas.addEventListener('mouseup', () => {
      this.input.attack = false;
    });

    // Touch & Pointer Controls for Mobile & Tablets
    const addTouch = (id, key) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const handlePress = (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (window.soundEngine) window.soundEngine.resume();
        this.input[key] = true;
        btn.classList.add('pressed');

        if (key === 'jump' && this.player) {
          this.player.jumpBufferTimer = this.player.jumpBufferMax;
          if (this.state === 'DIALOGUE') {
            window.dialogueManager.advance();
          }
        }

        if (key === 'interact') {
          if (this.state === 'DIALOGUE') {
            window.dialogueManager.advance();
          } else if (this.activeChest) {
            this.openBoonChest(this.activeChest);
          } else if (this.nearSlotMachine) {
            this.openSlotMachineModal();
          } else if (this.nearSanctuary) {
            this.openSanctuaryModal();
          } else {
            this.checkNpcInteraction();
          }
        }
      };

      const handleRelease = (e) => {
        if (e && e.cancelable) e.preventDefault();
        this.input[key] = false;
        btn.classList.remove('pressed');
      };

      btn.addEventListener('touchstart', handlePress, { passive: false });
      btn.addEventListener('touchend', handleRelease, { passive: false });
      btn.addEventListener('touchcancel', handleRelease, { passive: false });
      btn.addEventListener('mousedown', handlePress);
      btn.addEventListener('mouseup', handleRelease);
      btn.addEventListener('mouseleave', handleRelease);
    };

    addTouch('btn-touch-left', 'left');
    addTouch('btn-touch-right', 'right');
    addTouch('btn-touch-up', 'up');
    addTouch('btn-touch-down', 'down');
    addTouch('btn-touch-jump', 'jump');
    addTouch('btn-touch-attack', 'attack');
    addTouch('btn-touch-interact', 'interact');

    // Mobile Pause Button in HUD
    const pauseBtn = document.getElementById('btn-touch-pause');
    if (pauseBtn) {
      const handlePause = (e) => {
        if (e && e.cancelable) e.preventDefault();
        if (window.soundEngine) window.soundEngine.playUiClick();
        if (this.state === 'SANCTUARY') {
          this.closeSanctuaryModal();
        } else if (this.state === 'SLOT_MACHINE') {
          this.closeSlotMachineModal();
        } else if (this.state === 'SCRATCH_CARD') {
          this.closeScratchCardModal();
        } else if (this.state === 'BOON_SELECT' || this.state === 'LEVEL_UP') {
          // Keep active until choice
        } else {
          this.togglePause();
        }
      };
      pauseBtn.addEventListener('touchstart', handlePause, { passive: false });
      pauseBtn.addEventListener('click', handlePause);
    }
  }

  // ─── UI BUTTONS ───
  bindUI() {
    // Sound button hover & click sounds
    document.querySelectorAll('.btn-infernal, .hud-sanctuary-btn, .sanctuary-tab-btn').forEach(b => {
      b.addEventListener('mouseenter', () => {
        if (window.soundEngine) window.soundEngine.playUiHover();
      });
      b.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.playUiClick();
      });
    });

    // Sanctuary Modals
    if (this.ui.btnOpenSanctuary) {
      this.ui.btnOpenSanctuary.addEventListener('click', () => this.openSanctuaryModal());
    }
    if (this.ui.btnCloseSanctuary) {
      this.ui.btnCloseSanctuary.addEventListener('click', () => this.closeSanctuaryModal());
    }

    // Sanctuary Tabs
    if (this.ui.tabBtnUpgrades) {
      this.ui.tabBtnUpgrades.addEventListener('click', () => {
        this.ui.tabBtnUpgrades.classList.add('active');
        this.ui.tabBtnPrestige.classList.remove('active');
        this.ui.tabPanelUpgrades.classList.remove('hidden');
        this.ui.tabPanelPrestige.classList.add('hidden');
      });
    }
    if (this.ui.tabBtnPrestige) {
      this.ui.tabBtnPrestige.addEventListener('click', () => {
        this.ui.tabBtnPrestige.classList.add('active');
        this.ui.tabBtnUpgrades.classList.remove('active');
        this.ui.tabPanelPrestige.classList.remove('hidden');
        this.ui.tabPanelUpgrades.classList.add('hidden');
        this.renderSanctuaryPrestige();
      });
    }

    if (this.ui.btnPerformPrestige) {
      this.ui.btnPerformPrestige.addEventListener('click', () => {
        if (window.progression && window.progression.canPrestige()) {
          window.progression.performPrestige();
          this.renderSanctuaryWallet();
          this.renderSanctuaryPrestige();
          this.renderSanctuaryUpgrades();
        }
      });
    }

    // Start Game
    const btnStart = document.getElementById('btn-start');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        this.startStoryMode();
      });
    }

    // Infernal Mode
    const btnInfernal = document.getElementById('btn-infernal-mode');
    if (btnInfernal) {
      btnInfernal.addEventListener('click', () => {
        this.startInfernalMode();
      });
    }

    // Main Menu Subview Navigation (Códice & Ajustes)
    if (this.ui.btnOpenCodex) {
      this.ui.btnOpenCodex.addEventListener('click', () => this.switchMenuSubView('codex'));
    }
    if (this.ui.btnBackCodex) {
      this.ui.btnBackCodex.addEventListener('click', () => this.switchMenuSubView('home'));
    }
    if (this.ui.btnOpenSettings) {
      this.ui.btnOpenSettings.addEventListener('click', () => this.switchMenuSubView('settings'));
    }
    if (this.ui.btnBackSettings) {
      this.ui.btnBackSettings.addEventListener('click', () => this.switchMenuSubView('home'));
    }

    // Sound Toggle
    if (this.ui.soundToggle) {
      this.ui.soundToggle.addEventListener('click', () => {
        const enabled = window.soundEngine.toggleSound();
        this.ui.soundToggle.textContent = `Sonido: ${enabled ? 'ON' : 'OFF'}`;
      });
    }

    // Pause Screen Buttons
    document.getElementById('btn-resume').addEventListener('click', () => this.togglePause());
    document.getElementById('btn-restart').addEventListener('click', () => this.restartLevel());
    document.getElementById('btn-quit').addEventListener('click', () => this.showMainMenu());

    // Reset Progress Buttons & Confirmation Modal
    const btnResetSave = document.getElementById('btn-reset-save');
    const btnPauseResetSave = document.getElementById('btn-pause-reset-save');
    const resetModal = document.getElementById('reset-confirm-modal');
    const btnConfirmReset = document.getElementById('btn-confirm-reset');
    const btnCancelReset = document.getElementById('btn-cancel-reset');

    const openResetModal = () => {
      if (resetModal) resetModal.classList.remove('hidden');
    };
    const closeResetModal = () => {
      if (resetModal) resetModal.classList.add('hidden');
    };

    if (btnResetSave) btnResetSave.addEventListener('click', openResetModal);
    if (btnPauseResetSave) btnPauseResetSave.addEventListener('click', openResetModal);
    if (btnCancelReset) btnCancelReset.addEventListener('click', closeResetModal);

    if (btnConfirmReset) {
      btnConfirmReset.addEventListener('click', () => {
        closeResetModal();
        this.resetAllProgress();
      });
    }

    // Death Screen Buttons
    document.getElementById('btn-respawn').addEventListener('click', () => this.respawnPlayer());
    document.getElementById('btn-death-menu').addEventListener('click', () => this.showMainMenu());

    // Victory Next Button
    document.getElementById('btn-victory-next').addEventListener('click', () => {
      this.ui.victoryScreen.classList.add('hidden');
      if (this.boss && this.boss.nextLevel) {
        this.loadLevel(this.boss.nextLevel);
        this.state = 'PLAYING';
      } else {
        // Complete victory
        this.showMainMenu();
      }
    });

    // Intro Screen Click
    this.ui.introScreen.addEventListener('click', () => this.advanceIntroScreen());

    // Vampire Survivors Level-Up Reroll Button
    if (this.ui.btnLevelupReroll) {
      this.ui.btnLevelupReroll.addEventListener('click', () => {
        if (window.progression && window.progression.performReroll()) {
          const fresh = window.progression.getRandomBoons(3, false);
          this.renderLevelUpCards(fresh);
          this.ui.btnLevelupReroll.disabled = !window.progression.canReroll();
        }
      });
    }

    // Boon Modal Reroll Button
    if (this.ui.btnBoonReroll) {
      this.ui.btnBoonReroll.addEventListener('click', () => {
        if (window.progression && window.progression.performReroll()) {
          const fresh = window.progression.getRandomBoons(3, !!this._isCurrentBoonRelic);
          this.renderBoonCards(fresh);
          this.ui.btnBoonReroll.disabled = !window.progression.canReroll();
        }
      });
    }

    // Scritchy Scratchy Modal Actions
    if (this.ui.btnCloseScratch) {
      this.ui.btnCloseScratch.addEventListener('click', () => this.closeScratchCardModal());
    }

    // Ruleta de Armas (Slot Machine) Modal Actions
    if (this.ui.btnCloseSlot) {
      this.ui.btnCloseSlot.addEventListener('click', () => this.closeSlotMachineModal());
    }
    if (this.ui.btnSlotStartRun) {
      this.ui.btnSlotStartRun.addEventListener('click', () => this.closeSlotMachineModal());
    }
    if (this.ui.btnSpinSlot) {
      this.ui.btnSpinSlot.addEventListener('click', () => this.spinSlotMachine());
    }
    if (this.ui.slotLeverHitbox) {
      this.ui.slotLeverHitbox.addEventListener('click', () => this.spinSlotMachine());
    }
  }

  // ─── STATE / SCREEN TRANSITIONS ───
  switchMenuSubView(viewName) {
    if (this.ui.menuViewHome) this.ui.menuViewHome.classList.add('hidden');
    if (this.ui.menuViewCodex) this.ui.menuViewCodex.classList.add('hidden');
    if (this.ui.menuViewSettings) this.ui.menuViewSettings.classList.add('hidden');

    if (viewName === 'codex' && this.ui.menuViewCodex) {
      this.ui.menuViewCodex.classList.remove('hidden');
    } else if (viewName === 'settings' && this.ui.menuViewSettings) {
      this.ui.menuViewSettings.classList.remove('hidden');
      this.updateMainMenuStats();
    } else if (this.ui.menuViewHome) {
      this.ui.menuViewHome.classList.remove('hidden');
      this.updateMainMenuStats();
    }
  }

  updateMainMenuStats() {
    const souls = window.progression ? window.progression.souls : 0;
    const shards = window.progression ? window.progression.humanityShards : 0;
    const ashes = window.progression ? window.progression.penitenceAshes : 0;
    const deaths = this.deathCount || 0;

    if (this.ui.menuStatSouls) this.ui.menuStatSouls.textContent = souls;
    if (this.ui.menuStatShards) this.ui.menuStatShards.textContent = shards;
    if (this.ui.menuStatAshes) this.ui.menuStatAshes.textContent = ashes;
    if (this.ui.menuStatDeaths) this.ui.menuStatDeaths.textContent = deaths;

    if (this.ui.settingsStatSouls) this.ui.settingsStatSouls.textContent = `${souls} 🔮`;
    if (this.ui.settingsStatShards) this.ui.settingsStatShards.textContent = `${shards} 💠`;
    if (this.ui.settingsStatAshes) this.ui.settingsStatAshes.textContent = `${ashes} 🔥`;
    if (this.ui.settingsStatDeaths) this.ui.settingsStatDeaths.textContent = `${deaths} 💀`;
  }

  showMainMenu() {
    this.state = 'MENU';
    this.hideAllScreens();
    this.ui.mainMenu.classList.remove('hidden');
    this.switchMenuSubView('home');
    this.updateMainMenuStats();
    if (this.ui.hud) this.ui.hud.classList.add('hidden');
    this.ui.bossHud.style.display = 'none';
    if (this.ui.playerHealthWrap) this.ui.playerHealthWrap.style.display = 'none';
    this.ui.interactionBadge.style.display = 'none';
    this.xpGems = [];
    this.pendingLevelUps = 0;
    if (this.passiveWeaponsManager) {
      this.passiveWeaponsManager.reset();
    }
    if (window.progression) {
      window.progression.resetRunBoons();
    }
    if (window.soundEngine) window.soundEngine.playMusic('menu');
  }

  startStoryMode() {
    this.gameMode = 'STORY';
    this.showIntroLoreScreen();
  }

  startInfernalMode() {
    this.gameMode = 'INFERNAL';
    this.loadLevel('infernal');
    this.hideAllScreens();
    this.state = 'PLAYING';
    if (this.ui.hud) this.ui.hud.classList.remove('hidden');
    if (window.soundEngine) window.soundEngine.playMusic('infernal');
  }

  showIntroLoreScreen() {
    this.state = 'INTRO';
    this.hideAllScreens();
    this.ui.introScreen.classList.remove('hidden');

    const introStory = `Eres Kael, un soldado designado a buscar y darle caza a un traidor del rey. Junto con tus compañeros, creen haber encontrado el escondite de este traidor...

Sin embargo, Kael no se esperaba que esa noche iba a ser el inicio de una pesadilla. Una masacre despiadada de inocentes por la que fue condenado a muerte y arrojado a los abismos del Inframundo.

Ahora, ante la colosal Torre Infernal, deberás escalar y purgar tus culpas con sangre para escapar de la condenación eterna.`;

    this.ui.introTypewriter.textContent = '';
    let idx = 0;
    if (this.introTimer) clearInterval(this.introTimer);

    this.introTimer = setInterval(() => {
      if (idx < introStory.length) {
        this.ui.introTypewriter.textContent += introStory[idx];
        if (idx % 2 === 0 && window.soundEngine) window.soundEngine.playDialogueBlip();
        idx++;
      } else {
        clearInterval(this.introTimer);
        this.introTimer = null;
      }
    }, 28);
  }

  advanceIntroScreen() {
    if (this.introTimer) {
      clearInterval(this.introTimer);
      this.introTimer = null;
      this.ui.introTypewriter.textContent = `Eres Kael, un soldado designado a buscar y darle caza a un traidor del rey. Junto con tus compañeros, creen haber encontrado el escondite de este traidor...

Sin embargo, Kael no se esperaba que esa noche iba a ser el inicio de una pesadilla. Una masacre despiadada de inocentes por la que fue condenado a muerte y arrojado a los abismos del Inframundo.

Ahora, ante la colosal Torre Infernal, deberás escalar y purgar tus culpas con sangre para escapar de la condenación eterna.`;
      return;
    }

    // Advance to Prologue
    this.loadLevel('prologue');
    this.hideAllScreens();
    this.state = 'PLAYING';
  }

  spawnBossProjectile(projData) {
    this.bossProjectiles.push(projData instanceof BossProjectile ? projData : new BossProjectile(projData));
  }

  spawnEnemyProjectile(proj) {
    this.enemyProjectiles.push(proj instanceof EnemyProjectile ? proj : new EnemyProjectile(proj));
  }

  spawnHealthOrb(x, y, value = 15) {
    this.healthOrbs.push(new HealthOrb(x, y, value));
  }

  loadLevel(levelId) {
    if (this.ui.victoryScreen) this.ui.victoryScreen.classList.add('hidden');
    if (this.ui.hud) this.ui.hud.classList.remove('hidden');
    this.state = 'PLAYING';
    this.level = window.levelManager.loadLevel(levelId);
    this.player = new Player(this.level.spawn.x, this.level.spawn.y);
    if (this.level.width <= this.vWidth) {
      this.camX = (this.level.width - this.vWidth) / 2;
    } else {
      this.camX = Math.max(0, Math.min(this.level.width - this.vWidth, this.player.x - this.vWidth / 2));
    }
    if (this.level.height <= this.vHeight) {
      this.camY = (this.level.height - this.vHeight) / 2;
    } else {
      this.camY = Math.max(0, Math.min(this.level.height - this.vHeight, this.player.y - this.vHeight / 2));
    }

    // Reset projectiles, ladders, moving & crumbling platforms
    this.bossProjectiles = [];
    this.enemyProjectiles = [];
    this.ladders = (this.level.ladders || []).map(lad => (lad instanceof Ladder ? lad : new Ladder(lad)));
    this.level.ladders = this.ladders;

    this.movingPlatforms = (this.level.movingPlatforms || []).map(mp => (mp instanceof MovingPlatform ? mp : new MovingPlatform(mp)));
    this.crumblingPlatforms = (this.level.crumblingPlatforms || []).map(cp => (cp instanceof CrumblingPlatform ? cp : new CrumblingPlatform(cp)));

    // Ensure moving platforms and crumbling platforms are registered in level.platforms for player collision resolution
    for (const mp of this.movingPlatforms) {
      if (!this.level.platforms.includes(mp)) this.level.platforms.push(mp);
    }
    for (const cp of this.crumblingPlatforms) {
      if (!this.level.platforms.includes(cp)) this.level.platforms.push(cp);
    }

    // Reset collectibles and interactables
    this.soulOrbs = [];
    this.xpGems = [];
    this.healthOrbs = [];
    this.flameWaves = [];
    this.activeChest = null;
    this.lastReportedAltitude = 0;
    this.levelGraceTimer = 4.0;
    this.chests = (this.level.chests || []).map(c => new BoonChest(c));
    this.urns = (this.level.urns || []).map(u => new BreakableUrn(u));

    if (window.progression) window.progression.updateHUD();
    if (this.passiveWeaponsManager) this.passiveWeaponsManager.updateHUD();
    const defeatBanner = document.getElementById('boss-defeat-banner');
    if (defeatBanner) {
      defeatBanner.classList.add('hidden');
      defeatBanner.classList.remove('fade-out');
      defeatBanner.style.display = 'none';
    }
    if (this.defeatBannerTimeout) {
      clearTimeout(this.defeatBannerTimeout);
      this.defeatBannerTimeout = null;
    }
    if (this.defeatBannerFadeTimeout) {
      clearTimeout(this.defeatBannerFadeTimeout);
      this.defeatBannerFadeTimeout = null;
    }

    // Reset boss & enemies
    this.boss = null;
    this.hasTriggeredBossDialogue = false;
    if (this.level.boss) {
      this.boss = new Boss(this.level.boss);
      this.ui.bossHud.style.display = 'flex';
      this.ui.bossName.textContent = this.boss.name;
      this.ui.bossHealthFill.style.width = '100%';
    } else {
      this.ui.bossHud.style.display = 'none';
    }

    if (this.ui.playerHealthWrap) {
      this.ui.playerHealthWrap.style.display = 'none';
    }
    if (this.ui.playerHealthFill) {
      const pct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
      this.ui.playerHealthFill.style.width = `${pct}%`;
    }

    // Spawn enemies & bats
    this.enemies = [];
    this.bats = [];
    if (this.level.enemies) {
      for (const e of this.level.enemies) {
        if (e.type === 'skeleton' || e.type === 'skeleton_mage') {
          this.enemies.push(new SkeletonEnemy(e));
        } else if (e.type === 'bat' || e.type === 'gargoyle') {
          this.bats.push(new AbyssalBat(e));
        }
      }
    }
    if (this.level.bats) {
      for (const b of this.level.bats) {
        this.bats.push(new AbyssalBat(b));
      }
    }

    // Music & Rain
    if (window.soundEngine) {
      window.soundEngine.playMusic(this.level.musicTrack);
      window.soundEngine.setRainVolume(this.level.ambientRain ? 1 : 0);
    }

    // Biome-specific ambient particles
    this.initAmbientParticles(this.level.biome || 'abyss');
  }

  initAmbientParticles(biome) {
    this.ambientParticles = [];
    let count = 45;
    let type = 'ember';

    if (biome === 'sunken_necropolis') {
      type = 'spore';
      count = 50;
    } else if (biome === 'frozen_peaks') {
      type = 'snow';
      count = 60;
    } else if (biome === 'surface_threshold') {
      type = 'leaf';
      count = 45;
    } else if (biome === 'prologue') {
      type = 'sanctuary';
      count = 45;
    }

    const palettes = {
      ember: ['#ff3311', '#ff7700', '#ffbb22', '#ff4466'],
      spore: ['#34d399', '#10b981', '#6ee7b7', '#fbbf24', '#2dd4bf'],
      snow: ['#e0f2fe', '#bae6fd', '#ffffff', '#7dd3fc'],
      leaf: ['#f59e0b', '#ea580c', '#fef08a', '#84cc16', '#fbbf24'],
      rain: ['#64748b', '#94a3b8', '#38bdf8'],
      sanctuary: ['#ffd700', '#c77dff', '#90e0ef', '#ffffff', '#e0aaff', '#f472b6']
    };

    const colors = palettes[type] || palettes.ember;

    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        type: type,
        x: Math.random() * this.vWidth,
        y: Math.random() * this.vHeight,
        speed: (type === 'snow' ? 50 : (type === 'rain' ? 140 : (type === 'sanctuary' ? 14 : (type === 'spore' ? 18 : 30)))) + Math.random() * 25,
        size: (type === 'sanctuary' ? 2.2 : (type === 'leaf' ? 2.5 : (type === 'spore' ? 1.8 : 1.5))) + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    this.ambientEmbers = this.ambientParticles;
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.ui.pauseScreen.classList.remove('hidden');
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.ui.pauseScreen.classList.add('hidden');
    }
  }

  restartLevel() {
    this.ui.pauseScreen.classList.add('hidden');
    this.loadLevel(this.level.id);
    this.state = 'PLAYING';
  }

  handlePlayerDeath() {
    this.deathCount++;
    localStorage.setItem('infernal_rise_deaths', this.deathCount.toString());
    this.updateDeathCounterUI();

    if (window.soundEngine) window.soundEngine.playDeath();
    if (window.particleSystem) {
      window.particleSystem.spawnBloodExplosion(
        this.player.x + this.player.w / 2,
        this.player.y + this.player.h / 2,
        60
      );
    }

    this.state = 'DEAD';
    // True Permadeath Run Reset: player loses all collected passive weapons & boons
    if (this.passiveWeaponsManager) {
      this.passiveWeaponsManager.reset();
    }
    if (window.progression) {
      window.progression.activeBoons = [];
      if (window.progression.updateHUD) {
        window.progression.updateHUD();
      }
    }

    if (this.gameMode === 'INFERNAL') {
      this.ui.deathMessage.textContent = '¡Has sucumbido a la marea de fuego infernal! Tu alma ha sido desterrada de vuelta al Refugio del Reino.';
    } else {
      this.ui.deathMessage.textContent = '¡Has perecido en las profundidades del Infierno! Tu alma ha sido desterrada de vuelta al Refugio del Reino.';
    }
    this.ui.deathScreen.classList.remove('hidden');
  }

  respawnPlayer() {
    this.ui.deathScreen.classList.add('hidden');
    const defeatBanner = document.getElementById('boss-defeat-banner');
    if (defeatBanner) {
      defeatBanner.classList.add('hidden');
      defeatBanner.classList.remove('fade-out');
      defeatBanner.style.display = 'none';
    }
    if (this.defeatBannerTimeout) {
      clearTimeout(this.defeatBannerTimeout);
      this.defeatBannerTimeout = null;
    }
    if (this.defeatBannerFadeTimeout) {
      clearTimeout(this.defeatBannerFadeTimeout);
      this.defeatBannerFadeTimeout = null;
    }

    // True Permadeath Run Reset: reset run passive weapons & boons
    this.xpGems = [];
    if (this.passiveWeaponsManager) {
      this.passiveWeaponsManager.reset();
    }
    if (window.progression) {
      window.progression.resetRunBoons();
    }
    // Return to the Lobby (prologue)
    this.loadLevel('prologue');
    this.state = 'PLAYING';
  }

  triggerBossDefeat() {
    if (!this.boss || this.boss.hasVictoryTriggered || !this.level || !this.level.isCombatScene) return;
    this.boss.hasVictoryTriggered = true;
    this.boss.isDead = true;
    this.boss.hp = 0;
    this.boss.state = 'dead';

    if (this.ui.bossHealthFill) {
      this.ui.bossHealthFill.style.width = '0%';
    }

    if (window.particleSystem) {
      window.particleSystem.triggerScreenShake(1.0, 20);
      window.particleSystem.spawnBloodExplosion(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, 95);
      for (let i = 0; i < 25; i++) {
        window.particleSystem.spawnSlashSparks(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, (Math.random() - 0.5) * 2);
      }
    }
    if (window.soundEngine) {
      window.soundEngine.playDeath();
      if (window.soundEngine.playMeteorExplosion) window.soundEngine.playMeteorExplosion();
    }

    if (!this.boss.hasDropped) {
      this.boss.hasDropped = true;
      this.spawnSoulOrbs(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, 6, 120, true);
      this.spawnXpGems(this.boss.x + this.boss.w / 2, this.boss.y + this.boss.h / 2, 5, 50);
      if (window.progression) window.progression.addHumanityShards(2);
    }

    // Spawn Boss Relic Boon Chest (Reward)
    const chestX = Math.min(Math.max(160, this.boss.x + this.boss.w / 2 - 20), (this.level.width || 1200) - 220);
    const chestY = 424;
    const bossChest = new BoonChest({
      x: chestX,
      y: chestY,
      id: `boss_relic_${this.boss.type}`,
      isRelic: true,
      bossName: this.boss.name
    });
    this.chests.push(bossChest);

    // Spawn Ascension Portal in Boss Room
    if (this.boss.nextLevel) {
      this.level.portal = {
        x: (this.level.width || 1200) - 180,
        y: 360,
        w: 60,
        h: 90,
        targetLevel: this.boss.nextLevel,
        label: 'Portal al Siguiente Círculo'
      };
      if (window.particleSystem) {
        for (let i = 0; i < 35; i++) {
          window.particleSystem.spawnTeleportSparks(this.level.portal.x + 30, this.level.portal.y + 45);
        }
      }
    } else {
      // Final Boss (Glacior) defeated -> Portal al Alba
      this.level.portal = {
        x: (this.level.width || 1200) - 180,
        y: 360,
        w: 60,
        h: 90,
        isFinalPortal: true,
        label: '✨ Portal al Alba Celestial'
      };
      if (window.particleSystem) {
        for (let i = 0; i < 45; i++) {
          window.particleSystem.spawnTeleportSparks(this.level.portal.x + 30, this.level.portal.y + 45);
        }
      }
    }

    // Hide Boss HUD after brief pause
    setTimeout(() => {
      if (this.ui.bossHud) this.ui.bossHud.style.display = 'none';
    }, 1200);

    // Announce defeat in gothic banner - player stays in 'PLAYING' state,
    // walks to the relic chest, loots it, and steps into the portal to ascend!
    this.showBossDefeatBanner(this.boss.name);
  }

  showBossDefeatBanner(bossName) {
    const banner = document.getElementById('boss-defeat-banner');
    const title = document.getElementById('defeat-banner-title');
    if (!banner) return;
    if (title) title.textContent = `¡${(bossName || 'JEFE').toUpperCase()} HA SIDO DERROTADO!`;
    banner.style.display = 'block';
    banner.classList.remove('hidden');
    banner.classList.remove('fade-out');

    if (this.defeatBannerTimeout) clearTimeout(this.defeatBannerTimeout);
    if (this.defeatBannerFadeTimeout) clearTimeout(this.defeatBannerFadeTimeout);

    this.defeatBannerTimeout = setTimeout(() => {
      banner.classList.add('fade-out');
      this.defeatBannerFadeTimeout = setTimeout(() => {
        banner.classList.add('hidden');
        banner.classList.remove('fade-out');
        banner.style.display = 'none';
      }, 850);
    }, 4500);
  }

  updateDeathCounterUI() {
    const el = document.getElementById('death-count');
    if (el) el.textContent = this.deathCount;
  }

  updateEnemySpawner(dt) {
    if (!this.level || !this.player || this.state !== 'PLAYING') return;
    const isTower = this.level.id.startsWith('tower') || this.level.id === 'infernal';
    if (!isTower) return;

    this.enemySpawnTimer = (this.enemySpawnTimer || 0) + dt;
    const activeEnemies = this.enemies.filter(e => !e.isDead);
    const targetPopulation = 28;

    // High-concurrency check every 0.85 seconds
    if (this.enemySpawnTimer < 0.85 || activeEnemies.length >= targetPopulation) {
      return;
    }

    if (!this.level.platforms || this.level.platforms.length === 0) return;

    // Candidate platforms within vertical reach (50px to 750px from player)
    const candidates = this.level.platforms.filter(p => {
      if (p.w < 70) return false;
      if (p.isCheckpoint) return false;
      const distY = Math.abs(p.y - this.player.y);
      if (distY > 750 || distY < 50) return false;
      const distX = Math.abs((p.x + p.w / 2) - this.player.x);
      if (distY < 120 && distX < 90) return false;
      // Max 4 enemies per platform
      const onPlat = activeEnemies.filter(e => e.x >= p.x - 10 && e.x <= p.x + p.w + 10 && Math.abs(e.y + e.h - p.y) < 20);
      if (onPlat.length >= 4) return false;
      return true;
    });

    if (candidates.length === 0) return;

    this.enemySpawnTimer = 0;

    // Concurrency: spawn 2-4 enemies per wave depending on deficit
    let spawnBatch;
    if (activeEnemies.length < 10) {
      spawnBatch = Math.min(4, candidates.length);
    } else if (activeEnemies.length < 18) {
      spawnBatch = Math.min(3, candidates.length);
    } else {
      spawnBatch = Math.min(2, candidates.length);
    }

    // Shuffle candidates to distribute across different platforms
    const shuffled = candidates.slice().sort(() => Math.random() - 0.5);

    for (let s = 0; s < spawnBatch; s++) {
      const targetPlat = shuffled[s % shuffled.length];

      // Determine zone tier by altitude
      let tier = { enemyHp: 40, mageChance: 0.2, enemySkin: 'abyss' };
      if (this.level.tiers && this.level.tiers.length > 0) {
        for (const t of this.level.tiers) {
          if (targetPlat.y <= t.maxY && targetPlat.y >= t.minY) {
            tier = t;
            break;
          }
        }
      } else if (this.level.biome === 'sunken_necropolis') {
        tier = { enemyHp: 55, mageChance: 0.25, enemySkin: 'mud' };
      } else if (this.level.biome === 'frozen_peaks' || this.level.biome === 'surface_threshold') {
        tier = { enemyHp: 75, mageChance: 0.35, enemySkin: 'ice' };
      }

      // Roll for Elite / Giant (25% chance)
      const isElite = Math.random() < 0.25;
      const scaleMultiplier = isElite ? (1.4 + Math.random() * 0.2) : 1.0;
      const baseHp = tier.enemyHp || 40;
      const hp = isElite ? Math.round(baseHp * 2.4) : baseHp;

      const spawnX = targetPlat.x + 16 + Math.floor(Math.random() * Math.max(10, targetPlat.w - 32));
      const spawnY = targetPlat.y - Math.round(34 * scaleMultiplier);

      const allSkins = ['abyss', 'blood', 'gold', 'obsidian', 'ice', 'mud', 'ashen', 'infernal'];
      const enemySkin = Math.random() < 0.65 ? (tier.enemySkin || 'abyss') : allSkins[Math.floor(Math.random() * allSkins.length)];
      const enemyVariant = Math.floor(Math.random() * 4);

      const newEnemy = new SkeletonEnemy({
        x: spawnX,
        y: spawnY,
        minX: targetPlat.x + 6,
        maxX: targetPlat.x + targetPlat.w - 6,
        hp: hp,
        isMage: Math.random() < (tier.mageChance || 0.2),
        isElite: isElite,
        scaleMultiplier: scaleMultiplier,
        skin: enemySkin,
        variant: enemyVariant,
        state: 'chase'
      });

      if (window.particleSystem) {
        window.particleSystem.spawnTeleportSparks(spawnX + 13, spawnY + 17);
      }
      this.enemies.push(newEnemy);
    }

    // 35% chance to spawn 1-2 aerial AbyssalBat dive chasers concurrently
    if (Math.random() < 0.35 && this.bats.filter(b => !b.isDead).length < 8) {
      const batCount = Math.random() < 0.4 ? 2 : 1;
      const batSubTypes = ['abyss', 'blood', 'gargoyle', 'frost', 'toxic'];
      for (let b = 0; b < batCount; b++) {
        const batX = this.player.x + (Math.random() - 0.5) * 450;
        const batY = Math.max(100, this.player.y - 280 - Math.random() * 120);
        const subType = batSubTypes[Math.floor(Math.random() * batSubTypes.length)];
        const newBat = new AbyssalBat({
          x: batX,
          y: batY,
          subType: subType,
          hp: subType === 'gargoyle' ? 30 : 24,
          speed: 3.4
        });
        newBat.state = 'swoop';
        if (window.particleSystem) {
          window.particleSystem.spawnTeleportSparks(batX + 13, batY + 10);
        }
        this.bats.push(newBat);
      }
    }
  }

  // Dynamically spawn a BoonChest at the given world position (called when elite enemies die)
  spawnBoonChest(x, y) {
    const chestId = 'elite_drop_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const chest = new BoonChest({ x: x, y: y, id: chestId });
    this.chests.push(chest);
    if (window.particleSystem) {
      window.particleSystem.spawnTeleportSparks(x + 17, y + 13);
      window.particleSystem.spawnTeleportSparks(x + 17, y + 13);
    }
    if (window.soundEngine && window.soundEngine.playChestOpen) {
      window.soundEngine.playChestOpen();
    }
  }

  hideAllScreens() {
    if (this.ui.mainMenu) this.ui.mainMenu.classList.add('hidden');
    if (this.ui.introScreen) this.ui.introScreen.classList.add('hidden');
    if (this.ui.pauseScreen) this.ui.pauseScreen.classList.add('hidden');
    if (this.ui.deathScreen) this.ui.deathScreen.classList.add('hidden');
    if (this.ui.victoryScreen) this.ui.victoryScreen.classList.add('hidden');
    const defeatBanner = document.getElementById('boss-defeat-banner');
    if (defeatBanner) {
      defeatBanner.classList.add('hidden');
      defeatBanner.classList.remove('fade-out');
      defeatBanner.style.display = 'none';
    }
    if (this.defeatBannerTimeout) {
      clearTimeout(this.defeatBannerTimeout);
      this.defeatBannerTimeout = null;
    }
    if (this.defeatBannerFadeTimeout) {
      clearTimeout(this.defeatBannerFadeTimeout);
      this.defeatBannerFadeTimeout = null;
    }
  }

  checkNpcInteraction() {
    if (!this.level || !this.level.npc || !this.player) return;
    const dist = Math.hypot(
      (this.player.x + this.player.w / 2) - (this.level.npc.x + 16),
      (this.player.y + this.player.h / 2) - (this.level.npc.y + 19)
    );

    if (dist < 75) {
      this.state = 'DIALOGUE';
      this.player.isFrozen = true;
      this.ui.interactionBadge.style.display = 'none';

      window.dialogueManager.startDialogue(this.level.npc.dialogueKey, () => {
        this.state = 'PLAYING';
        this.player.isFrozen = false;
      });
    }
  }

  // ─── MAIN LOOP ───
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    if (this.state === 'PLAYING') {
      this.update(dt);
    }

    this.render();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  update(dt) {
    if (!this.player || !this.level) return;

    // 0. Progression APS tick
    if (window.progression) window.progression.tick(dt);

    // Altitude climbing souls reward
    if (this.level.id.startsWith('tower') || this.level.id === 'infernal') {
      const altitude = Math.max(0, Math.floor(this.level.height - (this.player.y + this.player.h)));
      if (altitude > this.lastReportedAltitude + 90) {
        const diff = altitude - this.lastReportedAltitude;
        this.lastReportedAltitude = altitude;
        const soulsReward = Math.max(1, Math.floor(diff / 22));
        if (soulsReward > 0 && window.progression) {
          window.progression.addSouls(soulsReward);
        }
      }
    }

    // 1. Update Moving Platforms
    for (const mp of this.movingPlatforms) {
      mp.update(dt);
    }

    // 2. Update Crumbling Platforms
    for (const cp of this.crumblingPlatforms) {
      cp.update(dt, window.soundEngine, window.particleSystem);
    }

    // 3. Update Boss Projectiles
    for (let i = this.bossProjectiles.length - 1; i >= 0; i--) {
      const bp = this.bossProjectiles[i];
      bp.update(dt, this.player, window.soundEngine, window.particleSystem);
      if (bp.isDead) this.bossProjectiles.splice(i, 1);
    }

    // 4. Update Player
    const playerStatus = this.player.update(
      dt,
      this.input,
      this.level,
      window.particleSystem,
      window.soundEngine
    );

    if (playerStatus === 'DEAD') {
      this.handlePlayerDeath();
      return;
    }

    // Check player health in combat & danger scenes
    const hasDanger = this.level.isCombatScene || this.level.id.startsWith('tower') || this.level.id === 'infernal';
    if (hasDanger && this.ui.playerHealthFill) {
      const pct = Math.max(0, (this.player.hp / this.player.maxHp) * 100);
      this.ui.playerHealthFill.style.width = `${pct}%`;
    }
    if (this.player.hp <= 0) {
      this.handlePlayerDeath();
      return;
    }

    // 5. Check Portal Collision (Enter Boss Room or Next Level)
    if (this.level.portal) {
      const p = this.level.portal;
      if (this.player.x + this.player.w > p.x && this.player.x < p.x + p.w &&
          this.player.y + this.player.h > p.y && this.player.y < p.y + p.h) {
        if (p.isFinalPortal || !p.targetLevel) {
          this.state = 'VICTORY';
          if (this.ui.victoryMessage) {
            this.ui.victoryMessage.textContent = `¡Has derrotado a Glacior y conquistado los 9 Círculos del Infierno de Dante! Tu alma ha alcanzado la redención eterna y la salida al Alba.`;
          }
          if (this.ui.victoryScreen) this.ui.victoryScreen.classList.remove('hidden');
        } else {
          this.loadLevel(p.targetLevel);
        }
        return;
      }
    }

    // 6. Update Boss
    if (this.boss) {
      if (!this.boss.isDead && this.boss.hp > 0) {
        // Trigger Boss Dialogue on first encounter
        if (!this.hasTriggeredBossDialogue && this.boss.dialogueKey) {
          this.hasTriggeredBossDialogue = true;
          this.state = 'DIALOGUE';
          this.player.isFrozen = true;
          window.dialogueManager.startDialogue(this.boss.dialogueKey, () => {
            this.state = 'PLAYING';
            this.player.isFrozen = false;
          });
        }

        this.boss.update(dt, this.player, window.soundEngine, window.particleSystem);
        const bossHpPct = Math.max(0, (this.boss.hp / this.boss.maxHp) * 100);
        this.ui.bossHealthFill.style.width = `${bossHpPct}%`;
      }

      if (this.level && this.level.isCombatScene && (this.boss.isDead || this.boss.hp <= 0) && !this.boss.hasVictoryTriggered) {
        this.triggerBossDefeat();
      }
    }

    // 4. Update Enemies & Dynamic Spawner
    this.updateEnemySpawner(dt);
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const en = this.enemies[i];
      if (en.isDead) {
        this.enemies.splice(i, 1);
        continue;
      }
      en.update(dt, this.player, this.level, window.soundEngine, window.particleSystem);
    }

    // 4b. Update Bats
    for (const bat of this.bats) {
      bat.update(dt, this.player, this.level, window.soundEngine, window.particleSystem);
    }

    // Sword attack hitbox for urns, bats, and projectiles
    let swordHitbox = null;
    if (this.player.isAttacking && (this.player.attackFrame === 1 || this.player.attackFrame === 2)) {
      swordHitbox = {
        x: this.player.x + (this.player.facing === 1 ? this.player.w : -34),
        y: this.player.y,
        w: 36,
        h: this.player.h
      };
    }

    // 4c. Update Enemy Projectiles (deflectable by sword!)
    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const ep = this.enemyProjectiles[i];
      ep.update(dt, this.player, window.soundEngine, window.particleSystem);
      if (swordHitbox && ep.checkSwordDeflection(swordHitbox, window.soundEngine, window.particleSystem)) {
        this.enemyProjectiles.splice(i, 1);
      } else if (ep.isDead) {
        this.enemyProjectiles.splice(i, 1);
      }
    }

    // 4d. Update Health Orbs
    for (let i = this.healthOrbs.length - 1; i >= 0; i--) {
      const ho = this.healthOrbs[i];
      ho.update(dt, this.player, window.soundEngine, window.particleSystem);
      if (ho.isCollected || ho.life > ho.maxLife) {
        this.healthOrbs.splice(i, 1);
      }
    }

    // 5. Update Urns on player sword strike
    if (swordHitbox) {
      for (const u of this.urns) {
        const orbs = u.checkHit(swordHitbox, window.soundEngine, window.particleSystem);
        if (orbs) this.soulOrbs.push(...orbs);
      }
    }

    // 6. Update Boon Chests proximity
    let nearChest = null;
    for (const ch of this.chests) {
      ch.update(dt, this.player, window.soundEngine);
      if (ch.isNear) nearChest = ch;
    }
    this.activeChest = nearChest;

    // 7. Update Soul Orbs & XP Gems
    for (let i = this.soulOrbs.length - 1; i >= 0; i--) {
      const orb = this.soulOrbs[i];
      orb.update(dt, this.player, window.soundEngine, window.particleSystem);
      if (orb.isCollected || orb.life > orb.maxLife) {
        this.soulOrbs.splice(i, 1);
      }
    }
    for (let i = this.xpGems.length - 1; i >= 0; i--) {
      const gem = this.xpGems[i];
      gem.update(dt, this.player, window.soundEngine, window.particleSystem);
      if (gem.isCollected || gem.life > gem.maxLife) {
        this.xpGems.splice(i, 1);
      }
    }

    // 7b. Update Megabonk Combo Decay
    if (window.progression) {
      window.progression.updateBonkCombo(dt);
    }

    // 8. Update Flame Waves
    for (let i = this.flameWaves.length - 1; i >= 0; i--) {
      const wave = this.flameWaves[i];
      wave.update(dt, this.enemies, this.boss, window.soundEngine, window.particleSystem);
      if (wave.isDead) {
        this.flameWaves.splice(i, 1);
      }
    }

    // 9. Update Tower Floors & Infernal Rising Lava (Climbing floors only, strictly disabled in boss arenas)
    if (this.level.hasLava && (this.level.risingLava || this.level.id === 'infernal') && !this.level.isCombatScene) {
      if (this.levelGraceTimer > 0) {
        this.levelGraceTimer -= dt;
      } else {
        const speed = this.level.lavaSpeed || 21;
        this.level.lavaY -= speed * dt;
        if (this.level.id === 'infernal') {
          this.level.lavaSpeed += 0.4 * dt;
        }
      }
    }

    // 10. Ambient Meteorite Spawner
    this.meteorTimer += dt;
    if (this.meteorTimer > (6.0 + Math.random() * 8.0)) {
      this.meteorTimer = 0;
      if (window.particleSystem) {
        window.particleSystem.spawnMeteor(this.camX, this.camY);
      }
    }

    // 11. Update Particles
    if (window.particleSystem) {
      window.particleSystem.update(
        dt,
        this.camX,
        this.camY,
        this.vWidth,
        this.vHeight,
        this.level.platforms
      );
    }

    // 11.5. Update Vampire Survivors Passive Auto-Attacking Weapons
    if (this.passiveWeaponsManager) {
      this.passiveWeaponsManager.update(
        dt,
        this.player,
        this.level,
        this.enemies,
        this.bats,
        this.boss,
        this.enemyProjectiles,
        window.soundEngine,
        this.particleSystem
      );
    }

    // 12. Update Camera Follow
    const targetCamX = this.player.x + this.player.w / 2 - this.vWidth / 2;
    const targetCamY = this.player.y + this.player.h / 2 - this.vHeight / 2;

    this.camX += (targetCamX - this.camX) * 0.1;
    this.camY += (targetCamY - this.camY) * 0.1;

    // Clamp camera within level bounds (or center if screen is wider/taller than level)
    if (this.level.width <= this.vWidth) {
      this.camX = (this.level.width - this.vWidth) / 2;
    } else {
      this.camX = Math.max(0, Math.min(this.level.width - this.vWidth, this.camX));
    }
    if (this.level.height <= this.vHeight) {
      this.camY = (this.level.height - this.vHeight) / 2;
    } else {
      this.camY = Math.max(0, Math.min(this.level.height - this.vHeight, this.camY));
    }

    // Update UI HUD positioning
    this.updateHudPositions();
  }

  updateHudPositions() {
    if (!this.player) return;

    // Interaction Badge (Chest, Slot Machine, Sanctuary, or NPC)
    this.nearSanctuary = false;
    this.nearSlotMachine = false;
    if (this.activeChest) {
      this.ui.interactionBadge.style.display = 'block';
      this.ui.interactionBadge.textContent = '[E] Abrir Cofre';
      const screenX = ((this.activeChest.x + this.activeChest.w / 2 - this.camX) / this.vWidth) * 100;
      const screenY = ((this.activeChest.y - 14 - this.camY) / this.vHeight) * 100;
      this.ui.interactionBadge.style.left = `${screenX}%`;
      this.ui.interactionBadge.style.top = `${screenY}%`;
    } else if (this.level && this.level.slotMachine && Math.hypot(
        (this.player.x + this.player.w / 2) - (this.level.slotMachine.x + this.level.slotMachine.w / 2),
        (this.player.y + this.player.h / 2) - (this.level.slotMachine.y + this.level.slotMachine.h / 2)
      ) < 75 && this.state !== 'DIALOGUE') {
      this.nearSlotMachine = true;
      this.ui.interactionBadge.style.display = 'block';
      this.ui.interactionBadge.textContent = '🎰 [E] Ruleta de Armas (80 🔮)';
      const screenX = ((this.level.slotMachine.x + this.level.slotMachine.w / 2 - this.camX) / this.vWidth) * 100;
      const screenY = ((this.level.slotMachine.y - 18 - this.camY) / this.vHeight) * 100;
      this.ui.interactionBadge.style.left = `${screenX}%`;
      this.ui.interactionBadge.style.top = `${screenY}%`;
    } else if (this.level && this.level.sanctuary && Math.hypot(
        (this.player.x + this.player.w / 2) - (this.level.sanctuary.x + this.level.sanctuary.w / 2),
        (this.player.y + this.player.h / 2) - (this.level.sanctuary.y + this.level.sanctuary.h / 2)
      ) < 95 && this.state !== 'DIALOGUE') {
      this.nearSanctuary = true;
      this.ui.interactionBadge.style.display = 'block';
      this.ui.interactionBadge.textContent = '[E] Santuario de Mejoras';
      const screenX = ((this.level.sanctuary.x + this.level.sanctuary.w / 2 - this.camX) / this.vWidth) * 100;
      const screenY = ((this.level.sanctuary.y - 18 - this.camY) / this.vHeight) * 100;
      this.ui.interactionBadge.style.left = `${screenX}%`;
      this.ui.interactionBadge.style.top = `${screenY}%`;
    } else if (this.level && this.level.npc) {
      const dist = Math.hypot(
        (this.player.x + this.player.w / 2) - (this.level.npc.x + 16),
        (this.player.y + this.player.h / 2) - (this.level.npc.y + 19)
      );
      if (dist < 75 && this.state !== 'DIALOGUE') {
        this.ui.interactionBadge.style.display = 'block';
        this.ui.interactionBadge.textContent = '[E] Hablar';
        const screenX = ((this.level.npc.x + 16 - this.camX) / this.vWidth) * 100;
        const screenY = ((this.level.npc.y - 12 - this.camY) / this.vHeight) * 100;
        this.ui.interactionBadge.style.left = `${screenX}%`;
        this.ui.interactionBadge.style.top = `${screenY}%`;
      } else {
        this.ui.interactionBadge.style.display = 'none';
      }
    } else {
      this.ui.interactionBadge.style.display = 'none';
    }

    // Highlight mobile interaction button when in range of interactable element
    const canInteract = !this.ui.interactionBadge || this.ui.interactionBadge.style.display !== 'none';
    const touchInteractBtn = this.ui.btnTouchInteract || document.getElementById('btn-touch-interact');
    if (touchInteractBtn) {
      if (canInteract && this.state === 'PLAYING') {
        touchInteractBtn.classList.add('can-interact');
      } else {
        touchInteractBtn.classList.remove('can-interact');
      }
    }
  }

  // ─── RENDERING ───
  render() {
    this.ctx.clearRect(0, 0, this.vWidth, this.vHeight);

    const shakeX = window.particleSystem ? window.particleSystem.shakeX : 0;
    const shakeY = window.particleSystem ? window.particleSystem.shakeY : 0;
    const finalCamX = this.camX + shakeX;
    const finalCamY = this.camY + shakeY;

    // 1. Draw Parallax Backgrounds
    this.drawParallaxBackgrounds(finalCamX, finalCamY);

    if (!this.level) return;

    // 2. Draw Level Platforms & Tiles
    this.drawLevelPlatforms(finalCamX, finalCamY);

    // 2b. Draw Ladders
    for (const lad of this.ladders) {
      lad.draw(this.ctx, finalCamX, finalCamY);
    }

    // 2c. Draw Moving Platforms
    for (const mp of this.movingPlatforms) {
      mp.draw(this.ctx, finalCamX, finalCamY);
    }

    // 2d. Draw Crumbling Platforms
    for (const cp of this.crumblingPlatforms) {
      cp.draw(this.ctx, finalCamX, finalCamY);
    }

    // 3. Draw Spikes
    this.drawSpikes(finalCamX, finalCamY);

    // 4. Draw Torches & Lights
    this.drawTorches(finalCamX, finalCamY);

    // 4b. Draw In-World Sanctuary Altar (Lobby)
    if (this.level && this.level.sanctuary) {
      this.drawSanctuaryAltar(this.level.sanctuary, finalCamX, finalCamY);
    }

    // 4c. Draw In-World Slot Machine (Lobby)
    if (this.level && this.level.slotMachine) {
      this.drawSlotMachine(this.level.slotMachine, finalCamX, finalCamY);
    }

    // 5. Draw Portal
    if (this.level.portal) {
      this.drawPortal(this.level.portal, finalCamX, finalCamY);
    }

    // 6. Draw Urns & Boon Chests
    for (const u of this.urns) {
      u.draw(this.ctx, finalCamX, finalCamY);
    }
    for (const c of this.chests) {
      c.draw(this.ctx, finalCamX, finalCamY);
    }

    // 7. Draw NPC
    if (this.level.npc) {
      this.drawNpc(this.level.npc, finalCamX, finalCamY);
    }

    // 8. Draw Enemies & Bats
    for (const en of this.enemies) {
      en.draw(this.ctx, finalCamX, finalCamY);
    }
    for (const bat of this.bats) {
      bat.draw(this.ctx, finalCamX, finalCamY);
    }

    // 8b. Draw Enemy Projectiles
    for (const ep of this.enemyProjectiles) {
      ep.draw(this.ctx, finalCamX, finalCamY);
    }

    // 9. Draw Boss
    if (this.boss) {
      this.boss.draw(this.ctx, finalCamX, finalCamY);
    }

    // 9b. Draw Boss Projectiles
    for (const bp of this.bossProjectiles) {
      bp.draw(this.ctx, finalCamX, finalCamY);
    }

    // 10. Draw Soul Orbs, XP Gems, Health Orbs & Flame Waves
    for (const o of this.soulOrbs) {
      o.draw(this.ctx, finalCamX, finalCamY);
    }
    for (const g of this.xpGems) {
      g.draw(this.ctx, finalCamX, finalCamY);
    }
    for (const ho of this.healthOrbs) {
      ho.draw(this.ctx, finalCamX, finalCamY);
    }
    for (const f of this.flameWaves) {
      f.draw(this.ctx, finalCamX, finalCamY);
    }

    // 11. Draw Player
    if (this.player) {
      this.player.draw(this.ctx, finalCamX, finalCamY);
    }

    // 11b. Draw Vampire Survivors Passive Weapons (Crosses, Lightning, Orbs, Scythes, Garlic)
    if (this.passiveWeaponsManager) {
      this.passiveWeaponsManager.draw(this.ctx, finalCamX, finalCamY);
    }

    // 12. Draw Lava Sea
    if (this.level.hasLava) {
      this.drawLava(this.level.lavaY, finalCamX, finalCamY);
    }

    // 13. Draw Particles (Rain, Meteors, Blood, Dust)
    if (window.particleSystem) {
      window.particleSystem.draw(this.ctx, finalCamX, finalCamY);
    }

    // 14. Draw Wind Current Streaks
    if (this.level.wind && this.camY >= this.level.wind.activeMinY && this.camY <= this.level.wind.activeMaxY) {
      this.drawWindStreaks(finalCamX, finalCamY);
    }

    // 15. Draw Dante Circle HUD Banner / Badge
    if (this.level.danteCircle && this.state === 'PLAYING') {
      this.drawDanteCircleBadge();
    }
  }

  drawWindStreaks(camX, camY) {
    const time = performance.now() * 0.001;
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(230, 240, 255, 0.22)';
    this.ctx.lineWidth = 1.5;
    for (let i = 0; i < 18; i++) {
      const speed = 380 + (i % 5) * 60;
      const x = ((time * speed + i * 137) % (this.vWidth + 200)) - 100;
      const y = (i * 37 + Math.sin(time * 2 + i) * 20) % this.vHeight;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + 50 + (i % 3) * 25, y + Math.sin(time * 3 + i) * 6);
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawDanteCircleBadge() {
    this.ctx.save();
    const text = this.level.danteCircle;
    this.ctx.font = 'bold 11px "Cinzel", "Crimson Text", serif, sans-serif';
    const textMetrics = this.ctx.measureText(text);
    const boxW = textMetrics.width + 28;
    const boxH = 24;
    const boxX = (this.vWidth - boxW) / 2;
    const boxY = 12;

    // Dark gothic translucent pill
    this.ctx.fillStyle = 'rgba(10, 4, 12, 0.78)';
    this.ctx.strokeStyle = 'rgba(218, 165, 32, 0.6)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    if (this.ctx.roundRect) {
      this.ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    } else {
      this.ctx.rect(boxX, boxY, boxW, boxH);
    }
    this.ctx.fill();
    this.ctx.stroke();

    // Runic golden label
    this.ctx.fillStyle = '#f8df8c';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, this.vWidth / 2, boxY + boxH / 2);
    this.ctx.restore();
  }

  drawParallaxBackgrounds(camX, camY) {
    // 1. Calculate Altitude Ratio for Seamless Vertical Atmospheric Transition
    // 0.0 = Base, 1.0 = Summit
    const maxScrollY = Math.max(1, (this.level ? this.level.height : 3400) - this.vHeight);
    const climbRatio = Math.max(0, Math.min(1.0, 1.0 - (camY / maxScrollY)));

    // 2. Resolve Active Biome & Transitions
    let biomeKey = (this.level && this.level.biome) ? this.level.biome : 'abyss';

    // In procedural infernal mode: smoothly morph through the 4 nexus biomes as altitude increases
    if (biomeKey === 'dynamic_nexus') {
      if (climbRatio < 0.28) biomeKey = 'abyss';
      else if (climbRatio < 0.58) biomeKey = 'sunken_necropolis';
      else if (climbRatio < 0.84) biomeKey = 'frozen_peaks';
      else biomeKey = 'surface_threshold';
    }

    // In Tower 3: near the summit (y < 1200 / climbRatio > 0.62), the underworld gives way to the golden dawn of the human surface!
    let surfaceBlend = 0;
    if (this.level && this.level.id === 'tower3' && climbRatio > 0.62) {
      surfaceBlend = Math.min(1.0, (climbRatio - 0.62) / 0.38);
    } else if (biomeKey === 'surface_threshold') {
      surfaceBlend = 1.0;
    }

    // 3. Dynamic Altitude Sky Gradient per Biome
    const lerpArray = (a, b, t) => [
      Math.round(a[0] + (b[0] - a[0]) * t),
      Math.round(a[1] + (b[1] - a[1]) * t),
      Math.round(a[2] + (b[2] - a[2]) * t)
    ];

    const skyPalettes = {
      abyss: {
        base: [[8, 1, 5], [28, 4, 8], [65, 10, 7], [120, 20, 0]],
        peak: [[2, 0, 5], [10, 2, 18], [28, 4, 28], [58, 7, 32]]
      },
      sunken_necropolis: {
        base: [[3, 10, 8], [6, 26, 20], [12, 54, 42], [24, 82, 60]],
        peak: [[2, 14, 16], [5, 34, 38], [14, 68, 64], [32, 110, 92]]
      },
      frozen_peaks: {
        base: [[4, 8, 22], [10, 24, 52], [20, 60, 100], [42, 110, 155]],
        peak: [[2, 6, 18], [6, 18, 42], [14, 45, 80], [30, 85, 128]]
      },
      surface_threshold: {
        base: [[16, 14, 34], [52, 28, 56], [165, 75, 45], [250, 185, 80]],
        peak: [[24, 28, 58], [75, 52, 92], [210, 115, 60], [255, 220, 120]]
      },
      prologue: {
        base: [[8, 10, 24], [18, 16, 42], [32, 22, 60], [48, 28, 68]],
        peak: [[8, 10, 24], [18, 16, 42], [32, 22, 60], [48, 28, 68]]
      }
    };

    let pal = skyPalettes[biomeKey] || skyPalettes.abyss;
    let stops = [];
    for (let s = 0; s < 4; s++) {
      stops.push(lerpArray(pal.base[s], pal.peak[s], climbRatio));
    }

    if (surfaceBlend > 0) {
      const dawnPal = skyPalettes.surface_threshold;
      for (let s = 0; s < 4; s++) {
        const dawnColor = lerpArray(dawnPal.base[s], dawnPal.peak[s], climbRatio);
        stops[s] = lerpArray(stops[s], dawnColor, surfaceBlend);
      }
    }

    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.vHeight);
    skyGrad.addColorStop(0.0, `rgb(${stops[0].join(',')})`);
    skyGrad.addColorStop(0.35, `rgb(${stops[1].join(',')})`);
    skyGrad.addColorStop(0.70, `rgb(${stops[2].join(',')})`);
    skyGrad.addColorStop(1.0, `rgb(${stops[3].join(',')})`);

    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // 4. Ambient Base Glow / Horizon Light
    if (biomeKey === 'abyss' && climbRatio < 0.6) {
      const lavaGlowAlpha = (1.0 - climbRatio / 0.6) * 0.35;
      const glowGrad = this.ctx.createLinearGradient(0, this.vHeight - 180, 0, this.vHeight);
      glowGrad.addColorStop(0, 'rgba(255, 60, 0, 0)');
      glowGrad.addColorStop(1, `rgba(255, 60, 0, ${lavaGlowAlpha})`);
      this.ctx.fillStyle = glowGrad;
      this.ctx.fillRect(0, this.vHeight - 180, this.vWidth, 180);
    } else if (biomeKey === 'sunken_necropolis') {
      const mistGrad = this.ctx.createLinearGradient(0, this.vHeight - 160, 0, this.vHeight);
      mistGrad.addColorStop(0, 'rgba(16, 185, 129, 0)');
      mistGrad.addColorStop(1, 'rgba(16, 185, 129, 0.22)');
      this.ctx.fillStyle = mistGrad;
      this.ctx.fillRect(0, this.vHeight - 160, this.vWidth, 160);
    } else if (biomeKey === 'frozen_peaks' && surfaceBlend < 0.5) {
      const frostGrad = this.ctx.createLinearGradient(0, this.vHeight - 160, 0, this.vHeight);
      frostGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      frostGrad.addColorStop(1, 'rgba(56, 189, 248, 0.24)');
      this.ctx.fillStyle = frostGrad;
      this.ctx.fillRect(0, this.vHeight - 160, this.vWidth, 160);
    } else if (surfaceBlend > 0) {
      const dawnGlow = this.ctx.createLinearGradient(0, this.vHeight - 190, 0, this.vHeight);
      dawnGlow.addColorStop(0, 'rgba(251, 191, 36, 0)');
      dawnGlow.addColorStop(1, `rgba(251, 191, 36, ${0.28 * surfaceBlend})`);
      this.ctx.fillStyle = dawnGlow;
      this.ctx.fillRect(0, this.vHeight - 190, this.vWidth, 190);
    }

    // 5. Parallax Background Layers
    const biomes = window.spriteManager ? window.spriteManager.sprites.biomes : null;
    let bg = null;
    if (biomes) {
      if (surfaceBlend >= 0.85 || biomeKey === 'surface_threshold') bg = biomes.surface;
      else if (biomeKey === 'sunken_necropolis') bg = biomes.sunken;
      else if (biomeKey === 'frozen_peaks') bg = biomes.frozen;
      else if (biomeKey === 'prologue') bg = biomes.prologue;
      else bg = biomes.abyss;
    }
    if (!bg && window.spriteManager) bg = window.spriteManager.sprites.infernalBg;
    if (!bg) return;

    // Special handling for Prologue (Sanctuary Cathedral Chamber):
    // The sanctuary is a fixed indoor room; it must lock 1:1 with world space
    // to prevent parallax desynchronization, vibration, top gaps, and repeating tile clashing.
    if (biomeKey === 'prologue' || (this.level && this.level.id === 'prologue')) {
      this.drawPrologueSanctuary(bg, camX, camY);
      this.drawAtmosphericParticles();
      return;
    }

    // Layer 1: Celestial Spires & Sky (Parallax speed: 0.06)
    if (bg.skySpires) {
      const layerW = 960;
      const offX = -(camX * 0.06);
      let startX = offX % layerW;
      if (startX > 0) startX -= layerW;
      const shiftY = (climbRatio - 0.5) * 60;
      for (let x = startX; x < this.vWidth; x += layerW) {
        this.ctx.drawImage(bg.skySpires, x, shiftY, layerW, 540);
      }
    }

    // Blend into surface dawn mountains in upper Tower 3
    if (surfaceBlend > 0 && surfaceBlend < 0.85 && biomes && biomes.surface && biomes.surface.skySpires) {
      this.ctx.save();
      this.ctx.globalAlpha = surfaceBlend;
      const layerW = 960;
      const offX = -(camX * 0.06);
      let startX = offX % layerW;
      if (startX > 0) startX -= layerW;
      const shiftY = (climbRatio - 0.5) * 60;
      for (let x = startX; x < this.vWidth; x += layerW) {
        this.ctx.drawImage(biomes.surface.skySpires, x, shiftY, layerW, 540);
      }
      this.ctx.restore();
    }

    // Layer 2: Midground Ridges & Cascades (Parallax speed: 0.16)
    if (bg.magmaPeaks) {
      const layerW = 960;
      const offX = -(camX * 0.16);
      let startX = offX % layerW;
      if (startX > 0) startX -= layerW;
      const shiftY = 30 + (climbRatio - 0.5) * 80;
      for (let x = startX; x < this.vWidth; x += layerW) {
        this.ctx.drawImage(bg.magmaPeaks, x, shiftY, layerW, 540);
      }
    }

    // Layer 3: Tower Gothic Architecture & Arches (Parallax speed X: 0.35, Y: 0.40)
    if (bg.towerArch) {
      const tileW = 480;
      const tileH = 540;
      const offX = -(camX * 0.35);
      let startX = offX % tileW;
      if (startX > 0) startX -= tileW;

      const offY = -(camY * 0.40);
      let startY = offY % tileH;
      if (startY > 0) startY -= tileH;

      for (let x = startX; x < this.vWidth; x += tileW) {
        for (let y = startY; y < this.vHeight; y += tileH) {
          this.ctx.drawImage(bg.towerArch, x, y, tileW, tileH);
        }
      }
    }

    // 6. Atmospheric Biome Particles (Embers, Spores, Snowflakes, Dawn Leaves, Rain)
    this.drawAtmosphericParticles();
  }

  drawPrologueSanctuary(bg, camX, camY) {
    const rx = Math.round(-camX);
    const ry = Math.round(-camY);

    // 1. Fill entire canvas to prevent any black margins
    this.ctx.fillStyle = '#0a0912';
    this.ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // 2. If screen is wider than 960 (e.g. mobile landscape or ultrawide):
    // Fill horizontal margins with matching cathedral stone wall
    if (rx > 0 || rx + 960 < this.vWidth) {
      this.ctx.fillStyle = '#11101d';
      this.ctx.fillRect(0, 0, this.vWidth, this.vHeight);
    }

    // 3. Draw the master Cathedral Hall locked 1:1 to world coordinates
    const hallImg = bg ? (bg.cathedralHall || bg.skySpires) : null;
    if (hallImg) {
      this.ctx.drawImage(hallImg, rx, ry, 960, 540);
    }
  }

  drawAtmosphericParticles() {
    const particles = this.ambientParticles || this.ambientEmbers;
    if (!particles) return;
    const dt = 0.016;
    for (const p of particles) {
      if (p.type === 'snow') {
        p.y += p.speed * dt;
        p.x += (p.speed * 0.4) * dt;
        p.phase += dt * 2.0;
        if (p.y > this.vHeight + 10 || p.x > this.vWidth + 10) {
          p.y = -10;
          p.x = Math.random() * this.vWidth;
        }
        const swayX = p.x + Math.sin(p.phase) * 6;
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(swayX, p.y, p.size, p.size);
      } else if (p.type === 'leaf') {
        p.y += p.speed * dt;
        p.x += Math.sin(p.phase * 2.5) * 18 * dt + (p.speed * 0.3) * dt;
        p.phase += dt * 2.2;
        if (p.y > this.vHeight + 10) {
          p.y = -10;
          p.x = Math.random() * this.vWidth;
        }
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(p.x, p.y, p.size, p.size * 0.7);
      } else if (p.type === 'sanctuary') {
        p.y -= (p.speed * 0.45) * dt;
        p.phase += dt * 1.6;
        if (p.y < -10) {
          p.y = this.vHeight + 10;
          p.x = Math.random() * this.vWidth;
        }
        const swayX = p.x + Math.sin(p.phase) * 10;
        const pulse = 0.4 + Math.sin(p.phase * 2) * 0.4;
        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0.15, Math.min(1, pulse));
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(swayX, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      } else if (p.type === 'rain') {
        p.y += p.speed * dt;
        p.x -= (p.speed * 0.25) * dt;
        if (p.y > this.vHeight + 10) {
          p.y = -10;
          p.x = Math.random() * (this.vWidth + 100);
        }
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = 1.2;
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x - 4, p.y + 10);
        this.ctx.stroke();
      } else if (p.type === 'spore') {
        p.y -= (p.speed * 0.4) * dt;
        p.phase += dt * 1.8;
        if (p.y < -10) {
          p.y = this.vHeight + 10;
          p.x = Math.random() * this.vWidth;
        }
        const swayX = p.x + Math.sin(p.phase) * 16;
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(swayX, p.y, p.size, p.size);
      } else {
        // Ember (default)
        p.y -= p.speed * dt;
        p.phase += dt * 2.5;
        if (p.y < -10) {
          p.y = this.vHeight + 10;
          p.x = Math.random() * this.vWidth;
        }
        const swayX = p.x + Math.sin(p.phase) * 12;
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(swayX, p.y, p.size, p.size);
      }
    }
  }

  drawLevelPlatforms(camX, camY) {
    const props = window.spriteManager.sprites.props;
    if (!props || !this.level.platforms) return;

    const tileMap = {
      stone: props.stoneTile,
      obsidian: props.obsidianTile,
      bone: props.boneTile,
      runic: props.runicTile,
      ice: props.iceTile,
      gold: props.goldTile,
      mud: props.mudTile
    };

    const styleMap = {
      stone: { rim: '#483854', hi: '#6d557f', corbel: '#18121d', dark: '#0a060d' },
      obsidian: { rim: '#ff4500', hi: '#ffaa00', corbel: '#14060c', dark: '#060104' },
      bone: { rim: '#b5a396', hi: '#e8dcce', corbel: '#241c1f', dark: '#0f0a0c' },
      runic: { rim: '#bf00ff', hi: '#ff80df', corbel: '#190a26', dark: '#090212' },
      ice: { rim: '#00b4d8', hi: '#caf0f8', corbel: '#0f2438', dark: '#05101a' },
      gold: { rim: '#fbbf24', hi: '#fef08a', corbel: '#451a03', dark: '#1f0a00' },
      mud: { rim: '#52b788', hi: '#95d5b2', corbel: '#132a1f', dark: '#08140e' }
    };

    for (const p of this.level.platforms) {
      if (p.isMovingPlatform || p.isCrumbling) continue;

      const rx = Math.round(p.x - camX);
      const ry = Math.round(p.y - camY);

      // Frustum culling
      if (rx + p.w < -60 || rx > this.vWidth + 60 ||
          ry + p.h < -60 || ry > this.vHeight + 60) continue;

      const pType = p.type || 'stone';
      const tile = tileMap[pType] || props.stoneTile;
      const style = styleMap[pType] || styleMap.stone;

      // Check if this platform has solid ground or another platform directly underneath it
      const hasSupportBelow = (p.y + p.h >= (this.level.height || 540) - 20) ||
        this.level.platforms.some(other =>
          other !== p &&
          !other.isMovingPlatform &&
          !other.isCrumbling &&
          other.x < p.x + p.w &&
          other.x + other.w > p.x &&
          other.y >= p.y + p.h - 4 &&
          other.y <= p.y + p.h + 20
        );

      // 1. Architectural Corbels (Stepped stone bracket supports underneath floating platforms)
      if (!hasSupportBelow && p.w >= 60) {
        this.drawCorbelBracket(rx + 6, ry + p.h, style.corbel, style.dark, false);
        this.drawCorbelBracket(rx + p.w - 18, ry + p.h, style.corbel, style.dark, true);
        if (p.w >= 280) {
          this.drawCorbelBracket(rx + Math.floor(p.w / 2) - 6, ry + p.h, style.corbel, style.dark, false);
        }
      }

      // 2. Thematic Underside Details (Magma drips, icicles, bone fangs, rusted chains)
      if (!hasSupportBelow) {
        this.drawPlatformUndersideDecorations(rx, ry + p.h, p.w, pType);
      }

      // 3. Platform Outer Drop Shadow
      this.ctx.fillStyle = '#060207';
      this.ctx.fillRect(rx - 1, ry - 1, p.w + 2, p.h + 2);

      // 4. Platform Pattern Tile Fill
      if (tile) {
        const ptrn = this.ctx.createPattern(tile, 'repeat');
        this.ctx.save();
        this.ctx.fillStyle = ptrn;
        this.ctx.translate(rx, ry);
        this.ctx.fillRect(0, 0, p.w, p.h);
        this.ctx.restore();
      } else {
        this.ctx.fillStyle = style.corbel;
        this.ctx.fillRect(rx, ry, p.w, p.h);
      }

      // 5. Themed Top Coping Rim & Bevel Highlight
      this.ctx.fillStyle = style.rim;
      this.ctx.fillRect(rx, ry, p.w, 4);
      this.ctx.fillStyle = style.hi;
      this.ctx.fillRect(rx, ry, p.w, 1);

      // Platform Side Border Reinforcements
      this.ctx.fillStyle = style.corbel;
      this.ctx.fillRect(rx, ry, 2, p.h);
      this.ctx.fillRect(rx + p.w - 2, ry, 2, p.h);
    }
  }

  drawCorbelBracket(x, y, color, shadowColor, flip) {
    this.ctx.fillStyle = shadowColor;
    this.ctx.fillRect(x - 1, y, 14, 15);
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, 12, 4);
    this.ctx.fillRect(x + (flip ? 2 : 0), y + 4, 10, 4);
    this.ctx.fillRect(x + (flip ? 5 : 0), y + 8, 7, 3);
    this.ctx.fillRect(x + (flip ? 8 : 0), y + 11, 4, 3);
  }

  drawPlatformUndersideDecorations(x, y, width, type) {
    if (type === 'obsidian') {
      this.ctx.fillStyle = '#ff3300';
      this.ctx.fillRect(x + 18, y, 3, 9);
      this.ctx.fillRect(x + width - 24, y, 3, 11);
      this.ctx.fillStyle = '#ffaa00';
      this.ctx.fillRect(x + 19, y + 6, 1, 3);
      this.ctx.fillRect(x + width - 23, y + 8, 1, 3);
    } else if (type === 'ice') {
      this.ctx.fillStyle = '#48cae4';
      this.ctx.fillRect(x + 14, y, 3, 12);
      this.ctx.fillRect(x + 28, y, 2, 7);
      this.ctx.fillRect(x + width - 32, y, 3, 13);
      this.ctx.fillRect(x + width - 18, y, 2, 8);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(x + 15, y, 1, 10);
      this.ctx.fillRect(x + width - 31, y, 1, 11);
    } else if (type === 'bone') {
      this.ctx.fillStyle = '#8f7b7f';
      this.ctx.fillRect(x + 16, y, 3, 9);
      this.ctx.fillRect(x + width - 22, y, 3, 10);
      this.ctx.fillStyle = '#c4b3a5';
      this.ctx.fillRect(x + 17, y, 1, 7);
      this.ctx.fillRect(x + width - 21, y, 1, 8);
    } else if (type === 'stone' || type === 'runic') {
      if (width >= 80) {
        this.ctx.fillStyle = '#231826';
        this.ctx.fillRect(x + 22, y, 3, 14);
        this.ctx.fillRect(x + width - 26, y, 3, 16);
        this.ctx.fillStyle = '#48354c';
        this.ctx.fillRect(x + 23, y + 2, 1, 10);
        this.ctx.fillRect(x + width - 25, y + 2, 1, 12);
      }
    } else if (type === 'gold') {
      this.ctx.fillStyle = '#b45309';
      this.ctx.fillRect(x + 16, y, 3, 8);
      this.ctx.fillRect(x + width - 22, y, 3, 9);
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.fillRect(x + 17, y + 4, 2, 4);
      this.ctx.fillRect(x + width - 21, y + 4, 2, 4);
    } else if (type === 'mud') {
      this.ctx.fillStyle = '#1b4332';
      this.ctx.fillRect(x + 14, y, 4, 11);
      this.ctx.fillRect(x + width - 20, y, 4, 13);
      this.ctx.fillStyle = '#52b788';
      this.ctx.fillRect(x + 15, y + 6, 2, 5);
      this.ctx.fillRect(x + width - 19, y + 8, 2, 5);
    }
  }

  drawSpikes(camX, camY) {
    const props = window.spriteManager && window.spriteManager.sprites ? window.spriteManager.sprites.props : null;
    const spikeSprite = props ? props.spikes : null;
    if (!this.level.spikes) return;

    for (const sp of this.level.spikes) {
      const rx = Math.round(sp.x - camX);
      const ry = Math.round(sp.y - camY);

      if (spikeSprite) {
        // Tile 32px spikes
        for (let x = 0; x < sp.w; x += 32) {
          const w = Math.min(32, sp.w - x);
          this.ctx.drawImage(spikeSprite, 0, 0, w, 16, rx + x, ry, w, sp.h);
        }
      } else {
        this.ctx.fillStyle = '#ff2244';
        this.ctx.fillRect(rx, ry, sp.w, sp.h);
      }
    }
  }

  drawTorches(camX, camY) {
    const props = window.spriteManager && window.spriteManager.sprites ? window.spriteManager.sprites.props : null;
    if (!props || !this.level.torches) return;

    const frameIdx = Math.floor(Date.now() / 150) % 4;

    for (const t of this.level.torches) {
      const rx = Math.round(t.x - camX);
      const ry = Math.round(t.y - camY);

      const torchArr = t.blue ? props.blueTorch : props.torch;
      if (torchArr && torchArr[frameIdx]) {
        this.ctx.drawImage(torchArr[frameIdx], rx - 8, ry - 12);
      }

      // 2D Lighting Halo
      const grad = this.ctx.createRadialGradient(rx, ry - 4, 4, rx, ry - 4, 90);
      grad.addColorStop(0, t.blue ? 'rgba(0, 180, 255, 0.25)' : 'rgba(255, 120, 0, 0.28)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(rx, ry - 4, 90, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawSanctuaryAltar(sanctuary, camX, camY) {
    const rx = Math.round(sanctuary.x - camX);
    const ry = Math.round(sanctuary.y - camY);
    const w = sanctuary.w || 90;
    const h = sanctuary.h || 90;
    const time = Date.now() / 350;

    this.ctx.save();

    // 1. Ethereal ambient light halo
    const auraGrad = this.ctx.createRadialGradient(
      rx + w / 2, ry + h / 2 - 10, 8,
      rx + w / 2, ry + h / 2 - 10, 65 + Math.sin(time) * 6
    );
    auraGrad.addColorStop(0, 'rgba(157, 78, 221, 0.45)');
    auraGrad.addColorStop(0.5, 'rgba(255, 215, 0, 0.18)');
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = auraGrad;
    this.ctx.beginPath();
    this.ctx.arc(rx + w / 2, ry + h / 2 - 10, 75, 0, Math.PI * 2);
    this.ctx.fill();

    // 2. Heavy Stone Base Altar (stepped pediment)
    // Bottom plinth step
    this.ctx.fillStyle = '#1c1b22';
    this.ctx.strokeStyle = '#4a3b5c';
    this.ctx.lineWidth = 2;
    this.ctx.fillRect(rx - 8, ry + h - 18, w + 16, 18);
    this.ctx.strokeRect(rx - 8, ry + h - 18, w + 16, 18);

    // Middle pediment
    this.ctx.fillStyle = '#262330';
    this.ctx.fillRect(rx + 4, ry + h - 42, w - 8, 24);
    this.ctx.strokeRect(rx + 4, ry + h - 42, w - 8, 24);

    // Altar top slab
    this.ctx.fillStyle = '#342e42';
    this.ctx.fillRect(rx, ry + h - 50, w, 10);
    this.ctx.strokeRect(rx, ry + h - 50, w, 10);

    // Flanking runic stone pillars
    this.ctx.fillStyle = '#221e2a';
    this.ctx.fillRect(rx + 4, ry + 16, 12, h - 66);
    this.ctx.strokeRect(rx + 4, ry + 16, 12, h - 66);
    this.ctx.fillRect(rx + w - 16, ry + 16, 12, h - 66);
    this.ctx.strokeRect(rx + w - 16, ry + 16, 12, h - 66);

    // Glowing Engraved Runes on pillars and plinth
    const runeGlow = 0.5 + Math.sin(time * 1.5) * 0.4;
    this.ctx.save();
    this.ctx.shadowColor = '#c77dff';
    this.ctx.shadowBlur = 10 * runeGlow;
    this.ctx.fillStyle = `rgba(199, 125, 255, ${0.4 + runeGlow * 0.5})`;
    this.ctx.font = 'bold 9px sans-serif';
    this.ctx.fillText('ᚱ', rx + 7, ry + 36);
    this.ctx.fillText('ᛟ', rx + 7, ry + 52);
    this.ctx.fillText('ᛏ', rx + w - 13, ry + 36);
    this.ctx.fillText('ᛉ', rx + w - 13, ry + 52);

    // Rune inscription along central plinth
    this.ctx.fillStyle = `rgba(255, 215, 0, ${0.4 + runeGlow * 0.4})`;
    this.ctx.shadowColor = '#ffd700';
    this.ctx.fillText('✧ ᚱ ᛖ ᛞ ᛖ ᛗ ᛈ ᛏ ᛁ ᛟ ✧', rx + w / 2 - 42, ry + h - 26);
    this.ctx.restore();

    // 3. Floating Soul Nexus / Core Orb levitating above the altar slab
    const floatY = Math.sin(time * 2.0) * 5;
    const orbX = rx + w / 2;
    const orbY = ry + 26 + floatY;

    // Outer spinning soul halo rings
    this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.7)';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.ellipse(orbX, orbY, 16, 8, time * 0.8, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.strokeStyle = 'rgba(199, 125, 255, 0.7)';
    this.ctx.beginPath();
    this.ctx.ellipse(orbX, orbY, 16, 8, -time * 0.8, 0, Math.PI * 2);
    this.ctx.stroke();

    // Soul Core
    const coreGrad = this.ctx.createRadialGradient(orbX, orbY, 1, orbX, orbY, 10);
    coreGrad.addColorStop(0, '#ffffff');
    coreGrad.addColorStop(0.4, '#c77dff');
    coreGrad.addColorStop(0.8, '#7b2cbf');
    coreGrad.addColorStop(1, 'rgba(60, 9, 108, 0.8)');
    this.ctx.fillStyle = coreGrad;
    this.ctx.beginPath();
    this.ctx.arc(orbX, orbY, 9, 0, Math.PI * 2);
    this.ctx.fill();

    // Occasional soul particle spark
    if (window.particleSystem && Math.random() < 0.08) {
      window.particleSystem.spawnTeleportSparks(sanctuary.x + w / 2 + (Math.random() - 0.5) * 20, sanctuary.y + 26);
    }

    // 4. Overhead Golden Arch / Torii Crest with Torches
    this.ctx.fillStyle = '#ffb703';
    this.ctx.fillRect(rx + 2, ry + 8, w - 4, 6);

    // Label Plate
    this.ctx.save();
    this.ctx.font = 'bold 11px MedievalSharp, Cinzel, serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ffd166';
    this.ctx.shadowColor = '#000000';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText('⛩️ SANTUARIO DE ALMAS', rx + w / 2, ry - 6);
    this.ctx.restore();

    this.ctx.restore();
  }

  drawSlotMachine(sm, camX, camY) {
    const rx = Math.round(sm.x - camX);
    const ry = Math.round(sm.y - camY);
    const w = sm.w || 60;
    const h = sm.h || 70;
    const time = Date.now() / 250;

    this.ctx.save();

    // 1. Shadow beneath cabinet
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(rx - 4, ry + h - 6, w + 8, 8);

    // 2. Main Outer Cabinet (Iron chassis with gothic red/gold borders)
    const cabGrad = this.ctx.createLinearGradient(rx, ry, rx + w, ry + h);
    cabGrad.addColorStop(0, '#2b1224');
    cabGrad.addColorStop(0.5, '#170814');
    cabGrad.addColorStop(1, '#0c040a');
    this.ctx.fillStyle = cabGrad;
    this.ctx.fillRect(rx, ry, w, h);

    this.ctx.strokeStyle = '#ffd166';
    this.ctx.lineWidth = 1.8;
    this.ctx.strokeRect(rx, ry, w, h);

    // Demon horn crests on top left & right
    this.ctx.fillStyle = '#ff4d6d';
    this.ctx.beginPath();
    this.ctx.moveTo(rx, ry);
    this.ctx.lineTo(rx - 6, ry - 10);
    this.ctx.lineTo(rx + 8, ry);
    this.ctx.fill();

    this.ctx.beginPath();
    this.ctx.moveTo(rx + w, ry);
    this.ctx.lineTo(rx + w + 6, ry - 10);
    this.ctx.lineTo(rx + w - 8, ry);
    this.ctx.fill();

    // 3. Glowing Marquee Sign on Top
    const pulse = 0.65 + Math.sin(time * 2.0) * 0.35;
    this.ctx.fillStyle = `rgba(255, 183, 3, ${pulse})`;
    this.ctx.fillRect(rx + 4, ry + 4, w - 8, 12);
    this.ctx.fillStyle = '#100508';
    this.ctx.font = 'bold 8px Cinzel, MedievalSharp, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🎰 RULETA', rx + w / 2, ry + 13);

    // 4. Three Reel Windows
    const reelW = 12;
    const reelH = 22;
    const reelY = ry + 22;
    const spacing = (w - 8 - (reelW * 3)) / 4;

    const icons = ['✝️', '☄️', '⚡'];
    for (let i = 0; i < 3; i++) {
      const reelX = rx + 4 + spacing + i * (reelW + spacing);
      this.ctx.fillStyle = '#060208';
      this.ctx.fillRect(reelX, reelY, reelW, reelH);
      this.ctx.strokeStyle = 'rgba(255, 209, 102, 0.6)';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(reelX, reelY, reelW, reelH);

      // Icon preview
      this.ctx.font = '9px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(icons[i], reelX + reelW / 2, reelY + 15);
    }

    // 5. Coin insert & Paytable Tray
    this.ctx.fillStyle = '#1a0d16';
    this.ctx.fillRect(rx + 8, ry + 48, w - 16, 10);
    this.ctx.strokeStyle = '#ffb703';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(rx + 8, ry + 48, w - 16, 10);

    // Coin slot
    this.ctx.fillStyle = '#ffd166';
    this.ctx.fillRect(rx + w / 2 - 6, ry + 51, 12, 3);

    // 6. Mechanical Lever on the Right
    this.ctx.strokeStyle = '#d4af37';
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(rx + w, ry + 36);
    this.ctx.lineTo(rx + w + 8, ry + 22);
    this.ctx.stroke();

    // Lever red knob
    this.ctx.fillStyle = '#ff0054';
    this.ctx.beginPath();
    this.ctx.arc(rx + w + 8, ry + 20, 4.5, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#ffd166';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // 7. Base Plinth
    this.ctx.fillStyle = '#220b18';
    this.ctx.fillRect(rx - 2, ry + h - 8, w + 4, 8);
    this.ctx.strokeStyle = '#4a1520';
    this.ctx.strokeRect(rx - 2, ry + h - 8, w + 4, 8);

    // 8. Overhead label plate
    this.ctx.font = 'bold 9px Cinzel, serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#ffd166';
    this.ctx.shadowColor = '#000';
    this.ctx.shadowBlur = 4;
    this.ctx.fillText('Ruleta de Armas', rx + w / 2, ry - 14);

    this.ctx.restore();
  }

  drawPortal(portal, camX, camY) {
    const rx = Math.round(portal.x - camX);
    const ry = Math.round(portal.y - camY);

    const time = Date.now() / 300;
    const pulse = Math.sin(time) * 4;

    this.ctx.save();
    // Swirling portal aura
    const grad = this.ctx.createRadialGradient(
      rx + portal.w / 2, ry + portal.h / 2, 5,
      rx + portal.w / 2, ry + portal.h / 2, portal.w + pulse
    );
    grad.addColorStop(0, '#ff1a35');
    grad.addColorStop(0.5, '#6a0dad');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(rx + portal.w / 2, ry + portal.h / 2, portal.w + pulse, 0, Math.PI * 2);
    this.ctx.fill();

    // Portal arch stones
    this.ctx.strokeStyle = '#d4af37';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(rx, ry, portal.w, portal.h);

    // Label
    this.ctx.font = '14px MedievalSharp';
    this.ctx.fillStyle = '#f4d06f';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(portal.label, rx + portal.w / 2, ry - 10);
    this.ctx.restore();
  }

  drawNpc(npc, camX, camY) {
    if (!npc) return;
    const rx = Math.round(npc.x - camX);
    const ry = Math.round(npc.y - camY);

    const frameIdx = Math.floor(Date.now() / 250) % 4;
    const spriteKey = npc.sprite || 'soldier';
    const npcSprites = window.spriteManager && window.spriteManager.sprites ? window.spriteManager.sprites[spriteKey] : null;
    if (npcSprites && npcSprites.idle && npcSprites.idle[frameIdx]) {
      const breathOffset = Math.sin(Date.now() / 450) * 1.8;
      const frame = npcSprites.idle[frameIdx];
      const dw = frame.width / 2;
      const dh = frame.height / 2;
      this.ctx.drawImage(frame, rx, ry + breathOffset, dw, dh);
    }
  }

  getLavaPalette() {
    const theme = this.level ? this.level.lavaTheme : null;
    const levelId = this.level ? this.level.id : '';

    if (theme === 'spectral' || levelId === 'tower1' || levelId === 'tower') {
      return {
        topColor: '#00f5d4',
        midColor: '#0077b6',
        bottomColor: '#03045e',
        waveColor: '#90e0ef',
        glowColor: 'rgba(0, 245, 212, 0.45)',
        bubbleColor: '#a7ffeb'
      };
    } else if (theme === 'acid' || levelId === 'tower2') {
      return {
        topColor: '#ccff33',
        midColor: '#70e000',
        bottomColor: '#004b23',
        waveColor: '#ffff3f',
        glowColor: 'rgba(112, 224, 0, 0.48)',
        bubbleColor: '#e9ff70'
      };
    } else if (theme === 'blood' || levelId === 'tower3') {
      return {
        topColor: '#ff5400',
        midColor: '#ff0054',
        bottomColor: '#3f000c',
        waveColor: '#ffd000',
        glowColor: 'rgba(255, 30, 84, 0.52)',
        bubbleColor: '#ff9ebb'
      };
    }

    // Default / Infernal Hellfire
    return {
      topColor: '#ff4500',
      midColor: '#ff1a00',
      bottomColor: '#660000',
      waveColor: '#ffcc00',
      glowColor: 'rgba(255, 69, 0, 0.45)',
      bubbleColor: '#ffe066'
    };
  }

  drawLava(lavaY, camX, camY) {
    const ry = Math.round(lavaY - camY);
    if (ry > this.vHeight + 50) return;

    const palette = this.getLavaPalette();
    this.ctx.save();

    // Ambient glow above the lava surface
    if (this.ctx.createLinearGradient) {
      const glowH = Math.min(60, Math.max(20, this.vHeight - ry));
      const surfaceGlow = this.ctx.createLinearGradient(0, ry - glowH, 0, ry);
      surfaceGlow.addColorStop(0, 'rgba(0, 0, 0, 0)');
      surfaceGlow.addColorStop(1, palette.glowColor);
      this.ctx.fillStyle = surfaceGlow;
      this.ctx.fillRect(0, ry - glowH, this.vWidth, glowH);
    }

    // Glowing lava body
    if (this.ctx.createLinearGradient) {
      const grad = this.ctx.createLinearGradient(0, ry, 0, this.vHeight);
      grad.addColorStop(0, palette.topColor);
      grad.addColorStop(0.25, palette.midColor);
      grad.addColorStop(1, palette.bottomColor);
      this.ctx.fillStyle = grad;
    } else {
      this.ctx.fillStyle = palette.midColor;
    }
    this.ctx.fillRect(0, ry, this.vWidth, Math.max(0, this.vHeight - ry));

    // Animated boiling surface wave
    this.ctx.fillStyle = palette.waveColor;
    this.ctx.beginPath();
    this.ctx.moveTo(0, ry);
    const time = Date.now() / 220;
    for (let x = 0; x <= this.vWidth; x += 16) {
      const wave = Math.sin(x * 0.04 + time) * 5 + Math.cos(x * 0.02 - time * 0.7) * 3;
      this.ctx.lineTo(x, ry + wave);
    }
    this.ctx.lineTo(this.vWidth, ry + 10);
    this.ctx.lineTo(0, ry + 10);
    this.ctx.fill();

    // Occasional boiling bubbles
    const now = Date.now();
    for (let b = 0; b < 6; b++) {
      const bx = ((now * 0.06 * (b + 1) + b * 160) % this.vWidth);
      const bWave = Math.sin(bx * 0.04 + time) * 4;
      const bRad = 3 + (b % 3);
      this.ctx.fillStyle = palette.bubbleColor;
      this.ctx.beginPath();
      this.ctx.arc(bx, ry + bWave - 2, bRad, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  // ─── INCREMENTAL & ROGUELITE METHODS ───
  spawnSoulOrbs(x, y, count = 2, value = 4, isGolden = false) {
    for (let i = 0; i < count; i++) {
      this.soulOrbs.push(new SoulOrb(x, y, Math.max(1, Math.round(value / count)), isGolden));
    }
  }

  spawnXpGems(x, y, count = 1, value = 12) {
    for (let i = 0; i < count; i++) {
      this.xpGems.push(new XpGem(x, y, Math.max(1, Math.round(value / count))));
    }
  }

  spawnFlameWave(x, y, dir) {
    const stats = window.progression ? window.progression.getPlayerStats() : null;
    const dmg = stats ? stats.swordDamage : 20;
    this.flameWaves.push(new FlameWave(x, y, dir, dmg));
  }

  triggerShockwave(x, y, radius = 140) {
    const stats = window.progression ? window.progression.getPlayerStats() : null;
    const dmg = stats ? stats.swordDamage * 1.5 : 30;

    // Hit enemies
    for (const en of this.enemies) {
      if (!en.isDead) {
        const d = Math.hypot((en.x + en.w / 2) - x, (en.y + en.h / 2) - y);
        if (d < radius) {
          en.hp -= dmg;
          en.x += Math.sign(en.x - x) * 12;
          if (window.particleSystem) window.particleSystem.spawnSlashSparks(en.x + en.w / 2, en.y + en.h / 2, 1);
          if (en.hp <= 0 && !en.hasDropped) {
            en.hasDropped = true;
            en.isDead = true;
            en.state = 'dead';
            if (window.particleSystem) window.particleSystem.spawnBloodExplosion(en.x + en.w / 2, en.y + en.h / 2, 25);
            this.spawnSoulOrbs(en.x + en.w / 2, en.y + en.h / 2, 2, en.isElite ? 14 : 4);
            this.spawnXpGems(en.x + en.w / 2, en.y + en.h / 2, en.isElite ? 2 : 1, en.isElite ? 30 : 15);
          }
        }
      }
    }

    // Hit boss
    if (this.boss && !this.boss.isDead && this.boss.hp > 0) {
      const d = Math.hypot((this.boss.x + this.boss.w / 2) - x, (this.boss.y + this.boss.h / 2) - y);
      if (d < radius) {
        this.boss.takeDamage(dmg, x, window.soundEngine, window.particleSystem);
      }
    }

    // Break urns
    for (const u of this.urns) {
      if (!u.isBroken) {
        const d = Math.hypot((u.x + u.w / 2) - x, (u.y + u.h / 2) - y);
        if (d < radius) {
          const orbs = u.break(window.soundEngine, window.particleSystem);
          if (orbs) this.soulOrbs.push(...orbs);
        }
      }
    }
  }

  openBoonChest(chest) {
    if (!chest || chest.isOpened) return;
    chest.open(window.soundEngine);
    if (chest.isRelic && window.progression) {
      window.progression.addSouls(50);
      window.progression.addHumanityShards(1);
    }
    this.openBoonSelectionModal(chest.isRelic);
  }

  openBoonSelectionModal(isRelic = false) {
    if (!window.progression) return;
    this._isCurrentBoonRelic = isRelic;
    const boons = window.progression.getRandomBoons(3, isRelic);
    if (boons.length === 0) return;

    this.prevStateBeforeModal = this.state;
    this.state = 'BOON_SELECT';
    this.ui.interactionBadge.style.display = 'none';

    // Update modal title for relic chest
    const modalTitle = this.ui.boonModal.querySelector('h2') || this.ui.boonModal.querySelector('.modal-title');
    if (modalTitle) {
      modalTitle.innerHTML = isRelic ? '👑 RELIQUIA DE JEFE DERROTADO' : 'GRACIAS Y ARMAS DEL ABISMO';
    }

    this.renderBoonCards(boons);

    if (this.ui.btnBoonReroll) {
      this.ui.btnBoonReroll.disabled = !window.progression.canReroll();
    }

    this.ui.boonModal.classList.remove('hidden');
  }

  renderBoonCards(boons) {
    if (!this.ui.boonCardsContainer) return;
    this.ui.boonCardsContainer.innerHTML = '';
    for (const b of boons) {
      const card = document.createElement('div');
      card.className = 'boon-card';

      let badgeHtml = '';
      let titleHtml = b.name;
      let btnText = 'Elegir Gracia';

      if (b.isEvolution) {
        badgeHtml = `<span class="boon-rarity" style="background:rgba(255,215,0,0.25);border:1.5px solid #ffd700;color:#ffd700;text-shadow:0 0 10px #ffd700;">★ SUPER EVOLUCIÓN ★</span>`;
        titleHtml = `<span style="color:#ffd700;">${b.name}</span>`;
        btnText = 'Evolucionar';
      } else if (b.isWeapon) {
        const currentLvl = this.passiveWeaponsManager ? this.passiveWeaponsManager.getLevel(b.weaponType) : 0;
        if (currentLvl > 0) {
          badgeHtml = `<span class="boon-rarity weapon-tag">⚔️ MEJORA DE ARMA</span>`;
          titleHtml = `${b.name} <span class="weapon-lvl-tag">Nivel ${currentLvl + 1}</span>`;
          btnText = 'Mejorar Arma';
        } else {
          badgeHtml = `<span class="boon-rarity weapon-tag">⚔️ ARMA PASIVA</span>`;
          titleHtml = `${b.name} <span class="weapon-lvl-tag">Nueva Arma</span>`;
          btnText = 'Empuñar Arma';
        }
      } else if (b.isJoker) {
        badgeHtml = `<span class="boon-rarity" style="background:rgba(181,23,158,0.25);border:1.5px solid #b5179e;color:#f72585;">🃏 ARCANO DEL AVERNO</span>`;
        btnText = 'Equipar Arcano';
      } else if (b.isTome) {
        badgeHtml = `<span class="boon-rarity" style="background:rgba(0,180,216,0.25);border:1.5px solid #00b4d8;color:#90e0ef;">📖 TOMO PASIVO</span>`;
        btnText = 'Aprender Tomo';
      } else if (b.isScratchCard) {
        badgeHtml = `<span class="boon-rarity" style="background:rgba(255,209,102,0.25);border:1.5px solid #ffd166;color:#ffd166;">🎟️ TABLILLA DEL DESTINO</span>`;
        btnText = '¡Raspar Tablilla!';
      } else {
        const rarityClass = b.rarity.toLowerCase() === 'épica' ? 'rarity-epica' : (b.rarity.toLowerCase() === 'rara' ? 'rarity-rara' : 'rarity-comun');
        badgeHtml = `<span class="boon-rarity ${rarityClass}">${b.rarity}</span>`;
      }

      card.innerHTML = `
        ${badgeHtml}
        <div class="boon-icon-large">${b.icon}</div>
        <div class="boon-card-title">${titleHtml}</div>
        <div class="boon-card-desc">${b.desc}</div>
        <button class="btn-choose-boon">${btnText}</button>
      `;

      card.addEventListener('mouseenter', () => {
        if (window.soundEngine) window.soundEngine.playUiHover();
      });

      card.addEventListener('click', () => {
        window.progression.chooseBoon(b);
        this.closeBoonSelectionModal();
      });

      this.ui.boonCardsContainer.appendChild(card);
    }
  }

  closeBoonSelectionModal() {
    this.ui.boonModal.classList.add('hidden');
    this.state = this.prevStateBeforeModal || 'PLAYING';
  }

  // ─── VAMPIRE SURVIVORS LEVEL-UP MODAL & QUEUE ───
  queueLevelUps(count = 1) {
    if (!this.pendingLevelUps) this.pendingLevelUps = 0;
    this.pendingLevelUps += count;
    if (this.state !== 'LEVEL_UP') {
      this.openLevelUpModal();
    }
  }

  openLevelUpModal() {
    if (!window.progression) return;
    if (!this.pendingLevelUps || this.pendingLevelUps < 1) {
      this.pendingLevelUps = 1;
    }

    const boons = window.progression.getRandomBoons(3, false);
    if (boons.length === 0) {
      this.pendingLevelUps = 0;
      return;
    }

    if (this.state !== 'LEVEL_UP') {
      this.prevStateBeforeModal = this.state;
      this.state = 'LEVEL_UP';
    }
    if (this.ui && this.ui.interactionBadge) {
      this.ui.interactionBadge.style.display = 'none';
    }

    if (this.ui && this.ui.modalRunLevel) {
      this.ui.modalRunLevel.textContent = window.progression.runLevel;
    }

    if (window.soundEngine) {
      if (window.soundEngine.playPrestige) window.soundEngine.playPrestige();
      else if (window.soundEngine.playBoonSelect) window.soundEngine.playBoonSelect();
    }

    this.renderLevelUpCards(boons);

    if (this.ui && this.ui.btnLevelupReroll) {
      this.ui.btnLevelupReroll.disabled = !window.progression.canReroll();
    }

    if (this.ui && this.ui.levelUpModal) {
      this.ui.levelUpModal.classList.remove('hidden');
    }
  }

  renderLevelUpCards(boons) {
    if (!this.ui.levelupCardsContainer) return;
    this.ui.levelupCardsContainer.innerHTML = '';

    for (const b of boons) {
      const card = document.createElement('div');
      card.className = 'boon-card';

      let badgeHtml = '';
      let titleHtml = b.name;
      let btnText = 'Elegir';

      if (b.isEvolution) {
        badgeHtml = `<span class="boon-rarity" style="background:rgba(255,215,0,0.25);border:1.5px solid #ffd700;color:#ffd700;text-shadow:0 0 10px #ffd700;">★ SUPER EVOLUCIÓN ★</span>`;
        titleHtml = `<span style="color:#ffd700;">${b.name}</span>`;
        btnText = 'Evolucionar';
      } else if (b.isWeapon) {
        const currentLvl = this.passiveWeaponsManager ? this.passiveWeaponsManager.getLevel(b.weaponType) : 0;
        if (currentLvl > 0) {
          badgeHtml = `<span class="boon-rarity weapon-tag">⚔️ MEJORA DE ARMA</span>`;
          titleHtml = `${b.name} <span class="weapon-lvl-tag">Nivel ${currentLvl + 1}</span>`;
          btnText = 'Mejorar Arma';
        } else {
          badgeHtml = `<span class="boon-rarity weapon-tag">⚔️ ARMA PASIVA</span>`;
          titleHtml = `${b.name} <span class="weapon-lvl-tag">Nueva Arma</span>`;
          btnText = 'Empuñar';
        }
      } else if (b.isJoker) {
        badgeHtml = `<span class="boon-rarity" style="background:rgba(181,23,158,0.25);border:1.5px solid #b5179e;color:#f72585;">🃏 ARCANO DEL AVERNO</span>`;
        btnText = 'Equipar Arcano';
      } else if (b.isTome) {
        badgeHtml = `<span class="boon-rarity" style="background:rgba(0,180,216,0.25);border:1.5px solid #00b4d8;color:#90e0ef;">📖 TOMO PASIVO</span>`;
        btnText = 'Aprender Tomo';
      } else if (b.isScratchCard) {
        badgeHtml = `<span class="boon-rarity" style="background:rgba(255,209,102,0.25);border:1.5px solid #ffd166;color:#ffd166;">🎟️ TABLILLA DEL DESTINO</span>`;
        btnText = '¡Raspar Tablilla!';
      } else {
        const rarityClass = b.rarity.toLowerCase() === 'épica' ? 'rarity-epica' : (b.rarity.toLowerCase() === 'rara' ? 'rarity-rara' : 'rarity-comun');
        badgeHtml = `<span class="boon-rarity ${rarityClass}">${b.rarity}</span>`;
      }

      card.innerHTML = `
        ${badgeHtml}
        <div class="boon-icon-large">${b.icon}</div>
        <div class="boon-card-title">${titleHtml}</div>
        <div class="boon-card-desc">${b.desc}</div>
        <button class="btn-choose-boon">${btnText}</button>
      `;

      card.addEventListener('mouseenter', () => {
        if (window.soundEngine) window.soundEngine.playUiHover();
      });

      card.addEventListener('click', () => {
        window.progression.chooseBoon(b);
        this.closeLevelUpModal();
      });

      this.ui.levelupCardsContainer.appendChild(card);
    }
  }

  closeLevelUpModal() {
    if (this.pendingLevelUps > 1) {
      this.pendingLevelUps--;
      this.openLevelUpModal();
      return;
    }
    this.pendingLevelUps = 0;
    if (this.ui && this.ui.levelUpModal) {
      this.ui.levelUpModal.classList.add('hidden');
    }
    this.state = this.prevStateBeforeModal || 'PLAYING';
  }

  // ─── SCRITCHY SCRATCHY (RASCADOR DEL INFRAMUNDO) ───
  openScratchCardModal(card) {
    if (!card) return;
    this.activeScratchCard = card;
    this.prevStateBeforeModal = this.state;
    this.state = 'SCRATCH_CARD';
    this.ui.interactionBadge.style.display = 'none';

    this.ui.scratchGrid.innerHTML = '';
    this.ui.scratchResultMsg.textContent = '¡Rasca o haz clic en las 3 casillas doradas!';
    this.ui.btnClaimScratch.disabled = true;

    for (let i = 0; i < 3; i++) {
      const cellData = card.cells[i];
      const cell = document.createElement('div');
      cell.className = 'scratch-cell' + (card.scratched[i] ? ' scratched' : '');
      cell.innerHTML = `
        <div class="scratch-foil">
          <span>✨</span>
          <span>RASPAR</span>
        </div>
        <div class="scratch-cell-inner">
          <span class="scratch-cell-icon">${cellData.icon}</span>
          <span class="scratch-cell-label">${cellData.name}</span>
        </div>
      `;

      const scratchOne = () => {
        if (card.scratched[i]) return;
        card.scratched[i] = true;
        cell.classList.add('scratched');
        if (window.soundEngine && window.soundEngine.playSwordSlash) {
          window.soundEngine.playSwordSlash();
        }
        if (window.particleSystem) {
          window.particleSystem.spawnDust(this.vWidth / 2 + (i - 1) * 80, this.vHeight / 2, 8);
        }

        const scratchedCount = card.scratched.filter(s => s).length;
        if (scratchedCount === 3) {
          this.ui.btnClaimScratch.disabled = false;
          if (card.isJackpot) {
            this.ui.scratchResultMsg.innerHTML = '🎉 ¡¡JACKPOT TRIPLE!! ¡Premio multiplicado ×4!';
            if (window.particleSystem) {
              window.particleSystem.triggerScreenShake(0.35, 7);
              window.particleSystem.spawnTeleportSparks(this.vWidth / 2, this.vHeight / 2);
            }
            if (window.soundEngine && window.soundEngine.playPrestige) {
              window.soundEngine.playPrestige();
            }
          } else {
            this.ui.scratchResultMsg.innerHTML = '✨ ¡Casillas reveladas! Reclama tu botín.';
          }
        }
      };

      cell.addEventListener('click', scratchOne);
      this.ui.scratchGrid.appendChild(cell);
    }

    this.ui.btnScratchAll.onclick = () => {
      const cells = this.ui.scratchGrid.querySelectorAll('.scratch-cell');
      cells.forEach((c, idx) => {
        card.scratched[idx] = true;
        c.classList.add('scratched');
      });
      this.ui.btnClaimScratch.disabled = false;
      if (card.isJackpot) {
        this.ui.scratchResultMsg.innerHTML = '🎉 ¡¡JACKPOT TRIPLE!! ¡Premio multiplicado ×4!';
        if (window.particleSystem) {
          window.particleSystem.triggerScreenShake(0.35, 7);
        }
        if (window.soundEngine && window.soundEngine.playPrestige) window.soundEngine.playPrestige();
      } else {
        this.ui.scratchResultMsg.innerHTML = '✨ ¡Casillas reveladas! Reclama tu botín.';
      }
    };

    this.ui.btnClaimScratch.onclick = () => {
      const reward = window.progression.claimScratchReward(card);
      if (window.soundEngine && window.soundEngine.playSoulPickup) {
        window.soundEngine.playSoulPickup();
      }
      this.closeScratchCardModal();
    };

    this.ui.scratchCardModal.classList.remove('hidden');
  }

  closeScratchCardModal() {
    if (this.ui.scratchCardModal) this.ui.scratchCardModal.classList.add('hidden');
    this.state = this.prevStateBeforeModal || 'PLAYING';
  }

  // ─── PASSIVE WEAPONS HELPERS ───
  acquireOrUpgradePassiveWeapon(type) {
    if (this.passiveWeaponsManager) {
      return this.passiveWeaponsManager.acquireOrUpgrade(type);
    }
  }

  getPassiveWeaponLevel(type) {
    if (this.passiveWeaponsManager) {
      return this.passiveWeaponsManager.getLevel(type);
    }
    return 0;
  }

  resetPassiveWeapons() {
    if (this.passiveWeaponsManager) {
      this.passiveWeaponsManager.reset();
    }
  }

  toggleSanctuaryModal() {
    if (this.state === 'SANCTUARY') {
      this.closeSanctuaryModal();
    } else {
      if (this.level && (this.level.id === 'prologue' || this.nearSanctuary)) {
        this.openSanctuaryModal();
      }
    }
  }

  openSanctuaryModal() {
    // Only accessible in the lobby / near the sanctuary altar
    if (this.level && this.level.id !== 'prologue' && !this.nearSanctuary) return;
    this.prevStateBeforeSanctuary = this.state;
    this.state = 'SANCTUARY';
    this.renderSanctuaryWallet();
    this.renderSanctuaryUpgrades();
    this.renderSanctuaryPrestige();
    this.ui.sanctuaryModal.classList.remove('hidden');
  }

  closeSanctuaryModal() {
    this.ui.sanctuaryModal.classList.add('hidden');
    if (this.player) {
      this.player.applyProgressionStats();
    }
    this.state = this.prevStateBeforeSanctuary || 'PLAYING';
  }

  renderSanctuaryWallet() {
    if (!window.progression) return;
    const soulsEl = document.getElementById('sanctuary-souls');
    const shardsEl = document.getElementById('sanctuary-shards');
    const ashesEl = document.getElementById('sanctuary-ashes');
    const multEl = document.getElementById('sanctuary-mult');

    if (soulsEl) soulsEl.textContent = Math.floor(window.progression.souls);
    if (shardsEl) shardsEl.textContent = window.progression.humanityShards;
    if (ashesEl) ashesEl.textContent = window.progression.penitenceAshes;
    if (multEl) {
      const mult = Math.round((window.progression.getPrestigeMultiplier() - 1.0) * 100);
      multEl.textContent = `+${mult}%`;
    }
  }

  renderSanctuaryUpgrades() {
    if (!window.progression || !this.ui.upgradesGrid) return;
    this.ui.upgradesGrid.innerHTML = '';

    const defs = window.progression.upgradeDefinitions;
    for (const key in defs) {
      const def = defs[key];
      const currentLvl = window.progression.upgrades[key];
      const isMax = currentLvl >= def.maxLvl;
      const cost = window.progression.getUpgradeCost(key);
      const canBuy = window.progression.canBuyUpgrade(key);
      const currencyIcon = def.currency === 'humanityShards' ? '💠' : '🔮';

      const card = document.createElement('div');
      card.className = `upgrade-card ${isMax ? 'is-maxed' : ''}`;
      card.innerHTML = `
        <div class="upgrade-icon-box">${def.icon}</div>
        <div class="upgrade-center">
          <div class="upgrade-header">
            <span class="upgrade-name">${def.name}</span>
            <span class="upgrade-level-tag">${isMax ? 'MÁXIMO' : `Nv. ${currentLvl}/${def.maxLvl}`}</span>
          </div>
          <div class="upgrade-bar-wrap">
            <div class="upgrade-bar-fill" style="width: ${Math.round((currentLvl / def.maxLvl) * 100)}%;"></div>
          </div>
          <div class="upgrade-desc">${def.desc}</div>
        </div>
        <div class="upgrade-right">
          <button class="btn-upgrade-action ${isMax ? 'maxed' : (canBuy ? 'affordable' : 'unaffordable')}" ${isMax || !canBuy ? 'disabled' : ''}>
            ${isMax ? '<span class="btn-cost">✔ MÁX</span>' : `
              <span class="btn-cost">${currencyIcon} ${cost}</span>
              <span class="btn-action-text">${canBuy ? 'Mejorar' : 'Faltan'}</span>
            `}
          </button>
        </div>
      `;

      const buyBtn = card.querySelector('.btn-upgrade-action');
      if (buyBtn && !isMax) {
        buyBtn.addEventListener('mouseenter', () => {
          if (window.soundEngine && window.soundEngine.playUiHover) window.soundEngine.playUiHover();
        });
        buyBtn.addEventListener('click', () => {
          if (window.progression.buyUpgrade(key)) {
            this.renderSanctuaryWallet();
            this.renderSanctuaryUpgrades();
            this.renderSanctuaryPrestige();
            if (this.player) this.player.applyProgressionStats();
          }
        });
      }

      this.ui.upgradesGrid.appendChild(card);
    }
  }

  // ─── RULETA DE ARMAS (SLOT MACHINE) SYSTEM ───
  openSlotMachineModal() {
    if (this.level && this.level.id !== 'prologue' && !this.nearSlotMachine) return;
    this.prevStateBeforeSlot = this.state;
    this.state = 'SLOT_MACHINE';
    this.updateSlotMachineUI();
    ['slot-reel-1', 'slot-reel-2', 'slot-reel-3'].forEach(id => {
      const w = document.getElementById(id);
      if (w) w.classList.remove('winner', 'match-two', 'no-match');
    });
    if (this.ui.slotMachineModal) {
      this.ui.slotMachineModal.classList.remove('hidden');
    }
  }

  closeSlotMachineModal() {
    if (this.ui.slotMachineModal) {
      this.ui.slotMachineModal.classList.add('hidden');
    }
    this.state = this.prevStateBeforeSlot || 'PLAYING';
  }

  updateSlotMachineUI() {
    if (!window.progression) return;
    if (this.ui.slotPlayerSouls) {
      this.ui.slotPlayerSouls.textContent = Math.floor(window.progression.souls);
    }
    if (this.ui.slotCurrentWeapons && this.passiveWeaponsManager) {
      const active = this.passiveWeaponsManager.getActiveVisuals();
      if (active.totalEquipped === 0) {
        this.ui.slotCurrentWeapons.textContent = 'Ninguna equipada';
      } else {
        const weaponNames = [];
        if (active.hasHolyCross) weaponNames.push('Cruces ✝️');
        if (active.hasHellfireOrb) weaponNames.push('Orbe ☄️');
        if (active.hasLightning) weaponNames.push('Rayos ⚡');
        if (active.hasScythe) weaponNames.push('Guadaña 🪓');
        if (active.hasGarlic) weaponNames.push('Penitencia 📿');
        this.ui.slotCurrentWeapons.textContent = weaponNames.join(', ');
      }
    }
  }

  spinSlotMachine() {
    if (this.isSlotSpinning) return;
    const cost = 80;

    if (!window.progression || window.progression.souls < cost) {
      if (this.ui.slotStatusBox) {
        this.ui.slotStatusBox.innerHTML = '<span style="color:#ff4d6d;">⚠️ ¡No tienes suficientes almas! Se requieren 80 🔮 para forjar el destino.</span>';
      }
      if (window.soundEngine && window.soundEngine.playHit) {
        window.soundEngine.playHit();
      }
      return;
    }

    // Deduct souls
    window.progression.souls -= cost;
    window.progression.save();
    this.updateSlotMachineUI();
    this.renderSanctuaryWallet();

    this.isSlotSpinning = true;
    if (this.ui.btnSpinSlot) this.ui.btnSpinSlot.disabled = true;

    // Lever pull animation
    const leverShaft = document.getElementById('slot-lever-shaft');
    if (leverShaft) {
      leverShaft.classList.add('pulling');
      setTimeout(() => leverShaft.classList.remove('pulling'), 450);
    }
    if (window.soundEngine && window.soundEngine.playSlotLever) {
      window.soundEngine.playSlotLever();
    }

    if (this.ui.slotStatusBox) {
      this.ui.slotStatusBox.innerHTML = '⚡ <i>Girando los rodillos del Averno... ¿Qué bendición te aguarda?</i>';
    }

    // Available starting weapons (7 autonomous relics)
    const weaponSymbols = [
      { id: 'holy_cross', name: 'Cruces de Luz', icon: '✝️', isWeapon: true },
      { id: 'hellfire_orb', name: 'Orbe del Averno', icon: '☄️', isWeapon: true },
      { id: 'celestial_lightning', name: 'Ira del Cielo', icon: '⚡', isWeapon: true },
      { id: 'death_scythe', name: 'Guadaña Espectral', icon: '🪓', isWeapon: true },
      { id: 'blood_garlic', name: 'Aura de Penitencia', icon: '📿', isWeapon: true },
      { id: 'spectral_javelin', name: 'Lanza Espectral', icon: '🔱', isWeapon: true },
      { id: 'infernal_chakram', name: 'Chakram del Averno', icon: '🌀', isWeapon: true }
    ];

    // Non-weapon / special symbols
    const bonusSymbols = [
      { id: 'jackpot_crown', name: 'Corona Imperial', icon: '👑', isJackpot: true },
      { id: 'soul_urn', name: 'Cáliz de Almas', icon: '🔮', isSouls: true },
      { id: 'cursed_skull', name: 'Calavera Maldita', icon: '💀', isSkull: true }
    ];

    const allSymbols = [...weaponSymbols, ...bonusSymbols];

    // Truly randomized outcomes with balanced rogue-lite odds:
    // ~5%: Triple Crown Jackpot (👑 👑 👑)
    // ~27%: Triple Weapon Win (W W W) -> Grants starting weapon
    // ~6%: Triple Soul Urn (🔮 🔮 🔮) -> Wins 160 souls
    // ~34%: Two-of-a-kind (Near Miss, e.g. W W X) -> Consolation 25 souls
    // ~28%: Three different symbols (Miss, A B C) -> No prize
    const roll = Math.random();
    let finalSymbols = [];
    let outcomeType = ''; // 'jackpot', 'weapon_win', 'souls_win', 'two_match', 'miss'
    let matchedSymbol = null;

    if (roll < 0.05) {
      // 1. Triple Crown Jackpot
      const crown = bonusSymbols.find(s => s.id === 'jackpot_crown');
      finalSymbols = [crown, crown, crown];
      outcomeType = 'jackpot';
      matchedSymbol = crown;
    } else if (roll < 0.32) {
      // 2. Triple Weapon Match
      const chosenWeapon = weaponSymbols[Math.floor(Math.random() * weaponSymbols.length)];
      finalSymbols = [chosenWeapon, chosenWeapon, chosenWeapon];
      outcomeType = 'weapon_win';
      matchedSymbol = chosenWeapon;
    } else if (roll < 0.38) {
      // 3. Triple Soul Urn
      const urn = bonusSymbols.find(s => s.id === 'soul_urn');
      finalSymbols = [urn, urn, urn];
      outcomeType = 'souls_win';
      matchedSymbol = urn;
    } else if (roll < 0.72) {
      // 4. Two Matching, 1 Different (Near Miss!)
      outcomeType = 'two_match';
      const baseSym = Math.random() < 0.80
        ? weaponSymbols[Math.floor(Math.random() * weaponSymbols.length)]
        : bonusSymbols[Math.floor(Math.random() * bonusSymbols.length)];
      matchedSymbol = baseSym;

      const remainingSymbols = allSymbols.filter(s => s.id !== baseSym.id);
      const diffSym = remainingSymbols[Math.floor(Math.random() * remainingSymbols.length)];

      const patternRoll = Math.random();
      if (patternRoll < 0.55) {
        finalSymbols = [baseSym, baseSym, diffSym]; // [A, A, B]
      } else if (patternRoll < 0.78) {
        finalSymbols = [baseSym, diffSym, baseSym]; // [A, B, A]
      } else {
        finalSymbols = [diffSym, baseSym, baseSym]; // [B, A, A]
      }
    } else {
      // 5. Total Miss (3 distinct symbols)
      outcomeType = 'miss';
      const shuffled = [...allSymbols].sort(() => 0.5 - Math.random());
      finalSymbols = [shuffled[0], shuffled[1], shuffled[2]];
    }

    const reel1 = document.getElementById('reel-strip-1');
    const reel2 = document.getElementById('reel-strip-2');
    const reel3 = document.getElementById('reel-strip-3');
    const reelWindow1 = document.getElementById('slot-reel-1');
    const reelWindow2 = document.getElementById('slot-reel-2');
    const reelWindow3 = document.getElementById('slot-reel-3');

    // Reset visual classes
    [reelWindow1, reelWindow2, reelWindow3].forEach(w => {
      if (w) w.classList.remove('winner', 'match-two', 'no-match');
    });

    if (reel1) reel1.classList.add('spinning');
    if (reel2) reel2.classList.add('spinning');
    if (reel3) reel3.classList.add('spinning');

    let isReel1Spinning = true;
    let isReel2Spinning = true;
    let isReel3Spinning = true;

    // Continuous ratchet sound and symbol flicker animation
    const tickInterval = setInterval(() => {
      if (window.soundEngine && window.soundEngine.playSlotReelTick) {
        window.soundEngine.playSlotReelTick();
      }
      if (isReel1Spinning && reel1) {
        const rand = allSymbols[Math.floor(Math.random() * allSymbols.length)];
        reel1.innerHTML = `<div class="slot-symbol">${rand.icon}</div>`;
      }
      if (isReel2Spinning && reel2) {
        const rand = allSymbols[Math.floor(Math.random() * allSymbols.length)];
        reel2.innerHTML = `<div class="slot-symbol">${rand.icon}</div>`;
      }
      if (isReel3Spinning && reel3) {
        const rand = allSymbols[Math.floor(Math.random() * allSymbols.length)];
        reel3.innerHTML = `<div class="slot-symbol">${rand.icon}</div>`;
      }
    }, 70);

    // Stop Reel 1 at 1.0s
    setTimeout(() => {
      isReel1Spinning = false;
      if (reel1) {
        reel1.classList.remove('spinning');
        reel1.innerHTML = `<div class="slot-symbol">${finalSymbols[0].icon}</div>`;
      }
      if (window.soundEngine && window.soundEngine.playSlotReelStop) {
        window.soundEngine.playSlotReelStop();
      }
    }, 1000);

    // Stop Reel 2 at 1.65s
    setTimeout(() => {
      isReel2Spinning = false;
      if (reel2) {
        reel2.classList.remove('spinning');
        reel2.innerHTML = `<div class="slot-symbol">${finalSymbols[1].icon}</div>`;
      }
      if (window.soundEngine && window.soundEngine.playSlotReelStop) {
        window.soundEngine.playSlotReelStop();
      }
      if (finalSymbols[0].id === finalSymbols[1].id && this.ui.slotStatusBox) {
        this.ui.slotStatusBox.innerHTML = `⚡ <b style="color:#00f5d4;">¡Dos ${finalSymbols[0].icon} iguales!</b> <i>¿Saldrá la tercera runa...?</i>`;
      }
    }, 1650);

    // Stop Reel 3 at 2.35s & Evaluate
    setTimeout(() => {
      isReel3Spinning = false;
      clearInterval(tickInterval);
      if (reel3) {
        reel3.classList.remove('spinning');
        reel3.innerHTML = `<div class="slot-symbol">${finalSymbols[2].icon}</div>`;
      }
      if (window.soundEngine && window.soundEngine.playSlotReelStop) {
        window.soundEngine.playSlotReelStop();
      }

      // Process Result
      if (outcomeType === 'jackpot') {
        [reelWindow1, reelWindow2, reelWindow3].forEach(w => w && w.classList.add('winner'));
        const chosen = weaponSymbols[Math.floor(Math.random() * weaponSymbols.length)];
        if (this.passiveWeaponsManager) {
          this.passiveWeaponsManager.acquireOrUpgrade(chosen.id);
        }
        if (window.progression) {
          window.progression.addSouls(100);
        }
        if (window.soundEngine && window.soundEngine.playSlotJackpot) {
          window.soundEngine.playSlotJackpot();
        }
        if (window.particleSystem) {
          window.particleSystem.triggerScreenShake(0.35, 8);
          window.particleSystem.spawnFloatingText(`👑 ¡GRAN JACKPOT!`, this.player ? this.player.x + 12 : 1170, this.player ? this.player.y - 20 : 330, { isMegabonk: true });
        }
        if (this.ui.slotStatusBox) {
          this.ui.slotStatusBox.innerHTML = `👑 <b style="color:#ffd700;">¡TRIPLE CORONA! ¡GRAN JACKPOT!</b> Has obtenido <b>${chosen.name} ${chosen.icon}</b> + 100 🔮 de bonificación.`;
        }
      } else if (outcomeType === 'weapon_win') {
        [reelWindow1, reelWindow2, reelWindow3].forEach(w => w && w.classList.add('winner'));
        if (this.passiveWeaponsManager) {
          this.passiveWeaponsManager.acquireOrUpgrade(matchedSymbol.id);
        }
        if (window.soundEngine && window.soundEngine.playSlotJackpot) {
          window.soundEngine.playSlotJackpot();
        }
        if (window.particleSystem) {
          window.particleSystem.spawnFloatingText(`✨ ¡${matchedSymbol.name.toUpperCase()}!`, this.player ? this.player.x + 12 : 1170, this.player ? this.player.y - 20 : 330, { isMegabonk: true });
        }
        if (this.ui.slotStatusBox) {
          this.ui.slotStatusBox.innerHTML = `✨ <b style="color:#00f5d4;">¡TRIPLE COINCIDENCIA!</b> Has ganado: <b>${matchedSymbol.name} ${matchedSymbol.icon}</b> para iniciar tu run.`;
        }
      } else if (outcomeType === 'souls_win') {
        [reelWindow1, reelWindow2, reelWindow3].forEach(w => w && w.classList.add('winner'));
        if (window.progression) {
          window.progression.addSouls(160);
        }
        if (window.soundEngine && window.soundEngine.playSlotJackpot) {
          window.soundEngine.playSlotJackpot();
        }
        if (window.particleSystem) {
          window.particleSystem.spawnFloatingText(`+160 🔮`, this.player ? this.player.x + 12 : 1170, this.player ? this.player.y - 20 : 330, { isMegabonk: true });
        }
        if (this.ui.slotStatusBox) {
          this.ui.slotStatusBox.innerHTML = `🔮 <b style="color:#a78bfa;">¡TRIPLE CÁLIZ DE ALMAS!</b> Has ganado <b>160 🔮</b> (¡el doble de tu ofrenda!).`;
        }
      } else if (outcomeType === 'two_match') {
        // Highlight the 2 matching reels and dim the 3rd
        finalSymbols.forEach((s, idx) => {
          const w = [reelWindow1, reelWindow2, reelWindow3][idx];
          if (w) {
            if (s.id === matchedSymbol.id) w.classList.add('match-two');
            else w.classList.add('no-match');
          }
        });
        const consolationSouls = 25;
        if (window.progression) {
          window.progression.addSouls(consolationSouls);
        }
        if (window.soundEngine && window.soundEngine.playSlotNearMiss) {
          window.soundEngine.playSlotNearMiss();
        } else if (window.soundEngine && window.soundEngine.playSoulPickup) {
          window.soundEngine.playSoulPickup();
        }
        if (window.particleSystem) {
          window.particleSystem.spawnFloatingText(`+25 🔮 Consuelo`, this.player ? this.player.x + 12 : 1170, this.player ? this.player.y - 20 : 330);
        }
        if (this.ui.slotStatusBox) {
          this.ui.slotStatusBox.innerHTML = `🥈 <b style="color:#ffd166;">¡CASI! 2 coincidencias de ${matchedSymbol.name} ${matchedSymbol.icon}</b>. La tercera runa fue distinta. No obtienes el arma, pero recuperas <b>${consolationSouls} 🔮</b> de consuelo.`;
        }
      } else {
        // Total Miss
        [reelWindow1, reelWindow2, reelWindow3].forEach(w => w && w.classList.add('no-match'));
        if (window.soundEngine && window.soundEngine.playSlotLose) {
          window.soundEngine.playSlotLose();
        } else if (window.soundEngine && window.soundEngine.playHit) {
          window.soundEngine.playHit();
        }
        if (window.particleSystem) {
          window.particleSystem.spawnFloatingText(`Sin suerte`, this.player ? this.player.x + 12 : 1170, this.player ? this.player.y - 20 : 330);
        }
        if (this.ui.slotStatusBox) {
          this.ui.slotStatusBox.innerHTML = `💀 <span style="color:#ff6b6b;"><b>Sin coincidencias.</b> Los rodillos mostraron runas dispares. ¡Vuelve a tirar si deseas probar tu destino!</span>`;
        }
      }

      this.updateSlotMachineUI();
      this.renderSanctuaryWallet();
      this.isSlotSpinning = false;
      if (this.ui.btnSpinSlot) this.ui.btnSpinSlot.disabled = false;
    }, 2350);
  }

  renderSanctuaryPrestige() {
    if (!window.progression) return;
    const currentAshesEl = document.getElementById('prestige-current-ashes');
    const pendingAshesEl = document.getElementById('prestige-pending-ashes');

    if (currentAshesEl) currentAshesEl.textContent = window.progression.penitenceAshes;
    const pending = window.progression.calculatePendingAshes();
    if (pendingAshesEl) pendingAshesEl.textContent = `+${pending} Cenizas`;

    if (this.ui.btnPerformPrestige) {
      this.ui.btnPerformPrestige.disabled = pending < 1;
      this.ui.btnPerformPrestige.textContent = pending >= 1
        ? `Sacrificar Almas y Renacer (+${pending} Cenizas)`
        : 'Se requieren más almas para realizar la Penitencia';
    }
  }

  // ─── COMPLETE STATS & PROGRESS HARD RESET ───
  resetAllProgress() {
    if (window.progression) {
      window.progression.resetAllProgress();
    }
    this.deathCount = 0;
    try {
      localStorage.setItem('infernal_rise_deaths', '0');
    } catch (e) {}
    this.updateDeathCounterUI();

    if (this.passiveWeaponsManager) {
      this.passiveWeaponsManager.reset();
    }
    if (this.player) {
      this.player.applyProgressionStats();
      this.player.hp = this.player.maxHp;
    }

    this.renderSanctuaryWallet();
    this.renderSanctuaryUpgrades();
    this.renderSanctuaryPrestige();
    this.updateMainMenuStats();

    const toast = document.getElementById('reset-toast');
    if (toast) {
      toast.classList.remove('hidden');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 2600);
    }

    if (window.soundEngine && window.soundEngine.playMeteorExplosion) {
      window.soundEngine.playMeteorExplosion();
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
  window.game.init();
});
