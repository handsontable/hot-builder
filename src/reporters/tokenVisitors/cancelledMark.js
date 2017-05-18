'use strict';

var TOKEN = ':cancelled_mark';

module.exports = function() {
  return function(reporter) {
    reporter.setCompiledMessage(reporter.compiledMessage.replace(TOKEN, '\u2717'));
  }
};
