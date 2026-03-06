#!/usr/bin/env node
/**
 * Start Expo with REACT_NATIVE_PACKAGER_HOSTNAME set to this machine's LAN IP
 * so Android (emulator + device) can download the bundle. Allows "npm start" then press "a".
 */

const { spawn } = require('child_process');
const os = require('os');

function getLanIp() {
  const ifaces = os.networkInterfaces();
  for (const n of Object.values(ifaces || {})) {
    for (const i of n) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return '127.0.0.1';
}

const host = getLanIp();
const env = { ...process.env, REACT_NATIVE_PACKAGER_HOSTNAME: host };
const child = spawn('npx', ['expo', 'start', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: true,
  env,
});
child.on('exit', (code) => process.exit(code ?? 0));
