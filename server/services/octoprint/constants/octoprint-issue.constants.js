const OP_ISSUE = {
  // "Pong message received from client...": "Complete",
  // "Sending ping message to websocket...": "Active",
  // "Setting up the clients websocket connection": "Active",
  // "Client error, setting back up... in 10000ms": "Offline" // Case 1006 Terminate, use twice,
  // "Throttling websocket connection...": "Active",
  // "Connection lost... reconnecting in: " + this.autoReconnectInterval + "ms" : "Active", (reconnect),
  // "Opened the websocket connection...": "Active", (onopen),
  // "Successfully opened websocket connection...": "Complete", (onmessage:history)
  // logLine.line: "Active"/"Complete"/"Offline" => plugin loglines
  // "Whoopsy! Big error...": "Offline", (onerror)
  // "Client closed...": "Offline" (onclose)
  // `Attempting passive login with user: ${farmPrinters[i].currentUser}`: "Active",
  // `Passive Login Succeded with user: ${farmPrinters[i].currentUser}`, "Complete",
  // "API checks successful": "Complete",
  // `${e.message}: API issues... halting!`: "Disconnected",
  // `${e.message}: Please generate an Application or User API Key to connect...`: "Disconnected" (999)
  // `${e.message}: Host not found, halting...`: "Disconnected",
  // `${e.message} retrying in ${timeout.webSocketRetry}`: "Disconnected"
  // "Initiating Printer...": "Active",
  // "Updating Printer information...": "Active", (updatePrinters),
  // "Printer information updated successfully...": "Complete" (updatePrinters, per printer, changeIndex > -1)
  // `Regenerating Printer Index: ${p}`: "Active", (regenerateSortIndex)
  // "Removing printer from database...": "Active" (removePrinter)
  // "Successfully removed from database...": "Complete" (removePrinter)
  // `Regenerating Printer Index: ${p}`, (removePrinter, per printer)
  // "Successfully removed from the database...": "Complete", (removePrinter, All Printers)
  // "ReScan Requested... checking socket state": "Active", (rescanOcto)
  // `Websocket state ${farmPrinters[index].ws.instance.readyState}`, (rescanOcto, if !!ws)
  // "Socket currently active, closing and re-setting back up...": "Active" (rescanOcto, if !!ws.readyState === 1)
  // "Socket in tentative state, awaiting for connection attempt to finish... retry in 2000ms": "Active"
  // "Retrying socket...": "Active" (rescanOcto, timeout 2000)
  // "Socket currently closed... Re-opening...": "Active" (rescanOcto, used twice)
  // == "Grabbing file information...": "Active (getFiles)
  // "Grabbed file information...": "Complete" (getFiles)
  // `Error grabbing file information: ${err}`: "Disconnected" (getFiles, catch)
  // == "Grabbing state information...": "Active" (getState)
  // "Grabbed state information...": "Complete" (getState)
  // `Error grabbing state information: ${err}`: "Disconnected" (getState, catch)
  // == "Grabbing profile information...": "Active" (getProfile)
  // "Grabbed profile information...": "Complete" (getProfile)
  // `Error grabbing profile information: ${err}`, "Disconnected" (getProfile, catch)
  // == "Grabbing plugin list...": "Active" (getPluginList)
  // "Grabbed plugin list...": "Complete" (getPluginList)
  // `Error grabbing plugin list information: ${err}`, "Disconnected" (getPluginList, catch)
  // == "Grabbing OctoPrint's System Information": "Active" (getOctoPrintSystenInfo)
  //  "Grabbed OctoPrints system information...": "Complete" (getOctoPrintSystenInfo)
  // `Error grabbing system information: ${err}`, "Disconnected" (getOctoPrintSystenInfo, catch)
  // == "Grabbing OctoPrint's System Information": "Active" (getOctoPrintSystenInfo)
  // "Grabbed OctoPrints system information...": "Complete" (getOctoPrintSystenInfo)
  // `Error grabbing system information: ${err}`, "Disconnected" (getOctoPrintSystenInfo, catch)
  // == "Checking OctoPrint for updates...": "Active" (getUpdates)
  // "Octoprints checked for updates...": "Complete" (getUpdates)
  // `Error grabbing octoprint updates information: ${err}`, "Disconnected" (getUpdates, catch)
  // == "Grabbing settings information...": "Active" (getSettings)
  // "Pi Plugin detected... scanning for version information...": "Active" (getSettings)
  // "Sucessfully grabbed OctoPi information...": "Complete" (getSettings, piSupport)
  // "Cost Plugin detected... Updating OctoFarms Cost settings": "Active" (getSettings, costestimation plugin)
  // "Successfully saved Cost Estimation settings": "Complete" (getSettings, costestimation plugin)
  // "PSU Control plugin detected... Updating OctoFarm power settings...": "Active" (getSettings, PSUControl plugin)
  // "Successfully saved PSU control settings...": "Complete" (getSettings, PSUControl plugin),
  // "Grabbed settings information...": "Complete" (getSettings)
  // `Error grabbing settings information: ${err}`: "Offline" (getSettings, catch)
  // == "Grabbing system information...": "Active" (getSystem)
  // "Grabbed system information...": "Complete" (getSystem)
  // `Error grabbing system information: ${err}`: "Offline" (getSystem, catch)
};

module.exports = {
  OP_ISSUE
};
