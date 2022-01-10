// In this file you can configure migrate-mongo
const { setupEnvConfig, fetchMongoDBConnectionString } = require("./app-env");

if (!process.env.MONGO) {
  setupEnvConfig();
}

const mongoDbString = fetchMongoDBConnectionString();

if (!mongoDbString) {
  throw new Error("Cant migrate as the MONGO= environment variable was not resolved.");
}

const config = {
  mongodb: {
    url: mongoDbString,

    // Dont override this unless you know what you are doing
    // databaseName: "octofarm",

    options: {
      useNewUrlParser: true, // removes a deprecation warning when connecting
      useUnifiedTopology: true // removes a deprecating warning when connecting
      //   connectTimeoutMS: 3600000, // increase connection timeout to 1 hour
      //   socketTimeoutMS: 3600000, // increase socket timeout to 1 hour
    }
  },

  // The migrations dir, can be an relative or absolute path. Only edit this when really necessary.
  migrationsDir: "migrations",

  // The mongodb collection where the applied changes are stored. Only edit this when really necessary.
  changelogCollectionName: "_migrations",

  // The file extension to create migrations and search for in migration dir
  migrationFileExtension: ".js",

  // Enable the algorithm to create a checksum of the file contents and use that in the comparison to determine
  // if the file should be run. Requires that scripts are coded to be run multiple times.
  useFileHash: false
};

// Return the config as a promise
module.exports = config;
