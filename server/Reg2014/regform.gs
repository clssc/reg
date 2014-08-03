/**
 * Early bird tuition per student.
 * @const {number}
 */
var EARLY_BIRD_TUITION = 600;


/**
 * Normal tuition per student.
 * @const {number}
 */
var NORMAL_TUITION = 700;


/**
 * Service points deposit per family.
 * @const {number}
 */
var SERVICE_DEPOSIT = 200;


/**
 * Service fine per point.
 * @const {number}
 */
var SERVICE_FINE = 20;


/**
 * Minimal service points requirements.
 * @const {number}
 */
var MIN_SERVICE_POINTS = 20;


/**
 * Name of template to use.
 * @const {string}
 */
var REG_FORM_TEMPLATE = 'RegFormTemplate';


/**
 * Blank RegForm Name.
 * @const {string}
 */
var BLANK_REG_FORM = 'BlankRegForm';


/**
 * Blank RegForm Name.
 * @const {string}
 */
var REG_FORM = 'RegForm';



/**
 * The registration form generation class.
 * @param {string=} opt_dataFileName Spreadsheet name to open.
 * @constructor
 */
RegForm = function(opt_dataFileName) {
  /** @type {Db} */
  this.db_ = undefined;
  
  /** @type {ServiceDb} */
  this.serviceDb_ = undefined;

  this.initialize_(opt_dataFileName);
};


/**
 * Initializes reg form generator.
 * @param {string=} opt_dataFileName Spreadsheet name to open.
 * @param {string=} opt_serviceDbName
 * @private
 */
RegForm.prototype.initialize_ = function(opt_dataFileName, opt_serviceDbName) {
  this.db_ = new Db(opt_dataFileName);
  this.serviceDb_ = new ServiceDb(opt_serviceDbName);
};


/**
 * Copies contents from template file.
 * @param {Document} dstDoc Destination document.
 * @return {Body}
 * @private
 */
RegForm.prototype.copyTemplate_ = function(dstDoc) {
  var year = getSchoolYear();
  return copyTemplate(REG_FORM_TEMPLATE + year, dstDoc);
};


/**
 * Scans and fills element.
 * @param {Element} element
 * @param {Object} data
 * @private
 */
RegForm.prototype.scanElement_ = function(element, data) {
  var type = element.getType();
  if (type == 'TEXT') {
    this.scanText_(element.asText(), data);
  } else if (type == 'TABLE') {
    this.scanTable_(element.asTable(), data);
  } else if (type == 'BODY_SECTION' ||
             type == 'DOCUMENT' ||
             type == 'PARAGRAPH') {
    // Supported ContainerElement
    for (var i = 0; i < element.getNumChildren(); ++i) {
      this.scanElement_(element.getChild(i), data);
    }
  }
};


/**
 * Scans and fills table.
 * @param {Table} table
 * @param {Object} data
 * @private
 */
RegForm.prototype.scanTable_ = function(table, data) {
  for (var i = 0; i < table.getNumChildren(); ++i) {
    var row = table.getChild(i).asTableRow();
    for (var j = 0; j < row.getNumChildren(); ++j) {
      var cell = row.getChild(j).asTableCell();
      var text = cell.editAsText();
      this.scanText_(text, data);
    }
  }
};


/**
 * Scans and fills text.
 * @param {Text} text
 * @param {Object} data
 * @private
 */
RegForm.prototype.scanText_ = function(text, data) {
  scanText(text, data, true);
};


/**
 * Generate form data.
 * @param {Number} familyNumber
 * @return {Object}
 */
RegForm.prototype.getFormData_ = function(familyNumber) {
  var family = this.db_.getFamily().get(familyNumber);
  var parents = this.db_.getParent().get(familyNumber);
  var students = this.db_.getStudent().get(familyNumber);
  if (students.length > 4) {
    DebugLog('FIXME: more than 4 students');
  }
  var data = {};
  data['fam_no'] = familyNumber;
  
  var parentFields = [
    'name',  // 0 english name
    'chn_name',  // 1 chinese name
    'occupation',  // 2 occupation
    'cell_phone',  // 3 cell phone
    'work_phone',  // 4 work phone
    'email',  // 5 email
    'n',  // 6 chinese level 0
    'o',  // 7 chinese level 1
    'g'   // 8 chinese level 2
  ];
  for (var i = 0; i < parents.length; ++i) {
    var fieldNames = [];
    for (var j = 0; j < parentFields.length; ++j) {
      fieldNames.push('p' + (i + 1) + parentFields[j]);
    }
    var p = parents[i];
    data[fieldNames[0]] = p.english_name;
    data[fieldNames[1]] = p.chinese_name;
    data[fieldNames[2]] = p.occupation;
    data[fieldNames[3]] = p.cell_phone;
    data[fieldNames[4]] = p.work_phone || family.home_phone;
    data[fieldNames[5]] = p.email;
    if (p.chinese_level > -1) {
      data[fieldNames[6 + p.chinese_level]] = '  V  ';
    }
  }
  
  data['address'] = family.street_address;
  data['city'] = family.city;
  data['st'] = family.state;
  data['zip'] = family.zip;
  data['home_phone'] = family.home_phone;
  //data['fax'] = family.fax;
  data['doctor_name'] = family.doctor_name;
  data['doctor_phone'] = family.doctor_phone;
  data['contact_name'] = family.contact_name;
  data['contact_phone'] = family.contact_phone;
  var studentFields = [
    'lname',  // 0 last name
    'fname',  // 1 first name
    'cname',  // 2 chinese name
    'dob',  // 3 dob
    'g',  // 4 gender
    'c',  // 5 current class
    'nc',  // 6 class next year
    's',  // 7 speak chinese at home?
    'tp'  // 8 text preference
  ];
  
  for (var i = 0; i < students.length; ++i) {
    var fieldNames = [];
    for (var j = 0; j < studentFields.length; ++j) {
      fieldNames.push('s' + (i + 1) + studentFields[j]);
    }
    var s = students[i];
    data[fieldNames[0]] = s.last_name;
    data[fieldNames[1]] = s.first_name;
    data[fieldNames[2]] = s.chinese_name;
    data[fieldNames[3]] = Utilities.formatDate(s.dob, 'GMT', 'MM/dd/yy');
    data[fieldNames[4]] = s.gender;
    data[fieldNames[5]] = s.prev_class;
    data[fieldNames[6]] = s.currClass;
    data[fieldNames[7]] = s.speak_chinese ? 'Y' : 'N';
    data[fieldNames[8]] = s.text_pref;
  }
  
  // Money Money Money
  var servicePoints = this.serviceDb_.lookup(familyNumber);
  data['num'] = students.length;
  data['subtotal1'] = NORMAL_TUITION * students.length;
  data['subtotal2'] = EARLY_BIRD_TUITION * students.length;
  data['svc'] = MIN_SERVICE_POINTS - servicePoints;
  data['svcfine'] = SERVICE_FINE * (MIN_SERVICE_POINTS - servicePoints);
  return data;
};


/**
 * Deletes existing doc, creates a new doc, places the doc under
 * folder Reports\<year>, then fill with data.
 * @param {string} fileName
 * @param {Object} data
 * @param {boolean} opt_force Force generate new file, default to false.
 * @return {[string, string]} Generated document id and URL.
 * @private
 */
RegForm.prototype.prepareDoc_ = function(fileName, data, opt_force) {
  var force = opt_force || false;
  if (!force) {
    var doc = lookupAndOpenDoc(fileName);
    if (doc) {
      // File exists, give up.
      return [doc.getId(), doc.getUrl()];
    }
  }
  
  var year = getSchoolYear();
  deleteFile(fileName);
  var doc = DocumentApp.create(fileName);
  shareFile(doc);
  var body = this.copyTemplate_(doc);
  this.scanElement_(body, data);  
  appendToDoc(body, doc);
  doc.saveAndClose();
  return [doc.getId(), doc.getUrl()];
};


/**
 * Generates empty reg form from template. The result is stored under folder
 * Reports\<year>.
 * @param {boolean=} opt_force Force generation, default to false.
 * @param {string=} opt_output Output file name, default to
 *     BLANK_REG_FORM + year.
 * @return {[string, string]} Generated document id and URL.
 */
RegForm.prototype.generateBlankRegForm = function(opt_force, opt_output) {
  var year = getSchoolYear();
  var fileName = opt_output || BLANK_REG_FORM + year;
  return this.prepareDoc_(fileName, {}, opt_force);
};


/**
 * Generates reg form from DB data. The result is stored under folder
 * Reports\<year>.
 * @param {number} familyNumber
 * @param {boolean=} opt_force Force generation, default to false.
 * @param {string=} opt_output Output file name, default to
 *     REG_FORM + year + '-' + familyNumber.
 * @return {[string, string]} Generated document id and URL.
 */
RegForm.prototype.generateRegForm = function(familyNumber, opt_force, opt_output) {
  var year = getSchoolYear();
  var fn = familyNumber || 1020;
  var fileName = opt_output || REG_FORM + year + '-' + fn;
  return this.prepareDoc_(fileName, this.getFormData_(fn), opt_force);
};


/**
 * Generates reg forms of students of a class. We can not generate forms of
 * all active students because that will yield timeout.
 * The results are stored under folder Reports\<year>.
 * @param {string} className Class of previous year.
 */
RegForm.prototype.generateRegFormsByClass = function(className) {
  // Find unique family numbers from active students.
  var familyNumbers = [];
  var students = this.db_.getStudent().getAllActive();
  for (var i = 0; i < students.length; ++i) {
    if (students[i].prev_class == className) {
      familyNumbers.push(students[i].family_number);
    }
  }
  familyNumbers.sort();
  var docIds = [];
  docIds.push(this.generateRegForm(familyNumbers[0], false));
  for (var i = 1; i < familyNumbers.length; ++i) {
    if (familyNumbers[i] !== familyNumbers[i - 1]) {
      docIds.push(this.generateRegForm(familyNumbers[i], false));      
    }
    DebugLog('[' + i + '/' + familyNumbers.length + '] ' + familyNumbers[i]);
  }
  
  // The following code was created to merge all generate docs in one
  // file. However, it seems that Google Apps Script is not reliable
  // enough to concatenate hundreds of files. Bummer.
  /*
  var year = getSchoolYear();
  var fileName = opt_output || REG_FORM + year;
  deleteFile(fileName);
  var doc = DocumentApp.create(fileName);
  var folder = DocsList.getFolder('Reports/' + year);
  var root = DocsList.getRootFolder();
  var docId = doc.getId();
  var docFile = DocsList.getFileById(docId);
  docFile.addToFolder(folder);
  docFile.removeFromFolder(root);
  this.copyTemplate_(doc);
  var body = doc.getBody();
  
  for (var i = 0; i < docIds.length; ++i) {
    // The reason we openById is because openUrl does not work with
    // the URL returned from getUrl(). Bummer.
    var src = DocumentApp.openById(docIds[i]);
    appendToDoc(src.getBody(), body);
    if (i != docIds.length - 1) {
      body.appendPageBreak();
    }
  }
  doc.saveAndClose();
  return [docId, doc.getUrl()];
  */
};

 
function analyzeDoc(body) {
  var dumpElement = function(element, prefix) {
    var type = element.getType();
    if (type == 'TEXT') {
      var text = element.asText().getText();
      if (text.length > 10) {
        text = text.substring(0, 10);
      }
      Logger.log(prefix + 'TEXT:' + text);
    } else if (type == 'TABLE') {
      Logger.log(prefix + 'TABLE:' + element.asTable().getNumRows());
    } else if (type == 'BODY_SECTION' ||
               type == 'DOCUMENT' ||
               type == 'PARAGRAPH') {
      Logger.log(prefix + type);
      // Supported ContainerElement
      for (var i = 0; i < element.getNumChildren(); ++i) {
        dumpElement(element.getChild(i), prefix + '  ');
      }
    } else {
      Logger.log(prefix + type);
    }
  };
  dumpElement(body, '');
}

function analyzeTemplate() {
  var year = getSchoolYear();
  var doc = lookupAndOpenDoc(REG_FORM_TEMPLATE + year);
  var body = doc.getBody();
  analyzeDoc(body);
}

function analyzeBlankForm() {
  var year = getSchoolYear();
  var doc = lookupAndOpenDoc(BLANK_REG_FORM + year);
  var body = doc.getBody();
  analyzeDoc(body);
}

function generateRegForm(familyNumber) {
  var form = new RegForm();
  return form.generateRegForm(familyNumber || 1014, true)[1];
}

function generateBlankRegForm() {
  var form = new RegForm();
  return form.generateBlankRegForm(true)[1];
}

function generateRegFormsByClass(className) {
  var form = new RegForm();
  form.generateRegFormsByClass(className || '8B');
}
