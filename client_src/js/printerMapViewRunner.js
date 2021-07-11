import createWebWorker from "./lib/modules/viewUpdaterPrinterMap.js";
import { setViewType } from "./monitoring/monitoring-view.state";

setViewType("map");

createWebWorker("panel");
