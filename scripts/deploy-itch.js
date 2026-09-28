const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const pkg = require('../package.json');

const version = pkg.version || '2.0.0';
const targetUser = 'benja1005';
const targetGame = 'infernal-rise';

// Find butler binary (PATH or local install)
let butlerCmd = 'butler';
const localButler = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'butler', 'butler.exe');
if (fs.existsSync(localButler)) {
  butlerCmd = `"${localButler}"`;
}

const portableExe = path.join(__dirname, '..', 'dist', `Infernal Rise Roguelite ${version}.exe`);
const installerExe = path.join(__dirname, '..', 'dist', `Infernal Rise Roguelite Setup ${version}.exe`);

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const extraFlags = isDryRun ? ' --dry-run' : '';

console.log(`\n======================================================`);
console.log(`🚀 Desplegando Infernal Rise Roguelite v${version} en itch.io`);
console.log(`🎯 Destino: ${targetUser}/${targetGame}`);
console.log(`======================================================\n`);

if (args.includes('portable') || !args.includes('installer')) {
  if (fs.existsSync(portableExe)) {
    console.log(`📦 Subiendo Portable: ${path.basename(portableExe)} -> canal 'windows-portable'`);
    execSync(`${butlerCmd} push "${portableExe}" ${targetUser}/${targetGame}:windows-portable --userversion ${version}${extraFlags}`, { stdio: 'inherit' });
  } else {
    console.error(`⚠️ No se encontró: ${portableExe}. Ejecuta 'npm run dist' primero.`);
  }
}

if (args.includes('installer') || !args.includes('portable')) {
  if (fs.existsSync(installerExe)) {
    console.log(`📦 Subiendo Instalador: ${path.basename(installerExe)} -> canal 'windows-installer'`);
    execSync(`${butlerCmd} push "${installerExe}" ${targetUser}/${targetGame}:windows-installer --userversion ${version}${extraFlags}`, { stdio: 'inherit' });
  } else {
    console.error(`⚠️ No se encontró: ${installerExe}. Ejecuta 'npm run dist:installer' primero.`);
  }
}

console.log(`\n✨ Proceso de despliegue finalizado.\n`);
