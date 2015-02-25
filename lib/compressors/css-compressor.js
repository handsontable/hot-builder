
var cssmin = require('cssmin');


module.exports = function compress(content) {
  return cssmin(content);
};
