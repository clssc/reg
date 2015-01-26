/** @const {string} */
var PAYMENT_DOCID = '1Jo_UnsADqz0zUa_KkwbgdAqbBN-uciJ4jnxPcXx9qiA';


/** @const {string} */
var TEST_MAIL_ACCOUNT = 'arthur@cchsu.com';


/**
 * Output debug message to Log and Debug Log file.
 * @param {string} message
 */
function DebugLog(message) {
  Logger.log(message);
  var file = SpreadsheetApp.openById('0AgvYC6nj697MdDhHZU4xaHFLSlVaSTlOb1Zqb1FURGc');
  var sheet = file.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var cell = sheet.getRange('a1').offset(lastRow, 0);
  cell.setValue(message);
}


/**
 * @param {string} email
 * @param {string} familyNumber
 * @param {string} amount
 * @param {string} paymentId
 */
function mailConfirmation(email, familyNumber, amount, paymentId) {
  MailApp.sendEmail(
    email,
    'Payment received',
    '',
    {
      'replyTo': 'info@westsidechineseschool.com',
      'htmlBody': '<html><body><p>Your payment: ' + amount + ' was received by Westside Chinese School.</p>' +
                  '<p>Your family number is ' + familyNumber + '.</p>' +
                  '<p>Your reference number is ' + paymentId + '</p>' +
                  '<p>Thank you for your payment and see you in coming September!</p>'
    });
  Reg.setPaid(parseInt(familyNumber, 10));
}


/**
 * @param {!Object} data
 * @return {boolean}
 */
function writeData(data) {
  if (!data.description || !data.card) {
    return false;
  }
  var spreadsheet = SpreadsheetApp.openById(PAYMENT_DOCID);
  if (spreadsheet) {
    var sheet = spreadsheet.getActiveSheet();
    var desc = data['description'];
    var index = desc.indexOf(' ');
    if (index <= 0) {
      return false;
    }
    var familyNumber = desc.slice(0, index);
    var email = desc.slice(index + 1);
    var amount = data['currency'].toUpperCase() + '$' + (parseInt(data['amount'], 10) / 100).toString();
    
    sheet.appendRow([
      data['id'],
      familyNumber,
      email,
      data['paid'],
      data['refunded'],
      amount,
      data['card']['last4'],
      data['card']['brand'],
      data['card']['name'],
      (new Date()).toString()
    ]);
    
    if (data['paid']) {
      mailConfirmation(email, familyNumber, amount, data['id']);
    }
    return true;
  }
  
  return false;
}

function processMessage(message) {
  var parsedObject = null;
  try {
    parsedObject = JSON.parse(message);
  } catch (e) {
    Logger.log(e);
    return false;
  }
  return writeData(parsedObject);
}

function processData(jsonString) {
  var result = processMessage(jsonString);
  var payload = {
    'result': result ? 'true' : 'false'
  };
  return ContentService
      .createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var jsonString = e.parameter.data;
  return processData(jsonString);
}

function testProcessData() {
  var TEST_OBJECT = {
    'id': 'ch_15OzWTK2sUStfzVsSxE2qoLQ',
    'object': 'charge',
    'created': 1422227429,
    'livemode': false,
    'paid': true,
    'amount': 120000,
    'currency': 'usd',
    'refunded': false,
    'captured': true,
    'card': {
      'id': 'card_15OzWQK2sUStfzVsmVmaRgW0',
      'object': 'card',
      'last4': '4242',
      'brand': 'Visa',
      'funding': 'credit',
      'exp_month': 12,
      'exp_year': 2018,
      'fingerprint': '0tjoSQuP6GDXev2j',
      'country': 'US',
      'name': TEST_MAIL_ACCOUNT,
      'address_line1': null,
      'address_line2': null,
      'address_city': null,
      'address_state': null,
      'address_zip': null,
      'address_country': null,
      'cvc_check': 'pass',
      'address_line1_check': null,
      'address_zip_check': null,
      'dynamic_last4': null,
      'customer': null
    },
    'balance_transaction': 'txn_15OzRGK2sUStfzVsHQv67bhZ',
    'failure_message': null,
    'failure_code': null,
    'amount_refunded': 0,
    'customer': null,
    'invoice': null,
    'description': '1020 ' + TEST_MAIL_ACCOUNT,
    'dispute': null,
    'metadata': {
    },
    'statement_descriptor': null,
    'fraud_details': {
    },
    'receipt_email': null,
    'receipt_number': null,
    'shipping': null,
    'refunds': {
      'object': 'list',
      'total_count': 0,
      'has_more': false,
      'url': '/v1/charges/ch_15OzWTK2sUStfzVsSxE2qoLQ/refunds',
      'data': [
        
      ]
    }
  };
  
  processData(JSON.stringify(TEST_OBJECT));
}