'use strict';

var webpack = require('webpack');
var configFactory = require('./../configs');

(function main() {
  var options;

  try {
    options = JSON.parse(process.argv[2]);
  } catch (ex) {
    throw Error('Invalid JSON was provided.');
  }
  if (!configFactory.VALID_CONFIGS.includes(options.configName)) {
    throw Error('Invalid task name was provided.');
  }

  var task = configFactory.create(options);

  task.use(require('./../configs/' + options.configName));

  /* eslint-disable no-unused-vars */
  webpack(task.getConfig(), function(err, stats) { });
}());
