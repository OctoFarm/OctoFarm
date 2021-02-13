module.exports = {
  entry: {
    client: "./client_src/js/entry.js",
    // vendor: "./client_src/js/vendor/bootbox.min.js",
  },
  mode: "development",
  node: {
    global: false,
    __filename: false,
    __dirname: false,
  },
};
