const { OPClientErrors } = require("./constants/octoprint-service.constants");
const { checkPluginManagerAPIDeprecation } = require("../../utils/compatibility.utils");
const { OctoprintApiService } = require("./octoprint-api.service");

const octoPrintBase = "/";
const apiBase = octoPrintBase + "api";
const apiSettingsPart = apiBase + "/settings";
const apiFile = (path) => apiBase + "/files/local/" + encodeURIComponent(path);
const apiFiles = (recursive = true) => apiBase + "/files?recursive=" + recursive;
const apiConnection = apiBase + "/connection";
const apiPrinterProfiles = apiBase + "/printerprofiles";
const apiSystem = apiBase + "/system";
const apiSystemInfo = apiSystem + "/info";
const apiSystemCommands = apiSystem + "/commands";
const apiVersion = apiBase + "/version";
const apiUsers = apiBase + "/users";
const apiLogin = (passive = true) => apiBase + "/login" + (passive ? "?passive=true" : "");
const apiProfiles = apiBase + "/printerprofiles/"; //expects a profile id param
const apiSettings = apiBase + "/settings";

const apiPluginManager = apiBase + "/plugin/pluginmanager";
const apiPluginManagerRepository1_6_0 = apiBase + "/plugin/pluginmanager";
// const apiPluginManagerRepository1_6_0 = octoPrintBase + "plugin/pluginmanager/repository"; // This doesn't work... wow... did he even check it?
const apiSoftwareUpdateCheck = (force) =>
  octoPrintBase + "plugin/softwareupdate/check" + (force ? "" : "");
const apiPluginPiSupport = apiBase + "/plugin/pi_support";
const apiPluginFilamentManagerSpecificSpool = apiBase + "/plugin/filamentmanager/spools";
const apiTimelapse = (unrendered = true) =>
  apiBase + "/timelapse" + (unrendered ? "?unrendered=true" : "");
const printerValidationErrorMessage = "printer apiKey or URL undefined";

class OctoprintApiClientService extends OctoprintApiService {
  constructor(printerURL, apikey, timeoutSettings) {
    super(printerURL, apikey, timeoutSettings);
  }

  static validatePrinter(printer) {
    if (!printer.apikey || !printer.printerURL) {
      throw printerValidationErrorMessage;
    }
  }

  async postPrinter(route, data, timeout = false) {
    return super.post(route, data, timeout);
  }

  async deletePrinter(route, timeout = false) {
    return super.delete(route, timeout);
  }

  async getWithOptionalRetry(route, retry = false) {
    if (retry) {
      return this.getRetry(route);
    } else {
      return this.get(route);
    }
  }

  async getSettings(retry = false) {
    return this.getWithOptionalRetry(apiSettingsPart, retry);
  }

  async getVersion(retry = false) {
    return this.getWithOptionalRetry(apiVersion, retry);
  }

  /**
   * List files recursively or not.
   * @param printer
   * @param recursive
   * @param retry
   * @returns {Promise<*|Promise|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise|Promise<unknown>)|*|undefined>}
   */
  async getFiles(recursive = false, retry = false) {
    return this.getWithOptionalRetry(apiFiles(recursive), retry);
  }

  /**
   * Get a specific file
   * @param printer
   * @param path
   * @param retry
   * @returns {Promise<*|Promise|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise|Promise<unknown>)|*|undefined>}
   */
  async getFile(path, retry = false) {
    return this.getWithOptionalRetry(apiFile(path), retry);
  }

  async deleteFile(path) {
    console.log("PATH ", apiFile(path));
    return this.deletePrinter(apiFile(path));
  }

  async getConnection(retry = false) {
    return this.getWithOptionalRetry(apiConnection, retry);
  }

  async getPrinterProfiles(retry = false) {
    return this.getWithOptionalRetry(apiPrinterProfiles, retry);
  }

  async getPluginManager(retry = false, octoPrintVersion = undefined) {
    if (!octoPrintVersion) throw new Error("Version not supplied...");
    const printerManagerApiCompatible = checkPluginManagerAPIDeprecation(octoPrintVersion);
    const route = printerManagerApiCompatible ? apiPluginManagerRepository1_6_0 : apiPluginManager;

    return this.getWithOptionalRetry(route, retry);
  }

  async getSystemInfo(retry = false) {
    return this.getWithOptionalRetry(apiSystemInfo, retry);
  }

  async getSystemCommands(retry = false) {
    return this.getWithOptionalRetry(apiSystemCommands, retry);
  }

  async getSoftwareUpdateCheck(force, retry = false) {
    return this.getWithOptionalRetry(apiSoftwareUpdateCheck(force), retry);
  }

  async getUsers(retry = false) {
    return this.getWithOptionalRetry(apiUsers, retry);
  }

  async getPluginPiSupport(retry = false) {
    return this.getWithOptionalRetry(apiPluginPiSupport, retry);
  }

  async getPluginFilamentManagerFilament(filamentID) {
    // filamentID needs to be INT numeric
    // https://github.com/malnvenshorn/OctoPrint-FilamentManager/blob/647af691d6081df2f16d400e834f12f11f6eea56/octoprint_filamentmanager/data/__init__.py#L84
    const parsedFilamentID = Number.parseFloat(filamentID);
    if (isNaN(filamentID)) {
      throw OPClientErrors.filamentIDNotANumber;
    }
    const getURL = `${apiPluginFilamentManagerSpecificSpool}/${parsedFilamentID}`;
    return this.getWithOptionalRetry(getURL, false);
  }

  async login(passive = true) {
    return this.postPrinter(apiLogin(passive), {}, false);
  }

  async getTimelapses(unrendered = true) {
    return this.getWithOptionalRetry(apiTimelapse(unrendered), true);
  }

  async patchProfile(data, profileID) {
    try {
      return await this.patch(apiProfiles + profileID, data);
    } catch (e) {
      console.log(e);
      return e;
    }
  }

  async postSettings(data) {
    return this.post(apiSettings, data);
  }
}

module.exports = {
  OctoprintApiClientService
};
