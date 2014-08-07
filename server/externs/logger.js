/**
 * @fileoverview Google Apps Script Enum Attribute
 * @see https://developers.google.com/apps-script/reference/base/logger
 */



/**
 * @constructor
 * @struct
 * @noalias
 */
function Logger() {}


/** @type {!Function} */
Logger.prototype.clear;


/** @return {string} */
Logger.prototype.getLog;


/**
 * @param {...*} var_args
 * @return {!Logger}
 */
Logger.prototype.log;
