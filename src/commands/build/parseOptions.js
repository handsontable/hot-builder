'use strict';

/**
 * Parse and extend options passed to CLI.
 *
 * @param  {Object} data An object with options passed as an arguments to CLI (`.options`) and ProjectDescriptor instance (`.project`).
 */
module.exports = function parseOptions(data) {
  var moduleNamesToExclude = data.project.getModulesSortedByName().map(function(m) {
    return m.name;
  });

  if (data.options.includeAll) {
    moduleNamesToExclude.length = 0;

    data.options.removeModule.forEach(function(moduleToRemove) {
      if (data.project.getModuleByName(moduleToRemove)) {
        moduleNamesToExclude.push(moduleToRemove);
      }
    });

  } else if (data.options.addModule.length) {
    data.options.addModule.forEach(function(moduleToAdd) {
      if (data.project.getModuleByName(moduleToAdd)) {
        moduleNamesToExclude.splice(moduleNamesToExclude.indexOf(moduleToAdd), 1);
      }
    });
  }

  data.options.removeModule = moduleNamesToExclude;

  return Promise.resolve(data);
}
