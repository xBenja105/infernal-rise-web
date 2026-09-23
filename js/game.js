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
      dash: false,
      interact: false
    };

    // Entities & Interactables
    this.player = null;
    this.enemies = [];
    this.bats = [];
    this.enemyProjectiles = [];
    this.boss = null;
    this.bossProjectiles = [];
    this.hermitMerchant = null;
    this.nearHermitMerchant = false;
    this.nearChallengeShrine = false;
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
    this.crackedWalls = [];
    this.bloodAltars = [];
    this.activeBloodAltar = null;
    this.nearBloodAltar = false;
    this.currentBloodAltar = null;
    this.offeredCursedBoon = null;
    this.flameWaves = [];
    this.activeChest = null;
    this.pendingLevelUps = 0;
    this.lastReportedAltitude = 0;

    // Vampire Survivors style Passive Auto-Attacking Weapons
    this.passiveWeaponsManager = new window.PassiveWeaponsManager(this);

    // Cinematic Cutscenes Manager (Awakening, Boss Intros, Surface Ending)
    this.cutsceneManager = window.CutsceneManager ? new window.CutsceneManager(this) : null;
    window.cutsceneManager = this.cutsceneManager;

    // Meteors timer
    this.meteorTimer = 0;

    // Ambient atmospheric particles (biome-specific)
    this.ambientParticles = [];
    this.ambientEmbers = this.ambientParticles;
    this.initAmbientParticles('abyss');

    // Dialogue trigger flag
    this.hasTriggeredBossDialogue = false;

    // Gamepad & Input Device State
    this.gamepadIndex = null;
    this.lastInputDevice = 'keyboard'; // 'keyboard' | 'gamepad'
    this.gamepadPrevButtons = {};
    this.vibrationEnabled = localStorage.getItem('infernal_rise_rumble') !== '0';

    // Hit-stop, Screen Shake & Cinematic Polish
    this.hitStopTimer = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.shakeDuration = 0;
    this.shakeMaxDuration = 0;
    this.shakeIntensity = 0;
    this.shakeSetting = Number.parseFloat(localStorage.getItem('infernal_rise_shake') || '1.0');
    this.slowMoTimer = 0;
    this.timeScale = 1.0;
    this.whiteFlashAlpha = 0;

    // Customizable Keybindings
    const savedBinds = localStorage.getItem('infernal_rise_keybindings');
    this.keybindings = savedBinds ? JSON.parse(savedBinds) : {
      left: ['KeyA', 'ArrowLeft'],
      right: ['KeyD', 'ArrowRight'],
      up: ['KeyW', 'ArrowUp'],
      down: ['KeyS', 'ArrowDown'],
      jump: ['Space'],
      attack: ['KeyZ', 'KeyJ'],
      dash: ['ShiftLeft', 'ShiftRight', 'KeyK'],
      interact: ['KeyE']
    };
    if (!this.keybindings.dash) {
      this.keybindings.dash = ['ShiftLeft', 'ShiftRight', 'KeyK'];
    }
    this.rebindingAction = null;

    // UI elements
    this.ui = {
      hud: document.getElementById('hud'),
      mainMenu: document.getElementById('main-menu'),
      menuViewHome: document.getElementById('menu-view-home'),
      menuViewCodex: document.getElementById('menu-view-codex'),
      menuViewSettings: document.getElementById('menu-view-settings'),
      menuViewAchievements: document.getElementById('menu-view-achievements'),
      menuViewWardrobe: document.getElementById('menu-view-wardrobe'),
      btnOpenCodex: document.getElementById('btn-open-codex'),
      btnOpenSettings: document.getElementById('btn-open-settings'),
      btnOpenAchievements: document.getElementById('btn-open-achievements'),
      btnOpenWardrobe: document.getElementById('btn-open-wardrobe'),
      btnBackCodex: document.getElementById('btn-back-codex'),
      btnBackSettings: document.getElementById('btn-back-settings'),
      btnBackAchievements: document.getElementById('btn-back-achievements'),
      btnBackWardrobe: document.getElementById('btn-back-wardrobe'),
      wardrobeGrid: document.getElementById('wardrobe-grid'),
      tabCodexGuide: document.getElementById('tab-codex-guide'),
      tabCodexBestiary: document.getElementById('tab-codex-bestiary'),
      codexGuideContent: document.getElementById('codex-guide-content'),
      codexBestiaryContent: document.getElementById('codex-bestiary-content'),
      bestiaryGrid: document.getElementById('bestiary-grid'),
      btnToggleLanguage: document.getElementById('btn-toggle-language'),
      sliderScreenShake: document.getElementById('slider-screen-shake'),
      labelScreenShake: document.getElementById('label-screen-shake'),
      pauseSliderScreenShake: document.getElementById('pause-slider-screen-shake'),
      pauseLabelScreenShake: document.getElementById('pause-label-screen-shake'),
      keybindingsList: document.getElementById('keybindings-list'),
      btnResetKeybindings: document.getElementById('btn-reset-keybindings'),
      deathRunSummary: document.getElementById('death-run-summary'),
      victoryRunSummary: document.getElementById('victory-run-summary'),
      btnCopyDeathRecord: document.getElementById('btn-copy-death-record'),
      btnCopyVictoryRecord: document.getElementById('btn-copy-victory-record'),
      achievementsGrid: document.getElementById('achievements-grid'),
      achievementsBarFill: document.getElementById('achievements-bar-fill'),
      achievementsCountText: document.getElementById('achievements-count-text'),

      // Settings Audio Sliders & Controls
      sliderVolMaster: document.getElementById('slider-vol-master'),
      sliderVolSfx: document.getElementById('slider-vol-sfx'),
      sliderVolMusic: document.getElementById('slider-vol-music') || document.getElementById('slider-vol-bgm'),
      valVolMaster: document.getElementById('label-vol-master') || document.getElementById('val-vol-master'),
      valVolSfx: document.getElementById('label-vol-sfx') || document.getElementById('val-vol-sfx'),
      valVolMusic: document.getElementById('label-vol-music') || document.getElementById('val-vol-bgm'),
      toggleFullscreen: document.getElementById('toggle-fullscreen') || document.getElementById('btn-toggle-fullscreen'),
      toggleRumble: document.getElementById('toggle-rumble') || document.getElementById('btn-toggle-rumble'),
      btnExportSave: document.getElementById('btn-export-save'),
      btnImportSaveTrigger: document.getElementById('btn-import-save-trigger'),
      inputImportSave: document.getElementById('input-import-save'),

      // In-Game Pause Settings Modal
      btnPauseSettings: document.getElementById('btn-pause-settings'),
      modalIngameSettings: document.getElementById('modal-ingame-settings'),
      btnCloseIngameSettings: document.getElementById('btn-close-ingame-settings'),
      pauseSliderVolMaster: document.getElementById('pause-slider-vol-master'),
      pauseSliderVolSfx: document.getElementById('pause-slider-vol-sfx'),
      pauseSliderVolMusic: document.getElementById('pause-slider-vol-music') || document.getElementById('pause-slider-vol-bgm'),
      pauseValVolMaster: document.getElementById('pause-label-vol-master') || document.getElementById('pause-val-vol-master'),
      pauseValVolSfx: document.getElementById('pause-label-vol-sfx') || document.getElementById('pause-val-vol-sfx'),
      pauseValVolMusic: document.getElementById('pause-label-vol-music') || document.getElementById('pause-val-vol-bgm'),

      // Achievements Toast Container
      achievementToastContainer: document.getElementById('achievement-toast-container'),

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

      // Ruleta de Armas (Slot Machine) Modal
      slotMachineModal: document.getElementById('slot-machine-modal'),
      btnSpinSlot: document.getElementById('btn-spin-slot'),
      btnCloseSlot: document.getElementById('btn-close-slot'),
      btnSlotStartRun: document.getElementById('btn-slot-start-run'),
      slotLeverHitbox: document.getElementById('slot-lever-hitbox'),
      slotStatusBox: document.getElementById('slot-status-box'),
      slotCurrentWeapons: document.getElementById('slot-current-weapons'),

      // Hermit Haven Shop Modal
      hermitShopModal: document.getElementById('hermit-shop-modal'),
      hermitShopGrid: document.getElementById('hermit-shop-grid'),
      hermitShopSouls: document.getElementById('hermit-shop-souls'),
      hermitShopHp: document.getElementById('hermit-shop-hp'),
      hermitShopRelicsCount: document.getElementById('hermit-shop-relics-count'),
      btnCloseHermitShop: document.getElementById('btn-close-hermit-shop'),
      btnHermitShopDone: document.getElementById('btn-hermit-shop-done'),

      // Blood Altar Modal
      bloodAltarModal: document.getElementById('blood-altar-modal'),
      btnCloseBloodAltar: document.getElementById('btn-close-blood-altar'),
      btnBloodAltarDecline: document.getElementById('btn-blood-altar-decline'),
      btnPactSouls: document.getElementById('btn-pact-souls'),
      btnPactCurse: document.getElementById('btn-pact-curse'),
      bloodAltarCurrentHp: document.getElementById('blood-altar-current-hp'),
      bloodAltarSouls: document.getElementById('blood-altar-souls'),
      bloodAltarBoonName: document.getElementById('blood-altar-boon-name'),

      // Mobile Touch Elements
      btnTouchPause: document.getElementById('btn-touch-pause'),
      virtualControls: document.getElementById('virtual-controls'),
      btnTouchInteract: document.getElementById('btn-touch-interact'),

      // Radar Vertical de Torre (Minimapa)
      towerRadar: document.getElementById('tower-radar'),
      radarMarkers: document.getElementById('radar-markers'),
      radarPlayerMarker: document.getElementById('radar-player-marker'),
      radarAltitudeText: document.getElementById('radar-altitude-text'),
      radarGoalIcon: document.getElementById('radar-goal-icon')
    };

    this.modalInputCooldownUntil = 0;
    this.lastTime = 0;
    this.updateMouseCursor();
  }

  get state() {
    return this._state;
  }

  set state(val) {
    this._state = val;
    this.updateVirtualControlsVisibility();
    this.updateMouseCursor();
    this.updateTowerRadar();
  }

  updateMouseCursor() {
    if (typeof document === 'undefined') return;
    const isPlaying = (this._state === 'PLAYING');
    if (isPlaying) {
      document.body.classList.add('cursor-hidden');
      const gameContainer = document.getElementById('game-container');
      if (gameContainer) gameContainer.classList.add('cursor-hidden');
      if (this.canvas) this.canvas.classList.add('cursor-hidden');
    } else {
      document.body.classList.remove('cursor-hidden');
      const gameContainer = document.getElementById('game-container');
      if (gameContainer) gameContainer.classList.remove('cursor-hidden');
      if (this.canvas) this.canvas.classList.remove('cursor-hidden');
    }
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
    // Gamepad Connection Listeners
    window.addEventListener('gamepadconnected', (e) => {
      this.gamepadIndex = e.gamepad.index;
      this.lastInputDevice = 'gamepad';
      this.updateInputPrompts('gamepad');
      this.triggerGamepadRumble(150, 0.3, 0.5);
      console.log(`[Gamepad Connected] ${e.gamepad.id} at index ${e.gamepad.index}`);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log(`[Gamepad Disconnected] index ${e.gamepad.index}`);
      if (this.gamepadIndex === e.gamepad.index) {
        this.gamepadIndex = null;
        this.lastInputDevice = 'keyboard';
        this.updateInputPrompts('keyboard');
      }
    });

    window.addEventListener('keydown', (e) => {
      if (window.soundEngine) window.soundEngine.resume();

      if (this.lastInputDevice !== 'keyboard') {
        this.lastInputDevice = 'keyboard';
        this.updateInputPrompts('keyboard');
      }

      // Key rebinding interception
      if (this.rebindingAction) {
        e.preventDefault();
        this.rebindActionKey(this.rebindingAction, e.code);
        return;
      }

      if (this.isActionKey('left', e.code)) this.input.left = true;
      if (this.isActionKey('right', e.code)) this.input.right = true;
      if (this.isActionKey('up', e.code)) this.input.up = true;
      if (this.isActionKey('down', e.code)) this.input.down = true;

      // Cutscene skipping
      if (this.state === 'CUTSCENE') {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Escape' || this.isActionKey('jump', e.code) || this.isActionKey('interact', e.code) || this.isActionKey('attack', e.code)) {
          if (this.cutsceneManager) {
            this.cutsceneManager.skip();
            return;
          }
        }
      }

      // Dialogue advancement via keyboard (Space, Enter, E, Z, X, C, jump, interact, attack)
      if (this.state === 'DIALOGUE') {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE' || e.code === 'KeyZ' || e.code === 'KeyX' || e.code === 'KeyC' || this.isActionKey('jump', e.code) || this.isActionKey('interact', e.code) || this.isActionKey('attack', e.code)) {
          if (window.dialogueManager) window.dialogueManager.advance();
          return;
        }
      }

      if (e.code === 'Enter') {
        if (this.state === 'VICTORY') {
          const btn = document.getElementById('btn-victory-next');
          if (btn) btn.click();
          return;
        }
      }

      if (this.isActionKey('jump', e.code)) {
        this.input.jump = true;
        if (this.player) this.player.jumpBufferTimer = this.player.jumpBufferMax;
        // Jump key advances dialogues or intro screens
        if (this.state === 'INTRO') this.advanceIntroScreen();
        if (this.state === 'DIALOGUE') window.dialogueManager.advance();
      }

      if (this.isActionKey('attack', e.code)) this.input.attack = true;
      if (this.isActionKey('dash', e.code)) this.input.dash = true;

      if (this.isActionKey('interact', e.code)) {
        this.input.interact = true;
        if (this.state === 'DIALOGUE') {
          window.dialogueManager.advance();
        } else if (this.activeChest) {
          this.openBoonChest(this.activeChest);
        } else if (this.nearSlotMachine) {
          this.openSlotMachineModal();
        } else if (this.nearSanctuary) {
          this.openSanctuaryModal();
        } else if (this.nearHermitMerchant) {
          this.openHermitShopModal();
        } else if (this.nearBloodAltar && this.activeBloodAltar) {
          this.openBloodAltarModal(this.activeBloodAltar);
        } else if (this.nearChallengeShrine) {
          this.activateChallengeShrine(this.level.challengeShrine);
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
        if (this.rebindingAction) {
          this.rebindingAction = null;
          this.renderKeyRemapUI();
          return;
        }

        // Emergency fail-safe unfreeze & cutscene/dialogue break on Escape
        if (window.dialogueManager && window.dialogueManager.active) {
          window.dialogueManager.closeDialogue();
          this.state = 'PLAYING';
          if (this.player) this.player.isFrozen = false;
          return;
        }
        if (this.cutsceneManager && this.cutsceneManager.active) {
          this.cutsceneManager.skip();
          return;
        }
        if (this.state === 'PLAYING' && this.player && this.player.isFrozen) {
          this.player.isFrozen = false;
        }

        if (this.state === 'HERMIT_SHOP') {
          this.closeHermitShopModal();
        } else if (this.state === 'BLOOD_ALTAR') {
          this.closeBloodAltarModal();
        } else if (this.state === 'SANCTUARY') {
          this.closeSanctuaryModal();
        } else if (this.state === 'SLOT_MACHINE') {
          this.closeSlotMachineModal();
        } else if (this.state === 'BOON_SELECT') {
          this.closeBoonSelectionModal();
        } else if (this.state === 'LEVEL_UP') {
          this.closeLevelUpModal();
        } else if (this.state === 'DIALOGUE') {
          this.state = 'PLAYING';
          if (this.player) this.player.isFrozen = false;
        } else if (this.state === 'CUTSCENE') {
          this.state = 'PLAYING';
          if (this.player) this.player.isFrozen = false;
        } else {
          this.togglePause();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (this.isActionKey('left', e.code)) this.input.left = false;
      if (this.isActionKey('right', e.code)) this.input.right = false;
      if (this.isActionKey('up', e.code)) this.input.up = false;
      if (this.isActionKey('down', e.code)) this.input.down = false;
      if (this.isActionKey('jump', e.code)) this.input.jump = false;
      if (this.isActionKey('attack', e.code)) this.input.attack = false;
      if (this.isActionKey('dash', e.code)) this.input.dash = false;
      if (this.isActionKey('interact', e.code)) this.input.interact = false;
    });

    window.addEventListener('blur', () => {
      this.input.left = false;
      this.input.right = false;
      this.input.up = false;
      this.input.down = false;
      this.input.jump = false;
      this.input.attack = false;
      this.input.interact = false;
    });

    // Canvas click attacks in combat mode / skip cutscenes / advance dialogues
    this.canvas.addEventListener('mousedown', () => {
      if (this.state === 'PLAYING') this.input.attack = true;
      if (this.state === 'CUTSCENE' && this.cutsceneManager) {
        this.cutsceneManager.skip();
      }
      if (this.state === 'DIALOGUE' && window.dialogueManager) {
        window.dialogueManager.advance();
      }
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

        if (this.state === 'CUTSCENE' && this.cutsceneManager) {
          this.cutsceneManager.skip();
          return;
        }

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
          } else if (this.nearHermitMerchant) {
            this.openHermitShopModal();
          } else if (this.nearBloodAltar && this.activeBloodAltar) {
            this.openBloodAltarModal(this.activeBloodAltar);
          } else if (this.nearChallengeShrine) {
            this.activateChallengeShrine(this.level.challengeShrine);
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

    // Main Menu Subview Navigation (Códice, Ajustes, Logros, Aspectos)
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
    if (this.ui.btnOpenAchievements) {
      this.ui.btnOpenAchievements.addEventListener('click', () => this.switchMenuSubView('achievements'));
    }
    if (this.ui.btnBackAchievements) {
      this.ui.btnBackAchievements.addEventListener('click', () => this.switchMenuSubView('home'));
    }
    if (this.ui.btnOpenWardrobe) {
      this.ui.btnOpenWardrobe.addEventListener('click', () => this.switchMenuSubView('wardrobe'));
    }
    if (this.ui.btnBackWardrobe) {
      this.ui.btnBackWardrobe.addEventListener('click', () => this.switchMenuSubView('home'));
    }

    // Codex Tabs (Guía vs Bestiario)
    if (this.ui.tabCodexGuide && this.ui.tabCodexBestiary) {
      this.ui.tabCodexGuide.addEventListener('click', () => {
        this.ui.tabCodexGuide.classList.add('active');
        this.ui.tabCodexBestiary.classList.remove('active');
        if (this.ui.codexGuideContent) this.ui.codexGuideContent.classList.remove('hidden');
        if (this.ui.codexBestiaryContent) this.ui.codexBestiaryContent.classList.add('hidden');
      });
      this.ui.tabCodexBestiary.addEventListener('click', () => {
        this.ui.tabCodexBestiary.classList.add('active');
        this.ui.tabCodexGuide.classList.remove('active');
        if (this.ui.codexBestiaryContent) this.ui.codexBestiaryContent.classList.remove('hidden');
        if (this.ui.codexGuideContent) this.ui.codexGuideContent.classList.add('hidden');
        this.renderBestiaryCodex();
      });
    }

    // Screen Shake Sliders
    const handleShakeSlider = (e) => {
      const val = parseInt(e.target.value, 10);
      this.shakeSetting = val / 100;
      localStorage.setItem('infernal_rise_shake', this.shakeSetting.toString());
      if (this.ui.labelScreenShake) this.ui.labelScreenShake.textContent = `${val}%`;
      if (this.ui.pauseLabelScreenShake) this.ui.pauseLabelScreenShake.textContent = `${val}%`;
      if (this.ui.sliderScreenShake && this.ui.sliderScreenShake !== e.target) this.ui.sliderScreenShake.value = val;
      if (this.ui.pauseSliderScreenShake && this.ui.pauseSliderScreenShake !== e.target) this.ui.pauseSliderScreenShake.value = val;
      this.triggerScreenShake(8, 0.25);
    };
    if (this.ui.sliderScreenShake) {
      this.ui.sliderScreenShake.value = Math.round(this.shakeSetting * 100);
      if (this.ui.labelScreenShake) this.ui.labelScreenShake.textContent = `${this.ui.sliderScreenShake.value}%`;
      this.ui.sliderScreenShake.addEventListener('input', handleShakeSlider);
    }
    if (this.ui.pauseSliderScreenShake) {
      this.ui.pauseSliderScreenShake.value = Math.round(this.shakeSetting * 100);
      if (this.ui.pauseLabelScreenShake) this.ui.pauseLabelScreenShake.textContent = `${this.ui.pauseSliderScreenShake.value}%`;
      this.ui.pauseSliderScreenShake.addEventListener('input', handleShakeSlider);
    }

    // Language Toggle
    if (this.ui.btnToggleLanguage) {
      this.updateLanguageUI();
      this.ui.btnToggleLanguage.addEventListener('click', () => {
        if (window.localization) {
          window.localization.toggleLanguage();
          this.updateLanguageUI();
        }
      });
    }

    // Reset Keybindings Button
    if (this.ui.btnResetKeybindings) {
      this.ui.btnResetKeybindings.addEventListener('click', () => {
        this.resetKeybindings();
      });
    }

    // Copy Run Record Buttons (Death & Victory)
    if (this.ui.btnCopyDeathRecord) {
      this.ui.btnCopyDeathRecord.addEventListener('click', () => this.copyRunRecordToClipboard(false));
    }
    if (this.ui.btnCopyVictoryRecord) {
      this.ui.btnCopyVictoryRecord.addEventListener('click', () => this.copyRunRecordToClipboard(true));
    }

    // Settings Sliders (Master, SFX, BGM / Music)
    const handleMasterSlider = (e) => {
      const val = parseFloat(e.target.value) / 100;
      if (window.soundEngine) window.soundEngine.setMasterVolume(val);
      this.syncSettingsUI();
    };
    const handleSfxSlider = (e) => {
      const val = parseFloat(e.target.value) / 100;
      if (window.soundEngine) {
        window.soundEngine.setSfxVolume(val);
      }
      this.syncSettingsUI();
    };
    const handleMusicSlider = (e) => {
      const val = parseFloat(e.target.value) / 100;
      if (window.soundEngine) window.soundEngine.setMusicVolume(val);
      this.syncSettingsUI();
    };

    const attachSliderEvents = (el, handler) => {
      if (!el) return;
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    };

    attachSliderEvents(this.ui.sliderVolMaster, handleMasterSlider);
    attachSliderEvents(this.ui.sliderVolSfx, handleSfxSlider);
    attachSliderEvents(this.ui.sliderVolMusic, handleMusicSlider);

    attachSliderEvents(this.ui.pauseSliderVolMaster, handleMasterSlider);
    attachSliderEvents(this.ui.pauseSliderVolSfx, handleSfxSlider);
    attachSliderEvents(this.ui.pauseSliderVolMusic, handleMusicSlider);

    // Fullscreen Toggle
    if (this.ui.toggleFullscreen) {
      this.ui.toggleFullscreen.addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } else {
          if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        }
      });
      document.addEventListener('fullscreenchange', () => {
        if (this.ui.toggleFullscreen) {
          this.ui.toggleFullscreen.checked = !document.fullscreenElement;
        }
      });
    }

    // Rumble / Vibration Toggle
    if (this.ui.toggleRumble) {
      this.ui.toggleRumble.checked = this.vibrationEnabled;
      this.ui.toggleRumble.addEventListener('change', (e) => {
        this.vibrationEnabled = !!e.target.checked;
        try {
          localStorage.setItem('infernal_rise_rumble', this.vibrationEnabled ? '1' : '0');
        } catch (_) {}
        if (this.vibrationEnabled) {
          this.triggerGamepadRumble(250, 0.4, 0.6);
        }
      });
    }

    // Export & Import Save Data
    if (this.ui.btnExportSave) {
      this.ui.btnExportSave.addEventListener('click', () => this.exportSaveFile());
    }
    if (this.ui.btnImportSaveTrigger && this.ui.inputImportSave) {
      this.ui.btnImportSaveTrigger.addEventListener('click', () => {
        this.ui.inputImportSave.value = '';
        this.ui.inputImportSave.click();
      });
      this.ui.inputImportSave.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) this.importSaveFile(file);
      });
    }

    // In-Game Pause Settings Modal
    if (this.ui.btnPauseSettings && this.ui.modalIngameSettings) {
      this.ui.btnPauseSettings.addEventListener('click', () => {
        this.syncSettingsUI();
        this.ui.modalIngameSettings.classList.remove('hidden');
      });
    }
    if (this.ui.btnCloseIngameSettings && this.ui.modalIngameSettings) {
      this.ui.btnCloseIngameSettings.addEventListener('click', () => {
        this.ui.modalIngameSettings.classList.add('hidden');
      });
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

    // Native Desktop Exit Handlers
    const exitToDesktop = () => {
      if (window.desktopAPI && window.desktopAPI.quit) {
        window.desktopAPI.quit();
      } else {
        window.close();
      }
    };
    const btnQuitDesktop = document.getElementById('btn-quit-desktop');
    if (btnQuitDesktop) btnQuitDesktop.addEventListener('click', exitToDesktop);
    const btnPauseQuitDesktop = document.getElementById('btn-pause-quit-desktop');
    if (btnPauseQuitDesktop) btnPauseQuitDesktop.addEventListener('click', exitToDesktop);

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
        if (Date.now() < this.modalInputCooldownUntil) return;
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
        if (Date.now() < this.modalInputCooldownUntil) return;
        if (window.progression && window.progression.performReroll()) {
          const fresh = window.progression.getRandomBoons(3, !!this._isCurrentBoonRelic);
          this.renderBoonCards(fresh);
          this.ui.btnBoonReroll.disabled = !window.progression.canReroll();
        }
      });
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

    // Tienda del Ermitaño Modal Actions
    if (this.ui.btnCloseHermitShop) {
      this.ui.btnCloseHermitShop.addEventListener('click', () => this.closeHermitShopModal());
    }
    if (this.ui.btnHermitShopDone) {
      this.ui.btnHermitShopDone.addEventListener('click', () => this.closeHermitShopModal());
    }

    // Altar de Sangre Modal Actions
    if (this.ui.btnCloseBloodAltar) {
      this.ui.btnCloseBloodAltar.addEventListener('click', () => this.closeBloodAltarModal());
    }
    if (this.ui.btnBloodAltarDecline) {
      this.ui.btnBloodAltarDecline.addEventListener('click', () => this.closeBloodAltarModal());
    }
    if (this.ui.btnPactSouls) {
      this.ui.btnPactSouls.addEventListener('click', () => this.acceptBloodPactSouls());
    }
    if (this.ui.btnPactCurse) {
      this.ui.btnPactCurse.addEventListener('click', () => this.acceptBloodPactCurse());
    }
  }

  // ─── STATE / SCREEN TRANSITIONS ───
  switchMenuSubView(viewName) {
    if (this.ui.menuViewHome) this.ui.menuViewHome.classList.add('hidden');
    if (this.ui.menuViewCodex) this.ui.menuViewCodex.classList.add('hidden');
    if (this.ui.menuViewSettings) this.ui.menuViewSettings.classList.add('hidden');
    if (this.ui.menuViewAchievements) this.ui.menuViewAchievements.classList.add('hidden');
    if (this.ui.menuViewWardrobe) this.ui.menuViewWardrobe.classList.add('hidden');

    if (viewName === 'codex' && this.ui.menuViewCodex) {
      this.ui.menuViewCodex.classList.remove('hidden');
      this.renderBestiaryCodex();
    } else if (viewName === 'settings' && this.ui.menuViewSettings) {
      this.ui.menuViewSettings.classList.remove('hidden');
      this.syncSettingsUI();
      this.renderKeyRemapUI();
      this.updateMainMenuStats();
    } else if (viewName === 'achievements' && this.ui.menuViewAchievements) {
      this.ui.menuViewAchievements.classList.remove('hidden');
      this.renderAchievementsUI();
      this.updateMainMenuStats();
    } else if (viewName === 'wardrobe' && this.ui.menuViewWardrobe) {
      this.ui.menuViewWardrobe.classList.remove('hidden');
      this.renderWardrobeUI();
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

    // Completely tear down and unload active in-game level and entities
    this.level = null;
    this.player = null;
    this.enemies = [];
    this.bats = [];
    this.boss = null;
    this.bossProjectiles = [];
    this.enemyProjectiles = [];
    this.flameWaves = [];
    this.soulOrbs = [];
    this.xpGems = [];
    this.healthOrbs = [];
    this.chests = [];
    this.urns = [];
    this.crackedWalls = [];
    this.bloodAltars = [];
    this.ladders = [];
    this.movingPlatforms = [];
    this.crumblingPlatforms = [];
    this.pendingLevelUps = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.nearBloodAltar = false;
    this.activeBloodAltar = null;
    this.nearHermitMerchant = false;
    this.nearChallengeShrine = false;

    if (this.passiveWeaponsManager) {
      this.passiveWeaponsManager.reset();
    }
    if (window.progression) {
      window.progression.resetRunBoons();
      if (window.progression.resetRunStats) window.progression.resetRunStats();
    }
    if (window.soundEngine) {
      if (window.soundEngine.setPauseFilter) window.soundEngine.setPauseFilter(false);
      window.soundEngine.playMusic('menu');
    }
    this.syncSettingsUI();
  }

  startStoryMode() {
    this.gameMode = 'STORY';
    if (window.progression && window.progression.resetRunStats) {
      window.progression.resetRunStats();
    }
    if (window.soundEngine && window.soundEngine.setPauseFilter) {
      window.soundEngine.setPauseFilter(false);
    }
    this.showIntroLoreScreen();
  }

  startInfernalMode() {
    this.gameMode = 'INFERNAL';
    if (window.progression && window.progression.resetRunStats) {
      window.progression.resetRunStats();
    }
    if (window.soundEngine && window.soundEngine.setPauseFilter) {
      window.soundEngine.setPauseFilter(false);
    }
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
    if (this.cutsceneManager) {
      this.cutsceneManager.startAwakening();
    }
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
    this.hermitMerchant = null;
    this.nearHermitMerchant = false;
    this.nearChallengeShrine = false;
    this.lastReportedAltitude = 0;
    this.chests = (this.level.chests || []).map(c => new BoonChest(c));
    this.urns = (this.level.urns || []).map(u => new BreakableUrn(u));
    this.crackedWalls = (this.level.crackedWalls || []).map(w => new CrackedWall(w));
    this.bloodAltars = (this.level.bloodAltars || []).map(a => new BloodAltar(a));
    this.runicBells = (this.level.runicBells || []).map(b => (b instanceof RunicBell ? b : new RunicBell(b)));
    this.spectralPlatforms = (this.level.spectralPlatforms || []).map(sp => (sp instanceof SpectralPlatform ? sp : new SpectralPlatform(sp)));
    this.seesawPlatforms = (this.level.seesawPlatforms || []).map(s => (s instanceof SeesawPlatform ? s : new SeesawPlatform(s)));
    this.ascensionVortices = (this.level.ascensionVortices || []).map(v => (v instanceof AscensionVortex ? v : new AscensionVortex(v)));
    this.familiarCages = (this.level.familiarCages || []).map(c => (c instanceof FamiliarCage ? c : new FamiliarCage(c)));

    // Active familiar / companion
    if (!this.familiar) {
      const activeFId = (window.progression && window.progression.activeFamiliar) ? window.progression.activeFamiliar : null;
      this.familiar = new Familiar(activeFId);
    } else if (window.progression && window.progression.activeFamiliar) {
      this.familiar.setFamiliar(window.progression.activeFamiliar);
    }

    this.activeBloodAltar = null;
    this.nearBloodAltar = false;
    if (this.level.hermitOutpost) {
      this.hermitMerchant = { ...this.level.hermitOutpost };
    }

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
    let count = 50;
    let type = 'ember';

    if (biome === 'sunken_necropolis') {
      type = 'spore';
      count = 55;
    } else if (biome === 'frozen_peaks') {
      type = 'snow';
      count = 60;
    } else if (biome === 'surface_threshold') {
      type = 'celestial';
      count = 50;
    } else if (biome === 'prologue') {
      type = 'sanctuary';
      count = 45;
    }

    const palettes = {
      ember: ['#ff3311', '#ff7700', '#ffbb22', '#ff4466'],
      ash: ['#3a3340', '#4a4052', '#2c2533', '#5c5266'],
      spore: ['#34d399', '#10b981', '#6ee7b7', '#a78bfa', '#2dd4bf', '#818cf8'],
      snow: ['#e0f2fe', '#bae6fd', '#ffffff', '#7dd3fc'],
      leaf: ['#f59e0b', '#ea580c', '#fef08a', '#84cc16', '#fbbf24'],
      celestial: ['#ffd700', '#ffffff', '#fef08a', '#38bdf8', '#e0e7ff'],
      rain: ['#64748b', '#94a3b8', '#38bdf8'],
      sanctuary: ['#ffd700', '#c77dff', '#90e0ef', '#ffffff', '#e0aaff', '#f472b6']
    };

    const colors = palettes[type] || palettes.ember;

    for (let i = 0; i < count; i++) {
      let pType = type;
      // In abyss/inferno, mix falling ash flakes with rising fiery embers
      if (type === 'ember' && Math.random() < 0.38) {
        pType = 'ash';
      }

      const pColorList = palettes[pType] || colors;
      const isAsh = (pType === 'ash');
      const isCelestial = (pType === 'celestial');

      this.ambientParticles.push({
        type: pType,
        x: Math.random() * this.vWidth,
        y: Math.random() * this.vHeight,
        speed: (pType === 'snow' ? 50 : (pType === 'rain' ? 140 : (isAsh ? 45 : (isCelestial ? 24 : (pType === 'sanctuary' ? 14 : (pType === 'spore' ? 20 : 32)))))) + Math.random() * 25,
        size: (isCelestial ? 2.5 : (pType === 'sanctuary' ? 2.2 : (isAsh ? 2.2 : (pType === 'leaf' ? 2.5 : (pType === 'spore' ? 1.8 : 1.5))))) + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        color: pColorList[Math.floor(Math.random() * pColorList.length)]
      });
    }
    this.ambientEmbers = this.ambientParticles;
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.ui.pauseScreen.classList.remove('hidden');
      if (window.soundEngine && window.soundEngine.setPauseFilter) {
        window.soundEngine.setPauseFilter(true);
      }
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.ui.pauseScreen.classList.add('hidden');
      if (window.soundEngine && window.soundEngine.setPauseFilter) {
        window.soundEngine.setPauseFilter(false);
      }
    }
  }

  restartLevel() {
    this.ui.pauseScreen.classList.add('hidden');
    if (window.soundEngine && window.soundEngine.setPauseFilter) {
      window.soundEngine.setPauseFilter(false);
    }
    this.loadLevel(this.level.id);
    this.state = 'PLAYING';
  }

  handlePlayerDeath() {
    this.deathCount++;
    localStorage.setItem('infernal_rise_deaths', this.deathCount.toString());
    this.updateDeathCounterUI();

    if (window.soundEngine) {
      if (window.soundEngine.setPauseFilter) window.soundEngine.setPauseFilter(false);
      window.soundEngine.playDeath();
    }
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
    this.renderEndRunSummary(false);
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
    if (this.cutsceneManager) {
      this.cutsceneManager.startAwakening();
    }
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

    // Spawn Hermit Haven Shop NPC (Comerciante del Averno)
    this.hermitMerchant = {
      x: Math.max(90, chestX - 100),
      y: 412,
      w: 28,
      h: 40,
      name: 'Ermitaño del Averno'
    };
    if (window.particleSystem) {
      window.particleSystem.spawnTeleportSparks(this.hermitMerchant.x + 14, this.hermitMerchant.y + 20);
    }

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

  showGothicAnnouncement(titleText, subtitleText = '', icon = '⚔️') {
    const banner = document.getElementById('boss-defeat-banner');
    const title = document.getElementById('defeat-banner-title');
    const sub = document.getElementById('defeat-banner-subtitle');
    const crown = document.getElementById('defeat-banner-icon') || (banner ? banner.querySelector('.defeat-crown') : null);
    if (!banner) return;
    if (title) title.textContent = titleText;
    if (sub) sub.textContent = subtitleText || '';
    if (crown) crown.textContent = icon || '⚔️';
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
        if (crown) crown.textContent = '👑';
      }, 850);
    }, 3200);
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

  resumeAfterBossDialogue() {
    this.state = 'PLAYING';
    if (this.player) {
      this.player.isFrozen = false;
      this.player.cutscenePose = null;
      this.player.animState = 'idle';
      this.player.vx = 0;
      this.player.vy = 0;
    }
    if (this.cutsceneManager) {
      this.cutsceneManager.active = false;
      this.cutsceneManager.type = null;
      this.cutsceneManager.targetLetterbox = 0;
      this.cutsceneManager.letterboxProgress = 0;
      this.cutsceneManager.bossBannerAlpha = 0;
    }
    // Re-center camera smoothly on the player
    try {
      if (this.player && this.level) {
        const targetCamX = this.player.x + this.player.w / 2 - this.vWidth / 2;
        const targetCamY = this.player.y + this.player.h / 2 - this.vHeight / 2;
        if (this.level.width <= this.vWidth) {
          this.camX = (this.level.width - this.vWidth) / 2;
        } else {
          this.camX = Math.max(0, Math.min(this.level.width - this.vWidth, targetCamX));
        }
        if (this.level.height <= this.vHeight) {
          this.camY = (this.level.height - this.vHeight) / 2;
        } else {
          this.camY = Math.max(0, Math.min(this.level.height - this.vHeight, targetCamY));
        }
      }
      this.updateMouseCursor();
      this.updateVirtualControlsVisibility();
    } catch (err) {
      console.error('[Boss Dialogue] Camera / UI update error:', err);
    }
  }

  // ─── MAIN LOOP ───
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    const realDt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    try {
      this.pollGamepad();

      // Timer sanitization
      if (Number.isNaN(this.hitStopTimer) || this.hitStopTimer < 0) {
        this.hitStopTimer = 0;
      } else {
        this.hitStopTimer = Math.min(0.35, this.hitStopTimer);
      }
      if (Number.isNaN(this.slowMoTimer) || this.slowMoTimer < 0) {
        this.slowMoTimer = 0;
      }
      if (Number.isNaN(this.timeScale) || this.timeScale <= 0) {
        this.timeScale = 1.0;
      }

      // Hit-stop processing: freezes game world simulation for high impact
      if (this.hitStopTimer > 0) {
        this.hitStopTimer -= realDt;
        this.render();
        return;
      }

      // Slow-motion processing (e.g. boss defeat cinematic)
      let simDt = realDt;
      if (this.slowMoTimer > 0) {
        this.slowMoTimer -= realDt;
        this.timeScale = 0.25;
        simDt = realDt * this.timeScale;
      } else {
        this.timeScale = 1.0;
      }

      // ─── STATE WATCHDOG & FAIL-SAFE AUTO-RECOVERY ───
      if (this.state === 'DIALOGUE') {
        if (!window.dialogueManager || !window.dialogueManager.active) {
          this.state = 'PLAYING';
          if (this.player) this.player.isFrozen = false;
        }
      } else if (this.state === 'CUTSCENE') {
        if (!this.cutsceneManager || !this.cutsceneManager.active) {
          this.state = 'PLAYING';
          if (this.player) this.player.isFrozen = false;
        }
      } else if (this.state === 'SANCTUARY' && (!this.ui.sanctuaryModal || this.ui.sanctuaryModal.classList.contains('hidden'))) {
        this.state = 'PLAYING';
      } else if (this.state === 'HERMIT_SHOP' && (!this.ui.hermitShopModal || this.ui.hermitShopModal.classList.contains('hidden'))) {
        this.state = 'PLAYING';
      } else if (this.state === 'BLOOD_ALTAR' && (!this.ui.bloodAltarModal || this.ui.bloodAltarModal.classList.contains('hidden'))) {
        this.state = 'PLAYING';
      } else if (this.state === 'SLOT_MACHINE' && (!this.ui.slotMachineModal || this.ui.slotMachineModal.classList.contains('hidden'))) {
        this.state = 'PLAYING';
      } else if (this.state === 'BOON_SELECT' && (!this.ui.boonModal || this.ui.boonModal.classList.contains('hidden'))) {
        this.state = 'PLAYING';
      } else if (this.state === 'LEVEL_UP' && (!this.ui.levelUpModal || this.ui.levelUpModal.classList.contains('hidden'))) {
        this.state = 'PLAYING';
      }

      // Fail-safe player unfreeze: If state is PLAYING but player is frozen without any active dialogue or cutscene
      if (this.state === 'PLAYING' && this.player && this.player.isFrozen) {
        const isDialogueActive = window.dialogueManager && window.dialogueManager.active;
        const isCutsceneActive = this.cutsceneManager && this.cutsceneManager.active;
        if (!isDialogueActive && !isCutsceneActive) {
          this.player.isFrozen = false;
        }
      }

      // Screen shake decay
      if (this.shakeDuration > 0) {
        this.shakeDuration -= realDt;
        const progress = Math.max(0, this.shakeDuration / (this.shakeMaxDuration || 0.3));
        const effectiveIntensity = this.shakeIntensity * progress * (this.shakeSetting !== undefined ? this.shakeSetting : 1.0);
        this.shakeX = (Math.random() * 2 - 1) * effectiveIntensity;
        this.shakeY = (Math.random() * 2 - 1) * effectiveIntensity;
      } else {
        this.shakeX = 0;
        this.shakeY = 0;
      }

      // White flash decay
      if (this.whiteFlashAlpha > 0) {
        this.whiteFlashAlpha = Math.max(0, this.whiteFlashAlpha - realDt * 1.5);
      }

      if (this.state === 'PLAYING') {
        this.update(simDt);
      } else if (this.state === 'CUTSCENE') {
        if (this.cutsceneManager) {
          this.cutsceneManager.update(simDt);
        }
        if (window.particleSystem) {
          window.particleSystem.update(simDt);
        }
      }

      this.render();
    } catch (err) {
      console.error('[Engine Watchdog] Caught unhandled exception in game loop:', err);
    } finally {
      requestAnimationFrame((ts) => this.loop(ts));
    }
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
        if (altitude >= 200 && window.progression && window.progression.unlockAchievement) {
          window.progression.unlockAchievement('speed_demon');
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
        if (p.isFinalPortal || !p.targetLevel || p.targetLevel === 'victory') {
          if (this.cutsceneManager) {
            this.cutsceneManager.startEnding(() => {
              this.state = 'VICTORY';
              if (this.ui.victoryMessage) {
                this.ui.victoryMessage.textContent = `¡Has conquistado la Gran Torre del Inframundo y cruzado el Umbral Terrenal hacia el Mundo de los Vivos! Tu alma renace bajo la luz del sol.`;
              }
              this.renderEndRunSummary(true);
              if (this.ui.victoryScreen) this.ui.victoryScreen.classList.remove('hidden');
            });
          } else {
            this.state = 'VICTORY';
            if (this.ui.victoryMessage) {
              this.ui.victoryMessage.textContent = `¡Has conquistado la Gran Torre del Inframundo y cruzado el Umbral Terrenal hacia el Mundo de los Vivos! Tu alma renace bajo la luz del sol.`;
            }
            this.renderEndRunSummary(true);
            if (this.ui.victoryScreen) this.ui.victoryScreen.classList.remove('hidden');
          }
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
          if (this.cutsceneManager) {
            this.cutsceneManager.startBossIntro(this.boss, () => {
              this.state = 'DIALOGUE';
              if (this.player) this.player.isFrozen = true;
              window.dialogueManager.startDialogue(this.boss.dialogueKey, () => {
                this.resumeAfterBossDialogue();
              });
            });
          } else {
            this.state = 'DIALOGUE';
            if (this.player) this.player.isFrozen = true;
            window.dialogueManager.startDialogue(this.boss.dialogueKey, () => {
              this.resumeAfterBossDialogue();
            });
          }
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
    for (let i = this.bats.length - 1; i >= 0; i--) {
      const bat = this.bats[i];
      if (bat.isDead) {
        this.bats.splice(i, 1);
        continue;
      }
      bat.update(dt, this.player, this.level, window.soundEngine, window.particleSystem);
    }

    // 4c. Update Challenge Shrine Progress
    if (this.level && this.level.challengeShrine && this.level.challengeShrine.active) {
      const cs = this.level.challengeShrine;
      const aliveChallenge = this.enemies.filter(e => e.isChallenge && !e.isDead && e.hp > 0).length;
      cs.enemiesLeft = aliveChallenge;
      if (aliveChallenge === 0) {
        cs.active = false;
        cs.completed = true;
        this.level.lavaSpeed = this.originalLavaSpeed !== undefined ? this.originalLavaSpeed : 21;
        this.showGothicAnnouncement('✨ ¡DESAFÍO SUPERADO!', 'El Monolito ha liberado el Cofre Legendario.');
        if (window.soundEngine && window.soundEngine.playAchievementUnlocked) {
          window.soundEngine.playAchievementUnlocked();
        }
        const relicChest = new BoonChest({
          x: cs.x - 4,
          y: cs.y + 14,
          id: `challenge_relic_${this.level.id}`,
          isRelic: true
        });
        this.chests.push(relicChest);
        this.spawnSoulOrbs(cs.x + 16, cs.y + 10, 4, 80);
        if (window.progression) {
          const lvls = window.progression.addRunXp(50);
          if (lvls > 0) this.queueLevelUps(lvls);
        }
      }
    }

    // Sword attack hitbox for urns, bells, cages, and projectiles
    let swordHitbox = (this.player && this.player.getAttackHitbox) ? this.player.getAttackHitbox() : null;
    if (!swordHitbox && this.player && this.player.isAttacking && (this.player.attackFrame === 1 || this.player.attackFrame === 2)) {
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

    // 5. Update Urns, Bells, Cages & Walls on player sword strike
    if (swordHitbox) {
      for (const u of this.urns) {
        const orbs = u.checkHit(swordHitbox, window.soundEngine, window.particleSystem);
        if (orbs) this.soulOrbs.push(...orbs);
      }
      if (this.crackedWalls) {
        for (const cw of this.crackedWalls) {
          cw.checkHit(swordHitbox, this.player.attackDamage || 25, window.soundEngine, window.particleSystem);
        }
      }
      if (this.runicBells) {
        for (const bell of this.runicBells) {
          bell.checkHit(swordHitbox, window.soundEngine, window.particleSystem, this);
        }
      }
      if (this.familiarCages) {
        for (const cage of this.familiarCages) {
          cage.checkHit(swordHitbox, window.soundEngine, window.particleSystem, this, window.progression);
        }
      }
    }

    // 5b. Update Cracked Walls & solid barrier collisions
    if (this.crackedWalls) {
      for (const cw of this.crackedWalls) {
        cw.update(dt);
        if (!cw.isBroken) {
          if (this.player.x + this.player.w > cw.x && this.player.x < cw.x + cw.w &&
              this.player.y + this.player.h > cw.y + 4 && this.player.y < cw.y + cw.h - 4) {
            if (this.player.x + this.player.w / 2 < cw.x + cw.w / 2) {
              this.player.x = cw.x - this.player.w;
              this.player.vx = Math.min(0, this.player.vx);
            } else {
              this.player.x = cw.x + cw.w;
              this.player.vx = Math.max(0, this.player.vx);
            }
          }
        }
      }
    }

    // 5c. Update Blood Altars proximity
    if (this.bloodAltars) {
      for (const ba of this.bloodAltars) {
        ba.update(dt, this.player);
      }
    }

    // 5d. Update Runic Bells & Spectral Platforms
    if (this.runicBells) {
      for (const bell of this.runicBells) {
        bell.update(dt, this.spectralPlatforms);
      }
    }
    if (this.spectralPlatforms) {
      for (const sp of this.spectralPlatforms) {
        sp.update(dt);
        if (sp.isSolid) {
          if (!this.level.platforms.includes(sp)) this.level.platforms.push(sp);
        } else {
          const idx = this.level.platforms.indexOf(sp);
          if (idx !== -1) this.level.platforms.splice(idx, 1);
        }
      }
    }

    // 5e. Update Seesaw Platforms & Ascension Vortices
    if (this.seesawPlatforms) {
      for (const ss of this.seesawPlatforms) {
        ss.update(dt, this.player);
      }
    }
    if (this.ascensionVortices) {
      for (const av of this.ascensionVortices) {
        av.update(dt, this.player, window.soundEngine, window.particleSystem);
      }
    }

    // 5f. Update Familiar Cages & Active Companion
    if (this.familiarCages) {
      for (const cage of this.familiarCages) {
        cage.update(dt);
      }
    }
    if (this.familiar) {
      this.familiar.update(
        dt,
        this.player,
        this.enemies,
        this.bats,
        this.soulOrbs,
        window.soundEngine,
        window.particleSystem
      );
    }

    // 6. Update Boon Chests proximity
    let nearChest = null;
    for (const c of this.chests) {
      c.update(dt, this.player);
      if (c.isNear && !c.isOpened) {
        nearChest = c;
      }
    }
    this.activeChest = nearChest;

    // 7. Update Soul Orbs & XP Gems
    for (let i = this.soulOrbs.length - 1; i >= 0; i--) {
      const orb = this.soulOrbs[i];
      orb.update(dt, this.player, window.soundEngine, window.particleSystem);
      if (orb.isCollected) {
        // Aura bonus: +20% extra souls
        if (this.familiar && this.familiar.id === 'aura' && window.progression) {
          window.progression.addSouls(Math.max(1, Math.ceil((orb.value || 10) * 0.20)));
        }
        this.soulOrbs.splice(i, 1);
      } else if (orb.life > orb.maxLife) {
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
      if (this.crackedWalls && !wave.isDead) {
        for (const cw of this.crackedWalls) {
          if (!cw.isBroken && Math.abs((wave.x + 13) - (cw.x + cw.w / 2)) < (cw.w / 2 + 13) &&
              Math.abs((wave.y + 12) - (cw.y + cw.h / 2)) < (cw.h / 2 + 12)) {
            cw.checkHit({ x: wave.x, y: wave.y, w: wave.w, h: wave.h }, wave.damage || 25, window.soundEngine, window.particleSystem);
            wave.isDead = true;
            break;
          }
        }
      }
      if (wave.isDead) {
        this.flameWaves.splice(i, 1);
      }
    }

    // 9. Update Tower Floors & Infernal Rising Lava (Climbing floors only, strictly disabled in boss arenas)
    if (this.level.hasLava && (this.level.risingLava || this.level.id === 'infernal') && !this.level.isCombatScene) {
      if (this.levelGraceTimer > 0) {
        this.levelGraceTimer -= dt;
      } else {
        const baseSpeed = this.level.lavaSpeed || 28;
        let speed = baseSpeed;

        // Dynamic relentless pursuit: If player climbs far ahead, lava accelerates dynamically so it never gets abandoned!
        if (this.player) {
          const screenBottom = this.camY + this.vHeight;
          const lagDist = this.level.lavaY - screenBottom;
          if (lagDist > 140) {
            const catchupMult = Math.min(3.4, 1.0 + (lagDist - 140) / 320);
            speed = baseSpeed * catchupMult;
          }
        }

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
        window.particleSystem
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

    const btnKey = this.lastInputDevice === 'gamepad' ? '[RB/B]' : '[E]';

    // Interaction Badge (Chest, Slot Machine, Sanctuary, Hermit, Challenge, Blood Altar, or NPC)
    this.nearSanctuary = false;
    this.nearSlotMachine = false;
    this.nearHermitMerchant = false;
    this.nearChallengeShrine = false;
    this.nearBloodAltar = false;
    this.activeBloodAltar = null;

    if (this.bloodAltars && this.bloodAltars.length > 0) {
      for (const ba of this.bloodAltars) {
        if (!ba.isUsed && ba.isNear) {
          this.nearBloodAltar = true;
          this.activeBloodAltar = ba;
          break;
        }
      }
    }

    if (this.activeChest) {
      this.ui.interactionBadge.style.display = 'block';
      this.ui.interactionBadge.textContent = `${btnKey} Abrir Cofre`;
      const screenX = ((this.activeChest.x + this.activeChest.w / 2 - this.camX) / this.vWidth) * 100;
      const screenY = ((this.activeChest.y - 14 - this.camY) / this.vHeight) * 100;
      this.ui.interactionBadge.style.left = `${screenX}%`;
      this.ui.interactionBadge.style.top = `${screenY}%`;
    } else if (this.hermitMerchant && Math.hypot(
        (this.player.x + this.player.w / 2) - (this.hermitMerchant.x + 14),
        (this.player.y + this.player.h / 2) - (this.hermitMerchant.y + 20)
      ) < 75 && this.state !== 'DIALOGUE') {
      this.nearHermitMerchant = true;
      this.ui.interactionBadge.style.display = 'block';
      this.ui.interactionBadge.textContent = `🎒 ${btnKey} Tienda del Ermitaño`;
      const screenX = ((this.hermitMerchant.x + 14 - this.camX) / this.vWidth) * 100;
      const screenY = ((this.hermitMerchant.y - 16 - this.camY) / this.vHeight) * 100;
      this.ui.interactionBadge.style.left = `${screenX}%`;
      this.ui.interactionBadge.style.top = `${screenY}%`;
    } else if (this.nearBloodAltar && this.activeBloodAltar && this.state !== 'DIALOGUE') {
      this.ui.interactionBadge.style.display = 'block';
      this.ui.interactionBadge.textContent = `🩸 ${btnKey} Altar de Sangre`;
      const screenX = ((this.activeBloodAltar.x + this.activeBloodAltar.w / 2 - this.camX) / this.vWidth) * 100;
      const screenY = ((this.activeBloodAltar.y - 16 - this.camY) / this.vHeight) * 100;
      this.ui.interactionBadge.style.left = `${screenX}%`;
      this.ui.interactionBadge.style.top = `${screenY}%`;
    } else if (this.level && this.level.challengeShrine && !this.level.challengeShrine.completed && !this.level.challengeShrine.active && Math.hypot(
        (this.player.x + this.player.w / 2) - (this.level.challengeShrine.x + 16),
        (this.player.y + this.player.h / 2) - (this.level.challengeShrine.y + 20)
      ) < 75 && this.state !== 'DIALOGUE') {
      this.nearChallengeShrine = true;
      this.ui.interactionBadge.style.display = 'block';
      this.ui.interactionBadge.textContent = `⚔️ ${btnKey} Activar Desafío del Averno`;
      const screenX = ((this.level.challengeShrine.x + 16 - this.camX) / this.vWidth) * 100;
      const screenY = ((this.level.challengeShrine.y - 16 - this.camY) / this.vHeight) * 100;
      this.ui.interactionBadge.style.left = `${screenX}%`;
      this.ui.interactionBadge.style.top = `${screenY}%`;
    } else if (this.level && this.level.slotMachine && Math.hypot(
        (this.player.x + this.player.w / 2) - (this.level.slotMachine.x + this.level.slotMachine.w / 2),
        (this.player.y + this.player.h / 2) - (this.level.slotMachine.y + this.level.slotMachine.h / 2)
      ) < 75 && this.state !== 'DIALOGUE') {
      this.nearSlotMachine = true;
      this.ui.interactionBadge.style.display = 'block';
      this.ui.interactionBadge.textContent = `🎰 ${btnKey} Ruleta de Armas (80 🔮)`;
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
      this.ui.interactionBadge.textContent = `${btnKey} Santuario de Mejoras`;
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
        this.ui.interactionBadge.textContent = `${btnKey} Hablar`;
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

    // Update Vertical Tower Ascension Radar (Minimap)
    this.updateTowerRadar();
  }

  updateTowerRadar() {
    if (!this.ui || !this.ui.towerRadar) return;
    const isTowerLevel = (this._state === 'PLAYING') && this.level &&
      (this.level.id.startsWith('tower') || this.level.id === 'infernal' || this.level.isCombatScene);

    if (!isTowerLevel || !this.player || !this.level.height) {
      this.ui.towerRadar.classList.add('hidden');
      return;
    }

    this.ui.towerRadar.classList.remove('hidden');

    const topY = 120;
    const bottomY = Math.max(topY + 200, this.level.height - 80);
    const totalSpan = bottomY - topY;

    const climb = Math.max(0, Math.min(1.0, (bottomY - this.player.y) / totalSpan));
    const playerPercent = Math.max(2, Math.min(98, (1.0 - climb) * 100));

    if (this.ui.radarPlayerMarker) {
      this.ui.radarPlayerMarker.style.top = `${playerPercent.toFixed(1)}%`;
    }

    if (this.ui.radarAltitudeText) {
      const meters = Math.max(0, Math.round(climb * (this.level.height / 10)));
      this.ui.radarAltitudeText.textContent = `${meters}m`;
    }

    if (this.ui.radarGoalIcon) {
      if (this.level.isCombatScene || this.boss) {
        this.ui.radarGoalIcon.textContent = '👹';
        this.ui.radarGoalIcon.title = 'Guardián del Averno';
      } else {
        this.ui.radarGoalIcon.textContent = '👑';
        this.ui.radarGoalIcon.title = 'Portal de Ascensión';
      }
    }

    // Refresh markers periodically (throttled)
    if (!this._radarMarkerTimer) this._radarMarkerTimer = 0;
    this._radarMarkerTimer++;
    if (this._radarMarkerTimer % 8 === 0 && this.ui.radarMarkers) {
      let markersHtml = '';

      if (this.chests && this.chests.length > 0) {
        for (const c of this.chests) {
          if (c && !c.opened) {
            const chestClimb = Math.max(0, Math.min(1.0, (bottomY - c.y) / totalSpan));
            const chestTop = Math.max(3, Math.min(97, (1.0 - chestClimb) * 100));
            markersHtml += `<div class="radar-marker radar-marker-chest" style="top: ${chestTop.toFixed(1)}%;" title="Cofre de Reliquia">🧰</div>`;
          }
        }
      }

      if (this.enemies && this.enemies.length > 0) {
        for (const e of this.enemies) {
          if (e && !e.isDead && (e.isElite || e.isBoss)) {
            const enemyClimb = Math.max(0, Math.min(1.0, (bottomY - e.y) / totalSpan));
            const enemyTop = Math.max(3, Math.min(97, (1.0 - enemyClimb) * 100));
            markersHtml += `<div class="radar-marker radar-marker-elite" style="top: ${enemyTop.toFixed(1)}%;" title="${e.isBoss ? 'Jefe' : 'Élite'}">${e.isBoss ? '💀' : '🔸'}</div>`;
          }
        }
      }

      this.ui.radarMarkers.innerHTML = markersHtml;
    }
  }

  // ─── RENDERING ───
  render() {
    this.ctx.clearRect(0, 0, this.vWidth, this.vHeight);

    if (this.state === 'MENU') {
      this.ctx.fillStyle = '#080309';
      this.ctx.fillRect(0, 0, this.vWidth, this.vHeight);
      return;
    }

    const shakeX = (window.particleSystem ? window.particleSystem.shakeX : 0) + this.shakeX;
    const shakeY = (window.particleSystem ? window.particleSystem.shakeY : 0) + this.shakeY;
    const finalCamX = this.camX + shakeX;
    const finalCamY = this.camY + shakeY;

    // 1. Draw Parallax Backgrounds
    this.drawParallaxBackgrounds(finalCamX, finalCamY);

    if (!this.level) return;

    // 1b. Draw Backdrop Gothic Architecture & Cathedral Arches
    this.drawBackdropArchitecture(finalCamX, finalCamY);

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

    // 6b. Draw Cracked Walls & Blood Altars
    if (this.crackedWalls) {
      for (const cw of this.crackedWalls) {
        cw.draw(this.ctx, finalCamX, finalCamY);
      }
    }
    if (this.bloodAltars) {
      for (const ba of this.bloodAltars) {
        ba.draw(this.ctx, finalCamX, finalCamY);
      }
    }

    // 6c. Draw Spectral Platforms, Seesaw Platforms, Ascension Vortices, Runic Bells & Cages
    if (this.spectralPlatforms) {
      for (const sp of this.spectralPlatforms) {
        sp.draw(this.ctx, finalCamX, finalCamY);
      }
    }
    if (this.seesawPlatforms) {
      for (const ss of this.seesawPlatforms) {
        ss.draw(this.ctx, finalCamX, finalCamY);
      }
    }
    if (this.ascensionVortices) {
      for (const av of this.ascensionVortices) {
        av.draw(this.ctx, finalCamX, finalCamY);
      }
    }
    if (this.runicBells) {
      for (const bell of this.runicBells) {
        bell.draw(this.ctx, finalCamX, finalCamY);
      }
    }
    if (this.familiarCages) {
      for (const cage of this.familiarCages) {
        cage.draw(this.ctx, finalCamX, finalCamY);
      }
    }

    // 7. Draw NPC
    if (this.level.npc) {
      this.drawNpc(this.level.npc, finalCamX, finalCamY);
    }

    // 7b. Draw Hermit Haven Merchant & Challenge Shrine
    if (this.hermitMerchant) {
      this.drawHermitMerchant(this.hermitMerchant, finalCamX, finalCamY);
    }
    if (this.level.challengeShrine) {
      this.drawChallengeShrine(this.level.challengeShrine, finalCamX, finalCamY);
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

    // 11. Draw Player & Familiar Companion
    if (this.player) {
      this.player.draw(this.ctx, finalCamX, finalCamY);
    }
    if (this.familiar) {
      this.familiar.draw(this.ctx, finalCamX, finalCamY);
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

    // 15. Draw Tower Floor HUD Banner / Badge
    if ((this.level.towerFloor || this.level.danteCircle) && this.state === 'PLAYING') {
      this.drawTowerFloorBadge();
    }

    // 16. Draw Cinematic White Flash (Boss defeat / Ascended blast)
    if (this.whiteFlashAlpha > 0) {
      this.ctx.save();
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.whiteFlashAlpha})`;
      this.ctx.fillRect(0, 0, this.vWidth, this.vHeight);
      this.ctx.restore();
    }

    // 17. Draw Active Cinematic Cutscenes (Awakening, Boss Intros, Surface Ending)
    if (this.cutsceneManager) {
      this.cutsceneManager.draw(this.ctx, this.vWidth, this.vHeight, finalCamX, finalCamY);
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

  drawTowerFloorBadge() {
    this.ctx.save();
    const text = this.level.towerFloor || this.level.danteCircle;
    if (!text) {
      this.ctx.restore();
      return;
    }
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

  drawDanteCircleBadge() {
    this.drawTowerFloorBadge();
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

    // Dynamic daylight transition as player ascends towards the living surface world
    let surfaceBlend = 0;
    if (this.level && (this.level.id === 'tower6' || this.level.id === 'victory')) {
      surfaceBlend = 0.45 + climbRatio * 0.55;
    } else if (this.level && (this.level.id === 'tower5' || this.level.id === 'boss_glacior')) {
      surfaceBlend = 0.20 + climbRatio * 0.35;
    } else if (biomeKey === 'surface_threshold') {
      surfaceBlend = 0.85;
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
    } else if (biomeKey === 'rocky_caverns') {
      // Warm amber/sunlight filtering down from the ceiling fissures
      const cavernSunGrad = this.ctx.createLinearGradient(0, 0, 0, 220);
      cavernSunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
      cavernSunGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.10)');
      cavernSunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      this.ctx.fillStyle = cavernSunGrad;
      this.ctx.fillRect(0, 0, this.vWidth, 220);
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
      else if (biomeKey === 'rocky_caverns') bg = biomes.rocky_caverns;
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

    // 5a. Outdoor Surface World 6-Layer Parallax (Floor 6 & Summit Emergence - Jump King Image 4)
    const isSurface = (biomeKey === 'surface_threshold' || surfaceBlend >= 0.85 || (this.level && (this.level.id === 'tower6' || this.level.id === 'victory')));
    const surfaceBgs = (window.spriteManager && window.spriteManager.surfaceBgs) ? window.spriteManager.surfaceBgs.filter(Boolean) : null;

    if (isSurface && surfaceBgs && surfaceBgs.length >= 5) {
      const tileH = 540;
      const tileW = Math.round(426 * (540 / 384)); // 600px width
      const speeds = [0.03, 0.08, 0.16, 0.28, 0.44, 0.65];
      const time = Date.now() * 0.001;

      for (let i = 0; i < Math.min(surfaceBgs.length, 6); i++) {
        const sImg = surfaceBgs[i];
        if (!sImg) continue;
        const spd = speeds[i] || (0.1 * (i + 1));
        const drift = (i === 0) ? (time * 6) : 0; // Gentle drifting sky clouds
        const offX = -(camX * spd) + drift;
        let startX = offX % tileW;
        if (startX > 0) startX -= tileW;

        const shiftY = (climbRatio - 0.5) * (20 + i * 14);
        for (let x = startX; x < this.vWidth; x += tileW) {
          this.ctx.drawImage(sImg, 0, 0, 426, 384, x, shiftY, tileW, tileH);
        }
      }
      this.drawAtmosphericParticles();
      return;
    }

    // 5b. Subterranean Cavern Parallax (Floors 1 & 2: Abyss & Catacombs)
    const isCavern = (biomeKey === 'abyss' || biomeKey === 'sunken_necropolis' || (this.level && (this.level.id === 'tower1' || this.level.id === 'tower2')));
    const caveBgs = (window.spriteManager && window.spriteManager.caveBgs) ? window.spriteManager.caveBgs.filter(Boolean) : null;

    if (isCavern && caveBgs && caveBgs.length >= 3) {
      const layerW = 960;
      const layerH = 540;
      const speeds = [0.04, 0.12, 0.24, 0.40];

      for (let i = 0; i < Math.min(caveBgs.length, 4); i++) {
        const cImg = caveBgs[i];
        if (!cImg) continue;
        const spd = speeds[i] || (0.1 * (i + 1));
        const offX = -(camX * spd);
        let startX = offX % layerW;
        if (startX > 0) startX -= layerW;

        const shiftY = (climbRatio - 0.5) * (30 + i * 16);
        for (let x = startX; x < this.vWidth; x += layerW) {
          this.ctx.drawImage(cImg, 0, 0, 960, 480, x, shiftY, layerW, layerH);
        }
      }
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

    // 1. Fill entire canvas with pitch-black abyss
    this.ctx.fillStyle = '#020104';
    this.ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    // 2. Lateral margin fill for ultrawide / mobile landscape
    if (rx > 0 || rx + 960 < this.vWidth) {
      this.ctx.fillStyle = '#050308';
      this.ctx.fillRect(0, 0, this.vWidth, this.vHeight);
    }

    // 3. Draw the master Cavern Hall locked 1:1 to world coordinates
    const hallImg = bg ? (bg.cavernHall || bg.cathedralHall || bg.skySpires) : null;
    if (hallImg) {
      this.ctx.drawImage(hallImg, rx, ry, 960, 540);
    }

    // 4. Dark Cavern Atmospheric Darkness Vignette & Torch Glow Pools
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(2, 1, 5, 0.2)';
    this.ctx.fillRect(0, 0, this.vWidth, this.vHeight);

    if (this.level && this.level.torches) {
      const time = Date.now() * 0.005;
      for (const t of this.level.torches) {
        const tx = Math.round(t.x - camX);
        const ty = Math.round(t.y - camY);
        const radius = 95 + Math.sin(time + t.x) * 6;
        const torchAura = this.ctx.createRadialGradient(tx, ty, 6, tx, ty, radius);
        torchAura.addColorStop(0, 'rgba(168, 85, 247, 0.18)');
        torchAura.addColorStop(0.5, 'rgba(139, 92, 246, 0.07)');
        torchAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        this.ctx.fillStyle = torchAura;
        this.ctx.beginPath();
        this.ctx.arc(tx, ty, radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.restore();
  }

  drawAtmosphericParticles() {
    const particles = this.ambientParticles || this.ambientEmbers;
    const dt = 0.016;

    const biomeKey = (this.level && this.level.biome) ? this.level.biome : 'abyss';
    const levelId = this.level ? this.level.id : '';
    const isSpectral = (biomeKey === 'sunken_necropolis' || levelId === 'tower2' || levelId === 'boss_flegias');
    const isGlacial = (biomeKey === 'frozen_peaks' || levelId === 'tower4' || levelId === 'boss_malacoda');
    const isCelestial = (biomeKey === 'surface_threshold' || biomeKey === 'rocky_caverns' || levelId === 'tower3' || levelId === 'boss_minotaur' || levelId === 'tower5' || levelId === 'boss_glacior' || levelId === 'tower6' || levelId === 'victory');

    // 1. Dynamic Spectral Fog Waves in Level 2 / Abismo
    if (isSpectral) {
      this.weatherFogPhase = (this.weatherFogPhase || 0) + dt * 0.35;
      this.ctx.save();
      for (let l = 0; l < 2; l++) {
        const fogY = this.vHeight * (0.62 + l * 0.22);
        const fogGrad = this.ctx.createLinearGradient(0, fogY - 45, 0, fogY + 45);
        const alpha = l === 0 ? 0.05 : 0.07;
        const color = l === 0 ? '45, 212, 191' : '167, 139, 250';
        fogGrad.addColorStop(0, `rgba(${color}, 0)`);
        fogGrad.addColorStop(0.5, `rgba(${color}, ${alpha})`);
        fogGrad.addColorStop(1, `rgba(${color}, 0)`);
        this.ctx.fillStyle = fogGrad;

        this.ctx.beginPath();
        this.ctx.moveTo(0, fogY);
        for (let x = 0; x <= this.vWidth; x += 48) {
          const wave = Math.sin(this.weatherFogPhase * 1.4 + x * 0.007 + l * 2.2) * 14;
          this.ctx.lineTo(x, fogY + wave);
        }
        this.ctx.lineTo(this.vWidth, this.vHeight);
        this.ctx.lineTo(0, this.vHeight);
        this.ctx.closePath();
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    // 2. Dynamic God Rays (Luminous Celestial Light Shafts) in Level 3 / Summit
    if (isCelestial) {
      this.godRaysPhase = (this.godRaysPhase || 0) + dt * 0.45;
      this.ctx.save();
      const rayCount = 4;
      for (let i = 0; i < rayCount; i++) {
        const rayOffset = (i * 240 + Math.sin(this.godRaysPhase + i * 1.3) * 28);
        const alpha = 0.06 + Math.sin(this.godRaysPhase * 1.6 + i * 1.1) * 0.035;
        const grad = this.ctx.createLinearGradient(rayOffset, 0, rayOffset - 110, this.vHeight);
        grad.addColorStop(0, `rgba(255, 240, 160, ${alpha * 1.3})`);
        grad.addColorStop(0.6, `rgba(255, 215, 120, ${alpha * 0.8})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.moveTo(rayOffset - 25, 0);
        this.ctx.lineTo(rayOffset + 65, 0);
        this.ctx.lineTo(rayOffset - 60, this.vHeight);
        this.ctx.lineTo(rayOffset - 150, this.vHeight);
        this.ctx.closePath();
        this.ctx.fill();
      }
      this.ctx.restore();
    }

    if (!particles) return;

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
      } else if (p.type === 'ash') {
        // Volcanic falling ash
        p.y += p.speed * dt;
        p.x += Math.sin(p.phase * 1.8) * 12 * dt - (p.speed * 0.25) * dt;
        p.phase += dt * 1.6;
        if (p.y > this.vHeight + 10) {
          p.y = -10;
          p.x = Math.random() * this.vWidth;
        }
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(p.x, p.y, p.size, p.size * 0.8);
      } else if (p.type === 'celestial') {
        // Sacred stardust motes rising with halo
        p.y -= (p.speed * 0.5) * dt;
        p.phase += dt * 2.2;
        if (p.y < -10) {
          p.y = this.vHeight + 10;
          p.x = Math.random() * this.vWidth;
        }
        const swayX = p.x + Math.sin(p.phase) * 8;
        const pulse = 0.5 + Math.sin(p.phase * 2.4) * 0.45;
        this.ctx.save();
        this.ctx.globalAlpha = Math.max(0.2, Math.min(1, pulse));
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(swayX, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
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

  drawBackdropArchitecture(camX, camY) {
    const props = window.spriteManager && window.spriteManager.sprites ? window.spriteManager.sprites.props : null;
    if (!props || !this.level) return;

    const levelH = this.level.height || 3600;
    const levelW = this.level.width || 960;
    const ctx = this.ctx;

    // 1. Prologue Sanctuary and Boss Combat Arenas have dedicated clean backdrops
    if (this.level.id === 'prologue' || this.level.isCombatScene) {
      return;
    }

    ctx.save();

    const isAbyss = (this.level.biome === 'abyss' || this.level.id === 'tower1' || this.level.id === 'boss_demon_slime');
    const isFrozen = (this.level.biome === 'frozen_peaks' || this.level.id === 'tower2' || this.level.id === 'boss_frost_guardian');
    const isFortress = (this.level.biome === 'fortress' || this.level.id === 'tower3' || this.level.biome === 'rocky_caverns' || this.level.id === 'boss_minotaur');
    const isHighRamparts = (this.level.id === 'tower4' || this.level.id === 'tower5');
    const isSurface = (this.level.id === 'tower6' || this.level.id === 'victory' || this.level.biome === 'surface_threshold');

    if (isAbyss) {
      // ── PISO 1: EL FOSO ABISAL (Basalto y Fisuras de Magma Continuas) ──
      ctx.globalAlpha = 0.40;
      const colL = Math.round(130 - camX);
      const colR = Math.round(levelW - 170 - camX);

      // Deep basalt wall buttresses running continuous floor-to-ceiling
      ctx.fillStyle = '#0a050d';
      ctx.fillRect(colL - 25, 0, 50, this.vHeight);
      ctx.fillRect(colR - 25, 0, 50, this.vHeight);

      // Vertical molten magma conduits inside buttresses
      ctx.fillStyle = 'rgba(255, 68, 0, 0.40)';
      ctx.fillRect(colL - 3, 0, 6, this.vHeight);
      ctx.fillRect(colR - 3, 0, 6, this.vHeight);
      ctx.fillStyle = 'rgba(255, 180, 0, 0.65)';
      ctx.fillRect(colL - 1, 0, 2, this.vHeight);
      ctx.fillRect(colR - 1, 0, 2, this.vHeight);
    } else if (isFrozen) {
      // ── PISO 2: AGUJAS GLACIARES (Pilastras de Hielo y Escarcha Continua) ──
      ctx.globalAlpha = 0.35;
      const colL = Math.round(140 - camX);
      const colR = Math.round(levelW - 180 - camX);

      // Continuous glacial rock pillars
      ctx.fillStyle = '#05111e';
      ctx.fillRect(colL - 22, 0, 44, this.vHeight);
      ctx.fillRect(colR - 22, 0, 44, this.vHeight);

      // Ethereal frost sheen along pillar ridges
      ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
      ctx.fillRect(colL - 2, 0, 4, this.vHeight);
      ctx.fillRect(colR - 2, 0, 4, this.vHeight);
    } else if (isFortress) {
      // ── PISO 3: CAVERNAS ROCOSAS & RUINAS DEL ALBA (Muros y Columnatas Continuas) ──
      const brickPatternImg = props.castleWallsFarImg || props.castleBgImg;
      if (brickPatternImg) {
        const ptrnW = 256;
        const ptrnH = 256;
        const offX = -(camX * 0.25);
        const offY = -(camY * 0.30);
        let startX = offX % ptrnW;
        if (startX > 0) startX -= ptrnW;
        let startY = offY % ptrnH;
        if (startY > 0) startY -= ptrnH;

        ctx.globalAlpha = 0.40;
        for (let x = startX; x < this.vWidth; x += ptrnW) {
          for (let y = startY; y < this.vHeight; y += ptrnH) {
            ctx.drawImage(brickPatternImg, 0, 0, 512, 512, x, y, ptrnW, ptrnH);
          }
        }
      }

      // Structural masonry pilasters running top-to-bottom behind windows & banners (NEVER floating!)
      const rx = Math.round(levelW / 2 - camX);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = '#0e0a14';
      ctx.fillRect(rx - 195, 0, 68, this.vHeight);
      ctx.fillRect(rx + 125, 0, 68, this.vHeight);
      ctx.fillStyle = '#1c1528';
      ctx.fillRect(rx - 190, 0, 58, this.vHeight);
      ctx.fillRect(rx + 130, 0, 58, this.vHeight);

      // Arched Windows firmly seated into wall masonry
      ctx.globalAlpha = 0.65;
      const windowInterval = 560;
      const startWinY = Math.floor((camY - 200) / windowInterval) * windowInterval;
      const endWinY = camY + this.vHeight + 200;

      for (let wy = startWinY; wy <= endWinY; wy += windowInterval) {
        if (wy < 100 || wy > levelH - 100) continue;
        const ry = Math.round(wy - camY);
        if (ry < -200 || ry > this.vHeight + 200) continue;

        // Central arched stained window
        if (props.gothicWindowBig) {
          ctx.drawImage(props.gothicWindowBig, 0, 0, 64, 128, rx - 32, ry, 64, 128);
        } else if (props.gothicArch) {
          ctx.drawImage(props.gothicArch, 0, 0, 192, 192, rx - 64, ry, 128, 128);
        }

        // Candle halo behind window
        const winGlow = ctx.createRadialGradient(rx, ry + 60, 10, rx, ry + 60, 90);
        winGlow.addColorStop(0, 'rgba(251, 146, 60, 0.38)');
        winGlow.addColorStop(1, 'rgba(251, 146, 60, 0)');
        ctx.fillStyle = winGlow;
        ctx.beginPath();
        ctx.arc(rx, ry + 60, 90, 0, Math.PI * 2);
        ctx.fill();

        // Heraldic Banners anchored directly onto the masonry pilasters
        if (props.bannerRed) {
          ctx.drawImage(props.bannerRed, 0, 0, 96, 48, rx - 180, ry + 20, 48, 72);
        }
        if (props.bannerBlue) {
          ctx.drawImage(props.bannerBlue, 0, 0, 192, 96, rx + 135, ry + 20, 48, 72);
        }
      }

      // 2c. Open Balcony on Left Margin with Cold Rain Streaks (Jump King Image 3)
      const balX = Math.round(60 - camX);
      if (balX > -150 && balX < this.vWidth) {
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.35)';
        ctx.lineWidth = 1;
        const time = Date.now() * 0.003;
        for (let ri = 0; ri < 14; ri++) {
          const rxPos = balX + ((ri * 23 + time * 50) % 90);
          const ryPos = (ri * 47 + time * 300) % this.vHeight;
          ctx.beginPath();
          ctx.moveTo(rxPos, ryPos);
          ctx.lineTo(rxPos - 6, ryPos + 18);
          ctx.stroke();
        }
      }
    } else if (isHighRamparts) {
      // 3. FLOOR 4 & 5: High Ruined Ramparts (Jump King Images 1 & 2 Style)
      ctx.globalAlpha = 0.38;
      const towerInterval = 720;
      const startTY = Math.floor((camY - 300) / towerInterval) * towerInterval;
      const endTY = camY + this.vHeight + 300;

      for (let ty = startTY; ty <= endTY; ty += towerInterval) {
        const ry = Math.round(ty - camY * 0.25);
        if (ry < -300 || ry > this.vHeight + 300) continue;

        // Distant castle silhouette towers
        ctx.fillStyle = '#0f172a';
        // Left silhouette tower
        ctx.fillRect(40, ry, 120, 360);
        ctx.beginPath();
        ctx.moveTo(40, ry);
        ctx.lineTo(100, ry - 70); // Spire peak
        ctx.lineTo(160, ry);
        ctx.closePath();
        ctx.fill();

        // Right silhouette tower
        ctx.fillRect(this.vWidth - 160, ry + 40, 110, 320);
        ctx.beginPath();
        ctx.moveTo(this.vWidth - 160, ry + 40);
        ctx.lineTo(this.vWidth - 105, ry - 25); // Spire peak
        ctx.lineTo(this.vWidth - 50, ry + 40);
        ctx.closePath();
        ctx.fill();

        // Arched bridge between them in deep background
        ctx.beginPath();
        ctx.moveTo(160, ry + 120);
        ctx.quadraticCurveTo(this.vWidth / 2, ry + 70, this.vWidth - 160, ry + 120);
        ctx.lineWidth = 14;
        ctx.strokeStyle = '#0f172a';
        ctx.stroke();
      }
    } else if (isSurface) {
      // 4. FLOOR 6: Surface Battlements Opening to Horizon (Jump King Image 4)
      ctx.globalAlpha = 0.65;
      if (props.surfaceAutumnVines) {
        const rx = Math.round(30 - camX);
        for (let y = 100; y < levelH; y += 480) {
          const ry = Math.round(y - camY);
          if (ry > -100 && ry < this.vHeight + 100) {
            ctx.drawImage(props.surfaceAutumnVines, 0, 0, 32, 64, rx, ry, 48, 96);
            ctx.drawImage(props.surfaceAutumnVines, 0, 0, 32, 64, rx + levelW - 80, ry + 120, 48, 96);
          }
        }
      }
    } else {
      // Default: Gothic Cathedral Arches
      if (props.gothicArch) {
        ctx.globalAlpha = 0.32;
        const archInterval = 680;
        const startY = Math.floor((camY - 200) / archInterval) * archInterval;
        const endY = camY + this.vHeight + 200;
        const midX = levelW / 2;

        for (let archY = startY; archY <= endY; archY += archInterval) {
          if (archY < 120 || archY > levelH - 120) continue;
          const rx = Math.round(midX - camX);
          const ry = Math.round(archY - camY);
          if (ry < -250 || ry > this.vHeight + 250) continue;

          ctx.drawImage(props.gothicArch, 0, 0, 192, 192, rx - 80, ry, 160, 160);
          if (props.pillarShaft) {
            ctx.drawImage(props.pillarShaft, 0, 0, 64, 96, rx - 102, ry + 36, 22, 160);
            ctx.drawImage(props.pillarShaft, 0, 0, 64, 96, rx + 80, ry + 36, 22, 160);
          }
        }
      }
    }

    ctx.restore();
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
      mud: props.mudTile,
      // 6 DEDICATED ORIGINAL TILES PER TOWER FLOOR
      basalt_abyss: props.basaltAbyssTile || props.obsidianTile,
      catacomb_stone: props.catacombStoneTile || props.stoneTile,
      crimson_iron: props.crimsonIronTile || props.stoneTile,
      glacial_ice: props.glacialIceTile || props.iceTile,
      gold_vault: props.goldVaultTile || props.goldTile,
      terrenal_sanctuary: props.terrenalSanctuaryTile || props.runicTile,
      cavern_stone: props.cavernStoneTile || props.stoneTile,
      rocky_ruins: props.rockyRuinsTile || props.stoneTile
    };

    const styleMap = {
      stone: { rim: '#483854', hi: '#6d557f', corbel: '#18121d', dark: '#0a060d' },
      obsidian: { rim: '#ff4500', hi: '#ffaa00', corbel: '#14060c', dark: '#060104' },
      bone: { rim: '#b5a396', hi: '#e8dcce', corbel: '#241c1f', dark: '#0f0a0c' },
      runic: { rim: '#bf00ff', hi: '#ff80df', corbel: '#190a26', dark: '#090212' },
      ice: { rim: '#00b4d8', hi: '#caf0f8', corbel: '#0f2438', dark: '#05101a' },
      gold: { rim: '#fbbf24', hi: '#fef08a', corbel: '#451a03', dark: '#1f0a00' },
      mud: { rim: '#52b788', hi: '#95d5b2', corbel: '#132a1f', dark: '#08140e' },
      // FLOOR 1: El Foso Abisal (Porous Volcanic Basalt & Flaming Core)
      basalt_abyss: { rim: '#ff4400', hi: '#fde047', corbel: '#220a16', dark: '#0a0206' },
      // FLOOR 2: Las Catacumbas Hundidas (Decayed Emerald Crypt Masonry & Moss)
      catacomb_stone: { rim: '#40916c', hi: '#74c69d', corbel: '#0f241c', dark: '#06120e' },
      // FLOOR 3: Las Cavernas Rocosas (Craggy Subterranean Slate with Daylight Rim)
      cavern_stone: { rim: '#64748b', hi: '#f8fafc', corbel: '#1e293b', dark: '#0f172a' },
      rocky_ruins: { rim: '#78716c', hi: '#fef08a', corbel: '#292524', dark: '#1c1917' },
      // FLOOR 3 (Legacy): Las Murallas Carmesí (Heavy Crimson War Steel & Iron Rivets)
      crimson_iron: { rim: '#dc2626', hi: '#fca5a5', corbel: '#380a10', dark: '#160205' },
      // FLOOR 4: Las Agujas Glaciares (Pure Electric-Cyan Permafrost & Snow)
      glacial_ice: { rim: '#00b4d8', hi: '#ffffff', corbel: '#062842', dark: '#02101c' },
      // FLOOR 5: El Atrio Dorado (Polished 24k Imperial Bullion & Filigree)
      gold_vault: { rim: '#f59e0b', hi: '#ffffff', corbel: '#451a03', dark: '#1c0800' },
      // FLOOR 6: La Gran Puerta Terrenal (Sunlit Limestone & Living World Flora)
      terrenal_sanctuary: { rim: '#eab308', hi: '#ffffff', corbel: '#292524', dark: '#141211' }
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

      // 1. Architectural Structural Grounding (Diagonal Wall Brackets, Cross Trusses, Columns, Surface Flora)
      this.drawArchitecturalSupports(rx, ry, p, style, props, pType, hasSupportBelow);


      // 1c. Gothic Stone Balustrade / Railing on Haven and Summit platforms
      if ((p.isHaven || p.isSummit) && props.stoneBalustrade) {
        const railW = 48;
        const numRails = Math.floor(p.w / railW);
        for (let ri = 0; ri < numRails; ri++) {
          this.ctx.drawImage(props.stoneBalustrade, 0, 0, 128, 48, rx + ri * railW, ry - 16, railW, 18);
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

      // 6. Architectural Features for Ruined, Vertical, and Parapet Platforms
      if (p.isVerticalStructure) {
        // Vertical Buttress Capital & Side Quoins
        if (props.pillarCapital) {
          this.ctx.drawImage(props.pillarCapital, 0, 0, 64, 64, rx - 6, ry - 12, p.w + 12, 16);
        } else {
          this.ctx.fillStyle = style.hi;
          this.ctx.fillRect(rx - 4, ry - 4, p.w + 8, 5);
        }
        // Vertical decorative stone blocks
        this.ctx.fillStyle = style.hi;
        for (let qy = ry + 24; qy < ry + p.h - 12; qy += 32) {
          this.ctx.fillRect(rx, qy, 6, 2);
          this.ctx.fillRect(rx + p.w - 6, qy + 16, 6, 2);
        }
      } else if (p.isPillarRemnant) {
        // Ruined Pillar Capital Platform
        if (props.pillarCapital) {
          this.ctx.drawImage(props.pillarCapital, 0, 0, 64, 64, rx - 4, ry - 8, p.w + 8, 14);
        }
        this.ctx.fillStyle = style.hi;
        this.ctx.fillRect(rx + 8, ry + 4, p.w - 16, 2);
      } else if (p.isParapet) {
        // Crenels on top of fortress battlements
        this.ctx.fillStyle = style.corbel;
        const crenelW = 20;
        const crenelGap = 16;
        for (let cx = rx + 6; cx < rx + p.w - 20; cx += crenelW + crenelGap) {
          this.ctx.fillRect(cx, ry - 8, crenelW, 8);
          this.ctx.fillStyle = style.rim;
          this.ctx.fillRect(cx, ry - 8, crenelW, 2);
          this.ctx.fillStyle = style.corbel;
        }
      } else if (p.isRuined) {
        // Jagged stone crack / fracture on outer edge of ruined lintel
        this.ctx.fillStyle = style.dark;
        this.ctx.beginPath();
        this.ctx.moveTo(rx, ry + p.h);
        this.ctx.lineTo(rx + 8, ry + p.h - 8);
        this.ctx.lineTo(rx + 14, ry + p.h);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.moveTo(rx + p.w - 14, ry + p.h);
        this.ctx.lineTo(rx + p.w - 6, ry + p.h - 7);
        this.ctx.lineTo(rx + p.w, ry + p.h);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (p.isWoodScaffold) {
        // Mining timber reinforcement bands and iron rivets
        this.ctx.fillStyle = '#78350f';
        this.ctx.fillRect(rx, ry + 2, p.w, 3);
        this.ctx.fillStyle = '#27272a';
        for (let bx = rx + 16; bx < rx + p.w; bx += 24) {
          this.ctx.fillRect(bx, ry + 4, 3, 3);
        }
      } else if (p.isRopeBridge) {
        // Wooden slats with suspension rope outline
        this.ctx.fillStyle = '#92400e';
        for (let bx = rx + 4; bx < rx + p.w - 6; bx += 14) {
          this.ctx.fillRect(bx, ry + 2, 10, p.h - 4);
        }
        // Suspension catenary rope
        this.ctx.strokeStyle = '#d97706';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(rx, ry);
        this.ctx.quadraticCurveTo(rx + p.w / 2, ry + 6, rx + p.w, ry);
        this.ctx.stroke();
      } else if (p.isCorbelLedge) {
        // Tiered corbel stepping downwards into wall
        const isLeft = p.x <= 40;
        this.ctx.fillStyle = style.dark;
        if (isLeft) {
          this.ctx.fillRect(rx, ry + p.h, Math.floor(p.w * 0.7), 8);
          this.ctx.fillRect(rx, ry + p.h + 8, Math.floor(p.w * 0.4), 8);
        } else {
          this.ctx.fillRect(rx + Math.floor(p.w * 0.3), ry + p.h, Math.floor(p.w * 0.7), 8);
          this.ctx.fillRect(rx + Math.floor(p.w * 0.6), ry + p.h + 8, Math.floor(p.w * 0.4), 8);
        }
      } else if (p.isSarcophagus) {
        // Gothic crest ornament in center
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.fillRect(rx + Math.floor(p.w / 2) - 8, ry + 4, 16, 4);
      } else if (p.isThickSlab) {
        // Multi-course cyclopean masonry blocks with relief mortar lines & heavy shadow
        const midH = Math.floor(p.h / 2);
        this.ctx.fillStyle = style.dark;
        this.ctx.fillRect(rx, ry + midH - 1, p.w, 2);
        const blockW = 54;
        for (let bx = rx + blockW; bx < rx + p.w - 12; bx += blockW) {
          this.ctx.fillRect(bx, ry + 2, 2, midH - 3);
          this.ctx.fillRect(bx - Math.floor(blockW / 2), ry + midH + 1, 2, p.h - midH - 2);
        }
        this.ctx.fillStyle = '#050208';
        this.ctx.fillRect(rx, ry + p.h - 4, p.w, 4);
      } else if (p.isThinBeam) {
        // Sleek metallic / timber bar with rivets and end-flange brackets
        this.ctx.fillStyle = style.hi;
        this.ctx.fillRect(rx, ry, p.w, 1);
        this.ctx.fillStyle = '#1c1917';
        for (let bx = rx + 14; bx < rx + p.w - 8; bx += 26) {
          this.ctx.fillRect(bx, ry + 3, 2, 2);
        }
        this.ctx.fillStyle = style.dark;
        this.ctx.fillRect(rx - 2, ry - 2, 4, p.h + 4);
        this.ctx.fillRect(rx + p.w - 2, ry - 2, 4, p.h + 4);
      } else if (p.isSquareBlock) {
        // Precision square stone block / pedestal cube
        this.ctx.fillStyle = style.hi;
        this.ctx.fillRect(rx + 2, ry + 2, p.w - 4, 1);
        this.ctx.fillRect(rx + 2, ry + 2, 1, p.h - 4);
        this.ctx.fillStyle = style.dark;
        this.ctx.fillRect(rx + p.w - 3, ry + 2, 2, p.h - 4);
        this.ctx.fillRect(rx + 2, ry + p.h - 3, p.w - 4, 2);
        this.ctx.strokeStyle = style.dark;
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(rx + 8, ry + 8, p.w - 16, p.h - 16);
      } else if (p.isVerticalBarShaft) {
        // Vertical shaft iron strapping bands
        this.ctx.fillStyle = style.dark;
        for (let sy = ry + 18; sy < ry + p.h - 8; sy += 28) {
          this.ctx.fillRect(rx - 1, sy, p.w + 2, 3);
        }
      }
    }
  }

  drawArchitecturalSupports(rx, ry, p, style, props, pType, hasSupportBelow) {
    if (!p || p.isMovingPlatform || p.isCrumbling) return;
    const ctx = this.ctx;
    const levelW = (this.level && this.level.width) ? this.level.width : 960;
    const levelH = (this.level && this.level.height) ? this.level.height : 3600;
    const isSurface = (this.level && (this.level.id === 'tower6' || this.level.id === 'victory' || this.level.biome === 'surface_threshold')) || pType === 'terrenal_sanctuary';
    const isCave = (pType === 'basalt_abyss' || pType === 'cavern_stone' || pType === 'catacomb_stone' || pType === 'rocky_ruins');
    const isFortress = (pType === 'crimson_iron' || (this.level && (this.level.biome === 'fortress' || this.level.id === 'tower3')));

    // 1. DIAGONAL WALL STRUTS / CANTILEVER BRACKETS
    // If platform is near the left wall (p.x <= 160) and not spanning entire level width
    if (p.x <= 160 && p.w < levelW - 100) {
      if (props && props.timberTrussDiagLeft && (isFortress || !isCave)) {
        ctx.drawImage(props.timberTrussDiagLeft, 0, 0, 32, 48, rx, ry + p.h, 28, 42);
      } else if (props && props.caveRockLedge && isCave) {
        ctx.drawImage(props.caveRockLedge, 0, 0, 64, 32, rx - 6, ry + p.h, 44, 22);
      } else {
        // Procedural heavy diagonal masonry bracket
        ctx.fillStyle = style.dark;
        ctx.beginPath();
        ctx.moveTo(rx, ry + p.h);
        ctx.lineTo(rx + 22, ry + p.h);
        ctx.lineTo(rx - 14, ry + p.h + 34);
        ctx.lineTo(rx - 22, ry + p.h + 34);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = style.corbel;
        ctx.beginPath();
        ctx.moveTo(rx + 2, ry + p.h);
        ctx.lineTo(rx + 18, ry + p.h);
        ctx.lineTo(rx - 12, ry + p.h + 30);
        ctx.lineTo(rx - 18, ry + p.h + 30);
        ctx.closePath();
        ctx.fill();
      }
    }

    // If platform is near the right wall (p.x + p.w >= levelW - 160) and not spanning entire level width
    if (p.x + p.w >= levelW - 160 && p.w < levelW - 100) {
      if (props && props.timberTrussDiagRight && (isFortress || !isCave)) {
        ctx.drawImage(props.timberTrussDiagRight, 0, 0, 32, 48, rx + p.w - 28, ry + p.h, 28, 42);
      } else if (props && props.caveRockLedge && isCave) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(props.caveRockLedge, 0, 0, 64, 32, -(rx + p.w + 6), ry + p.h, 44, 22);
        ctx.restore();
      } else {
        // Procedural heavy diagonal masonry bracket
        ctx.fillStyle = style.dark;
        ctx.beginPath();
        ctx.moveTo(rx + p.w, ry + p.h);
        ctx.lineTo(rx + p.w - 22, ry + p.h);
        ctx.lineTo(rx + p.w + 14, ry + p.h + 34);
        ctx.lineTo(rx + p.w + 22, ry + p.h + 34);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = style.corbel;
        ctx.beginPath();
        ctx.moveTo(rx + p.w - 2, ry + p.h);
        ctx.lineTo(rx + p.w - 18, ry + p.h);
        ctx.lineTo(rx + p.w + 12, ry + p.h + 30);
        ctx.lineTo(rx + p.w + 18, ry + p.h + 30);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 2. UNDER-PLATFORM STRUCTURAL TRUSSES & TIMBER BEAMS (Jump King Architecture)
    if (!hasSupportBelow && p.w >= 50 && p.w < levelW - 80) {
      // Horizontal Tie-Beam directly underneath the platform
      if (props && props.timberBeamH && (isFortress || isCave)) {
        const beamW = 48;
        const count = Math.ceil(p.w / beamW);
        for (let i = 0; i < count; i++) {
          const bw = Math.min(beamW, p.w - i * beamW);
          ctx.drawImage(props.timberBeamH, 0, 0, 64, 24, rx + i * beamW, ry + p.h, bw, 14);
        }
      }

      // Modular Cross-Trusses or Scaffolding
      if (p.w >= 70) {
        const trussW = 40;
        const trussH = 34;
        const numTrusses = Math.floor((p.w - 16) / trussW);
        const startOffset = Math.round((p.w - numTrusses * trussW) / 2);

        for (let ti = 0; ti < numTrusses; ti++) {
          const tx = rx + startOffset + ti * trussW;
          if (props && props.timberTrussX && (isFortress || !isCave)) {
            ctx.drawImage(props.timberTrussX, 0, 0, 48, 48, tx, ry + p.h + (props.timberBeamH ? 12 : 0), trussW, trussH);
          } else if (props && props.caveMineCross && isCave) {
            ctx.drawImage(props.caveMineCross, 0, 0, 64, 64, tx, ry + p.h + 4, trussW, trussH);
          }
        }
      }

      // Corbel Brackets on edges
      if (props && props.gargoyleCorbel) {
        ctx.drawImage(props.gargoyleCorbel, 0, 0, 48, 48, rx + 4, ry + p.h, 24, 24);
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(props.gargoyleCorbel, 0, 0, 48, 48, -(rx + p.w - 4), ry + p.h, 24, 24);
        ctx.restore();
      } else {
        this.drawCorbelBracket(rx + 6, ry + p.h, style.corbel, style.dark, false);
        this.drawCorbelBracket(rx + p.w - 18, ry + p.h, style.corbel, style.dark, true);
        if (p.w >= 240) {
          this.drawCorbelBracket(rx + Math.floor(p.w / 2) - 6, ry + p.h, style.corbel, style.dark, false);
        }
      }
    }

    // 3. VERTICAL COLUMNS & SCAFFOLDING POSTS (Grounding to world/depths)
    // STRICT RULE: Only draw a column if there is an ACTUAL solid platform directly underneath within reachable distance (<= 240px).
    // The column connects 100% continuously all the way to the platform below with a carved stone base plinth.
    if (!hasSupportBelow && (p.w >= 120 || p.isVerticalStructure || p.isPillarRemnant)) {
      const colW = 20;
      let foundBelowPlatform = null;
      let targetBelowDist = 9999;
      if (this.level && this.level.platforms) {
        for (const other of this.level.platforms) {
          if (other === p || other.isMovingPlatform || other.isCrumbling) continue;
          const overlap = Math.min(p.x + p.w, other.x + other.w) - Math.max(p.x, other.x);
          if (overlap >= 24 && other.y > p.y + p.h + 8) {
            const dist = other.y - (p.y + p.h);
            if (dist < targetBelowDist) {
              targetBelowDist = dist;
              foundBelowPlatform = other;
            }
          }
        }
      }

      // Only build the column if it firmly anchors into a platform below within 240px (never float in mid-air!)
      if (foundBelowPlatform && targetBelowDist <= 240 && targetBelowDist >= 18) {
        const fullColH = targetBelowDist;
        const numCols = p.w >= 240 && foundBelowPlatform.w >= 180 ? 2 : 1;
        const colXPositions = numCols === 1
          ? [rx + Math.floor(p.w / 2) - colW / 2]
          : [rx + 28, rx + p.w - 28 - colW];

        for (const cx of colXPositions) {
          ctx.save();
          if (isCave && props && props.caveMineBeam) {
            for (let cy = ry + p.h; cy < ry + p.h + fullColH - 4; cy += 64) {
              const segH = Math.min(64, ry + p.h + fullColH - cy);
              ctx.drawImage(props.caveMineBeam, 0, 0, 48, 96, cx - 4, cy, colW + 8, segH);
            }
          } else if ((isFortress || !isCave) && props && props.timberPostV) {
            for (let cy = ry + p.h; cy < ry + p.h + fullColH - 4; cy += 72) {
              const segH = Math.min(72, ry + p.h + fullColH - cy);
              ctx.drawImage(props.timberPostV, 0, 0, 32, 96, cx - 2, cy, colW + 4, segH);
            }
          } else if (props && props.pillarShaft) {
            for (let cy = ry + p.h; cy < ry + p.h + fullColH - 4; cy += 80) {
              const segH = Math.min(80, ry + p.h + fullColH - cy);
              ctx.drawImage(props.pillarShaft, 0, 0, 64, 96, cx - 6, cy, colW + 12, segH);
            }
          } else {
            const grad = ctx.createLinearGradient(cx, 0, cx + colW, 0);
            grad.addColorStop(0, style.dark);
            grad.addColorStop(0.5, style.corbel);
            grad.addColorStop(1, style.dark);
            ctx.fillStyle = grad;
            ctx.fillRect(cx, ry + p.h, colW, fullColH);
          }

          // Carved stone / iron Base Plinth firmly rooted on the lower platform surface
          ctx.fillStyle = style.dark;
          ctx.fillRect(cx - 4, ry + p.h + fullColH - 6, colW + 8, 6);
          ctx.fillStyle = style.corbel;
          ctx.fillRect(cx - 2, ry + p.h + fullColH - 6, colW + 4, 2);
          ctx.restore();
        }
      }
    }

    // 4. SURFACE LIVING WORLD OVERGROWTH (Floor 6 & Summit - Jump King Living World Style)
    if (isSurface && props) {
      if (props.surfaceWildflowers && p.w >= 40) {
        ctx.drawImage(props.surfaceWildflowers, 0, 0, 32, 24, rx + 4, ry - 14, 20, 16);
        if (p.w >= 100) {
          ctx.drawImage(props.surfaceWildflowers, 0, 0, 32, 24, rx + p.w - 24, ry - 14, 20, 16);
        }
      }
      if (props.surfaceMossLedge && p.w >= 60) {
        ctx.drawImage(props.surfaceMossLedge, 0, 0, 64, 32, rx, ry, 36, 18);
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(props.surfaceMossLedge, 0, 0, 64, 32, -(rx + p.w), ry, 36, 18);
        ctx.restore();
      }
      if (props.surfaceFoliageClump && !hasSupportBelow && p.w >= 80) {
        ctx.drawImage(props.surfaceFoliageClump, 0, 0, 48, 48, rx + 16, ry + p.h - 4, 32, 32);
        if (p.w >= 180) {
          ctx.drawImage(props.surfaceFoliageClump, 0, 0, 48, 48, rx + p.w - 48, ry + p.h - 4, 32, 32);
        }
      }
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
    if (type === 'basalt_abyss' || type === 'obsidian') {
      // Magma stalactites dripping molten lava
      this.ctx.fillStyle = '#ff2200';
      this.ctx.fillRect(x + 16, y, 4, 11);
      this.ctx.fillRect(x + width - 24, y, 3, 14);
      this.ctx.fillStyle = '#ffaa00';
      this.ctx.fillRect(x + 17, y + 6, 2, 6);
      this.ctx.fillRect(x + width - 23, y + 8, 1, 7);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(x + 17, y + 10, 1, 2);
    } else if (type === 'catacomb_stone') {
      // Weeping swamp moss & ancient crypt roots
      this.ctx.fillStyle = '#143828';
      this.ctx.fillRect(x + 14, y, 3, 13);
      this.ctx.fillRect(x + 24, y, 2, 8);
      this.ctx.fillRect(x + width - 28, y, 3, 15);
      this.ctx.fillRect(x + width - 16, y, 2, 9);
      this.ctx.fillStyle = '#52b788';
      this.ctx.fillRect(x + 15, y + 6, 1, 8);
      this.ctx.fillRect(x + width - 27, y + 8, 1, 8);
    } else if (type === 'crimson_iron') {
      // Heavy spiked iron fortress chains & rivets
      this.ctx.fillStyle = '#1e293b';
      this.ctx.fillRect(x + 18, y, 3, 14);
      this.ctx.fillRect(x + width - 26, y, 3, 16);
      this.ctx.fillStyle = '#64748b';
      this.ctx.fillRect(x + 18, y + 2, 3, 2);
      this.ctx.fillRect(x + 18, y + 6, 3, 2);
      this.ctx.fillRect(x + 18, y + 10, 3, 2);
      this.ctx.fillRect(x + width - 26, y + 3, 3, 2);
      this.ctx.fillRect(x + width - 26, y + 7, 3, 2);
      this.ctx.fillRect(x + width - 26, y + 11, 3, 2);
      this.ctx.fillStyle = '#dc2626';
      this.ctx.fillRect(x + 19, y + 13, 1, 3);
    } else if (type === 'cavern_stone' || type === 'rocky_ruins') {
      // Natural jagged cavern stalactites and clinging surface roots
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(x + 14, y, 4, 15);
      this.ctx.fillRect(x + 24, y, 2, 8);
      this.ctx.fillRect(x + width - 28, y, 4, 17);
      this.ctx.fillRect(x + width - 16, y, 2, 9);
      this.ctx.fillStyle = '#334155';
      this.ctx.fillRect(x + 15, y, 2, 12);
      this.ctx.fillRect(x + width - 27, y, 2, 14);
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.fillRect(x + 15, y + 10, 1, 3);
      this.ctx.fillRect(x + width - 27, y + 12, 1, 3);
      // Small root tendril reaching from surface
      this.ctx.fillStyle = '#65a30d';
      this.ctx.fillRect(x + 20, y, 1, 10);
      this.ctx.fillRect(x + width - 20, y, 1, 11);
    } else if (type === 'glacial_ice' || type === 'ice') {
      // Sharp crystalline icicles with frost gleams
      this.ctx.fillStyle = '#0077b6';
      this.ctx.fillRect(x + 12, y, 3, 14);
      this.ctx.fillRect(x + 22, y, 2, 8);
      this.ctx.fillRect(x + width - 30, y, 4, 16);
      this.ctx.fillRect(x + width - 18, y, 2, 9);
      this.ctx.fillStyle = '#48cae4';
      this.ctx.fillRect(x + 13, y, 1, 12);
      this.ctx.fillRect(x + width - 29, y, 2, 14);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(x + 13, y + 11, 1, 3);
      this.ctx.fillRect(x + width - 29, y + 13, 1, 3);
    } else if (type === 'gold_vault' || type === 'gold') {
      // Carved royal gold filigree pendants & hanging ruby gems
      this.ctx.fillStyle = '#b45309';
      this.ctx.fillRect(x + 16, y, 4, 10);
      this.ctx.fillRect(x + width - 22, y, 4, 11);
      this.ctx.fillStyle = '#fde047';
      this.ctx.fillRect(x + 17, y + 3, 2, 5);
      this.ctx.fillRect(x + width - 21, y + 4, 2, 5);
      this.ctx.fillStyle = '#ef4444'; // Inset ruby drop
      this.ctx.fillRect(x + 17, y + 9, 2, 3);
      this.ctx.fillRect(x + width - 21, y + 10, 2, 3);
    } else if (type === 'terrenal_sanctuary') {
      // Living flora: lush ivy tendrils with green leaves & morning dew
      this.ctx.fillStyle = '#15803d';
      this.ctx.fillRect(x + 14, y, 2, 14);
      this.ctx.fillRect(x + 22, y, 2, 8);
      this.ctx.fillRect(x + width - 26, y, 2, 16);
      this.ctx.fillRect(x + width - 16, y, 2, 9);
      this.ctx.fillStyle = '#4ade80';
      this.ctx.fillRect(x + 12, y + 5, 3, 3);
      this.ctx.fillRect(x + 15, y + 10, 3, 3);
      this.ctx.fillRect(x + width - 28, y + 6, 3, 3);
      this.ctx.fillRect(x + width - 25, y + 12, 3, 3);
      this.ctx.fillStyle = '#38bdf8'; // Glistening dew drops
      this.ctx.fillRect(x + 14, y + 13, 1, 2);
      this.ctx.fillRect(x + width - 26, y + 15, 1, 2);
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
    if (!this.level || !this.level.torches) return;
    const fireFx = window.spriteManager && window.spriteManager.sprites && window.spriteManager.sprites.fx ? window.spriteManager.sprites.fx.fire : null;
    const props = window.spriteManager && window.spriteManager.sprites ? window.spriteManager.sprites.props : null;

    // Biome default torch color
    let defaultColor = 'orange';
    const biome = this.level.biome || '';
    const lvlId = this.level.id || '';
    if (biome === 'frozen_peaks' || lvlId === 'tower2' || lvlId.includes('frost') || lvlId.includes('glacior')) {
      defaultColor = 'blue';
    } else if (biome === 'prologue' || lvlId === 'prologue' || lvlId === 'boss_valgoth') {
      defaultColor = 'purple';
    } else if (biome === 'sunken_necropolis' || lvlId.includes('pestilence')) {
      defaultColor = 'green';
    } else if (biome === 'surface_threshold' || lvlId === 'sanctuary') {
      defaultColor = 'white';
    } else {
      defaultColor = 'orange';
    }

    const haloColors = {
      orange: { inner: 'rgba(255, 140, 30, 0.38)', mid: 'rgba(255, 70, 10, 0.14)', ember: '#ff4500' },
      green:  { inner: 'rgba(74, 222, 128, 0.38)', mid: 'rgba(22, 101, 52, 0.14)', ember: '#22c55e' },
      blue:   { inner: 'rgba(56, 189, 248, 0.38)', mid: 'rgba(14, 116, 144, 0.14)', ember: '#38bdf8' },
      purple: { inner: 'rgba(192, 132, 252, 0.38)', mid: 'rgba(107, 33, 168, 0.14)', ember: '#c084fc' },
      white:  { inner: 'rgba(254, 243, 199, 0.40)', mid: 'rgba(245, 158, 11, 0.14)', ember: '#fde047' }
    };

    const animIdx = Math.floor(Date.now() / 110) % 6;

    for (const t of this.level.torches) {
      const rx = Math.round(t.x - camX);
      const ry = Math.round(t.y - camY);

      // Frustum culling
      if (rx < -60 || rx > this.vWidth + 60 || ry < -60 || ry > this.vHeight + 60) continue;

      const tColor = t.color || (t.blue ? 'blue' : defaultColor);
      const frames = fireFx && fireFx[tColor] && fireFx[tColor].length > 0
        ? fireFx[tColor]
        : (t.blue ? props?.blueTorch : props?.torch);

      const hColor = haloColors[tColor] || haloColors.orange;

      // Check if torch sits directly on a horizontal platform surface (ground brazier)
      const isOnFloor = this.level.platforms && this.level.platforms.some(p =>
        t.x >= p.x - 10 && t.x <= p.x + p.w + 10 && Math.abs(p.y - (t.y + 24)) < 24
      );

      this.ctx.save();

      if (isOnFloor) {
        // ── FREESTANDING GOTHIC GROUND BRAZIER (Pebetero Trípode de Forja) ──
        // Iron Tripod Legs
        this.ctx.fillStyle = '#110d18';
        this.ctx.fillRect(rx - 8, ry + 16, 3, 12);
        this.ctx.fillRect(rx + 5, ry + 16, 3, 12);
        this.ctx.fillRect(rx - 2, ry + 18, 4, 10);
        // Splayed feet
        this.ctx.fillStyle = '#2d2438';
        this.ctx.fillRect(rx - 10, ry + 26, 4, 2);
        this.ctx.fillRect(rx + 6, ry + 26, 4, 2);
        // Iron Cauldron Bowl
        this.ctx.fillStyle = '#1a1424';
        this.ctx.fillRect(rx - 9, ry + 10, 18, 7);
        this.ctx.fillStyle = '#3f334d';
        this.ctx.fillRect(rx - 10, ry + 9, 20, 2);
        this.ctx.fillStyle = '#110d18';
        this.ctx.fillRect(rx - 7, ry + 17, 14, 2);
        // Glowing Coals bed inside bowl
        this.ctx.fillStyle = '#260e05';
        this.ctx.fillRect(rx - 7, ry + 10, 14, 3);
        this.ctx.fillStyle = hColor.ember;
        this.ctx.fillRect(rx - 5, ry + 10, 4, 2);
        this.ctx.fillRect(rx + 1, ry + 10, 4, 2);
      } else {
        // ── ORNATE GOTHIC WALL SCONCE (Antorcha de Pared de Hierro Forjado) ──
        // Wrought iron wall backplate with rivet details
        this.ctx.fillStyle = '#0f0c15';
        this.ctx.fillRect(rx - 4, ry + 6, 8, 22);
        this.ctx.fillStyle = '#2a2233';
        this.ctx.fillRect(rx - 3, ry + 8, 6, 18);
        this.ctx.fillStyle = '#e2e8f0';
        this.ctx.fillRect(rx - 2, ry + 7, 1.5, 1.5);
        this.ctx.fillRect(rx + 0.5, ry + 7, 1.5, 1.5);
        this.ctx.fillRect(rx - 2, ry + 25, 1.5, 1.5);
        this.ctx.fillRect(rx + 0.5, ry + 25, 1.5, 1.5);

        // Curved forged support arm
        this.ctx.fillStyle = '#1a1424';
        this.ctx.fillRect(rx - 6, ry + 14, 12, 3);
        this.ctx.fillRect(rx - 7, ry + 11, 14, 2);
        this.ctx.fillStyle = '#4a3d5b';
        this.ctx.fillRect(rx - 5, ry + 13, 10, 1);

        // Torch cup / brazier ring
        this.ctx.fillStyle = '#161120';
        this.ctx.fillRect(rx - 7, ry + 8, 14, 4);
        this.ctx.fillStyle = '#3a2f47';
        this.ctx.fillRect(rx - 8, ry + 7, 16, 2);

        // Bed of burning coals
        this.ctx.fillStyle = '#2b1006';
        this.ctx.fillRect(rx - 5, ry + 8, 10, 2);
        this.ctx.fillStyle = hColor.ember;
        this.ctx.fillRect(rx - 3, ry + 8, 6, 1);
      }

      // 2. Animated Flame (Seamlessly nested into the coal bed at ry - 18)
      if (frames && frames.length > 0) {
        const frame = frames[animIdx % frames.length];
        this.ctx.drawImage(frame, rx - 12, ry - 18, 24, 30);
      }

      // 3. Dynamic Radial Light Halo with subtle flickering
      const flicker = (Math.sin(Date.now() * 0.008 + rx * 0.1) * 3 + Math.cos(Date.now() * 0.013 + ry * 0.1) * 2);
      const haloRadius = 75 + flicker;

      const grad = this.ctx.createRadialGradient(rx, ry + 2, 4, rx, ry + 2, haloRadius);
      grad.addColorStop(0, hColor.inner);
      grad.addColorStop(0.45, hColor.mid);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(rx, ry + 2, haloRadius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
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

    // Twin Celestial Brazier Flames atop pillars
    const fireFrames = (window.spriteManager && window.spriteManager.sprites?.fx?.fire?.purple) ||
                       (window.spriteManager && window.spriteManager.sprites?.fx?.fire?.white);
    if (fireFrames && fireFrames.length > 0) {
      const fIdx = Math.floor(Date.now() / 110) % fireFrames.length;
      this.ctx.drawImage(fireFrames[fIdx], rx + 4 - 5, ry + 16 - 20, 22, 22);
      this.ctx.drawImage(fireFrames[fIdx], rx + w - 16 - 5, ry + 16 - 20, 22, 22);
    }

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

  drawHermitMerchant(merchant, camX, camY) {
    if (!merchant) return;
    const rx = Math.round(merchant.x - camX);
    const ry = Math.round(merchant.y - camY);
    const bob = Math.sin(Date.now() / 400) * 1.5;
    const ctx = this.ctx;
    ctx.save();

    // Robed hermit body
    ctx.fillStyle = '#1e1b4b'; // Dark mystic navy robe
    ctx.fillRect(rx + 6, ry + 12 + bob, 16, 26);
    // Cowl & hood
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.moveTo(rx + 5, ry + 12 + bob);
    ctx.lineTo(rx + 14, ry + 2 + bob);
    ctx.lineTo(rx + 23, ry + 12 + bob);
    ctx.closePath();
    ctx.fill();
    // Glowing yellow eyes inside cowl
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(rx + 10, ry + 8 + bob, 2, 2);
    ctx.fillRect(rx + 16, ry + 8 + bob, 2, 2);
    // Wooden staff
    ctx.fillStyle = '#78350f';
    ctx.fillRect(rx + 24, ry + 6 + bob, 3, 32);
    // Golden lantern hanging from staff with warm aura
    const lanternFlicker = 0.8 + Math.sin(Date.now() / 150) * 0.2;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(rx + 22, ry + 20 + bob, 7, 9);
    ctx.fillStyle = `rgba(245, 158, 11, ${0.35 * lanternFlicker})`;
    ctx.beginPath();
    ctx.arc(rx + 25, ry + 24 + bob, 22, 0, Math.PI * 2);
    ctx.fill();

    // Animated Haven Campfire beside Hermit
    const campFireFrames = window.spriteManager && window.spriteManager.sprites?.fx?.fire?.orange;
    if (campFireFrames && campFireFrames.length > 0) {
      const cIdx = Math.floor(Date.now() / 100) % campFireFrames.length;
      ctx.fillStyle = '#292524';
      ctx.fillRect(rx - 22, ry + 32, 18, 6);
      ctx.fillStyle = '#44403c';
      ctx.fillRect(rx - 20, ry + 31, 14, 2);
      ctx.drawImage(campFireFrames[cIdx], rx - 25, ry + 12, 24, 24);
      const campGlow = ctx.createRadialGradient(rx - 13, ry + 24, 2, rx - 13, ry + 24, 38);
      campGlow.addColorStop(0, 'rgba(255, 140, 20, 0.28)');
      campGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = campGlow;
      ctx.beginPath();
      ctx.arc(rx - 13, ry + 24, 38, 0, Math.PI * 2);
      ctx.fill();
    }

    // Overhead title
    ctx.font = 'bold 9px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText('Ermitaño del Averno', rx + 14, ry - 6);

    ctx.restore();
  }

  drawChallengeShrine(cs, camX, camY) {
    if (!cs) return;
    const rx = Math.round(cs.x - camX);
    const ry = Math.round(cs.y - camY);
    const ctx = this.ctx;
    ctx.save();

    // Obelisk stone pillar
    ctx.fillStyle = cs.completed ? '#475569' : '#0f172a';
    ctx.fillRect(rx + 6, ry + 8, 20, 34);
    // Base pedestal
    ctx.fillStyle = cs.completed ? '#334155' : '#1e293b';
    ctx.fillRect(rx + 2, ry + 36, 28, 6);

    // Glowing runes on the pillar
    const runeColor = cs.completed ? '#94a3b8' : (cs.active ? '#ef4444' : '#f59e0b');
    const glowPulse = cs.completed ? 0.3 : (0.6 + Math.sin(Date.now() / 250) * 0.35);
    ctx.fillStyle = runeColor;
    ctx.globalAlpha = glowPulse;
    ctx.fillRect(rx + 14, ry + 14, 4, 4);
    ctx.fillRect(rx + 12, ry + 22, 8, 3);
    ctx.fillRect(rx + 15, ry + 28, 2, 5);

    // Floating Runic Orb on top
    const orbBob = Math.sin(Date.now() / 350) * 3;
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = runeColor;
    ctx.beginPath();
    ctx.arc(rx + 16, ry + 2 + orbBob, 5, 0, Math.PI * 2);
    ctx.fill();

    // Cursed brazier fire on the shrine
    const shrineFire = (window.spriteManager && window.spriteManager.sprites?.fx?.fire?.purple) ||
                       (window.spriteManager && window.spriteManager.sprites?.fx?.fire?.orange);
    if (shrineFire && shrineFire.length > 0 && !cs.completed) {
      const sIdx = Math.floor(Date.now() / 110) % shrineFire.length;
      ctx.drawImage(shrineFire[sIdx], rx + 6, ry - 14 + orbBob, 20, 20);
    }

    // Glowing aura
    ctx.fillStyle = cs.active ? 'rgba(239, 68, 68, 0.3)' : 'rgba(245, 158, 11, 0.25)';
    ctx.beginPath();
    ctx.arc(rx + 16, ry + 2 + orbBob, 16, 0, Math.PI * 2);
    ctx.fill();

    if (cs.active) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚔️ Restantes: ${cs.enemiesLeft}`, rx + 16, ry - 14);
    } else {
      ctx.fillStyle = cs.completed ? '#94a3b8' : '#ffd166';
      ctx.font = 'bold 9px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText(cs.completed ? 'Desafío Superado' : 'Monolito de Desafío', rx + 16, ry - 10);
    }
    ctx.restore();
  }

  activateChallengeShrine(cs) {
    if (!cs || cs.active || cs.completed) return;
    cs.active = true;
    this.originalLavaSpeed = this.level.lavaSpeed;
    this.level.lavaSpeed = Math.min(6, (this.level.lavaSpeed || 21) * 0.25); // Slow down lava during challenge

    this.showGothicAnnouncement('⚔️ ¡DESAFÍO DEL AVERNO!', 'Purga a los 4 campeones para desbloquear el Cofre Legendario.');
    if (window.soundEngine && window.soundEngine.playMeteorExplosion) {
      window.soundEngine.playMeteorExplosion();
    }
    this.triggerScreenShake(7, 0.4);

    // Spawn 4 elite enemies on and near the shrine platform
    const p = cs.platform || { x: cs.x - 70, y: cs.y + 42, w: 180 };
    for (let i = 0; i < 4; i++) {
      const offsetX = (i % 2 === 0 ? -1 : 1) * (30 + i * 28);
      const ex = Math.max(p.x + 8, Math.min(p.x + p.w - 32, cs.x + offsetX));
      const skin = this.level.biome || 'abyss';
      const enemy = new SkeletonEnemy({
        x: ex,
        y: p.y - 42,
        isElite: true,
        skin: skin,
        hp: 75 + (i * 10),
        minX: p.x + 4,
        maxX: p.x + p.w - 4
      });
      enemy.isChallenge = true;
      this.enemies.push(enemy);
      if (window.particleSystem) {
        window.particleSystem.spawnBloodExplosion(ex + 12, p.y - 20, 20);
      }
    }
  }

  // ─── TIENDA DE RESPIRO DEL ERMITAÑO ───
  openHermitShopModal() {
    if (!this.ui.hermitShopModal) return;
    this.state = 'HERMIT_SHOP';
    this.ui.hermitShopModal.classList.remove('hidden');
    this.renderHermitShopItems();
    if (window.soundEngine && window.soundEngine.playOpenSanctuary) {
      window.soundEngine.playOpenSanctuary();
    }
  }

  closeHermitShopModal() {
    if (!this.ui.hermitShopModal) return;
    this.ui.hermitShopModal.classList.add('hidden');
    if (window.soundEngine && window.soundEngine.playCloseSanctuary) {
      window.soundEngine.playCloseSanctuary();
    }
    if (this.pendingLevelUps > 0) {
      this.state = 'PLAYING';
      this.openLevelUpModal();
      return;
    }
    this.state = 'PLAYING';
  }

  renderHermitShopItems() {
    if (!this.ui.hermitShopGrid) return;
    this.ui.hermitShopGrid.innerHTML = '';

    const souls = window.progression ? Math.floor(window.progression.souls) : 0;
    const playerHp = this.player ? Math.round(this.player.hp) : 100;
    const playerMaxHp = this.player ? Math.round(this.player.maxHp) : 100;
    const relicsCount = window.progression && window.progression.runRelics ? window.progression.runRelics.length : 0;

    if (this.ui.hermitShopSouls) this.ui.hermitShopSouls.textContent = souls;
    if (this.ui.hermitShopHp) this.ui.hermitShopHp.textContent = `${playerHp}/${playerMaxHp}`;
    if (this.ui.hermitShopRelicsCount) this.ui.hermitShopRelicsCount.textContent = relicsCount;

    const items = [
      {
        id: 'potion_heal',
        name: 'Poción de Sangre Vital',
        icon: '🍷',
        cost: 35,
        desc: 'Restaura +75 HP de salud inmediatamente para resistir el próximo piso.',
        canBuy: () => this.player && this.player.hp < this.player.maxHp,
        buy: () => {
          if (this.player) {
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + 75);
            if (window.particleSystem) window.particleSystem.spawnHealingCrosses(this.player.x + 12, this.player.y + 16, 12);
          }
        }
      },
      {
        id: 'potion_regen',
        name: 'Elixir de Regeneración',
        icon: '🧪',
        cost: 60,
        desc: 'Otorga +2.0 HP/s de regeneración pasiva permanente para el resto de la run.',
        canBuy: () => true,
        buy: () => {
          if (window.progression) {
            window.progression.runBonusRegen = (window.progression.runBonusRegen || 0) + 2.0;
          }
        }
      },
      {
        id: 'weapon_sharpen',
        name: 'Piedra de Afilado Sombría',
        icon: '🗡️',
        cost: 50,
        desc: 'Afila la daga básica aumentando su daño en +10 para toda la partida.',
        canBuy: () => true,
        buy: () => {
          if (window.progression) {
            window.progression.runBonusDaggerDmg = (window.progression.runBonusDaggerDmg || 0) + 10;
          }
        }
      },
      {
        id: 'relic_random',
        name: 'Reliquia Arcana del Ermitaño',
        icon: '🔮',
        cost: 85,
        desc: 'El Ermitaño te entrega una reliquia pasiva ancestral que aún no posees.',
        canBuy: () => {
          if (!window.progression) return false;
          return window.progression.relicDefinitions.some(r => !window.progression.hasRelic(r.id));
        },
        buy: () => {
          if (window.progression) {
            const available = window.progression.relicDefinitions.filter(r => !window.progression.hasRelic(r.id));
            if (available.length > 0) {
              const picked = available[Math.floor(Math.random() * available.length)];
              window.progression.addRelic(picked.id);
            }
          }
        }
      },
      {
        id: 'relic_hermes',
        name: 'Sandalias de Hermes',
        icon: '👟',
        cost: 70,
        desc: 'Reliquia Pasiva: Reduce el enfriamiento del Dash a 0.4s y deja una estela de fuego.',
        canBuy: () => window.progression && !window.progression.hasRelic('relic_dash_master'),
        buy: () => {
          if (window.progression) window.progression.addRelic('relic_dash_master');
        }
      }
    ];

    for (const item of items) {
      const card = document.createElement('div');
      card.className = 'hermit-item-card';

      const availableToBuy = item.canBuy();
      const canAfford = souls >= item.cost;

      card.innerHTML = `
        <div>
          <div class="hermit-item-header">
            <span class="hermit-item-icon">${item.icon}</span>
            <span class="hermit-item-name">${item.name}</span>
          </div>
          <div class="hermit-item-desc" style="margin-top:6px;">${item.desc}</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">
          <span style="color:#f4d06f; font-weight:bold; font-size:14px;">${item.cost} 🔮 Almas</span>
          <button class="hermit-item-btn" ${(!canAfford || !availableToBuy) ? 'disabled' : ''}>
            ${!availableToBuy ? 'Adquirido' : (canAfford ? 'Comprar' : 'Almas Insuficientes')}
          </button>
        </div>
      `;

      const buyBtn = card.querySelector('.hermit-item-btn');
      if (buyBtn && canAfford && availableToBuy) {
        buyBtn.addEventListener('click', () => {
          window.progression.souls -= item.cost;
          item.buy();
          if (window.soundEngine && window.soundEngine.playUpgradePurchase) {
            window.soundEngine.playUpgradePurchase();
          }
          window.progression.updateHUD();
          this.renderHermitShopItems();
        });
      }

      this.ui.hermitShopGrid.appendChild(card);
    }
  }

  // ─── ALTAR DE SANGRE Y PACTOS OSCUROS ───
  openBloodAltarModal(altar) {
    if (!this.ui.bloodAltarModal) return;
    this.state = 'BLOOD_ALTAR';
    this.currentBloodAltar = altar;

    const curses = [
      {
        id: 'curse_damage',
        isCursed: true,
        name: 'Sed Maldita',
        desc: '+40% de daño con la espada, pero recibes +15% de daño recibido adicional.',
        icon: '🩸'
      },
      {
        id: 'curse_greed',
        isCursed: true,
        name: 'Avaricia Abisal',
        desc: 'Triplica el valor de todas las almas recolectadas (x3), pero reduce tu velocidad en un 10%.',
        icon: '🪙'
      },
      {
        id: 'curse_dash',
        isCursed: true,
        name: 'Pacto de Sombras',
        desc: 'El enfriamiento del Dash se reinicia instantáneamente cada vez que aniquilas a un enemigo.',
        icon: '⚡'
      }
    ];

    const unacquired = curses.filter(c => !window.progression || !window.progression.hasBoon(c.id));
    this.offeredCursedBoon = unacquired.length > 0 ? unacquired[Math.floor(Math.random() * unacquired.length)] : curses[0];

    // Refresh UI texts
    const hp = this.player ? Math.round(this.player.hp) : 100;
    const maxHp = this.player ? Math.round(this.player.maxHp) : 100;
    const souls = window.progression ? Math.floor(window.progression.souls) : 0;

    if (this.ui.bloodAltarCurrentHp) this.ui.bloodAltarCurrentHp.textContent = `${hp}/${maxHp}`;
    if (this.ui.bloodAltarSouls) this.ui.bloodAltarSouls.textContent = souls;
    if (this.ui.bloodAltarBoonName) {
      this.ui.bloodAltarBoonName.innerHTML = `Recompensa: Bendición "${this.offeredCursedBoon.name}"<br><span style="font-size:11px; color:#fca5a5; font-weight:normal;">${this.offeredCursedBoon.desc}</span>`;
    }

    if (this.ui.btnPactSouls) {
      const canPayHp = hp > 30;
      this.ui.btnPactSouls.disabled = !canPayHp;
      this.ui.btnPactSouls.style.opacity = canPayHp ? '1' : '0.4';
      this.ui.btnPactSouls.style.cursor = canPayHp ? 'pointer' : 'not-allowed';
    }

    if (this.ui.btnPactCurse) {
      const canPayMaxHp = maxHp > 25 && (!window.progression || !window.progression.hasBoon(this.offeredCursedBoon.id));
      this.ui.btnPactCurse.disabled = !canPayMaxHp;
      this.ui.btnPactCurse.style.opacity = canPayMaxHp ? '1' : '0.4';
      this.ui.btnPactCurse.style.cursor = canPayMaxHp ? 'pointer' : 'not-allowed';
      if (window.progression && window.progression.hasBoon(this.offeredCursedBoon.id)) {
        this.ui.btnPactCurse.textContent = 'Pacto Ya Sellado';
      } else {
        this.ui.btnPactCurse.textContent = 'Sellar Pacto Maldito';
      }
    }

    this.ui.bloodAltarModal.classList.remove('hidden');
    if (window.soundEngine && window.soundEngine.playOpenSanctuary) {
      window.soundEngine.playOpenSanctuary();
    }
  }

  closeBloodAltarModal() {
    if (!this.ui.bloodAltarModal) return;
    this.ui.bloodAltarModal.classList.add('hidden');
    this.currentBloodAltar = null;
    this.offeredCursedBoon = null;
    if (window.soundEngine && window.soundEngine.playCloseSanctuary) {
      window.soundEngine.playCloseSanctuary();
    }
    if (this.pendingLevelUps > 0) {
      this.state = 'PLAYING';
      this.openLevelUpModal();
      return;
    }
    this.state = 'PLAYING';
  }

  acceptBloodPactSouls() {
    if (!this.player || this.player.hp <= 30) return;
    this.player.hp -= 30;

    if (window.progression) {
      window.progression.addSouls(180);
    }

    if (window.particleSystem) {
      window.particleSystem.spawnBloodExplosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 45);
      if (window.particleSystem.spawnFloatingText) {
        window.particleSystem.spawnFloatingText('-30 HP | +180 🔮 Almas', this.player.x + this.player.w / 2, this.player.y - 15, { isMegabonk: true });
      }
    }

    if (window.soundEngine && window.soundEngine.playHit) {
      window.soundEngine.playHit();
    }
    this.triggerScreenShake(10, 0.35);
    if (this.triggerGamepadRumble) this.triggerGamepadRumble(300, 0.7, 0.7);

    if (this.currentBloodAltar) {
      this.currentBloodAltar.use();
    }
    this.closeBloodAltarModal();
  }

  acceptBloodPactCurse() {
    if (!this.player || this.player.maxHp <= 25 || !this.offeredCursedBoon) return;

    if (window.progression) {
      window.progression.bloodAltarMaxHpPenalty = (window.progression.bloodAltarMaxHpPenalty || 0) + 15;
      window.progression.chooseBoon(this.offeredCursedBoon);
      const stats = window.progression.getPlayerStats();
      this.player.maxHp = stats.maxHp;
      this.player.hp = Math.min(this.player.hp, this.player.maxHp);
      this.player.applyProgressionStats();
    }

    if (window.particleSystem) {
      window.particleSystem.spawnBloodExplosion(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 60);
      if (window.particleSystem.spawnFloatingText) {
        window.particleSystem.spawnFloatingText(`💀 PACTO SELLADO: ${this.offeredCursedBoon.name}`, this.player.x + this.player.w / 2, this.player.y - 15, { isMegabonk: true });
      }
    }

    if (this.showGothicAnnouncement) {
      this.showGothicAnnouncement(`🩸 PACTO DE OBSIDIANA SELLADO`, `${this.offeredCursedBoon.name}: -15 Max HP`);
    }

    if (window.soundEngine) {
      if (window.soundEngine.playAchievementUnlocked) window.soundEngine.playAchievementUnlocked();
      else if (window.soundEngine.playBoonSelect) window.soundEngine.playBoonSelect();
    }
    this.triggerScreenShake(15, 0.5);
    if (this.triggerGamepadRumble) this.triggerGamepadRumble(400, 0.8, 1.0);

    if (this.currentBloodAltar) {
      this.currentBloodAltar.use();
    }
    this.closeBloodAltarModal();
  }

  getLavaPalette() {
    const theme = this.level ? this.level.lavaTheme : null;
    const levelId = this.level ? this.level.id : '';

    // Floor 1: El Foso Abisal (Porous Volcanic Basalt & Flaming Molten Orange Lava)
    if (theme === 'infernal' || levelId === 'tower1' || levelId === 'tower') {
      return {
        topColor: '#ff6200',      // Brilliant blazing molten orange
        midColor: '#ff2200',      // Intense burning flame red
        bottomColor: '#7a0000',   // Deep volcanic magma foundation
        waveColor: '#ffe600',     // Bright solar crest flares
        glowColor: 'rgba(255, 98, 0, 0.65)',
        bubbleColor: '#ffdd55'
      };
    } else if (theme === 'spectral') {
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
      topColor: '#ff6200',
      midColor: '#ff1a00',
      bottomColor: '#660000',
      waveColor: '#ffcc00',
      glowColor: 'rgba(255, 98, 0, 0.55)',
      bubbleColor: '#ffe066'
    };
  }

  drawLava(lavaY, camX, camY) {
    const ry = Math.round(lavaY - camY);
    const palette = this.getLavaPalette();

    // When lava is below the screen, show a bottom screen proximity threat indicator
    if (ry > this.vHeight) {
      const distancePx = ry - this.vHeight;
      if (distancePx < 1800 && this.level.risingLava && !this.level.isCombatScene) {
        this.ctx.save();
        const distM = Math.max(1, Math.round(distancePx / 32));
        const pulse = 0.55 + Math.sin(Date.now() * 0.008) * 0.35;
        this.ctx.globalAlpha = Math.min(0.9, pulse);

        // Warning bottom gradient strip
        const barH = 26;
        const grad = this.ctx.createLinearGradient(0, this.vHeight - barH, 0, this.vHeight);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, palette.glowColor);
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, this.vHeight - barH, this.vWidth, barH);

        // Warning badge text
        this.ctx.font = 'bold 12px MedievalSharp, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = palette.waveColor;
        this.ctx.shadowColor = palette.topColor;
        this.ctx.shadowBlur = 8;
        this.ctx.fillText(`▲ LAVA ASCENDIENDO: ${distM}m ▲`, this.vWidth / 2, this.vHeight - 8);
        this.ctx.restore();
      }
      return;
    }

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

    // Never store a modal state in prevStateBeforeModal
    const nonModalStates = ['PLAYING', 'MENU'];
    if (nonModalStates.includes(this.state)) {
      this.prevStateBeforeModal = this.state;
    } else if (!this.prevStateBeforeModal || this.prevStateBeforeModal === 'LEVEL_UP' || this.prevStateBeforeModal === 'BOON_SELECT') {
      this.prevStateBeforeModal = 'PLAYING';
    }

    this.state = 'BOON_SELECT';
    this.input.attack = false;
    this.modalInputCooldownUntil = Date.now() + 450;
    if (this.ui && this.ui.interactionBadge) {
      this.ui.interactionBadge.style.display = 'none';
    }

    // Update modal title for relic chest
    const modalTitle = this.ui.boonModal ? (this.ui.boonModal.querySelector('h2') || this.ui.boonModal.querySelector('.modal-title')) : null;
    if (modalTitle) {
      modalTitle.innerHTML = isRelic ? '👑 RELIQUIA DE JEFE DERROTADO' : 'GRACIAS Y ARMAS DEL ABISMO';
    }

    if (this.ui && this.ui.boonCardsContainer) {
      this.ui.boonCardsContainer.classList.add('modal-input-locked');
      setTimeout(() => {
        if (this.ui && this.ui.boonCardsContainer) {
          this.ui.boonCardsContainer.classList.remove('modal-input-locked');
        }
      }, 450);
    }

    this.renderBoonCards(boons);

    if (this.ui.btnBoonReroll) {
      this.ui.btnBoonReroll.disabled = !window.progression.canReroll();
    }

    if (this.ui && this.ui.boonModal) {
      this.ui.boonModal.classList.remove('hidden');
    }
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
        if (Date.now() < this.modalInputCooldownUntil) return;
        window.progression.chooseBoon(b);
        this.closeBoonSelectionModal();
      });

      this.ui.boonCardsContainer.appendChild(card);
    }
  }

  closeBoonSelectionModal() {
    this.input.attack = false;
    this.modalInputCooldownUntil = 0;
    if (this.ui && this.ui.boonModal) {
      this.ui.boonModal.classList.add('hidden');
    }

    // If level-up was queued during chest interaction, seamlessly transition to Level Up Modal!
    if (this.pendingLevelUps > 0) {
      this.state = 'PLAYING';
      this.openLevelUpModal();
      return;
    }

    const targetState = (this.prevStateBeforeModal && !['LEVEL_UP', 'BOON_SELECT', 'SANCTUARY', 'HERMIT_SHOP', 'SLOT_MACHINE'].includes(this.prevStateBeforeModal))
      ? this.prevStateBeforeModal
      : 'PLAYING';
    this.prevStateBeforeModal = null;
    this.state = targetState;
  }

  // ─── VAMPIRE SURVIVORS LEVEL-UP MODAL & QUEUE ───
  queueLevelUps(count = 1) {
    if (!this.pendingLevelUps) this.pendingLevelUps = 0;
    this.pendingLevelUps += count;
    // Only open immediately if playing and no other modal is currently active!
    if (this.state === 'PLAYING') {
      this.openLevelUpModal();
    }
    // If state is 'BOON_SELECT', 'LEVEL_UP', 'HERMIT_SHOP', 'SANCTUARY', 'SLOT_MACHINE', 'PAUSED', 'DIALOGUE',
    // the level up will stay safely in pendingLevelUps and open cleanly as soon as the active modal closes.
  }

  openLevelUpModal() {
    if (!window.progression) return;
    if (!this.pendingLevelUps || this.pendingLevelUps < 1) {
      this.pendingLevelUps = 1;
    }

    const boons = window.progression.getRandomBoons(3, false);
    if (boons.length === 0) {
      this.pendingLevelUps = 0;
      this.state = 'PLAYING';
      return;
    }

    // Only record previous state if it was a non-modal state
    const nonModalStates = ['PLAYING', 'MENU'];
    if (nonModalStates.includes(this.state)) {
      this.prevStateBeforeModal = this.state;
    } else if (!this.prevStateBeforeModal || this.prevStateBeforeModal === 'LEVEL_UP' || this.prevStateBeforeModal === 'BOON_SELECT') {
      this.prevStateBeforeModal = 'PLAYING';
    }

    this.state = 'LEVEL_UP';
    this.input.attack = false;
    this.modalInputCooldownUntil = Date.now() + 450;
    if (this.ui && this.ui.interactionBadge) {
      this.ui.interactionBadge.style.display = 'none';
    }

    if (this.ui && this.ui.modalRunLevel) {
      this.ui.modalRunLevel.textContent = window.progression.runLevel;
    }

    if (this.ui && this.ui.levelupCardsContainer) {
      this.ui.levelupCardsContainer.classList.add('modal-input-locked');
      setTimeout(() => {
        if (this.ui && this.ui.levelupCardsContainer) {
          this.ui.levelupCardsContainer.classList.remove('modal-input-locked');
        }
      }, 450);
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
        if (Date.now() < this.modalInputCooldownUntil) return;
        window.progression.chooseBoon(b);
        this.closeLevelUpModal();
      });

      this.ui.levelupCardsContainer.appendChild(card);
    }
  }

  closeLevelUpModal() {
    this.input.attack = false;
    this.modalInputCooldownUntil = 0;
    if (this.pendingLevelUps > 1) {
      this.pendingLevelUps--;
      this.openLevelUpModal();
      return;
    }
    this.pendingLevelUps = 0;
    if (this.ui && this.ui.levelUpModal) {
      this.ui.levelUpModal.classList.add('hidden');
    }
    // Always return cleanly to PLAYING (or valid non-modal state), never a stuck modal state!
    const targetState = (this.prevStateBeforeModal && !['LEVEL_UP', 'BOON_SELECT', 'SANCTUARY', 'HERMIT_SHOP', 'SLOT_MACHINE'].includes(this.prevStateBeforeModal))
      ? this.prevStateBeforeModal
      : 'PLAYING';
    this.prevStateBeforeModal = null;
    this.state = targetState;
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
    if (this.ui && this.ui.sanctuaryModal) {
      this.ui.sanctuaryModal.classList.add('hidden');
    }
    if (this.player) {
      this.player.applyProgressionStats();
    }
    if (this.pendingLevelUps > 0) {
      this.state = 'PLAYING';
      this.openLevelUpModal();
      return;
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
    this.isSlotSpinning = false;
    if (this.ui.btnSpinSlot) this.ui.btnSpinSlot.disabled = false;
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
    if (this.ui && this.ui.slotMachineModal) {
      this.ui.slotMachineModal.classList.add('hidden');
    }
    this.isSlotSpinning = false;
    if (this.ui && this.ui.btnSpinSlot) this.ui.btnSpinSlot.disabled = false;
    if (this.pendingLevelUps > 0) {
      this.state = 'PLAYING';
      this.openLevelUpModal();
      return;
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
        if (active.hasHolyCross) weaponNames.push(`Cruces ✝️ (Nv.${active.holyCrossLevel || 1})`);
        if (active.hasHellfireOrb) weaponNames.push(`Orbe ☄️ (Nv.${active.hellfireOrbLevel || 1})`);
        if (active.hasLightning) weaponNames.push(`Rayos ⚡ (Nv.${active.lightningLevel || 1})`);
        if (active.hasScythe) weaponNames.push(`Guadaña 🪓 (Nv.${active.scytheLevel || 1})`);
        if (active.hasGarlic) weaponNames.push(`Penitencia 📿 (Nv.${active.garlicLevel || 1})`);
        if (active.hasJavelin) weaponNames.push(`Lanza 🔱 (Nv.${active.javelinLevel || 1})`);
        if (active.hasChakram) weaponNames.push(`Chakram 🌀 (Nv.${active.chakramLevel || 1})`);
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
      try {
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
          if (window.progression && window.progression.unlockAchievement) {
            window.progression.unlockAchievement('lucky_spin');
          }
        } else if (outcomeType === 'weapon_win') {
          [reelWindow1, reelWindow2, reelWindow3].forEach(w => w && w.classList.add('winner'));
          const alreadyHad = this.passiveWeaponsManager && this.passiveWeaponsManager.hasWeapon(matchedSymbol.id);
          if (this.passiveWeaponsManager) {
            this.passiveWeaponsManager.acquireOrUpgrade(matchedSymbol.id);
          }
          const newLvl = this.passiveWeaponsManager ? this.passiveWeaponsManager.getLevel(matchedSymbol.id) : 1;
          if (window.soundEngine && window.soundEngine.playSlotJackpot) {
            window.soundEngine.playSlotJackpot();
          }
          if (window.particleSystem) {
            window.particleSystem.spawnFloatingText(`✨ ¡${matchedSymbol.name.toUpperCase()}!`, this.player ? this.player.x + 12 : 1170, this.player ? this.player.y - 20 : 330, { isMegabonk: true });
          }
          if (this.ui.slotStatusBox) {
            if (alreadyHad) {
              this.ui.slotStatusBox.innerHTML = `✨ <b style="color:#00f5d4;">¡TRIPLE COINCIDENCIA!</b> Arma potenciada: <b>${matchedSymbol.name} ${matchedSymbol.icon}</b> a <b>Nv.${newLvl}</b>.`;
            } else {
              this.ui.slotStatusBox.innerHTML = `✨ <b style="color:#00f5d4;">¡TRIPLE COINCIDENCIA!</b> Has ganado: <b>${matchedSymbol.name} ${matchedSymbol.icon}</b> (Nv.1) para iniciar tu run.`;
            }
          }
          if (window.progression && window.progression.unlockAchievement) {
            window.progression.unlockAchievement('lucky_spin');
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
          if (window.progression && window.progression.unlockAchievement) {
            window.progression.unlockAchievement('lucky_spin');
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
      } catch (err) {
        console.error('Error evaluating slot outcome:', err);
      } finally {
        this.updateSlotMachineUI();
        this.renderSanctuaryWallet();
        this.isSlotSpinning = false;
        if (this.ui.btnSpinSlot) this.ui.btnSpinSlot.disabled = false;
      }
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

  // ─── GAMEPAD & HAPTIC RUMBLE ENGINE ───
  pollGamepad() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    let gp = null;
    if (this.gamepadIndex !== null && gamepads[this.gamepadIndex]) {
      gp = gamepads[this.gamepadIndex];
    } else {
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          gp = gamepads[i];
          this.gamepadIndex = i;
          break;
        }
      }
    }
    if (!gp) return;

    const prev = this.gamepadPrevButtons || {};
    const curr = {};
    if (gp.buttons) {
      for (let i = 0; i < gp.buttons.length; i++) {
        curr[i] = gp.buttons[i] ? (gp.buttons[i].pressed || gp.buttons[i].value > 0.5) : false;
      }
    }
    const justPressed = (btn) => !!curr[btn] && !prev[btn];

    // Detect activity to switch input device prompt
    let hasActivity = false;
    const stickX = gp.axes && gp.axes[0] !== undefined ? gp.axes[0] : 0;
    const stickY = gp.axes && gp.axes[1] !== undefined ? gp.axes[1] : 0;
    const DEADZONE = 0.25;

    if (Math.abs(stickX) > DEADZONE || Math.abs(stickY) > DEADZONE) hasActivity = true;
    for (let i = 0; i < 17; i++) {
      if (curr[i]) { hasActivity = true; break; }
    }

    if (hasActivity && this.lastInputDevice !== 'gamepad') {
      this.lastInputDevice = 'gamepad';
      this.updateInputPrompts('gamepad');
    }

    // In-game controls mapping
    if (this.state === 'PLAYING') {
      const leftActive = stickX < -DEADZONE || !!curr[14];
      const rightActive = stickX > DEADZONE || !!curr[15];
      const upActive = stickY < -DEADZONE || !!curr[12];
      const downActive = stickY > DEADZONE || !!curr[13];

      if (leftActive) this.input.left = true;
      else if (this.lastInputDevice === 'gamepad' && !curr[14]) this.input.left = false;

      if (rightActive) this.input.right = true;
      else if (this.lastInputDevice === 'gamepad' && !curr[15]) this.input.right = false;

      if (upActive) this.input.up = true;
      else if (this.lastInputDevice === 'gamepad' && !curr[12]) this.input.up = false;

      if (downActive) this.input.down = true;
      else if (this.lastInputDevice === 'gamepad' && !curr[13]) this.input.down = false;

      if (curr[0]) this.input.jump = true;
      else if (this.lastInputDevice === 'gamepad') this.input.jump = false;

      if (curr[2]) this.input.attack = true;
      else if (this.lastInputDevice === 'gamepad') this.input.attack = false;

      if (curr[1] || curr[5]) this.input.dash = true;
      else if (this.lastInputDevice === 'gamepad') this.input.dash = false;

      if (curr[3] || curr[4]) this.input.interact = true;
      else if (this.lastInputDevice === 'gamepad') this.input.interact = false;

      if (justPressed(0) && this.player) {
        this.player.jumpBufferTimer = this.player.jumpBufferMax;
      }
    }

    // One-shot Controller Buttons
    if (justPressed(9)) { // Start / Options -> Pause toggle
      if (this.state === 'HERMIT_SHOP') {
        this.closeHermitShopModal();
      } else if (this.state === 'BLOOD_ALTAR') {
        this.closeBloodAltarModal();
      } else if (this.state === 'SANCTUARY') {
        this.closeSanctuaryModal();
      } else if (this.state === 'SLOT_MACHINE') {
        this.closeSlotMachineModal();
      } else if (this.state === 'BOON_SELECT') {
        if (!this.ui.boonModal || this.ui.boonModal.classList.contains('hidden')) {
          this.closeBoonSelectionModal();
        }
      } else if (this.state === 'LEVEL_UP') {
        if (!this.ui.levelUpModal || this.ui.levelUpModal.classList.contains('hidden')) {
          this.closeLevelUpModal();
        }
      } else {
        this.togglePause();
      }
    }

    if (justPressed(0) || justPressed(1) || justPressed(2)) {
      if (this.state === 'DIALOGUE') {
        window.dialogueManager.advance();
      } else if (this.state === 'INTRO') {
        this.advanceIntroScreen();
      } else if (this.state === 'VICTORY') {
        const btn = document.getElementById('btn-victory-next');
        if (btn) btn.click();
      }
    }

    if (justPressed(1) || justPressed(5)) { // B or RB -> Interact
      if (this.state === 'PLAYING') {
        if (this.activeChest) {
          this.openBoonChest(this.activeChest);
        } else if (this.nearSlotMachine) {
          this.openSlotMachineModal();
        } else if (this.nearSanctuary) {
          this.openSanctuaryModal();
        } else if (this.nearHermitMerchant) {
          this.openHermitShopModal();
        } else if (this.nearBloodAltar && this.activeBloodAltar) {
          this.openBloodAltarModal(this.activeBloodAltar);
        } else if (this.nearChallengeShrine) {
          this.activateChallengeShrine(this.level.challengeShrine);
        } else {
          this.checkNpcInteraction();
        }
      }
    }

    if (justPressed(3)) { // Y / Triangle -> Toggle Sanctuary if near or in prologue
      if (this.level && (this.level.id === 'prologue' || this.nearSanctuary)) {
        this.toggleSanctuaryModal();
      }
    }

    this.gamepadPrevButtons = curr;
  }

  triggerGamepadRumble(duration = 200, weak = 0.5, strong = 0.5) {
    if (!this.vibrationEnabled) return;
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    const gamepads = navigator.getGamepads();
    const gp = (this.gamepadIndex !== null && gamepads[this.gamepadIndex]) ? gamepads[this.gamepadIndex] : null;
    if (gp && gp.vibrationActuator && typeof gp.vibrationActuator.playEffect === 'function') {
      try {
        gp.vibrationActuator.playEffect('dual-rumble', {
          startDelay: 0,
          duration: duration,
          weakMagnitude: weak,
          strongMagnitude: strong
        }).catch(() => {});
      } catch (_) {}
    }
  }

  updateInputPrompts(device) {
    if (this.state === 'PLAYING') {
      this.updateHudPositions();
    }
  }

  // ─── SETTINGS & VOLUME ENGINE ───
  syncSettingsUI() {
    if (!window.soundEngine) return;
    const master = Math.round((window.soundEngine.masterVolume ?? 0.8) * 100);
    const sfx = Math.round((window.soundEngine.sfxVolume ?? 0.65) * 100);
    const music = Math.round((window.soundEngine.musicVolume ?? 0.40) * 100);

    if (this.ui.sliderVolMaster) this.ui.sliderVolMaster.value = master;
    if (this.ui.valVolMaster) this.ui.valVolMaster.textContent = `${master}%`;
    if (this.ui.sliderVolSfx) this.ui.sliderVolSfx.value = sfx;
    if (this.ui.valVolSfx) this.ui.valVolSfx.textContent = `${sfx}%`;
    if (this.ui.sliderVolMusic) this.ui.sliderVolMusic.value = music;
    if (this.ui.valVolMusic) this.ui.valVolMusic.textContent = `${music}%`;

    if (this.ui.pauseSliderVolMaster) this.ui.pauseSliderVolMaster.value = master;
    if (this.ui.pauseValVolMaster) this.ui.pauseValVolMaster.textContent = `${master}%`;
    if (this.ui.pauseSliderVolSfx) this.ui.pauseSliderVolSfx.value = sfx;
    if (this.ui.pauseValVolSfx) this.ui.pauseValVolSfx.textContent = `${sfx}%`;
    if (this.ui.pauseSliderVolMusic) this.ui.pauseSliderVolMusic.value = music;
    if (this.ui.pauseValVolMusic) this.ui.pauseValVolMusic.textContent = `${music}%`;

    if (this.ui.toggleFullscreen) {
      this.ui.toggleFullscreen.checked = !!document.fullscreenElement;
    }
    if (this.ui.toggleRumble) {
      this.ui.toggleRumble.checked = this.vibrationEnabled;
    }
  }

  exportSaveFile() {
    if (!window.progression) return;
    const jsonStr = window.progression.exportSaveJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `infernal_rise_save_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (window.soundEngine) window.soundEngine.playUiClick();
  }

  importSaveFile(file) {
    if (!file || !window.progression) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const res = window.progression.importSaveJSON(content);
      if (res) {
        this.deathCount = Number.parseInt(localStorage.getItem('infernal_rise_deaths') || '0', 10);
        this.updateDeathCounterUI();
        this.updateMainMenuStats();
        this.renderAchievementsUI();
        if (this.passiveWeaponsManager) {
          this.passiveWeaponsManager.initFromProgression();
        }
        if (window.soundEngine) window.soundEngine.playAchievementUnlock();
        alert('¡Partida importada con éxito!');
      } else {
        alert('Error: Archivo de guardado inválido o corrupto.');
      }
    };
    reader.readAsText(file);
  }

  // ─── ACHIEVEMENTS UI & TOAST ENGINE ───
  renderAchievementsUI() {
    if (!window.progression) return;
    const progress = window.progression.getAchievementsProgress();
    if (this.ui.achievementsBarFill) {
      this.ui.achievementsBarFill.style.width = `${progress.percent}%`;
    }
    if (this.ui.achievementsCountText) {
      this.ui.achievementsCountText.textContent = `${progress.unlocked} / ${progress.total} (${progress.percent}%)`;
    }
    if (!this.ui.achievementsGrid) return;
    this.ui.achievementsGrid.innerHTML = '';

    const list = window.progression.achievementDefinitions || [];
    for (const ach of list) {
      const isUnlocked = window.progression.isAchievementUnlocked(ach.id);
      const card = document.createElement('div');
      card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;

      const iconDiv = document.createElement('div');
      iconDiv.className = 'ach-card-icon';
      iconDiv.textContent = isUnlocked ? ach.icon : '🔒';

      const infoDiv = document.createElement('div');
      infoDiv.className = 'ach-card-info';

      const title = document.createElement('div');
      title.className = 'ach-card-title';
      title.textContent = ach.name;

      const desc = document.createElement('div');
      desc.className = 'ach-card-desc';
      desc.textContent = ach.desc;

      const reward = document.createElement('div');
      reward.className = 'ach-card-reward';
      const rewardDetail = ach.shards ? `+${ach.reward} 🔮  +${ach.shards} 💠` : `+${ach.reward} 🔮`;
      reward.innerHTML = isUnlocked
        ? `Recompensa reclamada: <span>${rewardDetail}</span>`
        : `Recompensa: <span>${rewardDetail}</span>`;

      infoDiv.appendChild(title);
      infoDiv.appendChild(desc);
      infoDiv.appendChild(reward);

      card.appendChild(iconDiv);
      card.appendChild(infoDiv);
      this.ui.achievementsGrid.appendChild(card);
    }
  }

  showAchievementToast(def) {
    if (!def) return;
    this.triggerGamepadRumble(350, 0.4, 0.7);

    const container = this.ui.achievementToastContainer || document.getElementById('achievement-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    const rewardText = def.shards ? `+${def.reward} 🔮  +${def.shards} 💠` : `+${def.reward} 🔮`;
    toast.innerHTML = `
      <div class="toast-icon">${def.icon || '🏆'}</div>
      <div class="toast-body">
        <div class="toast-header">¡LOGRO DESBLOQUEADO!</div>
        <div class="toast-title">${def.name}</div>
        <div class="toast-desc">${def.desc}</div>
        <div class="toast-reward">${rewardText} Obtenido</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }, 4500);
  }

  // ─── GAME FEEL & CINEMATICS (HIT-STOP, SHAKE, SLOW-MO) ───
  triggerHitStop(duration = 0.05) {
    this.hitStopTimer = Math.max(this.hitStopTimer, duration);
  }

  triggerScreenShake(intensity = 6, duration = 0.25) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
    this.shakeMaxDuration = Math.max(this.shakeMaxDuration, duration);
  }

  triggerBossDefeatCinematic() {
    this.slowMoTimer = 1.6;
    this.whiteFlashAlpha = 0.92;
    this.triggerScreenShake(14, 0.7);
    this.triggerBossDefeat();
  }

  // ─── CUSTOMIZABLE KEYBINDINGS ENGINE ───
  isActionKey(action, code) {
    if (!this.keybindings || !this.keybindings[action]) return false;
    return this.keybindings[action].includes(code);
  }

  rebindActionKey(action, newCode) {
    if (!this.keybindings[action]) return;
    if (!this.keybindings[action].includes(newCode)) {
      this.keybindings[action] = [newCode];
      try {
        localStorage.setItem('infernal_rise_keybindings', JSON.stringify(this.keybindings));
      } catch (_) {}
    }
    this.rebindingAction = null;
    if (window.soundEngine && window.soundEngine.playCoinPickup) {
      window.soundEngine.playCoinPickup();
    }
    this.renderKeyRemapUI();
  }

  resetKeybindings() {
    this.keybindings = {
      left: ['KeyA', 'ArrowLeft'],
      right: ['KeyD', 'ArrowRight'],
      up: ['KeyW', 'ArrowUp'],
      down: ['KeyS', 'ArrowDown'],
      jump: ['Space'],
      attack: ['KeyZ', 'KeyJ'],
      dash: ['ShiftLeft', 'ShiftRight', 'KeyK'],
      interact: ['KeyE']
    };
    this.rebindingAction = null;
    try {
      localStorage.removeItem('infernal_rise_keybindings');
    } catch (_) {}
    if (window.soundEngine && window.soundEngine.playCoinPickup) {
      window.soundEngine.playCoinPickup();
    }
    this.renderKeyRemapUI();
  }

  renderKeyRemapUI() {
    if (!this.ui.keybindingsList) return;
    this.ui.keybindingsList.innerHTML = '';

    const actions = [
      { id: 'left', labelKey: 'action.left', fallback: 'Mover Izquierda' },
      { id: 'right', labelKey: 'action.right', fallback: 'Mover Derecha' },
      { id: 'up', labelKey: 'action.up', fallback: 'Subir Escalera' },
      { id: 'down', labelKey: 'action.down', fallback: 'Bajar Escalera' },
      { id: 'jump', labelKey: 'action.jump', fallback: 'Saltar' },
      { id: 'attack', labelKey: 'action.attack', fallback: 'Atacar (Espada)' },
      { id: 'dash', labelKey: 'action.dash', fallback: 'Esquiva / Dash' },
      { id: 'interact', labelKey: 'action.interact', fallback: 'Interactuar' }
    ];

    actions.forEach(({ id, labelKey, fallback }) => {
      const row = document.createElement('div');
      row.className = 'keybind-row';

      const label = document.createElement('span');
      label.className = 'keybind-label';
      label.textContent = window.localization ? window.localization.t(labelKey, fallback) : fallback;

      const badges = document.createElement('div');
      badges.className = 'keybind-badges';

      const keys = this.keybindings[id] || [];
      keys.forEach((k) => {
        const btn = document.createElement('button');
        btn.className = `keybind-key-btn ${this.rebindingAction === id ? 'rebinding' : ''}`;
        let displayKey = k.replace('Key', '').replace('Arrow', 'Flecha ');
        if (k === 'Space') displayKey = 'Espacio';
        btn.textContent = this.rebindingAction === id ? 'Presiona tecla...' : displayKey;
        btn.title = 'Haz clic para reasignar';

        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.rebindingAction = id;
          this.renderKeyRemapUI();
        });

        badges.appendChild(btn);
      });

      row.appendChild(label);
      row.appendChild(badges);
      this.ui.keybindingsList.appendChild(row);
    });
  }

  // ─── BESTIARY CODEX VIEWER ───
  renderBestiaryCodex() {
    if (!this.ui.bestiaryGrid || !window.progression) return;
    const list = window.progression.getBestiaryList();
    this.ui.bestiaryGrid.innerHTML = '';

    const killLabel = window.localization ? window.localization.t('bestiary.kills', 'Abatidos') : 'Abatidos';
    const weaknessLabel = window.localization ? window.localization.t('bestiary.weakness', 'Debilidad') : 'Debilidad';

    list.forEach((entry) => {
      const card = document.createElement('div');
      card.className = 'bestiary-card';
      card.innerHTML = `
        <div class="bestiary-header">
          <div class="bestiary-icon">${entry.icon}</div>
          <div class="bestiary-title-wrap">
            <div class="bestiary-name">${entry.name}</div>
            <div class="bestiary-subtitle">${entry.title}</div>
          </div>
        </div>
        <div class="bestiary-lore">${entry.description}</div>
        <div class="bestiary-stats-row">
          <span class="bestiary-weakness-tag">${weaknessLabel}: ${entry.weakness}</span>
          <span class="bestiary-kills-badge">💀 ${killLabel}: ${entry.kills || 0}</span>
        </div>
      `;
      this.ui.bestiaryGrid.appendChild(card);
    });
  }

  // ─── WARDROBE / SKINS SELECTOR ───
  renderWardrobeUI() {
    if (!this.ui.wardrobeGrid || !window.progression) return;
    const skins = window.progression.getSkinsList();
    const currentSkin = window.progression.selectedSkin || 'soldier';
    this.ui.wardrobeGrid.innerHTML = '';

    const equipText = window.localization ? window.localization.t('wardrobe.equip', 'Equipar') : 'Equipar';
    const equippedText = window.localization ? window.localization.t('wardrobe.equipped', '✓ Equipado') : '✓ Equipado';
    const lockedText = window.localization ? window.localization.t('wardrobe.locked', '🔒 Bloqueado') : '🔒 Bloqueado';

    skins.forEach((skin) => {
      const isEquipped = currentSkin === skin.id;
      const isUnlocked = !!skin.unlocked;

      const card = document.createElement('div');
      card.className = `wardrobe-card ${isEquipped ? 'equipped' : ''} ${!isUnlocked ? 'locked' : ''}`;
      card.innerHTML = `
        <div class="wardrobe-avatar-wrap">${skin.icon}</div>
        <div class="wardrobe-skin-title">${skin.name}</div>
        <div class="wardrobe-skin-desc">${skin.description}</div>
        <div class="wardrobe-skin-perk">✨ ${skin.perk}</div>
        <button class="btn-infernal wardrobe-btn-equip" ${!isUnlocked || isEquipped ? 'disabled' : ''}>
          ${isEquipped ? equippedText : (isUnlocked ? equipText : lockedText)}
        </button>
      `;

      const btn = card.querySelector('.wardrobe-btn-equip');
      if (btn && isUnlocked && !isEquipped) {
        btn.addEventListener('click', () => {
          window.progression.selectSkin(skin.id);
          if (window.soundEngine && window.soundEngine.playCoinPickup) {
            window.soundEngine.playCoinPickup();
          }
          this.renderWardrobeUI();
        });
      }

      this.ui.wardrobeGrid.appendChild(card);
    });
  }

  // ─── END-RUN STATS SUMMARY & CLIPBOARD RECORDER ───
  renderEndRunSummary(isVictory = false) {
    const targetEl = isVictory ? this.ui.victoryRunSummary : this.ui.deathRunSummary;
    if (!targetEl || !window.progression) return;

    const summary = window.progression.getRunSummary();
    const loc = window.localization;
    const t = (k, fb) => loc ? loc.t(k, fb) : fb;

    targetEl.innerHTML = `
      <div class="run-summary-grid">
        <div class="summary-stat-box">
          <div class="summary-stat-label">⏱️ ${t('summary.run_duration', 'Tiempo de Run')}</div>
          <div class="summary-stat-val">${summary.duration}</div>
        </div>
        <div class="summary-stat-box">
          <div class="summary-stat-label">🏔️ ${t('summary.max_altitude', 'Altitud')}</div>
          <div class="summary-stat-val">${summary.maxAltitude}m</div>
        </div>
        <div class="summary-stat-box">
          <div class="summary-stat-label">💀 ${t('summary.enemies_slain', 'Enemigos')}</div>
          <div class="summary-stat-val">${summary.enemiesDefeated}</div>
        </div>
        <div class="summary-stat-box">
          <div class="summary-stat-label">💥 ${t('summary.megabonks', 'Megabonks')}</div>
          <div class="summary-stat-val">${summary.megabonks}</div>
        </div>
        <div class="summary-stat-box">
          <div class="summary-stat-label">🔮 ${t('summary.souls_harvested', 'Almas')}</div>
          <div class="summary-stat-val" style="color: #e0aaff;">+${summary.soulsCollected}</div>
        </div>
        <div class="summary-stat-box">
          <div class="summary-stat-label">💠 ${t('summary.shards_found', 'Fragmentos')}</div>
          <div class="summary-stat-val" style="color: #caf0f8;">+${summary.shardsCollected}</div>
        </div>
      </div>
      <div class="summary-weapon-highlight">
        <div class="summary-weapon-info">
          <div class="summary-weapon-icon">${summary.mostLethal.icon}</div>
          <div>
            <div class="summary-weapon-name">${t('summary.most_lethal', 'Arma Más Letal')}: ${summary.mostLethal.name}</div>
            <div class="summary-weapon-sub">${summary.mostLethal.damage} dmg (${summary.mostLethal.percent}% del total infligido)</div>
          </div>
        </div>
      </div>
    `;
  }

  copyRunRecordToClipboard(isVictory = false) {
    if (!window.progression) return;
    const summary = window.progression.getRunSummary();
    const title = isVictory ? '👑 ¡VICTORIA Y ASCENSIÓN! 👑' : '💀 REGISTRO DE MUERTE EN EL AVERNO 💀';
    const text = [
      `⚔️ INFERNAL RISE 2.0 — ${title} ⚔️`,
      `⏱️ Duración: ${summary.duration} | 🏔️ Altitud: ${summary.maxAltitude}m`,
      `💀 Enemigos Abatidos: ${summary.enemiesDefeated} | 💥 Megabonks: ${summary.megabonks}`,
      `🔱 Arma Más Letal: ${summary.mostLethal.name} (${summary.mostLethal.damage} dmg - ${summary.mostLethal.percent}%)`,
      `🔮 Almas Cosechadas: ${summary.soulsCollected} | 💠 Fragmentos: ${summary.shardsCollected}`,
      `🔥 ¡Conquista los 9 Círculos en Infernal Rise!`
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        const msg = window.localization ? window.localization.t('summary.copied', '¡Récord copiado al portapapeles!') : '¡Récord copiado al portapapeles!';
        if (window.progression && window.progression.showToast) {
          window.progression.showToast(msg, 'success');
        }
      }).catch(() => {});
    }
  }

  updateLanguageUI() {
    if (!window.localization) return;
    const lang = window.localization.currentLang;
    if (this.ui.btnToggleLanguage) {
      this.ui.btnToggleLanguage.textContent = lang === 'es' ? 'Idioma: Español (ES)' : 'Language: English (EN)';
    }
    window.localization.applyToDOM();
    this.renderKeyRemapUI();
    this.renderBestiaryCodex();
    this.renderWardrobeUI();
  }
}

window.Game = Game;

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
  window.game.init();
});
