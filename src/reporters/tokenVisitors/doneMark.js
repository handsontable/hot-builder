'use strict';

var TOKEN = ':done_mark';

module.exports = function() {
  return function(reporter) {
    reporter.setCompiledMessage(reporter.compiledMessage.replace(TOKEN, '\u2713'));
  }
};
