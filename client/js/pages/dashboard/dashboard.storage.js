import {
  getLocalStorage,
  saveLocalStorage,
} from "../../services/local-storage.service";
import { LOCAL_STORAGE_CONSTANTS } from "../../constants/local-storage.constants";

export class DashboardStorage {
  /**
   * Fetch the tile configuration from LocalStorage without guarantee
   * @returns {any}
   */
  static fetchConfig() {
    return getLocalStorage(LOCAL_STORAGE_CONSTANTS().DASHBOARD_CONFIG);
  }

  /**
   * Save the tile configuration to LocalStorage
   * @param config
   */
  static saveConfig(config) {
    saveLocalStorage(LOCAL_STORAGE_CONSTANTS().DASHBOARD_CONFIG, config);
  }

  /**
   * Convert the Grid Stack to tile configuration and save it
   * @param gridStackInstance
   */
  static saveGridStackConfig(gridStackInstance) {
    const gridStackConfig = [];
    gridStackInstance.engine.nodes.forEach(function (node) {
      gridStackConfig.push({
        x: node.x,
        y: node.y,
        width: node.w,
        height: node.h,
        id: node.id,
      });
    });
    DashboardStorage.saveConfig(gridStackConfig);
  }
}
