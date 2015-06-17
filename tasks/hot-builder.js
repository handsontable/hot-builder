
'use strict';

var HotBuilder = require('./../lib/builder');

module.exports = function hotBuilder(grunt) {
  grunt.registerMultiTask('hotBuilder', 'Handsontable custom builder.', function() {
    var options, builder, done, file;

    // setup default option values
    options = this.options({
      disableUI: true,
      devMode: false,
      includeTypes: ['all'],
      external: ['plugins', 'validators', 'renderers', 'editors'],
      minify: false
    });

    if (this.files.length) {
      file = this.files[0];

      if (file.src && file.src[0]) {
        options.input = file.src[0];
      }
      if (file.dest) {
        options.outputDir = file.dest;
      }
    }
    done = this.async();

    builder = new HotBuilder(null, options);
    builder.on('complete', function() {
      done();
    });
  });
};
