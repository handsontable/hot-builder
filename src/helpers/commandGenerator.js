'use strict';

var path = require('path');

module.exports = function commandGenerator(task, options) {
  var binPath = path.resolve(__dirname, '../tasks/' + task + '/bin/worker.js');

  return 'node ' + binPath + ' \'' + JSON.stringify(options) + '\'';
}
