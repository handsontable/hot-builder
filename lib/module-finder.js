
var fs = require('fs');
var glob = require('glob');
var ModuleItem = require('./module-item');
var path = require('path');

module.exports = function moduleFinder(paths, options) {
  return new ModuleFinder(paths);
};

/**
 * @param {Array} paths Array of Objects
 * @constructor
 */
function ModuleFinder(paths) {
  this.paths = paths;
  this.items = [];
  this.find();
}

/**
 * Find and collect found modules
 */
ModuleFinder.prototype.find = function() {
  var _this = this,
    modulePaths;

  function addModule(moduleOptions) {
    var item;

    item = new ModuleItem(moduleOptions);
    _this.items.push(item);
  }

  // Collect ours modules
  this.paths.forEach(function(pathObject) {
    if (pathObject.npm) {
      modulePaths = glob.sync(pathObject.path);
    }
    else if (pathObject.type === 'dir') {
      modulePaths = glob.sync(pathObject.path + '/*/');
    }
    else {
      modulePaths = [pathObject.path + path.sep];
    }

    modulePaths.forEach(function(modulePath) {
      var copyableFiles = [],
        files, moduleName, globalNS, moduleOptions;

      if (pathObject.npm) {
        moduleName = modulePath.match(/[a-z\-]+$/)[0];

        if (Object.keys(pathObject.modulesDescriptor).indexOf(moduleName) === -1) {
          return;
        }
        files = pathObject.modulesDescriptor[moduleName].include || [];
        copyableFiles = pathObject.modulesDescriptor[moduleName].copyable || [];
        globalNS = pathObject.modulesDescriptor[moduleName].global;
      }
      else {
        // We search only js and css files.
        files = glob.sync('*(@([^_]*).js|@([^_]*).css)', {
          cwd: modulePath
        });
      }
      files = files.map(function(fileName) {
        return path.resolve(path.join(modulePath, fileName));
      });
      copyableFiles = copyableFiles.map(function(fileName) {
        return path.resolve(path.join(modulePath, fileName));
      });

      moduleOptions = {
        path: modulePath,
        files: files,
        copyable: copyableFiles,
        isExternal: pathObject.external,
        globalNS: globalNS,
        isPro: pathObject.isPro
      };

      if (pathObject.type === 'file') {
        files.forEach(function(file) {
          moduleOptions.files = [file];
          addModule(moduleOptions);
        });
      } else {
        addModule(moduleOptions);
      }
    });
  });

  this.prepareAllDependencies();
};

/**
 * Prepare all dependencies. Replace array of strings into array of ModuleItem.
 */
ModuleFinder.prototype.prepareAllDependencies = function() {
  var _this = this;

  function fillDependency(deps) {
    var module;

    for (var i = 0, len = deps.length; i < len; i++) {
      // Dependencies has already filled so skip it
      if (deps[i] instanceof ModuleItem) {
        continue;
      }
      module = _this.getModuleByName(deps[i]);

      if (!module) {
        throw new Error('Module ' + deps[i] + ' not found');
      }
      deps[i] = module;
      fillDependency(module.dependencies);
    }
  }

  this.items.forEach(function(item) {
    fillDependency(item.dependencies);
  });
};

/**
 * Get all found modules
 *
 * @returns {Array}
 */
ModuleFinder.prototype.getModules = function() {
  return this.items;
};

/**
 * Get all found modules sorted by it's name
 */
ModuleFinder.prototype.getModulesSortedByName = function() {
  return this.items.slice().sort(sortByName);
};

/**
 * Get module by his name
 *
 * @param {String} name
 * @returns {EntryFile|null}
 */
ModuleFinder.prototype.getModuleByName = function(name) {
  var _module = null,
    len = this.items.length;

  while (len --) {
    if (name === this.items[len].name) {
      _module = this.items[len];
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
