
'use strict';

var async = require('async');
var colors = require('colors');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var glob = require('glob');
var inherits = require('inherits');
var inquirer = require('inquirer');
var moduleFinder = require('./module-finder');
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
  // @TODO: baseSrc should be detect automatically based on input file
  options.baseSrc = options.baseSrc || path.resolve(__dirname + '/../node_modules/handsontable/src/');
  options.input = options.input || argv.input || path.resolve(__dirname + '/../node_modules/handsontable/package.json');
  options.outputDir = options.outputDir || argv['output-dir'];
  options.minify = options.minify || argv['minify'];
  options.buildMode = options.buildMode || (argv.all ? 'all' : 'core');
  options.disableUI = options.disableUI || argv['disable-ui'];
  options.external = options.external || this.parseArgumentAsArray(argv, 'modules-src', ['plugins']);
  options.include = options.include || this.parseArgumentAsAddRemoveModule(argv, 'add-plugin');
  options.exclude = options.exclude || this.parseArgumentAsAddRemoveModule(argv, 'remove-plugin');

  this.hotPackage = JSON.parse(fs.readFileSync(path.resolve(options.input)).toString());
  this.builderPackage = JSON.parse(fs.readFileSync(path.resolve(__dirname + '/../package.json')).toString());
  options.npmModulesDescriptor = this.builderPackage.builderDependencies;

  options.external = options.external.map(function(dirName) {
    return {
      path: path.resolve(options.baseSrc + '/' + dirName)
    };
  });

  // Path to external modules (libraries)
  options.external.push({
    path: path.resolve(__dirname + '/../node_modules/handsontable/lib'),
    external: true
  });
  requireNpmModules = Object.keys(options.npmModulesDescriptor).join('|');
  // Parse only npm modules defined in hot-builder package.json ("builderDependencies")
  options.external.push({
    path: path.resolve(__dirname + '/../node_modules/@(' + requireNpmModules + ')'),
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
      options.buildMode = 'core';
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
  var file = {}, content;

  file.src = path.resolve(entryPoint);
  file.dest = outputDir;

  if (/package.json$/.test(entryPoint)) {
    file.src = path.resolve(path.normalize(path.dirname(entryPoint) + '/' + this.hotPackage.browser));
  }

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
    externalLable = new inquirer.Separator('Externals libraries:');

  choices.push(new inquirer.Separator());

  this.moduleFinder.getModules().forEach(function(module) {
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
    //console.log(('Created file ' + file.dest).green);
  });

  runner.run(file);
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
