import OctoFarmClient from "../octofarm-client.service";
import OctoPrintClient from "./octoprint-client.service";

export const printStartSequence = async (printer) => {
    await OctoPrintClient.updateFeedAndFlow(printer);
    await OctoPrintClient.updateFilamentOffsets(printer);
    await OctoPrintClient.updateBedOffsets(printer);
    await OctoFarmClient.updateActiveControlUser(printer._id);
}