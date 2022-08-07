const path = require("path");
const fs = require("fs");
const { fromPairs } = require("lodash");
const WebpackBeforeBuildPlugin = require("before-build-webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const webpack = require("webpack");

// Source
const basePath = "./";
const clientJSFolder = basePath + "/js/";
const clientCSSFolder = basePath + "/css/";
const dirContents = fs.readdirSync(clientJSFolder, { withFileTypes: true });
const dirCssContents = fs.readdirSync(clientCSSFolder, { withFileTypes: true });
const packageJsonPath = path.join(__dirname, "../package.json");
const packageJsonVersion = require(packageJsonPath).version;

// Target
const insideBasePath = "../server/views/assets/";
const buildDirDev = insideBasePath + "dist/";

const webpackEntries = fromPairs(
  dirContents
    .filter((dirEntry) => dirEntry.isFile())
    .map((file) => {
      return [path.parse(file.name).name, clientJSFolder + file.name];
    })
    .concat(
      dirCssContents
        .filter((file) => file.name.includes("css"))
        .map((file) => [
          path.parse(file.name).name,
          clientCSSFolder + file.name,
        ])
    )
);

webpackEntries["vendor"] = `${clientJSFolder}vendor/entry.js`;
webpackEntries["bootstrap"] = "bootstrap/dist/js/bootstrap.bundle";

module.exports = (env, options) => {
  const isProd = options.mode === "production";
  const chosenBuildDir = isProd ? buildDirDev : buildDirDev;
  const fullDir = path.resolve(__dirname, chosenBuildDir);
  return {
    entry: webpackEntries,
    output: {
      filename: `[name].${packageJsonVersion}.min.js`,
      path: fullDir,
    },
    externals: {
      jquery: "jQuery",
      bootbox: "bootbox",
    },
    mode: isProd ? "production" : "development",
    devtool: "source-map",
    node: {
      global: false,
      __filename: false,
      __dirname: false,
    },
    optimization: {
      minimize: env.production,
      minimizer: [
        // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
        "...",
        new CssMinimizerPlugin(),
      ],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          enforce: "pre",
          use: ["source-map-loader"],
        },
        {
          test: /\.css$/i,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: "css-loader",
              options: {
                url: false, // leave url() intact
                importLoaders: 1,
                sourceMap: true,
              },
            },
          ],
        },
        // In case you want images to become dist assets use this
        // Then look at https://webpack.js.org/loaders/file-loader/
        // {
        //   test: /\.(png|jpe?g|gif)$/i,
        //   use: [
        //     'ignore-loader'
        //   ],
        //   // type: 'asset/resource',
        // },
      ],
    },
    plugins: [
      // new SourceMapDevToolPlugin(),
      new webpack.ProvidePlugin({
        // We dont bundle jquery
        // 'window.jQuery': 'jquery',
        Noty: "Noty",
        // 'bootbox': 'bootbox',
      }),
      new MiniCssExtractPlugin({
        // filename: dirCssContents[0].name,
        chunkFilename: `[id].${packageJsonVersion}.css`,
      }),
      new WebpackBeforeBuildPlugin(
        function (stats, callback) {
          const newlyCreatedAssets = stats.compilation.assets;
          const unlinked = [];
          const localDirContents = fs.readdirSync(
            path.resolve(chosenBuildDir),
            {
              withFileTypes: true,
            }
          );
          localDirContents.forEach((file) => {
            if (!newlyCreatedAssets[file.name] && file.isFile() && !isProd) {
              fs.unlinkSync(path.resolve(chosenBuildDir + file.name));
              unlinked.push(file.name);
            }
          });
          if (unlinked.length > 0) {
            console.warn("Removed old assets: ", unlinked);
          }

          callback();
        },
        ["done"]
      ),
    ],
  };
};
