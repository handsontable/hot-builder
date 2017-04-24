'use strict';

var objectClone = require('clone');
var commandGenerator = require('./../../helpers/commandGenerator');
var configFactory = require('./../../tasks/bundler/configs');
var logger = require('./../../helpers/logger');
var workerManager = require('./../../worker/manager');

 /**
  * Generate 4 different bundles.
  *
  * @param  {Object} data An object with options passed as an arguments to CLI (`.options`) and ProjectDescriptor instance (`.project`).
  */
module.exports = function generateBundles(data) {
  return new Promise(function(resolve, reject) {
    logger().info('Generating bundles:');

    var commands = [];

    configFactory.VALID_CONFIGS.forEach(function(configName) {
      var commandOptions = objectClone(data.options);
      var workerOptions = {padding: 2};

      commandOptions.configName = configName;
      commands.push({
        command: commandGenerator('bundler', commandOptions),
        description: configFactory.CONFIG_DESCRIPTIONS[configName],
        options: workerOptions,
      });
    });

    workerManager(commands, data.options, function(killed) {
      if (killed) {
        reject();
      } else {
        resolve(data);
      }
    }, function() {
      reject();
    });
  })
}
