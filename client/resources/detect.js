$(function() {
  $('#browser_warning').hide();

  // Force browser redirection if the origin is wrong.
  var URL = 'https://www.westsidechineseschool.com';
  var URL2 = 'https://westsidechineseschool.weebly.com/tuition-fees-enrollment--refund-2341636027-3538720874332873686436027.html'
  //if (window.location.origin != URL) {
  //  window.location.href = URL + '/reg';
  //  return;
  //}

  var isChrome = navigator.userAgent.indexOf('Chrome') > -1;
  var isIE = navigator.userAgent.indexOf('MSIE') > -1;
  var isFirefox = navigator.userAgent.indexOf('Firefox') > -1;
  var isSafari = navigator.userAgent.indexOf('Safari') > -1;
  if (isChrome && isSafari) {
    isSafari = false;
  }

  var isOldIE = isIE && parseFloat($.browser.version) < 9;
  if (isSafari || isOldIE) {
    $('#browser_warning').show();
    $('#lang_en').hide();
    $('#lang_tc').hide();
    $('#lang_sc').hide();
  //  $('#lang_en').attr('href', URL2);
  //  $('#lang_tc').attr('href', URL2);
  //  $('#lang_sc').attr('href', URL2);
  }
});
