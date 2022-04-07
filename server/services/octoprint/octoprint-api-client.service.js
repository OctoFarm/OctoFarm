const { OPClientErrors } = require("./constants/octoprint-service.constants");
const { checkPluginManagerAPIDeprecation } = require("../../utils/compatibility.utils");
const { OctoprintApiService } = require("./octoprint-api.service");

const octoPrintBase = "/";
const apiBase = octoPrintBase + "api";
const apiSettingsPart = apiBase + "/settings";
const apiFile = (path) => apiBase + "/files/local/" + encodeURI(path);
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
    return super.post(route, data, timeout).catch((e) => {
      return e;
    });
  }

  async deletePrinter(route, timeout = false) {
    return super.delete(route, timeout).catch((e) => {
      return e;
    });
  }

  async getWithOptionalRetry(route, retry = false) {
    if (retry) {
      return this.getRetry(route).catch((e) => {
        return e;
      });
    } else {
      return this.get(route).catch((e) => {
        return e;
      });
    }
  }

  async getSettings(retry = false) {
    return this.getWithOptionalRetry(apiSettingsPart, retry).catch((e) => {
      return e;
    });
  }

  async getVersion(retry = false) {
    return this.getWithOptionalRetry(apiVersion, retry).catch((e) => {
      return e;
    });
  }

  /**
   * List files recursively or not.
   * @param printer
   * @param recursive
   * @param retry
   * @returns {Promise<*|Promise|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise|Promise<unknown>)|*|undefined>}
   */
  async getFiles(recursive = false, retry = false) {
    return this.getWithOptionalRetry(apiFiles(recursive), retry).catch((e) => {
      return e;
    });
  }

  /**
   * Get a specific file
   * @param printer
   * @param path
   * @param retry
   * @returns {Promise<*|Promise|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise|Promise<unknown>)|*|undefined>}
   */
  async getFile(path, retry = false) {
    return this.getWithOptionalRetry(apiFile(path), retry).catch((e) => {
      return e;
    });
  }

  async deleteFile(path) {
    return this.deletePrinter(apiFile(path)).catch((e) => {
      return e;
    });
  }

  async getConnection(retry = false) {
    return this.getWithOptionalRetry(apiConnection, retry).catch((e) => {
      return e;
    });
  }

  async getPrinterProfiles(retry = false) {
    return this.getWithOptionalRetry(apiPrinterProfiles, retry).catch((e) => {
      return e;
    });
  }

  async getPluginManager(retry = false, octoPrintVersion = undefined) {
    if (!octoPrintVersion) throw new Error("Version not supplied...");
    const printerManagerApiCompatible = checkPluginManagerAPIDeprecation(octoPrintVersion);
    const route = printerManagerApiCompatible ? apiPluginManagerRepository1_6_0 : apiPluginManager;

    return this.getWithOptionalRetry(route, retry).catch((e) => {
      return e;
    });
  }

  async getSystemInfo(retry = false) {
    return this.getWithOptionalRetry(apiSystemInfo, retry).catch((e) => {
      return e;
    });
  }

  async getSystemCommands(retry = false) {
    return this.getWithOptionalRetry(apiSystemCommands, retry).catch((e) => {
      return e;
    });
  }

  async getSoftwareUpdateCheck(force, retry = false) {
    return this.getWithOptionalRetry(apiSoftwareUpdateCheck(force), retry).catch((e) => {
      return e;
    });
  }

  async getUsers(retry = false) {
    return this.getWithOptionalRetry(apiUsers, retry).catch((e) => {
      return e;
    });
  }

  async getPluginPiSupport(retry = false) {
    return this.getWithOptionalRetry(apiPluginPiSupport, retry).catch((e) => {
      return e;
    });
  }

  async getPluginFilamentManagerFilament(filamentID) {
    // filamentID needs to be INT numeric
    // https://github.com/malnvenshorn/OctoPrint-FilamentManager/blob/647af691d6081df2f16d400e834f12f11f6eea56/octoprint_filamentmanager/data/__init__.py#L84
    const parsedFilamentID = Number.parseFloat(filamentID);
    if (isNaN(filamentID)) {
      throw OPClientErrors.filamentIDNotANumber;
    }
    const getURL = `${apiPluginFilamentManagerSpecificSpool}/${parsedFilamentID}`;
    return this.getWithOptionalRetry(getURL, false).catch((e) => {
      return e;
    });
  }

  async login(passive = true) {
    return this.postPrinter(apiLogin(passive), {}, false).catch((e) => {
      return e;
    });
  }

  async getTimelapses(unrendered = true) {
    return this.getWithOptionalRetry(apiTimelapse(unrendered), true).catch((e) => {
      return e;
    });
  }

  async patchProfile(data, profileID) {
    return this.patch(apiProfiles + profileID, data).catch((e) => {
      return e;
    });
  }

  async postSettings(data) {
    return this.post(apiSettings, data).catch((e) => {
      return e;
    });
  }
}

module.exports = {
  OctoprintApiClientService
};
