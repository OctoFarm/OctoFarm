import { updatePrinterSettingsModal } from "../../lib/modules/printerSettings";

document
  .getElementById(`printerSettings-${printer._id}`)
  .addEventListener("click", (e) => {
    updatePrinterSettingsModal(
      printerInfo,
      // eslint-disable-next-line no-underscore-dangle
      printer._id
    );
  });
