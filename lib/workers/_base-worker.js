
var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var glob = require('glob');
var inherits = require('inherits');
var path = require('path');
var resolve = require('resolve');
var browserify = require('browserify');
var BaseWorker = require('./_base-worker');

module.exports = BaseWorker;

inherits(BaseWorker, EventEmitter);

/**
 * @param {Array} dependencyTree
 */
function BaseWorker(dependencyTree) {

}

/**
 * Save contexts to file
 *
 * @param {String} filePath
 * @param {String} contents
 */
BaseWorker.prototype.write = function(filePath, contents) {
  try {
    fs.writeFileSync(filePath, contents);

  } catch(e) {
    throw new Error('Unable to write "' + filePath + '" file (Error code: ' + e.code + ').');
  }
};
