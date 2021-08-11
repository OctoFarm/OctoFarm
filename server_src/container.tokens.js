const DITokens = {
  printerService: "printerService",
  printerGroupService: "printerGroupService",
  farmStatisticsService: "farmStatisticsService",
  serverSettingsService: "serverSettingsService",
  octofarmUpdateService: "octofarmUpdateService",
  octoPrintApiClientService: "octoPrintApiClientService",
  filamentManagerPluginService: "filamentManagerPluginService",
  influxDbSetupService: "influxDbSetupService",
  influxDbFilamentService: "influxDbFilamentService",
  influxDbHistoryService: "influxDbHistoryService",
  influxDbPrinterStateService: "InfluxDbPrinterStateService",
  taskManagerService: "taskManagerService",
  printerFilesService: "printerFilesService",
  scriptCheckService: "scriptCheckService",
  autoDiscoveryService: "autoDiscoveryService",
  historyService: "historyService",
  // Stores/states
  settingsStore: "settingsStore",
  printersStore: "printersStore",
  systemInfoStore: "systemInfoStore",
  filesStore: "filesStore",
  printerStateFactory: "printerStateFactory",
  printerState: "printerState",
  // Caches
  sortingFilteringCache: "sortingFilteringCache",
  heatMapCache: "heatMapCache",
  connectionLogsCache: "connectionLogsCache",
  jobsCache: "jobsCache",
  dashboardStatisticsCache: "dashboardCache",
  currentOperationsCache: "currentOperationsCache",
  fileCache: "fileCache",
  historyCache: "historyCache",
  filamentCache: "filamentCache",
  // Tasks
  printerSystemTask: "printerSystemTask",
  printerSseTask: "printerSseTask",
  dashboardSseTask: "dashboardSseTask",
  monitoringSseTask: "monitoringSseTask",
  systemCommandsService: "systemCommandsService"
};

module.exports = DITokens;
