/**
 * @fileoverview The registration database.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */

/**
 * File name of the database.
 * @type {string}
 * @const
 */
DB_NAME = 'RegDB';


/**
 * Globally cached DB instances.
 * @type {Object}
 * @const
 */
var DBInstances = {};


/**
 * The registration database.
 * @param {string} opt_dbName Spreadsheet name to open as database.
 * @constructor
 */
Db = function(opt_dbName) {
  /**
   * Tables in the database. App script does not allow enum,
   * so we need to use fragile strings.
   * @type {Object.<string, Sheet>}
   * @private
   */
  this.tables_ = {
    'Class': null,
    'Family': null,
    'Parent': null,
    'Student': null,
  };
  
  /**
   * Cached Class object.
   * @private {Class}
   */
  this.class_;
  
  /**
   * Cached Family object.
   * @private {Family}
   */
  this.family_;
  
  /**
   * Cached Parent object.
   * @private {Parent}
   */
  this.parent_;
  
  /**
   * Cached Student object.
   * @private {Student}
   */
  this.student_;
  
  this.initialize_(opt_dbName);
};


/**
 * Get Class data.
 * @return {Class}
 */
Db.prototype.getClass = function() {
  if (!this.class_) {
    this.class_ = new Class(this.loadData_('Class'));
  }
  return this.class_;
};


/**
 * Get Family data.
 * @return {Family}
 */
Db.prototype.getFamily = function() {
  if (!this.family_) {
    this.family_ = new Family(this.loadData_('Family'));
  }
  return this.family_;
};


/**
 * Get Parent data. This is a very expensive call, and caller is supposed
 * to cache the returned object.
 * @return {Family}
 */
Db.prototype.getParent = function() {
  if (!this.parent_) {
    this.parent_ = new Parent(this.loadData_('Parent'));
  }
  return this.parent_;
};


/**
 * Get Student data. This is a very expensive call, and caller is supposed
 * to cache the returned object.
 * @return {Student}
 */
Db.prototype.getStudent = function() {
  if (!this.student_) {
    this.student_ = new Student(this.loadData_('Student'));
  }
  return this.student_;
};


/**
 * Helper function to load data in table into memory.
 * @param {string} tableName The table to load.
 * @return {Range} Data range of the table (including titles).
 * @private
 */
Db.prototype.loadData_ = function(tableName) {
  var sheet = this.tables_[tableName];
  if (sheet) {
    // Skip title row.
    return sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn());
  }
  return null;
};


/**
 * Initialize database.
 * @param {string} opt_dbName
 * @private_
 */
Db.prototype.initialize_ = function(opt_dbName) {
  this.clear();
  
  // Search and open the spread sheet
  var dbName = opt_dbName || DB_NAME + getSchoolYear();
  var spreadsheet = lookupAndOpenFile(dbName);
  
  // Map all sheet objects
  if (spreadsheet) {
    var sheets = spreadsheet.getSheets();
    for (var i = 0; i < sheets.length; ++i) {
      this.tables_[sheets[i].getName()] = sheets[i];
    }
  }
  
  if (DBInstances[dbName]) {
    DebugLog('WARNING: recreating DB instance for ' + dbName);
  }
  DBInstances[dbName] = this;
  DebugLog('opened ' + dbName);
};


/**
 * Lookup family number by name of any member of that family. The name format
 * must be first_name last_name as what's input in enrollment form.
 * @param {string} name Name of the family member.
 * @return {number} Family number, -1 means not found.
 */
Db.prototype.lookupFamilyNumber = function(name) {
  if (name.trim().length == 0) {
    return -1;
  }
  var parents = this.getParent().getAll();
  var students = this.getStudent().getAll();
  var lowerCaseName = name.toLowerCase();
  
  // Search parent table first.
  for (var i = 0; i < parents.length; ++i) {
    if (parents[i].english_name.toLowerCase() == lowerCaseName ||
        parents[i].chinese_name == name) {
      return parents[i].family_number;
    }
  }
  
  // If not, search student table.
  for (var i = 0; i < students.length; ++i) {
    var english_name = students[i].first_name + ' ' + students[i].last_name;
    english_name = english_name.toLowerCase();
    if (english_name == lowerCaseName || students[i].chinese_name == name) {
      return students[i].family_number;
    }
  }
  
  return -1;
};


/** @param {Db} db Test database to use. */
function testLookupFamilyNumber(db) {
  assertEquals(-1, db.lookupFamilyNumber('Arthur Hsu'));
  assertEquals(8765, db.lookupFamilyNumber('Lily Lee'));
  assertEquals(8765, db.lookupFamilyNumber('lily lee'));
  assertEquals(8765, db.lookupFamilyNumber('李強'));
  assertEquals(2345, db.lookupFamilyNumber('John Doe'));
  assertEquals(2345, db.lookupFamilyNumber('杜凱琪'));
  DebugLog('testLookupFamilyNumber: PASSED');
}


/**
 * Resets Db to initial state.
 * Google Apps Script does not really supports prototype and
 * JavaScript inheritance. Creating two class objects in the
 * same file will cause merging.
 */
Db.prototype.clear = function() {
  this.tables_ = {
    'Class': null,
    'Family': null,
    'Parent': null,
    'Student': null,
  };
  this.class_ = undefined;
  this.family_ = undefined;
  this.parent_ = undefined;
  this.student_ = undefined;
};


/**
 * Detects errors in the database. This detects duplicates and inconsistencies.
 * Inconsistency means that a family number have only data in N of 3 tables where
 * 1 < N < 3.
 * @param {!Array.<string>} warnings Warning messages.
 */
Db.prototype.detectError = function(warnings) {
  this.getClass().detectDupe(warnings);
  this.getFamily().detectDupe(warnings);
  this.getParent().detectDupe(warnings);
  this.getStudent().detectDupe(warnings);
  
  // Now scan through the family numbers.
  var keys = [];
  var values = [];
  var families = this.family_.getAll();
  var parents = this.parent_.getAll();
  var students = this.student_.getAll();

  var mark = function(familyNumber, count) {
    var index = keys.indexOf(familyNumber);
    if (index == -1) {
      keys.push(familyNumber);
      values.push(count);
    } else {
      values[index] += count;
    }
  };
  
  for (var i = 0; i < families.length; ++i) {
    mark(families[i].family_number, 100);
  }
  for (var i = 0; i < parents.length; ++i) {
    mark(parents[i].family_number, 10);
  }
  for (var i = 0; i < students.length; ++i) {
    mark(students[i].family_number, 1);
  }
  
  for (var i = 0; i < keys.length; ++i) {
    if (values[i] < 111 || values[i] % 10 == 0 ||
        (values[i] / 10) % 10 == 0) {
      warnings.push('Inconsistent data: family number: ' + keys[i]);
    }
  }
  
  this.getFamily().detectError(warnings);
  this.getParent().detectError(warnings);
  this.getStudent().detectError(warnings);
};


/**
 * Merge sanitized pool.
 * @param {string} poolName File name of the pool.
 */
Db.prototype.mergePool = function(poolName) {
  // TODO(arthurhsu): implement
};


/**
 * Lookup next available family number.
 * @return {number}.
 */
Db.prototype.nextAvailableFamilyNumber = function() {
  var family = this.getFamily().getAll();
  var family_number = 0;
  for (var i = 0; i < family.length; ++i) {
    if (family[i].family_number > family_number) {
      family_number = family[i].family_number;
    }
  }
  return family_number + 1;  
};


/**
 * Get DB instance.
 * @param {string=} opt_dbName
 * @return {Db}
 */
Db.getInstance = function(opt_dbName) {
  var dbName = opt_dbName || DB_NAME + getSchoolYear();
  if (!DBInstances.dbName) {
    return new Db(dbName);
  }
  return DBInstances.dbName;
}


/** @param {Db} db Test database to use. */
function testNextAvailableFamilyNumber(db) {
  assertEquals(10000, db.nextAvailableFamilyNumber());
  DebugLog('testNextAvailableFamilyNumber: PASSED');
}


/** Shorthand of getting next available family number of current db */
function getNextAvailableFamilyNumber() {
  var db = Db.getInstance();
  DebugLog(db.nextAvailableFamilyNumber());
}