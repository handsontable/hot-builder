var fs = require('fs');
var path = require('path');

module.exports.VALID_CONFIGS = [
  'dev',
  'devFull',
  'prod',
  'prodFull',
  'lang',
];

module.exports.CONFIG_DESCRIPTIONS = {
  dev: 'Generating *.js and *.css files...',
  devFull: 'Generating *.full.js and *.full.css files...',
  prod: 'Generating *.min.js and *.min.css files...',
  prodFull: 'Generating *.full.min.js and *.full.min.css files...',
  lang: 'Generating languages/*.js files...',
};

module.exports.create = function(options) {
  var tasks = [];

  var licenseBody = fs.readFileSync(path.resolve(options.input, 'LICENSE'), 'utf8');
  var packageBody = JSON.parse(fs.readFileSync(path.resolve(options.input, 'package.json'), 'utf8'));

  licenseBody += '\nVersion: ' + packageBody.version;
  licenseBody += '\nDate: ' + new Date();

  options.PACKAGE_VERSION = packageBody.version;
  options.PACKAGE_NAME = packageBody.name;
  options.OUTPUT_FILENAME = 'handsontable';
  options.PRO = packageBody.name === 'handsontable-pro';
  options.BUILD_DATE = new Date();
  options.BASE_VERSION = packageBody.dependencies.handsontable;
  options.LICENSE = licenseBody;

  return {
    use: function(task) {
      tasks.push(task);
    },

    getConfig: function() {
      var config = [];

      tasks.forEach(function(task) {
        config.push(task.create(options));
      });

      return config;
    }
  };
};
