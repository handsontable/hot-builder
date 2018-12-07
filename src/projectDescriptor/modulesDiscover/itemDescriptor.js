'use strict'

var fs = require('fs');
var path = require('path');

module.exports = ItemDescriptor;

/**
 * @param {Object} options
 * @constructor
 */
function ItemDescriptor(options) {
  this.path = options.path;
  this.files = options.files;
  this.type = null;
  this.proModule = false,
  this.id = this.path.split(path.sep).slice(-2, -1);
  this.name = '';
  this.dependencies = [];

  this.hydrate();
}

ItemDescriptor.TYPE_PLUGIN = 'plugin';
ItemDescriptor.TYPES = [ItemDescriptor.TYPE_PLUGIN];

/**
 * Get all files which should be included to the build process.
 *
 * @returns {Array}
 */
ItemDescriptor.prototype.getFiles = function() {
  return this.files;
};

/**
 * Get all module item dependencies.
 *
 * @param {Number} [deepLevel=Infinity]
 * @returns {Array} Returns flat array with all module dependencies
 */
ItemDescriptor.prototype.getAllDependencies = function(deepLevel) {
  var iteration = 1;

  deepLevel = deepLevel === void 0 ? Infinity : deepLevel;

  function getAllDependencies(moduleItem, root) {
    var deps = [];

    if (iteration > deepLevel || !moduleItem.dependencies.length) {
      return deps;
    }
    for (var i = 0; i < moduleItem.dependencies.length; i++) {
      if (!(moduleItem.dependencies[i] instanceof ItemDescriptor)) {
        throw Error('Dependency item must be instance of ItemDescriptor');
      }
      if (root) {
        iteration = 2;
      } else {
        iteration ++;
      }
      deps.push(moduleItem.dependencies[i]);
      deps = Array.prototype.concat(deps, getAllDependencies(moduleItem.dependencies[i]));
    }

    return deps;
  }

  return getAllDependencies(this, true);
};

/**
 * Checks whether the module origin is handsontable-pro.
 *
 * @returns {Boolean}
 */
ItemDescriptor.prototype.isPro = function() {
  return this.proModule;
};

/**
 * Checks whether the module is a plugin.
 *
 * @returns {Boolean}
 */
ItemDescriptor.prototype.isPlugin = function() {
  return this.type === ItemDescriptor.TYPE_PLUGIN;
};

/**
 * Classify module and read all necessary informations from the source code.
 */
ItemDescriptor.prototype.hydrate = function() {
  var entryPoint = path.join(this.path, this.id + '.js');

  this.getFiles().forEach(function(file) {
    // Hydrate only entry point file
    if (entryPoint === file) {
      this._hydrate(fs.readFileSync(file).toString());
    }
  }, this);
};

/**
 * Fill object with all information about this module.
 *
 * @param {String} source Source code of module.
 * @returns {Boolean} Returns `true` if module is identified and filled.
 */
ItemDescriptor.prototype._hydrate = function(source) {
  var j = ItemDescriptor.TYPES.length;
  var sourceCommentRe = /(?:\/\*\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/g;
  var classRe = /@(?:plugin) ([a-zA-Z ]+)/;
  var dependenciesRe = /@dependencies ([a-zA-Z0-9\.\-: ]+)/;
  var proRe = /@pro/;
  var depsMatch, nameMatch, proMatch, sourceCommentData, k;

  while (j) {
    j --;
    sourceCommentData = source.match(sourceCommentRe);
    k = sourceCommentData ? sourceCommentData.length : 0;

    while (k) {
      k --;

      if (new RegExp('@' + ItemDescriptor.TYPES[j]).test(sourceCommentData[k])) {
        this.type = ItemDescriptor.TYPES[j];
        nameMatch = sourceCommentData[k].match(classRe);

        if (nameMatch && nameMatch.length === 2) {
          this.name = nameMatch[1];
        }
        depsMatch = sourceCommentData[k].match(dependenciesRe);

        if (depsMatch && depsMatch.length >= 2) {
          this.dependencies = depsMatch[1].split(' ').filter(function(dep) {
            var depNameFirstChar = dep.substr(0, 1);
            var pattern = depNameFirstChar.toUpperCase();

            // Hot internal dependencies are always started with a capital letter, so ignore not matched dependencies.
            // This fixes a bug #27 for older versions of the Handsontable.
            return pattern === depNameFirstChar && dep !== '';
          });
        }
        proMatch = sourceCommentData[k].match(proRe);

        if (proMatch && proMatch.length === 1) {
          this.proModule = true;
        }

        return true;
      }
    }
  }

  return false;
};
