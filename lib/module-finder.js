
var _ = require('lodash');
var fs = require('fs');
var glob = require('glob');
var ModuleItem = require('./module-item');
var path = require('path');

module.exports = function moduleFinder(paths, options) {
  return new ModuleFinder(paths);
};

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

  // Collect ours external modules
  this.paths.forEach(function(path) {
    modulePaths = glob.sync(path + '/*/');

    _.forEach(modulePaths, function(modulePath) {
      var item, files;

      // Actually we search only js and css files
      files = glob.sync('*(*.js|*.css)', {
        cwd: modulePath
      });

      //console.log(files);

      item = new ModuleItem({path: modulePath, files: files});
      _this.items.push(item);
    });
  });
  // Collect external modules (libraries)
  // @TODO: path should be from config
  modulePaths = glob.sync('node_modules/handsontable/lib/*/');

  _.forEach(modulePaths, function(modulePath) {
    var item, files;

    // Actually we search only js and css files
    files = glob.sync('*(*.js|*.css)', {
      cwd: modulePath
    });

    item = new ModuleItem({path: modulePath, files: files, isExternal: true});
    _this.items.push(item);
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
