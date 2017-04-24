'use strict';

var objectClone = require('clone');
var commandGenerator = require('./../../helpers/commandGenerator');
var workerManager = require('./../../worker/manager');

/**
 * Install all modules by executing `npm install` into cloned repository.
 *
 * @param  {Object} data An object with options passed as an arguments to CLI (`.options`) and ProjectDescriptor instance (`.project`).
 */
module.exports = function depsInstall(data) {
  return new Promise(function(resolve, reject) {
    var commandOptions = objectClone(data.options);
    var command = {
      command: commandGenerator('depsInstaller', commandOptions),
      description: 'Installing all necessary dependencies...',
    };

    workerManager([command], data.options, function(killed) {
      if (killed) {
        reject();
      } else {
        resolve(data);
      }
    }, function() {
      reject();
    });
  });
}
