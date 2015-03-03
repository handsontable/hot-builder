
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

function Builder(argv, options) {
  var _this = this,
    requireNpmModules;

  if (!(this instanceof Builder)) {
    return new Builder(argv, options);
  }
  argv = argv || {};

  // setup default option values
  options = options || {};
  options.input = path.resolve(options.input || argv.input ||
      path.join(__dirname, '..', 'node_modules', 'handsontable', 'package.json'));
  options.outputDir = options.outputDir || argv['output-dir'];
  options.baseSrc = path.join(path.dirname(options.input), 'src');
  options.minify = options.minify !== undefined ? options.minify : (argv['minify'] || false);
  options.disableUI = options.disableUI || argv['disable-ui'];
  options.external = options.external ||
      this.parseArgumentAsArray(argv, 'modules-src', ['plugins', 'validators', 'renderers', 'editors']);
  options.include = options.include || this.parseArgumentAsAddRemoveModule(argv, 'add-module');
  options.exclude = options.exclude || this.parseArgumentAsAddRemoveModule(argv, 'remove-module');

  if (!options.buildMode) {
    options.buildMode = [];

    if (argv.all) {
      options.buildMode.push('all');
    } else {
      // TODO: Support for validators, renderers and editors is not ready yet
      //ModuleItem.TYPES.forEach(function(type) {
      //  if (argv['all-' + type + 's']) {
      //    options.buildMode.push(type);
      //  }
      //});
    }
  }
  options.buildMode.push('validator', 'renderer', 'editor');

  if (!this.isInputValid(options.input)) {
    return this.emit('error', new Error('Input package file is not valid.'));
  }

  this.hotPackage = JSON.parse(fs.readFileSync(options.input).toString());
  this.builderPackage = JSON.parse(fs.readFileSync(path.resolve(path.join(__dirname, '..', 'package.json'))).toString());
  options.npmModulesDescriptor = this.builderPackage.builderDependencies;

  options.external = options.external.map(function(dirName) {
    return {
      type: dirName === 'plugins' ? 'dir' : 'file',
      path: path.resolve(path.join(options.baseSrc, dirName))
    };
  });

  // Path to external modules (libraries)
  options.external.push({
    type: 'dir',
    path: path.join(path.dirname(options.input), 'lib'),
    external: true
  });
  requireNpmModules = Object.keys(options.npmModulesDescriptor).join('|');
  // Parse only npm modules defined in hot-builder package.json ("builderDependencies")
  options.external.push({
    type: 'dir',
    path: path.resolve(path.join(__dirname, '..', 'node_modules') + '/@(' + requireNpmModules + ')'),
    external: true,
    npm: true,
    modulesDescriptor: options.npmModulesDescriptor
  });

  replacer.setVariables(this.hotPackage);
  this.moduleFinder = moduleFinder(options.external);

  if (options.disableUI) {
    run();
  }
  else {
    this.showUIPrompt(function(selected) {
      options.buildMode = [];
      options.include = selected.modules;

      run();
    });
  }
  function run() {
    console.log('Creating custom build...\n'.underline.log);

    _this.runTask(options, _this.getEntryFile(options.input, options.outputDir));
  }
}

/**
 * @param {String} entryPoint
 * @param {String} outputDir
 * @returns {Object}
 */
Builder.prototype.getEntryFile = function(entryPoint, outputDir) {
  var file = {};

  file.src = path.resolve(path.normalize(path.dirname(entryPoint) + path.sep + this.hotPackage.browser));
  file.dest = outputDir;

  return file;
};

/**
 * Create and show UI Prompt with all available modules to select
 *
 * @param callback
 */
Builder.prototype.showUIPrompt = function(callback) {
  var choices = [],
    pluginLable = new inquirer.Separator('Plugins:'),
    externalLable = new inquirer.Separator('External libraries:');

  choices.push(new inquirer.Separator());

  this.moduleFinder.getModules().forEach(function(module) {
    if (!module.isPlugin() && !module.isExternal()) {
      return;
    }
    if (module.isPlugin() && choices.indexOf(pluginLable) === -1) {
      choices.push(pluginLable);

    } if (module.isExternal() && choices.indexOf(externalLable) === -1) {
      choices.push(externalLable);
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
 * @param {Object} options
 * @param {Object} file
 */
Builder.prototype.runTask = function(options, file) {
  var _this = this,
    runner;

  runner = new Worker(options);
  runner.on('complete', function(file) {
    _this.emit('complete');
    console.log('Created files in ' + file.dest.green + ' directory.');
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
