import { SYSTEM_SETTINGS_IDS, THEME_SETTINGS_IDS } from "./administration.constants";
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

export const grabThemePageSettingsValues = () => {
    let mode = "dark";
    if(!e.grabChecked(e.get(THEME_SETTINGS_IDS.themeDarkMode))){
        mode = "light";
    }
    console.log(e.get(THEME_SETTINGS_IDS.navbarColourDark))
    return {
        mode: mode,
        navbarColourDark: e.grabValueOrPlaceholder(e.get(THEME_SETTINGS_IDS.navbarColourDark)),
        navbarColourLight: e.grabValueOrPlaceholder(e.get(THEME_SETTINGS_IDS.navbarColourLight)),
        octofarmHighlightColour: e.grabValueOrPlaceholder(e.get(THEME_SETTINGS_IDS.mainApplicationAccentColour)),
        octofarmMainColour: e.grabValueOrPlaceholder(e.get(THEME_SETTINGS_IDS.mainApplicationColour)),
        sidebarColourDark: e.grabValueOrPlaceholder(e.get(THEME_SETTINGS_IDS.sidebarColourDark)),
        sidebarColourLight: e.grabValueOrPlaceholder(e.get(THEME_SETTINGS_IDS.sidebarColourLight)),
        applicationTitle: e.grabValueOrPlaceholder(e.get(THEME_SETTINGS_IDS.serverApplicationTitle))
    }
}
