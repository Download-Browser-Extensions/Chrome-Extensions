console.log("Universely content script, engaged..."),function(){function a(){document.querySelector("#settings").style.display="none",document.querySelector("#SetAsHomepage").style.display="none",document.querySelector(".bottom_options").style.display="none"}var b=function(){function a(){for(;d.length>0;){var a=d.splice(0,1)[0];b(a)}}function b(a){window.postMessage(JSON.stringify(a),window.location.origin)}function c(b){window.addEventListener("message",function(b){var c=JSON.parse(b.data);"ready"===c.key&&(e=!0,console.log("ready"),a())});var c=document.createElement("script"),d='(function(){window.addEventListener("message",function(e){var msg=JSON.parse(e.data);('+b.toString()+')(msg);});window.postMessage(JSON.stringify({key:"ready"}), location.origin);})();';c.innerHTML=d,c.onload=function(){console.log("script loaded")},document.body.appendChild(c)}var d=[],e=!1;return{onMessage:function(a){"complete"===document.readyState?c(a):document.addEventListener("DOMContentLoaded",function(){c(a)})},post:function(a){console.log("message received",a),e?b(a):d.push(a)}}}();b.onMessage(function(a){if(a){var b={changeSettings:function(a){var b=a.config;b&&"function"==typeof SettingsMenu.setAppConfiguration&&SettingsMenu.setAppConfiguration(b);var c=a.settings;void 0!==c&&(null!==c?(console.log("importSettings"),c.v&&2==c.v?UniverselyAPI.importJSON(JSON.stringify(c)):SettingsMenu.importSettings(c)):("function"==typeof SettingsMenu.resetSettings&&SettingsMenu.resetSettings(),"function"==typeof SettingsMenu.setRandomBackground&&SettingsMenu.setRandomBackground()))}};return"undefined"!=typeof b[a.key]?b[a.key](a):void 0}});var c=chrome.runtime.connect({name:"UNIVERSELY_CHANNEL"});c.onMessage.addListener(b.post),c.postMessage("getConfig"),"complete"===document.readyState?a():document.addEventListener("DOMContentLoaded",a)}();