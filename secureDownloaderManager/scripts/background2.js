!function(){"use strict";chrome.runtime.onMessage.addListener(function(b){console.log("bacListen",b.msg),a[b.msg]&&a[b.msg](b)});var a={"newTab::open":function(a){console.log("bacOnewtab",a.msg),chrome.runtime.sendMessage({msg:"newTab::init",data:appManager.current})}};appManager.load(),portManager.launchAndConnect("ffcpnfjbjfieafbgieclakgpfkmblnhg",function(a){a.onMessage.addListener(function(a,c,d){b[a.msg]&&b[a.msg](a,c,d)});var b={"home::ready":function(a){sidebarManager.watch(a.url)},"home::toggle":function(a,b){var c=b.tab?b.tab.windowId:a.data?a.data.windowId:null;sidebarManager.toggle(c)},"home::openWindow":function(a){console.log("home::openWindow"),sidebarManager.openWindow(a.data?a.data.url:null)},"sidebar::resize":function(a,b){var c=b.tab?b.tab.windowId:a.data?a.data.windowId:null;c&&sidebarManager.resize(c,a.data.size)},"ext::ensureExtension":function(b){extensionManager.ensureExtension(b.data,function(b){a.postMessage({msg:"ext::extensionInstalled",data:b})})},"app::load":function(){appManager.change()},"app::change":function(a){appManager.change(a.data)},"app::ready":function(){appManager.isAppReady=!0,appManager.changeIsReady()},"app::facebook":function(b){facebookManager.checkFb(appManager.current.Name,b.data,function(c){console.log(c);var d,e;"profile"===c.data[0].name?(d=c.data[0].fql_result_set[0],e=c.data[1].fql_result_set):(d=c.data[1].fql_result_set[0],e=c.data[0].fql_result_set),a.postMessage({paramId:b.data,msg:"app::facebook::response",feed:e,profile:d})})},"app::facebook::newsfeed::init":function(b){NewsFeedManager.log("Received app::facebook::newsfeed::init",b);var c=NewsFeedManager.isEnabled(),d="app::facebook::newsfeed::disabled";if(c){var e=NewsFeedManager.checkToken();d=e?"app::facebook::newsfeed::loggedin":"app::facebook::newsfeed::notoken"}a.postMessage({msg:d})},"app::facebook::newsfeed::login":function(b){NewsFeedManager.log("Received app::facebook::newsfeed::login",b),NewsFeedManager.login(function(){a.postMessage({msg:"app::facebook::newsfeed::loggedin"})})},"app::facebook::newsfeed":function(b){NewsFeedManager.log("Received app::facebook::newsfeed",b),NewsFeedManager.getFeed(function(b){NewsFeedManager.log("Facebook news feed received",b),a.postMessage({msg:"app::facebook::newsfeed::response",feed:b})},function(){a.postMessage({msg:"app::facebook::notoken"})})},"app::mailChecker":function(b){mailManager.checkMail(b.data,function(b){a.postMessage({msg:"app::mailChecker::response",data:b})})},"app::twitter":function(b){twitterManager.checkTweet(appManager.current.Name,b.data,function(c){a.postMessage({screenName:b.data,msg:"app::twitter::response",feed:c.feed})})},"app::rss":function(b){rssManager.checkRss(appManager.current.Name,b.data,function(c){a.postMessage({msg:"app::rss::response",url:b.data,feed:c.feed})})},"app::feeds::reset":function(){if(appManager.current)var a=appManager.current.Name;rssManager.destroyRss(a),twitterManager.destroyTweet(a),facebookManager.destroyFacebook(a)},"feed::tracking":function(a){tracking.postEvent(a.vertical,a.data,a.browser)},"sd::init":function(b){sdManager.init(b.data,function(){sdManager.onCompleteDownload.addListener(function(b,c){a.postMessage({msg:b,data:c})}),sdManager.onTabActiveChange.addListener(function(b){a.postMessage({msg:"sd::response::updateTabActive",data:b})}),sdManager.onWhitelistChange.addListener(function(b){a.postMessage({msg:"sd::response::newWhiteList",data:b})}),sdManager.onUpdateDownloads.addListener(function(b){a.postMessage({msg:"sd::response::getDownloads",data:b})}),sdManager.onWhitelistChange.dispatch(sdManager.wlist.secureWhiteList),chrome.tabs.query({active:!0,currentWindow:!0},function(a){a[0]&&sdManager.onTabActiveChange.dispatch(a[0].url)})})},"sd::openFile":function(a){sdManager.openFile(a.data)},"sd::openFolder":function(a){sdManager.openFolder(a.data)},"sd::getdownloads":function(){sdManager.getDownloads()},"sd::removeFile":function(a){sdManager.removeFile(a.data)},"sd::updateWlist":function(a){sdManager.updateWlist(a.data)},"sd::remove":function(){sdManager.isLaunch&&(sdManager.onCompleteDownload.removeListener(),sdManager.onTabActiveChange.removeListener(),sdManager.onWhitelistChange.removeListener(),sdManager.onUpdateDownloads.removeListener(),sdManager.remove())},"yappyz::installExtensions":function(){if(appManager.isBgReady.yappyz){var b=appManager.isBgReady.yappyz;chrome.sienium.installApp(b,{install_url:"http://public.yappyz.com/api/extensions/"+b+"/crx"},function(c){console.log(c),extensionManager.ensureExtension(b,function(){a.postMessage({msg:"app::yappyzReady",data:b})})})}else chrome.sienium.isFirstRun(function(b){if(b){var c="biiphlaemgmnjbiahbjbiiijcbaoccae";chrome.sienium.installApp(c,{install_url:"http://public.yappyz.com/api/extensions/"+c+"/crx"},function(b){console.log(b),extensionManager.ensureExtension(c,function(){a.postMessage({msg:"app::yappyzReady",data:c})})})}})}};a.onDisconnect.addListener(function(){console.log("Port disconnection",a)}),sidebarManager.onEmpty.addListener(function(){chrome.sienium.isFirstRun(function(b){var c;if(b)console.log("out : onEmpty.addListener");else if(console.log("inside : onEmpty.addListener"),appManager.current&&appManager.current.Data&&appManager.current.Data.settings)if(c=JSON.parse(appManager.current.Data.settings).sidebar,"string"==typeof c){var d=JSON.parse(appManager.current.Data.settings).sidebarbg;console.log("inside : "+d),a.postMessage({msg:"home::open",data:d})}else console.log("inside : "+c),a.postMessage({msg:"home::open",data:c})})}),sidebarManager.onAdded.addListener(function(){a.postMessage({msg:"home::close"})}),appManager.onAppChanged.addListener(function(b){function c(){a.postMessage({msg:"app::onChanged",data:d})}if(chrome.sienium.isFirstRun(function(a){if(a){if(appManager.current.Data&&appManager.current.Data.settings)var b=JSON.parse(appManager.current.Data.homepageSettings);b.newtaburl&&(chrome.sienium.setPreferenceValue("homepage_is_newtabpage",!1,function(a){chrome.runtime.lastError||console.log(a)}),chrome.sienium.setPreferenceValue("session.restore_on_startup",4,function(a){chrome.runtime.lastError||console.log(a)}),chrome.sienium.setPreferenceValue("session.startup_urls",[b.newtaburl],function(a){chrome.runtime.lastError||console.log(a)}),appManager.current.Landing=b.newtaburl),chrome.runtime.sendMessage({msg:"newTab::init",data:appManager.current},function(){console.log("sendmessTab");chrome.windows.getCurrent({populate:!0},function(a){console.log(a.tabs[0].id);for(var b=0;b<a.tabs.length;b++)chrome.tabs.update(a.tabs[b].id,{url:"appiance://newtab/"})})})}}),b.online){var d=b.config;if(analytics.trackEvent(d.currentApp.Name,"changeApp"),b.externally?sidebarManager.ensureWindow(c):c(),appManager.current.Data&&appManager.current.Data.settings){var e=JSON.parse(appManager.current.Data.settings).sidebar;"undefined"!=typeof e?(b.firstLaunch&&"true"===e&&(console.log("1"),sidebarManager.open()),("undefined"==typeof e.enable||"true"===e.enable)&&(b.firstLaunch&&appManager.current.Data.settings&&null!==e.open&&"true"==e.open?(console.log("2"),sidebarManager.open()):(console.log("3"),sidebarManager.initHandle()))):(console.log("4"),sidebarManager.initHandle())}else console.log("5"),sidebarManager.initHandle();extensionManager.toggleTheme(d.currentApp,b.firstLaunch),extensionManager.toggleExtensions(d.currentApp),chrome.runtime.sendMessage({msg:"newTab::init",data:appManager.current})}else a.postMessage({msg:"app::offline"});window.addEventListener("offline",function(){a.postMessage({msg:"app::offline"})})})})}(window);