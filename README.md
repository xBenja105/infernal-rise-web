# Infernal Rise — Edición Web (Plataformer 2D Incremental Rogue-lite)

[![Jugar en Vercel](https://img.shields.io/badge/Jugar%20Online-Vercel-black?style=for-the-badge&logo=vercel)](https://infernal-rise-web.vercel.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub-xBenja105%2Finfernal--rise--web-181717?style=for-the-badge&logo=github)](https://github.com/xBenja105/infernal-rise-web)

🎮 **Jugar Online en Vivo**: **[https://infernal-rise-web.vercel.app](https://infernal-rise-web.vercel.app)**

**Autores Originales**: Benjamín Arriagada & Jorge Castro  
**Asignatura**: Desarrollo de Videojuegos — 3er Semestre (INACAP)  
**Docente**: Sebastián Pizarro  
**Expansión**: Incremental Rogue-lite Engine con física suave, saltos progresivos, economía de almas y prestigios.

---

## ⚔️ Acerca del Juego
*Infernal Rise* es un videojuego de plataformas vertical y acción en 2D con ambientación de fantasía oscura y dificultad desafiante. En esta versión web, el juego original se ha transformado en un **Plataformer Hardcore Incremental Rogue-lite** estructurado canónicamente según la **Divina Comedia de Dante Alighieri** (los 9 Círculos del Infierno).

Encarnas a **Kael**, un soldado condenado a ascender desde las profundidades del Purgatorio a través de los 9 Círculos del Inframundo, enfrentando a los 5 Guardianes Legendarios:
1. **Rey Minos** (Juez de los Condenados — Círculo II)
2. **Flegias** (Barquero de la Laguna Estigia — Círculo V)
3. **Azgalor** (Carcelero del Fuego y Flegetonte — Círculo VII)
4. **Malacoda** (Capitán de los Diablos Malebranche — Círculo VIII)
5. **Glacior** (Emperador de la Escarcha y el Hielo de Cocito — Círculo IX)

---

## 🏛️ Estructura de los 9 Círculos del Infierno
- **Torre 1 (Círculos I - III)**:
  - *Círculo I: Limbo* — Columnas de basalto gótico, escaleras de hierro y plataformas que se desmoronan.
  - *Círculo II: Lujuria* — Vientos huracanados laterales que desvían la trayectoria en el aire; saltos de aguja con techos de pinchos que castigan sobrecargar el salto al 100%.
  - *Círculo III: Gula* — Plataformas de hueso podrido y lluvia gélida.
- **Torre 2 (Círculos IV - VI)**:
  - *Círculo IV: Avaricia* — Plataformas de oro macizo (`goldTile`), riquezas malditas y estrechos saltos de aguja.
  - *Círculo V: Ira / Laguna Estigia* — Fango estigio (`mudTile`) que vuelve la carrera pesada y resbalosa (`maxWalkSpeed: 1.35`), obligando a calibrar cada salto. Plataformas móviles sincronizadas sobre fosas de lodo.
  - *Círculo VI: Herejía / Ciudad de Dite* — Sepulcros incandescentes, plataformas de obsidiana y elevadores de magma.
- **Torre 3 (Círculos VII - IX)**:
  - *Círculo VII: Violencia / Flegetonte* — Río de sangre y lava hirviente en la base, plataformas volcánicas y lluvia de meteoros.
  - *Círculo VIII: Fraude / Las Malebolge* — Diez fosas de brea y azufre, puentes quebradizos y plataformas rúnicas oscilantes.
  - *Círculo IX: Traición / Lago Cocito* — Piso de permafrost glacial (`iceTile`) con deslizamiento inercial de baja fricción y pinchos colgantes de hielo.

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

## 🚀 Cómo Jugar y Despliegue
- **En la Web (Vercel)**: Accede directamente desde cualquier navegador moderno en escritorio o móvil.
- **Localmente**: Simplemente haz doble clic en `JUGAR.bat` o ejecuta `node server.js` (puerto 8080). No requiere librerías pesadas ni instalación.

