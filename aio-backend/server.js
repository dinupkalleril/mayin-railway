import './index.js';
import { spawn } from 'child_process';

const next = spawn('node', ['frontend/server.js'], {
  stdio: 'inherit',
  env: process.env,
});

next.on('close', (code) => {
  process.exit(code);
});
