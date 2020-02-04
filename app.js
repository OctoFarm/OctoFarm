const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose");
const flash = require("connect-flash");
const session = require("express-session");
const passport = require("passport");
const WebSocket = require("ws");

const app = express();

//Passport Config
require("./config/passport.js")(passport);

//DB Config
const db = require("./config/db.js").MongoURI;

//Mongo Connect
mongoose
  .connect(db, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected..."))
  .catch(err => console.log(err));

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

//Routes
app.use(express.static(__dirname + "/views"));
if (db === "") {
  app.use("/", require("./routes/index", { page: "route" }));
} else {
  app.use("/", require("./routes/index", { page: "route" }));
  app.use("/users", require("./routes/users", { page: "route" }));
  app.use("/printers", require("./routes/printers", { page: "route" }));
  app.use("/settings", require("./routes/settings", { page: "route" }));
  app.use("/client", require("./routes/dash", { page: "route" }));
}

//Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, console.log(`Server started on port ${PORT}`));
if (db != "") {
  //Setup Settings
  const serverSettings = require("./settings/serverSettings.js");
  const ServerSettings = serverSettings.ServerSettings;
  ServerSettings.init();
  const clientSettings = require("./settings/clientSettings.js");
  const ClientSettings = clientSettings.ClientSettings;
  ClientSettings.init();
  //Start backend metrics gathering...
  const runner = require("./runners/state.js");
  const Runner = runner.Runner;
  Runner.init();
  /*   const system = require("./runners/systemInfo.js");
  const SystemRunner = system.SystemRunner;
  SystemRunner.init(); */
  // const stats = require("./runners/statisticsCollection.js");
  // const StatisticsCollection = stats.StatisticsCollection;
  // StatisticsCollection.init();
}

//Web Socket Setup
const wss = new WebSocket.Server({
  port: 4001,
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    serverMaxWindowBits: 10, // Defaults to negotiated value.
    // Below options specified as default values.
    concurrencyLimit: 10, // Limits zlib concurrency for perf.
    threshold: 1024 // Size (in bytes) below which messages
    // should not be compressed.
  }
});
wss.on("connection", function connection(ws) {
  ws.on("message", function incoming(message) {
    console.log("received: %s", message);
  });
  let data = [{ data: "hello" }];
  setInterval(function() {
    ws.send(data);
  }, 3000);
});
console.log("TEST")