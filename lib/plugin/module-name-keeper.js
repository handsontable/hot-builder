var through = require('through2');
var path = require('path');

module.exports = function(bundler, opts) {
  var entryId = null;

  bundler.pipeline.get('label').push(through.obj(function(row, enc, next) {
    if (/src\/browser\.js$/.test(row.file.replace(new RegExp('\\' + path.sep, 'g'), '/'))) {
      entryId = row.id;
    }
    if (entryId !== null) {
      bundler._bpack.standaloneModule = entryId;
    }

    this.push(row)
    next();
  }));
};
