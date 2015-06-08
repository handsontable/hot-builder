
var fs = require('fs');
var path = require('path');

module.exports = ModuleItem;

/**
 * @param {Object} options
 * @constructor
 */
function ModuleItem(options) {
  this.path = options.path;
  this.files = options.files;
  this.copyableFiles = options.copyable;
  this.external = options.isExternal || false;
  this.globalNS = options.globalNS || null;
  this.type = null;
  this.name = '';
  this.dependencies = [];

  this.hydrate();
}

ModuleItem.TYPE_PLUGIN = 'plugin';
ModuleItem.TYPE_VALIDATOR = 'validator';
ModuleItem.TYPE_RENDERER = 'renderer';
ModuleItem.TYPE_EDITOR = 'editor';
ModuleItem.TYPE_EXTERNAL = 'external';
ModuleItem.TYPES = [ModuleItem.TYPE_PLUGIN, ModuleItem.TYPE_VALIDATOR, ModuleItem.TYPE_RENDERER, ModuleItem.TYPE_EDITOR];

/**
 * Get all files which should be included to build process
 *
 * @returns {Array}
 */
ModuleItem.prototype.getFiles = function() {
  return this.files;
};

/**
 * Get all files which should be only copied to build directory
 *
 * @returns {Array}
 */
ModuleItem.prototype.getCopyableFiles = function() {
  return this.copyableFiles;
};

/**
 * Get javascript files
 *
 * @returns {Array}
 */
ModuleItem.prototype.getJSFiles = function() {
  return this.getFiles().filter(function(file) {
    return /\.js$/.test(file);
  });
};

/**
 * Get CSS files
 *
 * @returns {Array}
 */
ModuleItem.prototype.getCSSFiles = function() {
  return this.getFiles().filter(function(file) {
    return /\.css$/.test(file);
  });
};

/**
 * Get all module item dependencies
 *
 * @param {Number} [deepLevel=Infinity]
 * @returns {Array} Returns flat array with all module dependencies
 */
ModuleItem.prototype.getAllDependencies = function(deepLevel) {
  var iteration = 1;

  deepLevel = deepLevel || Infinity;

  function getAllDependencies(moduleItem, root) {
    var deps = [];

    if (iteration > deepLevel || !moduleItem.dependencies.length) {
      return deps;
    }
    for (var i = 0; i < moduleItem.dependencies.length; i++) {
      if (!(moduleItem.dependencies[i] instanceof ModuleItem)) {
        throw new Error('Dependency item must be instance of ModuleItem');
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
 * Checks is module is a plugin
 *
 * @returns {Boolean}
 */
ModuleItem.prototype.isPlugin = function() {
  return this.type === ModuleItem.TYPE_PLUGIN;
};

/**
 * Checks is module is a validator
 *
 * @returns {Boolean}
 */
ModuleItem.prototype.isValidator = function() {
  return this.type === ModuleItem.TYPE_VALIDATOR;
};

/**
 * Checks is module is a renderer
 *
 * @returns {Boolean}
 */
ModuleItem.prototype.isRenderer = function() {
  return this.type === ModuleItem.TYPE_RENDERER;
};

/**
 * Checks is module is a editor
 *
 * @returns {Boolean}
 */
ModuleItem.prototype.isEditor = function() {
  return this.type === ModuleItem.TYPE_EDITOR;
};

/**
 * Checks is module is a external module
 *
 * @returns {Boolean}
 */
ModuleItem.prototype.isExternal = function() {
  return this.type === ModuleItem.TYPE_EXTERNAL;
};

/**
 * Classify module and read all necessary informations from source code
 */
ModuleItem.prototype.hydrate = function() {
  var files, source;

  // For external modules we don't read information from source code
  if (this.external) {
    this.type = ModuleItem.TYPE_EXTERNAL;
    this.name = this.path.match(/\/([^\/]+)(\/)?$/)[1];
  } else {
    files = this.getJSFiles();

    for (var i = 0, len = files.length; i < len; i++) {
      source = fs.readFileSync(files[i]).toString();

      if (this._hydrate(source)) {
        break;
      }
    }
  }
};

/**
 * Fill object with all information about this module
 *
 * @param {String} source Source code of module
 * @returns {Boolean} Returns `true` if module is identified and filled
 */
ModuleItem.prototype._hydrate = function(source) {
  var j = ModuleItem.TYPES.length,
    sourceCommentRe = /(?:\/\*\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/g,
    classRe = /@(?:component|plugin|util|renderer|editor|validator) ([a-zA-Z ]+)/,
    dependenciesRe = /@dependencies ([a-zA-Z\.\-: ]+)/,
    depsMatch, nameMatch, sourceCommentData, k;

  while (j) {
    j --;
    sourceCommentData = source.match(sourceCommentRe);
    k = sourceCommentData ? sourceCommentData.length : 0;

    while (k) {
      k --;

      if (new RegExp('@' + ModuleItem.TYPES[j]).test(sourceCommentData[k])) {
        this.type = ModuleItem.TYPES[j];
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

        return true;
      }
    }
  }

  return false;
};
