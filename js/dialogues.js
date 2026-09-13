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
          text: 'Despertando en el Inframundo ante una torre colosal de obsidiana, tu única salvación es ascender y derrotar a los Guardianes.'
        }
      ],

      anciano: [
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: '¿Quién eres?, ¿y en dónde estoy?.'
        },
        {
          speaker: 'Anciano',
          portrait: 'Anciano',
          text: 'Ah... al parecer también has sido condenado a este lugar, quién soy no importa, lo que importa es lo que hice y estoy pagando por ello.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: '¿Qué has hecho?.'
        },
        {
          speaker: 'Anciano',
          portrait: 'Anciano',
          text: 'Asesiné a alguien y luego me ahorqué en mi habitación, ahora estoy aquí.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: '¿Hay alguna forma de salir de este sitio?.'
        },
        {
          speaker: 'Anciano',
          portrait: 'Anciano',
          text: 'La verdad es que no me interesa salir de aquí, pero ya que lo preguntas, creo que debes subir hasta lo alto de esta torre, pero ten cuidado con los Guardianes, ellos no permitirán que salgas de acá.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'No entiendo de qué me hablas pero gracias, acabaré con lo que se me interponga y saldré de este lugar.'
        },
        {
          speaker: 'Anciano',
          portrait: 'Anciano',
          text: 'Buena suerte... y espero que al salir de acá, seas perdonado por tus crímenes.'
        }
      ],

      minos_intro: [
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'Al cruzar el Limbo hacia los vientos tempestuosos de la Lujuria, una figura imponente enrosca su cola...'
        },
        {
          speaker: 'Minos',
          portrait: 'Minos',
          text: '¡Detén tu paso, asesino! Soy Minos, Juez de los Condenados. Las vueltas de mi cola sentencian que tu destino es el abismo más profundo.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'No acato tu juicio, demonio. Mi espada forjará mi propio destino.'
        }
      ],

      flegias_intro: [
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'Las aguas lodosas y pestilentes de la Laguna Estigia borbotean con el odio de los coléricos...'
        },
        {
          speaker: 'Flegias',
          portrait: 'Flegias',
          text: '¡Miserable intruso! Soy Flegias, señor del fango estigio. ¡Nadie cruza hacia las murallas de Dite con vida!'
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
          text: 'El río Flegetonte ruge con torrentes de sangre hirviente. El calor sofocante anuncia al verdugo de la Violencia...'
        },
        {
          speaker: 'Azgalor',
          portrait: 'Azgalor',
          text: '¡Mortal sanguinario! Soy Azgalor, el carcelero del fuego. ¡Tus pecados alimentarán este lago de lava por la eternidad!'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Ya he ardido bastante en vida. Tu fuego no me asusta.'
        }
      ],

      azgalor_intro: [
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'El río Flegetonte ruge con torrentes de sangre hirviente. El calor sofocante anuncia al verdugo de la Violencia...'
        },
        {
          speaker: 'Azgalor',
          portrait: 'Azgalor',
          text: '¡Mortal sanguinario! Soy Azgalor, el carcelero del fuego. ¡Tus pecados alimentarán este lago de lava por la eternidad!'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Ya he ardido bastante en vida. Tu fuego no me asusta.'
        }
      ],

      malacoda_intro: [
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'Las diez fosas de las Malebolge se abren ante Kael. El hedor a azufre y brea hirviente precede a los demonios con alas de murciélago...'
        },
        {
          speaker: 'Malacoda',
          portrait: 'Malacoda',
          text: '¡Miren qué sabrosa presa ha caído en mis fosas! Soy Malacoda, capitán de los Malebranche. ¡Mis tridentes desgarrarán tu carne!'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Guarda tus bravuconadas, diablo alado. Tu brea será tu tumba.'
        }
      ],

      boss2_intro: [
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'El viento gélido del Cocito apaga toda calidez. En el círculo de la Traición, el frío de la muerte es absoluto...'
        },
        {
          speaker: 'Glacior',
          portrait: 'Glacior',
          text: '¡Traidor impío! Soy Glacior, emperador de la escarcha. Tu traición a los inocentes quedará congelada por siempre en el hielo cósmico.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Cometí crímenes imperdonables... ¡pero romperé tu prisión helada y hallaré mi redención!'
        }
      ],

      glacior_intro: [
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'El viento gélido del Cocito apaga toda calidez. En el círculo de la Traición, el frío de la muerte es absoluto...'
        },
        {
          speaker: 'Glacior',
          portrait: 'Glacior',
          text: '¡Traidor impío! Soy Glacior, emperador de la escarcha. Tu traición a los inocentes quedará congelada por siempre en el hielo cósmico.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Cometí crímenes imperdonables... ¡pero romperé tu prisión helada y hallaré mi redención!'
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
