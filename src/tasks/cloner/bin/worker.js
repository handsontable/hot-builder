'use strict';

var gitClone = require('git-clone');
var tmp = require('tmp');

(function main() {
  var options;

  try {
    options = JSON.parse(process.argv[2]);
  } catch (ex) {
    throw Error('Invalid JSON was provided.');
  }

  var dirRef = tmp.dirSync({
    prefix: 'hot-builder-' + options.repositoryTag + '-',
  });

  var repository = 'https://github.com/handsontable/handsontable';

  if (options.pro) {
    repository = 'https://github.com/handsontable/handsontable-pro';
  }

  gitClone(repository, dirRef.name, {
    checkout: options.repositoryTag,
  }, function(err) {
    if (err) {
      throw Error('Unable to clone the repository.');
    }

    /* eslint-disable no-console */
    console.log(JSON.stringify({
      path: dirRef.name,
    }));
  });
}());
