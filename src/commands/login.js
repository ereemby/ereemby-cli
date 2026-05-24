import chalk from 'chalk';
import ora from 'ora';
import { saveToken } from '../config.js';
import { validateToken } from '../api.js';

export async function loginCommand(token) {
  if (!token) {
    console.log(chalk.red('Informe o token. Uso: ereemby login <token>'));
    process.exitCode = 1; return;
  }

  const spinner = ora('Verificando token...').start();

  try {
    const data = await validateToken(token);
    spinner.stop();

    saveToken(token);

    const storeName = data.store?.name || data.store || data.storeName || data.name || null;

    console.log(chalk.green('\n✔ Autenticado com sucesso!'));
    if (storeName) {
      console.log(chalk.cyan(`  Loja: ${storeName}`));
    }
    console.log('');
  } catch (err) {
    spinner.fail(chalk.red('Token invalido ou expirado.'));
    process.exitCode = 1; return;
  }
}
