'use strict';

var spawnCommand = require('spawn-command');

(function main() {
  var options;

  try {
    options = JSON.parse(process.argv[2]);
  } catch (ex) {
    throw Error('Invalid JSON was provided.');
  }

  spawnCommand('cd ' + options.input + ' && npm install', {stdio: 'inherit'});
}());
