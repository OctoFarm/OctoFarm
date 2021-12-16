import { createClientSSEWorker } from "./services/client-worker.service";
import { setViewType } from "./pages/monitoring/monitoring-view.state";
import {
  monitoringSSEventHandler,
  monitoringWorkerURL
} from "./pages/monitoring/monitoring-sse.handler";

const viewType = "panel";

setViewType(viewType);
createClientSSEWorker(monitoringWorkerURL, monitoringSSEventHandler);
