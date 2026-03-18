import chalk from 'chalk';
import ora from 'ora';
import { saveConfig } from '../config.js';
import { fetchFiles } from '../api.js';

export async function loginCommand(token) {
  if (!token) {
    console.log(chalk.red('Informe o token. Uso: ereemby login <token>'));
    process.exitCode = 1; return;
  }

  saveConfig({ token });

  const spinner = ora('Verificando token...').start();

  try {
    await fetchFiles();
    spinner.stop();
    console.log(chalk.green('\n✔ Autenticado com sucesso!\n'));
  } catch (err) {
    spinner.fail(chalk.red('Token invalido ou expirado.'));
    process.exitCode = 1; return;
  }
}
