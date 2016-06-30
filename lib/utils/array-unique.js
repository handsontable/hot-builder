/**
 * Unique array values.
 *
 * @param {Array} array
 * @return {Array}
 */
module.exports = function arrayUnique(array) {
  return array.filter(function(item, i, arr) {
    return arr.indexOf(item) === i;
  });
};
