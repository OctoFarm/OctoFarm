import {SYSTEM_SETTINGS_IDS} from "./administration.constants";
import e from "../../utils/elements";

export const grabSystemPageSettingsValues = () => {
    return {
        mongoURI: e.grabValueOrPlaceholder(e.get(SYSTEM_SETTINGS_IDS.serverDatabaseURI)),
        serverPort: e.grabValueOrPlaceholder(e.get(SYSTEM_SETTINGS_IDS.serverPortNumber)),
        logLevel: e.grabValueOrPlaceholder(e.get(SYSTEM_SETTINGS_IDS.logLevelSelect)),
        loginRequired: e.grabChecked(e.get(SYSTEM_SETTINGS_IDS.loginRequired)),
        registration: e.grabChecked(e.get(SYSTEM_SETTINGS_IDS.registration))
    }
}