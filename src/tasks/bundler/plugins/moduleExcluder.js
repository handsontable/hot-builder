function isMatches(patterns, valueToCheck) {
  return patterns.some(function(pattern) {
    var matches = new RegExp(pattern, 'i').test(valueToCheck);

    return matches;
  });
}

module.exports = function _moduleExcluder() {
  return {
    visitor: {
      ImportDeclaration: {
        enter: function(nodePath, options) {
          var excludedModules = options.opts.excludedModules;

          var pluginPath = nodePath.node.source.value.split('/');
          // Check if we importing specyfied plugin ([".", "columnSorting", "columnSorting"]) and not a file called like plugin.
          var isPlugin = pluginPath[1] === pluginPath[2];

          if (isPlugin && isMatches(excludedModules, nodePath.node.source.value)) {
            nodePath.remove();
          }
        },
      },

      ExportSpecifier: {
        enter: function(nodePath, options) {
          var excludedModules = options.opts.excludedModules;

          if (nodePath.node.exported.loc && isMatches(excludedModules, nodePath.node.exported.loc.identifierName)) {
            nodePath.remove();
          }
        }
      }
    },
  };
};
