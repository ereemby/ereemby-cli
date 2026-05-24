import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.ereemby');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
}

function readConfig() {
  ensureConfigDir();
  if (!existsSync(CONFIG_FILE)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeConfig(config) {
  ensureConfigDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

function getStoreEntry() {
  const config = readConfig();
  return config.stores?.[process.cwd()] || {};
}

function updateStoreEntry(data) {
  const config = readConfig();
  if (!config.stores) config.stores = {};
  config.stores[process.cwd()] = { ...(config.stores[process.cwd()] || {}), ...data };
  writeConfig(config);
}

export function saveToken(token) {
  updateStoreEntry({ token });
}

export function getToken() {
  const store = getStoreEntry();
  if (store.token) return store.token;
  // backward compat: token global antigo
  return readConfig().token || null;
}

export function getBaseUrl() {
  return readConfig().baseUrl || 'https://api.ereemby.app';
}

export function getHashes() {
  return getStoreEntry().hashes || {};
}

export function saveHashes(hashes) {
  updateStoreEntry({ hashes });
}

export function hasHashes() {
  return !!(getStoreEntry().hashes);
}
