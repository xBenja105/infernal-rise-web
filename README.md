# Infernal Rise 2.0 (Videojuego Nativo de Escritorio PC — Incremental Rogue-lite)

[![Platform Windows](https://img.shields.io/badge/Plataforma-Windows%20PC-0078D6?style=for-the-badge&logo=windows)](https://github.com/xBenja105/infernal-rise-web)
[![Engine Electron](https://img.shields.io/badge/Motor-Electron%20Desktop-47848F?style=for-the-badge&logo=electron)](https://github.com/xBenja105/infernal-rise-web)
[![Release v2.0.0](https://img.shields.io/badge/Release-v2.0.0-success?style=for-the-badge&logo=github)](https://github.com/xBenja105/infernal-rise-web/releases/tag/v2.0.0)
[![GitHub Repo](https://img.shields.io/badge/GitHub-xBenja105%2Finfernal--rise--web-181717?style=for-the-badge&logo=github)](https://github.com/xBenja105/infernal-rise-web)

🎮 **Juego Nativo de Escritorio para Windows PC**: Ejecuta directamente el ejecutable compilado en `dist/Infernal Rise 2.0.0.exe` o corre el entorno de desarrollo con `npm start`.

**Autor**: Benjamín Arriagada ([@xBenja105](https://github.com/xBenja105))

---

## ⚔️ Acerca del Juego

*Infernal Rise 2.0* es un videojuego de plataformas vertical de alta precisión, exploración y acción rogue-lite en 2D desarrollado nativamente para PC con ambientación de fantasía oscura y dificultad desafiante. 

Encarnas a **Kael**, un guerrero sentenciado al Inframundo que despierta en una caverna lúgubre. Para purgar su condena y salvar su alma, debe emprender un peligroso ascenso escalando **La Gran Torre del Inframundo**, una colosal estructura que se erige desde las fosas de basalto y fuego hasta la cumbre donde se abre el **Gran Portal Terrenal hacia el Mundo de los Vivos**.

A lo largo del ascenso, enfrentarás a los 3 Guardianes del Averno:
1. **Azgalor, el Demonio Abrasador (Demon Slime)** — Señor de las Fosas (Piso 1)
2. **Kranor, el Guardián Gélido (Frost Guardian)** — Custodio de las Cumbres Heladas (Piso 2)
3. **Asterión, el Minotauro del Tártaro (Minotauro)** — Titán de las Cavernas • Jefe Final (Piso 3)

---

## 🏰 Arquitectura Estructural y Visual (Inspiración *Jump King*)

El mundo de *Infernal Rise 2.0* ha sido completamente enriquecido con un sistema arquitectónico coherente donde ninguna plataforma flota sin sentido físico:

1. **Escuadras y Puntales Diagonales a Muro:**
   - Las plataformas próximas a las paredes laterales (`x <= 160px` o `x + w >= levelW - 160px`) extienden ménsulas y vigas diagonales de madera o piedra labrada, conectando sólidamente las repisas con los muros de la torre.
2. **Cerchas Estructurales y Celosías Inferiores en "X":**
   - Todas las plataformas suspendidas cuentan con vigas maestras de soporte inferior y celosías transversales de madera de mina y andamios.
3. **Columnas de Descarga y Pilares Verticales:**
   - Postes y pilares descendentes que conectan las plataformas con niveles inferiores, simulando andamiajes de minería y fortificaciones reales.
4. **Fondos Atmosféricos Parallax Temáticos por Piso:**
   - **Pisos 1 y 2 (Fosas Abisales & Cavernas):** 4 capas continuas de fondos cavernosos con estalactitas, pilares oscuros y roca basáltica.
   - **Piso 3 (Cámaras del Castillo Gótico):** Muros de sillería de piedra oscura, ventanas ojivales iluminadas con cirios dorados y estandartes heráldicos carmesí.
   - **Cumbres y Exteriores:** Agujas de castillos y torreones en contraluz profundo con brumas eólicas.
   - **Cumbre Terrenal (Mundo de los Vivos):** Parallax exterior de 6 capas que revela la luz del sol del amanecer, montañas lejanas, bosques de pinos y plataformas floridas con musgo esmeralda y flores silvestres.

---

## 🗺️ Exploración y Salas Especiales

Durante el ascenso por la torre, los jugadores pueden descubrir secretos que recompensan la curiosidad y la destreza:

- 🧱 **Paredes Quebradizas y Salas Secretas:**
  - En los flancos de la torre existen muros agrietados que pueden destruirse con golpes de espada o proyectiles de fuego. Al romperlos, se accede a estancias ocultas con cofres de reliquias legendarias y urnas de almas.
- 🏕️ **Puesto de Avanzada del Ermitaño (Haven Outpost):**
  - En las zonas de descanso a mitad de la torre, el Ermitaño ofrece una hoguera segura libre de enemigos y una tienda para comprar reliquias pasivas y pociones de salud usando almas.
- 🩸 **Altares de Sangre (Blood Altars):**
  - Antiguos monolitos donde puedes realizar pactos oscuros: entrega salud máxima o vitalidad actual a cambio de cientos de almas y bendiciones de combate de alto nivel.
- 🧰 **Monolitos de Desafío del Averno:**
  - Activa un desafío voluntario de oleadas enemigas; superarlo libera cofres de reliquias especiales y orbes de experiencia.

---

## 🎰 Ruleta de Armas y Armas Pasivas (Estilo *Vampire Survivors*)

En el vestíbulo de la caverna se encuentra la **Ruleta de las Armas**, una máquina tragamonedas interactiva que permite obtener y evolucionar armamento pasivo autónomo:

- ✝️ **Cruz Sagrada (Holy Cross):** Órbita protectora de cruces consagradas que repelen enemigos y destruyen proyectiles.
- 🔮 **Orbes del Averno (Hellfire Orbs):** Proyectiles de fuego teledirigidos que buscan automáticamente a los enemigos cercanos.
- 🧄 **Aura de Ajo Purificador:** Área continua de daño que castiga a cualquier enemigo que intente aproximarse a Kael.
- ⚡ **Relámpago de Juicio:** Rayos descendentes que caen sobre los enemigos con mayor vida.
- 🌀 **Chakrams y Guadañas:** Cuchillas giratorias y armas perforantes de largo alcance.
- 🔄 **Evolución de Armas:** Al subir las armas al nivel máximo con los tomos adecuados, evolucionan a sus versiones divinas (*Cruz de San Miguel*, *Supernova Infernal*, etc.).

---

## 🧗 Mecánicas Hardcore de Precisión

- **Escaleras Trepables ([W] / [S]):** Permite trepar escaleras verticales para salvar abismos y saltar en cualquier dirección con [Espacio].
- **Superficies Resbalosas:** Plataformas de hielo glacial que conservan la inercia del movimiento, exigiendo calcular saltos con anticipación.
- **Plataformas Quebradizas:** Tiemblan 0.55s tras ser pisadas antes de colapsar; reaparecen tras unos segundos.
- **Plataformas Móviles:** Oscilan vertical y horizontalmente transfiriendo inercia al personaje.
- **Corrientes de Viento:** Ráfagas eólicas en niveles superiores que desvían la trayectoria del salto en el aire.
- **Techos de Pinchos con Salto Dosificado:** Control analógico del salto cargado para evitar golpear techos letales.

---

## 🔮 Sistema de Economía Incremental y Prestigio

El juego posee una economía balanceada de tres divisas interconectadas:

1. **Almas (🔮):**
   - Obtenidas por ascender altura, derrotar enemigos, romper urnas o pasivamente mediante el *Altar del Tormento*.
   - Se utilizan para adquirir mejoras permanentes en el Santuario y comprar objetos al Ermitaño.
2. **Fragmentos de Humanidad (💠):**
   - Divisa sagrada obtenida al derrotar a los Guardianes de la Torre.
   - Permite desbloquear el **Doble Salto en el aire**, el cual es permanente y nunca se pierde tras morir o reiniciar.
3. **Cenizas de Penitencia (🔥):**
   - Divisa de prestigio obtenida al sacrificar almas acumuladas en el Santuario.
   - Cada Ceniza otorga un **multiplicador acumulativo (+15%)** al daño, la salud y la generación de almas.

---

## ⛩️ Santuario de Mejoras Permanentes ([P] o Botón en HUD)

- **Vitalidad de Kael:** Salud máxima incrementada y regeneración pasiva.
- **Piel de Obsidiana:** Sobrevive al contacto con pinchos con daño reducido y rebote seguro en vez de muerte instantánea.
- **Reflejos Infernales:** Aumenta la velocidad de carga del salto (+12% por nivel).
- **Impulso Titánico:** Mayor potencia y altura máxima de salto.
- **Filo del Purgatorio:** Daño incrementado para todos los ataques y tajos de espada.
- **Codicia del Condenado:** Almas adicionales obtenidas por altura y muertes.
- **Altar del Tormento:** Generación pasiva continua de **Almas por Segundo (APS)**.
- **Doble Salto (Gracia Sagrada):** Desbloqueo de salto libre en el aire.

---

## 🕹️ Controles

El juego cuenta con detección automática de dispositivos (Teclado, Ratón y Gamepad):

| Acción | Teclado | Ratón | Gamepad (Xbox / PS) |
| :--- | :--- | :--- | :--- |
| **Moverse / Apuntar** | `[A]` / `[D]` o Flechas | — | Stick Izquierdo / D-Pad |
| **Trepar Escaleras** | `[W]` / `[S]` o Flechas Arriba/Abajo | — | Stick Izquierdo / D-Pad Arriba/Abajo |
| **Cargar Salto** | Mantener `[Espacio]` y soltar | — | Mantener `[A]` (Xbox) / `[✕]` (PS) |
| **Salto Libre / Doble Salto** | Pulsar `[Espacio]` | — | Pulsar `[A]` (Xbox) / `[✕]` (PS) |
| **Atacar con Espada** | `[Z]`, `[J]` o `[Click Izquierdo]` | Clic Izquierdo | `[X]` (Xbox) / `[▢]` (PS) |
| **Dash Táctico (i-frames)** | `[Shift]` o `[K]` | Clic Derecho | `[LT]` / `[L2]` |
| **Interactuar / Hablar** | `[E]` | Clic en Prompt | `[RB]` / `[B]` / `[◯]` |
| **Avanzar Diálogos** | `[Espacio]`, `[Enter]`, `[E]`, `[Z]`, etc. | Clic en Diálogo o Pantalla | `[A]`, `[B]`, `[X]` |
| **Santuario de Mejoras** | `[P]` | Clic en Botón HUD | `[Y]` (en el lobby) |
| **Pausar / Menú** | `[Escape]` | Botón Pausa en HUD | `[Start]` / `[Options]` |
| **Pantalla Completa** | `[F11]` | — | — |

---

## 🚀 Cómo Jugar en PC (Escritorio Local)

- **Inicio Inmediato**: Ejecuta directamente el binario compilado `dist/Infernal Rise 2.0.0.exe`.
- **Modo Desarrollo**: Ejecuta `npm start` en la terminal para iniciar el entorno Electron.
- **Compilar Ejecutable Portátil**: Ejecuta `npm run dist:portable` para empaquetar el binario autónomo `.exe` en la carpeta `dist/`.

---

## 📦 Tecnologías Utilizadas

- **Runtime & Desktop App:** [Electron](https://www.electronjs.org/) (Arquitectura nativa Windows x64).
- **Motor Gráfico:** Canvas 2D HTML5 con renderizado optimizado por capas, doble búfer y 60 FPS estables.
- **Motor de Audio:** Web Audio API con síntesis procedural polifónica, filtros pasa-bajos dinámicos (lowpass) al pausar y ambientación de lluvia y viento.
- **Físicas y Detección de Colisiones:** AABB con respuesta inercial para plataformas móviles, escaleras trepables, muros quebradizos y rebotes elásticos.
- **Persistencia:** Almacenamiento local seguro (`localStorage`) con soporte para exportar e importar partidas guardadas en formato JSON.
