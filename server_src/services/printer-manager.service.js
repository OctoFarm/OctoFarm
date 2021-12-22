const Logger = require("../handlers/logger.js");

const PrinterService = require("./printer.service");
const PrinterCache = require("../cache/printer.cache");
const { SettingsClean } = require("../lib/dataFunctions/settingsClean");
const { OctoPrintPrinter } = require("../services/printers/create-octoprint.service");
const { PRINTER_CATEGORIES } = require("./printers/constants/printer-categories.constants");

const logger = new Logger("OctoFarm-PrinterManager");

class PrinterManagerService {
  #printers = [];

  async initialisePrinters() {
    // Grab printers from database
    const pList = await PrinterService.list();
    logger.debug("Initialising " + pList.length + " printers");
    for (let i = 0; i < pList.length; i++) {
      // Another shim for disabled prop, doesn't exist prior to V1.2
      if (typeof pList[i].disabled !== "boolean") {
        logger.debug("No disabled key, updating database with default record...");
        pList[i].disabled = false;
        pList[i].markModified("disabled");
        pList[i]
          .updateOne({ disabled: false })
          .then(() => {
            logger.debug("Updated disable key record");
          })
          .catch((e) => {
            logger.error("Issue saving disabled key record! ", e);
          });
      }
      // Shim because categories don't exist prior to V1.2
      if (!pList[i]?.category) {
        logger.debug("No Category key up");
        pList[i].category = PRINTER_CATEGORIES.OCTOPRINT;
        pList[i].markModified("category");
        pList[i]
          .updateOne({ category: PRINTER_CATEGORIES.OCTOPRINT })
          .then(() => {
            logger.debug("Updated category key record");
          })
          .catch((e) => {
            logger.error("Issue saving category key record! ", e);
          });
      }
      const device = new OctoPrintPrinter(pList[i]);
      this.#printers.push(device);
      console.log("CREATED PRINTER" + i);
    }

    // Save printer in cache...

    return true;
  }

  killAllConnections() {
    logger.debug("Killing all printer connections...");
    this.#printers.forEach((printer) => {
      printer.killApiTimeout();
      printer.killWebsocketConnection();
    });
  }

  // static async batchCreatePrinters(printerList){
  //   // Async function to send mail to a list of users.
  //   const sendMailForUsers = async (users) => {
  //     const usersLength = users.length
  //
  //     for (let i = 0; i < usersLength; i += 100) {
  //       const requests = users.slice(i, i + 100).map((user) => { // The batch size is 100. We are processing in a set of 100 users.
  //         return triggerMailForUser(user) // Async function to send the mail.
  //             .catch(e => console.log(`Error in sending email for ${user} - ${e}`)) // Catch the error if something goes wrong. So that it won't block the loop.
  //       })
  //
  //       // requests will have 100 or less pending promises.
  //       // Promise.all will wait till all the promises got resolves and then take the next 100.
  //       await Promise.all(requests)
  //           .catch(e => console.log(`Error in sending email for the batch ${i} - ${e}`)) // Catch the error.
  //     }
  //   }
  //
  //
  //   sendMailForUsers(userLists)
  // }
}

module.exports = PrinterManagerService;
