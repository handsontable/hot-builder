'use strict';

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');
var webpack = require('webpack');

module.exports.create = function create(options) {
  var config = {
    devtool: false,
    cache: false,
    entry: path.resolve(options.input, 'src/index.js'),
    output: {
      library: 'Handsontable',
      libraryTarget: 'umd',
      libraryExport: 'default',
      umdNamedDefine: true,
      path: options.outputDir,
    },
    resolve: {
      alias: {},
    },
    resolveLoader: {
      modules: [path.resolve(options.input, '.config/loader'), path.resolve(options.input, 'node_modules'), 'node_modules'],
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
          loader: 'empty-loader',
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          exclude: [
            /node_modules/,
          ],
          options: {
            root: path.resolve(options.input),
            envName: 'commonjs',
            cacheDirectory: false,
            plugins: [
              [require('../plugins/moduleExcluder'), {excludedModules: options.removeModule}]
            ],
          },
        },
      ]
    },
    plugins: [
      new webpack.BannerPlugin(options.LICENSE),
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
