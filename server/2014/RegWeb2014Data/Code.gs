/** @const {string} */
var REGDB_TO_USE = '0AgvYC6nj697MdEYyeGVpeXJLNGlBMUJabEM4Y1JvbVE';


/**
 * The very evil global object.
 */
var db = Reg.Db.getInstance(REGDB_TO_USE);


/**
 * Search for the spreadsheet of given file name.
 * @param {string} fileName
 * @return {Spreadsheet}
 */
function lookupAndOpenFile(fileName) {
  var files = DocsList.getFilesByType('spreadsheet');
  for (var i = 0; i < files.length; ++i) {
    if (files[i].getName() == fileName) {
      return SpreadsheetApp.open(files[i])
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
 * Parses evil data from the client.
 * @param {string} message
 * @return {Object}
 */
function parseMessage(message) {
  var parsedObject = null;
  try {
    parsedObject = JSON.parse(message);
  } catch(e) {
    DebugLog('Failed to parse ' + message);
  } finally {
    return parsedObject;
  }
}


/**
 * Processes data from the client.
 * @param {string} message
 * @return {string}
 */
function processMessage(message) {
  var parsedObject = parseMessage(message);
  if (!parsedObject) {
    return "FAIL: invalid data.";
  } else {
    return Reg.importWebData(parsedObject);
  }
}

function doGet(e) {
  var jsonString = e.parameter.data;
  return processData(jsonString);
}

function doPost(request) {
  var jsonString = request.postData.getDataAsString();
  return processData(jsonString);
}

function processData(jsonString) {
  var result = processMessage(jsonString);
  var payload = {
    'result': result
  };
  return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
}

function testWritingToRawDB() {
  var samplePayload = '{"family":{"address":"123 sonoma st","city":"los angeles","state":"CA","zip":"90034","home_ph":"310-567-8888","doc_name":"","doc_ph":"","emer_name":"","emer_ph":"","video_consent":true},"parents":[{"eng_name":"a b","chn_name":"","spec":"","work_ph":"","cell_ph":"310-234-5678","email":"a@bbb.com","chnlv":0}],"students":[{"last_name":"b","first_name":"b","chn_name":"","dob":"04-01-2009","gender":"F","sch":"N","pref":"1","tshirt":"YS","learned":"0"}]}';
  Logger.log(processData(samplePayload).getContent());
}
