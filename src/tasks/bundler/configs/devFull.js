'use strict';

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var path = require('path');
var configFactory = require('./base');

/**
 * Config generates bundle with included all dependencies (handsontable.full.js and handsontable.full.css).
 */
module.exports.create = function create(options) {
  var config = configFactory.create(options);

  config.output.filename = options.OUTPUT_FILENAME + '.full.js';
  config.module.rules.unshift({
    test: /numbro/,
    use: [{
      loader: path.resolve(__dirname, '../loaders/exports-to-window-loader.js'),
      options: {
        numbro: 'numbro',
      }
    }]
  });
  config.module.rules.unshift({
    test: /moment/,
    use: [{
      loader: path.resolve(__dirname, '../loaders/exports-to-window-loader.js'),
      options: {
        moment: 'moment',
      }
    }]
  });

  config.plugins.push(
    new ExtractTextPlugin(options.OUTPUT_FILENAME + '.full.css')
  );

  return config;
}