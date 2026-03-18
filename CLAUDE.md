# Ereemby CLI

CLI para personalizar temas de sites Ereemby — pull/push de codigo Liquid, JS e CSS.

## Arquitetura

- **ESM** (`"type": "module"`) — usar `import/export`, nunca `require`
- **Node >= 18** — usa `fetch` nativo, sem dependencia HTTP externa
- Entry point: `bin/index.js` → `src/cli.js` (Commander)
- Config global: `~/.ereemby/config.json` (token + baseUrl)
- Config local do tema: `.ereemby.json` (hashes MD5 dos arquivos)
- API base: `https://api.ereemby.app`

## Comandos

| Comando | Arquivo | Descricao |
|---|---|---|
| `login <token>` | `src/commands/login.js` | Salva token e valida com a API |
| `pull` | `src/commands/pull.js` | Baixa todos os arquivos do tema |
| `pull --file <path>` | `src/commands/pull.js` | Baixa arquivo especifico |
| `push` | `src/commands/push.js` | Envia alterados, cria novos, deleta removidos |
| `diff` | `src/commands/diff.js` | Mostra arquivos modificados/ausentes |
| `create <dir>` | `src/commands/create.js` | Cria arquivo no tema e localmente |

## Pastas e extensoes validas do tema

```
assets/       → .js, .css        (criar, editar, deletar)
components/   → .liquid           (criar, editar, deletar)
layout/       → .liquid           (APENAS editar — nunca criar ou deletar)
pages/        → .liquid           (criar, editar, deletar)
```

Definido em `src/commands/push.js` (VALID_DIRS, VALID_EXTENSIONS) e `src/commands/create.js` (VALID_PREFIXES, VALID_EXTENSIONS).

## Dependencias

- `commander` — parser de CLI
- `chalk` — cores no terminal
- `ora` — spinners
- `figlet` — banner ASCII

## Convencoes

- Sem TypeScript, sem testes — codigo JS puro
- Mensagens de erro/log em portugues
- `process.exitCode = 1; return;` para erros (nunca `process.exit()`)
- Autenticacao via header `x-theme-token`
- Hashes MD5 para detectar alteracoes locais

## Testar localmente

```bash
node bin/index.js --help
node bin/index.js login <token>
node bin/index.js pull
node bin/index.js push
```
