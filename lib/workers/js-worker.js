
var _ = require('lodash');
var BaseWorker = require('./_base-worker');
var browserify = require('browserify');
var fs = require('fs');
var inherits = require('inherits');
var path = require('path');
var resolve = require('resolve');

module.exports = JSWorker;

inherits(JSWorker, BaseWorker);

/**
 * @param {Array} dependencyTree
 */
function JSWorker(dependencyTree) {
  this.dependencyTree = dependencyTree;
}

JSWorker.OUTPUT_FILE = 'handsontable.js';
JSWorker.ES6_TRANSPILER = 'es6ify';

/**
 * @param {Object} file
 */
JSWorker.prototype.run = function(file) {
  var _this = this;

  this.b = browserify({
    entries: file.src,
    basedir: path.dirname(file.src),
    debug: false
  });
  this.b.on('error', function(err) {
    _this.emit('error', err);
  });
  this.b.transform(JSWorker.ES6_TRANSPILER);

  this.dependencyTree.forEach(function(module) {
    _this.b.add(module.getJSFiles().map(function(filePath) {
      return path.resolve(filePath);
    }));
  });

  this.b.bundle(function(err, buf) {
    if (err) {
      return _this.emit('error', err);
    }
    // replace sourceURL injected by Traceur
    buf = buf.toString('utf8');
    buf = buf.replace(/sourceURL=.*/g, '');

    _this.write(file.dest + '/' + JSWorker.OUTPUT_FILE, buf);
    _this.emit('complete', file);
  });
};
