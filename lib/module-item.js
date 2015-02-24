
var fs = require('fs');
var path = require('path');

module.exports = ModuleItem;

/**
 * @param {String} path
 * @param {Array} files
 * @constructor
 */
function ModuleItem(path, files) {
  this.path = path;
  this.files = files;
  this.type = null;
  this.name = '';
  this.dependencies = [];

  this.hydrate();
}

ModuleItem.TYPE_PLUGIN = 'plugin';
ModuleItem.TYPES = [ModuleItem.TYPE_PLUGIN];

/**
 * Get all files
 *
 * @returns {Array}
 */
ModuleItem.prototype.getFiles = function() {
  var _this = this;

  return this.files.map(function(file) {
    return _this.path + file;
  });
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
 *
 * @returns {Array}
 */
ModuleItem.prototype.getAllDependencies = function(moduleItem) {
  var deps = [];

  if (!moduleItem) {
    moduleItem = this;
  }
  if (!moduleItem.dependencies.length) {
    return deps;
  }
  for (var i = 0; i < moduleItem.dependencies.length; i++) {
    deps.push(moduleItem.dependencies[i]);
    deps = Array.prototype.concat(deps, this.getAllDependencies(moduleItem.dependencies[i]));
  }

  return deps;
};

/**
 * Check is module is a plugin
 *
 * @returns {Boolean}
 */
ModuleItem.prototype.isPlugin = function() {
  return this.type === ModuleItem.TYPE_PLUGIN;
};

/**
 * Classify module and read all necessary informations from source code
 */
ModuleItem.prototype.hydrate = function() {
  var files = this.getJSFiles(), source;

  for (var i = 0, len = files.length; i < len; i++) {
    source = fs.readFileSync(files[i]).toString();

    if (this._hydrate(source)) {
      break;
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
    classRe = /@class ([a-zA-Z ]+)/,
    dependenciesRe = /@dependencies ([a-zA-Z ]+)/,
    depsMatch, nameMatch, sourceCommentData, k;

  while (j) {
    j --;
    sourceCommentData = source.match(sourceCommentRe);
    k = sourceCommentData.length;

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
