'use strict';

/**
 * Config responsible for building minified Handsontable `dist/languages/` files.
 */
var webpack = require('webpack');
var configFactory = require('./langDev');

module.exports.create = function create(options) {
  var config = configFactory.create(options);

  config.output.filename = '[name].min.js';
  config.plugins = [
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        pure_getters: true,
        warnings: false,
        screw_ie8: true
      },
      mangle: {
        screw_ie8: true
      },
      output: {
        comments: /^!|@preserve|@license|@cc_on/i,
        screw_ie8: true
      }
    })
  ];

  return config;
};
