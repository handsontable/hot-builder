
var cssCompressor = require('./compressors/css-compressor');
var CSSWorker = require('./workers/css-worker');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var inherits = require('inherits');
var jsCompressor = require('./compressors/js-compressor');
var JSWorker = require('./workers/js-worker');
var moduleFinder = require('./module-finder');
var ncp = require('ncp').ncp;
var path = require('path');
var resolve = require('resolve');

module.exports = Worker;

inherits(Worker, EventEmitter);

/**
 * @param {Object} options
 */
function Worker(options) {
  this.options = options || {};
  this.moduleFinder = moduleFinder(this.options.external);
  this.dependencyTree = [];
}

Worker.OUTPUT_PREFIX_FILENAME = 'handsontable';

/**
 * @param {Object} file
 */
Worker.prototype.run = function(file) {
  var _this = this,
    jsWorker,
    cssWorker;

  this.prepareDestDir(file.dest);
  this.buildDependencyTree();

  // Generate JS without any external dependencies (like zeroclipboard, moment, pikaday itp)
  jsWorker = new JSWorker(this.dependencyTree, {
    includeExternals: false
  });
  jsWorker.run(file, function(err, content) {
    if (err) {
      return _this.emit('error', err);
    }
    _this.write(_this.getOutputFilePath(file, '.js'), content);
  });

  // Generate JS with external dependencies
  jsWorker = new JSWorker(this.dependencyTree, {
    includeExternals: true
  });
  jsWorker.run(file, function(err, content) {
    if (err) {
      return _this.emit('error', err);
    }
    _this.write(_this.getOutputFilePath(file, '.full.js'), content);

    if (_this.options.minify) {
      _this.write(_this.getOutputFilePath(file, '.full.min.js'), jsCompressor(content));
    }
  });

  // Generate CSS file without external dependencies
  cssWorker = new CSSWorker(this.dependencyTree, {
    includeExternals: false
  });
  cssWorker.run(file, function(err, content) {
    if (err) {
      return _this.emit('error', err);
    }
    _this.write(_this.getOutputFilePath(file, '.css'), content);
  });

  // Generate CSS file with external dependencies
  cssWorker = new CSSWorker(this.dependencyTree, {
    includeExternals: true
  });
  cssWorker.run(file, function(err, content) {
    if (err) {
      return _this.emit('error', err);
    }
    _this.write(_this.getOutputFilePath(file, '.full.css'), content);

    if (_this.options.minify) {
      _this.write(_this.getOutputFilePath(file, '.full.min.css'), cssCompressor(content));
    }
  });
  this.copyAllCopyableDependencies(file.dest);
  //this.emit('complete', file);
};

/**
 * Copy all copyable files into destination directory
 */
Worker.prototype.copyAllCopyableDependencies = function(dest) {
  this.dependencyTree.forEach(function(module) {
    var files = module.getCopyableFiles();

    files.forEach(function(filePath) {
      var lastDir, destPath;

      destPath = dest + '/' + module.name;

      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, parseInt('0777', 8) & (~process.umask()));
      }

      if (fs.lstatSync(filePath).isDirectory()) {
        lastDir = filePath.split(path.sep);
        lastDir = lastDir[lastDir.length - 1];

        ncp(filePath, destPath + '/' + lastDir, {clobber: true}, function() {

        });
      } else {
        ncp(filePath, destPath + '/' + path.basename(filePath), {clobber: true}, function() {

        });
      }
    });
  });
};

/**
 * Build dependency tree based on CLI arguments filters
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

  if (fs.existsSync(destPath)) {
    if (fs.lstatSync(destPath).isFile()) {
      throw new Error('Unable to create "' + destPath + '" directory. File with this name already exists.');
    }
  } else {
    fs.mkdirSync(destPath, parseInt('0777', 8) & (~process.umask()));
  }
};

/**
 * Get output file where content will be saved
 *
 * @param {Object} file
 * @param {String} postfix
 */
Worker.prototype.getOutputFilePath = function(file, postfix) {
  return file.dest + '/' + Worker.OUTPUT_PREFIX_FILENAME + (postfix || '.js');
};


/**
 * Save contexts to file
 *
 * @param {String} filePath
 * @param {String} contents
 */
Worker.prototype.write = function(filePath, contents) {
  try {
    fs.writeFileSync(filePath, contents);

  } catch(e) {
    throw new Error('Unable to write "' + filePath + '" file (Error code: ' + e.code + ').');
  }
};
