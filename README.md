# Infernal Rise 2.0 (Videojuego Nativo de Escritorio PC — Roguelite de Acción y Plataformas Vertical)

[![Platform Windows](https://img.shields.io/badge/Plataforma-Windows%20PC-0078D6?style=for-the-badge&logo=windows)](https://github.com/xBenja105/infernal-rise-web)
[![Engine Electron](https://img.shields.io/badge/Motor-Electron%20Desktop-47848F?style=for-the-badge&logo=electron)](https://github.com/xBenja105/infernal-rise-web)
[![Release v2.0.0](https://img.shields.io/badge/Release-v2.0.0-success?style=for-the-badge&logo=github)](https://github.com/xBenja105/infernal-rise-web/releases/tag/v2.0.0)
[![GitHub Repo](https://img.shields.io/badge/GitHub-xBenja105%2Finfernal--rise--web-181717?style=for-the-badge&logo=github)](https://github.com/xBenja105/infernal-rise-web)

---

### 📥 DESCARGA DIRECTA (SOLO PARA JUGAR)

[![DESCARGAR JUEGO COMPLETO (.EXE PARA WINDOWS)](https://img.shields.io/badge/DESCARGAR%20INFERNAL%20RISE-EJECUTABLE%20PORTABLE%20(.EXE)-2ea44f?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/xBenja105/infernal-rise-web/releases/download/v2.0.0/Infernal.Rise.2.0.0.exe)

> 💡 **¿Solo quieres jugar sin ver el código ni instalar dependencias?**
> 1. Haz clic en el botón verde superior para descargar **`Infernal.Rise.2.0.0.exe`**.
> 2. Haz doble clic en el archivo descargado para comenzar a jugar de inmediato (es **100% portable**, no requiere instalación, ni Node.js, ni comandos).

**Autor**: Benjamín Arriagada ([@xBenja105](https://github.com/xBenja105))

---

## ⚔️ ¿Qué es Infernal Rise?

**Infernal Rise** es un **Roguelite de Acción y Plataformas Verticales Hardcore** *(Vertical Precision Platformer & Action Roguelite)* en 2D ambientado en una fantasía oscura medieval inspirada en la *Divina Comedia* de Dante.

Combina la exigencia y el vértigo milimétrico del plataformeo vertical (estilo *Jump King* y *Getting Over It*) con el combate visceral cuerpo a cuerpo y la construcción de builds dinámicas in-run (estilo *Dead Cells* y *Hades*).

Encarnas a **Kael**, un guerrero condenado al Inframundo que despierta en una bóveda subterránea. Para purgar sus culpas y recuperar su alma, debe emprender un ascenso vertical contrarreloj a través de **La Gran Torre del Inframundo**, una colosal aguja de piedra y hierro que se eleva sobre fosas de lava ascendente hacia el umbral del Mundo de los Vivos.

---

## 🏛️ La Campaña: Los Pisos de la Gran Torre

Cada piso ofrece un bioma procedural con identidad arquitectónica única, atmósfera inmersiva y alturas a gran escala:

### 0. Refugio del Inframundo (Lobby Cavernoso)
- Bóveda subterránea con runas místicas, antorchas violetas envolventes y música ambiental serena.
- **Santuario de Mejoras**: desbloquea perks permanentes (salud máxima, piel de obsidiana, doble salto, multiplicadores de daño).
- **Ruleta de las Armas**: tragamonedas interactiva para desbloquear y evolucionar armas pasivas autónomas.

### 1. Piso 1: El Foso Abisal (8,400 px de Ascenso)
- **Bioma**: Basalto negro, fisuras de magma fluido continuo y lluvia ambiental.
- **Mecánica Central**: La marea de lava primordial persigue al jugador desde el fondo, acelerando si te adelantas.
- **Estructura**: Dividido en 4 tiers (*Foso de Lava Primordial*, *Foso de Basalto Abisal*, *Ascenso de Ceniza y Fuego*, *Cimientos del Averno*).
- **Guardián del Piso**: **Azgalor, el Demonio Abrasador (Demon Slime)** — Coloso ígneo que invoca olas de fuego, saltos sísmicos y proyectiles de magma.

### 2. Piso 2: Las Agujas Glaciares (9,200 px de Ascenso)
- **Bioma**: Hielo permafrost, pilastras de escarcha, antorchas de fuego azul y ventiscas gélidas.
- **Mecánica Central**: Superficies resbalosas que conservan la inercia del movimiento y fuertes corrientes de viento ártico lateral que desvían las trayectorias aéreas.
- **Estructura**: 3 tiers (*Escarcha Baja*, *Glaciares Colgantes & Criptas*, *Agujas Árticas & Vientos*).
- **Guardián del Piso**: **Kranor, el Guardián Gélido (Frost Guardian)** — Centinela que lanza carámbanos teledirigidos, ráfagas congelantes y ondas gélidas.

### 3. Piso 3: Las Cavernas Rocosas & Ruinas del Alba (10,200 px de Ascenso)
- **Bioma**: Baluartes de piedra, columnatas góticas continuas, escombros antiguos y resplandores del umbral solar.
- **Mecánica Central**: Plataformas quebradizas que colapsan al pisarlas, puentes colgantes oscilantes y trampas de pinchos combinadas con enemigos de élite.
- **Estructura**: 3 tiers (*Fosas Rocosas*, *Galerías de Escombros & Baluartes Góticos*, *Bóvedas del Alba & Umbral Solar*).
- **Jefe Final**: **Asterión, el Minotauro del Tártaro** — Titán legendario con embestidas destructivas, golpes de martillo sísmico y auras de poder ancestral.

### 4. Modo Infernal (Supervivencia Roguelite Infinita — 6,400 px)
- Ascenso extremo procedural con 130 plataformas consecutivas, marea de lava acelerada y mezcla dinámica de todos los tipos de bioma.

---

## 🧱 Arquitectura y Variedad de Plataformas (Cero Texturas Flotando)

El mundo ha sido diseñado bajo una estricta coherencia física y visual donde cada elemento tiene anclaje arquitectónico:

- 🪨 **Bloques Ciclópeos Gruesos (`h: 44-56px`):** Losas monolíticas masivas con hiladas de sillería de piedra labrada, llagas de mortero y sombras profundas.
- ⛓️ **Vigas y Pasarelas Delgadas (`h: 10-14px`):** Barras esbeltas de hierro forjado o madera minera con pernos de sujeción cada 26px y pletinas de anclaje.
- ⬛ **Cubos Cuadrados de Salto (`44x44px` a `50x50px`):** Peldaños cúbicos de precisión con biseles cuadrangulares tallados para saltos ágiles.
- 🏛️ **Ejes y Fustes Verticales (`w: 20-24px`, `h: 100-140px`):** Columnas divisorias con flejes de hierro y cornisas voladizas a ambos lados.
- 📐 **Cerchas y Ménsulas Diagonales:** Plataformas próximas a los muros extienden puntales diagonales empotrados en la piedra.
- 🏛️ **Pilares de Descarga Continuos:** Las columnas verticales solo se construyen si conectan de forma continua con una plataforma inferior (`<= 240px`), asentándose sobre un plinto labrado (cero columnas cortadas en el aire).
- 🕯️ **Pebeteros y Antorchas Ancladas:** Cada antorcha se apoya sobre el piso con su trípode de forja o se incrusta en los muros laterales de mampostería.

---

## ⚔️ Combate, Progresión In-Run y Armamento

- **Dash Táctico con i-frames**: Permite esquivar proyectiles, atravesar enemigos y saltar sobre trampas sin recibir daño durante la esquiva.
- **Hitbox 360° y Combate Visceral**: Cobertura frontal extendida e inmediata desde el fotograma 0 de ataque, impidiendo stunlocks enemigos por contacto.
- **Subida de Nivel y Bendiciones Roguelite**: Recolectar gemas de XP liberadas por enemigos permite elegir 1 de 3 bendiciones pasivas (ondas ígneas, aumento de alcance, vampirismo, escudos temporales).
- **Ruleta de Armas Pasivas**:
  - ✝️ *Cruz Sagrada*: Órbita protectora que repele enemigos y destruye proyectiles.
  - 🔮 *Orbes del Averno*: Bolas de fuego teledirigidas autónomas.
  - 🧄 *Aura Purificadora*: Campo de daño continuo de proximidad.
  - ⚡ *Relámpagos de Juicio*: Rayos descendentes sobre los objetivos más resistentes.
  - 🔄 *Evolución de Armas*: Al alcanzar el nivel máximo con sus catalizadores, se transforman en versiones divinas.
- **Mascotas y Familiares Rescatables**: Rescata a *Ignis*, *Aura* y *Borus* enjaulados en la torre para recibir apoyo autónomo en combate.

---

## 🗺️ Secretos y Encuentros Especiales

- 🧱 **Paredes Quebradizas y Salas Secretas**: Muros agrietados que se rompen con golpes de espada, revelando cofres de reliquias legendarias y urnas de almas.
- 🏕️ **Puesto de Avanzada del Ermitaño**: Zonas seguras a mitad de camino con hogueras sin enemigos, pociones de salud y compra de reliquias.
- 🩸 **Altares de Sangre**: Sacrifica salud máxima o vida actual a cambio de cientos de almas y bendiciones prohibidas.
- 🧰 **Monolitos de Desafío**: Eventos opcionales de oleadas enemigas con recompensas de alto valor.

---

## ⚙️ Menús, Audio y Calidad de Vida

- **Menú Principal Standalone**: Pantalla de título independiente y limpia; al salir al menú principal, la partida se desmonta por completo en memoria (sin juego pausado en fondo).
- **Control de Volumen en Tiempo Real**: Sliders dedicados para Maestro, Efectos (SFX) y Música de fondo con respuesta inmediata y sincronización visual.
- **Tipografía Limpia**: Textos claros y legibles sin ruido visual ni saturación de emojis.
- **Soporte Multilingüe**: Alterna en tiempo real entre Español e Inglés con localización completa.
- **Reasignación de Teclas**: Personaliza todas las teclas de juego desde el menú de opciones.

---

## 🕹️ Controles

Compatible con detección automática de Teclado, Ratón y Mandos (Xbox, PlayStation y genéricos):

| Acción | Teclado | Ratón | Mando (Xbox / PlayStation) |
| :--- | :--- | :--- | :--- |
| **Moverse / Apuntar** | `[A]` / `[D]` o Flechas | — | Stick Izquierdo / D-Pad |
| **Trepar Escaleras** | `[W]` / `[S]` o Flechas Arriba/Abajo | — | Stick Izquierdo / D-Pad Arriba/Abajo |
| **Cargar Salto** | Mantener `[Espacio]` y soltar | — | Mantener `[A]` (Xbox) / `[✕]` (PS) |
| **Salto Libre / Doble Salto** | Pulsar `[Espacio]` | — | Pulsar `[A]` (Xbox) / `[✕]` (PS) |
| **Atacar con Espada** | `[Z]`, `[J]` o `[Click Izquierdo]` | Clic Izquierdo | `[X]` (Xbox) / `[▢]` (PS) |
| **Dash Táctico (i-frames)** | `[Shift]` o `[K]` | Clic Derecho | `[LT]` / `[L2]` |
| **Interactuar / Hablar** | `[E]` | Clic en Prompt | `[RB]` / `[B]` / `[◯]` |
| **Avanzar Diálogos** | `[Espacio]`, `[Enter]`, `[E]`, `[Z]` | Clic en Diálogo | `[A]`, `[B]`, `[X]` |
| **Santuario de Mejoras** | `[P]` | Botón HUD | `[Y]` (en el lobby) |
| **Pausar / Menú** | `[Escape]` | Botón HUD | `[Start]` / `[Options]` |
| **Pantalla Completa** | `[F11]` | — | — |

---

## 🚀 Cómo Jugar o Desarrollar en PC

### Modo Jugador (Sin Instalar Nada)
1. Descarga el ejecutable desde [GitHub Releases](https://github.com/xBenja105/infernal-rise-web/releases/tag/v2.0.0).
2. Ejecuta `Infernal.Rise.2.0.0.exe` directamente.

### Modo Desarrollador (Node.js & Electron)
```bash
# 1. Clonar el repositorio
git clone https://github.com/xBenja105/infernal-rise-web.git
cd infernal-rise-web

# 2. Instalar dependencias
npm install

# 3. Iniciar el juego en modo desarrollo
npm start

# 4. Compilar ejecutable portable para Windows (.exe)
npm run dist:portable
```

---

## 📦 Tecnologías y Rendimiento

- **Runtime de Escritorio:** [Electron 34](https://www.electronjs.org/) nativo para Windows x64.
- **Motor Gráfico:** Canvas 2D HTML5 optimizado con renderizado por capas, doble búfer y 60 FPS estables sin dependencias pesadas.
- **Motor de Audio:** Web Audio API procedural con síntesis polifónica, reverberación de caverna, ambientación de lluvia/viento y filtro pasa-bajos (*lowpass*) dinámico en menús y pausas.
- **Físicas:** AABB con inercia cinemática para plataformas móviles, rebotes elásticos, escaleras y muros destructibles.
- **Persistencia:** Almacenamiento local seguro (`localStorage`) con soporte para exportar e importar partidas en formato JSON.
