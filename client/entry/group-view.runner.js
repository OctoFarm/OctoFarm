import { createClientSSEWorker } from '../js/services/client-worker.service';
import { setViewType } from '../js/pages/monitoring/monitoring-view.state';
import {
  monitoringSSEventHandler,
  monitoringWorkerURL,
} from '../js/pages/monitoring/monitoring-sse.handler';

const viewType = 'group';

setViewType(viewType);
createClientSSEWorker(monitoringWorkerURL, monitoringSSEventHandler);
