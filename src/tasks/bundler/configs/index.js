var fs = require('fs');
var path = require('path');
var moment = require('moment');

module.exports.VALID_CONFIGS = [
  'dev',
  'devFull',
  'prod',
  'prodFull',
  'langDev',
  'langProd',
];

module.exports.CONFIG_DESCRIPTIONS = {
  dev: 'Generating *.js and *.css files...',
  devFull: 'Generating *.full.js and *.full.css files...',
  prod: 'Generating *.min.js and *.min.css files...',
  prodFull: 'Generating *.full.min.js and *.full.min.css files...',
  langDev: 'Generating languages/*.js files...',
  langProd: 'Generating languages/*.min.js files...',
};

module.exports.create = function(options) {
  var tasks = [];
  var licenseBody = fs.readFileSync(path.resolve(options.input, 'licenses', options.isPro ? 'Pro' : 'CE', 'LICENSE.txt'), 'utf8');
  var packageBody = JSON.parse(fs.readFileSync(path.resolve(options.input, 'package.json'), 'utf8'));
  var hotConfig = require(path.resolve(options.input, 'hot.config.js'));

  licenseBody += '\nVersion: ' + packageBody.version;
  licenseBody += '\nDate: ' + new Date();

  options.PRO = options.isPro;
  options.PACKAGE_NAME = packageBody.name;
  options.OUTPUT_FILENAME = 'handsontable' + (options.PRO ? '-pro' : '');
  options.LICENSE = licenseBody;

  process.env.HOT_VERSION = packageBody.version;
  process.env.HOT_BUILD_DATE = moment().format('DD/MM/YYYY HH:mm:ss');
  process.env.HOT_RELEASE_DATE = hotConfig.HOT_RELEASE_DATE;
  process.env.HOT_PACKAGE_TYPE = options.isPro ? 'pro' : 'ce';

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
