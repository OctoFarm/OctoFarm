const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const ServerSettingsDB = require("./models/ServerSettings");
const Logger = require('./lib/logger.js');
const logger = new Logger('OctoFarm-Server');




//Server Port


const app = express();


//Passport Config
require("./config/passport.js")(passport);

//DB Config
const db = require("./config/db.js").MongoURI;

//JSON
app.use(express.json());

//EJS
app.use(expressLayouts);
app.set("view engine", "ejs");

//Bodyparser
app.use(express.urlencoded({ extended: false }));

// Express Session Middleware
app.use(
    session({
        secret: "supersecret",
        resave: true,
        saveUninitialized: true
    })
);

//Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Connect Flash Middleware
app.use(flash());

//Global Vars
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
});

//Mongo Connect
mongoose
    .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => setupServerSettings())
    .then(() => serverStart())
    .catch(err => logger.error(err));

let setupServerSettings = async function() {
    const serverSettings = require("./settings/serverSettings.js");
    const ServerSettings = serverSettings.ServerSettings;
    logger.info("Checking Server Settings...");
    let ss = await ServerSettings.init();
    //Setup Settings
    logger.info(ss);
    return;
}


let serverStart = async function() {
    try{
        logger.info("MongoDB Connected...");
        //Find server Settings
        let settings = await ServerSettingsDB.find({});
        const clientSettings = require("./settings/clientSettings.js");
        const ClientSettings = clientSettings.ClientSettings;
        logger.info("Checking Client Settings...");
        let cs = await ClientSettings.init();
        logger.info(cs);
        //Start backend metrics gathering...
        logger.info("Starting Statistics Collection");
        const statisticsCollection = require("./runners/statisticsCollection.js");
        const StatisticsCollection = statisticsCollection.StatisticsCollection;
        let sc = await StatisticsCollection.init();
        logger.info(sc);
        const runner = require("./runners/state.js");
        const Runner = runner.Runner;
        let r = Runner.init();
        logger.info("Starting System Information Runner...");
        const system = require("./runners/systemInfo.js");
        const SystemRunner = system.SystemRunner;
        let sr = await SystemRunner.init();
        logger.info(sr);
        const PORT = process.env.PORT || settings[0].server.port;
        app.listen(PORT, () => {
            logger.info(`HTTP server started...`);
            logger.info(`You can now access your server on port: ${PORT}`);
        });
    }catch(err){
        logger.error(err)
    }

//Routes
    app.use(express.static(__dirname + '/views'));
    if (db === "") {
        app.use("/", require("./routes/index", { page: "route" }));
    } else {
        app.use("/", require("./routes/index", { page: "route" }));
        app.use("/users", require("./routes/users", { page: "route" }));
        app.use("/printers", require("./routes/printers", { page: "route" }));
        app.use("/settings", require("./routes/settings", { page: "route" }));
        app.use("/sse", require("./routes/SSE", { page: "route" }));
        app.use("/filament", require("./routes/filament", { page: "route" }));
        app.use("/history", require("./routes/history", { page: "route" }));
        app.use("/scripts", require("./routes/scripts", { page: "route" }));
    }

};