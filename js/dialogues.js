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

    // Advance dialogue on click
    if (this.modal) {
      this.modal.addEventListener('click', (e) => {
        e.stopPropagation();
        this.advance();
      });
    }

    // Database of authentic game dialogues
    this.dialogueTrees = {
      prologue: [
        {
          speaker: 'Soldado',
          portrait: 'Soldado',
          text: 'Kael, el traidor está escondido en estas ruinas.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Entendido. Vamos a por él.'
        },
        {
          speaker: 'Soldado',
          portrait: 'Soldado',
          text: 'Está con su familia... ¿qué hacemos con ellas?'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'No hay excepciones. Acabaremos con todos.'
        },
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'El consejo del reino condenó a Kael por la muerte de inocentes. Su castigo: la muerte y el destierro al Inframundo.'
        },
        {
          speaker: 'Narrador',
          portrait: 'Kael',
          text: 'Frente a la colosal Torre Infernal, tu única salida es luchar y ascender hacia la superficie.'
        }
      ],

      demon_slime_intro: [
        {
          speaker: 'Demonio de Magma',
          portrait: 'DemonSlime',
          text: '¡JAJAJA! ¿Un alma intentando huir? ¡Tus huesos se fundirán en mi fuego!'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Apártate de mi camino. No pienso quedarme en este foso.'
        }
      ],

      frost_guardian_intro: [
        {
          speaker: 'Guardián de Hielo',
          portrait: 'FrostGuardian',
          text: 'El frío eterno detiene a los débiles. Tu llama se apaga aquí.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Mi espada quema con más fuerza que tu ventisca. ¡En guardia!'
        }
      ],

      minotaur_intro: [
        {
          speaker: 'Minotauro',
          portrait: 'Minotauro',
          text: '¡MUUUUGH! ¡Este laberinto es mi templo! ¡Nadie sale con vida!'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Veo la salida entre las grietas. Eres el último obstáculo en mi camino.'
        }
      ],

      minos_intro: [
        {
          speaker: 'Minos',
          portrait: 'Minos',
          text: 'Alto ahí. Soy Minos, juez de las fosas. Nadie sube por esta torre.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Tu sentencia no tiene poder sobre mi acero. ¡A un lado!'
        }
      ],

      flegias_intro: [
        {
          speaker: 'Flegias',
          portrait: 'Flegias',
          text: '¡Intruso! El pantano se traga a todos los que intentan escapar.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'No me ahogaré en tu ciénaga. ¡Prepárate!'
        }
      ],

      boss1_intro: [
        {
          speaker: 'Azgalor',
          portrait: 'Azgalor',
          text: 'Bienvenido a mi forja. Arderás como todos los demás.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'El fuego ya no me asusta. Abre paso.'
        }
      ],

      azgalor_intro: [
        {
          speaker: 'Azgalor',
          portrait: 'Azgalor',
          text: 'Bienvenido a mi forja. Arderás como todos los demás.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'El fuego ya no me asusta. Abre paso.'
        }
      ],

      malacoda_intro: [
        {
          speaker: 'Malacoda',
          portrait: 'Malacoda',
          text: 'El viento helado corta la carne, mortal. No llegarás a la cima.'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'Un último esfuerzo y estaré fuera. ¡A luchar!'
        }
      ],

      boss2_intro: [
        {
          speaker: 'Glacior',
          portrait: 'Glacior',
          text: '¡Soy el Centinela del Umbral! Más allá está la salida... ¡pero jamás te dejaré cruzar!'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'He subido desde el abismo más profundo. ¡Nadie me impedirá volver a la vida!'
        }
      ],

      glacior_intro: [
        {
          speaker: 'Glacior',
          portrait: 'Glacior',
          text: '¡Soy el Centinela del Umbral! Más allá está la salida... ¡pero jamás te dejaré cruzar!'
        },
        {
          speaker: 'Kael',
          portrait: 'Kael',
          text: 'He subido desde el abismo más profundo. ¡Nadie me impedirá volver a la vida!'
        }
      ]
    };
  }

  startDialogue(key, onComplete) {
    const lines = this.dialogueTrees[key];
    if (!lines || lines.length === 0) {
      if (onComplete && typeof onComplete === 'function') {
        try {
          onComplete();
        } catch (err) {
          console.error('Error in dialogue fallback callback:', err);
        }
      }
      return;
    }

    this.active = true;
    this.currentLines = lines;
    this.lineIndex = 0;
    this.onCompleteCallback = onComplete;
    if (this.modal) {
      this.modal.style.display = 'block';
    }

    this.displayCurrentLine();
  }

  displayCurrentLine() {
    if (this.lineIndex >= this.currentLines.length) {
      this.closeDialogue();
      return;
    }

    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }

    const line = this.currentLines[this.lineIndex];
    if (this.speakerEl) {
      this.speakerEl.textContent = line.speaker || '';
    }

    // Draw Portrait
    if (this.portraitCtx && window.spriteManager && window.spriteManager.portraits) {
      this.portraitCtx.clearRect(0, 0, 96, 96);
      const portraitImg = window.spriteManager.portraits[line.portrait] || window.spriteManager.portraits.Kael;
      if (portraitImg) {
        this.portraitCtx.drawImage(portraitImg, 0, 0);
      }
    }

    // Typewriter effect
    if (this.textEl) {
      this.textEl.textContent = '';
    }
    this.charIndex = 0;
    const fullText = line.text || '';

    this.typingTimer = setInterval(() => {
      if (this.charIndex < fullText.length) {
        if (this.textEl) {
          this.textEl.textContent += fullText[this.charIndex];
        }
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
      if (this.textEl && this.currentLines[this.lineIndex]) {
        this.textEl.textContent = this.currentLines[this.lineIndex].text;
      }
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
    if (this.typingTimer) {
      clearInterval(this.typingTimer);
      this.typingTimer = null;
    }
    if (this.modal) {
      this.modal.style.display = 'none';
    }
    const cb = this.onCompleteCallback;
    this.onCompleteCallback = null;
    if (cb && typeof cb === 'function') {
      try {
        cb();
      } catch (err) {
        console.error('Error in dialogue onComplete callback:', err);
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.DialogueManager = DialogueManager;
  window.dialogueManager = new DialogueManager();
}
