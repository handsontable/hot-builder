'use strict';

var leftPad = require('left-pad');
var stringLength = require('string-length');

var TOKEN = ':padding';

module.exports = function() {
  return function(reporter) {
    var messageParts = reporter.compiledMessage.split(TOKEN);
    var position = stringLength(messageParts[0]);
    // 68 chars - to keep max length below or equal to 80 chars.
    var charsToRepeat = 68 - position;

    reporter.setCompiledMessage(reporter.compiledMessage.replace(TOKEN, leftPad(' ', charsToRepeat)));
  }
};
