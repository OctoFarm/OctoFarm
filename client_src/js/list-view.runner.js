import { setViewType } from "./monitoring/monitoring-view.state";
import { createClientSSEWorker } from "./services/client-worker.service";
import { monitoringSSEventHandler, monitoringWorkerURL } from "./monitoring/monitoring-sse.handler";

const viewType = "list";

setViewType(viewType);
createClientSSEWorker(monitoringWorkerURL, monitoringSSEventHandler);
