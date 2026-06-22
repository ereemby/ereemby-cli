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

  // Pull completo — perguntar como proceder se ja tem arquivos locais
  let keepLocal = false;
  if (hasExistingThemeFiles()) {
    console.log(chalk.yellow('\n  Ja existem arquivos do tema nesta pasta.'));
    console.log(chalk.bold.white('\n  Como deseja continuar?\n'));
    console.log(`    ${chalk.cyan('[1] sobrescrever')}  baixar do tema e substituir seus arquivos locais`);
    console.log(`    ${chalk.cyan('[2] manter')}        manter seus arquivos locais e apenas vincular ao tema`);
    console.log(chalk.dim('                      (depois use "ereemby push" para enviar seu codigo)'));
    console.log(chalk.dim('    [Enter] cancelar\n'));

    const answer = await askConfirmation(chalk.bold('  Escolha [1/2]: '));
    if (answer === '1' || answer === 'sobrescrever') {
      keepLocal = false;
    } else if (answer === '2' || answer === 'manter') {
      keepLocal = true;
    } else {
      console.log(chalk.dim('\nPull cancelado.\n'));
      return;
    }
    console.log('');
  }

  const spinner = ora('Buscando arquivos do tema...').start();

  try {
    const { files } = await fetchFiles();
    spinner.succeed(`${files.length} arquivo(s) encontrado(s).`);

    const spinnerPull = ora(keepLocal ? 'Vinculando ao tema...' : 'Baixando arquivos...').start();
    let downloaded = 0;
    let kept = 0;
    const hashes = {};

    for (const file of files) {
      const data = await fetchFileContent(file.id);
      const content = data.content || '';
      const filePath = join(process.cwd(), file.directory);

      // Hash da versao remota — usado pelo push para detectar diferencas com o local
      hashes[file.directory] = createHash('md5').update(content).digest('hex');

      // Modo "manter": nao sobrescreve arquivos que ja existem localmente
      if (keepLocal && existsSync(filePath)) {
        kept++;
        spinnerPull.text = `Vinculando ao tema... (${downloaded + kept}/${files.length})`;
        continue;
      }

      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, content, 'utf-8');

      downloaded++;
      spinnerPull.text = keepLocal
        ? `Vinculando ao tema... (${downloaded + kept}/${files.length})`
        : `Baixando arquivos... (${downloaded}/${files.length})`;
    }

    saveHashes(hashes);

    if (keepLocal) {
      spinnerPull.succeed(chalk.green(`Vinculado ao tema! ${kept} arquivo(s) local(is) mantido(s), ${downloaded} baixado(s).`));
      console.log(chalk.bold.green('\nSeus arquivos locais foram preservados. Use "ereemby push" para enviar seu codigo ao tema.\n'));
    } else {
      spinnerPull.succeed(chalk.green(`${downloaded} arquivo(s) baixado(s) com sucesso!`));
      console.log(chalk.bold.green('\nPull concluido! Edite os arquivos e use "ereemby push" para enviar.\n'));
    }

  } catch (err) {
    spinner.stop();
    console.log(chalk.red(`Erro: ${err.message}`));
    process.exitCode = 1; return;
  }
}
