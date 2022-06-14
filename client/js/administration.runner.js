import { saveSystemSettings, updateTaskListState, saveThemeSettings } from "./pages/administration/administration.actions";
import { MENU_IDS, SAVE_BTN_IDS } from "./pages/administration/administration.constants";
import e from "./utils/elements";


const taskMenu = e.get(MENU_IDS.adminTasks);
setInterval(async () => {
    if(e.active(taskMenu)){
        await updateTaskListState();
    }
}, 2000);

const saveSystemChanges = e.get(SAVE_BTN_IDS.saveSystem);
if(e.exists(saveSystemChanges)){
    saveSystemChanges.addEventListener("click", async (event) => {
        event.target.disabled = true;
        e.appendLoader(event.target);
        await saveSystemSettings();
        event.target.disabled = false;
        e.removeLoader(event.target);
    })
}

const saveThemeChanges = e.get(SAVE_BTN_IDS.saveTheme);
if(e.exists(saveThemeChanges)){
    saveThemeChanges.addEventListener("click", async (event) => {
        event.target.disabled = true;
        e.appendLoader(event.target);
        await saveThemeSettings();
        event.target.disabled = false;
        e.removeLoader(event.target);
    })
}
