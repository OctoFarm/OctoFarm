const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "OctoFarm express API with swagger",
      version: "0.1.0",
      description: "This is a WIP!",
      license: {
        name: "MIT",
        url: "https://spdx.org/licenses/MIT.html"
      },
      contact: {
        name: "James Mackay",
        url: "https://octofarm.net",
        email: "info@notexpectedyet.com"
      }
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Development server"
      }
    ]
  },
  apis: ["./routes/*.js"]
};

module.exports = options;
