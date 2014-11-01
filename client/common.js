/**
 * @fileoverview Common helper functions for page generator.
 * @author Arthur Hsu (arthurhsu@westsidechineseschool.org)
 */


/**
 * Extract label in brackets, for example, @@start{something} => something.
 * @param {string} line
 * @return {?string} label
 */
function extractLabel(line) {
  var matches = line.match(/\{(.*)\}/);
  return matches ? matches[1] : null;
}


exports.extractLabel = extractLabel;
