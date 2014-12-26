// When the page loads.
$(function() {
  initDialogs();

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

