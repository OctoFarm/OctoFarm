const path = require('path');
const fs = require('fs');
const { fromPairs } = require('lodash');
const WebpackBeforeBuildPlugin = require('before-build-webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const webpack = require('webpack');

// Source
const basePath = './';
const clientJSFolder = basePath + '/entry/';
const clientCSSFolder = basePath + '/css/';
const clientImagesFolder = basePath + '/assets/';
const dirContents = fs.readdirSync(clientJSFolder, { withFileTypes: true });
const dirCssContents = fs.readdirSync(clientCSSFolder, { withFileTypes: true });

const packageJsonPath = path.join(__dirname, '../package.json');
const packageJsonVersion = require(packageJsonPath).version;

// Target
const buildDirProd = '../server/assets/';
const buildDirDev = basePath + 'assets/';

const webpackEntries = fromPairs(
  dirContents
    .filter((dirEntry) => dirEntry.isFile())
    .map((file) => {
      return [path.parse(file.name).name, clientJSFolder + file.name];
    })
    .concat(
      dirCssContents
        .filter((file) => file.name.includes('css'))
        .map((file) => [path.parse(file.name).name, clientCSSFolder + file.name])
    )
);

webpackEntries['vendor'] = `./js/vendor/entry.js`;
webpackEntries['bootstrap'] = 'bootstrap/dist/js/bootstrap.bundle';

module.exports = (env, options) => {
  const isProd = options.mode === 'production';
  const chosenBuildDir = isProd ? buildDirProd : buildDirDev;
  const fullDir = path.resolve(__dirname, chosenBuildDir);
  return {
    entry: webpackEntries,
    output: {
      filename: `js/[name].${packageJsonVersion}.min.js`,
      path: fullDir,
    },
    mode: isProd ? 'production' : 'development',
    devtool: 'source-map',
    target: "web",
    node: {
      global: false,
      __filename: false,
      __dirname: false,
    },
    externals: {
      jquery: 'jQuery',
      bootbox: 'bootbox',
    },
    optimization: {
      minimize: env.production,
      minimizer: [
        // For webpack@5 you can use the `...` syntax to extend existing minimizers (i.e. `terser-webpack-plugin`), uncomment the next line
        '...',
        new CssMinimizerPlugin(),
      ],
    },
    module: {
      rules: [
        {
          test: /\.(js)$/,
          exclude: /node_modules/,
          use: ['babel-loader']
        },
        {
          test: /\.js$/,
          enforce: 'pre',
          use: ['source-map-loader'],
        },
        {
          test: /\.css$/i,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                url: false, // leave url() intact
                importLoaders: 1,
                sourceMap: true,
              },
            },
          ],
        },
      ],
    },
    plugins: [
      // new SourceMapDevToolPlugin(),
      new webpack.ProvidePlugin({
        // We dont bundle jquery
        // 'window.jQuery': 'jquery',
        Noty: 'Noty',
        // 'bootbox': 'bootbox',
      }),
      new MiniCssExtractPlugin({
        // filename: dirCssContents[0].name,
        filename: `css/[name].${packageJsonVersion}.css`,
      }),
      new WebpackBeforeBuildPlugin(
        function (stats, callback) {
          const newlyCreatedAssets = stats.compilation.assets;
          const unlinked = [];
          const localDirContents = fs.readdirSync(path.resolve(chosenBuildDir), {
            withFileTypes: true,
          });
          localDirContents.forEach((file) => {
            if (!newlyCreatedAssets[file.name] && file.isFile() && !isProd) {
              fs.unlinkSync(path.resolve(chosenBuildDir + file.name));
              unlinked.push(file.name);
            }
          });
          if (unlinked.length > 0) {
            console.warn('Removed old assets: ', unlinked);
          }

          callback();
        },
        ['done']
      ),
    ],
  };
};
