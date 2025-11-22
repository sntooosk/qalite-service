import { config } from '../../config.js'

export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'QaLite-Servidor API',
    version: '2.1.0',
    description:
      'API minimalista que recebe resumos de execução de QA e notificações de automação para o QaLite-Servidor.',
  },
  servers: [
    {
      url: `http://localhost:${config.port}`,
      description: 'Ambiente local',
    },
  ],
  paths: {
    '/slack/task-summary': {
      post: {
        summary: 'Enviar resumo de QA para o Slack',
        description:
          'Aceita um resumo estruturado ou uma mensagem pronta e encaminha para o webhook do Slack informado no payload.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/TaskSummaryPayload' },
                  {
                    type: 'object',
                    required: ['message', 'webhookUrl'],
                    properties: {
                      message: {
                        type: 'string',
                        description: 'Mensagem já formatada para o Slack.',
                        example: 'Deploy concluído com sucesso.',
                      },
                      webhookUrl: {
                        type: 'string',
                        format: 'uri',
                        description: 'Webhook do Slack que receberá a mensagem.',
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Mensagem enviada ao Slack.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Slack task summary sent.' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Erro de validação, payload inválido ou webhook ausente.',
          },
        },
      },
    },
    '/browserstack/builds': {
      post: {
        summary: 'Listar builds da BrowserStack',
        description: 'Consulta as builds do BrowserStack Automate usando as credenciais fornecidas no payload.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BrowserstackCredentials' },
            },
          },
        },
        responses: {
          200: {
            description: 'Lista de builds retornadas pela BrowserStack.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    builds: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/BrowserstackBuild' },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Credenciais ausentes ou inválidas.' },
          401: { description: 'BrowserStack recusou as credenciais fornecidas.' },
          502: { description: 'Erro ao consultar a API da BrowserStack.' },
        },
      },
    },
  },
  components: {
    schemas: {
      TaskSummaryPayload: {
        type: 'object',
        required: ['environmentSummary', 'webhookUrl'],
        properties: {
          message: {
            type: 'string',
            description:
              'Mensagem enviada diretamente ao Slack (ignorando o resumo detalhado).',
          },
          webhookUrl: {
            type: 'string',
            format: 'uri',
            description: 'Webhook do Slack que receberá a mensagem.',
          },
          environmentSummary: { $ref: '#/components/schemas/EnvironmentSummaryPayload' },
        },
      },
      EnvironmentSummaryPayload: {
        type: 'object',
        properties: {
          identifier: { type: 'string', description: 'Nome ou id do ambiente testado.' },
          totalTime: {
            type: 'string',
            description: 'Tempo total em texto.',
            example: '00:15:30',
          },
          totalTimeMs: {
            type: 'integer',
            format: 'int64',
            description: 'Tempo total em milissegundos.',
          },
          scenariosCount: { type: 'integer', minimum: 0, example: 10 },
          executedScenariosCount: { type: 'integer', minimum: 0, example: 10 },
          executedScenariosMessage: {
            type: 'string',
            description: 'Mensagem pronta sobre cenários executados.',
          },
          fix: {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['bug', 'storyfixes'] },
              value: { type: 'integer', minimum: 0 },
            },
          },
          jira: { type: 'string', description: 'Chave do Jira relacionada à execução.' },
          suiteName: { type: 'string', description: 'Nome da suíte executada.' },
          suiteDetails: {
            type: 'string',
            description: 'Detalhes adicionais sobre a suíte.',
          },
          participantsCount: { type: 'integer', minimum: 0 },
          monitoredUrls: {
            type: 'array',
            items: { type: 'string', format: 'uri' },
          },
          attendees: {
            type: 'array',
            items: {
              oneOf: [
                { $ref: '#/components/schemas/EnvironmentSummaryAttendee' },
                { type: 'string', description: 'Nome ou email simples.' },
              ],
            },
          },
        },
      },
      EnvironmentSummaryAttendee: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string', format: 'email' },
        },
      },
      BrowserstackCredentials: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', description: 'Username do BrowserStack Automate.' },
          password: { type: 'string', description: 'Password ou Access Key do BrowserStack.' },
        },
      },
      BrowserstackBuild: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'Identificador hash da build no BrowserStack.' },
          name: { type: 'string', description: 'Nome da build.' },
          status: { type: 'string', description: 'Status atual reportado pela BrowserStack.' },
          duration: { type: 'integer', format: 'int64', description: 'Duração em segundos.' },
          buildTag: { type: 'string', description: 'Tag configurada para a build.' },
          publicUrl: { type: 'string', format: 'uri', description: 'URL pública da build, se disponível.' },
          devices: { type: 'array', items: { type: 'object' }, description: 'Dispositivos associados à build.' },
          createdAt: { type: 'string', format: 'date-time', description: 'Data de criação da build.' },
          startedAt: { type: 'string', format: 'date-time', description: 'Data de início da build.' },
        },
      },
    },
  },
} as const
