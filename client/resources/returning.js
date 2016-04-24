var GOOGLE_URL = 'https://script.google.com/macros/s/AKfycbyGBVPKineP2e3jHZm4a33FFSvoQJOR429ZZ8P1weiW_4CNQQ/exec';
// Charge key to use: publishable key from Stripe.com.
var CHARGE_KEY = 'pk_test_k0R3N6jkDi5W4l6tU7ki0P4R';
//var CHARGE_KEY = 'pk_live_nGVIQje5vy4A0MiOFCv40GB9';

var TOKEN = 'familyNumber';
var MAX_ID = 1495;
var MIN_ID = 293;
var chargeAmount = 0;
var checkoutHandler;
var familyId = 0;

// When the page loads.
$(function() {
  initDialogs();

  $('#paymentDesc').hide();
  $('#paySuccess').hide();
  $('#payFailed').hide();
  $('#alreadyPaid').hide();
  $('#charging').hide();
  $('#legal').hide();

  $('#submitButton').click(function() {
    var rawNumber = $('#familyNumber').val().trim();
    var fn = 0;
    try {
      fn = validateFamilyNumber(parseInt(rawNumber, 10));
    } catch(e) {
      // Ignore parse error.
    }
    if (fn == 0) {
      $('#familyNumber').addClass('error');
      return;
    } else {
      $('#familyNumber').removeClass();
      $('#submitButton').attr('disabled', 'disabled');
    }
    queryAmount(fn);
  });

  $('#consent').change(function() { toggleLegalStep(); });
  $('#payButton').click(payTuition);

  var familyNumber = parseCGI();
  if (familyNumber != 0) {
    $('#inputForm').hide();
    queryAmount(familyNumber);
  }
});

function initDialogs() {
  $('#progress').dialog({
    dialogClass: 'no-close',
    autoOpen: false,
    resizable: false,
    modal: true
  });

  $('#error').dialog({
    dialogClass: 'no-close',
    autoOpen: false,
    resizable: false,
    modal: true,
    buttons: {
      'OK': function() { $(this).dialog('close'); }
    }
  });
}

function validateFamilyNumber(familyNumber) {
  return (familyNumber >= MIN_ID && familyNumber <= MAX_ID) ?
      familyNumber : 0;
}

function parseCGI() {
  var tokens = window.location.href.slice(
      window.location.href.indexOf('?') + 1).split('&');
  var familyNumber = 0;
  for (var i = 0; i < tokens.length; ++i) {
    if (tokens[i].substring(0, TOKEN.length) == TOKEN) {
      var keyValue = tokens[i].split('=');
      if (keyValue.length > 1) {
        try {
          familyNumber = parseInt(keyValue[1], 10);
        } catch (e) {
          // Ignore parse error.
        }
      }
      break;
    }
  }
  return validateFamilyNumber(familyNumber);
}

function queryAmount(familyNumber) {
  familyId = familyNumber;
  $('#progress').dialog('open');
  $.ajax({
    type: 'POST',
    url: GOOGLE_URL,
    data: JSON.stringify(familyNumber),
    dataType: 'text'
  }).done(function(data) {
    $('#progress').dialog('close');
    onServerReturn(data);
  }).fail(function(e) {
    $('#progress').dialog('close');
    onServerFailure(e);
  });
}

function onServerFailure(e) {
  $('#error').dialog('open');
}

function onServerReturn(data) {
  try {
    chargeAmount = parseInt(data, 10);
  } catch (e) {
    // Ignore parse error
  }
  if (chargeAmount < 0) {
    // Already paid.
    $('#alreadyPaid').show();
    return;
  }
  if (chargeAmount == 0) {
    // No data or communication error
    $('#error').dialog('open');
    return;
  }

  $('#paymentAmount').text('USD$' + chargeAmount.toString());
  legalConsent();
}

function toggleLegalStep() {
  if ($('#consent').is(':checked')) {
    $('#payButton').removeAttr('disabled');
  } else {
    $('#payButton').attr('disabled', 'disabled');
  }
}

function legalConsent() {
  $('#legal').show();
  toggleLegalStep();
  $('#paymentDesc').show();
}

function payTuition(e) {
  if (familyId == 0 || chargeAmount == 0) {
    return;
  }

  if (!checkoutHandler) {
    checkoutHandler = StripeCheckout.configure({
      key: CHARGE_KEY,
      image: 'logo.png',
      zipCode: true,
      token: function(token) {
        // Use the token to create the charge with a server-side script.
        // You can access the token ID with `token.id`
        console.log('returned token', token);
        $('#payButton').hide();
        $('#charging').show();
        $.ajax({
          type: 'POST',
          url: 'https://www.westsidechineseschool.com/reg/charge.php',
          data: {
            'stripeToken': token.id,
            'stripeTokenType': 'card',
            'stripeEmail': token.email,
            'familyId': familyId,
            'dollarAmount': chargeAmount
          },
          dataType: 'text'
        }).done(function(data) {
          console.log('charge', data);
          $('#charging').hide();
          if (data.indexOf('OK') == -1) {
            // failure
            $('#payFailed').show();
          } else {
            $('#paySuccess').show();
          }
        }).fail(function(e) {
          console.log(e);
          $('#charging').hide();
          $('#payFailed').show();
        });
      }
    });
  }

  // Open Checkout with further options
  checkoutHandler.open({
    name: 'Westside Chinese School',
    description: 'Tuition for ' + familyId,
    amount: chargeAmount * 100
  });
  e.preventDefault();
}
