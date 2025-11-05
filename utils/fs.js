import fs from 'fs';
import path from 'path';

export function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function normalizeForwardSlash(p) {
  return p.replace(/\\/g, '/');
}

export function joinSafe(...segments) {
  return path.join(...segments);
}
