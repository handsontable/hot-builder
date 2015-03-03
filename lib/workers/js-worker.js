
var BaseWorker = require('./_base-worker');
var browserify = require('browserify');
var es6ify = require("es6ify");
var fs = require('fs');
var inherits = require('inherits');
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
 * @param {Object} file
 * @param {Function} callback
 */
JSWorker.prototype.run = function(file, callback) {
  var _this = this, intro, globalNS;

  this.b = browserify({
    entries: file.src,
    basedir: path.dirname(file.src),
    debug: false,
    bundleExternal: false,
    detectGlobals: false,
    insertGlobals: false,
    prelude: jsHeader.replace('@@globalNS', JSON.stringify(this.getGlobalNSMap()))
  });
  this.b.on('error', function(err) {
    _this.emit('error', err);
  });
  this.b.transform(es6ify);

  // TODO: Actually numeral must be forced included into package because core.js used it
  _this.b.require(path.join(path.dirname(file.src), '..', 'lib', 'numeral', 'numeral.js'), {
    expose: 'numeral'
  });

  this.dependencyTree.forEach(function(module) {
    if (module.isExternal()) {
      if (_this.options.includeExternals) {
        _this.b.require(module.getJSFiles(), {
          expose: module.name
        });
      } else {
        _this.b.ignore(module.name);
      }
    } else {
      _this.b.add(module.getJSFiles());
    }
  });
  intro = fs.readFileSync(path.join(path.dirname(file.src), 'intro.js')).toString('utf8');

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
