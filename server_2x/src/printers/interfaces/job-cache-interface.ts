import { JobStatisticsModel } from "../models/job-cache-item.model";

export interface IJobCache {
  generate: (printer: any, filament: any) => JobStatisticsModel;
}
