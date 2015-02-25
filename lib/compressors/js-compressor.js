
var UglifyJS = require('uglify-js');


module.exports = function compress(content) {
  var topLevel = null, output;

  output = UglifyJS.OutputStream({
    beautify: false,
    source_map: null,
    comments: /^!|@preserve|@license|@cc_on/i
  });
  topLevel = UglifyJS.parse(content, {
    toplevel: topLevel
  });
  topLevel.print(output);

  return output.get();
};
