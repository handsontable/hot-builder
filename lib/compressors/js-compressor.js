
var UglifyJS = require('uglify-js');


module.exports = function compress(content) {
  var compileOptions = {
    fromString: true,
    output: {
      comments: /^!|@preserve|@license|@cc_on/i
    }
  };

  return UglifyJS.minify(content, compileOptions).code;
};
