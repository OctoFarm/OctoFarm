module.exports = {
  PRINTER_ID: {
    i: ["printer_id"]
  },
  NEW_PRINTER: {
    settingsAppearance: "settings_appearance",
    printerURL: ["required", "string", "url"],
    camURL: ["required", "string", "url"],
    apikey: ["required", "string", "minLength:32", "maxLength:32"],
    group: ["string", "minLength:0", "maxLength:50"]
  }
};
