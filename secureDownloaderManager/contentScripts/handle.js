!function(){function a(a){var b="$$_appiance__handle_top";if(void 0===a){var c=parseInt(localStorage[b],10);return isNaN(c)?100:c}isNaN(a)||(localStorage[b]=a)}function b(b){e&&(b=Math.max(0,Math.min(window.innerHeight-e.clientHeight,b||a())),a(b),e.style.top=b+"px")}function c(){d||"complete"===document.readyState&&(d=!0,e=document.createElement("a"),e.id="appiance__handle",f=e.appendChild(document.createElement("img")),e.addEventListener("click",function(){g.postMessage({msg:"handle::toggle"})}),e.addEventListener("dragstart",function(a){a.preventDefault()}),e.addEventListener("mousedown",function(a){function c(a){a.stopPropagation(),a.preventDefault(),b(g+a.screenY)}function d(){document.removeEventListener("mousemove",c,!0),document.removeEventListener("mouseup",d,!0)}{var f=e.getBoundingClientRect(),g=f.top-a.screenY;-a.screenX}console.log(f),e.classList.add("dragging"),document.addEventListener("mousemove",c,!0),document.addEventListener("mouseup",d,!0)}),document.body.appendChild(e),window.addEventListener("resize",function(){b()}),b(),g=chrome.runtime.connect({name:"HANDLE_CHANNEL"}),g.onMessage.addListener(function(a){var b;if(a.app&&a.app.Data&&a.app.Data.settings){if(f.src=a.app.Data.logo,b=JSON.parse(a.app.Data.settings).sidebar,"undefined"!=typeof b&&null!==b.enable&&"false"===b.enable)return;switch(a.msg){case"handle::display":e.style.display="block";break;case"handle::hide":e.style.display="none"}}else if(a.app&&a.app.Data)switch(f.src=a.app.Data.logo,a.msg){case"handle::display":e.style.display="block";break;case"handle::hide":e.style.display="none"}else e.style.display="none"}))}var d=!1,e=null,f=null,g=null;c(),document.onreadystatechange=c}();