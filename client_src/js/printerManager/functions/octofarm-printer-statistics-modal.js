document
  .getElementById(`printerStatistics-${printer._id}`)
  .addEventListener("click", async (e) => {
    await PrinterLogs.loadStatistics(printer._id);
  });
