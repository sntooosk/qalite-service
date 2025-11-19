# QA Manager Proxy API

Servidor HTTP minimalista escrito em TypeScript que atua como ponte entre o QA Manager
e o Slack. O código foi reduzido a poucos arquivos para facilitar a leitura e a
manutenção sem depender de frameworks externos.

## Rotas

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Retorna `status: ok` para verificação rápida. |
| `POST` | `/slack/task-summary` | Envia um resumo simples de tarefa para um webhook do Slack. |

## Variáveis de ambiente

Crie um arquivo `.env` (opcional) com os dados abaixo:

```
SLACK_TASK_SUMMARY_WEBHOOK_URL=https://hooks.slack.com/services/...
ALLOWED_ORIGINS=http://localhost:5173,https://seu-frontend.com
PORT=3000
```

## Scripts disponíveis

```bash
npm run build   # Transpila os arquivos TypeScript para a pasta dist
npm start       # Executa o build gerado
npm run dev     # Observa mudanças e recompila automaticamente
npm run lint    # Garante que o código JavaScript emitido esteja padronizado
npm run format  # Formata o código fonte com Prettier
```

> Dica: execute `npm run build` antes de `npm start` ou do deploy na Vercel, já que o
> handler publicado fica em `dist/index.js`.

## Husky e commit lint

Os hooks estão configurados em `.husky/`. Após instalar as dependências rode `npm run prepare`
para ativá-los. O hook `commit-msg` agora utiliza o Commitlint com a configuração convencional:

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
}
```

Caso precise ativar manualmente, use `git config core.hooksPath .husky`.
