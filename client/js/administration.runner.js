import { updateTaskListState } from "./pages/system/server.actions";
import { MENU_IDS, SAVE_BTN_IDS } from "./pages/system/administration.constants";
import e from "./utils/elements";

(function() {
    const taskMenu = e.get(MENU_IDS.adminTasks);
    setInterval(async () => {
        if(e.active(taskMenu)){
            await updateTaskListState();
        }
    }, 2000);
})();
