'use strict'

var fs = require('fs');
var glob = require('glob');
var path = require('path');
var ItemDescriptor = require('./itemDescriptor');

module.exports = function modulesDiscover(project) {
  return new ModulesDiscover(project);
};

/**
 * @param {Array} project The project object.
 * @constructor
 */
function ModulesDiscover(project) {
  this.project = project;
  this.discoveredModules = [];
  this.discover();
}

/**
 * Find and collect found modules
 */
ModulesDiscover.prototype.discover = function() {
  var modulePaths;

  // TODO: Already we support only plugins/*.
  modulePaths = glob.sync(fs.realpathSync(this.project.getPath()) + '/src/plugins/*/');

  if (this.project.isPro()) {
    modulePaths = modulePaths.concat(glob.sync(fs.realpathSync(this.project.getPath()) + '/node_modules/handsontable/src/plugins/*/'));
  }

  modulePaths.forEach(function(modulePath) {
    // Searching only js files (ignoring tests).
    var files = glob.sync('**/*(@([^_]*).js)', {
      cwd: modulePath,
      ignore: ['test/**'],
    }).map(function(fileName) {
      return path.resolve(path.join(modulePath, fileName));
    });

    var item = new ItemDescriptor({
      path: modulePath,
      files: files,
    }); this.discoveredModules.push(item);
  }, this);

  this.prepareAllDependencies();
};

/**
 * Replace an array of strings into an array of ItemDescriptors.
 */
ModulesDiscover.prototype.prepareAllDependencies = function() {
  var _this = this;

  function fillDependency(deps) {
    var module;

    for (var i = 0, len = deps.length; i < len; i++) {
      // Dependencies has already filled so skip it
      if (deps[i] instanceof ItemDescriptor) {
        continue;
      }
      module = _this.getModuleByName(deps[i]);

      if (!module) {
        throw Error('Module ' + deps[i] + ' not found');
      }
      deps[i] = module;
      fillDependency(module.dependencies);
    }
  }

  this.discoveredModules.forEach(function(item) {
    fillDependency(item.dependencies);
  });
};

/**
 * Get all found modules
 *
 * @returns {Array}
 */
ModulesDiscover.prototype.getModules = function() {
  return this.discoveredModules;
};

/**
 * Get all found modules sorted by it's name
 */
ModulesDiscover.prototype.getModulesSortedByName = function() {
  return this.discoveredModules.sort(sortByName);
};

/**
 * Get module by his name
 *
 * @param {String} name
 * @returns {EntryFile|null}
 */
ModulesDiscover.prototype.getModuleByName = function(name) {
  var _module = null;
  var len = this.discoveredModules.length;

  while (len --) {
    if (name === this.discoveredModules[len].name) {
      _module = this.discoveredModules[len];
      break;
    }
  }

  return _module;
};

function sortByName(a, b) {
  if (a.name > b.name) {
    return 1;
  }
  if (a.name < b.name) {
    return -1;
  }

  return 0;
}
