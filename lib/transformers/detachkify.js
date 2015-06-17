// https://github.com/adnanh/detachkify/blob/master/src/detachkify.js
var path = require('path');
var startsWith = require('starts-with');
var tools = require('browserify-transform-tools');

// Transform function
function transform(args, opts, cb) {
  var req = args[0];
  var prefix = opts.config.prefix || '/';

  if (!startsWith(req, prefix)) {
    return cb();
  }
  if (prefix !== '/') {
    req = req.replace(opts.config.prefix, '');
  }

  opts.config.relativeTo = opts.config.relativeTo || process.cwd();
  var newRequire = path.relative(path.dirname(opts.file), path.join(opts.config.relativeTo, req));
  newRequire = newRequire.replace(/\\/g, '/');

  // in case the file is located in the current directory or a directory within the current directory, make sure to prepend './'
  if (newRequire[0] !== '.') {
    newRequire = './' + newRequire;
  }

  if (opts.config.verbose) {
    console.log(args[0], newRequire);
  }

  return cb(null, 'require("' + newRequire + '")');
}

// Transform options
var transformOpts = {
  evaluateArguments: true,
  jsFilesOnly: true
};

// Export transform
module.exports = tools.makeRequireTransform('detachkify', transformOpts, transform);
