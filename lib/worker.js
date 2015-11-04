
var async = require('async');
var cssCompressor = require('./compressors/css-compressor');
var CSSWorker = require('./workers/css-worker');
var EntryFile = require('./entry-file');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var inherits = require('inherits');
var jsCompressor = require('./compressors/js-compressor');
var JSWorker = require('./workers/js-worker');
var ncp = require('ncp').ncp;
var path = require('path');
var resolve = require('resolve');

module.exports = Worker;

inherits(Worker, EventEmitter);

/**
 * @param {ModuleFinder} moduleFinder
 * @param {Object} options
 */
function Worker(moduleFinder, options) {
  this.moduleFinder = moduleFinder;
  this.options = Object.create(options || {});
  this.dependencyTree = [];
}

Worker.OUTPUT_PREFIX_FILENAME = 'handsontable';

/**
 * @param {EntryFile} entryFile
 */
Worker.prototype.run = function(entryFile) {
  var _this = this,
    workers = [],
    licenseContent = '';

  this.prepareDestDir(entryFile.getDestination());
  this.buildDependencyTree();

  if (entryFile.hasFile(EntryFile.TYPE_PRO)) {
    licenseContent = fs.readFileSync(entryFile.getFile(EntryFile.TYPE_PRO).licenseFile).toString();
  } else {
    licenseContent = fs.readFileSync(entryFile.getFile(EntryFile.TYPE_BASE).licenseFile).toString();
  }
  licenseContent = '/*!\n' + licenseContent + '\n*/\n';

  // Generate JS without any external dependencies (like zeroclipboard, moment, pikaday)
  workers.push(
    new JSWorker(this.dependencyTree, {
      includeExternals: false
    })
  );

  // Generate JS with external dependencies
  if (!this.options.devMode) {
    workers.push(
      new JSWorker(this.dependencyTree, {
        includeExternals: true
      })
    );
  }

  // Generate CSS file without external dependencies
  workers.push(
    new CSSWorker(this.dependencyTree, {
      includeExternals: false
    })
  );

  // Generate CSS file with external dependencies
  if (!this.options.devMode) {
    workers.push(
      new CSSWorker(this.dependencyTree, {
        includeExternals: true
      })
    );
  }

  async.each(workers, function(worker, next) {
    worker.run(entryFile, function(err, content) {
      var postfix, compressor;

      if (err) {
        return _this.emit('error', err);
      }
      if (worker instanceof JSWorker) {
        postfix = '.js';
        compressor = jsCompressor;

      } else if (worker instanceof CSSWorker) {
        postfix = '.css';
        compressor = cssCompressor;
      }
      content = licenseContent + content;

      if (worker.options.includeExternals) {
        _this.write(_this.getOutputFilePath(entryFile.getDestination(), '.full' + postfix), content);

        if (_this.options.minify) {
          _this.write(_this.getOutputFilePath(entryFile.getDestination(), '.full.min' + postfix), compressor(content));
        }
      } else {
        _this.write(_this.getOutputFilePath(entryFile.getDestination(), postfix), content);

        if (_this.options.minify) {
          _this.write(_this.getOutputFilePath(entryFile.getDestination(), '.min' + postfix), compressor(content));
        }
      }
      next();
    });
  }, function() {
    _this.emit('complete', entryFile);
  });

  if (!this.options.devMode) {
    this.copyAllCopyableDependencies(entryFile.getDestination());
  }
};

/**
 * Copy all copyable files into destination directory
 */
Worker.prototype.copyAllCopyableDependencies = function(dest) {
  this.dependencyTree.forEach(function(module) {
    var files = module.getCopyableFiles();

    files.forEach(function(filePath) {
      var lastDir, destPath;

      destPath = path.join(dest, module.name);

      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, parseInt('0777', 8) & (~process.umask()));
      }

      if (fs.lstatSync(filePath).isDirectory()) {
        lastDir = filePath.split(path.sep);
        lastDir = lastDir[lastDir.length - 1];

        ncp(filePath, path.join(destPath, lastDir), {clobber: true}, function() {

        });
      } else {
        ncp(filePath, path.join(destPath, path.basename(filePath)), {clobber: true}, function() {

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
    lastModuleName = null,
    moduleCounter = 0,
    filteredModules;

  // include all found modules by type except that excluded by user
  if (this.options.includeTypes.indexOf('all') > -1) {
    filteredModules = modules.filter(function(module) {
      return _this.options.exclude.indexOf(module.name) === -1;
    });
  }
  // include modules manually
  else {
    filteredModules = modules.filter(function(module) {
      var toInclude = false;

      if (_this.options.includeTypes.indexOf(module.type) > -1) {
        toInclude = true;
      }
      if (_this.options.include.indexOf(module.name) > -1) {
        toInclude = true;
      }
      if (_this.options.exclude.indexOf(module.name) > -1) {
        toInclude = false;
      }

      return toInclude;
    });
  }

  modules.forEach(function(module, index) {
    // TODO: Hide other modules then plugin because other modules are WIP
    //if (lastModuleName && lastModuleName !== module.type && module.isPlugin()) {
      //console.log(logSummaryTemplate(), moduleCounter, lastModuleName);
      //moduleCounter = 0;
    //}
    if (module.isInternal() && this.dependencyTree.indexOf(module) === -1) {
      this.dependencyTree.push(module);
    }

    if (filteredModules.indexOf(module) === -1) {
      if (module.isPlugin()) {
        console.log(logTemplate('module'), module.type, module.name, '[excluded]'.red);
      }
    }
    else {
      this.dependencyTree.push(module);

      if (module.isPlugin()) {
        console.log(logTemplate('module'), module.type, module.name, '[included]'.green);
      }

      if (module.dependencies.length) {
        module.getAllDependencies(1).forEach(function(subModule, index, arr) {
          this.dependencyTree.push(subModule);

          if (module.isPlugin()) {
            console.log((arr.length - 1 === index ? ' └──' : ' ├──') + ' Included dependency ' +
                '(' + '%s'.yellow + '): ' + '%s'.cyan, subModule.type, subModule.name);
          }
        }, this);
      }
    }
    lastModuleName = module.type;

    if (module.isPlugin()) {
      moduleCounter ++;
    }

    if (modules.length === index + 1) {
      //console.log(logSummaryTemplate(), moduleCounter, lastModuleName);
      console.log(logSummaryTemplate(), moduleCounter, 'plugin');
    }
  }, this);
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
 * @param {String} filePath
 * @param {String} postfix
 */
Worker.prototype.getOutputFilePath = function(filePath, postfix) {
  return path.join(filePath, Worker.OUTPUT_PREFIX_FILENAME + (postfix || '.js'));
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

function logTemplate(type, isPro) {
  return 'Found ' + type + ' (' + '%s'.yellow + '): ' + '%s'.cyan + ' %s';
}
function logSummaryTemplate() {
  return 'Found ' + '%s'.green + ' %ss\n';
}
