import { setViewType } from "./pages/monitoring/monitoring-view.state";
import { createClientSSEWorker } from "./services/client-worker.service";
import {
  monitoringSSEventHandler,
  monitoringWorkerURL,
} from "./pages/monitoring/monitoring-sse.handler";

const viewType = "camera";

setViewType(viewType);
createClientSSEWorker(monitoringWorkerURL, monitoringSSEventHandler);
