import { setViewType } from '../js/pages/monitoring/monitoring-view.state';
import { createClientSSEWorker } from '../js/services/client-worker.service';
import {
  monitoringSSEventHandler,
  monitoringWorkerURL,
} from '../js/pages/monitoring/monitoring-sse.handler';

const viewType = 'combined';

setViewType(viewType);
createClientSSEWorker(monitoringWorkerURL, monitoringSSEventHandler);
