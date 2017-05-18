'use strict';

var path = require('path');

module.exports = function commandGenerator(task, options) {
  var binPath = path.resolve(__dirname, '../tasks/' + task + '/bin/worker.js');
  var data = JSON.stringify(options);

  data = data.replace(/"/g, '\\"');

  return 'node "' + binPath + '" "' + data + '"';
}
