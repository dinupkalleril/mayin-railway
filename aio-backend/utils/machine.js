import os from 'os';
import crypto from 'crypto';

export function getMachineId() {
  const raw = [
    os.hostname(),
    os.platform(),
    os.arch()
  ].join('|');

  return crypto
    .createHash('sha256')
    .update(raw)
    .digest('hex');
}
