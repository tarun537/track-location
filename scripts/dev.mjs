import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

console.log('\x1b[36m%s\x1b[0m', '==================================================');
console.log('\x1b[36m%s\x1b[0m', '   Starting Locato Services (API + Web Frontend)  ');
console.log('\x1b[36m%s\x1b[0m', '==================================================');

const api = spawn(npmCmd, ['--workspace=apps/api', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true,
});

const web = spawn(npmCmd, ['--workspace=apps/web', 'run', 'dev'], {
  stdio: 'inherit',
  shell: true,
});

function handleExit() {
  console.log('\nShutting down Locato services...');
  api.kill();
  web.kill();
  process.exit(0);
}

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);

