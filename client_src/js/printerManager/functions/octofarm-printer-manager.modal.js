document
  .getElementById(`printerButton-${printer._id}`)
  .addEventListener("click", () => {
    // eslint-disable-next-line no-underscore-dangle
    PrinterManager.init(printer._id, printerInfo, printerControlList);
  });
