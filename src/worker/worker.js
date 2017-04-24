'use strict';

var chalk = require('chalk');
var eventEmitter = require('event-emitter');
var spawnCommand = require('spawn-command');
var treeKill = require('tree-kill');
var leftPad = require('left-pad');
var ConsoleReporter = require('./../reporters/console');

/**
 * @param {String} command Command to run in the background.
 * @param {String} description Description of the task.
 */
function Worker(command, description, options) {
  this.command = command;
  this.options = options || {
    padding: 0,
  };
  this.description = description;
  this.process = null;
  this.working = false;
  this.killed = false;
  this.error = false;
  this.output = {};

  var padding = this.options.padding ? leftPad(' ', this.options.padding, ' ') : '';

  this.consoleReporter = new ConsoleReporter(padding + '[' + chalk.yellow(':spinner') + '] :description :padding :status', {
    status: chalk.dim('[working]'),
  });
  this.consoleReporter.on('stopped', this.onConsoleReporterStopped.bind(this));
}

eventEmitter(Worker.prototype);

/**
 * Mark the worker as a finished task.
 */
Worker.prototype.finished = function() {
  this.working = false;

  if (this.error) {
    this.consoleReporter.updateCustomTokens({
      status: chalk.dim('[error]'),
      spinner: chalk.red(':cancelled_mark'),
    });
  } else {
    this.consoleReporter.updateCustomTokens({
      status: chalk.dim('[finished]'),
      spinner: chalk.green(':done_mark'),
    });
  }

  this.consoleReporter.stop();
};

/**
 * Run the worker.
 */
Worker.prototype.run = function() {
  if (this.working) {
    return;
  }
  this.process = spawnCommand(this.command, {});
  this.process.stdout.on('data', function(data) {
    try {
      this.output = JSON.parse(data.toString('utf8'));
    } catch (ex) {
      this.output = {};
    }
  }.bind(this));
  this.process.on('close', function(err) {
    this.error = err ? true : false;

    if (!this.killed) {
      this.finished();
    }
  }.bind(this));

  this.working = true;
  this.consoleReporter.updateCustomTokens({
    description: chalk.green(this.description),
  });
};

/**
 * Kill the worker.
 *
 * @param {String} signal Signal name to send to the process with kill command.
 */
Worker.prototype.kill = function(signal) {
  this.working = false;
  this.killed = true;
  this.consoleReporter.updateCustomTokens({
    status: chalk.dim('[cancelled]'),
    spinner: chalk.red(':cancelled_mark'),
  }).stop();

  treeKill(this.process.pid, signal);
  this.process = null;
};

Worker.prototype.onConsoleReporterStopped = function() {
  if (this.error) {
    this.emit('error');
  } else {
    this.emit('finished', this.killed, this.output);
  }
};

module.exports = Worker;
