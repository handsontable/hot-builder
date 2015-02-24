
var _ = require('lodash');
var BaseWorker = require('./_base-worker');
var fs = require('fs');
var glob = require('glob');
var inherits = require('inherits');
var path = require('path');
var resolve = require('resolve');


module.exports = CSSWorker;

inherits(CSSWorker, BaseWorker);

/**
 * @param {Array} dependencyTree
 */
function CSSWorker(dependencyTree) {
  this.dependencyTree = dependencyTree;
}

CSSWorker.OUTPUT_FILE = 'handsontable.css';

/**
 * @param {Object} file
 */
CSSWorker.prototype.run = function(file) {
  var _this = this,
    concated = '';

  this.dependencyTree.forEach(function(module) {
    module.getCSSFiles().forEach(function(filePath) {
      concated += fs.readFileSync(path.resolve(filePath)).toString('utf-8');
    });
  });

  this.write(file.dest + '/' + CSSWorker.OUTPUT_FILE, concated);
  this.emit('complete', file);
};
