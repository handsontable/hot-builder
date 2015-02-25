
var variables = {
  year: new Date().getFullYear(),
  timestamp: new Date()
};

/**
 * Replace text with variables
 *
 * @param {String} source
 */
module.exports.replace = function replace(source) {
  Object.keys(variables).forEach(function(key) {
    source = source.replace(new RegExp('@@' + key, 'g'), variables[key]);
  });

  return source;
};

/**
 * Set vars
 *
 * @param {Object} vars
 */
module.exports.setVariables = function(vars) {
  Object.keys(vars).forEach(function(key) {
    if (typeof vars[key] === 'string') {
      variables[key] = vars[key];
    }
  });
};
