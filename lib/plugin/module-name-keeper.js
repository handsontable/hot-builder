var through = require('through2');

module.exports = function(bundler, opts) {
  var entryId = null;

  bundler.pipeline.get('label').push(through.obj(function(row, enc, next) {
    if (/src\/browser\.js$/.test(row.file)) {
      entryId = row.id;
    }
    if (entryId !== null) {
      bundler._bpack.standaloneModule = entryId;
    }

    this.push(row)
    next();
  }));
};
