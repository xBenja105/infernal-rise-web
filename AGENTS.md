# Infernal Rise — Reglas del Proyecto

## 1. Actualización Obligatoria de Ejecutables (.exe)
- **Siempre** que se realicen cambios, correcciones o nuevas características en el juego (`js/`, `assets/`, `index.html`, `styles.css`), se debe recompilar y actualizar obligatoriamente el ejecutable con:
  - `npm run dist` (para generar el ejecutable portable `dist/Infernal Rise 2.0.0.exe`).
  - `npm run dist:installer` (para generar el instalador `dist/Infernal Rise Setup 2.0.0.exe`).
- Mantener la carpeta `dist/` limpia, sin binarios duplicados ni archivos temporales (`builder-debug.yml`).

## 2. Limpieza e Integridad del Repositorio
- No dejar archivos de prueba o scripts temporales (`scratch/`) en la raíz del proyecto.
- Verificar siempre la sintaxis y ejecutar validaciones de juego antes de compilar y hacer commit.
