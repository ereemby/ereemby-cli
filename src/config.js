import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.ereemby');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getConfig() {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) {
    return {};
  }
  const data = readFileSync(CONFIG_FILE, 'utf-8');
  return JSON.parse(data);
}

export function saveConfig(config) {
  ensureConfigDir();
  const existing = getConfig();
  const merged = { ...existing, ...config };
  writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

export function getToken() {
  const config = getConfig();
  return config.token || null;
}

export function getBaseUrl() {
  const config = getConfig();
  return config.baseUrl || 'https://api.ereemby.app';
}

const HASHES_FILE = join(CONFIG_DIR, 'hashes.json');

export function getHashes() {
  ensureConfigDir();
  if (!existsSync(HASHES_FILE)) return {};
  return JSON.parse(readFileSync(HASHES_FILE, 'utf-8'));
}

export function saveHashes(hashes) {
  ensureConfigDir();
  writeFileSync(HASHES_FILE, JSON.stringify(hashes, null, 2), 'utf-8');
}

export function hasHashes() {
  return existsSync(HASHES_FILE);
}
