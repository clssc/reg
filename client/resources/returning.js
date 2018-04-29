var GOOGLE_URL = 'https://script.google.com/macros/s/AKfycbxlPfAa7VCF_Da91kqlc5I1A_df_10nXyWrD2IDA_WLGPbmWzNA/exec';
// Charge key to use: publishable key from Stripe.com.
var CHARGE_KEY = 'pk_test_k0R3N6jkDi5W4l6tU7ki0P4R';
//var CHARGE_KEY = 'pk_live_nGVIQje5vy4A0MiOFCv40GB9';

var TOKEN = 'familyNumber';
var MAX_ID = 1611;
var MIN_ID = 293;
var EC_TUITION = 150;
var chargeAmount = 0;
var checkoutHandler;
var familyId = 0;
var ecRegister = [];

function disable(id) {
  var d = 'disabled';
  $(id).attr(d, d);
}

// When the page loads.
$(function() {
  initDialogs();

  $('#page7').hide();
  $('#page8').hide();
  $('#alreadyPaid').hide();
  $('#ec').hide();
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
      disable('#submitButton');
    }
    queryAmount(fn);
  });

  $('#ecConfirm').click(ecConfirm);
  $('#consent').change(toggleLegalStep);
  $('#next7').click(function() {
    $('#pager').hide();
    $('#page7').show();
  });
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

  $('#charging').dialog({
    dialogClass: 'no-close',
    autoOpen: false,
    resizable: false,
    modal: true
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
  var pack = null;
  $('#submitButton').hide();
  try {
    pack = JSON.parse(data);
    chargeAmount = pack.tuition;
  } catch (e) {
    // Ignore parse error, force the chargeAmount to be zero.
    chargeAmount = 0;
  }
  if (chargeAmount < 0) {
    // Already paid.
    $('#alreadyPaid').show();
    return;
  }
  if (chargeAmount == 0 || pack == null) {
    // No data or communication error
    $('#error').dialog('open');
    return;
  }

  // publish EC data, if any eligible
  if (pack.ec.length) {
    $('#ec').show();
    for (var i = 0; i < pack.ec.length; ++i) {
      var name = escape(pack.ec[i].stu);
      var html = '<tr><td>' + name + '</td><td><select id="ecs' + i + '">';
      html += '<option value="nada##' + name + '" selected>No EC class</option>';
      pack.ec[i].class.forEach(function(item) {
        var val = item.code + '##' + name;
        html += '<option value="' + val + '">' + item.desc + '</option>';
      });
      html += '</select></td></tr>';
      $('#ecopt').append(html);
    }
  }
}  

function ecConfirm() {
  // selects is an array-like.
  var selects = $('#ecopt>tbody>tr>td>select');
  for (var i = 0; i < selects.size(); ++i) {
    var id = '#ecs' + i;
    var tokens = $(id).val().split('##');
    if (tokens[0] != 'nada') {
      ecRegister.push({name: tokens[1], code: tokens[0]});
    }
    disable(id);
  }
  disable('#ecConfirm');
  $('#ecConfirm').hide();
  chargeAmount += ecRegister.length * EC_TUITION;
  $('#paymentAmount').text('USD$' + chargeAmount.toString());
  legalConsent();
}

function toggleLegalStep() {
  if ($('#consent').is(':checked')) {
    $('#next7').removeAttr('disabled');
  } else {
    disable('#next7');
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
      // image: 'logo.png',
      zipCode: true,
      token: function(token) {
        // Use the token to create the charge with a server-side script.
        // You can access the token ID with `token.id`
        console.log('returned token', token);
        $('#payButton').hide();
        $('#charging').dialog('open');
        $.ajax({
          type: 'POST',
          url: 'https://www.westsidechineseschool.com/reg/charge.php',
          data: {
            'stripeToken': token.id,
            'stripeTokenType': 'card',
            'stripeEmail': token.email,
            'familyId': familyId,
            'dollarAmount': chargeAmount,
            'ec': JSON.stringify(ecRegister)
          },
          dataType: 'text'
        }).done(function(data) {
          console.log('charge', data);
          $('#charging').dialog('close');
          $('#page7').hide();
          $('#page8').show();
          if (data.indexOf('OK') == -1) {
            // failure
            $('#paySuccess').hide();
            $('#payFailed').show();
          } else {
            $('#paySuccess').show();
            $('#payFailed').hide();
          }
        }).fail(function(e) {
          console.log(e);
          $('#charging').dialog('close');
          $('#page7').hide();
          $('#page8').show();
          $('#paySuccess').hide();
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
