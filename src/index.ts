import { server, requestHandler } from './app/server'
import { serverConfig } from './config/environment'

const { environment } = serverConfig

if (!environment.isProduction) {
  const port = environment.port || 3000
  server.listen(port, () => {
    console.log(`QA Manager proxy listening on http://localhost:${port}`)
  })
}

export default requestHandler
