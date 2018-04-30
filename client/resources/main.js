var EC_URL = 'https://script.google.com/macros/s/AKfycbxI3BucvHpvCJ1kpd7sWlpRyNap4opJjJGDBRyvHtqnTZecTL2J/exec';
var GOOGLE_URL = 'https://script.google.com/macros/s/AKfycbySNHPFgkN8nTyuLd7G4HKQN8oGf9vjJKIpj6RobXmRCqDDWMI/exec';
var CHARGE_URL = 'https://www.westsidechineseschool.com/reg/charge.php';

// Last date of online registration (school start date)
// September 8, 2018, 00:00:00
// Use JavaScript console to get the number:
// new Date(2018, 8, 8, 0, 0, 0).getTime()
var SCHOOL_START = 1536390000000;
// Early bird cut-off date
// August 01, 2018, 00:00:00
// new Date(2018, 7, 1, 0, 0, 0).getTime()
var CUTOFF_TIME = 1533106800000;

var EARLY_BIRD_TUITION = 800;
var NORMAL_TUITION = 900;
var EC_TUITION = 150;
var SERVICE_DEPOSIT = 200;
var NEW_FAMILY_REG_FEE = 100;

// Charge key to use: publishable key from Stripe.com.
var CHARGE_KEY = 'pk_test_k0R3N6jkDi5W4l6tU7ki0P4R';
//var CHARGE_KEY = 'pk_live_nGVIQje5vy4A0MiOFCv40GB9';

var STATE = [
  'AL', 'AK',  'AR', 'AS', 'AZ',
  'CO', 'CT',
  'DC', 'DE',
  'FL',
  'GA', 'GU',
  'HI',
  'IA', 'ID', 'IL', 'IN',
  'KS', 'KY',
  'LA',
  'MA', 'MD', 'ME', 'MI', 'MN', 'MO', 'MS', 'MT',
  'NC', 'ND', 'NE', 'NH', 'NJ', 'NM', 'NV', 'NY',
  'OH', 'OK', 'OR',
  'PA', 'PR',
  'RI',
  'SC', 'SD',
  'TN', 'TX',
  'UT',
  'VA', 'VT',
  'WA', 'WI', 'WV', 'WY'
];

// The very evil global variables.
var numStudents = 1;  // Number of students, range [1, 4].
var numParents = 2;  // Number of parents, range [1, 2].

var cutoffTimestamp = SCHOOL_START - (5 * 365 + 1) * 86400000;
var adultTimestamp = SCHOOL_START - (18 * 365 + 4) * 86400000;
var submission = '';  // Data to submit to server.
var numAdultStudents = 0;
var familyId = 0;
var chargeAmount = 0;
var checkoutHandler;
var ecClasses = null;

function disable(id) {
  var d = 'disabled';
  $(id).attr(d, d);
}

function enable(id) {
  $(id).removeAttr('disabled');
}

// When the page loads.
$(function() {
  initDialogs();

  // Fill the state dropbox.
  for (var i = 0; i < STATE.length; ++i) {
    $('#state').append(
      '<option value=' + STATE[i] + '>' + STATE[i] + '</option>');
  }
  // Date picker.
  for (var i = 1; i <= 4; ++i) {
    $('#s' + i + 'bd').datepicker({
      changeMonth: true,
      changeYear: true,
      dateFormat: 'mm-dd-yy',
      maxDate: new Date(),
      yearRange: '-80:+0',
      onClose: updateECDropdown
    });
  }

  setNavigationHooks();

  // Special show-hide related buttons.
  $('#only1p').change(function() {
    numParents = this.checked ? 1 : 2;
    clearFamilyErrors();
    showParents();
  });
  $('#num_stu').change(function() {
    numStudents = $('#num_stu option:selected').val();
    clearStudentErrors();
    showStudents();
  });
  $('#consent').change(function() { toggleLegalStep(); });

  setPaymentHooks();

  // Fire EC class request, let it race.
  $.ajax({
    type: 'GET',
    url: EC_URL,
  }).done(function(data) {
    ecClasses = {};
    data.forEach(function(cls) {
      ecClasses[cls.code] = cls;
    });
  });

  // Really starts
  for (var i = 0; i < 10; ++i) {
    var pageId = '#page' + i;
    $(pageId).hide();
  }
  localizeButtons();
  showParents();
  showStudents();
  toggleLegalStep();
  showPage(0);
});

function initDialogs() {
  $('#progress').dialog({
    autoOpen: false,
    resizable: false,
    modal: true
  });

  $('#error').dialog({
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

function setNavigationHooks() {
  // Navigation buttons.
  $('#next0').click(function() { showPage(1); });
  $('#next1').click(function() { showParents(); showPage(2); });
  $('#next2').click(function() {
    if (validateFamilyData()) { showStudents(); showPage(3); }
  });
  $('#next3').click(function() {
    if (validateStudentData()) { genSummary(); showPage(4); } 
  });
  $('#next4').click(function() { showPage(5); });
  $('#next5').click(function() { genFinalData(); });
  $('#next6').click(function() {
    showPage(7);
    $('#paymentAmount').text(chargeAmount.toString());
  });
  $('#prev3').click(function() { showParents(); showPage(2); });
  $('#prev4').click(function() { showStudents(); showPage(3); });
}

function setPaymentHooks() {
  // Payment hook.
  $('#payButton').click(function(e) {
    disable('#payButton');
    runPayment(e);
  });

  // Close Checkout on page navigation
  $(window).on('popstate', function() {
    if (checkoutHandler) {
      checkoutHandler.close();
    }
  });

  // Hide payment related message.
  $('#paid').hide();
  $('#charging').hide();
  $('#paySuccess').hide();
  $('#payFailed').hide();
}

function showPage(pageNumber) {
  for (var i = 0; i < 10; ++i) {
    var pageId = '#page' + i;
    if (i != pageNumber) {
      $(pageId).hide();
    } else {
      $(pageId).show();
    }
  }
}

function localizeButtons() {
  if (lang != 'en') {
    for (var i = 0; i < 5; ++i) {
      var id = '#next' + i;
      $(id).prop('value', '下一步 >>');
    }
    $('#prev3').prop('value', '<< 上一步');
    $('#prev4').prop('value', '<< 上一步');
    $('#next5').prop('value', lang == 'tc' ? '提交申請表' : '提交申请表');
    $('#next6').prop('value', '下一步 >>');
    $('#payButton').prop('value', lang == 'tc' ? '線上付款' : '在线付款');
  }
}

function ensureECItems(index) {
  var id = '#s' + index + 'ec';
  if ($(id + ' option').length == 1 && ecClasses) {
    Object.keys(ecClasses).forEach(function(key) {
      var cls = ecClasses[key];
      // Exclude Tai-chi class, it has different tuition schedule.
      if (cls.code == 'tai') return;
      $(id).append($('<option disabled></option>').attr('value', cls.code).text(cls.desc));
    });
  }
}

function disableAllEC(index) {
  var id = '#s' + index + 'ec option';
  $(id).each(function() {
    if ($(this).val() == 'nada') return;
    $(this).attr('disabled', 'disabled');
  });
}

function updateECDropdown(dateText, inst) {
  var timestamp = 0;
  try {
    timestamp = jQuery.datepicker.parseDate('mm-dd-yy', dateText).getTime();
  } catch (e) {
    disableAllEC(index);
  }

  var age = (SCHOOL_START - timestamp) / 31536000000;
  var index = inst.id.substring(1, 2);
  var id = '#s' + index + 'ec option';
  $(id).each(function() {
    var code = $(this).val();
    if (code == 'nada') return;
    if (ecClasses[code]) {
      if (ecClasses[code].min_age <= age) {
        $(this).removeAttr('disabled');
      } else {
        $(this).attr('disabled', 'disabled');
      }
    }
  });
}

function showStudents() {
  for (var i = 1; i <= 4; ++i) {
    var id = '#stu' + i;
    var id2 = '#gs' + i;
    if (i <= numStudents) {
      $(id).show();
      $(id2).show();
      ensureECItems(i);
    } else {
      $(id).hide();
      $(id2).hide();
    }
  }
}

function showParents() {
  var ids = [
    '#p2t',
    '#p2eng_name',
    '#p2chn_name',
    '#p2spec',
    '#p2work_ph',
    '#p2cell_ph',
    '#p2email',
    '#p2chnlv',
    '#p2svcpref'
  ];
  for (var i = 0; i < ids.length; ++i) {
    if (numParents == 1) {
      $(ids[i]).hide();
    } else {
      $(ids[i]).show();
    }
  }
}

function toggleLegalStep() {
  if ($('#consent').is(':checked')) {
    enable('#next5');
  } else {
    disable('#next5');
  }
}

// The following validator functions are copied from validator.gs.
// They took input and attempt to return sanitized output.
function validatePhone(input) {
  // Strip all stuff except numbers and x.
  var fromString = input.toString().replace(/[^\d+!x]/g, '').split('x');
  if (fromString.length <= 2) {
    if (fromString[0].length == 10) {
      var retValue = fromString[0].substr(0, 3) + '-' +
          fromString[0].substr(3, 3) + '-' +
          fromString[0].substr(6, 4);
      if (fromString.length == 2 && fromString[1].length) {
        retValue += 'x' + fromString[1];
      }
      return retValue;
    }
  }
  return '';
}

function validateEmail(input) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
  return re.test(input) ? input.toLowerCase() : '';
};

function validateZip(input) {
  var re = /^([0-9]{5})(?:[-\s]*([0-9]{4}))?$/;
  return re.test(input) ? input.toString() : '';
};

function validateChinese(input) {
  var re = /^[\u4E00-\u9FA5]+$/;
  return re.test(input) ? input.toString() : '';
}

function clearFamilyErrors() {
  $('#parentTable td').removeClass();
  $('#familyTable td').removeClass();
}

function validateFamilyData() {
  clearFamilyErrors();
  var result = true;

  for (var i = 1; i <= numParents; ++i) {
    var prefix = '#p' + i;
    // Check if name is empty.
    if (!$(prefix + 'eng_name').val().trim().length) {
      result &= false;
      $('#pteng_name').addClass('error');
    }

    // Check cell phone validity.
    var cell = validatePhone($(prefix + 'cell_ph').val().trim());
    if (cell.length != 12) {
      result &= false;
      $('#ptcell').addClass('error');
    } else {
      $(prefix + 'cell_ph').val(cell);
    }

    // Check secondary phone
    var rawWorkPhone = $(prefix + 'work_ph').val().trim();
    var workPhone = validatePhone(rawWorkPhone);
    if (workPhone.length != 12 && workPhone.length != 0) {
      result &= false;
    	$('#ptworkph').addClass('error');
    }

    // Check chinese name
    var rawChineseName = $(prefix + 'chn_name').val().trim();
    var chnName = validateChinese(rawChineseName);
    if (chnName != rawChineseName) {
      result &= false;
    	$('#ptchn_name').addClass('error');
    }

    // Check email validity.
    var email = validateEmail($(prefix + 'email').val().trim());
    if (email.length < 4) {
      result &= false;
      $('#ptemail').addClass('error');
    } else {
      $(prefix + 'email').val(email);
    }

    // Check if chinese level is checked.
    var nada = prefix + 'clv0';
    var lands = prefix + 'clv1';
    var edu = prefix + 'clv2';
    if (!$(nada).is(':checked') && !$(lands).is(':checked') &&
        !$(edu).is(':checked')) {
      result &= false;
      $('#ptchnlv').addClass('error');
    }
  }

  // Make sure address is valid.
  if (!$('#addr').val().trim().length) {
    result &= false;
    $('#ptaddr').addClass('error');
  }
  if (!$('#city').val().trim().length) {
    result &= false;
    $('#ptcity').addClass('error');
  }
  var zip = validateZip($('#zip').val().trim());
  if (zip.length != 5) {
    result &= false;
    $('#ptzip').addClass('error');
  }

  var phone = validatePhone($('#home_ph').val().trim());
  if (phone.length != 12) {
    result &= false;
    $('#pthome_ph').addClass('error');
  } else {
    $('#home_ph').val(phone);
  }

  // Format optional phone numbers
  //    var fax = validatePhone($('#fax').val().trim());
  //    $('#fax').val(fax);
  var docPh = $('#doc_ph').val().trim();
  if (docPh.length != 0) {
    docPh = validatePhone(docPh);
    if (docPh.length != 12) {
      result &= false;
      $('#ptdoc_ph').addClass('error');
    }
  } else {
    $('#doc_ph').val(docPh);
  }
  var emerPh = $('#emer_ph').val().trim();
  if (emerPh.length != 0) {
    emerPh = validatePhone(emerPh);
    if (emerPh.length != 12) {
      result &= false;
      $('#ptemer_ph').addClass('error');
    }
  } else {
    $('#emer_ph').val(emerPh);
  }
  return result;
}

function clearStudentErrors() {
  for (var i = 1; i <= 4; ++i) {
    $('#stu' + i + ' td').removeClass();
  }
}

function validateStudentData() {
  clearStudentErrors();
  var result = true;
  numAdultStudents = 0;
  for (var i = 1; i <= numStudents; ++i) {
    var prefix = '#s' + i;
    // Check if names are empty.
    if (!$(prefix + 'ln').val().trim().length) {
      result &= false;
      $(prefix + 'tln').addClass('error');
    }
    if (!$(prefix + 'fn').val().trim().length) {
      result &= false;
      $(prefix + 'tfn').addClass('error');
    }

    // Check Chinese name is Chinese
    // Check chinese name
    var rawChName = $(prefix + 'chn').val().trim();
    var chName = validateChinese(rawChName);
    if (chName != rawChName) {
      result &= false;
	  $(prefix + 'tcn').addClass('error');
    }

    // Check DOB is greater than 5 years.
    var value = $(prefix + 'bd').val().toString();
    var dateResult = false;
    if (value.length) {
      var timestamp = 0;
      try {
        timestamp = jQuery.datepicker.parseDate('mm-dd-yy', value).getTime();
      } catch (e) {
        // Make sure dateResult is not true.
        timestamp = cutoffTimestamp;
      }
      if (timestamp < cutoffTimestamp) {
        dateResult = true;
      }
      if (timestamp < adultTimestamp) {
        numAdultStudents++;
      }
    }
    if (!dateResult) {
      result &= false;
      $(prefix + 'tbd').addClass('error');
    }

    // Check if gender is checked.
    var male = prefix + 'gm';
    var female = prefix + 'gf';
    if (!$(male).is(':checked') && !$(female).is(':checked')) {
      result &= false;
      $(prefix + 'tg').addClass('error');
    }

    // Check if speak Chinese at home is checked.
    var scy = prefix + 'sy';
    var scn = prefix + 'sn';
    if (!$(scy).is(':checked') && !$(scn).is(':checked')) {
      result &= false;
      $(prefix + 'ts').addClass('error');
    }
  }
  return result;
}

function genFamilySummary() {
  var data = {
    address: $('#addr').val().toString(),
    city: $('#city').val().toString(),
    state: $('#state').val().toString(),
    zip: $('#zip').val().toString(),
    home_ph: $('#home_ph').val().toString(),
//      fax: $('#fax').val(),
    doc_name: $('#doc_name').val().toString(),
    doc_ph: $('#doc_ph').val().toString(),
    emer_name: $('#emer_name').val().toString(),
    emer_ph: $('#emer_ph').val().toString(),
    video_consent: true
  };

  $('#gaddr').text(data.address);
  $('#gcity').text(data.city);
  $('#gstate').text(data.state);
  $('#gzip').text(data.zip);
  $('#ghome_ph').text(data.home_ph);
//    $('#gfax').text(data.fax);
  $('#gdoc_name').text(data.doc_name);
  $('#gdoc_ph').text(data.doc_ph);
  $('#gemer_name').text(data.emer_name);
  $('#gemer_ph').text(data.emer_ph);
  return data;
}

function getChineseLevelString(level) {
  return level == 0 ? 'Non-speaker' :
    level == 1 ? 'Listen/Speak Only' :
    'Native Educated';
}

function genParentSummary() {
  var data = [];
  for (var i = 1; i <= numParents; ++i) {
    var prefix = '#p' + i;
    var item = {
      eng_name: $(prefix + 'eng_name').val().toString(),
      chn_name: $(prefix + 'chn_name').val().toString(),
      spec: $(prefix + 'spec').val().toString(),
      work_ph: $(prefix + 'work_ph').val().toString(),
      cell_ph: $(prefix + 'cell_ph').val().toString(),
      email: $(prefix + 'email').val().toString(),
      chnlv: $(prefix + 'clv0').is(':checked') ? 0 :
             ($(prefix + 'clv1').is(':checked') ? 1 : 2)
    };
    data.push(item);

    prefix = '#gp' + i;
    $(prefix + 'eng_name').text(item.eng_name);
    $(prefix + 'chn_name').text(item.chn_name);
    $(prefix + 'spec').text(item.spec);
    $(prefix + 'work_ph').text(item.work_ph);
    $(prefix + 'cell_ph').text(item.cell_ph);
    $(prefix + 'email').text(item.email);
    $(prefix + 'chnlv').text(getChineseLevelString(item.chnlv));
  }

  return data;
}

function localizeGender(gender) {
  return lang == 'en' ? gender :
      gender == 'M' ? '男' : '女';
}

function getPrefString(item) {
  return item == 1 ? '1. Traditional Zhuyin 繁體注音' :
    item == 2 ? '2. Traditional Pinyin 繁體拼音' :
    '3. Simplified 简体';
}

function getLearnedString(learned) {
  switch (parseInt(learned, 10)) {
    case 1: return '<1 year';
    case 2: return '1 - 2 years';
    case 3: return '2+ years';
    default: return 'No';
  }
}

function getECString(code) {
  if (code == 'nada') return 'No EC Class';
  return ecClasses[code].desc;
}

function genStudentSummary() {
  var data = [];
  for (var i = 1; i <= numStudents; ++i) {
    var prefix = '#s' + i;
    var item = {
      last_name: $(prefix + 'ln').val().toString(),
      first_name: $(prefix + 'fn').val().toString(),
      chn_name: $(prefix + 'chn').val().toString(),
      dob: $(prefix + 'bd').val().toString(),
      gender: $(prefix + 'gm').is(':checked') ? 'M' : 'F',
      sch: $(prefix + 'sy').is(':checked') ? 'Y' : 'N',
      pref: $(prefix + 'pref').val(),
      tshirt: $(prefix + 'tshirt').val().toString(),
      learned: $(prefix + 'learned').val(),
      ec: $(prefix + 'ec').val()
    };
    data.push(item);

    prefix = '#gs' + i;
    $(prefix + 'ln').text(item.last_name);
    $(prefix + 'fn').text(item.first_name);
    $(prefix + 'chn').text(item.chn_name);
    $(prefix + 'bd').text(item.dob);
    $(prefix + 'gender').text(localizeGender(item.gender));
    $(prefix + 's').text(item.sch);
    $(prefix + 'pref').text(getPrefString(item.pref));
    $(prefix + 'tshirt').text(item.tshirt);
    $(prefix + 'learned').text(getLearnedString(item.learned));
    $(prefix + 'ec').text(getECString(item.ec));
  }

  return data;
}

function genSummary() {
  var data = {
    family: genFamilySummary(),
    parents: genParentSummary(),
    students: genStudentSummary()
  };
  submission = JSON.stringify(data);
}

function onServerReturn(data) {
  $('#progress').dialog('close');

  try {
    // Calculate amount before proceeding to final page.
    var res = JSON.parse(data);
    if (res.result.substring(0, 7) != 'SUCCESS') {
      if (res.result.indexOf('already paid') != -1) {
        $('#feeSchedule').hide();
        $('#feeDesc').hide();
        $('#paid').show();
        $('#next6').hide();
      } else {
        onServerFailure(data.result);
      }
      return;
    }

    familyId = res.family_number;
    if (!familyId) throw new Error();
    var regData = res.payload;
    $('#snum_stu').text(numStudents.toString());
    var svcDeposit = (numStudents - numAdultStudents) > 0 ? SERVICE_DEPOSIT : 0;
    $('#ssvc_deposit').text(svcDeposit.toString());
    var total = NORMAL_TUITION * numStudents + svcDeposit + NEW_FAMILY_REG_FEE;
    var total2 = EARLY_BIRD_TUITION * numStudents + svcDeposit +
        NEW_FAMILY_REG_FEE;
    $('#stotal').text(total.toString());
    $('#stotal2').text(total2.toString());

    var now = new Date();
    chargeAmount = now.getTime() >= CUTOFF_TIME ? total : total2;
    if (regData.ec) {
      var items = regData.ec.length || 0;
      chargeAmount += items * EC_TUITION; 
    }
    showPage(6);
  } catch(e) {
    onServerFailure('failed to parse server results: ' + data);
  }
}

function onServerFailure(e) {
  $('#progress').dialog('close');
  $('#error').dialog('open');
  enable('#next5');
  console.error(e);
}

function genFinalData() {
  disable('#next5');
  $('#progress').dialog('open');
  $.ajax({
    type: 'POST',
    url: GOOGLE_URL,
    data: submission,
    dataType: 'text'
  }).done(function(data) {
    onServerReturn(data);
  }).fail(function(e) {
    onServerFailure(e);
  });
}

function runPayment(e) {
  if (!checkoutHandler) {
    checkoutHandler = StripeCheckout.configure({
      key: CHARGE_KEY,
      // image: 'logo.png',
      zipCode: true,
      token: function(token) {
        // Use the token to create the charge with a server-side script.
        // You can access the token ID with `token.id`
        console.log('returned token', token);
        $('#next6').hide();
        $('#charging').dialog('open');
        $.ajax({
          type: 'POST',
          url: CHARGE_URL,
          data: {
            'stripeToken': token.id,
            'stripeTokenType': 'card',
            'stripeEmail': token.email,
            'familyId': familyId,
            'dollarAmount': chargeAmount,
            'regData': submission
          },
          dataType: 'text'
        }).done(function(data) {
          console.log('charge', data);
          if (data.indexOf('OK') == -1) {
            // failure
            $('#charging').dialog('close');
            showPage(8);
            $('#paySuccess').hide();
            $('#payFailed').show();
          } else {
            $('#charging').dialog('close');
            showPage(8);
            $('#paySuccess').show();
            $('#payFailed').hide();
          }
        }).fail(function(e) {
          console.log(e);
          $('#charging').dialog('close');
          showPage(8);
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
