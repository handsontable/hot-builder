'use strict';

var eventEmitter = require('event-emitter');
var cancelledMarkVisitor = require('./tokenVisitors/cancelledMark');
var customVisitor = require('./tokenVisitors/custom');
var doneMarkVisitor = require('./tokenVisitors/doneMark');
var paddingVisitor = require('./tokenVisitors/padding');
var spinnerVisitor = require('./tokenVisitors/spinner');
var logger = require('./../helpers/logger');

/**
 * @param {String} message Message pattern to print.
 */
function Console(message, customTokens) {
  this.quiet = logger().transports.caporal.level === 'warn';
  this.message = message;
  this.compiledMessage = message;
  /* eslint-disable no-console */
  this.draft = this.quiet ? null : console.draft();
  this.timer = null;
  this.stopped = false;
  this.customTokens = customTokens || {};
  this.visitors = [
    customVisitor(this.customTokens),
    cancelledMarkVisitor(),
    doneMarkVisitor(),
    spinnerVisitor(),
    paddingVisitor(),
  ];

  this.run();
}

eventEmitter(Console.prototype);

/**
 * Update custom tokens.
 *
 * @param  {Object} tokens Object with tokens to update.
 * @return {Console}
 */
Console.prototype.updateCustomTokens = function(tokens) {
  Object.keys(tokens).forEach(function(tokenName) {
    this.customTokens[tokenName] = tokens[tokenName];
  }, this);

  return this;
}

/**
 * Set compiled message. This method is used by several token visitors which are responsible for parsing tokens to
 * specyfic values.
 *
 * @param  {String} compiledMessage Pre or compiled message to print into terminal.
 * @return {Console}
 */
Console.prototype.setCompiledMessage = function(compiledMessage) {
  this.compiledMessage = compiledMessage;

  return this;
}

/**
 * Render console messages into terminal.
 *
 * @return {Console}
 */
Console.prototype.run = function() {
  if (this.timer || this.quiet) {
    return;
  }

  this.timer = setInterval(function() {
    this.compiledMessage = this.message;

    this.visitors.forEach(function(visitor) {
      visitor(this);
    }, this);

    this.draft(this.compiledMessage);

    if (this.stopped) {
      clearInterval(this.timer);
      this.timer = null;
      this.emit('stopped');
    }
  }.bind(this), 80);

  return this;
}

/**
 * Stop render messages into terminal.
 *
 * @return {Console}
 */
Console.prototype.stop = function() {
  this.stopped = true;

  if (this.quiet) {
    this.emit('stopped');
  }

  return this;
}

module.exports = Console;
