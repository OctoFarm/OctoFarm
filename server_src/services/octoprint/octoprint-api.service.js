const fs = require("fs");
const request = require("request");
const {
  OPClientErrors,
  contentTypeHeaderKey,
  apiKeyHeaderKey
} = require("./constants/octoprint-service.constants");
const { checkPluginManagerAPIDeprecation } = require("../../utils/compatibility.utils");
const Logger = require("../../handlers/logger.js");
const { processResponse, validatePrinter, constructHeaders } = require("./utils/api.utils");
const { jsonContentType } = require("./constants/octoprint-service.constants");
const { getDefaultTimeout } = require("../../constants/server-settings.constants");

const defaultResponseOptions = { unwrap: true };
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
  #timeouts; // TODO apply apiTimeout, but apply apiRetry, apiRetryCutoff elsewhere (and webSocketRetry)

  #logger = new Logger("OctoPrint-API-Service");

  constructor({ settingsStore, httpClient }) {
    this.#settingsStore = settingsStore;
    this.#httpClient = httpClient;
  }

  #ensureTimeoutSettingsLoaded() {
    const serverSettings = this.#settingsStore.getServerSettings();
    this.#timeouts = { ...serverSettings.timeout };

    if (!this.#timeouts) {
      throw new Error(
        "OctoPrint API Service could not load timeout settings. settingsStore:ServerSettings:timeout didnt return anything"
      );
    }
  }

  #prepareRequest(printer, path, timeoutOverride) {
    this.#ensureTimeoutSettingsLoaded();

    const { apiKey, printerURL } = validatePrinter(printer);

    let headers = constructHeaders(apiKey);

    let timeout = timeoutOverride || this.#timeouts.apiTimeout;
    if (timeout <= 0) {
      timeout = getDefaultTimeout().apiTimeout;
    }

    return {
      url: new URL(path, printerURL).href,
      options: {
        headers,
        timeout
      }
    };
  }

  // Unused because we dont have any PUT/PATCH/POST with relevant data so far
  #prepareJSONRequest(printer, path, data, timeoutOverride) {
    const { url, options } = this.#prepareRequest(printer, path, timeoutOverride);

    // We must allow file uploads elsewhere, so be explicit about the content type and data in this JSON request
    let serializedData = data ? JSON.stringify(data) : undefined;
    options.headers[contentTypeHeaderKey] = jsonContentType;

    return {
      url,
      data: serializedData,
      options
    };
  }

  async login(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiLogin);

    const response = await this.#httpClient.post(url, {}, options);

    return processResponse(response, responseOptions);
  }

  async getSettings(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiSettingsPart);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getAdminUserOrDefault(printer) {
    const data = await this.getUsers(printer, defaultResponseOptions);

    let opAdminUserName = "admin";
    if (!!data?.users && Array.isArray(data)) {
      const adminUser = data.users.find((user) => !!user.admin);
      if (!adminUser) opAdminUserName = adminUser.name;
    }

    return opAdminUserName;
  }

  async getUsers(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiUsers);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getFiles(printer, recursive = false, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiFiles(recursive));

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getFile(printer, path, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiFile(path));

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getConnection(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiConnection);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getPrinterProfiles(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiPrinterProfiles);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getPluginManager(printer, responseOptions = defaultResponseOptions) {
    const printerManagerApiCompatible = checkPluginManagerAPIDeprecation(printer.octoPrintVersion);

    const path = printerManagerApiCompatible ? apiPluginManagerRepository1_6_0 : apiPluginManager;
    const { url, options } = this.#prepareRequest(printer, path);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getSystemInfo(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiSystemInfo);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getSystemCommands(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiSystemCommands);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getSoftwareUpdateCheck(printer, force, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiSoftwareUpdateCheck(force));

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getPluginPiSupport(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiPluginPiSupport);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async deleteTimeLapse(printer, fileName, responseOptions = defaultResponseOptions) {
    if (!fileName) {
      throw new Error("Cant delete timelapse file without providing filename");
    }

    const path = `${apiTimelapse}/${fileName}`;
    const { url, options } = this.#prepareRequest(printer, path);

    const response = await this.#httpClient.delete(url, options);

    return processResponse(response, responseOptions);
  }

  async listUnrenderedTimeLapses(printer, responseOptions = defaultResponseOptions) {
    const path = `${apiTimelapse}?unrendered=true`;
    const { url, options } = this.#prepareRequest(printer, path);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async listPluginFilamentManagerProfiles(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiPluginFilamentManagerProfiles);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async listPluginFilamentManagerFilament(printer, responseOptions = defaultResponseOptions) {
    const { url, options } = this.#prepareRequest(printer, apiPluginFilamentManagerSpools);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  async getPluginFilamentManagerFilament(
    printer,
    filamentID,
    responseOptions = defaultResponseOptions
  ) {
    // filamentID needs to be INT numeric
    // https://github.com/malnvenshorn/OctoPrint-FilamentManager/blob/647af691d6081df2f16d400e834f12f11f6eea56/octoprint_filamentmanager/data/__init__.py#L84
    const parsedFilamentID = Number.parseFloat(filamentID);
    if (isNaN(filamentID)) {
      throw OPClientErrors.filamentIDNotANumber;
    }

    const path = `${apiPluginFilamentManagerSpools}/${parsedFilamentID}`;
    const { url, options } = this.#prepareRequest(printer, path);

    const response = await this.#httpClient.get(url, options);

    return processResponse(response, responseOptions);
  }

  // TODO WIP with axios
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

  // TODO WIP
  async downloadImage({ printerURL, apiKey }, fetchPath, targetPath, callback) {
    const fileStream = fs.createWriteStream(targetPath);

    // https://stackoverflow.com/questions/55374755/node-js-axios-download-file-stream-and-writefile

    // TODO
    const downloadURL = new URL(fetchPath, printerURL);
    return request.head(downloadURL, (err, res, body) => {
      res.headers[contentTypeHeaderKey] = "image/png";
      res.headers[apiKeyHeaderKey] = apiKey;
      request(url).pipe(fs.createWriteStream(targetPath)).on("close", callback);
    });
  }
}

module.exports = OctoprintApiService;
