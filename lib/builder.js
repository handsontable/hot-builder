
'use strict';

var async = require('async');
var colors = require('colors');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var glob = require('glob');
var inherits = require('inherits');
var inquirer = require('inquirer');
var moduleFinder = require('./module-finder');
var ModuleItem = require('./module-item');
var npm = require("npm");
var path = require('path');
var replacer = require('./utils/replacer');
var Worker = require('./worker');

colors.setTheme({
  log: 'white',
  info: 'green',
  help: 'cyan',
  warn: 'yellow',
  debug: 'blue',
  error: 'red'
});

module.exports = Builder;

inherits(Builder, EventEmitter);

/**
 * @param {Object} argv
 * @param {Object} options
 * @returns {Builder}
 * @constructor
 */
function Builder(argv, options) {
  var _this = this;

  if (!(this instanceof Builder)) {
    return new Builder(argv, options);
  }
  argv = argv || {};
  this.options = options || {};
  this.options.hotBranch = this.options.hotBranch || argv['hot-branch'];

  this.builderPackage = JSON.parse(fs.readFileSync(path.resolve(path.join(__dirname, '..', 'package.json'))).toString());
  this.hotPackage = null;
  this.moduleFinder = null;

  if (this.options.hotBranch) {
    this.installHot(this.options.hotBranch, function(err) {
      if (err) {
        return _this.emit('error', err);
      }
      _this.init(argv);
    });
  }
  else {
    this.init(argv);
  }
}

/**
 * Initialize builder
 *
 * @param {Object} argv
 */
Builder.prototype.init = function(argv) {
  var _this = this,
    requireNpmModules;

  // setup default option values
  this.options.input = path.resolve(this.options.input || argv.input || path.join(__dirname, '..', 'node_modules', 'handsontable', 'package.json'));
  this.options.outputDir = this.options.outputDir || argv['output-dir'];
  this.options.baseSrc = path.join(path.dirname(this.options.input), 'src');
  this.options.minify = this.options.minify !== undefined ? this.options.minify : (argv['minify'] || false);
  this.options.disableUI = this.options.disableUI || argv['disable-ui'];
  this.options.devMode = this.options.devMode || argv['dev-mode'];
  this.options.external = this.options.external || this.parseArgumentAsArray(argv, 'modules-src', ['plugins', 'validators', 'renderers', 'editors']);
  this.options.include = this.options.include || this.parseArgumentAsAddRemoveModule(argv, 'add-module');
  this.options.exclude = this.options.exclude || this.parseArgumentAsAddRemoveModule(argv, 'remove-module');

  if (!this.options.includeTypes) {
    this.options.includeTypes = [];

    if (argv.all) {
      this.options.includeTypes.push('all');
    } else {
      // TODO: Support for validators, renderers and editors is not ready yet
      //ModuleItem.TYPES.forEach(function(type) {
      //  if (argv['all-' + type + 's']) {
      //    _this.options.includeTypes.push(type);
      //  }
      //});
    }
  }
  // By default include all modules by that types
  this.options.includeTypes.push('validator', 'renderer', 'editor');

  if (!this.isInputValid(this.options.input)) {
    return this.emit('error', new Error('Input package file is not valid.'));
  }
  this.options.npmModulesDescriptor = this.builderPackage.builderDependencies;

  this.options.external = this.options.external.map(function(dirName) {
    return {
      type: dirName === 'plugins' ? 'dir' : 'file',
      path: path.resolve(path.join(_this.options.baseSrc, dirName))
    };
  });

  // Path to external modules (libraries)
  this.options.external.push({
    type: 'dir',
    path: path.join(path.dirname(this.options.input), 'lib'),
    external: true
  });
  requireNpmModules = Object.keys(this.options.npmModulesDescriptor).join('|');
  // Parse only npm modules defined in hot-builder package.json ("builderDependencies")
  this.options.external.push({
    type: 'dir',
    path: path.resolve(path.join(__dirname, '..', 'node_modules') + '/@(' + requireNpmModules + ')'),
    external: true,
    npm: true,
    modulesDescriptor: this.options.npmModulesDescriptor
  });

  this.hotPackage = JSON.parse(fs.readFileSync(this.options.input).toString());
  replacer.setVariables(this.hotPackage);
  this.moduleFinder = moduleFinder(this.options.external);

  if (this.options.disableUI) {
    run();
  }
  else {
    this.showUIPrompt(function(selected) {
      // reset include types (exclude `all` if there was earlier)
      _this.options.includeTypes = ['validator', 'renderer', 'editor'];
      _this.options.include = selected.modules;

      run();
    });
  }
  function run() {
    var hotVersion = 'Handsontable v' + _this.hotPackage.version;

    if (_this.options.hotBranch) {
      hotVersion = hotVersion + ', ' + _this.options.hotBranch;
    }
    console.log(('Creating custom build (' + hotVersion+ ')...\n').underline.log);

    _this.runTask(_this.getEntryFile());
  }
};

/**
 * Install handsontable as dependency
 *
 * @param {String} version Handsontable version (default is latest version)
 * @param {Function} callback
 */
Builder.prototype.installHot = function(version, callback) {
  version = version || 'master';

  if (version === 'latest') {
    version = 'master';
  }
  npm.load(this.builderPackage, function(err) {
    if (err) {
      return err;
    }
    var orgPrefix = npm.prefix;

    if (version === 'link') {
      npm.prefix = __dirname + '/..';
      npm.commands.link('handsontable', callback);
      npm.prefix = orgPrefix;
    }
    else {
      npm.commands.install(__dirname + '/..', ['git://github.com/handsontable/handsontable#' + version], callback);
    }
  });
};

/**
 * @returns {Object}
 */
Builder.prototype.getEntryFile = function() {
  var file = {};

  file.src = path.resolve(path.normalize(path.dirname(this.options.input) + path.sep + this.hotPackage.browser));
  file.dest = this.options.outputDir;

  return file;
};

/**
 * Create and show UI Prompt with all available modules to select
 *
 * @param callback
 */
Builder.prototype.showUIPrompt = function(callback) {
  var choices = [],
    pluginLabel = new inquirer.Separator('Plugins:'),
    externalLabel = new inquirer.Separator('External libraries:');

  choices.push(new inquirer.Separator());

  this.moduleFinder.getModules().forEach(function(module) {
    // TODO: for now we exclude all modules others then `plugin` and `external`
    if (!module.isPlugin() && !module.isExternal()) {
      return;
    }
    if (module.isPlugin() && choices.indexOf(pluginLabel) === -1) {
      choices.push(pluginLabel);

    } if (module.isExternal() && choices.indexOf(externalLabel) === -1) {
      choices.push(externalLabel);
    }
    choices.push({
      name: module.name
    });
  });

  inquirer.prompt([{
      type: 'checkbox',
      message: 'Select modules that will be used to build your custom Handsontable distribution package',
      name: 'modules',
      choices: choices,
      paginated: false
    }
  ], callback);
};

/**
 * Run task
 *
 * @param {Object} file
 */
Builder.prototype.runTask = function(file) {
  var _this = this,
    runner,
    now;

  now = new Date().getTime();

  runner = new Worker(this.options);
  runner.on('complete', function(file) {
    var time = new Date().getTime() - now;

    time = time + 'ms';
    _this.emit('complete');
    console.log('Created files in ' + file.dest.green + ' directory (' + time.yellow + ').');
  });

  runner.run(file);
};

/**
 * Checks if input file is valid Handsontable or Walkontable package.json file
 *
 * @param {String} inputFile
 * @returns {Boolean}
 */
Builder.prototype.isInputValid = function(inputFile) {
  var content;

  if (!/package.json$/.test(inputFile)) {
    return false;
  }
  try {
    content = JSON.parse(fs.readFileSync(inputFile).toString('utf8'));
  } catch (ex) {
    return false;
  }
  if (['handsontable', 'walkontable'].indexOf(content.name) === -1) {
    return false;
  }

  return true;
};

/**
 * Parse arguments like add-(plugin|editor|renderer) and remove-(plugin|editor|renderer)
 *
 * @param {Object} argv
 * @param {String} key
 * @returns {Array}
 */
Builder.prototype.parseArgumentAsAddRemoveModule = function(argv, key) {
  var arr = this.parseArgumentAsArray(argv, key);

  if (arr.length === 1 && /,/.test(arr[0])) {
    arr = arr[0].split(',');
  }
  arr = arr.map(function(moduleName) {
    return moduleName[0].toUpperCase() + moduleName.substr(1);
  });

  return arr;
};

/**
 * Parse argument as array
 *
 * @param {Object} argv
 * @param {String} key
 * @param {*} [defaults]
 * @returns {Array}
 */
Builder.prototype.parseArgumentAsArray = function(argv, key, defaults) {
  defaults = defaults || [];

  return Array.isArray(argv[key]) ? argv[key] : (argv[key] ? [argv[key]] : defaults);
};
