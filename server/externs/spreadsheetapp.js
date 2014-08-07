/**
 * @fileoverview Google Apps Script SpreadsheetApp
 * @see https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app
 */



/**
 * @constructor
 * @struct
 * @noalias
 */
function SpreadsheetApp() {}


// TODO(arthurhsu): property DataValidationCriteria


/**
 * @param {string} name
 * @param {number=} opt_rows
 * @param {number=} opt_columns
 * @return {Spreadsheet}
 */
SpreadsheetApp.prototype.create;


/** @type {!Function} */
SpreadsheetApp.prototype.flush;


/** @return {Spreadsheet} */
SpreadsheetApp.prototype.getActive;


/** @return {Range} */
SpreadsheetApp.prototype.getActiveRange;


/** @return {Sheet} */
SpreadsheetApp.prototype.getActiveSheet;


/** @return {Ui} */
SpreadsheetApp.prototype.getUi;


/** @return {DataValidationBuilder} */
SpreadsheetApp.prototype.newDataValidation;


/**
 * @param {File} file
 * @return {Spreadsheet}
 */
SpreadsheetApp.prototype.open;


/**
 * @param {string} id
 * @return {Spreadsheet}
 */
SpreadsheetApp.prototype.openById;


/**
 * @param {string} url
 * @return {Spreadsheet}
 */
SpreadsheetApp.prototype.openByUrl;


/**
 * @param {!Range} range
 * @return {!Range}
 */
SpreadsheetApp.prototype.setActiveRange;


/**
 * @param {!Sheet} sheet
 * @return {!Sheet}
 */
SpreadsheetApp.prototype.setActiveSheet;


/** @param {!Spreadsheet} newActiveSpreadsheet */
SpreadsheetApp.prototype.setActiveSpreadsheet;
