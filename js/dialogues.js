/**
 * Infernal Rise — Dialogue System
 * Uses the exact verbatim dialogues recovered from the Unity scenes (level2, level5, level8, level11).
 */

class DialogueManager {
  constructor() {
    this.modal = document.getElementById('dialogue-modal');
    this.portraitCanvas = document.getElementById('dialogue-portrait-canvas');
    this.speakerEl = document.getElementById('dialogue-speaker');
    this.textEl = document.getElementById('dialogue-text');
    this.portraitCtx = this.portraitCanvas ? this.portraitCanvas.getContext('2d') : null;

    this.active = false;
    this.currentLines = [];
    this.lineIndex = 0;
    this.charIndex = 0;
    this.typingTimer = null;
    this.onCompleteCallback = null;

    // Database of authentic game dialogues
    this.dialogueTrees = {
      prologue: [
        {
          speaker: 'Soldado',
          portrait: 'Soldado',
          text: 'Kael, el traidor se encuentra escondido en estas ruinas.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Entendido, vamos a acabar con ese maldito.'
        },
        {
          speaker: 'Soldado',
          portrait: 'Soldado',
          text: 'También está junto con su esposa y sus 2 hijas, ¿qué deberíamos hacer con ellas?'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'No me importa, acabaremos con todos los traidores...'
        },
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'El soldado contó el trágico incidente al consejo del castillo. Kael fue sentenciado a muerte por asesinar a una mujer y a 2 niñas inocentes; el único culpable por traición era el esposo.'
        },
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'Despertando en el fondo del Inframundo ante la colosal Torre de las Almas, tu única salvación es ascender piso a piso hasta el Mundo Terrenal.'
        }
      ],

      minos_intro: [
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'En el umbral superior del Foso Abisal, un coloso espectral cierra el paso a la torre...'
        },
        {
          speaker: 'Minos',
          portrait: 'Minos',
          text: '¡Detén tu paso, alma caída! Soy Minos, Juez de las Fosas Abisales. Nadie escapa hacia los pisos superiores de la Torre.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'No me doblegaré ante tus cadenas. Mi espada abrirá el camino hacia las alturas.'
        }
      ],

      flegias_intro: [
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'En las Catacumbas Hundidas de la torre, las aguas pestilentes borbotean con odio...'
        },
        {
          speaker: 'Flegias',
          portrait: 'Flegias',
          text: '¡Miserable intruso! Soy Flegias, señor del pantano sumergido. ¡Nadie cruza hacia las murallas de la Torre con vida!'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Tu lodo no detendrá mi ascenso. Te hundiré en las profundidades de tu propia ciénaga.'
        }
      ],

      boss1_intro: [
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'En las Murallas Carmesí de la Fortaleza de Hierro, el calor sofocante anuncia al verdugo de fuego...'
        },
        {
          speaker: 'Azgalor',
          portrait: 'Azgalor',
          text: '¡Alma insensata! Soy Azgalor, el señor de la Fortaleza. ¡Tus cenizas alimentarán estos hornos por la eternidad!'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Ya he ardido en las profundidades. Tu fuego no frenará mi ascenso a la superficie.'
        }
      ],

      azgalor_intro: [
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'En las Murallas Carmesí de la Fortaleza de Hierro, el calor sofocante anuncia al verdugo de fuego...'
        },
        {
          speaker: 'Azgalor',
          portrait: 'Azgalor',
          text: '¡Alma insensata! Soy Azgalor, el señor de la Fortaleza. ¡Tus cenizas alimentarán estos hornos por la eternidad!'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Ya he ardido en las profundidades. Tu fuego no frenará mi ascenso a la superficie.'
        }
      ],

      malacoda_intro: [
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'En las Agujas Glaciares, la ventisca helada aúlla entre las cumbres antes del Atrio Dorado...'
        },
        {
          speaker: 'Malacoda',
          portrait: 'Malacoda',
          text: '¡Hueles a vida! Soy Malacoda, la Bestia de las Agujas. ¡Tus huesos se congelarán en estas alturas antes de tocar la luz!'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Guarda tus amenazas, demonio alado. Ni el hielo ni el viento impedirán que vea la luz del sol.'
        }
      ],

      boss2_intro: [
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'En el Atrio Dorado de la Cúpula, ante el último umbral antes del Mundo de los Vivos...'
        },
        {
          speaker: 'Glacior',
          portrait: 'Glacior',
          text: '¡Penitente impío! Soy Glacior, el Centinela del Umbral. Más allá aguarda la Puerta al Mundo Terrenal... ¡pero jamás permitiré que escapes!'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'He escalado la torre entera desde el foso más hondo. ¡Cruzare la Puerta Terrenal y renaceré!'
        }
      ],

      glacior_intro: [
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'En el Atrio Dorado de la Cúpula, ante el último umbral antes del Mundo de los Vivos...'
        },
        {
          speaker: 'Glacior',
          portrait: 'Glacior',
          text: '¡Penitente impío! Soy Glacior, el Centinela del Umbral. Más allá aguarda la Puerta al Mundo Terrenal... ¡pero jamás permitiré que escapes!'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'He escalado la torre entera desde el foso más hondo. ¡Cruzare la Puerta Terrenal y renaceré!'
        }
      ]
    };
  }

  startDialogue(key, onComplete) {
    const lines = this.dialogueTrees[key];
    if (!lines || lines.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    this.active = true;
    this.currentLines = lines;
    this.lineIndex = 0;
    this.onCompleteCallback = onComplete;
    this.modal.style.display = 'block';

    this.displayCurrentLine();
  }

  displayCurrentLine() {
    if (this.lineIndex >= this.currentLines.length) {
      this.closeDialogue();
      return;
    }

    if (this.typingTimer) clearInterval(this.typingTimer);

    const line = this.currentLines[this.lineIndex];
    this.speakerEl.textContent = line.speaker;

    // Draw Portrait
    if (this.portraitCtx && window.spriteManager && window.spriteManager.portraits) {
      this.portraitCtx.clearRect(0, 0, 96, 96);
      const portraitImg = window.spriteManager.portraits[line.portrait] || window.spriteManager.portraits.Kael;
      if (portraitImg) {
        this.portraitCtx.drawImage(portraitImg, 0, 0);
      }
    }

    // Typewriter effect
    this.textEl.textContent = '';
    this.charIndex = 0;
    const fullText = line.text;

    this.typingTimer = setInterval(() => {
      if (this.charIndex < fullText.length) {
        this.textEl.textContent += fullText[this.charIndex];
        if (this.charIndex % 2 === 0 && window.soundEngine) {
          window.soundEngine.playDialogueBlip();
        }
        this.charIndex++;
      } else {
        clearInterval(this.typingTimer);
        this.typingTimer = null;
      }
    }, 24);
  }

  advance() {
    if (!this.active) return;

    // If currently typing, complete the line instantly
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
      this.textEl.textContent = this.currentLines[this.lineIndex].text;
      return;
    }

    // Next line
    this.lineIndex++;
    if (this.lineIndex < this.currentLines.length) {
      this.displayCurrentLine();
    } else {
      this.closeDialogue();
    }
  }

  closeDialogue() {
    this.active = false;
    if (this.typingTimer) clearInterval(this.typingTimer);
    this.modal.style.display = 'none';
    if (this.onCompleteCallback) {
      const cb = this.onCompleteCallback;
      this.onCompleteCallback = null;
      cb();
    }
  }
}

window.dialogueManager = new DialogueManager();
