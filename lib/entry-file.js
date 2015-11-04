
var fs = require('fs');
var path = require('path');

module.exports = EntryFile;

/**
 * @constructor
 */
function EntryFile() {
  this.files = {};
  this.dest = '';
}

EntryFile.TYPE_BASE = 'handsontable';
EntryFile.TYPE_PRO = 'handsontable-pro';
EntryFile.TYPES = [EntryFile.TYPE_BASE, EntryFile.TYPE_PRO];


EntryFile.prototype.addFile = function(id, entryFile) {
  if (EntryFile.TYPES.indexOf(id) === -1) {
    throw new Error('Unsupported file type.');
  }
  if (!this.isInputFileValid(entryFile)) {
    throw new Error('Input package file is not valid. It must point to a package.json file from ' +
        'Handsontable or HandsontablePro project.');
  }
  var
    pkg = JSON.parse(fs.readFileSync(entryFile).toString()),
    _path = path.dirname(entryFile);

  this.files[id] = {
    package: pkg,
    packageFilename: entryFile,
    path: _path,
    srcPath: path.join(_path, 'src'),
    internalLibPath: path.join(_path, 'lib'),
    entryFile: path.resolve(path.normalize(_path + path.sep + pkg.browser)),
    licenseFile: path.resolve(path.normalize(_path + path.sep + 'LICENSE')),
  };
};

EntryFile.prototype.getFile = function(id) {
  return this.files[id];
};

EntryFile.prototype.hasFile = function(id) {
  return this.files[id] !== void 0;
};

EntryFile.prototype.getFiles = function() {
  return this.files;
};

EntryFile.prototype.setDestination = function(dest) {
  this.dest = dest;
};

EntryFile.prototype.getDestination = function() {
  return this.dest;
};

/**
 * Checks if input file is valid Handsontable or Walkontable package.json file
 *
 * @param {String} entryFile
 * @returns {Boolean}
 */
EntryFile.prototype.isInputFileValid = function(entryFile) {
  var content;

  if (!/package.json$/.test(entryFile)) {
    return false;
  }
  try {
    content = JSON.parse(fs.readFileSync(entryFile).toString());
  } catch (ex) {
    return false;
  }
  if (EntryFile.TYPES.indexOf(content.name) === -1) {
    return false;
  }

  return true;
};
