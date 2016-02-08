/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * By the rules of AMO and addons.opera.com we cannot use remote scripts
 * (and our JS injection rules could be counted as remote scripts).
 *
 * So what we do:
 * 1. We gather all current JS rules in the DEFAULT_SCRIPT_RULES object
 * 2. We disable JS rules got from remote server
 * 3. We allow only custom rules got from the User filter (which user creates manually)
 *    or from this DEFAULT_SCRIPT_RULES object
 */
var USE_DEFAULT_SCRIPT_RULES = exports.USE_DEFAULT_SCRIPT_RULES = false;
var DEFAULT_SCRIPT_RULES = exports.DEFAULT_SCRIPT_RULES = Object.create(null);
DEFAULT_SCRIPT_RULES[1] = [];
DEFAULT_SCRIPT_RULES[1].push("#%#window.AG_onLoad = function(func) { if (window.addEventListener) { window.addEventListener(\'DOMContentLoaded\', func); } };");
DEFAULT_SCRIPT_RULES[1].push("#%#window.AG_removeElementById = function(id) { var element = document.getElementById(id); if (element && element.parentNode) { element.parentNode.removeChild(element); }};");
DEFAULT_SCRIPT_RULES[1].push("#%#window.AG_removeElementBySelector = function(selector) { if (!document.querySelectorAll) { return; } var nodes = document.querySelectorAll(selector); if (nodes) { for (var i = 0; i < nodes.length; i++) { if (nodes[i] && nodes[i].parentNode) { nodes[i].parentNode.removeChild(nodes[i]); } } } };");
DEFAULT_SCRIPT_RULES[1].push("#%#window.AG_each = function(selector, fn) { if (!document.querySelectorAll) return; var elements = document.querySelectorAll(selector); for (var i = 0; i < elements.length; i++) { fn(elements[i]); }; };");
DEFAULT_SCRIPT_RULES[1].push("#%#var AG_removeParent = function(el, fn) { while (el && el.parentNode) { if (fn(el)) { el.parentNode.removeChild(el); return; } el = el.parentNode; } };");
DEFAULT_SCRIPT_RULES[1].push("ddgroupclub.ru#%#var block = false;");
DEFAULT_SCRIPT_RULES[1].push("theplace.ru#%#AG_onLoad(function() { $(\"ins.adsbygoogle\").html(\"anti-antiadblock\"); });");
DEFAULT_SCRIPT_RULES[1].push("nnm-club.me#%#var adbl = \'no\';");
DEFAULT_SCRIPT_RULES[1].push("adultmult.tv#%#AG_onLoad(function() { AG_AntiAntiBlock(); });");
DEFAULT_SCRIPT_RULES[1].push("adultmult.tv#%#var AG_AntiAntiBlock = function() { var baseCreateElement = document.createElement; document.createElement = function(name) { if (name && name.match(\/div|font|center\/i)) { return null; } else { return baseCreateElement(name); } } };");
DEFAULT_SCRIPT_RULES[1].push("dugtor.ru#%#setTimeout(function() { window.StartAntiAdBlock = function() {} }, 1500);");
DEFAULT_SCRIPT_RULES[1].push("3dnews.ru#%#window.__AT_detected = true;");
DEFAULT_SCRIPT_RULES[1].push("smugenom.clan.su#%#window.setTimeout=function() {};");
DEFAULT_SCRIPT_RULES[1].push("megamozg.ru,geektimes.ru,habrahabr.ru#%#var adbl = \'no\';");
DEFAULT_SCRIPT_RULES[1].push("ivbt.ru#%#function setTimeout() {};");
DEFAULT_SCRIPT_RULES[1].push("megogo.net#%#AG_onLoad(function() { window.adBlock = false; });");
DEFAULT_SCRIPT_RULES[1].push("skidkaonline.ru#%#var canRunAds = true;");
DEFAULT_SCRIPT_RULES[1].push("acer-a500.ru#%#function setTimeout() {};");
DEFAULT_SCRIPT_RULES[1].push("mybuses.ru#%#window.setTimeout=function() {};");
DEFAULT_SCRIPT_RULES[1].push("lostfilmonline.tv#%#function setTimeout() {};");
DEFAULT_SCRIPT_RULES[1].push("moonwalk.cc#%#function setTimeout() {};");
DEFAULT_SCRIPT_RULES[1].push("chatovod.ru,spiritix.eu,chat.muz-tv.ru,\u0447\u0430\u0442\u0432\u043E\u043B\u0447\u0430\u0442.\u0440\u0444,\u043F\u043E\u0434\u0440\u043E\u0441\u0442\u043A\u043E\u0432\u044B\u0439\u0447\u0430\u0442.\u0440\u0444,\u0434\u0435\u0442\u0441\u043A\u0438\u0439\u0447\u0430\u0442.\u0440\u0444,\u0447\u0430\u0442\u0432\u043E\u043B\u0447\u0430\u0442.\u0440\u0444,\u0447\u0430\u0442\u043A\u0440\u043E\u0432\u0430\u0442\u043A\u0430.\u0440\u0444,\u0447\u0430\u0442\u043E\u0431\u0449\u0435\u043D\u0438\u044F.\u0440\u0444#%#AG_onLoad(function() { $(\'.chatAds\').remove(); });");
DEFAULT_SCRIPT_RULES[1].push("chatovod.ru,spiritix.eu,chat.muz-tv.ru,\u0447\u0430\u0442\u0432\u043E\u043B\u0447\u0430\u0442.\u0440\u0444,\u043F\u043E\u0434\u0440\u043E\u0441\u0442\u043A\u043E\u0432\u044B\u0439\u0447\u0430\u0442.\u0440\u0444,\u0434\u0435\u0442\u0441\u043A\u0438\u0439\u0447\u0430\u0442.\u0440\u0444,\u0447\u0430\u0442\u0432\u043E\u043B\u0447\u0430\u0442.\u0440\u0444,\u0447\u0430\u0442\u043A\u0440\u043E\u0432\u0430\u0442\u043A\u0430.\u0440\u0444,\u0447\u0430\u0442\u043E\u0431\u0449\u0435\u043D\u0438\u044F.\u0440\u0444#%#AG_onLoad(function() { var original = $.fn.html; $.fn.html = function(html) { if (this.is && this.is(\'body\')) return; return original.apply(this, arguments); }; });");
DEFAULT_SCRIPT_RULES[1].push("tapochek.net#%#AG_onLoad(function() { window.ShowAdbblock = function() {} });");
DEFAULT_SCRIPT_RULES[1].push("bitru.org,hdrezka.tv,safebit.co.in,stopgame.ru#%#var fuckAdBlock = false;");
DEFAULT_SCRIPT_RULES[1].push("yandex.ru,yandex.com,yandex.ua,yandex.kz,yandex.by#%#var __adgRemoveContext = function() { AG_each(\'.serp-adv-item__label\', function(node) { AG_removeParent(node, function(parent) { return parent.className && (parent.className.indexOf(\'serp-item_js_inited\') >= 0 || parent.className && parent.className.indexOf(\'serp-adv__block\') >= 0); }); }); }");
DEFAULT_SCRIPT_RULES[1].push("yandex.ru,yandex.com,yandex.ua,yandex.kz,yandex.by#%#var __adgRemoveDirectMail = function() { AG_each(\'.js-folders__nesting\', function(node) { AG_each(\'a[class=\"b-folders__folder__link\"][href*=\"direct.yandex.ru\"]\', function(node) { AG_removeParent(node, function(parent) { return parent.className && parent.className.indexOf(\'b-folders__nesting\') >= 0; }); }); }); }");
DEFAULT_SCRIPT_RULES[1].push("yandex.ru,yandex.com,yandex.ua,yandex.kz,yandex.by#%#var __adgRemoveDirectNews = function() { AG_each(\'a[href^=\"http:\/\/news-clck.yandex.\"]\', function (node) { AG_removeParent(node, function (parent) { return parent.className && parent.className.indexOf(\'story\') >= 0; }); }); };");
DEFAULT_SCRIPT_RULES[1].push("yandex.ru,yandex.com,yandex.ua,yandex.kz,yandex.by#%#var __adgRemoveDirect = function () { __adgRemoveDirectNews(); __adgRemoveDirectMail(); if (typeof __adgEnabled != \'undefined\' && !__adgEnabled) { return; } else { __adgRemoveContext(); } };");
DEFAULT_SCRIPT_RULES[1].push("yandex.ru,yandex.com,yandex.ua,yandex.kz,yandex.by#%#function __adgObserver() { var observer = new MutationObserver(function(mutations) { mutations.forEach(function(mutation) { __adgRemoveDirect(); }); }); observer.observe(document.body,  { childList: true, characterData: true, subtree: true }); };");
DEFAULT_SCRIPT_RULES[1].push("yandex.ru,yandex.com,yandex.ua,yandex.kz,yandex.by#%#AG_onLoad(function() { __adgRemoveDirect(); __adgObserver(); });");
DEFAULT_SCRIPT_RULES[1].push("pogoda.yandex.ru,pogoda.yandex.ua,pogoda.yandex.by,pogoda.yandex.kz#%#AG_onLoad(function() { try { $(\'.adsrv\').remove(); } catch(ex) {} });");
DEFAULT_SCRIPT_RULES[1].push("moonwalk.cc#%#AG_onLoad(function() { window.iframe_adv_enabled = false; });");
DEFAULT_SCRIPT_RULES[1].push("kinomoov.net#%#AG_onLoad(function() { window.flashLayerAdShowed = true; });");
DEFAULT_SCRIPT_RULES[1].push("rusfolder.com,rusfolder.net,rusfolder.ru#%#AG_onLoad(function() { window.openCbn = function() {} });");
DEFAULT_SCRIPT_RULES[1].push("letitbit.net#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[1].push("kinokopilka.tv#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[1].push("~ntv.ru,~rg.ru#%#var AdFox_getCodeScript = function() {};");
DEFAULT_SCRIPT_RULES[1].push("aftershock.su,fileplaneta.com,aif.ru,meteocenter.net,newsland.com,newsland.ru,glav.su,eg.ru,kg-portal.ru,sovsport.md,newsland.com,newsland.ru,glav.su,eg.ru,kp.ru,kg-portal.ru,select.by,sovsport.md,sovsport.ru,playground.ru,kinonews.ru,gismeteo.ua,gismeteo.by,soccer.ru,mobile-review.com,ria.ru,thg.ru,mk.ru,oszone.net,dirty.ru,hotline.ua,topnews.ru,povarenok.ru,readmanga.me,sobesednik.ru#%#AG_onLoad(function() { window.AG_removeElementBySelector(\'iframe[id^=\"ar_\"]\'); });");
DEFAULT_SCRIPT_RULES[1].push("irr.ru#%#AG_onLoad(function() { window.AG_removeElementBySelector(\'iframe[id^=\"bw_\"]\'); });");
DEFAULT_SCRIPT_RULES[1].push("acer-a500.ru,lokomotiv.info,kulturologia.ru,biysk24.ru,baskino.com,gai.ru,topnews.ru,russianfood.com,altapress.ru#%#AG_onLoad(function() { window.AG_removeElementBySelector(\'iframe[id^=\"k_c\"]\'); });");
DEFAULT_SCRIPT_RULES[1].push("kasparov.ru,wonderzine.com,glav.su,rbc.ru,soccer.ru,aftershock.su,kp.ru,rbcdaily.ru,sobesednik.ru#%#AG_onLoad(function() { window.AG_removeElementBySelector(\'iframe[id^=\"ml_\"]\'); });");
DEFAULT_SCRIPT_RULES[1].push("sports.ru,vesti.ru,colta.ru,kp.ru#%#AG_onLoad(function() { window.AG_removeElementBySelector(\'iframe[id^=\"AdFox_iframe_\"]\'); });");
DEFAULT_SCRIPT_RULES[1].push("kinoprofi.net,rutracker.org,new-rutor.org,myfolder.ru,rusfolder.com,myzuka.org#%#AG_onLoad(function() { window.AG_removeElementBySelector(\'iframe[id^=\"_ads_\"]\'); });");
DEFAULT_SCRIPT_RULES[1].push("meduza.io#%#AG_onLoad(function() { setTimeout(function() { window.AG_removeElementBySelector(\'iframe[id^=\"AdFox_iframe_\"]\'); },1000); });");
DEFAULT_SCRIPT_RULES[1].push("tbs-play.com#%#AG_onLoad(function() { window.AG_removeElementBySelector(\'ins[id^=\"aswift_\"]\'); });");
DEFAULT_SCRIPT_RULES[1].push("alpha.yaplakal.com#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[1].push("ruspicbox.ru#%#function setTimeout() {};");
DEFAULT_SCRIPT_RULES[1].push("torrentszona.com#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[1].push("alpha.yap.ru#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[1].push("picmani.ru#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[1].push("myserial.org#%# var block = false;");
DEFAULT_SCRIPT_RULES[1].push("allfon.tv#%#window.ab = false;");
DEFAULT_SCRIPT_RULES[1].push("thepiratebay.com.ua#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[1].push("subw.ru#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[1].push("aniland.org#%#document.cookie = \"vostrek=2500\";");
DEFAULT_SCRIPT_RULES[1].push("#%#AG_onLoad(function() { window.AG_each(\'iframe[id^=\"AdFox_iframe_\"]\', function(el) { if (el && el.parentNode) { el.parentNode.removeChild(el); } }); });");
DEFAULT_SCRIPT_RULES[1].push("all-ebooks.com#%# var familion = 0;");
DEFAULT_SCRIPT_RULES[1].push("tapochek.net#%#AG_onLoad(function() { window.openadv = function() {} });");
DEFAULT_SCRIPT_RULES[1].push("fastpic.ru#%#AG_onLoad(function() { $(\'body\').unbind(\'click\').removeAttr(\"body\").css(\"cursor\",\"default\"); });");
DEFAULT_SCRIPT_RULES[1].push("!chat.muz-tv.ru,chatovod.ru,spiritix.eu,\u0434\u0435\u0442\u0441\u043A\u0438\u0439\u0447\u0430\u0442.\u0440\u0444,\u043F\u043E\u0434\u0440\u043E\u0441\u0442\u043A\u043E\u0432\u044B\u0439\u0447\u0430\u0442.\u0440\u0444,\u0447\u0430\u0442\u0432\u043E\u043B\u0447\u0430\u0442.\u0440\u0444,\u0447\u0430\u0442\u043A\u0440\u043E\u0432\u0430\u0442\u043A\u0430.\u0440\u0444,\u0447\u0430\u0442\u043E\u0431\u0449\u0435\u043D\u0438\u044F.\u0440\u0444#%#AG_onLoad(function() { $(\'div[id^=\"javents\"]\').remove(); });");
DEFAULT_SCRIPT_RULES[1].push("gazeta.ua#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[1].push("valetudo.ru#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[1].push("play.aniland.org#%#document.cookie = \"rec=2001\";");
DEFAULT_SCRIPT_RULES[1].push("metrprice.ru#%#AG_onLoad(function() { $(\'div.special-offers\').closest(\'.h-layout__item\').remove(); });");
DEFAULT_SCRIPT_RULES[1].push("strana.in.ua#%#AG_onLoad(function() { window.GetCookie = function() { return \'haha\'; }; });");
DEFAULT_SCRIPT_RULES[1].push("root-nation.com#%#AG_onLoad(function() { document.body.className = document.body.className.replace(\"td-boxed-layout\",\".\"); });");
DEFAULT_SCRIPT_RULES[1].push("luxtorrents.com#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[1].push("msinsider.ru#%#AG_onLoad(function() { window.AG_removeElementBySelector(\'span[class=\"intexta\"]\'); });");
DEFAULT_SCRIPT_RULES[1].push("fs.to,brb.to,cxz.to#%#Object.defineProperty(Object.prototype, \'prerollsEnabled\', { get: function() { return false; } });");
DEFAULT_SCRIPT_RULES[1].push("fs.to,brb.to,cxz.to#%#var originalUserAgent = navigator.userAgent; Object.defineProperty(navigator, \'userAgent\', { get: function() { return \' Mozilla\/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit\/537.75.14 (KHTML, like Gecko) Version\/7.0.3 Safari\/7046A194A\'; } });");
DEFAULT_SCRIPT_RULES[1].push("unionpeer.org#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[1].push("krasview.ru#%#AG_onLoad(function() { $(\'body\').unbind(\'click\'); });");
DEFAULT_SCRIPT_RULES[1].push("torrent-pirat.com#%#AG_onLoad(function() { window.PopunderShown = true; });");
DEFAULT_SCRIPT_RULES[1].push("moonwalk.cc#%#setTimeout(200, function() { window.isgid = true; });");
DEFAULT_SCRIPT_RULES[1].push("torrent-pirat.com#%#a[href^=\"http:\/\/runetki.com\/\"]");
DEFAULT_SCRIPT_RULES[2] = [];
DEFAULT_SCRIPT_RULES[2].push("#%#window.AG_onLoad = function(func) { if (window.addEventListener) { window.addEventListener(\'DOMContentLoaded\', func); } };");
DEFAULT_SCRIPT_RULES[2].push("#%#window.AG_removeElementById = function(id) { var element = document.getElementById(id); if (element && element.parentNode) { element.parentNode.removeChild(element); }};");
DEFAULT_SCRIPT_RULES[2].push("#%#window.AG_removeElementBySelector = function(selector) { if (!document.querySelectorAll) { return; } var nodes = document.querySelectorAll(selector); if (nodes) { for (var i = 0; i < nodes.length; i++) { if (nodes[i] && nodes[i].parentNode) { nodes[i].parentNode.removeChild(nodes[i]); } } } };");
DEFAULT_SCRIPT_RULES[2].push("#%#window.AG_each = function(selector, fn) { if (!document.querySelectorAll) return; var elements = document.querySelectorAll(selector); for (var i = 0; i < elements.length; i++) { fn(elements[i]); }; };");
DEFAULT_SCRIPT_RULES[2].push("#%#var AG_removeParent = function(el, fn) { while (el && el.parentNode) { if (fn(el)) { el.parentNode.removeChild(el); return; } el = el.parentNode; } };");
DEFAULT_SCRIPT_RULES[2].push("pastebin.com,staticdn.nl#%#var fuckAdBlock = false;");
DEFAULT_SCRIPT_RULES[2].push("bitcoinspace.net#%#window.canRunAds = true;");
DEFAULT_SCRIPT_RULES[2].push("foxfaucet.com#%#window.setTimeout=function() {};");
DEFAULT_SCRIPT_RULES[2].push("microimg.biz#%#window.setTimeout=function() {};");
DEFAULT_SCRIPT_RULES[2].push("zippymoviez.com#%#window.setTimeout=function() {};");
DEFAULT_SCRIPT_RULES[2].push("uptobox.com#%#window.setTimeout=function() {};");
DEFAULT_SCRIPT_RULES[2].push("fileplaneta.com,gamersglobal.de,latino-serialo.ru,lacasadeltikitaka.org,reality24horas.com#%#AG_onLoad(function() { AG_AntiAntiBlock(); });");
DEFAULT_SCRIPT_RULES[2].push("fileplaneta.com,gamersglobal.de,latino-serialo.ru,lacasadeltikitaka.org,reality24horas.com#%#var AG_AntiAntiBlock = function() { var baseCreateElement = document.createElement; document.createElement = function(name) { if (name && name.match(\/div|font|center\/i)) { return null; } else { return baseCreateElement(name); } } };");
DEFAULT_SCRIPT_RULES[2].push("inoreader.com#%#AG_onLoad(function() { window.adb_detected = function() {}; });");
DEFAULT_SCRIPT_RULES[2].push("inoreader.com#%#var adb_detected = function() {};");
DEFAULT_SCRIPT_RULES[2].push("mobilmania.cz#%#AG_onLoad(function() { window.VIDEO_AD_FORCE_YT = true; });");
DEFAULT_SCRIPT_RULES[2].push("generation-nt.com#%#Object.defineProperty(window, \'AdvertBay\', { get: function() { return []; } });");
DEFAULT_SCRIPT_RULES[2].push("skyrock.com,skyrock.fr#%#Object.defineProperty(window, \'OAS_AD\', { get: function() { return []; } });");
DEFAULT_SCRIPT_RULES[2].push("radiocockpit.fr#%#function setTimeout() {};");
DEFAULT_SCRIPT_RULES[2].push("exsite.pl#%#window.ab = false;");
DEFAULT_SCRIPT_RULES[2].push("interia.pl#%#document.cookie = \"lltsg=1\";");
DEFAULT_SCRIPT_RULES[2].push("nosteam.ro#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[2].push("videogamesblogger.com#%#Object.defineProperty(window, \'__durl\', { get: function() { return []; } });");
DEFAULT_SCRIPT_RULES[2].push("opensubtitles.org#%#AG_onLoad(function() { for (var key in window) { if (key.indexOf(\'_0x\') == 0) { window[key] = []; } }; });");
DEFAULT_SCRIPT_RULES[2].push("sendspace.com#%#AG_onLoad(function() { window.runad = function() {} });");
DEFAULT_SCRIPT_RULES[2].push("your-pictures.net#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[2].push("userscloud.com#%#AG_onLoad(function() { $(\'a[href^=\"http:\/\/websitedhoome.com\/\"]\').removeAttr(\"href\"); });");
DEFAULT_SCRIPT_RULES[2].push("chaturbate.com#%#document.cookie = \"np3=5\";");
DEFAULT_SCRIPT_RULES[2].push("180upload.com#%#AG_onLoad(function() { $(\'#use_installer\').removeAttr(\'checked\') });");
DEFAULT_SCRIPT_RULES[2].push("better-explorer.com#%#AG_onLoad(function() { AG_removeElementById(\'y34e\') });");
DEFAULT_SCRIPT_RULES[2].push("yourhowto.net#%#AG_onLoad(function() { try { jQuery(\'.topnote\').next().remove(); jQuery(\'.topnote\').remove(); } catch (ex) {} });");
DEFAULT_SCRIPT_RULES[2].push("sendspace.com#%#window.runad = function() {};");
DEFAULT_SCRIPT_RULES[2].push("bitcoinzebra.com#%#AG_onLoad(function() { var prevShowCaptcha = window.showCaptcha; window.showCaptcha = function() { prevShowCaptcha(); $(\'#AdBlocked\').val(\'false\'); }; });");
DEFAULT_SCRIPT_RULES[2].push("filepost.com#%#setTimeout(function() { window.show_popup=false; window.download_inited = true; }, 300);");
DEFAULT_SCRIPT_RULES[2].push("ilive.to#%#function setOverlayHTML() {};");
DEFAULT_SCRIPT_RULES[2].push("ilive.to#%#function setOverlayHTML_new() {};");
DEFAULT_SCRIPT_RULES[2].push("ilive.to#%#setTimeout(removeOverlayHTML, 2000);");
DEFAULT_SCRIPT_RULES[2].push("karnaval.com#%#var atrk=function() {}");
DEFAULT_SCRIPT_RULES[2].push("torrentz.eu#%#document.addEventListener=function() {}");
DEFAULT_SCRIPT_RULES[2].push("efukt.com#%#AG_onLoad(function() { window.popunder=function() {} });");
DEFAULT_SCRIPT_RULES[2].push("any.gs#%#var parts = document.URL.split(\"\/url\/\"); if (parts.length == 2 && parts[1].indexOf(\'script\') < 0 && \/^https?:\\\/\\\/[a-z0-9.-_]+\\\/.*$\/.test(parts[1])) { document.location = parts[1]; };");
DEFAULT_SCRIPT_RULES[2].push("pirateproxy.in,pirateproxy.be,thepiratebay.se,thepiratebay.pe,thepiratebay.ac,thepiratebay.se#%#window.open=function() {};");
DEFAULT_SCRIPT_RULES[2].push("zive.cz#%#AG_onLoad(function() { window.VIDEO_AD_ENABLED = false; } );");
DEFAULT_SCRIPT_RULES[2].push("fcore.eu,filecore.co.nz#%#AG_onLoad(function() { window.checkAds = function() {}; });");
DEFAULT_SCRIPT_RULES[2].push("pornhub.com#%#window.opera = true;");
DEFAULT_SCRIPT_RULES[2].push("secureupload.eu#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[2].push("kissanime.com#%#AG_onLoad(function() { window.DoDetect2 = function() {} });");
DEFAULT_SCRIPT_RULES[2].push("imagebam.com#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[2].push("freeimgup.com#%#document.cookie = \"popundr=1\";");
DEFAULT_SCRIPT_RULES[2].push("calameo.com#%#AG_onLoad(function() { document.getElementsByTagName(\'body\')[0].className = \'\'; });");
DEFAULT_SCRIPT_RULES[2].push("zippymoviez.com#%#window.open = function() {};");
DEFAULT_SCRIPT_RULES[3] = [];
DEFAULT_SCRIPT_RULES[3].push("#%#window.AG_onLoad = function(func) { if (window.addEventListener) { window.addEventListener(\'DOMContentLoaded\', func); } };");
DEFAULT_SCRIPT_RULES[3].push("#%#window.AG_removeElementById = function(id) { var element = document.getElementById(id); if (element && element.parentNode) { element.parentNode.removeChild(element); }};");
DEFAULT_SCRIPT_RULES[3].push("#%#window.AG_removeElementBySelector = function(selector) { if (!document.querySelectorAll) { return; } var nodes = document.querySelectorAll(selector); if (nodes) { for (var i = 0; i < nodes.length; i++) { if (nodes[i] && nodes[i].parentNode) { nodes[i].parentNode.removeChild(nodes[i]); } } } };");
DEFAULT_SCRIPT_RULES[3].push("#%#window.AG_each = function(selector, fn) { if (!document.querySelectorAll) return; var elements = document.querySelectorAll(selector); for (var i = 0; i < elements.length; i++) { fn(elements[i]); }; };");
DEFAULT_SCRIPT_RULES[3].push("#%#var AG_removeParent = function(el, fn) { while (el && el.parentNode) { if (fn(el)) { el.parentNode.removeChild(el); return; } el = el.parentNode; } };");
DEFAULT_SCRIPT_RULES[3].push("~realmadrid.com,~google.cn,~google.by,~google.be,~google.at,~google.ae,~google.ca,~google.ch,~google.cl,~google.cn,~google.co.id,~google.co.in,~google.co.jp,~google.co.th,~google.co.uk,~google.co.ve,~google.co.za,~google.com,~google.com.ar,~google.com.au,~google.com.bd,~google.com.br,~google.com.co,~google.com.eg,~google.com.hk,~google.com.mx,~google.com.my,~google.com.ng,~google.com.pe,~google.com.pe,~google.com.ph,~google.com.pk,~google.com.sa,~google.com.sg,~google.com.tr,~google.com.tw,~google.com.ua,~google.com.vn,~google.de,~google.dk,~google.es,~google.fr,~google.gr,~google.hu,~google.ie,~google.it,~google.nl,~google.no,~google.pl,~google.ru,~google.pt,~google.ro,~google.rs,~google.se,~google.sk,~google.tn,~google.ee,~maximonline.ru,~minecraft.net,~softkey.ru,~softkey.ua#%#var _gaq = []; var _gat = { _getTracker: function() { return { _initData: function(){}, _trackPageview: function(){}, _trackEvent: function(){}, _setAllowLinker: function() {}, _setCustomVar: function() {} } }, _createTracker: function() { return this._getTracker(); }, _anonymizeIp: function() {} };");
DEFAULT_SCRIPT_RULES[3].push("~google.cn,~google.by,~google.be,~google.at,~google.ae,~google.ca,~google.ch,~google.cl,~google.cn,~google.co.id,~google.co.in,~google.co.jp,~google.co.th,~google.co.uk,~google.co.ve,~google.co.za,~google.com,~google.com.ar,~google.com.au,~google.com.bd,~google.com.br,~google.com.co,~google.com.eg,~google.com.hk,~google.com.mx,~google.com.my,~google.com.ng,~google.com.pe,~google.com.pe,~google.com.ph,~google.com.pk,~google.com.sa,~google.com.sg,~google.com.tr,~google.com.tw,~google.com.ua,~google.com.vn,~google.de,~google.dk,~google.es,~google.fr,~google.gr,~google.hu,~google.ie,~google.it,~google.nl,~google.no,~google.pl,~google.ru,~google.pt,~google.ro,~google.rs,~google.se,~google.sk,~google.tn,~google.ee#%#function urchinTracker() {};");
DEFAULT_SCRIPT_RULES[3].push("#%#var nol_t = function() { return { record: function() { return { post: function() {} } } } };");
DEFAULT_SCRIPT_RULES[3].push("juisy.in#%#var yaCounter24662438 = { reachGoal: function() {} };");
DEFAULT_SCRIPT_RULES[3].push("citypizza.ru#%#var yaCounter9890803 = { reachGoal: function() {} };");
DEFAULT_SCRIPT_RULES[3].push("webfile.ru#%#var yaCounter20889169 = { reachGoal: function() {} };");
DEFAULT_SCRIPT_RULES[3].push("aukro.ua#%#window.cm = { event: function() {}, call: function() {} };");
DEFAULT_SCRIPT_RULES[3].push("apteka.ru#%#window.yaCounter14913877={ reachGoal: function() {} };");
DEFAULT_SCRIPT_RULES[3].push("popmech.ru#%#AG_onLoad(function() { window.POPMECH.increaseCounters = function() {} });");
DEFAULT_SCRIPT_RULES[4] = [];
DEFAULT_SCRIPT_RULES[4].push("#%#window.AG_onLoad = function(func) { if (window.addEventListener) { window.addEventListener(\'DOMContentLoaded\', func); } };");
DEFAULT_SCRIPT_RULES[4].push("#%#window.AG_removeElementById = function(id) { var element = document.getElementById(id); if (element && element.parentNode) { element.parentNode.removeChild(element); }};");
DEFAULT_SCRIPT_RULES[4].push("#%#window.AG_removeElementBySelector = function(selector) { if (!document.querySelectorAll) { return; } var nodes = document.querySelectorAll(selector); if (nodes) { for (var i = 0; i < nodes.length; i++) { if (nodes[i] && nodes[i].parentNode) { nodes[i].parentNode.removeChild(nodes[i]); } } } };");
DEFAULT_SCRIPT_RULES[4].push("#%#window.AG_each = function(selector, fn) { if (!document.querySelectorAll) return; var elements = document.querySelectorAll(selector); for (var i = 0; i < elements.length; i++) { fn(elements[i]); }; };");
DEFAULT_SCRIPT_RULES[4].push("#%#var AG_removeParent = function(el, fn) { while (el && el.parentNode) { if (fn(el)) { el.parentNode.removeChild(el); return; } el = el.parentNode; } };");
DEFAULT_SCRIPT_RULES[4].push("~google.cn,~google.by,~google.be,~google.at,~google.ae,~google.ca,~google.ch,~google.cl,~google.cn,~google.co.id,~google.co.in,~google.co.jp,~google.co.th,~google.co.uk,~google.co.ve,~google.co.za,~google.com,~google.com.ar,~google.com.au,~google.com.bd,~google.com.br,~google.com.co,~google.com.eg,~google.com.hk,~google.com.mx,~google.com.my,~google.com.ng,~google.com.pe,~google.com.pe,~google.com.ph,~google.com.pk,~google.com.sa,~google.com.sg,~google.com.tr,~google.com.tw,~google.com.ua,~google.com.vn,~google.de,~google.dk,~google.es,~google.fr,~google.gr,~google.hu,~google.ie,~google.it,~google.nl,~google.no,~google.pl,~google.ru,~google.pt,~google.ro,~google.rs,~google.se,~google.sk,~google.tn,~google.ee,~youtube.com,~9gag.com,~xda-developers.com,~driveplayer.com#%#window.gapi={ plusone: { go: function(){}, render: function(){} }};");
DEFAULT_SCRIPT_RULES[4].push("~milli-firka.org,~assassinscreed.com,~surfingbird.ru,~samsung.com,~imgur.com,~rockstargames.com#%#var addthis = { init: function() {}, addEventListener: function() {}, button: function() {}, counter: function() {} };");
DEFAULT_SCRIPT_RULES[4].push("hopesandfears.com#%#twttr={events: { bind: function() {} }};");
DEFAULT_SCRIPT_RULES[4].push("#%#var stLight = { options: function() {} };");
DEFAULT_SCRIPT_RULES[4].push("#%#var ads_register = [];");
DEFAULT_SCRIPT_RULES[4].push("filebase.ws#%#document.cookie = \"fb_like_popup=1\";");
DEFAULT_SCRIPT_RULES[4].push("megatrack.org#%#document.cookie = \"plusplus_mw=1\";");
DEFAULT_SCRIPT_RULES[4].push("megalyrics.ru#%#document.cookie = \"no_fb=true\";");
DEFAULT_SCRIPT_RULES[4].push("minprom.ua#%#document.cookie = \"popup_user_login=yes\";");
DEFAULT_SCRIPT_RULES[4].push("nv.ua#%#document.cookie = \"smodal=1\";");
DEFAULT_SCRIPT_RULES[4].push("depo.ua#%#document.cookie = \"scps=1\";");
DEFAULT_SCRIPT_RULES[4].push("takprosto.cc#%#document.cookie = \"popup_displayed=true\";");
DEFAULT_SCRIPT_RULES[5] = [];
DEFAULT_SCRIPT_RULES[5].push("#%#window.AG_onLoad = function(func) { if (window.addEventListener) { window.addEventListener(\'DOMContentLoaded\', func); } };");
DEFAULT_SCRIPT_RULES[5].push("#%#window.AG_removeElementById = function(id) { var element = document.getElementById(id); if (element && element.parentNode) { element.parentNode.removeChild(element); }};");
DEFAULT_SCRIPT_RULES[5].push("#%#window.AG_removeElementBySelector = function(selector) { if (!document.querySelectorAll) { return; } var nodes = document.querySelectorAll(selector); if (nodes) { for (var i = 0; i < nodes.length; i++) { if (nodes[i] && nodes[i].parentNode) { nodes[i].parentNode.removeChild(nodes[i]); } } } };");
DEFAULT_SCRIPT_RULES[5].push("#%#window.AG_each = function(selector, fn) { if (!document.querySelectorAll) return; var elements = document.querySelectorAll(selector); for (var i = 0; i < elements.length; i++) { fn(elements[i]); }; };");
DEFAULT_SCRIPT_RULES[5].push("#%#var AG_removeParent = function(el, fn) { while (el && el.parentNode) { if (fn(el)) { el.parentNode.removeChild(el); return; } el = el.parentNode; } };");
DEFAULT_SCRIPT_RULES[5].push("antiblock.org#%#var AG_AntiAntiBlock = function() { var baseCreateElement = document.createElement; document.createElement = function(name) { if (name && name.match(\/div|font|center\/i)) { return null; } else { return baseCreateElement(name); } } };");
DEFAULT_SCRIPT_RULES[5].push("antiblock.org#%#AG_onLoad(function() { AG_AntiAntiBlock(); });");
DEFAULT_SCRIPT_RULES[5].push("skatay.com#%#AG_onLoad(function() { $(\'a[href^=\"http:\/\/goload.do.am\/\"]\').closest(\'table\').remove(); });");
DEFAULT_SCRIPT_RULES[5].push("go.guidants.com#%#AG_onLoad(function() {  $(\"#sidereklame\").remove(); $(\".reklameflaechen#activity\").css({ \'right\': \'0px\' }); $(\"#activity\").css({ \'right\': \'0px\' }); });");
DEFAULT_SCRIPT_RULES[5].push("openload.co#%#document.cookie = \"popcashpuCap=1\";");
DEFAULT_SCRIPT_RULES[5].push("f-picture.net,radical-foto.ru,radikal.cc,radikal.ru#%#AG_onLoad(function() { window.AG_removeElementBySelector(\'iframe[src^=\"http:\/\/\"]\'); });");
DEFAULT_SCRIPT_RULES[5].push("fishki.net#%#AG_onLoad(function() { $(\'a[data-subscribe*=\"_543769\"]\').closest(\'div[id^=\"post-\"]\').remove(); });");
DEFAULT_SCRIPT_RULES[5].push("!yaplakal.com#%#AG_onLoad(function() { var footers = $(\'b.icon-user>a[href=\"http:\/\/www.yaplakal.com\/members\/member1438.html\"]\').closest(\'tr\'); $(footers).each(function() { $(this).prev().remove(); $(this).prev().remove(); $(this).remove(); }); });");
DEFAULT_SCRIPT_RULES[5].push("!yaplakal.com#%#setTimeout(function() { var footers = $(\'b.icon-user>a[href=\"http:\/\/www.yaplakal.com\/members\/member1438.html\"]\').closest(\'tr\'); $(footers).each(function() { $(this).prev().remove(); $(this).prev().remove(); $(this).remove(); }); }, 1500);");
DEFAULT_SCRIPT_RULES[5].push("!yap.ru#%#AG_onLoad(function() { var footers = $(\'b.icon-user>a[href=\"http:\/\/yap.ru\/members\/member1438.html\"]\').closest(\'tr\'); $(footers).each(function() { $(this).prev().remove(); $(this).prev().remove(); $(this).remove(); }); });");
DEFAULT_SCRIPT_RULES[5].push("!yap.ru#%#setTimeout(function() { var footers = $(\'b.icon-user>a[href=\"http:\/\/www.yaplakal.com\/members\/member1438.html\"]\').closest(\'tr\'); $(footers).each(function() { $(this).prev().remove(); $(this).prev().remove(); $(this).remove(); }); }, 1500);");
DEFAULT_SCRIPT_RULES[5].push("pikabu.ru#%#AG_onLoad(function() { $(\'a[href=\"http:\/\/pikabu.ru\/html.php?id=ad\"]\').closest(\'table[class*=\"inner_wrap_visible\"]\').remove(); });");
DEFAULT_SCRIPT_RULES[5].push("pcgames.de#%#AG_onLoad(function() { $(\'a[title*=\"[Anzeige]\"]\').closest(\'div[class^=\"item noImg\"]\').remove(); });");
DEFAULT_SCRIPT_RULES[5].push("buffed.de#%#AG_onLoad(function() { $(\'a[href*=\"\/E-Commerce\"]\').closest(\'div[class*=\"item noImg\"]\').remove(); });");
DEFAULT_SCRIPT_RULES[5].push("buffed.de#%#AG_onLoad(function() { $(\'a[href*=\"-Anzeige-\"]\').closest(\'div[class*=\"item noImg\"]\').remove(); });");
DEFAULT_SCRIPT_RULES[5].push("yaplakal.com,yap.ru#%#AG_onLoad(function() { window.clkUnd = function() {} });");
DEFAULT_SCRIPT_RULES[5].push("~junodownload.com#%#document.onmouseout = null; window.onbeforeunload = null; window.blur = null;");
DEFAULT_SCRIPT_RULES[5].push("ukrrele.com#%#document.onselectstart = function() {};");
DEFAULT_SCRIPT_RULES[5].push("ukrrele.com#%#document.oncontextmenu = function() {};");
DEFAULT_SCRIPT_RULES[5].push("ukrrele.com#%#document.onmousedown = function() {};");
DEFAULT_SCRIPT_RULES[5].push("videogamesblogger.com#%#AG_onLoad(function() { window.num_seconds = 1; });");
DEFAULT_SCRIPT_RULES[5].push("rusfolder.com,rusfolder.net#%#AG_onLoad(function() { $(\'a[href^=\"http:\/\/ints.rusfolder.com\/ints\/sponsor\/?bi=\"]\').trigger(\'click\'); });");
DEFAULT_SCRIPT_RULES[6] = [];
DEFAULT_SCRIPT_RULES[6].push("gamezone.de#%#AG_onLoad(function() { $(\'a[href*=\"E-Commerce-Thema-\"]\').closest(\'div[class*=\"item midImg \"]\').remove(); });");
DEFAULT_SCRIPT_RULES[6].push("gamesaktuell.de#%#AG_onLoad(function() { $(\'a[href*=\"E-Commerce-Thema-\"]\').closest(\'div[class*=\"articleticker_item_with_picture\"]\').remove(); });");
DEFAULT_SCRIPT_RULES[6].push("videogameszone.de#%#AG_onLoad(function() { $(\'a[href*=\"E-Commerce-Thema-\"]\').closest(\'div[class*=\"articleticker_item_with_picture\"]\').remove(); });");
DEFAULT_SCRIPT_RULES[6].push("videogameszone.de#%#AG_onLoad(function() { $(\'a[href*=\"E-Commerce-Thema-\"]\').closest(\'div[class*=\"number_box\"]\').remove(); });");
DEFAULT_SCRIPT_RULES[6].push("chip.de#%#var originalUserAgent = navigator.userAgent; Object.defineProperty(navigator, \'userAgent\', { get: function() { return originalUserAgent + \' Edge\'; } });");
DEFAULT_SCRIPT_RULES[6].push("pi-news.net#%#AG_onLoad(function() { $(\'a[href=\"\/werben-auf-pi\/\"]\').closest(\'div[class=\"r_pics\"]\').remove(); });");
DEFAULT_SCRIPT_RULES[6].push("pi-news.net#%#AG_onLoad(function() { $(\'a[href=\"\/werben-auf-pi\/\"]\').closest(\'div[class=\"l_pics\"]\').remove(); });");
DEFAULT_SCRIPT_RULES[6].push("pcgameshardware.de#%#AG_onLoad(function() { $(\'a[href*=\"\/E-Commerce\"]\').closest(\'div[class*=\"item noImg\"]\').remove(); });");
DEFAULT_SCRIPT_RULES[6].push("pcgames.de#%#AG_onLoad(function() { $(\'a[href*=\"\/E-Commerce\"]\').closest(\'div[class*=\"item noImg\"]\').remove(); });");
DEFAULT_SCRIPT_RULES[6].push("menshealth.de#%#function google_ad_request_done() {};");
DEFAULT_SCRIPT_RULES[6].push("#%#window.AG_onLoad = function(func) { if (window.addEventListener) { window.addEventListener(\'DOMContentLoaded\', func); } };");
DEFAULT_SCRIPT_RULES[6].push("#%#window.AG_removeElementById = function(id) { var element = document.getElementById(id); if (element && element.parentNode) { element.parentNode.removeChild(element); }};");
DEFAULT_SCRIPT_RULES[6].push("#%#window.AG_removeElementBySelector = function(selector) { if (!document.querySelectorAll) { return; } var nodes = document.querySelectorAll(selector); if (nodes) { for (var i = 0; i < nodes.length; i++) { if (nodes[i] && nodes[i].parentNode) { nodes[i].parentNode.removeChild(nodes[i]); } } } };");
DEFAULT_SCRIPT_RULES[6].push("#%#window.AG_each = function(selector, fn) { if (!document.querySelectorAll) return; var elements = document.querySelectorAll(selector); for (var i = 0; i < elements.length; i++) { fn(elements[i]); }; };");
DEFAULT_SCRIPT_RULES[6].push("#%#var AG_removeParent = function(el, fn) { while (el && el.parentNode) { if (fn(el)) { el.parentNode.removeChild(el); return; } el = el.parentNode; } };");
DEFAULT_SCRIPT_RULES[6].push("motorsport-total.com,donnerwetter.de#%#window.trckd = true;");
DEFAULT_SCRIPT_RULES[6].push("notebookcheck.net,computerbild.de,pcwelt.de,sat1.de,webfail.com,finanzen.net,prosiebenmaxx.de,sat1gold.de,wetter.com,kabeleins.de,prosieben.de,serienjunkies.de,menshealth.de,chip.de,teccentral.de,ransfermarkt.de,transfermarkt.de,wetteronline.de#%#window.uabInject = function() {};");
DEFAULT_SCRIPT_RULES[6].push("focus.de#%#window.uabInject = 1;");
DEFAULT_SCRIPT_RULES[6].push("wetteronline.de,gamona.de,gamepro.de,gta-5-forum.de,gamestar.de,prosieben.de,sat1.de,stern.de,webfail.com,focus.de,finanzen.net,prosiebenmaxx.de,sixx.de,kabeleins.de,sat1gold.de,tvtoday.de,tvspielfilm.de,wetter.com,gamestar.de#%#window.UABPtracked = true;");
DEFAULT_SCRIPT_RULES[6].push("pcwelt.de,prosieben.de,sat1.de,stern.de,webfail.com,focus.de,finanzen.net,prosiebenmaxx.de,sixx.de,kabeleins.de#%#AG_onLoad(function() { window.UABPTrack = function() {}; });");
DEFAULT_SCRIPT_RULES[10] = [];
DEFAULT_SCRIPT_RULES[10].push("yandex.ru,yandex.com,yandex.ua,yandex.kz,yandex.by,beta.yandex.ru,beta.yandex.ua,beta.yandex.by#%#window.__adgEnabled=false;");
DEFAULT_SCRIPT_RULES[10].push("#%#window.AG_onLoad = function(func) { if (window.addEventListener) { window.addEventListener(\'DOMContentLoaded\', func); } };");
DEFAULT_SCRIPT_RULES[10].push("#%#window.AG_removeElementById = function(id) { var element = document.getElementById(id); if (element && element.parentNode) { element.parentNode.removeChild(element); }};");
DEFAULT_SCRIPT_RULES[10].push("#%#window.AG_removeElementBySelector = function(selector) { if (!document.querySelectorAll) { return; } var nodes = document.querySelectorAll(selector); if (nodes) { for (var i = 0; i < nodes.length; i++) { if (nodes[i] && nodes[i].parentNode) { nodes[i].parentNode.removeChild(nodes[i]); } } } };");
DEFAULT_SCRIPT_RULES[10].push("#%#window.AG_each = function(selector, fn) { if (!document.querySelectorAll) return; var elements = document.querySelectorAll(selector); for (var i = 0; i < elements.length; i++) { fn(elements[i]); }; };");
DEFAULT_SCRIPT_RULES[10].push("#%#var AG_removeParent = function(el, fn) { while (el && el.parentNode) { if (fn(el)) { el.parentNode.removeChild(el); return; } el = el.parentNode; } };");
