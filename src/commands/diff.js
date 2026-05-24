import chalk from 'chalk';
import ora from 'ora';
import { createHash } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fetchFiles, fetchFileContent } from '../api.js';
import { getHashes, hasHashes } from '../config.js';

export async function diffCommand() {
  if (!hasHashes()) {
    console.log(chalk.red('Nenhum tema encontrado. Rode "ereemby pull" primeiro.'));
    process.exitCode = 1; return;
  }

  const hashes = getHashes();
  const spinner = ora('Buscando arquivos do tema...').start();

  try {
    const { files } = await fetchFiles();
    spinner.text = `Comparando arquivos...`;

    const changed = [];
    const missing = [];
    const remoteDirectories = new Set();

    for (const file of files) {
      remoteDirectories.add(file.directory);
      const localPath = join(process.cwd(), file.directory);

      if (!existsSync(localPath)) {
        missing.push(file.directory);
        continue;
      }

      const localContent = readFileSync(localPath, 'utf-8');
      const localHash = createHash('md5').update(localContent).digest('hex');

      const data = await fetchFileContent(file.id);
      const remoteContent = data.content || '';
      const remoteHash = createHash('md5').update(remoteContent).digest('hex');

      if (localHash !== remoteHash) {
        changed.push(file.directory);
      }
    }

    // arquivos rastreados localmente mas nao retornados pela API (ex: JS/CSS)
    for (const [dir, storedHash] of Object.entries(hashes)) {
      if (remoteDirectories.has(dir)) continue;
      const localPath = join(process.cwd(), dir);
      if (!existsSync(localPath)) {
        missing.push(dir);
        continue;
      }
      const localContent = readFileSync(localPath, 'utf-8');
      const localHash = createHash('md5').update(localContent).digest('hex');
      if (localHash !== storedHash) {
        changed.push(dir);
      }
    }

    spinner.stop();

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
