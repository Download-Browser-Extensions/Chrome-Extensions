window.sienium=function(){"use strict";return window.sienium||{}}(),function(a){a.installAppAsync=function(a,b,c){new Promise(function(a,b){chrome.sienium.getInitPrefsData(1,function(c){chrome.runtime.lastError&&b(chrome.runtime.lastError),void 0!==c&&void 0!==c.HostedBrowserVersion&&a(c.HostedBrowserVersion),b(c)})}).then(function(a){return new Promise(function(b,c){chrome.sienium.getLaunchCommandLine(function(d){chrome.runtime.lastError&&c(chrome.runtime.lastError);var e={version:a,dev:!1};for(var f in d)if(void 0!==d[f].name&&-1!=d[f].name.indexOf("dev-mode")){e.dev=!0;break}b(e)})})},function(a){c(a)}).then(function(b){var c="go.im";b.dev&&(c="dev.go.im");var d="http://extension.go.im/api/latest/{0}/update?prodversion={1}".replace("{0}",a).replace("{1}",b.version);return b.dev&&(d+="&dev=true"),new Promise(function(a,b){var c=new XMLHttpRequest("MSXML2.XMLHTTP.3.0");c.open("GET",d,!0),c.setRequestHeader("Content-type","application/json"),c.onreadystatechange=function(){if(4===c.readyState)if(c.status>=200&&c.status<300)try{var d=JSON.parse(c.responseText);a(d)}catch(e){b(e)}else b(c)},c.send()})},function(a){c(a)}).then(function(a){return new Promise(function(){if(void 0!==a&&void 0!==a.LocationUri){var d=chrome.sienium.installApp(a.LocationUri,{},function(a){console.log(a)});b(d)}else c(a)})},function(a){c(a)})}}(sienium);