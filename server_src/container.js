const awilix = require("awilix");
const axios = require("axios");
const DITokens = require("./container.tokens");
const PrinterService = require("./services/printer.service");
const PrinterGroupService = require("./services/printer-group.service");
const PrintersStore = require("./state/printers.store");
const SettingsStore = require("./state/settings.store");
const ServerSettingsService = require("./services/server-settings.service");
const ClientSettingsService = require("./services/client-settings.service");
const OctofarmUpdateService = require("./services/octofarm-update.service");
const InfluxDbSetupService = require("./services/influx/influx-db-setup.service");
const ScriptService = require("./services/script.service");
const TaskManagerService = require("./services/task-manager.service");
const SystemInfoStore = require("./state/system-info.store");
const SystemCommandsService = require("./services/system-commands.service");
const ServerLogsService = require("./services/server-logs.service");
const SystemInfoBundleService = require("./services/system-info-bundle.service");
const GithubClientService = require("./services/github-client.service");
const HistoryService = require("./services/history.service");
const FarmStatisticsService = require("./services/farm-statistics.service");
const FileCache = require("./state/data/file.cache");
const HistoryCache = require("./state/data/history.cache");
const JobsCache = require("./state/data/jobs.cache");
const UserTokenService = require("./services/authentication/user-token.service");
const ServerSentEventsHandler = require("./handlers/sse.handler");
const PrinterFilesTask = require("./tasks/printer-files.task");
const PrinterTickerStore = require("./state/printer-ticker.store");
const PrinterWebsocketTask = require("./tasks/printer-websocket.task");
const PrinterSseTask = require("./tasks/printer-sse.task");
const MonitoringSseTask = require("./tasks/monitoring-sse.task");
const SortingFilteringCache = require("./state/data/sorting-filtering.cache");
const DashboardSseTask = require("./tasks/dashboard-sse.task");
const CurrentOperationsCache = require("./state/data/current-operations.cache");
const PrinterSystemTask = require("./tasks/printer-system.task");
const OctoPrintApiService = require("./services/octoprint/octoprint-api.service");
const FilamentManagerPluginService = require("./services/octoprint/filament-manager-plugin.service");
const FilamentCache = require("./state/data/filament.cache");
const PrinterState = require("./state/printer.state");
const PrinterStateFactory = require("./state/printer-state.factory");
const FilesStore = require("./state/files.store");
const FilamentStore = require("./state/filament.store");
const HeatMapCache = require("./state/data/heatmap.cache");
const InfluxDbHistoryService = require("./services/influx/influx-db-history.service");
const InfluxDbFilamentService = require("./services/influx/influx-db-filament.service");
const InfluxDbPrinterStateService = require("./services/influx/influx-db-printer-state.service");
const { configureEventEmitter } = require("./handlers/event-emitter");
const { AppConstants } = require("./app.constants");
const PrinterFilesService = require("./services/printer-files.service");
const SoftwareUpdateTask = require("./tasks/software-update.task");
const AutoDiscoveryService = require("./services/auto-discovery.service");
const ConnectionLogsCache = require("./state/data/connection-logs.cache");
const DashboardStatisticsCache = require("./state/data/dashboard-statistics.cache");
const AlertService = require("./services/alert.service");

function configureContainer() {
  // Create the container and set the injectionMode to PROXY (which is also the default).
  const container = awilix.createContainer({
    injectionMode: awilix.InjectionMode.PROXY
  });

  container.register({
    // -- asValue --
    // Here we are telling awilix that the dependency is a value, pretty neat way to solidify data
    serverVersion: awilix.asValue(
      process.env[AppConstants.VERSION_KEY] || AppConstants.defaultOctoFarmPageTitle
    ),
    appConstants: awilix.asClass(AppConstants).singleton(),
    octoFarmPageTitle: awilix.asValue(process.env[AppConstants.OCTOFARM_SITE_TITLE_KEY]),

    // -- asFunction --
    // Resolve dependencies by calling a function (synchronous or asynchronous)
    // Use cases: factories, or dynamic configuration from external sources
    //
    // Factory:
    // We tell awilix that this will create "something" during runtime in this case it will create instances of PrinterState
    // A name tells a lot (PrinterStateFactory => PrinterState)
    // The resulting instances are not globally available per se. That's up to us.
    // We just need something to manage it afterwards, otherwise we might lose reference to it.
    // In this case we save it to PrintersStore:
    // TL;DR we can dynamically create injectable dependencies just fine using awilix.
    [DITokens.printerStateFactory]: awilix.asFunction(PrinterStateFactory).transient(), // Factory function, transient on purpose!

    // -- asClass --
    // Below we are telling Awilix how to resolve a dependency class:
    // This means "constructing on demand", so during code runtime. THIS HAS A RISK you need to be aware of.
    // When a dependency is not known this causes an awilix Resolution Error. Testing this is easy peasy though.
    // A good way is validating some at startup by hand or automatically (increasing boot time uselessly).
    // Or trust you did the right thing. All options are fine.
    //
    // Register a class by instantiating a class using asClass and caching it with .singleton()
    // Other flavours are: .transient() (default, volatile instance) and .scoped() (conditionally volatile)
    // scoping is usually done for request API middleware to ensure f.e. that current user is set or group/tenant/roles/etc
    // Therefore scoping can influence how many requests per sec the API can handle... in case you're interested to know.
    [DITokens.settingsStore]: awilix.asClass(SettingsStore).singleton(),
    [DITokens.serverSettingsService]: awilix.asClass(ServerSettingsService),
    clientSettingsService: awilix.asClass(ClientSettingsService),
    userTokenService: awilix.asClass(UserTokenService).singleton(),

    taskManagerService: awilix.asClass(TaskManagerService).singleton(),
    eventEmitter2: awilix.asFunction(configureEventEmitter).singleton(),
    [DITokens.octofarmUpdateService]: awilix.asClass(OctofarmUpdateService).singleton(),
    [DITokens.systemInfoStore]: awilix.asClass(SystemInfoStore).singleton(),
    githubClientService: awilix.asClass(GithubClientService),
    [DITokens.autoDiscoveryService]: awilix.asClass(AutoDiscoveryService),
    [DITokens.systemCommandsService]: awilix.asClass(SystemCommandsService),
    serverLogsService: awilix.asClass(ServerLogsService),
    systemInfoBundleService: awilix.asClass(SystemInfoBundleService),
    [DITokens.httpClient]: awilix.asValue(axios),

    [DITokens.printerService]: awilix.asClass(PrinterService),
    [DITokens.printerFilesService]: awilix.asClass(PrinterFilesService),
    [DITokens.printerGroupService]: awilix.asClass(PrinterGroupService),
    [DITokens.octoPrintApiService]: awilix.asClass(OctoPrintApiService).singleton(),
    [DITokens.filamentManagerPluginService]: awilix.asClass(FilamentManagerPluginService),
    [DITokens.historyService]: awilix.asClass(HistoryService),
    [DITokens.farmStatisticsService]: awilix.asClass(FarmStatisticsService),
    [DITokens.dashboardStatisticsCache]: awilix.asClass(DashboardStatisticsCache),
    [DITokens.filamentCache]: awilix.asClass(FilamentCache).singleton(),
    [DITokens.sortingFilteringCache]: awilix.asClass(SortingFilteringCache).singleton(),
    [DITokens.currentOperationsCache]: awilix.asClass(CurrentOperationsCache).singleton(),
    [DITokens.printerState]: awilix.asClass(PrinterState).transient(), // Transient on purpose!
    [DITokens.historyCache]: awilix.asClass(HistoryCache).singleton(),
    [DITokens.jobsCache]: awilix.asClass(JobsCache).singleton(),
    [DITokens.heatMapCache]: awilix.asClass(HeatMapCache).singleton(),
    [DITokens.connectionLogsCache]: awilix.asClass(ConnectionLogsCache).singleton(),
    printerTickerStore: awilix.asClass(PrinterTickerStore).singleton(),
    [DITokens.fileCache]: awilix.asClass(FileCache).singleton(),
    filamentStore: awilix.asClass(FilamentStore), // No need for singleton as its now based on filamentCache
    [DITokens.filesStore]: awilix.asClass(FilesStore).singleton(),
    [DITokens.printersStore]: awilix.asClass(PrintersStore).singleton(),

    // Extensibility and export
    [DITokens.alertService]: awilix.asClass(AlertService),
    [DITokens.scriptService]: awilix.asClass(ScriptService),
    [DITokens.influxDbSetupService]: awilix.asClass(InfluxDbSetupService).singleton(),
    [DITokens.influxDbFilamentService]: awilix.asClass(InfluxDbFilamentService),
    [DITokens.influxDbHistoryService]: awilix.asClass(InfluxDbHistoryService),
    [DITokens.influxDbPrinterStateService]: awilix.asClass(InfluxDbPrinterStateService),

    softwareUpdateTask: awilix.asClass(SoftwareUpdateTask),
    // Provided SSE handlers (couplers) shared with controllers
    printerViewSSEHandler: awilix.asClass(ServerSentEventsHandler).singleton(),
    monitoringViewSSEHandler: awilix.asClass(ServerSentEventsHandler).singleton(),
    dashboardViewSSEHandler: awilix.asClass(ServerSentEventsHandler).singleton(),
    // Task bound to send on SSE Handler
    [DITokens.printerSseTask]: awilix.asClass(PrinterSseTask).singleton(),
    [DITokens.monitoringSseTask]: awilix.asClass(MonitoringSseTask).singleton(),
    [DITokens.dashboardSseTask]: awilix.asClass(DashboardSseTask).singleton(),
    // Normal post-analysis operations (previously called cleaners)
    printerFilesTask: awilix.asClass(PrinterFilesTask).singleton(),
    // This task is a quick task (~100ms per printer)
    printerWebsocketTask: awilix.asClass(PrinterWebsocketTask).singleton(),
    // Task dependent on WS to fire - disabled at boot
    [DITokens.printerSystemTask]: awilix.asClass(PrinterSystemTask).singleton()
  });

  return container;
}

module.exports = {
  configureContainer
};
