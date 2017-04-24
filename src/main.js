#!/usr/bin/env node

'use strict';

var path = require('path');
var program = require('caporal');
var semver = require('semver');
var buildCommand = require('./commands/build');
var packageVersion = require('../package.json').version;

function resolve(dir) {
  return (typeof dir === 'string') ? path.resolve(dir) : '';
}

function list(items) {
  return (typeof items === 'string') ? items.split(',') : items;
}

function parseArgs() {
  program
    .version(packageVersion)
    // the "build" command
    .command('build', 'Build Handsontable CE or Handsontable PRO package')
    .option(
      '-i, --input <dir>',
      'Path to directory where Handsontable CE or Handsontable PRO repository was downloaded',
      resolve
    )
    .option(
      '-o, --output-dir <dir>',
      'Output directory where generated bundle will be saved',
      resolve,
      void 0,
      true
    )
    .option(
      '-a, --include-all',
      'Include all found modules into generated bundle',
      program.BOOL
    )
    .option(
      '-A, --add-module [modules]',
      'Include specified modules into generated bundle (eg. -A ContextMenu,ManualRowMove)',
      list,
      []
    )
    .option(
      '-R, --remove-module [modules]',
      'Exclude specified modules from generated bundle (eg. -R ContextMenu,ManualRowMove)',
      list,
      []
    )
    .option(
      '-U, --no-ui',
      'Disables UI',
      program.BOOL
    )
    .option(
      '--repository-tag [tag]',
      'Specifies what version of Handsontable CE or Handsontable PRO repository will be \ncloned (eg. --repository-tag develop, or --repository-tag 0.32.0). \nThis option is active only if you omitted -i, --input argument',
      void 0,
      'master'
    )
    .option(
      '--pro',
      'Indicates that version specyfied by --repository-tag argument will be refered to Handsontable PRO package',
      program.BOOL
    )
    .option(
      '--debug',
      'Debug mode - will output debug messages from workers',
      program.BOOL
    )
    .action(buildCommand);

  program.parse(process.argv);
}

(function main() {
  try {
    if (semver.lt(process.versions.node, '4.2.0')) {
      throw Error('hot-builder requires Node.js >= 4.2.0 for building Handsontable custom package. You have currently installed version ' + process.versions.node + '.');
    }

    parseArgs();
  } catch (ex) {
    /* eslint-disable no-console */
    console.log(ex.message);
    console.log('');
    process.exit(2);
  }
}());
