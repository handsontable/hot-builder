
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
 * Find and collect founded modules
 */
ModuleFinder.prototype.find = function() {
  var _this = this,
    modulePaths;

  // Collect ours modules
  this.paths.forEach(function(pathObject) {
    if (pathObject.npm) {
      modulePaths = glob.sync(pathObject.path);
    } else {
      modulePaths = glob.sync(pathObject.path + '/*/');
    }

    modulePaths.forEach(function(modulePath) {
      var copyableFiles = [],
        item, files, moduleName, globalNS;

      if (pathObject.npm) {
        moduleName = modulePath.match(/[a-z\-]+$/)[0];

        if (Object.keys(pathObject.modulesDescriptor).indexOf(moduleName) === -1) {
          return;
        }
        files = pathObject.modulesDescriptor[moduleName].include || [];
        copyableFiles = pathObject.modulesDescriptor[moduleName].copyable || [];
        globalNS = pathObject.modulesDescriptor[moduleName].global;

      } else {
        // Actually we search only js and css files
        files = glob.sync('*(*.js|*.css)', {
          cwd: modulePath
        });
      }
      files = files.map(function(fileName) {
        return path.resolve(path.join(modulePath, fileName));
      });
      copyableFiles = copyableFiles.map(function(fileName) {
        return path.resolve(path.join(modulePath, fileName));
      });

      item = new ModuleItem({
        path: modulePath,
        files: files,
        copyable: copyableFiles,
        isExternal: pathObject.external,
        globalNS: globalNS
      });
      _this.items.push(item);
    });
  });

  this.items.forEach(function(item) {
    var deps;

    if (!item.dependencies.length) {
      return;
    }
    deps = item.dependencies;

    for (var i = 0, len = deps.length; i < len; i++) {
      deps[i] = _this.getModuleByName(deps[i]);
    }
  });
};

/**
 * Get all founded modules
 *
 * @returns {Array}
 */
ModuleFinder.prototype.getModules = function() {
  return this.items;
};

/**
 * Get module by his name
 *
 * @param {String} name
 * @returns {ModuleItem|null}
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
