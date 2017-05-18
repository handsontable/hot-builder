'use strict';

var TOKEN = ':spinner';
var CHARS = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'.split('');

module.exports = function() {
  var currentFrame = 0;
  var maxFrames = CHARS.length;

  return function(reporter) {
    reporter.setCompiledMessage(reporter.compiledMessage.replace(TOKEN, CHARS[currentFrame]));
    currentFrame = ++currentFrame % maxFrames;
  }
};
