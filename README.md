# QA Manager Proxy API

Serviço HTTP minimalista escrito em TypeScript e organizado com princípios de Clean Architecture.
Ele atua como um proxy seguro entre o QA Manager, o BrowserStack e os webhooks do Slack.

## Rotas expostas

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Verifica se o serviço está disponível. |
| `GET` | `/browserstack/builds` | Lista os builds do BrowserStack Automate. |
| `POST` | `/slack/task-summary` | Envia um resumo de tarefa concluída para o Slack. |

## Configuração

1. Crie um arquivo `.env` com as variáveis necessárias:

```
BROWSERSTACK_USERNAME=seu_usuario
BROWSERSTACK_ACCESS_KEY=sua_chave
SLACK_TASK_SUMMARY_WEBHOOK_URL=https://hooks.slack.com/services/...
ALLOWED_ORIGINS=http://localhost:5173,https://seu-frontend.com
PORT=3000
```

2. Execute os comandos padrão do projeto:

```bash
npm run build    # transpila para JavaScript (pasta dist)
npm start        # executa o build gerado em modo local
npm run dev      # recompila continuamente para desenvolvimento
npm run lint     # roda o type-check + ESLint sobre o build gerado
npm run format   # formata o código com Prettier
```

> **Observação:** em ambientes onde a instalação de pacotes via `npm install` estiver bloqueada,
é possível utilizar as versões globais de `node`, `tsc`, `eslint` e `prettier`.
O `package.json` mantém as dependências necessárias para ambientes com acesso liberado.

## Husky e commit lint

O repositório já possui os ganchos em `.husky/`:

- `pre-commit` → executa `npm run lint`.
- `commit-msg` → valida a mensagem com o script `scripts/check-commit-message.mjs`.

Após instalar as dependências (quando possível) execute `npm run prepare` para que o Husky
configure automaticamente os hooks locais. Caso não seja possível, defina manualmente o hooksPath:

```bash
git config core.hooksPath .husky
```

## Deploy na Vercel

O arquivo `vercel.json` direciona todas as requisições para `dist/index.js`.
Basta executar `npm run build` antes do deploy para garantir que o handler esteja atualizado.
