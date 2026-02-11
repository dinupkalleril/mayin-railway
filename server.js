import './aio-backend/index.js';
import { spawn } from 'child_process';

// Start Next standalone server
const next = spawn('node', ['frontend/server.js'], {
  stdio: 'inherit',
  env: process.env,
});

next.on('close', (code) => {
  process.exit(code);
});
