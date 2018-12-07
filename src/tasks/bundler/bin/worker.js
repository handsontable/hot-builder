'use strict';

process.env.BABEL_ENV = 'commonjs';

var webpack = require('webpack');
var configFactory = require('./../configs');

(function main() {
  var options;

  try {
    options = JSON.parse(process.argv[2]);
  } catch (ex) {
    throw Error('Invalid JSON was provided.');
  }
  if (configFactory.VALID_CONFIGS.indexOf(options.configName) === -1) {
    throw Error('Invalid task name was provided.');
  }

  var task = configFactory.create(options);

  task.use(require('./../configs/' + options.configName));

  /* eslint-disable no-unused-vars */
  webpack(task.getConfig(), function(err, stats) { });
}());
