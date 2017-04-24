'use strict'

var fs = require('fs');

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
  this.name = '';
  this.dependencies = [];

  this.hydrate();
}

ItemDescriptor.TYPE_PLUGIN = 'plugin';
ItemDescriptor.TYPE_VALIDATOR = 'validator';
ItemDescriptor.TYPE_RENDERER = 'renderer';
ItemDescriptor.TYPE_EDITOR = 'editor';
ItemDescriptor.TYPE_EXTERNAL = 'external';
ItemDescriptor.TYPE_INTERNAL = 'internal';
ItemDescriptor.TYPES = [ItemDescriptor.TYPE_PLUGIN, ItemDescriptor.TYPE_VALIDATOR, ItemDescriptor.TYPE_RENDERER, ItemDescriptor.TYPE_EDITOR];

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
 * Checks whether the module is a validator.
 *
 * @returns {Boolean}
 */
ItemDescriptor.prototype.isValidator = function() {
  return this.type === ItemDescriptor.TYPE_VALIDATOR;
};

/**
 * Checks whether the module is a renderer.
 *
 * @returns {Boolean}
 */
ItemDescriptor.prototype.isRenderer = function() {
  return this.type === ItemDescriptor.TYPE_RENDERER;
};

/**
 * Checks whether the module is a editor.
 *
 * @returns {Boolean}
 */
ItemDescriptor.prototype.isEditor = function() {
  return this.type === ItemDescriptor.TYPE_EDITOR;
};

/**
 * Classify module and read all necessary informations from the source code.
 */
ItemDescriptor.prototype.hydrate = function() {
  var files;
  var source;

  files = this.getFiles();

  for (var i = 0, len = files.length; i < len; i++) {
    source = fs.readFileSync(files[i]).toString();

    if (this._hydrate(source)) {
      break;
    }
  }
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
  var classRe = /@(?:component|plugin|util|renderer|editor|validator) ([a-zA-Z ]+)/;
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
            return dep !== '';
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
