import OctoPrintClient from "../lib/octoprint";

async function setupOctoPrintForTimelapses(printers) {
  let successfulPrinters = "";
  let failedPrinters = "";

  let webCamSettings = {
    webcam: {
      ffmpegVideoCodec: "libx264",
      webcamEnabled: true
    }
  };
  let timeLapseSettings = {
    type: "zchange"
  };
  for (let i = 0; i < printers.length; i++) {
    if (printers[i].printerState.colour.category !== "Offline") {
      await OctoPrintClient.post(printers[i], "settings", webCamSettings);
      await OctoPrintClient.post(printers[i], "timelapse", timeLapseSettings);
      successfulPrinters += `<i class="fas fa-check-circle text-success"></i> ${printers[i].printerName}: Settings Updated! <br>`;
    } else {
      failedPrinters += `<i class="fas fa-check-circle text-danger"></i> ${printers[i].printerName}: Offline! <br>`;
    }
  }
  return {
    successfulPrinters,
    failedPrinters
  };
}

export { setupOctoPrintForTimelapses };
