# QaLite-Servidor API

Servidor HTTP minimalista em TypeScript que atua como proxy para dois fluxos principais do ecossistema QaLite:

- Envio de mensagens formatadas para um webhook do Slack.
- Listagem das execuções (builds) mais recentes na BrowserStack usando credenciais fornecidas na requisição.

O código é organizado em camadas explícitas (configuração, aplicação, domínio, infraestrutura e interfaces) sem dependência de frameworks web.

## Endpoints

| Método | Rota                  | Descrição                                                                 |
| ------ | --------------------- | ------------------------------------------------------------------------- |
| `POST` | `/slack/task-summary` | Recebe um resumo de QA ou mensagem livre e repassa para o webhook do Slack. |
| `POST` | `/browserstack/builds` | Retorna a lista de builds da BrowserStack informando usuário e access key. |

> Não há persistência local ou interface visual: cada requisição é tratada de forma stateless e retorna JSON.

### Payloads

#### Enviar resumo ou mensagem para Slack (`POST /slack/task-summary`)

- `webhookUrl` é obrigatório para todas as chamadas.
- Se `message` estiver presente, ele é enviado diretamente; caso contrário, `environmentSummary` é formatado antes do envio.

```json
{
  "webhookUrl": "https://hooks.slack.com/services/XXX/YYY/ZZZ",
  "message": "Mensagem livre para o canal",
  "environmentSummary": {
    "identifier": "Suite regressiva",
    "totalTime": "12m 30s",
    "executedScenariosCount": 25,
    "participantsCount": 3
  }
}
```

#### Listar builds na BrowserStack (`POST /browserstack/builds`)

- `username` e `accessKey` (ou o legado `acessKey`) são obrigatórios.
- Retorna uma lista com `id`, `name`, `status`, `duration`, `buildTag` e `publicUrl` por build.

```json
{
  "username": "seu-usuario",
  "accessKey": "sua-chave"
}
```

## Variáveis de ambiente

Crie um arquivo `.env` (opcional) com os valores abaixo:

```bash
ALLOWED_ORIGINS=http://localhost:5173,https://seu-frontend.com
PORT=3000
```

- Se nenhuma origem for informada, o CORS permite por padrão `http://localhost:5173` e `https://qualitydigital-qamanager.vercel.app`.
- O webhook do Slack **não** é lido via `.env`; ele deve ser enviado no campo `webhookUrl` do corpo da requisição.

## Como executar

```bash
npm install
npm run build   # Transpila TypeScript para dist/
npm start       # Executa o servidor já compilado
# ou
npm run dev     # Assiste alterações e recompila automaticamente
```

## Qualidade e formatação

```bash
npm run lint    # Lembre de rodar o build antes para gerar dist/
npm run format  # Formata todo o código com Prettier
```

## Estrutura de pastas

- `src/config.ts`: leitura de variáveis de ambiente e defaults de CORS/porta.
- `src/application`: casos de uso e portas (ex.: `SendTaskSummaryUseCase`).
- `src/domain`: contratos e formatação de mensagens enviadas ao Slack.
- `src/infrastructure`: integrações concretas (ex.: webhook do Slack, API BrowserStack).
- `src/interfaces/http`: roteador HTTP, CORS e handlers das rotas expostas.

## Husky e commit lint

Os hooks vivem em `.husky/`. Após instalar dependências, rode `npm run prepare` para ativá-los. O hook `commit-msg` usa o Commitlint com a configuração convencional:

```js
module.exports = {
  extends: ['@commitlint/config-conventional'],
}
```

Caso precise ativar manualmente, use `git config core.hooksPath .husky`.
