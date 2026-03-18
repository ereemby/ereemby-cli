import chalk from 'chalk';
import ora from 'ora';
import { createHash } from 'crypto';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fetchFiles, createFile, uploadFile, deleteFile } from '../api.js';
import { getHashes, saveHashes, hasHashes } from '../config.js';

const VALID_DIRS = ['assets', 'components', 'layout', 'pages', 'routes'];
const VALID_EXTENSIONS = ['.liquid', '.js', '.css', '.json'];

function findLocalFiles(baseDir) {
  const found = [];

  for (const dir of VALID_DIRS) {
    const dirPath = join(baseDir, dir);
    if (!existsSync(dirPath)) continue;
    scanDir(dirPath, baseDir, found);
  }

  return found;
}

function scanDir(dirPath, baseDir, found) {
  const entries = readdirSync(dirPath);
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath, baseDir, found);
    } else if (VALID_EXTENSIONS.some(ext => entry.endsWith(ext))) {
      const rel = relative(baseDir, fullPath).replace(/\\/g, '/');
      found.push(rel);
    }
  }
}

export async function pushCommand() {
  if (!hasHashes()) {
    console.log(chalk.red('Nenhum tema encontrado. Rode "ereemby pull" primeiro.'));
    process.exitCode = 1; return;
  }

  const hashes = getHashes();

  const spinner = ora('Buscando lista de arquivos do tema...').start();

  try {
    const { files } = await fetchFiles();
    spinner.succeed(`${files.length} arquivo(s) no tema.`);

    const remoteMap = new Map();
    for (const file of files) {
      remoteMap.set(file.directory, file);
    }

    // Detectar arquivos locais novos (layout e routes nao podem criar)
    const localFiles = findLocalFiles(process.cwd());
    const newFiles = localFiles.filter(f => !remoteMap.has(f) && !f.startsWith('layout/') && !f.startsWith('routes/'));

    let created = 0;
    if (newFiles.length > 0) {
      const spinnerCreate = ora(`Criando ${newFiles.length} arquivo(s) novo(s)...`).start();
      for (const dir of newFiles) {
        spinnerCreate.text = `Criando ${dir}...`;
        const result = await createFile(dir);
        const content = readFileSync(join(process.cwd(), dir), 'utf-8');

        // Se tem conteudo, envia junto
        if (content.trim()) {
          await uploadFile(result.id, content);
        }

        hashes[dir] = createHash('md5').update(content).digest('hex');
        created++;
      }
      spinnerCreate.succeed(chalk.green(`${created} arquivo(s) novo(s) criado(s)!`));
    }

    // Detectar arquivos deletados localmente (layout e routes nao podem deletar)
    const localFileSet = new Set(localFiles);
    const deletedFiles = files.filter(f => !localFileSet.has(f.directory) && !f.directory.startsWith('layout/') && !f.directory.startsWith('routes/'));

    let deleted = 0;
    if (deletedFiles.length > 0) {
      const spinnerDelete = ora(`Removendo ${deletedFiles.length} arquivo(s) deletado(s)...`).start();
      for (const file of deletedFiles) {
        spinnerDelete.text = `Removendo ${file.directory}...`;
        await deleteFile(file.id);
        delete hashes[file.directory];
        deleted++;
      }
      spinnerDelete.succeed(chalk.red(`${deleted} arquivo(s) removido(s) do tema.`));
    }

    // Push dos existentes alterados
    const spinnerPush = ora('Verificando alteracoes...').start();
    let uploaded = 0;
    let unchanged = 0;

    for (const file of files) {
      const localPath = join(process.cwd(), file.directory);

      if (!existsSync(localPath)) {
        continue;
      }

      const content = readFileSync(localPath, 'utf-8');

      // Validar JSON antes de enviar
      if (localPath.endsWith('.json')) {
        try {
          JSON.parse(content);
        } catch {
          spinnerPush.fail(chalk.red(`JSON invalido: ${file.directory}`));
          process.exitCode = 1; return;
        }
      }

      const currentHash = createHash('md5').update(content).digest('hex');
      const originalHash = hashes[file.directory];

      if (originalHash && currentHash === originalHash) {
        unchanged++;
        continue;
      }

      spinnerPush.text = `Enviando ${file.directory}...`;
      await uploadFile(file.id, content);

      hashes[file.directory] = currentHash;
      uploaded++;
    }

    // Salvar hashes atualizados
    saveHashes(hashes);

    if (uploaded === 0 && created === 0 && deleted === 0) {
      spinnerPush.succeed(chalk.dim('Nenhum arquivo alterado.'));
    } else {
      spinnerPush.succeed(chalk.green(`${uploaded} arquivo(s) enviado(s) com sucesso!`));
    }

    if (created > 0) {
      console.log(chalk.cyan(`${created} arquivo(s) novo(s) criado(s) no tema.`));
    }
    if (deleted > 0) {
      console.log(chalk.red(`${deleted} arquivo(s) removido(s) do tema.`));
    }
    if (unchanged > 0) {
      console.log(chalk.dim(`${unchanged} arquivo(s) sem alteracao (ignorados).`));
    }

    console.log(chalk.bold.green('\nPush concluido!\n'));

  } catch (err) {
    spinner.stop();
    console.log(chalk.red(`Erro: ${err.message}`));
    process.exitCode = 1; return;
  }
}
