@echo off
title Infernal Rise 2.0 - Edicion de Escritorio
echo ====================================================
echo             INFERNAL RISE 2.0 (PC NATIVO)
echo           Desarrollado por Benjamin Arriagada
echo ====================================================
echo Iniciando juego en ventana nativa de escritorio...
if exist "%~dp0dist\Infernal Rise 2.0.0.exe" (
  start "" "%~dp0dist\Infernal Rise 2.0.0.exe"
) else if exist "%~dp0dist\win-unpacked\Infernal Rise.exe" (
  start "" "%~dp0dist\win-unpacked\Infernal Rise.exe"
) else (
  npm start
)
exit
