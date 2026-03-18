import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { loginCommand } from './commands/login.js';
import { pullCommand } from './commands/pull.js';
import { pushCommand } from './commands/push.js';
import { diffCommand } from './commands/diff.js';
import { checkVersion } from './version-check.js';

function cleanLegacyConfig() {
  const legacyPath = join(process.cwd(), '.ereemby.json');
  if (existsSync(legacyPath)) {
    unlinkSync(legacyPath);
  }
}

function showHelp() {
  console.log(chalk.bold.white(`\n${figlet.textSync('Ereemby', { horizontalLayout: 'default' })}`));
  console.log(chalk.dim('  CLI para personalizar seu site Ereemby\n'));

  console.log(chalk.bold.white('  Comandos:\n'));
  console.log(`    ${chalk.cyan('login <token>')}       Autenticar com o token do tema`);
  console.log(`    ${chalk.cyan('pull')}               Baixar todos os arquivos do tema`);
  console.log(`    ${chalk.cyan('pull --file <path>')}  Baixar um arquivo especifico`);
  console.log(`    ${chalk.cyan('push')}               Enviar arquivos alterados para o site`);
  console.log(`    ${chalk.cyan('diff')}               Ver quais arquivos foram alterados`);
  console.log(`    ${chalk.cyan('help')}               Mostrar esta mensagem\n`);

  console.log(chalk.bold.white('  Fluxo de uso:\n'));
  console.log(chalk.dim('    1. ereemby login <token>'));
  console.log(chalk.dim('    2. ereemby pull'));
  console.log(chalk.dim('    3. Edite os arquivos (Liquid, JS, CSS)'));
  console.log(chalk.dim('    4. ereemby diff'));
  console.log(chalk.dim('    5. ereemby push\n'));
}

export function run() {
  const program = new Command();

  program
    .name('ereemby')
    .description('CLI para personalizar seu site Ereemby')
    .version('1.0.0');

  program.hook('preAction', async () => {
    const versionOk = await checkVersion();
    if (!versionOk) process.exit(1);
    cleanLegacyConfig();
  });

  program
    .command('login <token>')
    .description('Autenticar com o token do tema')
    .action(loginCommand);

  program
    .command('pull')
    .description('Baixar arquivos do tema (Liquid, JS, CSS)')
    .option('-f, --file <path>', 'Baixar apenas um arquivo especifico (ex: layout/header.liquid)')
    .action(pullCommand);

  program
    .command('push')
    .description('Enviar apenas arquivos alterados para o site')
    .action(pushCommand);

  program
    .command('diff')
    .description('Ver quais arquivos foram alterados localmente')
    .action(diffCommand);

  program
    .command('help')
    .description('Mostrar ajuda')
    .action(showHelp);

  program.configureHelp({ showGlobalOptions: false });
  program.helpInformation = () => '';
  program.on('--help', showHelp);

  if (process.argv.length <= 2) {
    showHelp();
    return;
  }

  program.parse();
}
