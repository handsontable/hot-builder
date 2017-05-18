'use strict';

var chalk = require('chalk');
var inquirer = require('inquirer');

 /**
  * Show terminal-like UI with all available plugins to select.
  *
  * @param  {Object} data An object with options passed as an arguments to CLI (`.options`) and ProjectDescriptor instance (`.project`).
  */
module.exports = function showUIPrompt(data) {
  var choices = [];
  var labels = {
    plugin: {
      label: new inquirer.Separator(chalk.yellow('Plugins (free):')),
      modules: [],
    },
    pluginPro: {
      label: new inquirer.Separator(chalk.yellow('Plugins (pro):')),
      modules: [],
    }
  };

  choices.push(new inquirer.Separator());

  data.project.getModulesSortedByName().forEach(function(module) {
    var type = module.type;

    if (module.isPro()) {
      type = type + 'Pro';
    }
    labels[type].modules.push(module);
  }, this);

  Object.keys(labels).forEach(function(labelKey) {
    var label = labels[labelKey];

    if (label.modules.length) {
      choices.push(label.label);
    }
    label.modules.forEach(function(module) {
      choices.push({
        name: module.name
      });
    });
  });

  return inquirer.prompt([{
      type: 'checkbox',
      message: 'Select modules that will be used to build your custom Handsontable distribution package',
      name: 'modules',
      choices: choices,
      pageSize: 10,
    }
  ]).then(function(selected) {
    data.options.addModule = selected.modules;

    return data;
  });
}
