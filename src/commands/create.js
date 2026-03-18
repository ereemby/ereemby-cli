import chalk from 'chalk';
import ora from 'ora';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { createFile } from '../api.js';

const VALID_PREFIXES = ['assets/', 'components/', 'pages/'];
const VALID_EXTENSIONS = {
  'assets/': ['.js', '.css'],
  'components/': ['.liquid'],
  'pages/': ['.liquid'],
};

export async function createCommand(directory) {
  if (!directory) {
    console.log(chalk.red('Informe o caminho do arquivo. Uso: ereemby create <directory>'));
    console.log(chalk.dim('\nExemplos:'));
    console.log(chalk.dim('  ereemby create pages/contato.liquid'));
    console.log(chalk.dim('  ereemby create assets/custom.js'));
    console.log(chalk.dim('  ereemby create components/banner.liquid'));
    process.exitCode = 1; return;
  }

  // Validar prefixo
  const validPrefix = VALID_PREFIXES.find(p => directory.startsWith(p));
  if (!validPrefix) {
    console.log(chalk.red(`Caminho invalido. Deve comecar com: ${VALID_PREFIXES.join(', ')}`));
    process.exitCode = 1; return;
  }

  // Validar extensao
  const allowedExts = VALID_EXTENSIONS[validPrefix];
  const hasValidExt = allowedExts.some(ext => directory.endsWith(ext));
  if (!hasValidExt) {
    console.log(chalk.red(`Extensao invalida para "${validPrefix}". Permitidas: ${allowedExts.join(', ')}`));
    process.exitCode = 1; return;
  }

  const spinner = ora(`Criando ${directory}...`).start();

  try {
    await createFile(directory);
    spinner.succeed(chalk.green(`Arquivo "${directory}" criado no tema!`));

    // Criar o arquivo localmente tambem
    const localPath = join(process.cwd(), directory);
    mkdirSync(dirname(localPath), { recursive: true });
    if (!existsSync(localPath)) {
      writeFileSync(localPath, '', 'utf-8');
    }

    console.log(chalk.dim(`\nArquivo local criado: ${directory}`));
    console.log(chalk.dim('Edite o arquivo e use "ereemby push" para enviar.\n'));

  } catch (err) {
    spinner.fail(chalk.red(`Erro: ${err.message}`));
    process.exitCode = 1; return;
  }
}
