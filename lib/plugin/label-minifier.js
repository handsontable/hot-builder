var through = require('through2');

module.exports = function(bundler, opts) {
  bundler.pipeline.get('label').push(through.obj(function(row, enc, next) {
    var deps = {};

    Object.keys(row.deps).forEach(function (key) {
      deps[identifyModuleName(key)] = row.deps[key];
    });
    row.deps = deps;

    var indexDeps = {};
    Object.keys(row.indexDeps).forEach(function (key) {
      deps[identifyModuleName(key)] = row.indexDeps[key];
    });
    row.indexDeps = indexDeps;

    row.source = correctModuleName(row.source);

    this.push(row);
    next();
  }));
};

function identifyModuleName(name) {
  return name
    .replace(/^\.\/(\.\.\/){0,}/, '')
    .replace(/^(\.\.\/){0,}hot\-builder\/node_modules\/handsontable\/src\//, '')
  ;
}

function correctModuleName(source) {
  return source
    .replace(/require(?: )?\(\"\.\/(?:\.\.\/){0,}(.+)\"\)/g, 'require("$1")')
    .replace(/require(?: )?\(\"\.\.\/(?:\.\.\/){0,}(?:hot\-builder\/node_modules\/handsontable\/src\/)(.+)\"\)/g, 'require("$1")')
  ;
}
