'use strict';

var chalk = require('chalk');
var logger = require('./../../helpers/logger');

 /**
  * Print statuses of found plugins.
  *
  * @param  {Object} data An object with options passed as an arguments to CLI (`.options`) and ProjectDescriptor instance (`.project`).
  */
module.exports = function printSelectedPlugins(data) {
  logger().info('Found ' + chalk.green(data.project.getModules().length) + ' plugins:');

  var plugins = [];

  data.project.getModules().forEach(function(module) {
    var isIncluded = data.options.removeModule.indexOf(module.name) === -1;
    var status = isIncluded ? chalk.green('[included]') : chalk.red('[excluded]');
    var name = chalk.yellow(module.name) + (module.isPro() ? chalk.cyan('*') : '');
    var nextLines = [];

    if (isIncluded) {
      module.dependencies.forEach(function(subModule, index, deps) {
        var prefix = (deps.length - 1) === index ? '  └──' : '  ├──';

        nextLines.push(prefix + ' Included dependency: ' + chalk.yellow(subModule.name));
      });
    }

    plugins.push({
      padding: ' ',
      name: name,
      status: status,
      nextLines: nextLines,
    });
  });

  var pluginLogs = '';

  plugins.forEach(function(p, index) {
    pluginLogs += p.padding + ' ' + p.name + ' ' + p.status;

    p.nextLines.forEach(function(line) {
      pluginLogs += '\n' + p.padding + line;
    });

    if (index < plugins.length - 1) {
      pluginLogs += '\n';
    }
  });
  logger().info(pluginLogs);

  if (data.project.isPro()) {
    logger().info('  ' + chalk.cyan('*') + ' - PRO plugin.');
  }

  return Promise.resolve(data);
}
