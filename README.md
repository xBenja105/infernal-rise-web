# Infernal Rise 2.0 (Videojuego Nativo de Escritorio PC — Incremental Rogue-lite)

[![Platform Windows](https://img.shields.io/badge/Plataforma-Windows%20PC-0078D6?style=for-the-badge&logo=windows)](https://github.com/xBenja105/infernal-rise-web)
[![Engine Electron](https://img.shields.io/badge/Motor-Electron%20Desktop-47848F?style=for-the-badge&logo=electron)](https://github.com/xBenja105/infernal-rise-web)
[![Release v2.0.0](https://img.shields.io/badge/Release-v2.0.0-success?style=for-the-badge&logo=github)](https://github.com/xBenja105/infernal-rise-web/releases/tag/v2.0.0)
[![GitHub Repo](https://img.shields.io/badge/GitHub-xBenja105%2Finfernal--rise--web-181717?style=for-the-badge&logo=github)](https://github.com/xBenja105/infernal-rise-web)

🎮 **Juego Nativo de Escritorio PC**: Ejecuta directamente el ejecutable en `dist/Infernal Rise 2.0.0.exe` o `npm start`.

**Autor**: Benjamín Arriagada ([@xBenja105](https://github.com/xBenja105))

---

## ⚔️ Acerca del Juego
*Infernal Rise 2.0* es un videojuego de plataformas vertical y acción en 2D desarrollado nativamente para PC con ambientación de fantasía oscura y dificultad desafiante. Encarnas a **Kael**, un alma guerrera condenada que despierta en una caverna subterránea y debe escalar las entrañas de **La Gran Torre del Inframundo**, una colosal megatorre que asciende desde los fosos más oscuros hasta la cumbre donde yace el **Gran Portal Terrenal hacia el Mundo de los Seres Vivos**.

A lo largo de la campaña de **La Gran Torre**, enfrentarás a 3 Guardianes Legendarios con cinemáticas y fases únicas:
1. **Azgalor, el Demonio Abrasador (Demon Slime)** — Señor de las Fosas (Piso 1)
2. **Kranor, el Guardián Gélido (Frost Guardian)** — Custodio de las Cumbres Heladas (Piso 2)
3. **Asterión, el Minotauro del Tártaro (Minotauro)** — Titán de las Cavernas • Jefe Final (Piso 3)

---

## 🏛️ Estructura de la Gran Torre del Inframundo
- **Lobby: La Caverna Subterránea**:
  - Bóveda de pizarra y basalto con runas arcanas, antorchas violetas y el monolito del Santuario de Mejoras.
- **Piso 1: El Foso Abisal (Cimientos de Basalto y Fuego)**:
  - Plataformas de basalto gótico, escaleras de hierro y fosas incandescentes. Custodiado por **Azgalor**.
- **Piso 2: Las Cumbres Heladas (Bruma y Permafrost)**:
  - Plataformas de hielo resbaloso (`iceTile`), estalagmitas y ventiscas gélidas. Custodiado por **Kranor**.
- **Piso 3: Las Cavernas Rocosas y Ruinas de la Superficie**:
  - Cavernas escarpadas con mampostería de ruinas destruidas, lava en persecución ascendente y el enfrentamiento final contra **Asterión**, abriendo el portal hacia la luz del sol terrenal.

---

## 🧗 Mecánicas Hardcore de Precisión
- **Escaleras Trepables ([W] / [S])**: Sujetarse y trepar escaleras verticales para salvar abismos y saltar en cualquier dirección con [Espacio].
- **Superficies Resbalosas y Fango**:
  - *Hielo Glacial*: Inercia acumulada que patina suavemente, requiriendo saltar con anticipación.
  - *Fango Estigio*: Movimiento pesado y ralentizado que exige máxima concentración en la cadencia de salto.
- **Plataformas Quebradizas**: Tiemblan durante 0.55s al pisarlas antes de colapsar al vacío; reaparecen tras 3.2s.
- **Plataformas Móviles**: Oscilan horizontal y verticalmente, transportando la posición de Kael con su inercia.
- **Viento Huracanado**: Corrientes laterales en el Círculo de la Lujuria que empujan al jugador mientras está en el aire.
- **Saltos de Aguja con Techos de Pinchos**: El salto cargado debe dosificarse con precisión; un salto al 100% impactará contra el techo de pinchos.

---

## 🔮 Sistema de Economía Incremental
El juego posee una economía de tres divisas complementarias:

1. **Almas (🔮)**:
   - Divisa principal ganada al escalar altura en la torre, derrotar esqueletos, quebrar urnas o pasivamente cada segundo mediante el *Altar del Tormento*.
   - Se utiliza para comprar las mejoras permanentes del Santuario.
2. **Fragmentos de Humanidad (💠)**:
   - Divisa sagrada obtenida al derrotar a los 5 Guardianes de la Torre.
   - Desbloquea la gracia legendaria del **Doble Salto en el aire**. ¡Nunca se pierde con el reinicio o penitencia!
3. **Cenizas de Penitencia (🔥)**:
   - Divisa de prestigio obtenida al sacrificar tus almas acumuladas en el Santuario.
   - Cada Ceniza otorga un **+15% multiplicador permanente** a la generación de almas, daño de espada y vitalidad.

---

## ⛩️ Santuario de Mejoras Permanentes (Tecla [P] o Botón en HUD)
- **Vitalidad de Kael**: +15 HP máx por nivel y regeneración pasiva de salud.
- **Piel de Obsidiana**: ¡Permite sobrevivir a los pinchos! En lugar de muerte instantánea, recibes daño mitigado, invulnerabilidad temporal y rebote seguro.
- **Reflejos Infernales**: Aumenta la velocidad de carga de salto (+12% por nivel).
- **Impulso Titánico**: Incrementa la fuerza base y máxima de salto (+5% por nivel).
- **Filo del Purgatorio**: Incrementa el daño de los ataques con espada (+25% por nivel).
- **Codicia del Condenado**: +25% de almas obtenidas por altura y enemigos derrotados.
- **Altar del Tormento**: Generación continua de **Almas por Segundo (APS)**, ¡progresas incluso mientras exploras o descansas!
- **Doble Salto (Gracia Perdida)**: Permite un segundo salto libre en pleno vuelo.

---

## 🪶 Bendiciones Rogue-lite (Cofres en la Torre)
Durante cada ascenso encontrarás cofres sagrados que te ofrecen **1 de 3 bendiciones aleatorias** para esa partida:
- 🩸 **Vampirismo Carmesí** (Rara): Recuperas +5 HP al golpear con la espada.
- 🧲 **Imán Espiritual** (Común): Atrae los orbes de almas automáticamente desde 260px.
- ⚡ **Salto Sísmico** (Rara): Al soltar un salto cargado al máximo, emites una onda expansiva destructiva.
- 🪶 **Plumas del Abismo** (Épica): Mantener Espacio al caer te permite planear suavemente.
- 🗡️ **Sed de Verdugo** (Común): 30% de probabilidad de asestar golpes críticos (x2.5 daño).
- 🔥 **Filo Ígneo** (Épica): Cada espadazo dispara una onda cortante de fuego.
- 🛡️ **Voluntad de Hierro** (Común): Reduce todo el daño recibido en un 35%.
- ✨ **Cosecha Dorada** (Común): Duplica todos los orbes de almas soltados por urnas y enemigos.

---

## 🕹️ Controles
- **[A] / [D]** o **[←] / [→]**: Moverse suavemente con aceleración progresiva y frenado inercial.
- **[W] / [S]** o **[↑] / [↓]**: Trepar y descender por escaleras verticales.
- **[Mantener Espacio]**: Cargar salto con indicador visual. Al soltar, Kael salta con altura proporcional.
- **[Espacio en el aire]**: Doble salto (si está desbloqueado) o planear (con *Plumas del Abismo*).
- **[Espacio] (en salas de Jefe)**: Salto libre instantáneo.
- **[Z] / [J] / [Click Izquierdo]**: Ataque con espada y proyectiles ígneos.
- **[E]**: Interactuar con el Santuario de Mejoras (en el Lobby), hablar con NPC o abrir Cofres de Bendición.
- **[P]**: Abrir el Santuario de Mejoras y Prestigio (disponible en el Lobby).
- **[ESC]**: Pausar partida / cerrar menús / reiniciar progreso.
- **Dispositivos Móviles**: Botones táctiles virtuales optimizados en pantalla.

---

## 🚀 Cómo Jugar en PC (Escritorio Local)
- **Inicio Rápido**: Ejecuta directamente el binario compilado `dist/Infernal Rise 2.0.0.exe`.
- **Modo Desarrollo**: Ejecuta `npm start` en la terminal para iniciar el entorno Electron.
- **Compilar Ejecutable Portátil**: Ejecuta `npm run dist:portable` para empaquetar nuevamente el instalador/ejecutable `.exe` independiente en la carpeta `dist/`.

