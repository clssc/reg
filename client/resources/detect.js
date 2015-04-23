$(function() {
  $('#browser_warning').hide();

  // Force browser redirection if the origin is wrong.
  var URL = 'https://www.westsidechineseschool.com';
  if (window.location.origin != URL) {
    window.location.href = URL + '/reg';
    return;
  }

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
    $('#lang_en').attr('href', 'manual-en.html');
    $('#lang_tc').attr('href', 'manual-tc.html');
    $('#lang_sc').attr('href', 'manual-sc.html');
  }
});
