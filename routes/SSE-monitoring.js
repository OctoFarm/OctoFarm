const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const {parse, stringify} = require('flatted/cjs');
const _ = require('lodash');
//Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
let clientInformation = null;

const printerClean = require("../lib/dataFunctions/printerClean.js");
const PrinterClean = printerClean.PrinterClean;
const settingsClean = require("../lib/dataFunctions/settingsClean.js");
const SettingsClean = settingsClean.SettingsClean;
const { getSorting, getFilter } = require("../lib/clientSorting.js");

let clientId = 0;
const clients = {}; // <- Keep a map of attached clients
let interval = false;

// Called once for each new client. Note, this response is left open!
router.get("/get/", ensureAuthenticated, function(req, res) {
    //req.socket.setTimeout(Number.MAX_VALUE);
    res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": 0,
        "Connection": "keep-alive"
    });
    res.write("\n");
    (function(clientId) {
        clients[clientId] = res; // <- Add this client to those we consider "attached"
        req.on("close", function() {
            delete clients[clientId];
        }); // <- Remove this client when he disconnects
    })(++clientId);
    //console.log("Client: " + Object.keys(clients));
});

if(interval === false){
    interval = setInterval(async function() {

        const currentOperations = await PrinterClean.returnCurrentOperations();

        const printersInformation = await PrinterClean.returnPrintersInformation();

        const printerControlList = await PrinterClean.returnPrinterControlList();
        const clientSettings = await SettingsClean.returnClientSettings();
        const infoDrop = {
            printersInformation: printersInformation,
            currentOperations: currentOperations,
            printerControlList: printerControlList,
            clientSettings: clientSettings
        };
        clientInformation = await stringify(infoDrop);
        for (clientId in clients) {
            for (clientId in clients) {
                clients[clientId].write("data: " + clientInformation + "\n\n"); // <- Push a message to a single attached client
            }
        }
    }, 500);
}


module.exports = router;