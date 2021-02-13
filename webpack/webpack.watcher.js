const webpack = require("webpack");

function webpackBundler() {
  console.log(__dirname);
  const config = {
    mode: "development",
    entry: `${__dirname}/../client_src/js/entry.js`,
    output: {
      path: `${__dirname}/example`,
      filename: "app.min.js",
    },
  };
  const compiler = webpack(config);

  const watcher = compiler.watch({}, function (err, stats) {
    // Gets called every time Webpack finishes recompiling.
    console.log(
      stats.toString({
        chunks: false, // Makes the build much quieter
        colors: true, // Shows colors in the console
      })
    );
  });
}

module.exports = {
  webpackBundler,
};
