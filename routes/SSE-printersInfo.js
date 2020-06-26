const express = require("express");
const router = express.Router();
const { ensureAuthenticated } = require("../config/auth");
const {parse, stringify} = require('flatted/cjs');
//Global store of dashboard info... wonder if there's a cleaner way of doing all this?!
let clientInformation = null;

const printerClean = require("../lib/dataFunctions/printerClean.js");
const PrinterClean = printerClean.PrinterClean;

let clientId = 0;
let clients = {}; // <- Keep a map of attached clients
let interval = false;

// Called once for each new client. Note, this response is left open!
router.get("/get/", ensureAuthenticated, function(req, res) {
    //req.socket.setTimeout(Number.MAX_VALUE);
    res.writeHead(200, {
        "Content-Type": "text/event-stream", // <- Important headers
        "Cache-Control": "no-cache",
        Connection: "keep-alive"
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
    setInterval(async function() {
        let printersInformation = await PrinterClean.returnPrintersInformation();
        let printerControlList = await PrinterClean.returnPrinterControlList();
        let infoDrop = {
            printersInformation: printersInformation,
            printerControlList: printerControlList
        }
        clientInformation = await stringify(infoDrop);
        for (clientId in clients) {
            for (clientId in clients) {
                clients[clientId].write("data: " + clientInformation + "\n\n"); // <- Push a message to a single attached client
            }
        }
    }, 500);
}


module.exports = router;