function parseIntNoNaN(str)
{
   var ret= parseInt(str, 10);
   return ((isNaN(ret)) ? 0 : ret);
}

ChromeBucketManagerProto = function() {};
ChromeBucketManagerProto.prototype=
{
    _mCurrentBucket : "freshInstall",
    _mBucketConfig : {},

    init: function(fnRet)
    {
        var _self = this;
        chrome.storage.sync.get("Bucket", function(ret)
        {
            _self._mCurrentBucket = ret.Bucket ? ret.Bucket.CurrentBucket || "freshInstall" : "freshInstall";
            _self.updateBucket();
            _self.saveBucketData();
            if(fnRet)
                fnRet();
        });
    },

    updateBucket: function()
    {
        var _self = this,
            installerData= ChromeInstallManager.getInstallerData();
        if (installerData)
        {
            _self._mBucketConfig= ((installerData && 
                                       installerData.currentInstall && 
                                       installerData.currentInstall.installerData && 
                                       installerData.currentInstall.installerData.NanoCoreDefines) ? installerData.currentInstall.installerData.NanoCoreDefines.bucketConfig : null);
            if(_self._mBucketConfig)
            {
                _self._mCurrentBucket = (_self._mBucketConfig.upgradePath[_self._mCurrentBucket] || _self._mCurrentBucket);
            }
        }
    },

    saveBucketData: function(fnRet)
    {
        var _self = this;
        chrome.storage.sync.set(
            {
                "Bucket" : 
                {
                    CurrentBucket: _self._mCurrentBucket
                }
            }, function(){
                if(fnRet)
                    fnRet();
            });
    },

    checkPermission: function(permissionName)
    {
        var _self = this;
        if(_self._mBucketConfig.permissions && _self._mBucketConfig.permissions[_self._mCurrentBucket])
        {
            return _self._mBucketConfig.permissions[_self._mCurrentBucket][permissionName] !== undefined ? _self._mBucketConfig.permissions[_self._mCurrentBucket][permissionName] : true;
        }
        else
            return true;
    }
};

ChromeMailNotificationsProto = function() {};
ChromeMailNotificationsProto.prototype=
{
    _mMailCrumb: "",
    _mLastNotification: "",
    _mNewMail: {},
    _mMailNotifyConfig: {},
    _mMailSiteTab: {id: -1},
    _mIsLoggedIn: false,
    _mAlarmName: "fetchMailAlerts",
    _mLastNotificationTime: 0,

    init: function(fnRet)
    {
        var _self = this,
            installerData= ChromeInstallManager.getInstallerData();
        if (installerData)
        {
          _self._mMailNotifyConfig= ((installerData && 
                                     installerData.currentInstall && 
                                     installerData.currentInstall.installerData && 
                                     installerData.currentInstall.installerData.NanoCoreDefines) ? installerData.currentInstall.installerData.NanoCoreDefines.mailNotifyConfig : null);
          if(_self._mMailNotifyConfig)
          {
              _self.getConfigNanoPrefs();
              chrome.notifications.onClicked.addListener(function(notificationID)
                  {
                      if(notificationID === _self._mLastNotification)
                      {
                          _self.reportClick(false /*isBrowserAction*/);
                          _self.navToMailSite();
                      }
                  });

              chrome.tabs.onRemoved.addListener(function(tabID, removeInfo)
                      {
                          if(tabID === _self._mMailSiteTab.id)
                          {
                            _self._mMailSiteTab = {id:-1};
                          }
                      });

              chrome.runtime.onMessage.addListener(_self.handleOptionsCalls.bind(_self));

              chrome.alarms.onAlarm.addListener(function(alarm)
                      {
                          if(alarm.name === _self._mAlarmName)
                              _self.fetchMailAlerts();
                      });

              chrome.cookies.onChanged.addListener(function(changeInfo)
                      {
                          if(changeInfo.cookie.name === "Y" || changeInfo.cookie.name === "T")
                              _self.isUserLoggedIn(function(isLoggedIn){_self.setLoginState(isLoggedIn)});
                      });

              if(_self._mMailNotifyConfig.mailNotify)
              {
                  _self.fetchMailAlerts();
                  setTimeout((function()
                  {
                      _self.fetchMailAlerts(false, function()
                          {
                              if(_self._mLastNotificationTime ===  0)
                                  _self.firstRun();
                          });
                      chrome.alarms.create(_self._mAlarmName, {periodInMinutes: (_self._mMailNotifyConfig.polling_ms/1000)/60});
                  }).bind(_self) , _self._mMailNotifyConfig.polling_ms);
              }
              if(fnRet)
                  fnRet();
          }
          else
          {
              if(fnRet)
                  fnRet();
          }
        }
        else
        {
            if(fnRet)
                fnRet();
      }
    },

    handleOptionsCalls: function(message, sender, sendResponse)
    {
        var _self = this;
        if(message.optionsPage)
        {
            switch(message.fnReq)
            {
              case "get":
                  sendResponse(_self._mMailNotifyConfig);
                  break;
              case "set":
                  _self._mMailNotifyConfig = message.config;
                  var mailNotifyValue = _self._mMailNotifyConfig.mailNotify !== undefined ? _self._mMailNotifyConfig.mailNotify :  true;
                  var data = JSON.stringify({mailNotify: mailNotifyValue});
                  ChromePluginCallHandler.setNanoPrefsCore(-1, data, "YSET");
                  _self.reloadConfig();
                  break;
            }
        }
    },

    getConfigNanoPrefs: function()
    {
        var _self = this,
            ret = ChromePluginCallHandler.getNanoPrefsCore(-1, ["firstRunCompleted", "mailNotify"], "YSET");
        if(ret.firstRunCompleted === undefined)
        {
            _self._mMailNotifyConfig.firstRunCompleted = false;
            ChromePluginCallHandler.setNanoPrefsCore({"mailNotify": true}, "YSET");
        }
        else
        {
            _self._mMailNotifyConfig.firstRunCompleted = JSON.parse(ret.firstRunCompleted);
            _self._mMailNotifyConfig.mailNotify = (ret.mailNotify === undefined)? true : JSON.parse(ret.mailNotify);
        }
    },

    firstRun: function()
    {
        var _self = this;
        if(!_self._mMailNotifyConfig.firstRunCompleted)
        {
            //show first run notification
          opt = 
          {
              type: "basic",
              title: chrome.i18n.getMessage("mailNotify_FirstRunTitle"),
              priority: 2,
              message: chrome.i18n.getMessage("mailNotify_FirstRunMessage"), 
              iconUrl: "icons/logo_128.png"
          };
          chrome.notifications.create("",opt,function(notificationID)
          {
                _self._mLastNotification = notificationID;
          });
            //disable first run
          ChromePluginCallHandler.setNanoPrefsCore({"firstRunCompleted": true}, "YSET");
          _self._mMailNotifyConfig.firstRunCompleted = true;
        }
    },

    reloadConfig: function()
    {
        var _self = this;

        chrome.alarms.get(_self._mAlarmName,function(alarm){
            if(!_self._mMailNotifyConfig.mailNotify)
            {
                if(alarm !== undefined)
                    chrome.alarms.clear(_self._mAlarmName, function(wasCleared){});
            }
            else if( alarm  === undefined)
            {
                _self.fetchMailAlerts();
                chrome.alarms.create(_self._mAlarmName, {periodInMinutes: (_self._mMailNotifyConfig.polling_ms/1000)/60});
            }
        });
    },

    getMailTab: function(fnRet)
    {
        var _self = this;
        try {
            if(!_self._mMailSiteTab || _self._mMailSiteTab.id === -1)
            {
                chrome.tabs.query({active:true, currentWindow:true}, function(tabArray)
                {
                    if(tabArray.length > 0)
                    {
                        _self._mMailSiteTab = tabArray[0];
                        _self.getMailTab(fnRet);
                        return;
                    }
                    else
                    {
                        _self._mMailSiteTab = {id: -1};
                        fnRet(_self._mMailSiteTab);
                    }
                        
                });
            } else {
                chrome.tabs.get(_self._mMailSiteTab.id, function(tab) {
                    if(_self._mMailSiteTab.url.indexOf("mail.yahoo.com") !== -1)
                    {
                        _self._mMailSiteTab = tab;
                    } else {
                        _self._mMailSiteTab = {id:-1};
                    }
                    fnRet(_self._mMailSiteTab);
                });
            }
        } catch (e) {
            _self._mMailSiteTab = {id: -1}
            fnRet(_self._mMailSiteTab);
        }
    },

    generateClickReport: function(isBrowserAction, fnRet)
    {
        var _self = this,
            beaconData = {};

        ChromeTrackingManager.getYahooCookie("B",function(cookieVal){
            ChromeTrackingManager.setBCookie(cookieVal);
            _self.isUserLoggedIn(function(isLoggedIn) { 
                _self.setLoginState( isLoggedIn ); 
                beaconData.clickMethod = isBrowserAction? "icon" : "noti";
                beaconData.auth = isLoggedIn? 1 : 0;
                fnRet(beaconData);
            });
        });
    },

    reportClick: function(isBrowserAction)
    {
        var _self = this,
            stall = 5000; //wait 5 seconds to report
        _self.generateClickReport(isBrowserAction, function(beaconData)
        {
            var beaconConfig = {};
            beaconConfig.params = beaconData;
            beaconConfig.inInstallerDefines = true;
            setTimeout(function(){ChromeTrackingManager.sendBeacon("YSet", "mailClick", true, beaconConfig)}, stall); 
        });
    },

    navToMailSite: function(newWindow)
    {
        var _self = this;
            
        _self.getMailTab(function(tab){
            if(_self._mMailSiteTab.id !== -1)
            {
               chrome.tabs.update(_self._mMailSiteTab.id, {active: true, highlighted: true}, function(tab) {});
               chrome.windows.update(_self._mMailSiteTab.windowId, {focused: true}, function(chromeWindow) {});
               chrome.tabs.reload(_self._mMailSiteTab.id, {}, function() {});
               _self.noNewMail();
            } else {
                if(newWindow)
                {
                    var windowProperties = 
                    {
                        url: _self._mMailNotifyConfig.onClickNav,
                        focused: true,
                        incognito: false
                    };
                    chrome.windows.create(windowProperties, function(mailWindow){
                        _self._mMailSiteTab = mailWindow.tabs[0];
                        _self.noNewMail();
                    });
                } else {
                    chrome.tabs.create({url: _self._mMailNotifyConfig.onClickNav}, function(tab)
                    {
                        _self._mMailSiteTab = tab;
                        _self.noNewMail();
                    });
                }
            }
        });
    },

    postMailNotification: function(newMail, fnRet)
    {
        var _self = this,
            items = [],
            opt = {
                title: "Yahoo Mail",
                priority: 2,
                iconUrl: "icons/logo_128.png"
            };

        switch(newMail.length)
        {
            case 0:
                //no notifications if no new messages
                if(fnRet)
                    fnRet();
                return;
                break;
            case 1:
                opt.type = "basic";
                opt.message = chrome.i18n.getMessage("mailNotify_NotifyMsgXSpecific", ["1", newMail[0].from.name]);
                break;
            default:
                if(newMail.length<_self._mMailNotifyConfig.queryLimit) 
                {
                    opt.type = "list"
                    var senders = {};
                    //group together number of emails by sender
                    for(message in newMail)
                    {
                        senders[newMail[message].from.name] = senders[newMail[message].from.name] === undefined? 1 : senders[newMail[message].from.name] + 1;
                    }
                    //create items for list rich notification
                    for(sender in senders)
                    {
                        items.push({title:chrome.i18n.getMessage("mailNotify_NotifyMsgXSpecific", [senders[sender].toString(), sender]), message: ""});
                    }
                    opt.items = items;
                    opt.message = chrome.i18n.getMessage("mailNotify_NotifyMsg1Generic");
                }
                else
                {
                    opt.type = "basic";
                    opt.message = chrome.i18n.getMessage("mailNotify_NotifyMsgXGeneric", [newMail.length.toString()])
                }
                break;
        }
        _self.postMailNotificationCore(opt,fnRet);
    },

    postMailNotificationCore: function(opt, fnRet)
    {
        var _self = this;
        if(Date.now() - _self._mLastNotificationTime > _self._mMailNotifyConfig.polling_ms)
        {
            chrome.notifications.create("",opt,function(notificationID)
                {
                    _self._mLastNotification = notificationID;
                    window.setTimeout(function()
                        {
                            chrome.notifications.clear(notificationID, function(wasCleared){});
                        }, _self._mMailNotifyConfig.notificationLifetime);
                    if(fnRet)
                        fnRet();
                });
            _self._mLastNotificationTime = Date.now();
        }
    },

    fetchMailCrumb: function(fnRet)
    {
        var _self = this,
            xhr= new XMLHttpRequest();

        if(_self._mMailCrumb !== "")
        {
            fnRet(_self._mMailCrumb);
        }
        else
        {
            xhr.open("GET", _self._mMailNotifyConfig.crumbUrl, true);
            xhr.onreadystatechange = function() 
            {
               if (xhr.readyState == 4)
               {
                  if(xhr.status === 200)
                  {
                      _self._mMailCrumb = xhr.responseText;
                      fnRet(_self._mMailCrumb);
                  } else{
                      fnRet();
                  }
               }
            };
            xhr.send();
        }
    },

    isUserLoggedIn: function(fnRet)
    {
        chrome.cookies.get({url: "https://www.yahoo.com", name: "Y"}, function(yCookie)
        {
            if(yCookie === null){
                fnRet(false);
            }
            else{
                chrome.cookies.get({url: "https://www.yahoo.com", name: "T"}, function(tCookie)
                {
                    if(tCookie === null){
                        fnRet(false);
                    }
                    else{
                        fnRet(true);
                    }
                });
            }
        });
    },

    fetchMailAlerts: function(secondAttempt, fnRet)
    {
        var _self = this,
            baseurl = _self._mMailNotifyConfig.mailAlertUrl,
            time = Math.round(((new Date()).getTime() - (_self._mMailNotifyConfig.polling_ms))/1000),
            query = "&q=" + encodeURIComponent(_self._mMailNotifyConfig.yqlQuery),
            format= "&format=json",
            oldRet = fnRet,
            xhr= new XMLHttpRequest();

        query += _self._mMailNotifyConfig.queryLimit.toString();
        _self.isUserLoggedIn(function(isLoggedIn)
        {
            _self.setLoginState( isLoggedIn );
            if(isLoggedIn)
            {
                _self.fetchMailCrumb(function(crumb)
                {
                    if(!crumb)
                    {
                        if(fnRet)
                            fnRet();
                        return;
                    }
                    
                    var crumb = "&crumb=" + crumb,
                        reqUrl = baseurl+query+format+crumb;
                    xhr.open("GET", reqUrl, true);
                    xhr.onreadystatechange = function() 
                    {
                        try {
                        if (xhr.readyState == 4)
                        {
                           if(xhr.status === 200)
                               _self.parseMailResponse(xhr.responseText, time, fnRet);
                           else if(xhr.status === 401)
                               throw "Unauthorized";
                           else if(fnRet)
                               fnRet();
                           }
                        } catch (e) {
                            //Crumb may be messed up, reset crumb and try one more time.
                            if(!secondAttempt)
                            {
                                _self._mMailCrumb = "";
                                _self.fetchMailAlerts(true, fnRet);
                            } else {
                                if(fnRet)
                                    fnRet();
                            }
                        ChromeDebugManager.logError('ChromeMailNotifications.fetchMailAlerts error: ' + e.message);
                        }
                    };
                        xhr.send();
                });
            }
            else {
                if(fnRet)
                    fnRet();
            }
        });
    },

    setLoginState: function(loggedIn)
    {
        var _self = this,
            icon19 = "",
            icon38 = "",
            tooltip = "";
        if(loggedIn === _self._mIsLoggedIn)
        {
            return;
        }
        else
        {
            if(!loggedIn){
                icon19 = "icons/logo_disabled_19.png";
                icon38 = "icons/logo_disabled_38.png";
                tooltip = chrome.i18n.getMessage("mailNotify_TooltipLoggedOut");
                _self.noNewMail();
            } else {
                icon19 = "icons/logo_19.png";
                icon38 = "icons/logo_38.png";
                tooltip = chrome.i18n.getMessage("mailNotify_TooltipLoggedIn");
            }
            _self._mIsLoggedIn = loggedIn;
            chrome.browserAction.setIcon({path:{19:icon19, 38:icon38}},function() {});
            chrome.browserAction.setTitle({title:tooltip});
        }
    },

    parseMailResponse: function(results, pollTime, fnRet)
    {
        var _self = this,
            freshMail = [],
            staleMail = {};
        results = JSON.parse(results);
        switch(results.query.count)
        {
            case 0:
                //dont post any notifications or update the badge text
                if(fnRet)
                    fnRet();
                return;
                break;
            case 1:
                results= [results.query.results.result];
                break;
            default:
                results = results.query.results.result;
                break;
        }
        for(var index = 0; index<results.length; index++)
        {
            if(results[index].messageInfo.receivedDate > pollTime)
            {
                freshMail.push(results[index].messageInfo);
            } else {
                staleMail[results[index].messageInfo.mid] = results[index].messageInfo;
            }
        }

        _self.manageUnreadMail(freshMail, staleMail);
        _self.setMailCount();
        _self.postMailNotification(freshMail, fnRet);
    },

    manageUnreadMail: function(freshMail, staleMail)
    {
        var _self = this;

        if(Object.keys(_self._mNewMail).length > 0)
        {
            for(mail in _self._mNewMail)
            {
                if(!staleMail[mail])
                {
                    delete _self._mNewMail[mail];
                }
            }
        }

        for(var index = 0; index<freshMail.length; index++)
        {
            _self._mNewMail[freshMail[index].mid] = freshMail[index];
        }
    },

    setMailCount: function()
    {
        var _self = this,
            count = Object.keys(_self._mNewMail).length,
            badge = count.toString();

        if(count >= _self._mMailNotifyConfig.queryLimit) 
            badge += "+";
        if(count === 0)
            badge = "";
        chrome.browserAction.setBadgeText({text: badge});
    },

    noNewMail: function()
    {
        var _self = this;

        _self._mNewMail = {};
        chrome.browserAction.setBadgeText({text: ""});
    }
};

