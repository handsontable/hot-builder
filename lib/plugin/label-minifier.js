
var through = require('through2');


module.exports = function (bundler, opts) {
  bundler.pipeline.get('label').push(through.obj(function (row, enc, next) {
    var deps = {};

    Object.keys(row.deps).forEach(function (key) {
      deps[key.replace(/^\.\/(\.\.\/){0,}/, '')] = row.deps[key];
    });
    row.deps = deps;

    var indexDeps = {};
    Object.keys(row.indexDeps).forEach(function (key) {
      deps[key.replace(/^\.\/(\.\.\/){0,}/, '')] = row.indexDeps[key];
    });
    row.indexDeps = indexDeps;

    row.source = row.source.replace(/require\(\"\.\/(?:\.\.\/){0,}(.+)\"\)/g, 'require("$1")');

    this.push(row);
    next();
  }));
};
