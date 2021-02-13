const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const WebpackBeforeBuildPlugin = require('before-build-webpack');

const buildDir = 'views/assets/js/';
const clientJSFolder = './client_src/js/';
const dirContents = fs.readdirSync(clientJSFolder, {withFileTypes: true});
const webpackEntries = _.fromPairs(dirContents
  .filter(dirEntry => dirEntry.isFile())
  .map(file => {
    return [path.parse(file.name).name, clientJSFolder + file.name];
  }));

webpackEntries["vendor"] = `${clientJSFolder}vendor/entry.js`;

module.exports = {
  entry: webpackEntries,
  output: {
    filename: '[name].min.js',
    path: path.resolve(__dirname, buildDir),
  },
  mode: "development",
  optimization: {
    minimize: false, // Slow as shit
  },
  devtool: "source-map",
  node: {
    global: false,
    __filename: false,
    __dirname: false,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
    ],
  },
  plugins: [
    // new SourceMapDevToolPlugin(),
    new WebpackBeforeBuildPlugin(function (stats, callback) {
      const newlyCreatedAssets = webpackEntries;
      const unlinked = [];
      const dirContents = fs.readdirSync(path.resolve(buildDir), {withFileTypes: true});
      dirContents.forEach(file => {
        if (!newlyCreatedAssets[path.parse(file.name).name.split('.')[0]] && file.isFile()) {
          fs.unlinkSync(path.resolve(buildDir + file.name));
          unlinked.push(file.name);
        }
      });
      if (unlinked.length > 0) {
        console.warn('Removed old assets: ', unlinked);
      }

      callback();
    }, ['done']),
  ],
};
