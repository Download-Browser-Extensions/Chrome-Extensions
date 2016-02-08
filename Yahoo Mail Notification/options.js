var config = {};
function save_options() {
  var status = document.getElementById('status');
  config.mailNotify = (document.getElementById('option1true').checked ? true : false);
  // Update status to let user know options were saved.
  chrome.runtime.sendMessage({optionsPage: true, fnReq: "set", config: config}, function(response)
      {
          status.textContent = chrome.i18n.getMessage("mailNotify_OptionsSaved");
          setTimeout(function() {
            status.textContent = '';
          }, 750);
      });
}

// Restores select box and checkbox state using the preferences
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.runtime.sendMessage({optionsPage: true, fnReq: "get"}, function(response)
      {
          if(response.mailNotify)
          {
              document.getElementById("option1true").checked = true;
          }
          else
          {
              document.getElementById("option1false").checked = true;
          }
          config = response;
      });
}

function i18n() {
    //localize text
    var optionsTitle = chrome.i18n.getMessage("mailNotify_OptionsTitle"),
        notifyTrue = chrome.i18n.getMessage("mailNotify_OptionsNotifyTrue"),
        notifyFalse= chrome.i18n.getMessage("mailNotify_OptionsNotifyFalse"),
        extName = chrome.i18n.getMessage("extName");
    document.title = extName;
    document.getElementById("i18n_extName").innerText = extName;
    document.getElementById("i18n_optionstitle").innerText = optionsTitle;
    document.getElementById("i18n_optionsnotifytrue").innerText = notifyTrue;
    document.getElementById("i18n_optionsnotifyfalse").innerText = notifyFalse;
}

document.addEventListener('DOMContentLoaded', function(){
    restore_options();
    i18n();
});
var options = document.getElementsByName("option1");
for(var index = 0; index<options.length; index++)
{
    options[index].onclick = save_options;
}
