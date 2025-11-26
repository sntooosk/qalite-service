import { RouteTable } from './router.js'
import { BrowserstackBuildsController } from './controllers/browserstack-builds-controller.js'
import { TaskSummaryController } from './controllers/task-summary-controller.js'

interface RouteDependencies {
  taskSummaryController: TaskSummaryController
  browserstackBuildsController: BrowserstackBuildsController
}

export const buildRouteTable = ({
  taskSummaryController,
  browserstackBuildsController,
}: RouteDependencies): RouteTable => ({
  '/slack/task-summary': {
    POST: taskSummaryController.handle.bind(taskSummaryController),
  },
  '/browserstack/builds': {
    POST: browserstackBuildsController.handle.bind(browserstackBuildsController),
  },
})
