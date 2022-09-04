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
const apiPluginFilamentManagerSpecificSpool = "/plugin/filamentmanager/spools";
const apiTimelapse = (unrendered = true) =>
  apiBase + "/timelapse" + (unrendered ? "?unrendered=true" : "");
const printerValidationErrorMessage = "printer apiKey or URL undefined";

class OctoprintApiClientService extends OctoprintApiService {
  constructor(printerURL, apikey, timeoutSettings) {
    super(printerURL, apikey, timeoutSettings);
  }

  async pingTest() {
    return this.get("/", 5000);
  }

  async grabInformation(api) {
    return this.get(api);
  }

  static validatePrinter(printer) {
    if (!printer.apikey || !printer.printerURL) {
      throw printerValidationErrorMessage;
    }
  }

  async postPrinter(route, data) {
    return this.post(route, data);
  }

  async deletePrinter(route) {
    return this.delete(route);
  }

  async getSettings() {
    return this.get(apiSettingsPart);
  }

  /**
   * List files recursively or not.
   * @param recursive
   */
  async getFiles(recursive = false) {
    return this.get(apiFiles(recursive));
  }

  /**
   * Get a specific file
   * @param path
   * @returns {}
   */
  async getFile(path) {
    return this.get(apiFile(path));
  }

  async deleteFile(path) {
    return this.deletePrinter(apiFile(path));
  }

  async getConnection() {
    return this.get(apiConnection);
  }

  async getPrinterProfiles() {
    return this.get(apiPrinterProfiles);
  }

  async getPluginManager(octoPrintVersion = undefined) {
    if (!octoPrintVersion) throw new Error("Version not supplied...");
    const printerManagerApiCompatible = checkPluginManagerAPIDeprecation(octoPrintVersion);
    const route = printerManagerApiCompatible ? apiPluginManagerRepository1_6_0 : apiPluginManager;

    return this.get(route);
  }

  async getSystemCommands() {
    return this.get(apiSystemCommands);
  }

  async getSoftwareUpdateCheck(force = false) {
    return this.get(apiSoftwareUpdateCheck(force));
  }

  async getPluginPiSupport() {
    return this.get(apiPluginPiSupport);
  }

  async getPluginFilamentManagerFilament(filamentID) {
    // filamentID needs to be INT numeric
    // https://github.com/malnvenshorn/OctoPrint-FilamentManager/blob/647af691d6081df2f16d400e834f12f11f6eea56/octoprint_filamentmanager/data/__init__.py#L84
    const parsedFilamentID = Number.parseFloat(filamentID);
    if (isNaN(filamentID)) {
      throw OPClientErrors.filamentIDNotANumber;
    }
    const getURL = `${apiPluginFilamentManagerSpecificSpool}/${parsedFilamentID}`;

    return this.get(getURL);
  }

  async login(passive = true) {
    return this.postPrinter(apiLogin(passive), {});
  }

  async getTimelapses(unrendered = true) {
    return this.get(apiTimelapse(unrendered));
  }

  async patchProfile(data, profileID) {
    return this.patch(apiProfiles + profileID, data);
  }

  async postSettings(data) {
    return this.post(apiSettings, data);
  }

  async postPrinterPowerState(url, data) {
    return this.post(url, data);
  }

  async getPrinterPowerState(url) {
    return this.get(url);
  }
}

module.exports = {
  OctoprintApiClientService
};
