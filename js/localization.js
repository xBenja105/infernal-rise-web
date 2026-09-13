/**
 * Infernal Rise — Localization Engine (ES / EN)
 * Complete English & Spanish bilingual support with persistent language preference.
 */

(function () {
  const translations = {
    es: {
      // Menu Principal
      'game.subtitle': 'El Ascenso hacia la Redención',
      'menu.start': 'Comenzar Ascenso',
      'menu.infernal': 'Modo Infernal (Endless)',
      'menu.codex': 'Guía y Códice',
      'menu.achievements': 'Logros',
      'menu.settings': 'Ajustes',
      'menu.wardrobe': 'Aspectos',
      'menu.back': '◀ Volver al Menú',

      // Estadísticas Barra Menú
      'stat.souls': 'Almas',
      'stat.shards': 'Humanidad',
      'stat.ashes': 'Cenizas',
      'stat.deaths': 'Muertes',

      // Pantalla de Pausa
      'pause.title': 'Pausa',
      'pause.resume': 'Reanudar',
      'pause.settings': '⚙️ Ajustes Rápidos',
      'pause.restart': 'Reiniciar Nivel',
      'pause.reset': '⚠️ Borrar Progreso',
      'pause.quit': 'Menú Principal',
      'pause.back': '◀ Volver a Pausa',

      // Pantallas de Fin de Run (Muerte / Victoria)
      'death.title': 'Has Perecido',
      'death.retry': 'Reintentar',
      'death.menu': 'Menú Principal',
      'victory.title': '¡Victoria y Ascensión!',
      'victory.continue': 'Continuar Ascenso',
      'summary.copy': '📋 Copiar Récord',
      'summary.copied': '¡Récord copiado al portapapeles!',
      'summary.run_duration': 'Tiempo de Run',
      'summary.max_altitude': 'Altitud Máxima',
      'summary.enemies_slain': 'Enemigos Abatidos',
      'summary.megabonks': 'Megabonks 💥',
      'summary.most_lethal': 'Arma Más Letal',
      'summary.total_damage': 'Daño Total',
      'summary.souls_harvested': 'Almas Cosechadas',
      'summary.shards_found': 'Fragmentos Encontrados',

      // Códice & Bestiario
      'codex.title': '📜 Códice y Guía del Averno',
      'codex.tab_guide': '📖 Guía y Controles',
      'codex.tab_bestiary': '👹 Bestiario del Averno',
      'bestiary.kills': 'Abatidos',
      'bestiary.weakness': 'Debilidad',
      'bestiary.lore': 'Registro del Códice',

      // Armario / Aspectos
      'wardrobe.title': '👑 Armario de Kael: Aspectos de Poder',
      'wardrobe.subtitle': 'Forja tu identidad en el infierno vistiendo los hábitos de los héroes y mártires caídos',
      'wardrobe.equip': 'Equipar',
      'wardrobe.equipped': '✓ Equipado',
      'wardrobe.locked': '🔒 Bloqueado',
      'wardrobe.requirement': 'Requisito',

      // Ajustes
      'settings.title': '⚙️ Ajustes y Archivo del Alma',
      'settings.subtitle': 'Configura el audio, pantalla, idioma y gestiona tu archivo de guardado',
      'settings.audio_title': '🔊 Audio y Mezcla de Sonido',
      'settings.master_vol': 'Volumen General (Master)',
      'settings.sfx_vol': 'Efectos de Sonido (SFX)',
      'settings.bgm_vol': 'Música de Fondo (BGM)',
      'settings.mute': 'Silenciar Audio',
      'settings.mute_desc': 'Activa o silencia rápidamente todo el sonido del juego',
      'settings.display_title': '🖥️ Pantalla, Mando y Jugabilidad',
      'settings.fullscreen': 'Modo Pantalla Completa',
      'settings.fullscreen_desc': 'Alterna entre ventana y pantalla completa (F11 / Alt+Enter)',
      'settings.rumble': 'Vibración de Mando (Rumble)',
      'settings.rumble_desc': 'Respuesta háptica ante impactos y Megabonk al usar gamepad',
      'settings.shake': 'Sacudida de Pantalla (Screen Shake)',
      'settings.shake_desc': 'Ajusta la intensidad sísmica de impactos, explosiones y golpes',
      'settings.lang': 'Idioma del Juego (Language)',
      'settings.lang_desc': 'Alternar entre Español e Inglés',
      'settings.save_title': '💾 Gestión de Partida y Copia de Seguridad',
      'settings.export': 'Exportar Partida',
      'settings.export_desc': 'Descarga un archivo .JSON con tus almas, mejoras y logros',
      'settings.import': 'Importar Partida',
      'settings.import_desc': 'Restaura tu progreso desde un archivo .JSON previo',
      'settings.reset': 'Borrar Todo el Progreso',
      'settings.reset_desc': 'Elimina permanentemente todo el archivo de guardado local',
      'settings.controls_title': '🎮 Reasignación de Teclas',
      'settings.controls_desc': 'Haz clic en una tecla para reasignarla a cualquier tecla de tu teclado',

      // Acciones de Reasignación
      'action.left': 'Mover Izquierda',
      'action.right': 'Mover Derecha',
      'action.up': 'Subir Escalera',
      'action.down': 'Bajar Escalera',
      'action.jump': 'Saltar',
      'action.attack': 'Atacar (Espada)',
      'action.interact': 'Interactuar'
    },
    en: {
      // Main Menu
      'game.subtitle': 'The Ascent towards Redemption',
      'menu.start': 'Start Ascent',
      'menu.infernal': 'Infernal Mode (Endless)',
      'menu.codex': 'Codex & Guide',
      'menu.achievements': 'Achievements',
      'menu.settings': 'Settings',
      'menu.wardrobe': 'Wardrobe',
      'menu.back': '◀ Back to Menu',

      // Stats Summary Bar
      'stat.souls': 'Souls',
      'stat.shards': 'Humanity',
      'stat.ashes': 'Ashes',
      'stat.deaths': 'Deaths',

      // Pause Screen
      'pause.title': 'Paused',
      'pause.resume': 'Resume',
      'pause.settings': '⚙️ Quick Settings',
      'pause.restart': 'Restart Level',
      'pause.reset': '⚠️ Reset Progress',
      'pause.quit': 'Main Menu',
      'pause.back': '◀ Back to Pause',

      // End Run Screens
      'death.title': 'You Have Perished',
      'death.retry': 'Retry',
      'death.menu': 'Main Menu',
      'victory.title': 'Victory & Ascension!',
      'victory.continue': 'Continue Ascent',
      'summary.copy': '📋 Copy Record',
      'summary.copied': 'Record copied to clipboard!',
      'summary.run_duration': 'Run Duration',
      'summary.max_altitude': 'Max Altitude',
      'summary.enemies_slain': 'Enemies Slain',
      'summary.megabonks': 'Megabonks 💥',
      'summary.most_lethal': 'Most Lethal Weapon',
      'summary.total_damage': 'Total Damage',
      'summary.souls_harvested': 'Souls Harvested',
      'summary.shards_found': 'Shards Found',

      // Codex & Bestiary
      'codex.title': '📜 Underworld Codex & Guide',
      'codex.tab_guide': '📖 Guide & Controls',
      'codex.tab_bestiary': '👹 Underworld Bestiary',
      'bestiary.kills': 'Slain',
      'bestiary.weakness': 'Weakness',
      'bestiary.lore': 'Codex Record',

      // Wardrobe / Skins
      'wardrobe.title': '👑 Kael\'s Wardrobe: Aspect of Power',
      'wardrobe.subtitle': 'Forge your identity in the underworld wearing garments of fallen heroes and martyrs',
      'wardrobe.equip': 'Equip',
      'wardrobe.equipped': '✓ Equipped',
      'wardrobe.locked': '🔒 Locked',
      'wardrobe.requirement': 'Requirement',

      // Settings
      'settings.title': '⚙️ Settings & Soul Archive',
      'settings.subtitle': 'Configure audio, display, language, and manage save data',
      'settings.audio_title': '🔊 Audio & Sound Mixing',
      'settings.master_vol': 'Master Volume',
      'settings.sfx_vol': 'Sound Effects (SFX)',
      'settings.bgm_vol': 'Background Music (BGM)',
      'settings.mute': 'Mute Audio',
      'settings.mute_desc': 'Quickly mute or enable all game sound',
      'settings.display_title': '🖥️ Display, Gamepad & Gameplay',
      'settings.fullscreen': 'Fullscreen Mode',
      'settings.fullscreen_desc': 'Toggle between windowed and fullscreen (F11 / Alt+Enter)',
      'settings.rumble': 'Gamepad Vibration (Rumble)',
      'settings.rumble_desc': 'Haptic feedback on impacts and Megabonk with controllers',
      'settings.shake': 'Screen Shake Intensity',
      'settings.shake_desc': 'Adjust earthquake impact shake from strikes and explosions',
      'settings.lang': 'Game Language',
      'settings.lang_desc': 'Toggle between Spanish and English',
      'settings.save_title': '💾 Save Data & Backup Management',
      'settings.export': 'Export Save Data',
      'settings.export_desc': 'Download a .JSON file containing all souls, upgrades, and achievements',
      'settings.import': 'Import Save Data',
      'settings.import_desc': 'Restore your progress from a previous .JSON backup',
      'settings.reset': 'Wipe All Progress',
      'settings.reset_desc': 'Permanently delete all local save data and start fresh',
      'settings.controls_title': '🎮 Key Remapping',
      'settings.controls_desc': 'Click any key to rebind it to any keyboard key',

      // Key Actions
      'action.left': 'Move Left',
      'action.right': 'Move Right',
      'action.up': 'Climb Up',
      'action.down': 'Climb Down',
      'action.jump': 'Jump',
      'action.attack': 'Attack (Sword)',
      'action.interact': 'Interact'
    }
  };

  class LocalizationManager {
    constructor() {
      this.currentLang = localStorage.getItem('infernal_rise_lang') || 'es';
      if (!translations[this.currentLang]) this.currentLang = 'es';
    }

    t(key, fallback = '') {
      const dict = translations[this.currentLang] || translations.es;
      return dict[key] !== undefined ? dict[key] : (translations.es[key] || fallback || key);
    }

    setLanguage(lang) {
      if (translations[lang]) {
        this.currentLang = lang;
        localStorage.setItem('infernal_rise_lang', lang);
        this.applyToDOM();
        if (window.game) {
          if (window.game.updateLanguageUI) window.game.updateLanguageUI();
          if (window.game.renderBestiaryCodex) window.game.renderBestiaryCodex();
          if (window.game.renderWardrobeUI) window.game.renderWardrobeUI();
        }
      }
    }

    toggleLanguage() {
      const nextLang = this.currentLang === 'es' ? 'en' : 'es';
      this.setLanguage(nextLang);
      return nextLang;
    }

    applyToDOM() {
      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (key) {
          const trans = this.t(key);
          if (el.tagName === 'INPUT' && el.type === 'button') {
            el.value = trans;
          } else {
            el.textContent = trans;
          }
        }
      });
    }
  }

  window.localization = new LocalizationManager();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LocalizationManager, translations };
  }
})();
