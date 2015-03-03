
var EventEmitter = require('events').EventEmitter;
var inherits = require('inherits');

module.exports = BaseWorker;

inherits(BaseWorker, EventEmitter);

/**
 * @param {Array} dependencyTree
 */
function BaseWorker(dependencyTree) {

}
