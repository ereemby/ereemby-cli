import chalk from 'chalk';
import ora from 'ora';
import { createHash } from 'crypto';
import { mkdirSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { createInterface } from 'readline';
import { fetchFiles, fetchFileContent } from '../api.js';
import { getHashes, saveHashes, hasHashes } from '../config.js';

const THEME_DIRS = ['assets', 'components', 'layout', 'pages', 'routes'];

function hasExistingThemeFiles() {
  for (const dir of THEME_DIRS) {
    const dirPath = join(process.cwd(), dir);
    if (existsSync(dirPath) && readdirSync(dirPath).length > 0) return true;
  }
  return false;
}

function askConfirmation(message) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(message, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

export async function pullCommand(options) {
  const fileFilter = options.file;

  // Pull de arquivo especifico
  if (fileFilter) {
    if (!hasHashes()) {
      console.log(chalk.red('Nenhum tema encontrado. Rode "ereemby pull" primeiro.'));
      process.exitCode = 1; return;
    }

    const hashes = getHashes();

    const spinnerFiles = ora(`Buscando arquivo "${fileFilter}"...`).start();
    const { files } = await fetchFiles();
    const file = files.find(f => f.directory === fileFilter);

    if (!file) {
      spinnerFiles.fail(chalk.red(`Arquivo "${fileFilter}" nao encontrado no tema.`));
      console.log(chalk.dim('\nArquivos disponiveis:'));
      files.forEach(f => console.log(chalk.dim(`  ${f.directory}`)));
      process.exitCode = 1; return;
    }

    const data = await fetchFileContent(file.id);
    const content = data.content || '';
    const filePath = join(process.cwd(), file.directory);

    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, 'utf-8');

    hashes[file.directory] = createHash('md5').update(content).digest('hex');
    saveHashes(hashes);

    spinnerFiles.succeed(chalk.green(`Arquivo "${fileFilter}" atualizado!`));
    return;
  }

  // Pull completo — confirmar se ja tem arquivos locais
  if (hasExistingThemeFiles()) {
    console.log(chalk.yellow('\n  Ja existem arquivos do tema nesta pasta.'));
    console.log(chalk.yellow('  O pull vai sobrescrever todos os arquivos locais.\n'));
    const answer = await askConfirmation(chalk.bold('  Digite "confirmar" para continuar: '));
    if (answer !== 'confirmar') {
      console.log(chalk.dim('\nPull cancelado.\n'));
      return;
    }
    console.log('');
  }

  const spinner = ora('Buscando arquivos do tema...').start();

  try {
    const { files } = await fetchFiles();
    spinner.succeed(`${files.length} arquivo(s) encontrado(s).`);

    const spinnerPull = ora('Baixando arquivos...').start();
    let downloaded = 0;
    const hashes = {};

    for (const file of files) {
      const data = await fetchFileContent(file.id);
      const content = data.content || '';
      const filePath = join(process.cwd(), file.directory);

      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, content, 'utf-8');

      hashes[file.directory] = createHash('md5').update(content).digest('hex');

      downloaded++;
      spinnerPull.text = `Baixando arquivos... (${downloaded}/${files.length})`;
    }

    spinnerPull.succeed(chalk.green(`${downloaded} arquivo(s) baixado(s) com sucesso!`));

    saveHashes(hashes);

    console.log(chalk.bold.green('\nPull concluido! Edite os arquivos e use "ereemby push" para enviar.\n'));

  } catch (err) {
    spinner.stop();
    console.log(chalk.red(`Erro: ${err.message}`));
    process.exitCode = 1; return;
  }
}
