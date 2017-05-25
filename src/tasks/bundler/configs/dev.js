'use strict';

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var configFactory = require('./base');

/**
 * Config generates bundle without dependencies (handsontable.js and handsontable.css).
 */
module.exports.create = function create(options) {
  var config = configFactory.create(options);

  config.output.filename = options.OUTPUT_FILENAME + '.js';
  config.devtool = 'cheap-module-source-map';
  // Exclude all external dependencies from 'base' bundle (handsontable.js and handsontable.css files)
  config.externals = {
    numbro: {
      root: 'numbro',
      commonjs2: 'numbro',
      commonjs: 'numbro',
      amd: 'numbro',
    },
    moment: {
      root: 'moment',
      commonjs2: 'moment',
      commonjs: 'moment',
      amd: 'moment',
    },
    pikaday: {
      root: 'Pikaday',
      commonjs2: 'pikaday',
      commonjs: 'pikaday',
      amd: 'pikaday',
    },
    zeroclipboard: {
      root: 'ZeroClipboard',
      commonjs2: 'zeroclipboard',
      commonjs: 'zeroclipboard',
      amd: 'zeroclipboard',
    },
    'hot-formula-parser': {
      root: 'formulaParser',
      commonjs2: 'hot-formula-parser',
      commonjs: 'hot-formula-parser',
      amd: 'hot-formula-parser',
    },
  };
  config.module.rules.unshift({
    test: [
      // Disable loading css files from pikaday module
      /pikaday\/css/,
    ],
    loader: 'empty-loader',
  });
  config.plugins.push(
    new ExtractTextPlugin(options.OUTPUT_FILENAME + '.css')
  );

  return config;
}
