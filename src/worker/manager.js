'use strict';

var Worker = require('./worker');

module.exports = function(commands, options, finishedCallback, errorCallback) {
  var workers = [];
  var onFinished = runOnTasksDone(commands.length, finishedCallback);

  commands.forEach(function(command) {
    var worker = new Worker(command.command, command.description, command.options);

    worker.run();
    worker.on('finished', onFinished);
    worker.on('error', errorCallback);

    if (options.debug) {
      worker.process.stdout.pipe(process.stdout);
      worker.process.stderr.pipe(process.stderr);
    }
    workers.push(worker);
  });

  ['SIGINT', 'SIGTERM'].forEach(function(signal) {
    process.on(signal, function() {
      workers.forEach(function(worker) {
        worker.kill(signal);
      });
    });
  });
};

function runOnTasksDone(tasksCount, callback) {
  var finishedTasksCount = 0;
  var killed = false;

  return function(_killed, workerData) {
    finishedTasksCount++;

    if (_killed) {
      killed = _killed;
    }
    if (finishedTasksCount >= tasksCount) {
      callback(killed, workerData);
    }
  }
}
