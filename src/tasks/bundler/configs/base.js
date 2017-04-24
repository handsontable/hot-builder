'use strict';

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');
var webpack = require('webpack');

process.env.BABEL_ENV = 'commonjs';

module.exports.create = function create(options) {
  var config = {
    devtool: false,
    entry: path.resolve(options.input, 'src/index.js'),
    output: {
      library: 'Handsontable',
      libraryTarget: 'umd',
      umdNamedDefine: true,
      path: options.outputDir,
    },
    resolve: {
      alias: {
        handsontable: path.resolve(options.input, 'node_modules/handsontable/src/')
      },
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: 'css-loader',
          }),
        },
        {
          test: [
            // Disable loading languages from numbro and moment into final bundle
            /numbro\/languages/,
            /moment\/locale/,
          ],
          loader: path.resolve(__dirname, 'loaders/empty-loader.js'),
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: [
            /node_modules\/(?!handsontable)/,
          ],
          options: {
            cacheDirectory: false,
            plugins: [
              [require('../plugins/moduleExcluder'), {excludedModules: options.removeModule}]
            ],
          },
        },
      ]
    },
    plugins: [
      // This helps ensure the builds are consistent if source code hasn't changed
      new webpack.optimize.OccurrenceOrderPlugin(),
      new webpack.BannerPlugin(options.LICENSE),
      new webpack.DefinePlugin({
        '__HOT_VERSION__': JSON.stringify(options.PACKAGE_VERSION),
        '__HOT_PACKAGE_NAME__': JSON.stringify(options.PACKAGE_NAME),
        '__HOT_BUILD_DATE__': JSON.stringify(options.BUILD_DATE),
        '__HOT_BASE_VERSION__': JSON.stringify(options.BASE_VERSION),
      }),
    ],
    node: {
      global: false,
      process: false,
      Buffer: false,
      setImmediate: false,
    },
  };

  return config;
};
