import chalk from 'chalk';
import ora from 'ora';
import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fetchFiles } from '../api.js';
import { getHashes, hasHashes } from '../config.js';

export async function diffCommand() {
  if (!hasHashes()) {
    console.log(chalk.red('Nenhum tema encontrado. Rode "ereemby pull" primeiro.'));
    process.exitCode = 1; return;
  }

  const hashes = getHashes();

  const spinner = ora('Comparando arquivos...').start();

  try {
    const { files } = await fetchFiles();
    spinner.stop();

    const changed = [];
    const missing = [];

    for (const file of files) {
      const localPath = join(process.cwd(), file.directory);

      if (!existsSync(localPath)) {
        missing.push(file.directory);
        continue;
      }

      const content = readFileSync(localPath, 'utf-8');
      const currentHash = createHash('md5').update(content).digest('hex');
      const originalHash = hashes[file.directory];

      if (!originalHash || currentHash !== originalHash) {
        changed.push(file.directory);
      }
    }

    if (changed.length === 0 && missing.length === 0) {
      console.log(chalk.green('Nenhuma alteracao encontrada.\n'));
      return;
    }

    if (changed.length > 0) {
      console.log(chalk.yellow(`  ${changed.length} arquivo(s) modificado(s):\n`));
      changed.forEach(f => console.log(chalk.yellow(`    M  ${f}`)));
      console.log('');
    }

    if (missing.length > 0) {
      console.log(chalk.red(`  ${missing.length} arquivo(s) ausente(s) localmente:\n`));
      missing.forEach(f => console.log(chalk.red(`    !  ${f}`)));
      console.log('');
    }

  } catch (err) {
    spinner.stop();
    console.log(chalk.red(`Erro: ${err.message}`));
    process.exitCode = 1; return;
  }
}
