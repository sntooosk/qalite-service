import { config } from './config'
import { requestHandler, server } from './server'

if (!config.isProduction) {
  server.listen(config.port, () => {
    console.log(`QA Manager proxy listening on http://localhost:${config.port}`)
  })
}

export default requestHandler
