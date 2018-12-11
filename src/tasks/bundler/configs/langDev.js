'use strict';

/**
 * Config responsible for building not minified Handsontable `/languages` files.
 */

var path = require('path');
var StringReplacePlugin = require('string-replace-webpack-plugin');
var fs = require('fs');

function getEntryJsFiles(options) {
  var HANDSONTABLE_SOURCE_LANGUAGES_DIRECTORY = 'src/i18n/languages';
  var entryObject = {};
  var languagesDirectory = path.resolve(options.input, HANDSONTABLE_SOURCE_LANGUAGES_DIRECTORY);
  var filesInLanguagesDirectory = fs.readdirSync(languagesDirectory);

  filesInLanguagesDirectory.forEach(function (fileName) {
    var jsExtensionRegExp = /\.js$/;

    if (jsExtensionRegExp.test(fileName)) {
      var fileNameWithoutExtension = fileName.replace(jsExtensionRegExp, '');

      if (fileNameWithoutExtension === 'index') {
        fileNameWithoutExtension = 'all';
      }

      entryObject[fileNameWithoutExtension] = path.resolve(languagesDirectory, fileName);
    }
  });

  return entryObject;
}

function getRuleForSnippetsInjection(options) {
  var NEW_LINE_CHAR = '\n';

  return {
    test: /\.js$/,
    loader: StringReplacePlugin.replace({
      replacements: [
        {
          pattern: /import.+constants.+/,
          replacement: function() {
            var snippet1 = "import Handsontable from '../../handsontable';";
            var snippet2 = 'const C = Handsontable.languages.dictionaryKeys;';

            return snippet1 + NEW_LINE_CHAR + NEW_LINE_CHAR + snippet2;
          }
        },
        {
          pattern: /export default dictionary.+/,
          replacement: function(matchingPhrase) {
            var snippet = 'Handsontable.languages.registerLanguageDictionary(dictionary);';

            return snippet + NEW_LINE_CHAR + NEW_LINE_CHAR + matchingPhrase;
          }
        }
      ]
    })
  };
}

function getExternalsConfig(options) {
  var externals = {};

  externals['../../handsontable'] = {
    root: 'Handsontable',
    commonjs2: '../../handsontable',
    commonjs: '../../handsontable',
    amd: '../../handsontable'
  };

  return externals;
}

module.exports.create = function create(options) {
  var OUTPUT_LANGUAGES_DIRECTORY = 'languages';
  var languagesOutputDirectory = path.resolve(options.outputDir, OUTPUT_LANGUAGES_DIRECTORY);

  return {
    entry: getEntryJsFiles(options),
    output: {
      path: languagesOutputDirectory,
      libraryTarget: 'umd',
      filename: '[name].js',
      // Workaround: Without this option webpack would export all language packs as globals
      libraryExport: '___',
      umdNamedDefine: true
    },
    externals: getExternalsConfig(options),
    resolveLoader: {
      modules: [path.resolve(options.input, '.config/loader'), path.resolve(options.input, 'node_modules'), 'node_modules'],
    },
    module: {
      rules: [
        {test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader'},
        getRuleForSnippetsInjection(options)
      ]
    }
  };
};
