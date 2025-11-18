import express from 'express'
import cors from 'cors'

import { serverConfig } from './config.js'
import browserstackRouter from './browserstack/router.js'
import slackRouter from './slack/router.js'

const app = express()

const { allowedOrigins, environment } = serverConfig

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('CORS origin not allowed'))
    },
  }),
)

app.use(express.json())

app.get('/health', (request, response) => {
  response.json({ status: 'ok' })
})

app.use('/browserstack', browserstackRouter)
app.use('/slack', slackRouter)

app.use((error, request, response, next) => {
  if (response.headersSent) {
    next(error)
    return
  }

  const status = error.status || 500
  const message = error.message || 'Internal server error'
  response.status(status).json({ error: message })
})

if (!environment.isProduction) {
  const port = environment.port || 3000
  app.listen(port, () => {
    console.log(`QA Manager proxy listening on http://localhost:${port}`)
  })
}

export default app
