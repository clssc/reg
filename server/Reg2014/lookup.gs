/** @const {string} */
var NAME_LOOKUP = '1cPxKNHb7UkX-HYX6C92foLGDEUJB8KTkVxbkZwOODKU';


/**
 * Family number lookup object, used to avoid loading the spreadsheet
 * multiple times.
 * @param {string} opt_dbName Spreadsheet name to open as database.
 * @constructor
 */
FamilyNumberLookup = function(opt_dbName) {
  /** @private {!Array.<?string>} */
  this.engNames_ = [];
  
  /** @private {!Array.<?string>} */
  this.chnNames_ = [];
  
  /** @private {!Array.<number>} */
  this.fn_ = [];

  var sheet = SpreadsheetApp.openById(NAME_LOOKUP).getActiveSheet();
  var rows = sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  
  for (var i = 0; i < rows.length; ++i) {
    this.engNames_.push(rows[i][0].toLowerCase());
    this.chnNames_.push(rows[i][1] || '');
    this.fn_.push(rows[i][2]);
  }
};


/**
 * @param {string} name Name of the family member.
 * @return {number} Family number, -1 means not found.
 */
FamilyNumberLookup.prototype.lookup = function(name) {
  target = name.toLowerCase().trim();
  if (target.length == 0) {
    return -1;
  }
  var index = this.engNames_.indexOf(target);
  if (index == -1) {
    index = this.chnNames_.indexOf(target);
  }
  if (index != -1) {
    return this.fn_[index];
  }
  return -1;
};


function testFastFamilyNumberLookup() {
  var lookup = new FamilyNumberLookup();
  Logger.log(lookup.lookup('Rebecca Hsu'));
  Logger.log(lookup.lookup('徐振家'));
  Logger.log(lookup.lookup('Nosuch People'));
}