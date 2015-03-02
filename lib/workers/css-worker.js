
var BaseWorker = require('./_base-worker');
var fs = require('fs');
var glob = require('glob');
var inherits = require('inherits');
var path = require('path');
var replacer = require('./../utils/replacer');
var resolve = require('resolve');


module.exports = CSSWorker;

inherits(CSSWorker, BaseWorker);

/**
 * @param {Array} dependencyTree
 * @param {Object} [options]
 */
function CSSWorker(dependencyTree, options) {
  this.dependencyTree = dependencyTree;
  this.options = options || {};
}

/**
 * @param {Object} file
 * @param {Function} callback
 */
CSSWorker.prototype.run = function(file, callback) {
  var _this = this,
    concated = [];

  // TODO: Move require CSS to config? or autodetect them by search /css/ dir?
  ['handsontable.css', 'mobile.handsontable.css'].forEach(function(requiredCss) {
    concated.push(fs.readFileSync(path.join(path.dirname(file.src), 'css', requiredCss)).toString('utf8'));
  });
  this.dependencyTree.forEach(function(module) {
    if (!_this.options.includeExternals && module.isExternal()) {
      return;
    }
    module.getCSSFiles().forEach(function(filePath) {
      var content = fs.readFileSync(filePath).toString('utf8');

      if (concated.indexOf(content) === -1) {
        concated.push(content);
      }
    });
  });
  concated = replacer.replace(concated.join(''));

  callback(null, concated);
};
