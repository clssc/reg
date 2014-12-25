/**
 * @fileoverview The tuition breakdown abstraction.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */


/**
 * TuitionBreakdown2015
 * @const {string}
 */
var TUITION_BREAKDOWN_DOCID = '1BP33zMdftNkVhd6cRmniDYTVP_gHW14GVMnXrwvrh0Y';



/**
 * Data item of 'TuitionBreakdown'.
 * @param {Array.<Object>} values
 * @struct
 * @constructor
 */
TuitionItem = function(values) {
  /** @type {number} */
  this.family_number = values[0];
  
  /** @type {number} */
  this.num_students = values[1];
  
  /** @type {number} */
  this.service_points = values[2];
  
  /** @type {number} */
  this.early_tuition = values[3];
  
  /** @type {number} */
  this.normal_tuition = values[4];
  
  /** @type {number} */
  this.actual_tuition = values[5];
  
  /** @type {number} */
  this.service_fine = values[6];
  
  /** @type {number} */
  this.credits = values[7];
  
  /** @type {number} */
  this.total = values[8];
  
  /** @type {string} */
  this.notes = values[9];
};



/**
 * The tuition breakdown sheet.
 * @param {string=} opt_dbName Spreadsheet name to open as database.
 * @constructor
 */
var TuitionBreakdownDB = function(opt_dbName) {
  /** @private {!Sheet} */
  this.sheet_;
  
  this.initialize_(opt_dbName || TUITION_BREAKDOWN_DOCID);
};


/**
 * Reads the DB and construct map.
 * @param {string=} opt_dbName Spreadsheet name to open as database
 */
TuitionBreakdownDB.prototype.initialize_ = function(opt_dbName) {
  var dbName = opt_dbName || 'TuitionBreakdownDB' + getSchoolYear().toString();
  var openById = (dbName == TUITION_BREAKDOWN_DOCID);
  var spreadsheet = openById ? SpreadsheetApp.openById(dbName) : lookupAndOpenFile(dbName);
  
  this.sheet_ = spreadsheet.getSheets()[0];
  DebugLog('opened ' + dbName);
};


/**
 * Finds row by family id.
 * @param {number} familyId
 * @return {?Range} The row, or null if not found.
 * @private
 */
TuitionBreakdownDB.prototype.findRow_ = function(familyId) {
  var range = this.sheet_.getRange(2, 1, this.sheet_.getLastRow(), this.sheet_.getLastColumn());
  var rows = range.getValues();
  for (var i = 0; i < rows.length; ++i) {
    if (rows[i][0] == familyId) {
      var cellRange = 'A' + (i + 2).toString() + ':J' + (i + 2).toString();
      results = this.sheet_.getRange(cellRange.toString());
      return results;
    }
  }
  return null;
};


/**
 * Deletes a row.
 * @param {number} familyId
 */
TuitionBreakdownDB.prototype.remove = function(familyId) {
  var row = this.findRow_(familyId);
  if (row) {
    var position = row.getRow();
    this.sheet_.deleteRow(position);
  }
};


/**
 * Inserts or replaces data in the sheet.
 * @param {TuitionItem} item
 */
TuitionBreakdownDB.prototype.insertOrReplace = function(item) {
  var row = this.findRow_(item.family_number);
  var values = [
    item.family_number,
    item.num_students,
    item.service_points,
    item.early_tuition,
    item.normal_tuition,
    item.actual_tuition,
    item.service_fine,
    item.credits,
    item.total,
    item.notes
  ];
  
  if (row) {
    // This is an replacement.
    row.setValues([values]);
    return;
  }
  
  // This is an insertion.
  this.sheet_.appendRow(values);
};


/**
 * Select row from the sheet by family id, or return null if not found.
 * @param {number} familyId
 * @return {?TuitionItem}
 */
TuitionBreakdownDB.prototype.select = function(familyId) {
  var range = this.findRow_(familyId);
  if (range) {
    return new TuitionItem(range.getValues()[0]);
  }
  return null;
};


function testTuitionBreakdownSelect() {
  var sheet = new TuitionBreakdownDB('TuitionBreakdownTest');
  var item1 = sheet.select(3366);
  var item2 = sheet.select(3388);
  assertNull(item2);
  assertEquals(3366, item1.family_number);
}

function testTuitionBreakdownSCUD() {
  var sheet = new TuitionBreakdownDB('TuitionBreakdownTest');
  sheet.remove(3322);
  var item = new TuitionItem([
    3322,
    1,
    15,
    600,
    700,
    700,
    100,
    0,
    800,
    'test'
  ]);
  sheet.insertOrReplace(item);
  var item2 = sheet.select(3322);
  assertEquals(15, item2.service_points);
  assertEquals(100, item2.service_fine);
  assertEquals(800, item2.total);
  
  item.service_points = 20;
  item.service_fine = 0;
  item.total = 700;
  sheet.insertOrReplace(item);
  
  var item3 = sheet.select(3322);
  assertEquals(20, item3.service_points);
  assertEquals(0, item3.service_fine);
  assertEquals(700, item3.total);
  
  sheet.remove(3322);
  assertNull(sheet.select(3322));
}