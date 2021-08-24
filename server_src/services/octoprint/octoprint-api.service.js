const fs = require("fs");
const request = require("request");
const { OPClientErrors } = require("./constants/octoprint-service.constants");
const { checkPluginManagerAPIDeprecation } = require("../../utils/compatibility.utils");
const Logger = require("../../handlers/logger.js");
const { prepareRequest } = require("./utils/api.utils");

const octoPrintBase = "/";
const apiBase = octoPrintBase + "api";
const apiSettingsPart = apiBase + "/settings";
const apiFile = (path) => apiBase + "/files/local/" + path;
const apiFiles = (recursive = true) => apiBase + "/files?recursive=" + recursive;
const apiConnection = apiBase + "/connection";
const apiPrinterProfiles = apiBase + "/printerprofiles";
const apiSystem = apiBase + "/system";
const apiSystemInfo = apiSystem + "/info";
const apiSystemCommands = apiSystem + "/commands";
const apiUsers = apiBase + "/users";
const apiLogin = apiBase + "/login?passive=true";

const apiPluginManager = apiBase + "/plugin/pluginmanager";
const apiPluginManagerRepository1_6_0 = octoPrintBase + "plugin/pluginmanager/repository";
const apiSoftwareUpdateCheck = (force) =>
  octoPrintBase + "plugin/softwareupdate/check" + (force ? "?force=true" : "");
const apiPluginPiSupport = apiBase + "/plugin/pi_support";
const apiPluginFilamentManagerSpools = apiBase + "/plugin/filamentmanager/spools";
const apiPluginFilamentManagerProfiles = apiBase + "/plugin/filamentmanager/profiles";
const apiTimelapse = apiBase + "/timelapse";

class OctoprintApiService {
  #settingsStore;
  #httpClient;
  #timeouts; // apiTimeout, apiRetry, apiRetryCutoff (and webSocketRetry)
  #defaultTimeout = 1000;

  #logger = new Logger("OctoPrint-API-Service");

  constructor({ settingsStore, httpClient }) {
    this.#settingsStore = settingsStore;
    this.#httpClient = httpClient;
  }

  #ensureTimeoutSettingsLoaded() {
    if (!this.#timeouts) {
      const serverSettings = this.#settingsStore.getServerSettings();
      this.#timeouts = { ...serverSettings.timeout };
    }

    if (!this.#timeouts) {
      throw new Error(
        "OctoPrint API Service could not load timeout settings. settingsStore:ServerSettings:timeout didnt return anything"
      );
    }
  }

  async login(printer) {
    const { url, options } = prepareRequest(printer, apiLogin);

    return this.#httpClient.post(url, {}, options);
  }

  async getSettings(printer) {
    const { url, options } = prepareRequest(printer, apiSettingsPart);

    return this.#httpClient.get(url, options);
  }

  async getAdminUserOrDefault(printer) {
    const response = await this.getUsers(printer, true);
    // TODO
    if (response.status != 200) throw "Didnt get 200 response";

    const data = await response.json();
    let opAdminUserName = "admin";
    if (!!data?.users && Array.isArray(data)) {
      const adminUser = data.users.find((user) => !!user.admin);
      if (!adminUser) opAdminUserName = adminUser.name;
    }

    return opAdminUserName;
  }

  async getUsers(printer) {
    const { url, options } = prepareRequest(printer, apiUsers);

    return this.#httpClient.get(url, options);
  }

  async getFiles(printer, recursive = false) {
    const { url, options } = prepareRequest(printer, apiFiles(recursive));

    return this.#httpClient.get(url, options);
  }

  async getFile(printer, path) {
    const { url, options } = prepareRequest(printer, apiFile(path));

    return this.#httpClient.get(url, options);
  }

  async getConnection(printer) {
    const { url, options } = prepareRequest(printer, apiConnection);

    return this.#httpClient.get(url, options);
  }

  async getPrinterProfiles(printer) {
    const { url, options } = prepareRequest(printer, apiPrinterProfiles);

    return this.#httpClient.get(url, options);
  }

  async getPluginManager(printer) {
    const printerManagerApiCompatible = checkPluginManagerAPIDeprecation(printer.octoPrintVersion);

    const path = printerManagerApiCompatible ? apiPluginManagerRepository1_6_0 : apiPluginManager;
    const { url, options } = prepareRequest(printer, path);

    return this.#httpClient.get(url, options);
  }

  async getSystemInfo(printer) {
    const { url, options } = prepareRequest(printer, apiSystemInfo);

    return await this.#httpClient.get(url, options);
  }

  async getSystemCommands(printer) {
    const { url, options } = prepareRequest(printer, apiSystemCommands);

    return this.#httpClient.get(url, options);
  }

  async getSoftwareUpdateCheck(printer, force) {
    const { url, options } = prepareRequest(printer, apiSoftwareUpdateCheck(force));

    return this.#httpClient.get(url, options);
  }

  async getPluginPiSupport(printer) {
    const { url, options } = prepareRequest(printer, apiPluginPiSupport);

    return this.#httpClient.get(url, options);
  }

  async deleteTimeLapse(printer, fileName) {
    if (!fileName) {
      throw new Error("Cant delete timelapse file without providing filename");
    }

    const path = `${apiTimelapse}/${fileName}`;
    const { url, options } = prepareRequest(printer, path);

    return this.#httpClient.delete(url, options);
  }

  async listUnrenderedTimeLapses(printer) {
    const path = `${apiTimelapse}?unrendered=true`;
    const { url, options } = prepareRequest(printer, path);

    return this.#httpClient.get(url, options);
  }

  async listPluginFilamentManagerProfiles(printer) {
    const { url, options } = prepareRequest(printer, apiPluginFilamentManagerProfiles);

    return this.#httpClient.get(url, options);
  }

  async listPluginFilamentManagerFilament(printer) {
    const { url, options } = prepareRequest(printer, apiPluginFilamentManagerSpools);

    return this.#httpClient.get(url, options);
  }

  async getPluginFilamentManagerFilament(printer, filamentID) {
    // filamentID needs to be INT numeric
    // https://github.com/malnvenshorn/OctoPrint-FilamentManager/blob/647af691d6081df2f16d400e834f12f11f6eea56/octoprint_filamentmanager/data/__init__.py#L84
    const parsedFilamentID = Number.parseFloat(filamentID);
    if (isNaN(filamentID)) {
      throw OPClientErrors.filamentIDNotANumber;
    }

    const path = `${apiPluginFilamentManagerSpools}/${parsedFilamentID}`;
    const { url, options } = prepareRequest(printer, path);

    return this.#httpClient.get(url, options);
  }

  async downloadFile(printerConnection, fetchPath, targetPath, callback) {
    const fileStream = fs.createWriteStream(targetPath);

    // https://stackoverflow.com/questions/55374755/node-js-axios-download-file-stream-and-writefile

    // TODO
    const res = await this.getWithOptionalRetry(printerConnection, fetchPath, false);

    return await new Promise((resolve, reject) => {
      res.body.pipe(fileStream);
      res.body.on("error", reject);
      fileStream.on("finish", async () => {
        await callback(resolve, reject);
      });
    });
  }

  async downloadImage({ printerURL, apiKey }, fetchPath, targetPath, callback) {
    const fileStream = fs.createWriteStream(targetPath);

    // https://stackoverflow.com/questions/55374755/node-js-axios-download-file-stream-and-writefile

    // TODO
    const downloadURL = new URL(fetchPath, printerURL);
    return request.head(downloadURL, (err, res, body) => {
      res.headers["content-type"] = "image/png";
      res.headers["x-api-key"] = apiKey;
      request(url).pipe(fs.createWriteStream(targetPath)).on("close", callback);
    });
  }
}

module.exports = OctoprintApiService;
