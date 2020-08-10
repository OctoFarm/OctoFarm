const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const ServerSettingsDB = require("./models/ServerSettings");
const Logger = require("./lib/logger.js");

const logger = new Logger("OctoFarm-Server");
const printerClean = require("./lib/dataFunctions/printerClean.js");

const { PrinterClean } = printerClean;

// Server Port
const app = express();

// Passport Config
require("./config/passport.js")(passport);

// DB Config
const db = require("./config/db.js").MongoURI;

// JSON
app.use(express.json());

// EJS
app.use(expressLayouts);
app.set("view engine", "ejs");

// Bodyparser
app.use(express.urlencoded({ extended: false }));

// Express Session Middleware
app.use(
    session({
        secret: "supersecret",
        resave: true,
        saveUninitialized: true,
    })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect Flash Middleware
app.use(flash());

// Global Vars
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    res.locals.error = req.flash("error");
    next();
});

const setupServerSettings = async () => {
    const serverSettings = require("./settings/serverSettings.js");
    const { ServerSettings } = serverSettings;
    await logger.info("Checking Server Settings...");
    const ss = await ServerSettings.init();
    // Setup Settings
    await logger.info(ss);
};

const serverStart = async () => {
    try {
        await logger.info("MongoDB Connected...");
        // Find server Settings
        // Initialise farm information
        const farmInformation = await PrinterClean.initFarmInformation();
        await logger.info(farmInformation);
        const settings = await ServerSettingsDB.find({});
        const clientSettings = require("./settings/clientSettings.js");
        const { ClientSettings } = clientSettings;
        await logger.info("Checking Client Settings...");
        const cs = await ClientSettings.init();
        await logger.info(cs);
        const runner = require("./runners/state.js");
        const { Runner } = runner;
        const rn = await Runner.init();
        await logger.info("Printer Runner has been initialised...", rn);
        const PORT = process.env.PORT || settings[0].server.port;
        await logger.info("Starting System Information Runner...");
        const system = require("./runners/systemInfo.js");
        const { SystemRunner } = system;
        const sr = await SystemRunner.init();
        await logger.info(sr);
        app.listen(PORT, () => {
            logger.info(`HTTP server started...`);
            logger.info(`You can now access your server on port: ${PORT}`);
            // eslint-disable-next-line no-console
            console.log(`You can now access your server on port: ${PORT}`);
        });
    } catch (err) {
        await logger.error(err);
    }

    // Routes
    app.use(express.static(`${__dirname}/views`));
    app.use(`/images`,express.static(`${__dirname}/images`));
    if (db === "") {
        app.use("/", require("./routes/index", { page: "route" }));
    } else {
        try {
            app.use("/", require("./routes/index", { page: "route" }));
            app.use("/serverChecks", require("./routes/serverChecks", { page: "route" }));
            app.use("/users", require("./routes/users", { page: "route" }));
            app.use("/printers", require("./routes/printers", { page: "route" }));
            app.use("/settings", require("./routes/settings", { page: "route" }));
            app.use(
                "/printersInfo",
                require("./routes/SSE-printersInfo", { page: "route" })
            );
            app.use(
                "/dashboardInfo",
                require("./routes/SSE-dashboard", { page: "route" })
            );
            app.use(
                "/monitoringInfo",
                require("./routes/SSE-monitoring", { page: "route" })
            );
            app.use("/filament", require("./routes/filament", { page: "route" }));
            app.use("/history", require("./routes/history", { page: "route" }));
            app.use("/scripts", require("./routes/scripts", { page: "route" }));
        } catch (e) {
            await logger.error(e);
            // eslint-disable-next-line no-console
            console.log(e);
        }
    }
};
// Mongo Connect
mongoose
    .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => setupServerSettings())
    .then(() => serverStart())
    .catch((err) => logger.error(err));
