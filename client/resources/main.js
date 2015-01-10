var GOOGLE_URL = 'https://script.google.com/macros/s/AKfycbwRwWbwqw2ZJc_xJTAyGuY3lyfeOl9RFobe9PGmxNH5bUdHZ3gQ/exec';

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
var cutoffTimestamp = new Date(2009, 12, 7).getTime();
var adultTimestamp = new Date(1996, 10, 12).getTime();
var submission = '';  // Data to submit to server.
var numAdultStudents = 0;
var familyId = '0000';
var chargeAmount = 0;
var checkoutHandler;

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
      yearRange: '-80:+0'
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

  // Really starts
  for (var i = 0; i < 7; ++i) {
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
}

function setNavigationHooks() {
  // Navigation buttons.
  $('#next0').click(function() { showPage(1); });
  $('#next1').click(function() { showParents(); showPage(2); });
  $('#next2').click(function() {
    if (validateFamilyData()) { showStudents(); showPage(3); }
  });
  // $('#next2b').click(function() { showStudents(); showPage(3); });
  $('#next3').click(function() {
    if (validateStudentData()) { genSummary(); showPage(4); } 
  });
  // $('#next3b').click(function() { genSummary(); showPage(4); });
  $('#next4').click(function() { showPage(5); });
  $('#next5').click(function() { genFinalData(); });
  $('#prev3').click(function() { showParents(); showPage(2); });
  $('#prev4').click(function() { showStudents(); showPage(3); });
}

function setPaymentHooks() {
  // Payment hook.
  $('#payButton').click(function(e) {
    $('#payButton').attr('disabled', 'disabled');
    runPayment(e);
  });

  // Close Checkout on page navigation
  $(window).on('popstate', function() {
    if (checkoutHandler) {
      checkoutHandler.close();
    }
  });

  // Hide payment related message.
  $('#charging').hide();
  $('#paySuccess').hide();
  $('#payFailed').hide();
}

function showPage(pageNumber) {
  for (var i = 0; i < 7; ++i) {
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
    $('#payButton').prop('value', lang == 'tc' ? '線上付款' : '在线付款');
  }
}

function showStudents() {
  for (var i = 1; i <= 4; ++i) {
    var id = '#stu' + i;
    var id2 = '#gs' + i;
    if (i <= numStudents) {
      $(id).show();
      $(id2).show();
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
    $('#next5').removeAttr("disabled");
  } else {
    $('#next5').attr('disabled', 'disabled');
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
};

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
    // Check if name is empty.
    if (!$('#p' + i + 'eng_name').val().trim().length) {
      result &= false;
      $('#pteng_name').addClass('error');
    }

    // Check cell phone validity.
    var cell = validatePhone($('#p' + i + 'cell_ph').val().trim());
    if (cell.length != 12) {
      result &= false;
      $('#ptcell').addClass('error');
    } else {
      $('#p' + i + 'cell_ph').val(cell);
    }

    // Check secondary phone
    var rawWorkPhone = $('#p' + i + 'work_ph').val().trim();
    var workPhone = validatePhone(rawWorkPhone);
    if (workPhone != rawWorkPhone) {
      result &= false;
    	$('#ptworkph').addClass('error');
    }

    // Check chinese name
    var rawChineseName = $('#p' + i + 'chn_name').val().trim();
    var chnName = validateChinese(rawChineseName);
    if (chnName != rawChineseName) {
      result &= false;
    	$('#ptchn_name').addClass('error');
    }

    // Check email validity.
    var email = validateEmail($('#p' + i + 'email').val().trim());
    if (email.length < 4) {
      result &= false;
      $('#ptemail').addClass('error');
    } else {
      $('#p' + i + 'email').val(email);
    }

    // Check if chinese level is checked.
    var nada = '#p' + i + 'clv0';
    var lands = '#p' + i + 'clv1';
    var edu = '#p' + i + 'clv2';
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
  var docPh = validatePhone($('#doc_ph').val().trim());
  if (docPh.length != 0 && docPh.length != 12) {
    result &= false;
    $('#ptdoc_ph').addClass('error');
  } else {
    $('#doc_ph').val(docPh);
  }
  var emerPh = validatePhone($('#emer_ph').val().trim());
  if (emerPh.length != 0 && emerPh.length != 12) {
    result &= false;
    $('#ptemer_ph').addClass('error');
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
    // Check if names are empty.
    if (!$('#s' + i + 'ln').val().trim().length) {
      result &= false;
      $('#s' + i + 'tln').addClass('error');
    }
    if (!$('#s' + i + 'fn').val().trim().length) {
      result &= false;
      $('#s' + i + 'tfn').addClass('error');
    }

    // Check Chinese name is Chinese
    // Check chinese name
    var rawChName = $('#s' + i + 'chn').val().trim();
    var chName = validateChinese(rawChName);
    if (chName != rawChName) {
      result &= false;
	  $('#s' + i + 'tcn').addClass('error');
    }

    // Check DOB is greater than 5 years.
    var value = $('#s' + i + 'bd').val().toString();
    var dateResult = false;
    if (value.length) {
      var timestamp = 0;
      try {
        timestamp = jQuery.datepicker.parseDate('mm-dd-yy', value).getTime();
      } catch (e) {}
      if (timestamp < cutoffTimestamp) {
        dateResult = true;
      }
      if (timestamp < adultTimestamp) {
        numAdultStudents++;
      }
    }
    if (!dateResult) {
      result &= false;
      $('#s' + i + 'tbd').addClass('error');
    }

    // Check if gender is checked.
    var male = '#s' + i + 'gm';
    var female = '#s' + i + 'gf';
    if (!$(male).is(':checked') && !$(female).is(':checked')) {
      result &= false;
      $('#s' + i + 'tg').addClass('error');
    }

    // Check if speak Chinese at home is checked.
    var scy = '#s' + i + 'sy';
    var scn = '#s' + i + 'sn';
    if (!$(scy).is(':checked') && !$(scn).is(':checked')) {
      result &= false;
      $('#s' + i + 'ts').addClass('error');
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
    var item = {
      eng_name: $('#p' + i + 'eng_name').val().toString(),
      chn_name: $('#p' + i + 'chn_name').val().toString(),
      spec: $('#p' + i + 'spec').val().toString(),
      work_ph: $('#p' + i + 'work_ph').val().toString(),
      cell_ph: $('#p' + i + 'cell_ph').val().toString(),
      email: $('#p' + i + 'email').val().toString(),
      chnlv: $('#p' + i + 'clv0').is(':checked') ? 0 :
             ($('#p' + i + 'clv1').is(':checked') ? 1 : 2)
    };
    data.push(item);

    $('#gp' + i + 'eng_name').text(item.eng_name);
    $('#gp' + i + 'chn_name').text(item.chn_name);
    $('#gp' + i + 'spec').text(item.spec);
    $('#gp' + i + 'work_ph').text(item.work_ph);
    $('#gp' + i + 'cell_ph').text(item.cell_ph);
    $('#gp' + i + 'email').text(item.email);
    $('#gp' + i + 'chnlv').text(getChineseLevelString(item.chnlv));
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

function genStudentSummary() {
  var data = [];
  for (var i = 1; i <= numStudents; ++i) {
    var male = '#s' + i + 'gm';
    var scy = '#s' + i + 'sy';
    var item = {
      last_name: $('#s' + i + 'ln').val().toString(),
      first_name: $('#s' + i + 'fn').val().toString(),
      chn_name: $('#s' + i + 'chn').val().toString(),
      dob: $('#s' + i + 'bd').val().toString(),
      gender: $(male).is(':checked') ? 'M' : 'F',
      sch: $(scy).is(':checked') ? 'Y' : 'N',
      pref: $('#s' + i + 'pref').val(),
      tshirt: $('#s' + i + 'tshirt').val().toString(),
      learned: $('#s' + i + 'learned').val()
    };
    data.push(item);

    $('#gs' + i + 'ln').text(item.last_name);
    $('#gs' + i + 'fn').text(item.first_name);
    $('#gs' + i + 'chn').text(item.chn_name);
    $('#gs' + i + 'bd').text(item.dob);
    $('#gs' + i + 'gender').text(localizeGender(item.gender));
    $('#gs' + i + 's').text(item.sch);
    $('#gs' + i + 'pref').text(getPrefString(item.pref));
    $('#gs' + i + 'tshirt').text(item.tshirt);
    $('#gs' + i + 'learned').text(getLearnedString(item.learned));
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

  // Calculate amount before proceeding to final page.
  $('#snum_stu').text(numStudents.toString());
  var svcDeposit = (numStudents - numAdultStudents) > 0 ? 200 : 0;
  $('#ssvc_deposit').text(svcDeposit.toString());
  var total = 700 * numStudents + svcDeposit + 100;
  var total2 = 600 * numStudents + svcDeposit + 100;
  $('#stotal').text(total.toString());
  $('#stotal2').text(total2.toString());

  showPage(6);

  // Parse family ID.
  var tempData = '';
  try {
    tempData = JSON.parse(data).result;
  } catch (e) {
    console.log('Failed to parse server data:', e);
  }
  if (tempData.indexOf('family number') != -1) {
    familyId = tempData.substring(tempData.length - 4, tempData.length);
    chargeAmount = total;
  } else {
    // TODO(arthurhsu): handle exceptions.
  }
}

function onServerFailure(e) {
  $('#progress').dialog('close');
  $('#error').dialog('open');
  $('#next5').removeAttr("disabled");
  console.log(e);
}

function genFinalData() {
  $('#next5').attr("disabled", "disabled");
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
      key: 'pk_test_6pRNASCoBOKtIshFeQd4XMUh',
      image: 'logo.png',
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
          $('#paySuccess').show();
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
