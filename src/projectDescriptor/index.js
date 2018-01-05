'use strict'

var fs = require('fs');
var path = require('path');
var semver = require('semver');
var modulesDiscover = require('./modulesDiscover');

var MINIMUM_SUPPORTED_CE_VERSION = '0.35.0';
var MINIMUM_SUPPORTED_PRO_VERSION = '1.15.0';

module.exports = function projectDescriptor(projectPath) {
  return new ProjectDescriptor(projectPath);
};

/**
 * @param {String} path An path where project files are placed.
 * @constructor
 */
function ProjectDescriptor(projectPath) {
  this.projectPath = projectPath;
  this.package = {};
  this.checkProjectValidity();

  this.modulesDiscover = modulesDiscover(this);
}

ProjectDescriptor.prototype.checkProjectValidity = function() {
  var packagePath = path.resolve(this.projectPath, 'package.json');

  if (!fs.existsSync(packagePath)) {
    throw Error('The "package.json" was not found in "' + this.projectPath + '" directory.');
  }

  try {
    this.package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  } catch (ex) {
    throw Error('There was a problem with parsing "package.json" file.');
  }

  if (['handsontable', 'handsontable-pro'].indexOf(this.getName()) === -1) {
    throw Error('The project "' + this.getName() + '" is not supported.');
  }

  if (this.getName() === 'handsontable' && semver.lt(this.getVersion(), MINIMUM_SUPPORTED_CE_VERSION)) {
    throw Error('Your handsontable CE repository (' + this.getVersion() + ') is not supported. Minimal supported version is ' + MINIMUM_SUPPORTED_CE_VERSION + '.');
  }
  if (this.getName() === 'handsontable-pro' && semver.lt(this.getVersion(), MINIMUM_SUPPORTED_PRO_VERSION)) {
    throw Error('Your handsontable PRO repository (' + this.getVersion() + ') is not supported. Minimal supported version is ' + MINIMUM_SUPPORTED_PRO_VERSION + '.');
  }
}

ProjectDescriptor.prototype.isPro = function() {
  return this.getName() === 'handsontable-pro';
}

ProjectDescriptor.prototype.getPath = function() {
  return this.projectPath;
}

ProjectDescriptor.prototype.getName = function() {
  return this.package.name;
}

ProjectDescriptor.prototype.getVersion = function() {
  return this.package.version;
}

ProjectDescriptor.prototype.getRepository = function() {
  return this.package.repository;
}

ProjectDescriptor.prototype.getModules = function() {
  return this.modulesDiscover.getModules();
}

ProjectDescriptor.prototype.getModulesSortedByName = function() {
  return this.modulesDiscover.getModulesSortedByName();
}

ProjectDescriptor.prototype.getModuleByName = function(moduleName) {
  return this.modulesDiscover.getModuleByName(moduleName);
}
