var arrayUnique = require('./../utils/array-unique');
var BaseWorker = require('./_base-worker');
var browserify = require('browserify');
var browserifyDerequire = require('browserify-derequire');
var detachkify = require('./../transformers/detachkify');
var EntryFile = require('./../entry-file');
var es6ify = require('./../transformers/es6ify');
var fs = require('fs');
var inherits = require('inherits');
var labelMinifier = require('./../plugin/label-minifier');
var moduleNameKeeper = require('./../plugin/module-name-keeper');
var path = require('path');
var replacer = require('./../utils/replacer');
var resolve = require('resolve');
var UglifyJS = require('uglify-js');

var jsHeaderPath = path.join(__dirname, 'bundle-js-header.js');
var jsHeader = fs.readFileSync(jsHeaderPath, 'utf8');

module.exports = JSWorker;

inherits(JSWorker, BaseWorker);

/**
 * @param {Array} dependencyTree
 * @param {Object} [options]
 */
function JSWorker(dependencyTree, options) {
  this.dependencyTree = dependencyTree;
  this.options = options || {
    includeExternals: true
  };
}

/**
 * @param {EntryFile} entryFile
 * @param {Function} callback
 */
JSWorker.prototype.run = function(entryFile, callback) {
  var
    _this = this,
    baseFile = entryFile.getFile(EntryFile.TYPE_BASE),
    globalNS;

  this.b = browserify({
    entries: (entryFile.hasFile(EntryFile.TYPE_PRO) ? entryFile.getFile(EntryFile.TYPE_PRO) : baseFile).entryFile,
    basedir: baseFile.srcPath,
    debug: false,
    bundleExternal: false,
    standalone: 'Handsontable',
    detectGlobals: false,
    insertGlobals: false,
    prelude: jsHeader.replace('@@globalNS', JSON.stringify(this.getGlobalNSMap()))
  });

  this.b.on('error', function(err) {
    _this.emit('error', err);
  });

  var uniqModules = [];
  var modules = [];
  var ignoredModules = [];

  this.dependencyTree.forEach(function(module) {
    module.getIgnoredJSFiles().forEach(function(file) {
      _this.b.ignore(file);
    });

    if (module.isExternal() || module.isInternal()) {
      // Make flat array
      modules.push.apply(modules, module.getJSFiles());

      if (uniqModules.indexOf(module.name) === -1) {
        uniqModules.push(module.name);

        if (_this.options.includeExternals || module.isInternal()) {
          _this.b.require(module.getJSFiles(), {
            expose: module.name
          });

        } else {
          _this.b.ignore(module.name);
        }
      }
    } else {
      // The appropriate source code
      _this.b.add(module.getJSFiles());
    }
  });

  this.b.transform(es6ify({
    ignore: arrayUnique(modules)
  }));
  this.b.transform(detachkify, {
    prefix: 'handsontable',
    relativeTo: baseFile.srcPath,
    verbose: false
  });
  this.b.plugin(labelMinifier);
  this.b.plugin(moduleNameKeeper);
  this.b.plugin(browserifyDerequire);

  this.b.bundle(function(err, buf) {
    if (err) {
      return _this.emit('error', err);
    }
    // replace sourceURL injected by Traceur
    buf = buf.toString('utf8');
    buf = buf.replace(/sourceURL=.*/g, '');
    buf = replacer.replace(buf);

    callback(err, buf);
  });
};

/**
 * Returns object with mapped external modules names
 *
 * @returns {Object}
 */
JSWorker.prototype.getGlobalNSMap = function() {
  var map = {};

  this.dependencyTree.forEach(function(module) {
      if (module.globalNS || module.isExternal()) {
        map[module.name] = module.globalNS || module.name;
      }
  });

  return map;
};
