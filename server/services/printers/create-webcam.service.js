const { CATEGORIES } = require("../printers/constants/printer-categories.constants");

class GlobalWebcamPrinter {
  camURL = undefined;
  category = undefined;

  constructor(camURL, category) {
    this.camURL = camURL;
    if (category !== CATEGORIES.WEBCAM) {
      throw new Error("Category is not accepted!");
    }
    this.category = category;
  }
}
