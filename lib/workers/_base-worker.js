
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
