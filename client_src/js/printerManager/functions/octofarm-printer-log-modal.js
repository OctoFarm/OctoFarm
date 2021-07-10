document
  .getElementById(`printerLog-${printer._id}`)
  .addEventListener("click", async (e) => {
    let connectionLogs = await OctoFarmClient.get(
      "printers/connectionLogs/" + printer._id
    );
    connectionLogs = await connectionLogs.json();
    PrinterLogs.loadLogs(printer, connectionLogs);
  });
