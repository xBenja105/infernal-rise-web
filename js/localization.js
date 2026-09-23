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
      'menu.infernal': 'Modo Infernal',
      'menu.codex': 'Códice',
      'menu.achievements': 'Logros',
      'menu.settings': 'Configuración',
      'menu.wardrobe': 'Aspectos',
      'menu.back': 'Volver al Menú',
      'menu.quit': 'Salir al Escritorio',

      // Estadísticas Barra Menú
      'stat.souls': 'Almas',
      'stat.shards': 'Humanidad',
      'stat.ashes': 'Cenizas',
      'stat.deaths': 'Muertes',

      // Pantalla de Pausa
      'pause.title': 'Pausa',
      'pause.resume': 'Reanudar',
      'pause.settings': 'Configuración',
      'pause.restart': 'Reiniciar Nivel',
      'pause.quit': 'Menú Principal',
      'pause.desktop': 'Salir al Escritorio',
      'pause.back': 'Volver a Pausa',

      // Pantallas de Fin de Run (Muerte / Victoria)
      'death.title': 'Has Perecido',
      'death.retry': 'Reintentar',
      'death.menu': 'Menú Principal',
      'victory.title': '¡Victoria y Ascensión!',
      'victory.continue': 'Continuar Ascenso',
      'summary.copy': 'Copiar Récord',
      'summary.copied': '¡Récord copiado al portapapeles!',
      'summary.run_duration': 'Tiempo de Run',
      'summary.max_altitude': 'Altitud Máxima',
      'summary.enemies_slain': 'Enemigos Abatidos',
      'summary.megabonks': 'Impactos Críticos',
      'summary.most_lethal': 'Arma Más Letal',
      'summary.total_damage': 'Daño Total',
      'summary.souls_harvested': 'Almas Cosechadas',
      'summary.shards_found': 'Fragmentos Encontrados',

      // Códice & Bestiario
      'codex.title': 'Códice del Averno',
      'codex.tab_guide': 'Guía y Controles',
      'codex.tab_bestiary': 'Bestiario',
      'bestiary.kills': 'Abatidos',
      'bestiary.weakness': 'Debilidad',
      'bestiary.lore': 'Registro del Códice',

      // Armario / Aspectos
      'wardrobe.title': 'Aspectos de Kael',
      'wardrobe.subtitle': 'Selecciona la armadura y apariencia de combate',
      'wardrobe.equip': 'Equipar',
      'wardrobe.equipped': 'Equipado',
      'wardrobe.locked': 'Bloqueado',
      'wardrobe.requirement': 'Requisito',

      // Ajustes
      'settings.title': 'Configuración',
      'settings.title_short': 'Configuración',
      'settings.subtitle': 'Audio, controles, pantalla y gestión del archivo de guardado',
      'settings.audio_title': 'Audio y Sonido',
      'settings.master_vol': 'Volumen General (Master)',
      'settings.sfx_vol': 'Efectos de Sonido (SFX)',
      'settings.bgm_vol': 'Música de Fondo (BGM)',
      'settings.mute': 'Silenciar Audio',
      'settings.mute_desc': 'Activa o silencia el sonido del juego',
      'settings.display_title': 'Pantalla y Controles',
      'settings.fullscreen': 'Modo Pantalla Completa',
      'settings.fullscreen_desc': 'Alterna entre ventana y pantalla completa (F11 / Alt+Enter)',
      'settings.rumble': 'Vibración de Mando (Rumble)',
      'settings.rumble_desc': 'Respuesta háptica ante impactos al usar mando',
      'settings.shake': 'Sacudida de Pantalla (Screen Shake)',
      'settings.shake_desc': 'Intensidad sísmica de impactos y explosiones',
      'settings.lang': 'Idioma del Juego',
      'settings.lang_desc': 'Alternar entre Español e Inglés',
      'settings.save_title': 'Gestión de Partida',
      'settings.export': 'Exportar Partida',
      'settings.export_desc': 'Descarga un archivo .JSON con tu progreso actual',
      'settings.import': 'Importar Partida',
      'settings.import_desc': 'Restaura tu progreso desde un archivo .JSON',
      'settings.reset': 'Borrar Progreso',
      'settings.reset_desc': 'Elimina permanentemente el archivo de guardado local',
      'settings.controls_title': 'Reasignación de Teclas',
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
      'menu.infernal': 'Infernal Mode',
      'menu.codex': 'Codex',
      'menu.achievements': 'Achievements',
      'menu.settings': 'Settings',
      'menu.wardrobe': 'Wardrobe',
      'menu.back': 'Back to Menu',
      'menu.quit': 'Exit to Desktop',

      // Stats Summary Bar
      'stat.souls': 'Souls',
      'stat.shards': 'Humanity',
      'stat.ashes': 'Ashes',
      'stat.deaths': 'Deaths',

      // Pause Screen
      'pause.title': 'Paused',
      'pause.resume': 'Resume',
      'pause.settings': 'Settings',
      'pause.restart': 'Restart Level',
      'pause.quit': 'Main Menu',
      'pause.desktop': 'Exit to Desktop',
      'pause.back': 'Back to Pause',

      // End Run Screens
      'death.title': 'You Have Perished',
      'death.retry': 'Retry',
      'death.menu': 'Main Menu',
      'victory.title': 'Victory & Ascension!',
      'victory.continue': 'Continue Ascent',
      'summary.copy': 'Copy Record',
      'summary.copied': 'Record copied to clipboard!',
      'summary.run_duration': 'Run Duration',
      'summary.max_altitude': 'Max Altitude',
      'summary.enemies_slain': 'Enemies Slain',
      'summary.megabonks': 'Critical Impacts',
      'summary.most_lethal': 'Most Lethal Weapon',
      'summary.total_damage': 'Total Damage',
      'summary.souls_harvested': 'Souls Harvested',
      'summary.shards_found': 'Shards Found',

      // Codex & Bestiary
      'codex.title': 'Infernal Codex',
      'codex.tab_guide': 'Guide & Controls',
      'codex.tab_bestiary': 'Bestiary',
      'bestiary.kills': 'Slain',
      'bestiary.weakness': 'Weakness',
      'bestiary.lore': 'Codex Record',

      // Wardrobe / Skins
      'wardrobe.title': 'Armor & Outfits',
      'wardrobe.subtitle': 'Select your combat armor and visual style',
      'wardrobe.equip': 'Equip',
      'wardrobe.equipped': 'Equipped',
      'wardrobe.locked': 'Locked',
      'wardrobe.requirement': 'Requirement',

      // Settings
      'settings.title': 'Settings',
      'settings.title_short': 'Settings',
      'settings.subtitle': 'Audio, display, controls, and save data management',
      'settings.audio_title': 'Audio & Sound',
      'settings.master_vol': 'Master Volume',
      'settings.sfx_vol': 'Sound Effects (SFX)',
      'settings.bgm_vol': 'Background Music (BGM)',
      'settings.mute': 'Mute Audio',
      'settings.mute_desc': 'Quickly mute or enable all game sound',
      'settings.display_title': 'Display & Controls',
      'settings.fullscreen': 'Fullscreen Mode',
      'settings.fullscreen_desc': 'Toggle between windowed and fullscreen (F11 / Alt+Enter)',
      'settings.rumble': 'Gamepad Vibration (Rumble)',
      'settings.rumble_desc': 'Haptic feedback on impacts with controllers',
      'settings.shake': 'Screen Shake Intensity',
      'settings.shake_desc': 'Adjust earthquake impact shake from strikes and explosions',
      'settings.lang': 'Game Language',
      'settings.lang_desc': 'Toggle between Spanish and English',
      'settings.save_title': 'Save Data Management',
      'settings.export': 'Export Save Data',
      'settings.export_desc': 'Download a .JSON file containing your current progress',
      'settings.import': 'Import Save Data',
      'settings.import_desc': 'Restore your progress from a previous .JSON backup',
      'settings.reset': 'Wipe Progress',
      'settings.reset_desc': 'Permanently delete local save data',
      'settings.controls_title': 'Key Remapping',
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
