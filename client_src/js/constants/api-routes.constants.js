const base = "/api";
const server = base + "/server";

module.exports = {
  APP: {
    SYSTEMINFO: server + "/info",
    UPDATEREADY: server + "/update-ready",
    GITHUBISSUE: server + "/github-issue"
  },
  ALERTS: {},
  SYSTEM: {},
  FILAMENT: {},
  HISTORY: {},
  PRINTERS: {},
  FILEMANAGER: {}
};
