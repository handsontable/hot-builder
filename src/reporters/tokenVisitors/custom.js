'use strict';

module.exports = function(customTokens) {
  return function(reporter) {
    Object.keys(customTokens).forEach(function(tokenName) {
      var value = customTokens[tokenName];

      if (value === void 0) {
        value = '';
      }

      reporter.setCompiledMessage(reporter.compiledMessage.replace(':' + tokenName, value));
    });
  }
};
