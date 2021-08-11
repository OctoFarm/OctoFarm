const { NotFoundException } = require("../exceptions/runtime.exceptions");
const { findFileIndex } = require("./utils/find-predicate.utils");

/**
 * An extension repository for managing printer files in database
 */
class PrinterFilesService {
  #printerService;

  constructor({ printerService }) {
    this.#printerService = printerService;
  }

  async getPrinterFilesStorage(printerId) {
    const printer = await this.#printerService.get(printerId);

    return {
      fileList: printer.fileList,
      storage: printer.storage
    };
  }

  /**
   * Perform delete action on database
   * @param printerId
   * @param filePath
   * @returns {Promise<*>}
   */
  async deleteFile(printerId, filePath) {
    const printer = await this.#printerService.get(printerId);

    const fileIndex = findFileIndex(printer.fileList, filePath);

    if (fileIndex === -1) {
      throw new NotFoundException(
        `A file removal was ordered but this file was not found in database for printer Id ${printerId}`,
        filePath
      );
    }

    printer.fileList.files.splice(index, 1);
    printer.fileList.fileCount = printer.fileList.files.length;
    printer.markModified("fileList");
    printer.save();

    return printer.fileList;
  }
}

module.exports = PrinterFilesService;
