import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function getLocalVersion() {
  const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
  return pkg.version;
}

async function getLatestVersion() {
  const response = await fetch('https://registry.npmjs.org/ereemby-cli/latest', {
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.version;
}

export async function checkVersion() {
  const localVersion = getLocalVersion();

  try {
    const latestVersion = await getLatestVersion();

    if (!latestVersion) {
      return; // Registry fora do ar, nao bloqueia
    }

    if (localVersion !== latestVersion) {
      console.log(chalk.red(`\n  Versao desatualizada: ${localVersion} → ${latestVersion}\n`));
      console.log(chalk.white(`  Atualize com: ${chalk.bold('npm update -g ereemby-cli')}\n`));
      return false;
    }
  } catch {
    // Erro de rede ou timeout, nao bloqueia
  }

  return true;
}
