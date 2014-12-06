/**
 * @fileoverview Common static utility functions.
 * @author arthurhsu@westsidechineseschool.org (Arthur Hsu)
 */

/**
 * Public folder to store shared reports.
 * @type {string}
 */
var PUBLIC_FOLDER = 'Reports';


/**
 * Paddings.
 * @const {string}
 */
var PADDINGS = '                                                            ';


/**
 * Returns current school year, if not specified.
 * The cut-off date is June 20 of every year.
 * @return {number}
 */
function getSchoolYear() {
  return 2015;
}


function logSchoolYear() {
  DebugLog('School year is: ' + getSchoolYear());
}


/**
 * Search for the spreadsheet of given file name.
 * WARNING: PERFORMANCE ISSUE IDENTIFIED
 * It takes at least 3 second to open a file.
 * @param {string} fileName
 * @return {Spreadsheet}
 */
function lookupAndOpenFile(fileName) {
  var files = getFilesByType('spreadsheet');
  for (var i = 0; i < files.length; ++i) {
    if (files[i].getName() == fileName) {
      return SpreadsheetApp.open(files[i]);
    }
  }
  return null;
}


/**
 * Output debug message to Log and Debug Log file.
 * @param {string} message
 */
function DebugLog(message) {
  Logger.log(message);
  var file = lookupAndOpenFile('DebugLog');
  var sheet = file.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var cell = sheet.getRange('a1').offset(lastRow, 0);
  cell.setValue(message);
}


/**
 * Search for the doc of given file name.
 * @param {string} fileName
 * @return {Document}
 */
function lookupAndOpenDoc(fileName) {
  var files = getFilesByType('document');
  for (var i = 0; i < files.length; ++i) {
    if (files[i].getName() == fileName) {
      return DocumentApp.openById(files[i].getId());
    }
  }
  return null;
}


/**
 * Ensure a doc is opened clean.
 * @param {string} fileName
 * @return {Document}
 */
function openCleanDoc(fileName) {
  var doc = lookupAndOpenDoc(fileName);
  if (!doc) {
    clearDoc(doc);
  } else {
    DocumentApp.create(fileName);
  }
}


/**
 * Trash file by name.
 * @param {string} fileName
 */
function deleteFile(fileName) {
  var files = getAllFiles();
  for (var i = 0; i < files.length; ++i) {
    if (files[i].getName() == fileName) {
      files[i].setTrashed(true);
      break;
    }
  }
}


/**
 * Copy file.
 * @param {string} fileName
 * @return {string} Copied file id.
 */
function copyFile(fileName) {
  var files = getAllFiles();
  for (var i = 0; i < files.length; ++i) {
    if (files[i].getName() == fileName) {
      return files[i].makeCopy().getId();
    }
  }
}


/**
 * Append a doc to the end of another doc.
 * @param {Body} src Doc to be appended.
 * @param {Body} dst Doc to append to.
 */
function appendToDoc(src, dst) {
  for (var i = 0; i < src.getNumChildren(); ++i) {
    appendElementToDoc(dst, src.getChild(i));
  }
  // Google Docs have a bug that it will append an empty paragraph before
  // paragraph except the last paragraph of a given page. Workaround.
  for (var i = dst.getNumChildren() - 1; i > 0; --i) {
    var current = dst.getChild(i);
    var previous = dst.getChild(i - 1);
    if (current.getType() == 'PARAGRAPH' &&
        previous.getType() == 'PARAGRAPH' &&
        previous.getNumChildren() == 0) {
      --i;
      dst.getChild(i).removeFromParent();
    }
  }
}


/**
 * Append an element to the end of doc.
 * @param {Body} doc
 * @param {Element} obj
 */
function appendElementToDoc(doc, obj) {
  var type = obj.getType();
  if (type == 'PARAGRAPH') {
    doc.appendParagraph(obj.copy());
  } else if (type == 'TABLE') {
    doc.appendTable(obj.copy());
  } else if (type == 'LIST_ITEM') {
    // Note: this one is buggy. The bullets/number will be gone. Google's bug.
    doc.appendListItem(obj.copy());
  } else if (type == 'PAGE_BREAK' || type == 'HORIZONTAL_RULE') {
    // Note: Google Docs sometimes eats page break, so the template won't match generated.
    // The workaround is to put a horizontal rule and we swap it into page break.
    doc.appendPageBreak();
  } else if (type == 'INLINE_IMAGE') {
    doc.appendImage(obj.copy());
  }
}


/**
 * Clear a given doc.
 * @param {Document} doc
 */
function clearDoc(doc) {
  // Google Apps Script has a bug that it can't clear contents inside a doc.
  // See https://code.google.com/p/google-apps-script-issues/issues/detail?id=1489
  // So we need to do it ourselves.
  var body = doc.getBody();
  var count = body.getNumChildren();
  for (var i = 0; i < count - 1; i++) {
    body.getChild(i).removeFromParent();
  }
}


/**
 * Share file (i.e. move a newly created file to public folder).
 * @param {Document|Spreadsheet} doc File to move.
 */
function shareFile(doc) {
  var folder = DocsList.getFolder(PUBLIC_FOLDER + '/' + getSchoolYear());
  var root = DocsList.getRootFolder();
  var docId = doc.getId();
  var docFile = DocsList.getFileById(docId);
  docFile.addToFolder(folder);
  docFile.removeFromFolder(root);
}


/**
 * Copies contents from template file.
 * @param {string} templateName
 * @param {Body} dstDoc Destination document.
 * @return {Body}
 * @private
 */
function copyTemplate(templateName, dstDoc) {
  var doc = lookupAndOpenDoc(templateName);
  var body = doc.getBody();
  var dstBody = dstDoc.getBody();
  dstBody.setMarginTop(body.getMarginTop());
  dstBody.setMarginLeft(body.getMarginLeft());
  dstBody.setMarginBottom(body.getMarginBottom());
  dstBody.setMarginRight(body.getMarginRight());
  return body.copy();
}


/**
 * Scans and fills text.
 * @param {Text} text
 * @param {Object} data
 * @param {boolean} usePaddings
 * @private
 */
function scanText(text, data, usePaddings) {
  var rawText = text.getText();
  var token = '';
  var tokenStart = -1;
  var tokenEnd = 0;
  var mappings = [];
  for (var i = 0; i < rawText.length; ++i) {
    if (rawText[i] == '%') {
      if (tokenStart >= 0) {
        tokenEnd = i;
        token = rawText.substring(tokenStart, tokenEnd + 1);
        if (usePaddings) {
//        Logger.log('[' + token + ':' + getTokenTextWithPaddings(token, data) + ']');
          mappings.push([token, getTokenTextWithPaddings(token, data)]);
        }
        else {
//        Logger.log('[' + token + ':' + getTokenText(token, data) + ']');
          mappings.push([token, getTokenText(token, data)]);
        }
        tokenStart = -1;
      } else {
        tokenStart = i;
      }
    }
  }
  for (var i = 0; i < mappings.length; ++i) {
    text.replaceText(mappings[i][0], mappings[i][1]);
  }
}


/**
 * Get token text with paddings.
 * @param {string} token
 * @param {Object} data
 * @return {string}
 */
function getTokenTextWithPaddings(token, data) {
  var value = getTokenText(token, data);
  var engText = value.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '')
  var padding = PADDINGS.substring(
      0, token.length - value.length * 2 + engText.length);
//  Logger.log(token.length + ',' + value.length + ',' + engText.length);
  return value + padding;
};


/**
 * Get token text without paddings.
 * @param {string} token
 * @param {Object} data
 * @return {string}
 */
function getTokenText(token, data) {
  var key = token.substring(1, token.length - 1).trim();
  return (data && data[key] != undefined && data[key] != null) ? data[key].toString() : '';
}


/**
 * Send mail to someone.
 * @param {string} email
 * @param {string} title
 * @param {!Array.<!Blobs>} files Blobs/Files to attach.
 */
function mailTo(email, title, files) {
  MailApp.sendEmail({
     to: email,
     subject: title,
     htmlBody: 'AUTO-GENERATED E-MAIL. DO NOT REPLY.<br/><br/>' +
               'Attached file(s) was generated at ' +
               new Date().toString() +
               '<br/><br/>Please contact registration staff if the data have error(s).',
     attachments: files
   });
}

/**
 * Real getAllFiles.
 * @param {!function(File): boolean} opt_filter
 * @return {!Array.<File>}
 */
function getAllFiles(opt_filter) {
  var results = [];
  var pageSize = 200;
  var files = null;
  var token = null; // use a null token for the first lookup
  var identity = function() { return true; };
  var filter = opt_filter || identity;
  do {
    var result = DocsList.getAllFilesForPaging(pageSize, token);
    files = result.getFiles();
    token = result.getToken();
    
    for (var i = 0; i < files.length; i++) {
      if (filter(files[i])) {
        results.push(files[i]);
      }
    }
  } while (files.length >= pageSize);
  return results;
}


/**
 * Real getFilesByType.
 * @param {string} type
 * @return {!Array.<File>}
 */
function getFilesByType(type) {
  return getAllFiles(function(file) { return file.getFileType() == type; });
}


/**
 * Dump all file metadata.
 */
function dumpFileMetadata() {
  var files = getAllFiles();
  for (var i = 0; i < files.length; ++i) {
    var message = files[i].getName() + ' ' + files[i].getFileType() + ' ' + files[i].getUrl();
    Logger.log(message);
  }
}