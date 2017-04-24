'use strict';

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var webpack = require('webpack');
var configFactory = require('./dev');

/**
 * Config generates bundle without dependencies as minified version (handsontable.min.js and handsontable.min.css).
 */
module.exports.create = function create(options) {
  var config = configFactory.create(options);

  config.devtool = false;
  config.output.filename = config.output.filename.replace(/\.js$/, '.min.js');

  // Remove all 'ExtractTextPlugin' instances
  config.plugins = config.plugins.filter(function(plugin) {
    return !(plugin instanceof ExtractTextPlugin);
  });

  config.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false,
        screw_ie8: true,
      },
      mangle: {
        screw_ie8: true,
      },
      output: {
        comments: /^!|@preserve|@license|@cc_on/i,
        screw_ie8: true,
      },
    }),
    new ExtractTextPlugin(options.OUTPUT_FILENAME + '.min.css'),
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.min\.css$/,
    })
  );

  return config;
}
