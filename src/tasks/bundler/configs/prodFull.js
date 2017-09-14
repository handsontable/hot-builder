'use strict';

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var webpack = require('webpack');
var configFactory = require('./devFull');

/**
 * Config generates bundle with all included dependencies in minified version (handsontable.full.min.js and handsontable.full.min.css).
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
    new ExtractTextPlugin(options.OUTPUT_FILENAME + '.full.min.css'),
    new OptimizeCssAssetsPlugin({
      assetNameRegExp: /\.full\.min\.css$/,
    })
  );

  config.plugins.push(
    new CopyWebpackPlugin([
      { // hot-formula-parser
        from: {glob: options.input + '/node_modules/hot-formula-parser/LICENSE'}, to: 'hot-formula-parser', flatten: true
      },
      {
        from: {glob: options.input + '/node_modules/hot-formula-parser/dist/formula-parser.js'}, to: 'hot-formula-parser', flatten: true
      },
      { // moment
        from: {glob: options.input + '/node_modules/moment/@(moment.js|LICENSE)'}, to: 'moment', flatten: true
      },
      {
        from: {glob: options.input + '/node_modules/moment/locale/*.js'}, to: 'moment/locale', flatten: true
      },
      { // numbro
        from: {glob: options.input + '/node_modules/numbro/@(LICENSE-Numeraljs|LICENSE)'}, to: 'numbro', flatten: true
      },
      {
        from: {glob: options.input + '/node_modules/numbro/dist/@(numbro.js|languages.js)'}, to: 'numbro', flatten: true
      },
      {
        from: {glob: options.input + '/node_modules/numbro/dist/languages/*.js'}, to: 'numbro/languages', flatten: true
      },
      { // pikaday
        from: {glob: options.input + '/node_modules/pikaday/@(LICENSE|pikaday.js)'}, to: 'pikaday', flatten: true
      },
      {
        from: {glob: options.input + '/node_modules/pikaday/css/pikaday.css'}, to: 'pikaday', flatten: true
      },
    ])
  );

  return config;
}
