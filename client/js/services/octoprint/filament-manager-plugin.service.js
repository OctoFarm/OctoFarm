import OctoFarmClient from '../octofarm-client.service';
let filamentManagerSettings = {};

export async function isFilamentManagerPluginSyncEnabled() {
  if (_.isEmpty(filamentManagerSettings)) {
    const {
      filament: { allowMultiSelect },
    } = await OctoFarmClient.get('settings/server/get');
    filamentManagerSettings.allowMultiSelectIsEnabled = allowMultiSelect;
  }
  return {
    allowMultiSelectIsEnabled: filamentManagerSettings.allowMultiSelectIsEnabled,
  };
}
