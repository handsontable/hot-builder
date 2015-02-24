
var _ = require('lodash');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var inherits = require('inherits');
var moduleFinder = require('./module-finder');
var CSSWorker = require('./workers/css-worker');
var JSWorker = require('./workers/js-worker');
var path = require('path');
var resolve = require('resolve');

module.exports = Worker;

inherits(Worker, EventEmitter);

/**
 * @param {Object} options
 */
function Worker(options) {
  var external = options.external.map(function(dirName) {
    return options.baseSrc + dirName;
  });

  this.options = options || {};
  this.moduleFinder = moduleFinder(external);
  this.dependencyTree = [];
}

/**
 * @param {Object} file
 */
Worker.prototype.run = function(file) {
  var _this = this;

  this.prepareDestDir(file.dest);
  this.buildDependencyTree();

  var worker = new JSWorker(this.dependencyTree);
  worker.run(file);
  worker = new CSSWorker(this.dependencyTree);
  worker.run(file);
};

/**
 *
 */
Worker.prototype.buildDependencyTree = function() {
  var _this = this,
    modules = this.moduleFinder.getModules(),
    filteredModules;

  if (this.options.buildMode === 'all') {
    filteredModules = modules.filter(function(mod) {
      return _this.options.exclude.indexOf(mod.name) === -1;
    });
  }
  // build core-only
  else {
    filteredModules = modules.filter(function(mod) {
      return _this.options.include.indexOf(mod.name) !== -1;
    });
  }

  modules.forEach(function(module) {
    function logTemplate(type) {
        return 'Found ' + type + ' (' + '%s'.yellow + '): ' + '%s'.cyan + ' %s';
    }

    if (filteredModules.indexOf(module) === -1) {
      console.log(logTemplate('module'), module.type, module.name, '[excluded]'.red);

      return;
    }
    _this.dependencyTree.push(module);

    console.log(logTemplate('module'), module.type, module.name, '[included]'.green);

    if (module.dependencies.length) {
      module.getAllDependencies().forEach(function(subModule, index, arr) {
        _this.dependencyTree.push(subModule);

        console.log((arr.length - 1 === index ? ' └──' : ' ├──') + ' Included dependency ' +
            '(' + '%s'.yellow + '): ' + '%s'.cyan, subModule.type, subModule.name);
      });
    }
  });

  if (this.options.external.length) {
    console.log('Founded ' + '%s'.green + ' modules\n', modules.length);
  }
};

/**
 * Prepare destination path, create if not exists
 *
 * @param {String} destination
 */
Worker.prototype.prepareDestDir = function(destination) {
  var destPath = path.resolve(destination);

  console.log( path.resolve(destination) );

  if (fs.existsSync(destPath)) {
    if (fs.lstatSync(destPath).isFile()) {
      throw new Error('Unable to create "' + destPath + '" directory.');
    }
  } else {
    fs.mkdirSync(destPath, parseInt('0777', 8) & (~process.umask()));
  }
};
