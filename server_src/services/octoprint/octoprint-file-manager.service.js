const { findIndex } = require("lodash");
const { FileClean } = require("../../lib/dataFunctions/fileClean");
const moveFolderOnPrinter = (printer, oldFolder, newFolderPath, newFolderName) => {
  const file = findIndex(printer.fileList.folders, function (o) {
    return o.name === oldFolder;
  });
  console.log(printer.fileList.files);
  printer.fileList.files.forEach((file, index) => {
    if (file.path === oldFolder) {
      const fileName = printer.fileList.files[index].fullPath.substring(
        printer.fileList.files[index].fullPath.lastIndexOf("/") + 1
      );
      printer.fileList.files[index].fullPath = `${newFolderName}/${fileName}`;
      printer.fileList.files[index].path = newFolderName;
    }
  });
  printer.fileList.folders[file].name = newFolderName;
  printer.fileList.folders[file].path = newFolderPath;
  // Should use printer update method...
  printer.markModified("fileList");
  printer.save();
  // Filament should already be compiled... Maybe do that first.
  // const currentFilament = await Runner.compileSelectedFilament(farmPrinters[i].selectedFilament, i);
  // The generation should be passed back as the actual files...
  FileClean.generate(printer, currentFilament);
  // Statistics to trigger after every action... this is the whole printer object... should be grabbed in stats.
  FileClean.statistics(printers);
};

module.exports = {
  moveFolderOnPrinter
};
