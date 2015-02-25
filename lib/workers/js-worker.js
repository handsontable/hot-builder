
var _ = require('lodash');
var BaseWorker = require('./_base-worker');
var browserify = require('browserify');
var fs = require('fs');
var inherits = require('inherits');
var path = require('path');
var replacer = require('./../utils/replacer');
var resolve = require('resolve');
var UglifyJS = require("uglify-js");

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

JSWorker.ES6_TRANSPILER = 'es6ify';

/**
 * @param {Object} file
 * @param {Function} callback
 */
JSWorker.prototype.run = function(file, callback) {
  var _this = this, intro;

  this.b = browserify({
    entries: file.src,
    basedir: path.dirname(file.src),
    debug: false,
    bundleExternal: false
  });
  this.b.on('error', function(err) {
    _this.emit('error', err);
  });
  this.b.transform(JSWorker.ES6_TRANSPILER);

  this.dependencyTree.forEach(function(module) {
    if (!_this.options.includeExternals && module.isExternal()) {
      return;
    }
    _this.b.add(module.getJSFiles());
  });
  intro = fs.readFileSync(path.resolve(path.dirname(file.src) + '/intro.js')).toString('utf-8');

  this.b.bundle(function(err, buf) {
    if (err) {
      return _this.emit('error', err);
    }
    // replace sourceURL injected by Traceur
    buf = intro + buf.toString('utf8');
    buf = buf.replace(/sourceURL=.*/g, '');
    buf = replacer.replace(buf);

    callback(err, buf);
  });
};
