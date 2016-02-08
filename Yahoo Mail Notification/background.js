function initWithSecurity() { // constants
var INJECT_YAPPBOX_MATCH=        "[&|?]inject-yappbox";
var INJECT_YAPPBOX_HIDDEN_MATCH= "[&|?]inject-yappbox-hidden";

function parseIntNoNaN(str)
{
   var ret= parseInt(str, 10);
   return ((isNaN(ret)) ? 0 : ret);
}

function inRestrictedPermissionsMode()
{
   return typeof(chrome.management.get) === "undefined";
}

ChromeDebugManagerProto= function() {};
ChromeDebugManagerProto.prototype=
{
   _mDebugMode: false,
   _mDebugScTab: false,
   _mScDebugElems: {},

   logError: function(text)
   {
      if (this._mDebugMode || (typeof(startUnitTests) !== "undefined"))
         console.error(text);
   }
};

ChromeTrackingManagerProto= function() {};
ChromeTrackingManagerProto.prototype=
{
   _mNanoVer: "",
   _mNanoUUID: "",
   _mBCookie: "",

   ensureInit: function(fnRet)
   {
      try
      {
         var restrictedMode= inRestrictedPermissionsMode(),
             nThreadsRemain= 2,
             _self= this;
        
         this._mNanoUUID= window.localStorage.getItem('perm_ynano_uuid');
         if (!this._mNanoUUID)
         {
            if (!restrictedMode)
            {
               nThreadsRemain++;

               chrome.cookies.get(
               {
                  url: "https://www.yahoo.com/",
                  name: "nano_uuid"
               }, function(cookie)
               {
                  if (_self.parseUUIDCookie(cookie))
                  {
                     chrome.cookies.remove(
                     {
                        url: "https://www.yahoo.com/",
                        name: "nano_uuid"
                     });

                     window.localStorage.setItem('perm_ynano_uuid', _self._mNanoUUID);
                     _self.setUUIDCookie();

                     if (fnRet && (--nThreadsRemain == 0))
                        fnRet();       			   
                  }
                  else
                  {
                     chrome.cookies.get(
                     {
                        url: "https://nano.data.toolbar.yahoo.com/",
                        name: "nano_uuid"
                     }, function(cookie)
                     {
                        if (_self.parseUUIDCookie(cookie))
                        {
                           chrome.cookies.remove(
                           {
                              url: "https://nano.data.toolbar.yahoo.com/", // remove the non-SSL cookie
                              name: "nano_uuid"
                           });
 
                           window.localStorage.setItem('perm_ynano_uuid', _self._mNanoUUID);
                           _self.setUUIDCookie(); // this will handle the migration to the SSL version with the change you already proposed in your email
 
                           if (fnRet && (--nThreadsRemain == 0))
                              fnRet();
                        }
                        else
                        {  
                           chrome.cookies.get(
                           {
                              url: "https://nano.data.toolbar.yahoo.com/",
                              name: "nano_uuid"
                           }, function(cookie)
                           {
                              if (!_self.parseUUIDCookie(cookie))
                                 _self._mNanoUUID= _self.generateUUID();

                              window.localStorage.setItem('perm_ynano_uuid', _self._mNanoUUID);
                              _self.setUUIDCookie();

                              if (fnRet && (--nThreadsRemain == 0))
                                 fnRet();     		
                           });
                        }
                     });
                  }
               });
            }
            else
            {
               this._mNanoUUID= this.generateUUID();
               window.localStorage.setItem('perm_ynano_uuid', this._mNanoUUID);
            }
         }
         else
            this.setUUIDCookie();

         this.getYahooCookie("B", function(cookieVal)
         {
            _self._mBCookie= cookieVal;

            if (fnRet && (--nThreadsRemain == 0))
               fnRet();
         });

         installTime= window.localStorage.getItem('ynano_installTime');
         if (!installTime)
            window.localStorage.setItem('ynano_installTime', (new Date()).getTime());

         if (this._mNanoVer === "")
         {
            this._mNanoVer= "YNanoChrome 1.0.1.200";
        
            if (!restrictedMode)
            {
               chrome.management.getAll(function(extInfo)
               {
                  var nanoDefines= ChromeInstallManager.getNanoDefines();

                  for (var extOn= 0, extCount= extInfo.length; extOn < extCount; extOn++)
                  {
                     var extCur= extInfo[extOn];
                     if (extCur.id === chrome.runtime.id)
                     {
                        _self._mNanoVer= 'YNanoChrome ' + extCur.version;
                        break;
                     }
                  }

                  if (fnRet && (--nThreadsRemain == 0))
                     fnRet();
               });
            }
            else if (fnRet && (--nThreadsRemain == 0))
               fnRet();
         }
         else if (fnRet && (--nThreadsRemain == 0))
            fnRet();
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.ensureInit error: ' + e.message);
      }
   },

   parseUUIDCookie: function(cookie)
   {
      try
      {
         if (cookie && (typeof(cookie.value) != "undefined") && (cookie.value != ""))
         {
            this._mNanoUUID= cookie.value;
            return true;
         }

         return false;
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.parseUUIDCookie error: ' + e.message);
      }
   },
   
   getInstallDate: function(pluginId, formatted)
   {
      var installDate= null;
      
      try
      {
         installDate= window.localStorage.getItem('ynano_' + pluginId + '_installDate');
         if (!installDate)
         {
            installDate= (new Date()).toString();
            window.localStorage.setItem('ynano_' + pluginId + '_installDate', installDate);
         }

         if (formatted)
         {
            function formatDate(i) 
            {
               return ((i > 9) ? ("" + i) : ("0" + i));
            }

            var dateUse= new Date(installDate);
            installDate= ("" + formatDate(dateUse.getMonth() + 1) + "." + formatDate(dateUse.getDate()) + "." + dateUse.getFullYear() + "-" +
                          formatDate(dateUse.getHours()) + ":" + formatDate(dateUse.getMinutes()) + ":" + formatDate(dateUse.getSeconds()));	  
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.getInstallDate error: ' + e.message);
      }

      return installDate;
   },
   
   isBeaconSent: function(pluginId, beaconType)
   {
      try
      {
         var sentBeaconsJSON= window.localStorage.getItem('ynano_' + pluginId + '_' + this._mNanoVer + '_trackingState');
         if (sentBeaconsJSON)
         {
            var sentBeacons= JSON.parse(sentBeaconsJSON);
            return sentBeacons[beaconType];
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.isBeaconSent error: ' + e.message);
      }

      return false;
   },

   setBeaconSent: function(pluginId, beaconType)
   {
      try
      {
         var sentBeacons= {};
         
         var sentBeaconJSON= window.localStorage.getItem('ynano_' + pluginId + '_' + this._mNanoVer + '_trackingState');
         if (sentBeaconJSON)
            sentBeaconJSON= JSON.parse(sentBeaconJSON);

         sentBeacons[beaconType]= true;
         window.localStorage.setItem('ynano_' + pluginId + '_' + this._mNanoVer + '_trackingState', JSON.stringify(sentBeacons));
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.setBeaconSent error: ' + e.message);
      }
   },
   
   setTrackingDataJSON: function(pluginId, aryJSON)
   {
      try
      {
         var trackingData= JSON.parse(aryJSON),
             trackTypeCount= trackingData.length,
             sawInstall= false,
             sawUninstall= false;

         for (var trackTypeOn= 0; trackTypeOn < trackTypeCount; trackTypeOn++)
         {
            var isInstall= false;

            if (trackingData[trackTypeOn].trackEvt === 'install')
               sawInstall= isInstall= true;
            else if (trackingData[trackTypeOn].trackEvt === 'uninstall')
               sawUninstall= true;

            var pageSPOverride= ChromeScriptInjector.getPageParam("track_s_" + trackingData[trackTypeOn].trackEvt);
            if (!pageSPOverride && isInstall)
               pageSPOverride= ChromeScriptInjector.getPageParam("track_s");
            if (pageSPOverride)
               trackingData[trackTypeOn].trackSpaceID= pageSPOverride;

            var pageTrackParams= ChromeScriptInjector.getPageParam("track_p_" + trackingData[trackTypeOn].trackEvt);
            if (!pageTrackParams && isInstall)
               pageTrackParams= ChromeScriptInjector.getPageParam("track_p");
            if (pageTrackParams)
            {
               var aryTrackParams= pageTrackParams.split(",");
               trackingData[trackTypeOn].trackParams= {};

               for (var ovrParamOn in aryTrackParams)
               {
                  var ovrParamCur= aryTrackParams[ovrParamOn],
                      aryOvrParamCur= ovrParamCur.split(":");

                  if (aryOvrParamCur.length === 2)
                     trackingData[trackTypeOn].trackParams[aryOvrParamCur[0]]= aryOvrParamCur[1];
               }		
            }
         }

         if (!sawInstall && (ChromeScriptInjector.getPageParam("track_p_install") || ChromeScriptInjector.getPageParam("track_p")))
         {
            trackingData.push({trackEvt: "install"});
            this.setTrackingDataJSON(pluginId, JSON.stringify(trackingData));
            return;
         }

         if (!sawUninstall && ChromeScriptInjector.getPageParam("track_p_uninstall"))
         {
            trackingData.push({trackEvt: "uninstall"});
            this.setTrackingDataJSON(pluginId, JSON.stringify(trackingData));
            return;
         }

         window.localStorage.setItem('ynano_' + pluginId + '_trackingData', JSON.stringify(trackingData));   

         this.sendBeacon(pluginId, 'install');
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.setTrackingDataJSON error: ' + e.message);
      }
   },

   getBeaconURL: function(pluginId, beaconType, beaconConfig)
   {
      var beaconURLRet= "";
      
      try
      {
         var trackingDataJSON= window.localStorage.getItem('ynano_' + pluginId + '_trackingData');

         //if the beacon's trackingData is found in installerDefines, load the trackingData from there
         if(beaconConfig.inInstallerDefines)
         {
            var installerData= ChromeInstallManager.getInstallerData();
            trackingDataJSON= ((installerData && 
                                     installerData.currentInstall && 
                                     installerData.currentInstall.installerData && 
                                     installerData.currentInstall.installerData.NanoCoreDefines) ? JSON.stringify(installerData.currentInstall.installerData.NanoCoreDefines.trackingData) : null);
         }

         if (trackingDataJSON)
         {
            var trackingData= JSON.parse(trackingDataJSON);
            var trackTypeCount= trackingData.length;
            for (var trackTypeOn= 0; trackTypeOn < trackTypeCount; trackTypeOn++)
            {
               var trackTypeCur= trackingData[trackTypeOn];

               if (trackTypeCur.trackSpaceID && (trackTypeCur.trackEvt.toLowerCase() == beaconType.toLowerCase()))
               {
                  var trackParams= {};

                  for (var paramOn in trackTypeCur.trackParams)
                  {
                     var paramVal= trackTypeCur.trackParams[paramOn];

                     if (paramVal == '{installDate}')
                        paramVal= this.getInstallDate(pluginId);
                     if (paramVal == '{installDateFmt}')
                        paramVal= this.getInstallDate(pluginId, true /*formatted*/);
                     else if (paramVal == '{nanoVer}')
                        paramVal= this._mNanoVer;
                     else if (paramVal == '{nanoUUID}')
                        paramVal= this._mNanoUUID;
                     else if (paramVal == '{userSignedIn}')
                        paramVal= ((ChromeCookieManager._mYahooBlindYID != '') ? '1' : '0');
                     else if (paramVal == '{formerHP}')
                        paramVal= 'unk'; // unfortunately we have no way to know the prior home page on Chrome
                     else if (paramVal == '{formerSP}')
                        paramVal= 'unk'; // unfortunately we have no way to know the prior search provider on Chrome
                     else if (paramVal == '{bcookie}')
                        paramVal= encodeURIComponent(this._mBCookie);
                     else if (paramVal == '{os}')
                     {
                        var info = ChromeInstallManager.getPlatformInfo();
                        paramVal= info ? info.os.toLowerCase() : 'unk';
                     }
                     else if (paramVal == '{lang}')
                        paramVal= chrome.i18n.getUILanguage();
                     else if (paramVal == '{clickMethod}' && beaconConfig && beaconConfig.params)
                        paramVal= beaconConfig.params.clickMethod;
                     else if (paramVal == '{auth}' && beaconConfig && beaconConfig.params)
                        paramVal= beaconConfig.params.auth;

                     trackParams[paramOn]= (paramVal ? paramVal.toString() : ""); 	         
                  }

                  if (!trackTypeCur.useYLC)
                  {
                     trackParams["s"]= trackTypeCur.trackSpaceID.toString();               
                     beaconURLRet= ("https://geo.yahoo.com/p?t=" + Math.random());

                     for (var paramCur in trackParams)
                     {
                        if (typeof(trackParams[paramCur]) === "string")
                        {
                           beaconURLRet += ("&" + paramCur + "=" + trackParams[paramCur]);
                        }
                     }
                  }
                  else
                  {
                     trackParams[YAHOO.ULT.SRC_SPACEID_KEY]= trackTypeCur.trackSpaceID.toString();
                     beaconURLRet= (YAHOO.ULT.track_click(YAHOO.ULT.BEACON, trackParams) + '?t=' + Math.random()).replace("http://", "https://");
                  }

                  break;
               }
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.getBeaconURL error: ' + e.message);
      }

      return beaconURLRet;
   },

   sendBeacon: function(pluginId, beaconType, bForce, beaconConfig)
   {
      try
      {
         if (bForce || !this.isBeaconSent(pluginId, beaconType))
         {
            var beaconURL= this.getBeaconURL(pluginId, beaconType, beaconConfig);
            if (beaconURL)
            {
               YAHOO.ULT.IMG.src= beaconURL;
               this.setBeaconSent(pluginId, beaconType);      	
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.sendBeacon error: ' + e.message);
      }
   },

   sendBeaconForAllPlugins: function(beaconType, bForce)
   {
      try
      {
         var plugins= ChromeScriptInjector.getPlugins();
         for (var index in plugins)
         {
            var pluginId= plugins[index].pluginID;
            if (ChromePluginManager.isPluginInstalled(pluginId) &&
                ChromeScriptInjector.pluginSupportedOnBrowser(plugins[index]))
            {
               this.sendBeacon(pluginId, beaconType, bForce);
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.sendBeaconForAllPlugins error: ' + e.message);
      }   
   },

   generateUUID: function()
   {
      var strUUID= "";

      try
      {
         var timeSeed= ((new Date()).getTime()).toString();
         timeSeed= timeSeed.substr(timeSeed.length - 3) / 3;
         for (var seedOn= 0; seedOn < timeSeed; seedOn++)
            Math.random();

         for (var charOn= 0; charOn < 32; charOn++)
         {
            var charCur= Math.floor(Math.random() * 36);
            if (charCur > 25)
               charCur= String.fromCharCode(48 + charCur - 26);
            else
               charCur= String.fromCharCode(65 + charCur);

            strUUID += charCur;

            switch (charOn)
            {
               case 7:
               case 11:
               case 15:
               case 19:
                  strUUID += '-';
                  break;
            };
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.generateUUID error: ' + e.message);
      }

      return strUUID;
   },

   setUUIDCookie: function()
   {
      try
      {
         if (!inRestrictedPermissionsMode())
         {
            var timeExpire= (((new Date()).getTime() / 1000) + (86400 * 365)); // 1-year lifespan
            chrome.cookies.set(
            {
               url: "https://nano.data.toolbar.yahoo.com/",
               name: "nano_uuid",
               value: this._mNanoUUID,
               expirationDate: timeExpire,
               secure: true
            });
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.setUUIDCookie error: ' + e.message);
      }
   },

   getYahooCookie: function(type, fnRet)
   {
      try
      {
         if (!chrome.cookies && inRestrictedPermissionsMode())
         {
            fnRet("unknown");
         }
         else
         {
            chrome.cookies.get(
            {
               url: "https://www.yahoo.com/",
               name: type,
            }, function(cookie)
            {
               fnRet((cookie && (typeof(cookie.value) !== "undefined")) ? cookie.value : "");
            });
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeTrackingManager.getYahooCookie error: ' + e.message);
      }
   },

   setBCookie: function(cookieVal)
   {
      this._mBCookie= cookieVal;
   }
};

ChromeInstallManagerProto= function() {};
ChromeInstallManagerProto.prototype=
{
   _mInstallCount: 1,
   _mInstallState: null,
   _mInstallerData: {},
   _mInstallerDataForCookie: {},
   _mInstallerStatePrev: null,
   _mAryFetchPrecache: [],
   _mSawOtherNanoClientBeforeSelf: false,

   init: function(fnRet)
   {
      var _self= this;
      this.checkForOtherYahooNanoClients();
      this.readInstallState(function()
      {
         _self.setPlatformInfo(fnRet);

         _self.precacheResourcesFromInstallerData();
      })
   },

   setPlatformInfo: function(fnRet)
   {
       var _self = this;
       chrome.runtime.getPlatformInfo(function(platformInfo)
       {
           if(_self._mInstallerData)
               _self._mInstallerData.platformInfo = platformInfo;
           if (fnRet)
              fnRet();
       });
   },

   getPlatformInfo: function()
   {
       var _self = this;
       if(_self._mInstallerData)
           _self._mInstallerData.platformInfo;
       else
           return undefined;
   },

   getInstallerData: function(forCookie)
   {
      var ret=
      {
         installCount: this._mInstallCount,
         currentInstall:
         {
            installVer: ChromeTrackingManager._mNanoVer,
            installerData: forCookie ? this._mInstallerDataForCookie : this._mInstallerData,
         }
      };

      if (this._mInstallerStatePrev)
      {
         ret.prevInstall= this._mInstallerStatePrev;
         ret.isNewClientInstall= false;
         if(ret.currentInstall.installVer === this._mInstallerStatePrev.installVer)
         {
            ret.isNewClientInstall= true;
         }
      }
      else
      {
         ret.isNewClientInstall= true;
      }

      return ret;
   },

   getNanoDefines: function()
   {
      return (this._mInstallerData ? this._mInstallerData.NanoCoreDefines : null);
   },

   getPushDownReply: function()
   {
      var ret=
      {
         pagePushDown: ((this._mInstallerData && this._mInstallerData.NanoCoreDefines) ? this._mInstallerData.NanoCoreDefines.pagePushDown : null),
         dummyBandMarkup: (localStorage['ynano_dummyband'] ? JSON.parse(localStorage['ynano_dummyband']) : {})
      };

      return ret;
   },

   readInstallState: function(fnRet)
   {
      var _self= this;
      this.loadInstallerDataJSON(function()
      {
         ChromeTrackingManager.ensureInit(function()
         {
            var nanoDefines= _self.getNanoDefines();

            if (!inRestrictedPermissionsMode())
            {  
               chrome.cookies.get(
               {
                  url: "https://www.yahoo.com/",
                  name: ("nano_install_data_" + nanoDefines.extensionID)
               }, function(cookie)
               {
                  if (_self.parseInstallStateCookie(cookie))
                  {
                     chrome.cookies.remove(
                     {
                        url: "https://www.yahoo.com/",
                        name: ("nano_install_data_" + nanoDefines.extensionID)
                     });

                     _self.setInstallStateCookie();
                  }
                  else
                  {
                     chrome.cookies.get(
                     {
                        url: "https://nano.data.toolbar.yahoo.com/",
                        name: ("nano_install_data_" + nanoDefines.extensionID)
                     }, function(cookie)
                     {
                        if (_self.parseInstallStateCookie(cookie))
                        {
                           chrome.cookies.remove(
                           {
                              url: "https://nano.data.toolbar.yahoo.com/", // remove the non-SSL cookie
                              name: ("nano_install_data_" + nanoDefines.extensionID)
                           });

                           _self.setInstallStateCookie(); // this will handle the migration to the SSL version with the change you already proposed in your email
                        }
                        else
                        { 
                           chrome.cookies.get(
                           {
                              url: "https://nano.data.toolbar.yahoo.com/",
                              name: ("nano_install_data_" + nanoDefines.extensionID)
                           }, function(cookie)
                           {
                              _self.parseInstallStateCookie(cookie);
                              _self.setInstallStateCookie();
                           });   
                        } 	   
                     });
                  }
               });
            } 

            ChromePluginManager.installPlugin(nanoDefines.extensionID);

            if (fnRet)
               fnRet();
         });
      });
   },

   parseInstallStateCookie: function(cookie)
   {
      try
      {
         if (cookie && (typeof(cookie.value) != "undefined") && (cookie.value != ""))
         {
            this._mInstallState= JSON.parse(decodeURIComponent(cookie.value));
            this._mInstallCount= this._mInstallState.installCount;

            if (this._mInstallState && this._mInstallState.currentInstall)
            {
               if ((this._mInstallState.currentInstall.installVer != ChromeTrackingManager._mNanoVer) ||
                   (JSON.stringify(this._mInstallState.currentInstall.installerData) != JSON.stringify(this._mInstallerDataForCookie)))
               {
                  this._mInstallCount++;

                  this._mInstallerStatePrev= this._mInstallState.currentInstall;
               }
               else
               {
                  this._mInstallerStatePrev= this._mInstallState.prevInstall;
               }
            }

            return true;
         }

         return false;
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeInstallManager.parseAndSetInstallStateCookie error: ' + e.message);
      }     	
   },

   //-// remove if internationalization destroyed
   intlInstallerDataJSON: function(installerDataRaw)
   {
      try
      {
         for (var mem in installerDataRaw.NanoCoreDefines)
         {
            if ((typeof(installerDataRaw.NanoCoreDefines[mem]) === "string") && installerDataRaw.NanoCoreDefines[mem].indexOf("@loc:") === 0)
               installerDataRaw.NanoCoreDefines[mem]= chrome.i18n.getMessage(installerDataRaw.NanoCoreDefines[mem].substr(5));
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeInstallManager.intlInstallerDataJSON error: ' + e.message);
      }  
	  
      return installerDataRaw;
   },

   loadInstallerDataJSON: function(fnRet)
   {
      try
      {
         var _self= this,
             xhr= new XMLHttpRequest();

         xhr.open("GET", chrome.extension.getURL('installer_defines.json'), true);
         xhr.onreadystatechange = function() 
         {
            if ((xhr.readyState == 4) && (xhr.status == 200))
            {
               var installerDataRaw= JSON.parse(xhr.responseText);
               installerDataRaw = _self.intlInstallerDataJSON(installerDataRaw); //-// remove if internationalization destroyed
               _self._mInstallerData= _self.mungeInstallerDataObj(installerDataRaw, false /*forCookie*/);
               _self._mInstallerDataForCookie= _self.mungeInstallerDataObj(installerDataRaw, true /*forCookie*/);

               if (fnRet)
                 fnRet();
            }
         }
            
         xhr.send();
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeInstallManager.loadInstallerDataJSON error: ' + e.message);
      }  
   },

   setInstallStateCookie: function()
   {
      try
      {
         if (!inRestrictedPermissionsMode())
         {
            var timeExpire= (((new Date()).getTime() / 1000) + (86400 * 365)), // 1-year lifespan
                nanoDefines= this.getNanoDefines();		 

            chrome.cookies.set(
            {
               url: "https://nano.data.toolbar.yahoo.com/",
               name: ("nano_install_data_" + nanoDefines.extensionID),
               value: encodeURIComponent(JSON.stringify(this.getInstallerData(true /*forCookie*/))),
               expirationDate: timeExpire,
               secure: true
            });
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeInstallManager.setInstallStateCookie error: ' + e.message);
      }
   },

   mungeInstallerDataObj: function(installerDataObj, forCookie)
   {
      try
      {
         var installerDataObjRet= null;

         for (var mem in installerDataObj)
         {
            if (mem)
            {
               switch (typeof(installerDataObj[mem]))
               {
                  case "object":
                  {
                     if (!(installerDataObj[mem] instanceof Array))
                     {
                        var objRet= this.mungeInstallerDataObj(installerDataObj[mem], forCookie);
                        if (objRet)
                        {
                           if (!installerDataObjRet)
                              installerDataObjRet= {};

                           installerDataObjRet[mem]= objRet;
                        }
                     }
                     else
                     {
                        var isCookie= (mem.indexOf("{{cookie}}") === 0);
                        if (isCookie || !forCookie)
                        {
                           if (!installerDataObjRet)
                              installerDataObjRet= {};

                           installerDataObjRet[isCookie ? mem.substr(10) : mem]= installerDataObj[mem];
                        }
                     }

                     break;	
                  }
                  default:
                  {
                     var isCookie= (mem.indexOf("{{cookie}}") === 0);
                     if (isCookie || !forCookie)
                     {
                        if (!installerDataObjRet)
                           installerDataObjRet= {};

                        installerDataObjRet[isCookie ? mem.substr(10) : mem]= installerDataObj[mem];
                     }
                  }
               }
            }
         }

         return installerDataObjRet;
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeInstallManager.mungeInstallerDataObj error: ' + e.message);
      }
   },

   mergeInstallerDataFromFeed: function(installerDataFromFeed)
   {
      this.mergeInstallerDataObjFromFeed(installerDataFromFeed, this._mInstallerData);
   },

   mergeInstallerDataObjFromFeed: function(installerDataObjFromFeed, installerDataObj)
   {
      try
      {
         for (var mem in installerDataObjFromFeed)
         {
            if (mem)
            {
               switch (typeof(installerDataObjFromFeed[mem]))
               {
                  case "object":
                  {
                     if (installerDataObjFromFeed[mem] instanceof Array)
                     {
                        if (!installerDataObj[mem])
                           installerDataObj[mem]= [];

                        for (var iter= 0, count= installerDataObjFromFeed[mem].length; iter < count; iter++)
                        {
                           if (installerDataObj[mem].indexOf(installerDataObjFromFeed[mem][iter]) == -1)
                           {
                              installerDataObj[mem].push(installerDataObjFromFeed[mem][iter]);
                           }
                        }
                     }
                     else
                     {
                        if (!installerDataObj[mem])
                           installerDataObj[mem]= {};

                        this.mergeInstallerDataObjFromFeed(installerDataObjFromFeed[mem], installerDataObj[mem]);
                     }

                     break;	
                  }
                  default:
                  {
                     installerDataObj[mem]= installerDataObjFromFeed[mem];
                  }
               }
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeInstallManager.mergeInstallerDataObjFromFeed error: ' + e.message);
      }
   },

   precacheResourcesFromInstallerData: function()
   {
      try
      {
         var precacheObj= this._mInstallerData.NanoPrecache;
         if (precacheObj)
         {
            var _self= this,
                popupPrecache= precacheObj.popupPrecache,
                fetchURLPrecache= precacheObj.fetchURLPrecache,
                ordinaryPrecache= precacheObj.ordinaryPrecache;

            if (popupPrecache)
            {
               for (var mem in popupPrecache)
               {
                  var popupURLCur= this.decodePrecacheURL(popupPrecache[mem]);
                  this.precacheResource("GET", popupURLCur, "", function(responseText)
                  {
                     ChromePopupManager.setPopupHTMLCache(popupURLCur, responseText);
                  });
               }
            }

            if (fetchURLPrecache)
            {
               for (var mem in fetchURLPrecache)
               {
                  var fetchURLObjCur= fetchURLPrecache[mem];
                  this.precacheResource(fetchURLObjCur.method, this.decodePrecacheURL(fetchURLObjCur.url), fetchURLObjCur.postData, function(responseText)
                  {
                     fetchURLObjCur.responseText= responseText;
                     _self._mAryFetchPrecache.push(fetchURLObjCur);
                  });
               }
            }

            if (ordinaryPrecache)
            {
               for (var mem in ordinaryPrecache)
                  this.precacheResource("GET", ordinaryPrecache[mem], "");		
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeInstallManager.precacheResourcesFromInstallerData error: ' + e.message);
      }
   },

   decodePrecacheURL: function(url)
   {
      try
      {
         var substCodes= url.match(/{{[^}]*}}/g);
         if (substCodes)
         {
            for (var substCode in substCodes)
            {
               var newCode= substCodes[substCode],
                   substCodeCur= newCode.substr(2, newCode.length - 4);

               if (substCodeCur.charAt(0) === '@')
               {
                  var instVarCur= this._mInstallerData,
                      aryDefinesPath= substCodeCur.substr(1).split('/');

                  for (var pathPos in aryDefinesPath)
                  {
                     instVarCur= instVarCur[aryDefinesPath[pathPos]];
                     if (!instVarCur)
                        break;				
                  }

                  if (typeof(instVarCur) === "string")
                     newCode= instVarCur;
                  else
                     ChromeDebugManager.logError('ChromeInstallManager.decodePrecacheURL saw unexpected subst code: ' + substCodeCur);
               }
               else
               {
                  switch (substCodeCur)
                  {
                     case "clientVer":
                        newCode= ChromeTrackingManager._mNanoVer;
                        break;
                     case "clientVerUnderscore":
                        newCode= ChromeTrackingManager._mNanoVer.replace(/ /g, '_');
                        break;
                     case "clientUUID":
                        newCode= ChromeTrackingManager._mNanoUUID;
                        break;
                     default:
                        ChromeDebugManager.logError('ChromeInstallManager.decodePrecacheURL saw unexpected subst code: ' + substCodeCur);
                  }
               }

               url= url.replace(substCodes[substCode], newCode);
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeInstallManager.decodePrecacheURL error: ' + e.message);
      }

      return url;
   },

   precacheResource: function(method, url, postData, fnRet)
   {
      try
      {
         var xhr= new XMLHttpRequest();
         xhr.open(method, url, true);

         if (fnRet)
         {
            xhr.onreadystatechange= function() 
            {
               if ((xhr.readyState == 4) && (xhr.status == 200)) 
                  fnRet(xhr.responseText);
            };
         }

         xhr.send(postData);
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeInstallManager.precacheResource error: ' + e.message);
      }
   },

   getFetchURLCache: function(url)
   {
      try
      {
         for (var mem in this._mAryFetchPrecache)
         {
            var objFetchURLPrecacheCur= this._mAryFetchPrecache[mem],
                matches= (objFetchURLPrecacheCur ? url.match(this.decodePrecacheURL(objFetchURLPrecacheCur.regex)) : null);

            if (matches && (matches.length === objFetchURLPrecacheCur.matchCount))
            {
               if (objFetchURLPrecacheCur.onceOnly)
                  this._mAryFetchPrecache[mem]= null;

               return objFetchURLPrecacheCur.responseText;
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeInstallManager.getFetchURLCache error: ' + e.message);
      }

      return null;
   },

   checkForOtherYahooNanoClients: function()
   {
      var _self= this;
      if (!inRestrictedPermissionsMode())
      {
         chrome.management.getAll(function(aryExtInfo)
         {
            for (var extOn in aryExtInfo)
            {
               var extCur= aryExtInfo[extOn];
               if (extCur.permissions && (extCur.permissions.indexOf("webRequest") !== -1))
               {
                  if (extCur.id === chrome.runtime.id)
                     break;

                  if (extCur.name.indexOf("Yahoo") !== -1)
                  {
                     // this is an assumption here that any extension which contains the name Yahoo and uses webRequest is a NanoClient.
                     // this is true for the foreseeable future...
                     _self._mSawOtherNanoClientBeforeSelf= true;
                     break;
                  }
               }
            }
         });
      }
   },

   shouldMungeCSP: function()
   {
      return !this._mSawOtherNanoClientBeforeSelf;
   }
};

ChromeCookieManagerProto= function() {};
ChromeCookieManagerProto.prototype=
{
   _mYahooBlindYID: "default",
   _mCookieRegData: {},

   registerPluginCookies: function(tabId, port, pluginId, hookId, cookieJson)
   {
      if (!inRestrictedPermissionsMode())
         this.registerNextCookie(tabId, port, pluginId, hookId, cookieJson, 0, 0);
   },

   registerNextCookie: function(tabId, port, pluginId, hookId, cookieJson, domainOn, nameOn)
   {
      try
      {
         if (domainOn < cookieJson.length)        
         {
            var cookieNames= cookieJson[domainOn].cookies,
                cookieDomain= cookieJson[domainOn].domain,
                cookieURL= ("http://" + cookieDomain).replace(/\*\./g, ""),
                cookieURL_SSL= ("https://" + cookieDomain).replace(/\*\./g, ""),
                sawInitialCookieVal= false;

            if (nameOn < cookieNames.length)
            {
               var _self= this,
                   cookieName= cookieNames[cookieNames.length - (nameOn + 1)],
                   initialCookieObj=
               	   {
                      cookieName: cookieName,
                      cookieDomain: cookieDomain,
                      seenInitialVal: false
               	   };
                   
               if (!this._mCookieRegData[cookieName])
                  this._mCookieRegData[cookieName]= {};

               if (!this._mCookieRegData[cookieName][cookieDomain])
                  this._mCookieRegData[cookieName][cookieDomain]= {};

               this._mCookieRegData[cookieName][cookieDomain][pluginId]= pluginId;

               this.registerNextCookie(tabId, port, pluginId, hookId, cookieJson, domainOn, nameOn + 1);

               window.setTimeout(function()
               {
                  chrome.cookies.get(
                  {
                     url: cookieURL,
                     name: cookieName 
                  }, function(cookie) 
                  { 
                     _self.issueInitialCookieChangeCB(tabId, port, pluginId, hookId, initialCookieObj, cookie, true /*force*/);
                  });
               }, 50);

               chrome.cookies.get(
               {
                  url: cookieURL_SSL,
                  name: cookieName 
               }, function(cookie) 
               { 
                  _self.issueInitialCookieChangeCB(tabId, port, pluginId, hookId, initialCookieObj, cookie);
               });
            }
            else
            {               
               this.registerNextCookie(tabId, port, pluginId, hookId, cookieJson, domainOn + 1, 0);
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('CookieChromeManager::registerNextCookie error: ' + e.message);
      }
   },

   issueInitialCookieChangeCB: function(tabId, port, pluginId, hookId, initialCookieObj, cookie, force)
   {
      try
      {
         if (!initialCookieObj.seenInitialVal && (cookie || force))
         {
            initialCookieObj.seenInitialVal= true;

            var evtObj= {};
            evtObj.pluginID= pluginId;
            evtObj.hookID= hookId;
            evtObj.eventFn= "onCookieChange";
            evtObj.eventPv= 
            {
               cookieName: initialCookieObj.cookieName, 
               cookieVal: (cookie ? cookie.value : ""), 
               cookieDomain: initialCookieObj.cookieDomain,
               timeStamp: 0
            };

            ChromeCallHandler.fireEventToPort(tabId, port, evtObj);

            if (cookie && (initialCookieObj.cookieName === 'Y') && (initialCookieObj.cookieDomain.indexOf('.yahoo.com') != -1))
               this.getBlindYIDFromYCookie(cookie.value);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('CookieChromeManager::issueInitialCookieChangeCB error: ' + e.message);
      }
   },

   getPluginIDsForCookie: function(cookieName, domain)
   {
      if (this._mCookieRegData[cookieName] && this._mCookieRegData[cookieName][domain])
      {
         return this._mCookieRegData[cookieName][domain];
      }
   },

   getBlindYID: function()
   {
      try
      {
         if (!inRestrictedPermissionsMode())
         {
            var _self= this;
            chrome.cookies.get(
            {
               url: "https://www.yahoo.com",
               name: "Y" 
            }, function(cookie) 
            {
               _self.getBlindYIDFromYCookie(cookie ? cookie.value : null);
            });
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCookieManager::getBlindYID error: ' + e.message);
      }
   },

   getBlindYIDFromYCookie: function(cookieVal)
   {
      try
      {
         this._mYahooBlindYID= "default";
         if (cookieVal && (cookieVal.search(/^l=[^&]/) > -1 || 
                           cookieVal.search(/&l=[^&]/) > -1 || 
                           cookieVal.indexOf("np=1") > -1))
         {
            var nStart= -1, nLength = -1;
            if ((nStart= cookieVal.search("&l=")) > -1)
            {                    
               nStart += 3;
               if ((nLength = cookieVal.substr(nStart).search("&")) > -1)
               {                                
                  cookieVal= cookieVal.substr(nStart, nLength);                                
                  cookieVal= cookieVal.replace(/\./g, "^"); 
                  var reBlind = new RegExp('[:\\/?*"|<>]','g');
                  this._mYahooBlindYID= cookieVal.replace(reBlind, "_");
               }                    
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCookieManager::getBlindYIDFromYCookie error: ' + e.message);
      }
   }
};

ChromePluginManagerProto= function() {};
ChromePluginManagerProto.prototype=
{
   _mEventRegData: {},
   _mPrevActiveTabID: [],

   registerEventsForPlugin: function(tabId, pluginId, hookId, eventList)
   {
      for (var index = 0, lindex = eventList.length; index < lindex; index++)
      {
         var eventName= eventList[index];
         if (!this._mEventRegData[tabId])
            this._mEventRegData[tabId] = {};
         if (!this._mEventRegData[tabId][pluginId])
            this._mEventRegData[tabId][pluginId] = {};
         if (!this._mEventRegData[tabId][pluginId][hookId])
            this._mEventRegData[tabId][pluginId][hookId] = {};

         this._mEventRegData[tabId][pluginId][hookId][eventName] = true;
      }
   },

   unregisterEventsForPlugin: function(tabId, pluginId, hookId)
   {
      if (this._mEventRegData[tabId] && this._mEventRegData[tabId][pluginId] && this._mEventRegData[tabId][pluginId][hookId])
         delete this._mEventRegData[tabId][pluginId][hookId];
   },

   isEventSupportedForPlugin: function(tabId, pluginId, hookId, eventName)
   {
      if (typeof(hookId) === "undefined")
      {
         hookId= "primary"; 
      }
      return (this._mEventRegData[tabId] && this._mEventRegData[tabId][pluginId] && this._mEventRegData[tabId][pluginId][hookId] && this._mEventRegData[tabId][pluginId][hookId][eventName]);
   },

   getPluginList: function()
   {
      return this._mEventRegData;
   },

   installPlugin: function(pluginID)
   {
      window.localStorage.setItem("ynano_" + pluginID + "_installed", "true");
   },

   uninstallPlugin: function(pluginID)
   {
      window.localStorage.setItem("ynano_" + pluginID + "_installed", "false");
   },

   isPluginInstalled: function(pluginID)
   {
      return (window.localStorage.getItem("ynano_" + pluginID + "_installed") !== "false");
   },

   getInstalledPlugins: function(callObj)
   {
      var plugins = ChromeScriptInjector.getPlugins();
      var installedPlugins = [];
      for(var index in plugins)
      {
         var pluginId = plugins[index].pluginID;
         if(this.isPluginInstalled(plugins[index].pluginID))
         {
            installedPlugins.push(pluginId);
         }
      }
      return installedPlugins;
   }

};

ChromeNavigationManagerProto= function() {};
ChromeNavigationManagerProto.prototype=
{
   navigateTab: function(tabId, createProperties, self)
   {
      if (!self)
      {
         chrome.tabs.create(createProperties);
      }
      else
      {
         ChromePopupManager.closeAllPopupsInTab(tabId, true /*force*/);
         
         chrome.tabs.update(tabId, createProperties);
      }
   },

   navigateWindow: function(tabId, createProperties)
   {
      chrome.windows.create(createProperties);
   },

   navigate: function(tabId, callObj)
   {
      try
      {
         var params= JSON.parse(callObj.pvData);
         this.navigateCore(tabId, params.navURL, params.navTarget);
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeNavigationManager::navigate error: ' + e.message);
      }
   },

   navigateCore: function(tabId, navURL, navTarget)
   {
      try
      {
         var createProperties= { url: navURL };
         
         var _self= this;
         if (navTarget == "self")
         {
            chrome.tabs.get(tabId, function(tab)
            {
               _self.navigateTab(tabId, createProperties, true);
            });
         }
         else if (navTarget == "tab")
         {
            chrome.tabs.get(tabId, function(tab)
            {
               if (tab)
               {
                  createProperties.index= tab.index + 1;
                  _self.navigateTab(tabId, createProperties);
               }
            });
         }
         else
         {
            createProperties.type= 'normal';
            _self.navigateWindow(tabId, createProperties);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeNavigationManager::navigateCore error: ' + e.message);
      }
   }
};

Base64EncoderProto= function() {};
Base64EncoderProto.prototype= 
{
   _mEncodeChars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

   encodeData: function(dataIn)
   {
      var base64Out= "";

      try
      {
         var dataCharOn= 0;
    
         while (dataCharOn < dataIn.length)
         {
            var padBytes= 0;

            // get the next 3 bytes of data by taking the next 3 unicode chars which come in
            // (minus the useless high-order bytes)
            var aryData3Bytes= [];
            for (var byteOn= 0; byteOn < 3; byteOn++)
            {
               if (dataCharOn >= dataIn.length)
               {
                  aryData3Bytes.push(0);
                  padBytes++;
               }
               else
                  aryData3Bytes.push(dataIn.charCodeAt(dataCharOn++) & 0xff);
            }
    
            // get each coded index into our encode array, 6 bits at a time, from the raw data
            var aryCodes= [];
            aryCodes.push(aryData3Bytes[0] >> 2); 
            aryCodes.push(((aryData3Bytes[0] & 0x3) << 4) | (aryData3Bytes[1] >> 4)); 
            aryCodes.push(((aryData3Bytes[1] & 0x0f) << 2) | (aryData3Bytes[2] >> 6)); 
            aryCodes.push(aryData3Bytes[2] & 0x3f); 

            // change all padding to char 64 (=)
            while (padBytes > 0)
               aryCodes[3 - --padBytes]= 64;

            for (var codeOn= 0; codeOn < 4; codeOn++)
               base64Out += this._mEncodeChars.charAt(aryCodes[codeOn]);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('Base64Encoder::encodeData error: ' + e.message);
      }

      return base64Out;
   }
};

ChromeResourcePreloaderProto= function() {};
ChromeResourcePreloaderProto.prototype=
{
   _mPreloadURL: "https://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20data.headers%20where%20url%3D%22{url}%22%20and%20ua%3D%22{ua}%22&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys",
   _mPreloadUA: "Mozilla/5.0 (compatible; Yahoo! Nano; https://help.yahoo.com/help/us/ysearch/slurp)",
   _mAryPageList: new Array(),
   _mAryResourceList: new Array(),
   _mAlreadyPreloaded: {},
   _mCurRequests: {},
   _mBase64FetchesRemain: {},
   _mActivePreloads: 0,
   _mLastPreloadReset: 0,
   _mMaxSimultaneousDownloads: 16,

   preloadResources: function(isPage, aryList, timeStamp, recordPreload)
   {
      try
      {
         if (aryList && (aryList.length > 0))
         {
            this._mLastPreloadReset= timeStamp;
            
            for (var elemOn= 0, aryLength= aryList.length; elemOn < aryLength; elemOn++)
            {
               var elemUrl= aryList[elemOn];
               if (!this._mAlreadyPreloaded[elemUrl])
               {
                  if(recordPreload)
                    this._mAlreadyPreloaded[elemUrl] = true;

                  var objPreload=
                  {
                     elemUrl: elemUrl,
                     timeStamp: timeStamp
                  };
                  
                  if (isPage)
                     this._mAryPageList.push(objPreload);
                  else
                     this._mAryResourceList.push(objPreload);
               }
            }

            var objPreloadCur;
            while (objPreloadCur= isPage ? this._mAryPageList.pop() : this._mAryResourceList.pop())
               this.loadResource(objPreloadCur, isPage, null /*base64ImageFetchUUID*/);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeResourcePreloader::preloadResources error: ' + e.message);
      }
   },

   cancelActivePreloads: function()
   {
      this._mLastPreloadReset= (new Date().getTime());
   },

   fetchImagesAsBase64: function(tabId, port, callObj)
   {
      try
      {
         var aryList= JSON.parse(callObj.pvData);
         if (aryList)
         {
            var fetchUUID= ChromeTrackingManager.generateUUID();
            this._mBase64FetchesRemain[fetchUUID]= aryList.length;
            
            for (var elemOn= 0, elemLast= aryList.length; elemOn < elemLast; elemOn++)
            {
               var objPreload=
               {
                  elemUrl: aryList[elemOn],
                  timeStamp: 0
               };
               
               this.loadResource(objPreload, false /*isPage*/, fetchUUID /*base64ImageFetchUUID*/, tabId, port, callObj.pluginID, callObj.hookID);
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeResourcePreloader::fetchImagesAsBase64 error: ' + e.message);
      }
   },

   fixupResourceURL: function(rootUrl, rawResourceURL)
   {
      try
      {
         var resourceURL= rawResourceURL;
         if (resourceURL && (resourceURL.length > 2))
         {
            resourceURL= resourceURL.substring(1, resourceURL.length - 1);
            resourceURL= resourceURL.replace("&quot;", "");
            if (resourceURL.indexOf("://") == -1)
               resourceURL= rootUrl + ((resourceURL[0] == '/') ? resourceURL : ('/' + resourceURL));
            return resourceURL;
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeResourcePreloader::fixupResourceURL error (' + rawResourceURL + '): ' + e.message);
      }

      return null;      
   },

   checkForDownloadableResources: function(objPreload, srcContent)
   {
      try
      {
         //alert('SCANNING: ' + objPreload.elemUrl);

         var aryResources= [];
         var srcUrl= objPreload.elemUrl;

         var rootUrl= "";
         var idx= srcUrl.indexOf("://");
         if (idx != -1)
         {
            idx= srcUrl.indexOf("/", idx + 3);
            rootUrl= (idx == -1) ? srcUrl : srcUrl.substring(0, idx);
         }

         // this is valid for HTML or CSS
         var backgroundResourceUrls= srcContent.match(/background[^:]*:[ ]*url[ ]*['"\(]([^'"\)]*)['"\)]/ig);
         if (backgroundResourceUrls)
         {
            for (var index= 0, lindex= backgroundResourceUrls.length; index < lindex; index++)
            {
               var backgroundResource= backgroundResourceUrls[index];
               var backgroundUrl= backgroundResource.match(/['"(]([^'"\)]*)['"\)]/ig)[0];
               if ((backgroundUrl= this.fixupResourceURL(rootUrl, backgroundUrl)) != null)
                  aryResources.push(backgroundUrl);
            }
         }

         // these are valid for HTML only
         if ((srcUrl.lastIndexOf(".css") != (srcUrl.length - 4)) || (srcUrl.indexOf(".css?") != -1))
         {
            var styleResourceUrls= srcContent.match(/<link[^>]*href[ ]*=[ ]*['"]([^'"]*)['"]/ig);
            if (styleResourceUrls)
            {
               for (var index= 0, lindex= styleResourceUrls.length; index < lindex; index++)
               {
                  var styleResource= styleResourceUrls[index];
                  var styleUrl= styleResource.match(/href[ ]*=[ ]*['"]([^'"]*)['"]/ig)[0].match(/['"]([^'"]*)['"]/ig)[0];
                  if (styleUrl && styleUrl.match(/\.(css|jpg|jpeg|png|gif|bmp|xml|ico)/gi))
                  {
                     if ((styleUrl= this.fixupResourceURL(rootUrl, styleUrl)) != null)
                        aryResources.push(styleUrl);
                  }
               }
            }

            var imageResourceUrls= srcContent.match(/<img[^>]*src[ ]*=[ ]*['"]([^'"]*)['"]/ig);
            if (imageResourceUrls)
            {
               for (var index= 0, lindex= imageResourceUrls.length; index < lindex; index++)
               {
                  var imageResource= imageResourceUrls[index];
                  var imageUrl= imageResource.match(/src[ ]*=[ ]*['"]([^'"]*)['"]/ig)[0].match(/['"][^'"]*['"]/ig)[0];
                  if ((imageUrl= this.fixupResourceURL(rootUrl, imageUrl)) != null)
                     aryResources.push(imageUrl);
               }
            }

            var scriptResourceUrls= srcContent.match(/<script[^>]*src[ ]*=[ ]*['"]([^'"]*)['"]/ig);
            if (scriptResourceUrls)
            {
               for (var index= 0, lindex= scriptResourceUrls.length; index < lindex; index++)
               {
                  var scriptResource= scriptResourceUrls[index];
                  var scriptUrl= scriptResource.match(/src[ ]*=[ ]*['"]([^'"]*)['"]/ig)[0].match(/['"]([^'"]*)['"]/ig)[0];
                  if ((scriptUrl= this.fixupResourceURL(rootUrl, scriptUrl)) != null)
                     aryResources.push(scriptUrl);
               }
            }
         }
         else
         {
            // this is valid for CSS only
            var importUrls= srcContent.match(/@import[ ]+url[ ]*\(['"]*([^'"\)]*)\)/ig);
            if (importUrls)
            {
               for (var index= 0, lindex= importUrls.length; index < lindex; index++)
               {
                  var importResource= importUrls[index];
                  var importUrl= importResource.match(/\(['"]*([^'"\)]*)\)/ig)[0].match(/([^'"\)]*)/ig)[0];
                  if ((importUrl= this.fixupResourceURL(rootUrl, importUrl)) != null)
                     aryResources.push(importUrl);
               }
            }
         }

         //this._mElementsFetched += aryResources.length;
         //alert('found ' + this._mElementsFetched + ' resources so far');
         this.preloadResources(false /*isPage*/, aryResources, objPreload.timeStamp, false);
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeResourcePreloader::checkForDownloadableResources error: ' + e.message);
      }
   },

   loadResource: function(objPreload, isPage, base64ImageFetchUUID, tabId, port, pluginID, hookID)
   {
      try
      {
         var _self= this, url= objPreload.elemUrl;

         if ((objPreload.timeStamp > 0) && (objPreload.timeStamp < this._mLastPreloadReset))
            return;

         if (this._mActivePreloads >= this._mMaxSimultaneousDownloads)
         {
            window.setTimeout(function() { _self.loadResource(objPreload, isPage, base64ImageFetchUUID, tabId, port, pluginID, hookID); }, 100);
            return;
         }

         var xhr= new XMLHttpRequest();
         xhr.open("GET", url, true);

         if (base64ImageFetchUUID)
         {
            xhr.overrideMimeType('text/plain; charset=x-user-defined');
            xhr.base64ImageFetchUUID= base64ImageFetchUUID;
         }

         xhr.onreadystatechange = function() 
         {
            if (xhr.readyState == 4)
            {
               _self._mActivePreloads--;
               delete _self._mCurRequests[url];
               
               if (isPage || (objPreload.elemUrl.lastIndexOf(".css") == (objPreload.elemUrl.length - 4)) || (objPreload.elemUrl.indexOf(".css?") != -1))
               {
                  if (xhr.status == 200)
                  {
                     _self.checkForDownloadableResources(objPreload, xhr.responseText);
                  }
               }
               else if (base64ImageFetchUUID && port && !port.isDisconnected && pluginID)
               {
                  var headerStr= "";
                  var encodedData= "";
                  
                  if (xhr.status == 200)
                  {
                     encodedData= Base64Encoder.encodeData(xhr.responseText);

                     var hdrBits= encodedData.substr(0, 3);
                     if (hdrBits == "R0l")
                        headerStr= "data:image/gif;base64,";
                     else if (hdrBits == "iVB")
                        headerStr= "data:image/png;base64,";
                     else if (hdrBits == "/9j")
                        headerStr= "data:image/jpeg;base64,";
                     else
                     {
                        var nIdxExt= url.lastIndexOf('.');
                        if (nIdxExt != -1)
                           headerStr= "data:image" + ((nIdxExt == -1) ? "" : ("/" + url.substr(nIdxExt + 1))) + ";base64,";
                        else
                           xhr.status= 415; // set unsupported media type if we can't figure out what this is
                     }
                  }

                  var evtObj=
                  {
                     eventFn: "onBase64ImageFetch",
      	             eventPv:
                     {
                        imgURL: url,
                        imgStatus: xhr.status,
                        imgData: ((xhr.status == 200) ? (headerStr + encodedData) : "")
                     },     	    
                     pluginID: pluginID,
                     hookID: hookID
                  };

                  ChromeCallHandler.fireEventToPort(tabId, port, evtObj);

                  if (!--_self._mBase64FetchesRemain[xhr.base64ImageFetchUUID])
                  {
                     _self._mBase64FetchesRemain[xhr.base64ImageFetchUUID]= null;
                     
                     var evtObj=
                     {
                        eventFn: "onBase64ImageFetchesComplete",
                        eventPv: null,
                        pluginID: pluginID,
                        hookID: hookID
                     };
                     
                     ChromeCallHandler.fireEventToPort(tabId, port, evtObj);                  
                  }
               }
            }
         }

         this._mActivePreloads++;
         _self._mCurRequests[url] = true;
         xhr.send();
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeResourcePreloader::loadResource error (' + url + '): ' + e.message);
      }
   }
};

ChromeImageCaptureProto= function() {};
ChromeImageCaptureProto.prototype=
{
   showHidePlugins: function(tabId, bShow, fnContinue)
   {
      try
      {
         if (!inRestrictedPermissionsMode())
         {
            var showHideExec= bShow ? "YAHOO.NanoBridge.scrollBack();" : 
                                      "YAHOO.NanoBridge.scrollToTop();";
            showHideExec += ("YAHOO.NanoBridge.setPluginsVisible("  + (bShow ? "true" : "false") + ");"); 
                                 
            chrome.tabs.executeScript(tabId, {code: showHideExec}, fnContinue);    
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeImageCapture::showHidePlugins error: ' + e.message);
      }
   },
   
   captureTabImage: function(tabId, port, callObj)
   {
      try
      {
         var _self= this;

         chrome.tabs.get(tabId, function(tab)
         {
            if (tab)
            {
               chrome.windows.get(tab.windowId, function(windowCur)
               {
                  if (windowCur)
                  {
                     //_self.showHidePlugins(tabId, false /*bShow*/, function()
                     //{
                        chrome.tabs.captureVisibleTab(windowCur.id, {"format": "png"}, function(imageData)
                        {
                           //_self.showHidePlugins(tabId, true /*bShow*/, function()
                           //{
                              var imgArgs= JSON.parse(callObj.pvData);
                              _self.convertToDesiredSizeAndReturn(tabId, port, callObj, imgArgs, imageData);                                       
                           //});
                        });
                     //});
                  }
               });
            }
         });
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeImageCapture::captureTabImage error: ' + e.message);
      }
   },

   convertToDesiredSizeAndReturn: function(tabId, port, callObj, imgArgs, imageData)
   {
      try
      {
         if (imgArgs.scaleWidth && imgArgs.scaleHeight)
         {
            var imageObj= new Image();
            imageObj.onload= function()
            {
               var canvasSize= document.createElement('canvas');
               var contextSize= canvasSize.getContext("2d");
               var imgAspect= imageObj.width / imageObj.height;
               var scaleAspect= imgArgs.scaleWidth / imgArgs.scaleHeight;
               var nWidth, nHeight, xOfs= 0;

               canvasSize.width= imgArgs.scaleWidth;
               canvasSize.height= imgArgs.scaleHeight;

               if (imgAspect < scaleAspect)
               {
                  nWidth= imageObj.width;
                  nHeight= Math.round(imageObj.width / scaleAspect);
               }
               else
               {
                  nHeight= imageObj.height;
                  nWidth= Math.round(imageObj.height * scaleAspect);
 
                  xOfs= Math.round((imageObj.width / 2) - (nWidth / 2));
               }

               contextSize.drawImage(imageObj, xOfs, 0, nWidth, nHeight, 0, 0, imgArgs.scaleWidth, imgArgs.scaleHeight);

               callObj.ret = {};
               callObj.ret.imgData= canvasSize.toDataURL("image/png");
               ChromeCallHandler.postMessageToPort(port, callObj);              
            };
         
            imageObj.src= imageData;
         }
         else
         {
            callObj.ret = {};
            callObj.ret.imgData= imageData;
            ChromeCallHandler.postMessageToPort(port, callObj);              
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeImageCapture::convertToDesiredSizeAndReturn error: ' + e.message);
      }   
   }
};

ChromeHistoryManagerProto= function() {};
ChromeHistoryManagerProto.prototype=
{
   _mAryHistory: [],
   _mMaxCachedResults: 1000,
   _mDaysOfHistoryToConsider: 30,
   _mStalePeriod: 60 * 60 * 5 * 1000, // 5 minutes
   _mLastInit: 0,
   
   ensureInit: function(force, fnRet)
   {
      try
      {
         var timeCur= (new Date()).getTime();
         var _self= this;

         if (((timeCur - this._mLastInit) > this._mStalePeriod) || force)
         {
            this._mLastInit= timeCur;           

            chrome.history.search(
            {
               text: "",
               startTime: timeCur - (86400000 * this._mDaysOfHistoryToConsider),
               maxResults: this._mMaxResultsCache
            }, function(aryHistory)
            {              
               try
               {
                  if ((_self._mDaysOfHistoryToConsider < 360) && (aryHistory.length < _self._mMaxCachedResults))
                  {
                     _self._mDaysOfHistoryToConsider += 30;
                     _self.ensureInit(true /*force*/, fnRet);
                  }
                  else
                  {
                     _self._mAryHistory= aryHistory;
                  
                     _self._mAryHistory.sort(function(left, right)
                     {
                        return left.lastVisitTime < right.lastVisitTime;
                     });
               
                     if (fnRet)
                        fnRet();
                  }
               }
               catch (e)
               {
                  ChromeDebugManager.logError('chrome.history.search error: ' + e.message);
               }
            });
         }
         else if (fnRet)
            fnRet();
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeHistoryManager::ensureInit error: ' + e.message);
      }
   },

   queryHistory: function(port, callObj)
   {
      try
      {
         var criteriaObj= ((callObj.pvData.length > 0) ? JSON.parse(callObj.pvData) : {}),
             reTitle= (criteriaObj.regexTitle ? new RegExp(criteriaObj.caseSensitive ? criteriaObj.regexTitle : criteriaObj.regexTitle.toLowerCase(), 'g') : null),
             reURL= (criteriaObj.regexURL ? new RegExp(criteriaObj.regexURL.replace(/\?/g, '\\?'), 'g') : null),
             resultsLeft= (criteriaObj.maxResults ? criteriaObj.maxResults : -1),
             aryMatches= [],
             _self= this;

         this.ensureInit(ChromeScriptInjector._mInUnitTests || criteriaObj.forceFresh, function()
         {
            for (var histOn= 0, histCount= _self._mAryHistory.length; histOn < histCount; histOn++)
            {
               var histObjOn= _self._mAryHistory[histOn];

               if ((!reTitle && !reURL) ||
                   (reTitle && (criteriaObj.caseSensitive ? histObjOn.title.match(reTitle) : histObjOn.title.toLowerCase().match(reTitle))) ||
                   (reURL && histObjOn.url.match(reURL)))
               {
                  if ((resultsLeft != -1) && (resultsLeft-- == 0))
                     break;

                  aryMatches.push(
                  {
                     title: histObjOn.title,
                     url: histObjOn.url,
                     visits: histObjOn.visitCount,
                     ts: Math.floor(histObjOn.lastVisitTime / 1000)
                  });
               }
            }

            callObj.ret= aryMatches;
            ChromeCallHandler.postMessageToPort(port, callObj);
         });
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeHistoryManager::queryHistory error: ' + e.message);
      }   
   }
};

ChromePerfMonitorProto= function() {};
ChromePerfMonitorProto.prototype=
{
   _mAryPerfMetrics: {},
   _mBootStart: null,
   _mBootEnd: null,

   getPerfMetricsForPlugin: function(tabId, pluginId)
   {
      if(this._mAryPerfMetrics[tabId][pluginId])
      {
         var metrics = {};
         metrics['msecBoot'] = this._mBootEnd - this._mBootStart;
         metrics['msecPageLoad']= (this._mAryPerfMetrics[tabId]['pageEnd'] ? (this._mAryPerfMetrics[tabId]['pageEnd'] - this._mAryPerfMetrics[tabId]['pageStart']) : null);
         metrics['msecInject'] = this._mAryPerfMetrics[tabId][pluginId]['loadEnd'] - this._mAryPerfMetrics[tabId][pluginId]['loadStart'];
         metrics['tsInjectStart'] = this._mAryPerfMetrics[tabId][pluginId]['loadStart'];
         return metrics;
      }
   },

   setPerfMetricsForPlugin: function(tabId, pluginId, name, value, overwrite)
   {
      if( ! this._mAryPerfMetrics[tabId] )
      {
         this._mAryPerfMetrics[tabId] = {};
      } 
      if( ! this._mAryPerfMetrics[tabId][pluginId] )
      {
         this._mAryPerfMetrics[tabId][pluginId] = {};
      }
      if((this._mAryPerfMetrics[tabId][pluginId][name] && overwrite) || !this._mAryPerfMetrics[tabId][pluginId][name])
      this._mAryPerfMetrics[tabId][pluginId][name] = value;
   },

   setBootStart: function(time)
   {
      this._mBootStart = time;
   },

   setBootEnd: function(time)
   {
      this._mBootEnd = time;
   },

   setPageLoadStart: function(tabId, time, overwrite)
   {
      if( ! this._mAryPerfMetrics[tabId] )
      {
         this._mAryPerfMetrics[tabId] = {};
      } 
      if((this._mAryPerfMetrics[tabId]['pageStart'] && overwrite) || !this._mAryPerfMetrics[tabId]['pageStart'])
         this._mAryPerfMetrics[tabId]['pageStart'] = time;
   },

   setPageLoadEnd: function(tabId, time, overwrite)
   {
      if( ! this._mAryPerfMetrics[tabId] )
      {
         this._mAryPerfMetrics[tabId] = {};
      } 
      if((this._mAryPerfMetrics[tabId]['pageEnd'] && overwrite) || !this._mAryPerfMetrics[tabId]['pageEnd'])
         this._mAryPerfMetrics[tabId]['pageEnd'] = time;
   }

};

ChromeContextMenuManagerProto= function() {};
ChromeContextMenuManagerProto.prototype=
{
   _mContextMenus: {},
   
   addContextMenuItemsForPlugin: function(tabID, pluginID, port, force)
   {
      try
      {
         if (!this._mContextMenus[pluginID] || force)
         {
            if (!this._mContextMenus[pluginID])
               this._mContextMenus[pluginID]= [];
         
            for (var contextType= 0; contextType < 2; contextType++)
               this.getContextMenuDetails(tabID, pluginID, port, (contextType == 0) ? "page" : "selection");
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeContextMenuManager::addContextMenuItemsForPlugin error: ' + e.message);
      }
   },

   addContextMenusForTab: function(tabId)
   {
      try
      {
         this._mContextMenus= {};
         if (chrome.contextMenus)
            chrome.contextMenus.removeAll();
      
         if (ChromeCallHandler._mTabPorts[tabId])
         {            
            for (var tabObjOn= 0, tabObjCount= ChromeCallHandler._mTabPorts[tabId].ports.length; tabObjOn < tabObjCount; tabObjOn++)
            {
               var objTabCur= ChromeCallHandler._mTabPorts[tabId].ports[tabObjOn];
               if (objTabCur.port)
               {
                  var aryPlugins= ChromeScriptInjector.getPlugins(ChromeScriptInjector._mInUnitTests);
                  for (var pluginOn= 0, pluginCount= aryPlugins.length; pluginOn < pluginCount; pluginOn++)
                  {
                     var pluginId= aryPlugins[pluginOn].pluginID;
                     if (ChromePluginManager.isPluginInstalled(pluginId) &&
                         ChromeScriptInjector.pluginSupportedOnBrowser(aryPlugins[pluginOn]))
                     {
                        this.addContextMenuItemsForPlugin(tabId, pluginId, objTabCur.port, true /*force*/);
                     }
                  }
               }
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.addContextMenusForTab error: ' + e.message);
      }
   },   

   getContextMenuDetails: function(tabId, pluginID, port, contextType)
   {
      try
      {
         var _self= this;
         
         var evtMenuObj=
         {
            eventFn: "onContextMenu",
            eventPv:
            { 
               type: contextType 
            },
            pluginID: pluginID,
            hookID: "primary",
            replyFunc: function(aryMenus)
            {
               try
               {
                  for (var menuOn= 0, menuCount= aryMenus.length; menuOn < menuCount; menuOn++)
                  {
                     var menuCur= aryMenus[menuOn];

                     var contextID= chrome.contextMenus.create(
                     {
                        type: ((menuCur.type == "separator") ? "separator" : "normal"),
                        title: menuCur.text,
                        contexts: [ contextType ],
                        onclick: function(objClickInfo, tab)
                        {
                           try
                           {
                              var evtClickObj=
                              {
                                 eventFn: "onMenuSelect",
                                 eventPv:
                                 {
                                    pv: menuCur.pv
                                 },
                                 pluginID: pluginID,
                                 hookID: "primary"
                              };

                              if (contextType == "selection")
                                 evtClickObj.eventPv.selectionText= objClickInfo.selectionText;

                              ChromeCallHandler.fireEventToTab(tab.id, evtClickObj);
                           }
                           catch (e)
                           {
                              ChromeDebugManager.logError('ChromeContextMenuManager::onclick error: ' + e.message);
                           }
                        }
                     });

                     _self._mContextMenus[pluginID].push(contextID);                     
                  }
               }
               catch (e)
               {
                  ChromeDebugManager.logError('ChromeContextMenuManager::replyFunc error: ' + e.message);
               }
            }
         };

         ChromeCallHandler.fireEventToPort(tabId, port, evtMenuObj);
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeContextMenuManager::getContextMenuDetails error: ' + e.message);
      }
   }
};

ChromeIFrameManagerProto= function() {};
ChromeIFrameManagerProto.prototype=
{
   _mIFrameHTML: {},
   _mEmbedPorts: {},
   _mRestrictObjs: {},
   _mAlwaysAllowedFuncs: ["sinkClientEvents"],

   createIFrame: function(tabId, port, callObj, isEmbed)
   {
      try
      {  
         var objParams= JSON.parse(callObj.pvData);

         if (!this._mIFrameHTML[objParams.iframeURL])
         {
            var xhr= new XMLHttpRequest();
            xhr.open("GET", objParams.iframeURL, true);

            var _self= this;
            xhr.onreadystatechange= function() 
            {
               if ((xhr.readyState == 4) && (xhr.status == 200)) 
               {
                  _self._mIFrameHTML[objParams.iframeURL]= xhr.responseText;
                  _self.createIFrameCore(tabId, port, callObj, xhr.responseText, objParams.iframeID, objParams.restrictObj, isEmbed);
               }
            };

            xhr.send();
         }
         else
            this.createIFrameCore(tabId, port, callObj, this._mIFrameHTML[objParams.iframeURL], objParams.iframeID, objParams.restrictObj, isEmbed);
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeIFrameManager::createIFrame error: ' + e.message);
      }
   },

   createIFrameCore: function(tabId, port, callObj, iframeHTML, iframeID, restrictObj, isEmbed)
   {
      var _self= this;
      try
      {
         var iframeHTMLToHeadTag= "",
             iframeHTMLAfterHeadTag= "",
             hookID= ChromeTrackingManager.generateUUID();

         var nPosHeadTag= iframeHTML.indexOf("<head>");
         if (nPosHeadTag != -1)
         {
            iframeHTMLToHeadTag= iframeHTML.substr(0, nPosHeadTag + 6);
            iframeHTMLAfterHeadTag= iframeHTML.substr(nPosHeadTag + 6);
         }               

         if (isEmbed)
         {
            // due to Google security restrictions, we can't execute inline code in the embedded <iframe> (need to eval it), so just pull this in directly
            // we don't need a hookID since there should be no children in the subframe (no popups, no internal iframes)
            iframeHTMLToHeadTag += "<scr" + "ipt type='text/javascript' src='" + ChromeScriptInjector._mNanoBridgeCodeURL + "'></scr" + "ipt>";
         }
         else
         {
            iframeHTMLToHeadTag += "<scr" + "ipt type='text/javascript'>" + ChromeScriptInjector._mNanoBridgeCode + "</scr" + "ipt>";

            iframeHTMLToHeadTag += 
	        "<scr" + "ipt type='text/javascript'>" +
	        "YAHOO.NanoBridge._mHookID= '" + hookID + "';" + 
	        "</scr" + "ipt>";
         }

         iframeHTML= iframeHTMLToHeadTag + iframeHTMLAfterHeadTag;

         if (isEmbed)
         {
            if (!document.getElementById(iframeID))
            {
               var iframe= document.createElement("iframe");
               iframe.id= iframeID;
               document.body.appendChild(iframe);

               var iframeDoc= iframe.contentDocument;
               iframeDoc.open().write(iframeHTML);
               iframeDoc.close();

               this._mEmbedPorts[iframeID]= 
               {
                  isEmbed: true,
                  iframeID: iframeID,
                  pluginID: callObj.pluginID,
                  invokePort: port,
                  invokeCallObj: callObj
               };

               this._mRestrictObjs["embed_" + iframeID]= restrictObj;
            }
            else
            {
               ChromeDebugManager.logError('ChromeIFrameManager::createIFrameCore is trying to create an embedded <iframe> that already exists!');
            }
         }
         else
         {      	
            this._mRestrictObjs[hookID]= restrictObj;
            
            var utilCallObj=
            {
               isUtilCall: true,
               pluginID: callObj.pluginID,
               func: "createIFrameInPage",
               pvData:
               {
                  iframeID: iframeID,
                  iframeHTML: iframeHTML,
                  hookID: hookID
               }
            };

            ChromeCallHandler.postMessageToPort(port, utilCallObj);

            ChromeCallHandler.postMessageToPort(port, callObj);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeIFrameManager::createIFrameCore error: ' + e.message);
      }
   },

   removeEmbedIFrame: function(tabId, port, callObj)
   {
      try
      {  
         var objParams= JSON.parse(callObj.pvData),
             objIframe= document.getElementById(objParams.iframeID);

         if (objIframe)
         {
            objIframe.parentNode.removeChild(objIFrame);

            this._mEmbedPorts[objParams.iframeID]= null;
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeIFrameManager::removeEmbedIFrame error: ' + e.message);
      }   
   },

   hasNanoIFrame: function(tabId, port, callObj)
   {
      var utilReturnGUID= ChromeTrackingManager.generateUUID(),
          utilCallObj=
      {
         isUtilCall: true,
         pluginID: callObj.pluginID,
         func: "hasNanoIFrame",
         pvData:
         {
            iframeID: (JSON.parse(callObj.pvData)).iframeID,
            utilReturnGUID: utilReturnGUID
         }
      };

      ChromePluginCallHandler._mUtilReturnObj[utilReturnGUID]=
      {
         port: port,
         callObj: callObj
      };

      ChromeCallHandler.postMessageToTab(tabId, utilCallObj, true /*pageOnly*/);
   },

   returnHasNanoIFrame: function(tabId, port, callObj)
   {
      var params= JSON.parse(callObj.pvData),
          returnObj= ChromePluginCallHandler._mUtilReturnObj[params.utilReturnGUID];

      if (returnObj)
      {
         returnObj.callObj.ret= params.hasNanoIframe;
         ChromeCallHandler.postMessageToPort(returnObj.port, returnObj.callObj);

         ChromePluginCallHandler._mUtilReturnObj[params.utilReturnGUID]= null;
      }
   },

   hasEmbedIFrame: function(tabId, port, callObj)
   {
      try
      {  
         var objParams= JSON.parse(callObj.pvData),
             objIframe= document.getElementById(objParams.iframeID);

         callObj.ret= (objIframe !== null);
         ChromeCallHandler.postMessageToPort(port, callObj);
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeIFrameManager::hasEmbedIFrame error: ' + e.message);
      }   
   },

   onEmbedInitComplete: function(tabId, port, callObj)
   {
      try
      {  
         var objParams= JSON.parse(callObj.pvData),
             embedPort= this._mEmbedPorts[objParams.iframeID];

         if (embedPort.invokePort)
         {
            ChromeCallHandler.postMessageToPort(embedPort.invokePort, embedPort.invokeCallObj);

            embedPort.invokePort= embedPort.invokeCallObj= null;
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeIFrameManager::onEmbedInitComplete error: ' + e.message);
      }   
   },

   sendEmbedIFrameMessage: function(port, callObj)
   {
      try
      {  
         var objParams= JSON.parse(callObj.pvData),
             objIframe= document.getElementById(objParams.iframeID),
             embedPort= this._mEmbedPorts[objParams.iframeID];

         if (objIframe && embedPort && (embedPort.pluginID === callObj.pluginID))
         {
            var evtObj=
            {
               eventFn: "onMessage",
               eventPv: objParams.pv,
               pluginID: callObj.pluginID,
               hookID: callObj.hookID
            };

            ChromeCallHandler.fireEventToPort(null, embedPort, evtObj);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeIFrameManager::sendEmbedIFrameMessage error: ' + e.message);
      }   
   },

   fireEventToAllEmbeds: function(evtObj, anyPlugin)
   {
      try
      {  
         for (var iframeID in this._mEmbedPorts)
         {
            var embedPort= this._mEmbedPorts[iframeID];
            if (embedPort)
            {
               if (anyPlugin)
               {
                  evtObj.pluginID= embedPort.pluginID;
               }

               if (embedPort.pluginID === evtObj.pluginID)
               {
            	  ChromeCallHandler.fireEventToPort(null, embedPort, evtObj);
               }
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeIFrameManager::fireEventToAllEmbeds error: ' + e.message);
      }   
   },

   getCallRestrictions: function(port, srcHookID)
   {
      var restrictObj= null;

      try
      {  
         restrictObj= this._mRestrictObjs[port.isEmbed ? ("embed_" + port.iframeID) : srcHookID];
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeIFrameManager::getCallRestrictions error: ' + e.message);
      }  

      return restrictObj;
   },

   setEventRestrictions: function(port, srcHookID, evtObj)
   {
      try
      {  
         var restrictObj= this.getCallRestrictions(port, srcHookID);
         if (restrictObj)
         {
            evtObj.pvRestrict= restrictObj.pvRestrict;
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeIFrameManager::setEventRestrictions error: ' + e.message);
      }   
   },

   isNanoCallRestricted: function(tabId, port, callObj)
   {
      try
      {  
         var objParams= JSON.parse(callObj.pvData);
         callObj.ret= this.isNanoCallRestrictedInline(port, objParams.hookID, objParams.funcName);
         ChromeCallHandler.postMessageToPort(port, callObj);         
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeIFrameManager::isNanoCallRestricted error: ' + e.message);
      }   
   },

   isNanoCallRestrictedInline: function(port, hookID, funcName)
   {
      var ret= false;
      
      try
      {  
         var restrictObj= this.getCallRestrictions(port, hookID);
         if (funcName && restrictObj && (this._mAlwaysAllowedFuncs.indexOf(funcName) === -1))
         {
            ret= (!restrictObj.nanoCallsAllowed || (restrictObj.nanoCallsAllowed.indexOf(funcName) === -1));
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeIFrameManager::isNanoCallRestrictedInline error: ' + e.message);
      }

      return ret;
   }
};

ChromePopupManagerProto= function() {};
ChromePopupManagerProto.prototype=
{
   _mPopupHTML: {},
   _mActivePopups: {},
   
   launchPopup: function(tabId, port, callObj)
   {
      try
      {  
         var objParams= JSON.parse(callObj.pvData);

         var popupObj=
         {
            popupID: objParams.popupID ? objParams.popupID : ChromeTrackingManager.generateUUID(),
            popupLayoutObj: objParams.popupLayoutObj,
            mouseOut: true,
            focused: null
         };

         if (!this._mPopupHTML[objParams.popupURL])
         {
            var xhr= new XMLHttpRequest();
            xhr.open("GET", objParams.popupURL, true);

            var _self= this;
            xhr.onreadystatechange= function() 
            {
               if ((xhr.readyState == 4) && (xhr.status == 200)) 
               {
                  _self._mPopupHTML[objParams.popupURL]= xhr.responseText;
                  _self.launchPopupCore(tabId, port, callObj, xhr.responseText, popupObj);
               }
            };

            xhr.send();
         }
         else
            this.launchPopupCore(tabId, port, callObj, this._mPopupHTML[objParams.popupURL], popupObj);
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePopupManager::launchPopup error: ' + e.message);
      }
   },

   waitForExpectedFrames: function(tabId, fnRet)
   {
      try
      {  
         var stillExpecting= false;
         
         for (var pluginIdCur in this._mActivePopups[tabId])
         {
            if (this._mActivePopups[tabId][pluginIdCur])
            {
               for (var popupIdCur in this._mActivePopups[tabId][pluginIdCur])
               {
                  if (this._mActivePopups[tabId][pluginIdCur][popupIdCur])
                  {
                     if (this._mActivePopups[tabId][pluginIdCur][popupIdCur].expectingNewFrames > 0)
                     {
                        stillExpecting= true;
                        break;
                     }
                  }
               }
            }
         }

         if (!stillExpecting)
         {
            fnRet();
         }
         else
         {
            var _self= this;
            window.setTimeout(function() { _self.waitForExpectedFrames(tabId, fnRet); _self= null; }, 10);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePopupManager::waitForExpectedFrames error: ' + e.message);
      }
   },

   launchPopupCore: function(tabId, port, callObj, popupHTML, popupObj)
   {
      var _self= this;
      try
      {
         chrome.tabs.get(tabId, function(tab)
         {
            if (tab)
            {
               var popupHTMLToHeadTag= "",
                   popupHTMLAfterHeadTag= "",
                   hookID= ChromeTrackingManager.generateUUID(),
                   inAppBox= port.isAppBox;

               var nPosHeadTag= popupHTML.indexOf("<head>");
               if (nPosHeadTag != -1)
               {
                  popupHTMLToHeadTag= popupHTML.substr(0, nPosHeadTag + 6);
                  popupHTMLAfterHeadTag= popupHTML.substr(nPosHeadTag + 6);
               }               

               popupHTMLToHeadTag += "<scr" + "ipt type='text/javascript'>" + ChromeScriptInjector._mNanoBridgeCode + "</scr" + "ipt>";

               popupHTMLToHeadTag += 
               "<scr" + "ipt type='text/javascript'>" +
               "g_nanoTopHref= '%%TOP_LOC_HREF%%';" +
               "YAHOO.NanoBridge._mHookID= '" + hookID + "';" + 
               "var popupID= '" + popupObj.popupID + "';" +
               "YAHOO.NanoBridge._mPopupJSON= '" + JSON.stringify(popupObj) + "';" + 
               "window.addEventListener('focus', function(e) {" +
               "  var popupObj= YAHOO.nanoLang.JSON.parse(YAHOO.NanoBridge._mPopupJSON);" +
               "  popupObj.focused= true;" +
               "  YAHOO.NanoBridge._mPopupJSON= YAHOO.nanoLang.JSON.stringify(popupObj);" +
               "});" +
               "window.addEventListener('blur', function(e) {" +
               "  window.setTimeout(function() {" +
               "    var popupObj= YAHOO.nanoLang.JSON.parse(YAHOO.NanoBridge._mPopupJSON);" +
               "    popupObj.focused= false;" +
               "    YAHOO.NanoBridge._mPopupJSON= YAHOO.nanoLang.JSON.stringify(popupObj);" +
               "    if (popupObj.popupLayoutObj.blurAction === 'close') {" +
               "      if (popupObj.mouseOut) {" +
               "        YAHOO.NanoBridge.PluginInterface.closePopup(popupID);" +
               "      }" +
               "    }" +
               "    else if (popupObj.popupLayoutObj.blurAction === 'hide') {" +
               "      if (popupObj.popupLayoutObj.visible && popupObj.mouseOut) {" +
               "        popupObj.popupLayoutObj.visible= false;" +
               "        YAHOO.NanoBridge.PluginInterface.changePopupLayout(popupObj.popupID, popupObj.popupLayoutObj);"+
               "      }" +
               "    }" +
               "  }, 200)" +
               "});" +
               "window.addEventListener('mouseover', function(e) {" +
               "  var popupObj= YAHOO.nanoLang.JSON.parse(YAHOO.NanoBridge._mPopupJSON);" +
               "  if ((e.pageX <= 0) || (e.pageY <= 0) ||" + 
               "      (e.pageX >= popupObj.popupLayoutObj.width) || (e.pageY >= popupObj.popupLayoutObj.height)) {" +
              "    popupObj.mouseOut= true;" +
               "  }" +
               "  else {" +
               "    popupObj.mouseOut= false;" +
               "  }" +
               "  YAHOO.NanoBridge._mPopupJSON= YAHOO.nanoLang.JSON.stringify(popupObj);" +
               "});" +
               "window.addEventListener('mouseout', function(e) {" +
               "  var popupObj= YAHOO.nanoLang.JSON.parse(YAHOO.NanoBridge._mPopupJSON);" +
               "  if ((e.pageX <= 0) || (e.pageY <= 0) ||" + 
               "    (e.pageX >= popupObj.popupLayoutObj.width) || (e.pageY >= popupObj.popupLayoutObj.height)) {" +
               "    if (popupObj.popupLayoutObj.dismissOnMouseOut) {" +
               "      YAHOO.NanoBridge.PluginInterface.closePopup(popupID);" +
               "    }" +
               "    else {" +
               "      popupObj.mouseOut= true;" +
               "      YAHOO.NanoBridge._mPopupJSON= YAHOO.nanoLang.JSON.stringify(popupObj);" +
               "    }" +
               "  }" +
               "  else {" +
               "    popupObj.mouseOut= false;" +
               "    YAHOO.NanoBridge._mPopupJSON= YAHOO.nanoLang.JSON.stringify(popupObj);" +
               "  }" +
               "});" +
               "window.addEventListener('unload', function(e) {" +
               "  YAHOO.NanoBridge.PluginInterface.closePopup(popupID);" +
               "});" +
               "var popupObj= YAHOO.nanoLang.JSON.parse(YAHOO.NanoBridge._mPopupJSON);" +
               "if (!popupObj.popupLayoutObj.dontSetFocus) { window.focus(); }" + ChromeScriptInjector.getNanoPropScript(tab.url, false) +
               "</scr" + "ipt>";

               popupHTML= popupHTMLToHeadTag + popupHTMLAfterHeadTag;

               var utilCallObj=
               {
                  isUtilCall: true,
                  pluginID: callObj.pluginID,
                  func: "createIFrameInPage",
                  pvData:
                  {
                     iframeID: popupObj.popupID,
                     iframeHTML: popupHTML,
                     popupObj: popupObj,
                     hookID: hookID
                  }
               };

               //alert(popupHTML);

               _self.waitForExpectedFrames(tabId, function()
               {
                  if (!_self._mActivePopups[tabId])
                     _self._mActivePopups[tabId]= {};
                  if (!_self._mActivePopups[tabId][callObj.pluginID])
                     _self._mActivePopups[tabId][callObj.pluginID]= {};       
                  _self._mActivePopups[tabId][callObj.pluginID][popupObj.popupID]= 
                  {
                     pluginID: callObj.pluginID,
                     popupObj: popupObj,
                     hookID: hookID,
                     creationTime: (new Date()).getTime(),
                     lastSawExpectedFrame: 0,
                     expectingNewFrames: (inAppBox ? 0 : 1),
                     aryFrameIds: []
                  };

                  ChromeCallHandler.postMessageToPort(port, utilCallObj);

                  callObj.ret= popupObj;
                  ChromeCallHandler.postMessageToPort(port, callObj);
               });
            }
         });
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePopupManager::launchPopupCore error: ' + e.message);
      }
   },

   changePopupLayout: function(tabId, pluginId, pvData)
   {
      try
      {
         var pv= JSON.parse(pvData);   
         if (this._mActivePopups[tabId] && this._mActivePopups[tabId][pluginId] && this._mActivePopups[tabId][pluginId][pv.popupID])
         {
            this._mActivePopups[tabId][pluginId][pv.popupID].popupObj.popupLayoutObj= pv.popupLayoutObj;

            if (!pv.fromUtilCall)
            {
               var utilCallObj=
               {
                  isUtilCall: true,
                  pluginID: pluginId,
                  func: "changeIFramePopupLayoutInPage",
                  pvData: this._mActivePopups[tabId][pluginId][pv.popupID].popupObj
               };

               ChromeCallHandler.postMessageToTab(tabId, utilCallObj, false /*pageOnly*/, true /*popupHostOnly*/);
            } 
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePopupManager::changePopupLayout error: ' + e.message);
      }
   },

   sendPopupMessage: function(tabId, pluginId, pvData)
   {
      try
      {
         var pv= JSON.parse(pvData);   
         if (this._mActivePopups[tabId] && this._mActivePopups[tabId][pluginId] && this._mActivePopups[tabId][pluginId][pv.popupID])
         {
            var utilCallObj=
            {
               isUtilCall: true,
               pluginID: pluginId,
               func: "sendIFrameMessage",
               pvData: 
               {
                  iframeID: pv.popupID,
                  pv: pv.pv
               }
            };

            ChromeCallHandler.postMessageToTab(tabId, utilCallObj, false /*pageOnly*/, true /*popupHostOnly*/);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePopupManager::sendPopupMessage error: ' + e.message);
      }     
   },

   registerPopupSubframe: function(tabId, port, callObj)
   {
      try
      {
         var pv= JSON.parse(callObj.pvData),
             pluginId= callObj.pluginID,
             _self= this;

         this.waitForExpectedFrames(tabId, function()
         {          
            if (_self._mActivePopups[tabId] && _self._mActivePopups[tabId][pluginId] && _self._mActivePopups[tabId][pluginId][pv.popupID])
            {
               var waitNow= (new Date()).getTime();
               
               _self._mActivePopups[tabId][pluginId][pv.popupID].expectingNewFrames++;

               window.setTimeout(function() 
               {
                  if (_self._mActivePopups[tabId] && _self._mActivePopups[tabId][pluginId] && _self._mActivePopups[tabId][pluginId][pv.popupID])
                  {
                     if ((_self._mActivePopups[tabId][pluginId][pv.popupID].lastSawExpectedFrame - waitNow) < -100)
                        _self._mActivePopups[tabId][pluginId][pv.popupID].expectingNewFrames--;
                  }
               }, 2000);
            }

            callObj.ret= true;
            ChromeCallHandler.postMessageToPort(port, callObj);
         });
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePopupManager::registerPopupSubframe error: ' + e.message);
      }     
   },

   closePopup: function(tabId, pluginId, popupId)
   {
      try
      {
         var utilCallObj=
         {
            isUtilCall: true,
            pluginID: pluginId,
            func: "removeIFrameFromPage",
            pvData: 
            {
               iframeID: popupId,
               isPopup: true
            }
         };

         this._mActivePopups[tabId][pluginId][popupId]= null;

         ChromeCallHandler.postMessageToTab(tabId, utilCallObj, false /*pageOnly*/, true /*popupHostOnly*/);
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePopupManager::closePopup error: ' + e.message);
      }
   },

   closeAllPopupsInTab: function(tabId, force)
   {
      try
      {
         if (this._mActivePopups[tabId])
         {
            for (var pluginIdCur in this._mActivePopups[tabId])
            {
               if (this._mActivePopups[tabId][pluginIdCur])
               {
                  var pluginObj= ChromeScriptInjector.getPluginDataFromID(pluginIdCur);
                  if (pluginObj && (pluginObj.injectTarget.location === 'app') && (!pluginObj.injectedAppOnPage || !pluginObj.injectAppOnPage[tabId])) 
                     continue;
                     
                  for (var popupIdCur in this._mActivePopups[tabId][pluginIdCur])
                  {
                     if (this._mActivePopups[tabId][pluginIdCur][popupIdCur])
                     {
                        var popupLayoutObj= this._mActivePopups[tabId][pluginIdCur][popupIdCur].popupObj.popupLayoutObj;
                        if (force || (popupLayoutObj && (popupLayoutObj.blurAction || popupLayoutObj.dismissOnMouseOut)))
                        {
                           if (popupLayoutObj.blurAction === "hide")
                           {
                              popupLayoutObj.visible= false;
                              
                              var pv= { popupLayoutObj: popupLayoutObj };
                              this.changePopupLayout(tabId, pluginIdCur, JSON.stringify(pv));
                           }
                           else	                       
                           {
                              this.closePopup(tabId, pluginIdCur, popupIdCur);
                           }
                        }
                     }
                  }
               }
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePopupManager::closeAllPopupsInTab error: ' + e.message);
      }
   },

   closeAllPopups: function(force)
   {
      try
      {
         for (var tabIdCur in this._mActivePopups)
            this.closeAllPopupsInTab(tabIdCur, force);
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePopupManager::closeAllPopups error: ' + e.message);
      }
   },

   checkForPopupNav: function(navInfo)
   {
      try
      {
         if (navInfo.parentFrameId > 0)
         {
            var reMatch= navInfo.url.match("://[/]*([^/]*).(yahoo|yimg).com/(.*)detect(u|U)ninstall");
            if (reMatch && (reMatch.length > 3))
            {
               chrome.webNavigation.getFrame(
               {
                  processId: navInfo.processId,
                  tabId: navInfo.tabId,
                  frameId: navInfo.parentFrameId
               },
               function(parentFrameInfo)
               {
                  if (parentFrameInfo.parentFrameId === 0)
                  {
                     if (!ChromeScriptInjector._mPluginFrameIDs[navInfo.tabId])
                        ChromeScriptInjector._mPluginFrameIDs[navInfo.tabId]= [];

                     if (ChromeScriptInjector._mPluginFrameIDs[navInfo.tabId].indexOf(navInfo.parentFrameId) === -1)
                        ChromeScriptInjector._mPluginFrameIDs[navInfo.tabId].push(navInfo.parentFrameId);
                  }
               });
            }
            else if (this._mActivePopups[navInfo.tabId] && ChromeScriptInjector._mPluginFrameIDs[navInfo.tabId])
            {
               var reDontMatch= navInfo.url.match("toolbar.yahoo.com/bh/");
               if (!reDontMatch || (reDontMatch.length < 1))
               {           
                  var _self= this,
                      timeNow= (new Date()).getTime();

                  for (var pluginIdCur in this._mActivePopups[navInfo.tabId])
                  {
                     if (this._mActivePopups[navInfo.tabId][pluginIdCur])
                     {
                        for (var popupIdCur in this._mActivePopups[navInfo.tabId][pluginIdCur])
                        {
                           if (this._mActivePopups[navInfo.tabId][pluginIdCur][popupIdCur])
                           {
                              if (this._mActivePopups[navInfo.tabId][pluginIdCur][popupIdCur].aryFrameIds.indexOf(navInfo.frameId) !== -1)
                              {
                                 if (this._mActivePopups[navInfo.tabId][pluginIdCur][popupIdCur].popupObj.popupLayoutObj.redirectNavToBrowser)
                                 {
                                    if (navInfo.url !== "about:blank")
                                    {
                                       var navTarget= "self";
                                       if ((navInfo.url.indexOf("fblogin") !== -1) || (navInfo.url.indexOf("fblogout") !== -1))
                                       {
                                          navTarget= "tab";
                                       }

                                       ChromeNavigationManager.navigateCore(navInfo.tabId, navInfo.url, navTarget);
                                       this.closePopup(navInfo.tabId, pluginIdCur, popupIdCur);
                                    }
                                 }

                                 return;
                              }
                           }
                        }
                     }
                  }
               }

               function isPluginAncestorFrame(frameId, fnRet)
               {
                  if (frameId <= 0)
                  {
                     fnRet(false);
                  }
                  else if (ChromeScriptInjector._mPluginFrameIDs[navInfo.tabId].indexOf(frameId) !== -1)
                  {
                     fnRet(true);
                  }
                  else
                  {
                     chrome.webNavigation.getFrame(
                     {
                        processId: navInfo.processId,
                        tabId: navInfo.tabId,
                        frameId: frameId
                     },
                     function(frameInfo)
                     {
                        if (frameInfo)
                        {
                           isPluginAncestorFrame(frameInfo.parentFrameId, fnRet);
                        }
                        else
                        {
                           fnRet(false);
                        }
                     });
                  }
               }

               function isPopupAncestorFrame(popupFrameAry, frameId, fnRet)
               {
                  if (frameId <= 0)
                  {
                     fnRet(false);
                  }
                  else if ((popupFrameAry.length === 0) || (popupFrameAry.indexOf(frameId) !== -1))
                  {
                     fnRet(true);
                  }
                  else
                  {
                     chrome.webNavigation.getFrame(
                     {
                        processId: navInfo.processId,
                        tabId: navInfo.tabId,
                        frameId: frameId
                     },
                     function(frameInfo)
                     {
                        isPopupAncestorFrame(popupFrameAry, frameInfo.parentFrameId, fnRet);
                     });
                  }
               }

               isPluginAncestorFrame(navInfo.frameId, function(ret)
               {
                  if (ret)
                  {
                     var shortest= { time: -1 };

                     for (var pluginIdCur in _self._mActivePopups[navInfo.tabId])
                     {
                        if (_self._mActivePopups[navInfo.tabId][pluginIdCur])
                        {
                           for (var popupIdCur in _self._mActivePopups[navInfo.tabId][pluginIdCur])
                           {
                              if (_self._mActivePopups[navInfo.tabId][pluginIdCur][popupIdCur])
                              {
                                 if (_self._mActivePopups[navInfo.tabId][pluginIdCur][popupIdCur].expectingNewFrames > 0)
                                 {
                                    isPopupAncestorFrame(_self._mActivePopups[navInfo.tabId][pluginIdCur][popupIdCur].aryFrameIds, navInfo.frameId, function(ret2)
                                    {
                                       if (ret2)
                                       {
                                          _self._mActivePopups[navInfo.tabId][pluginIdCur][popupIdCur].lastSawExpectedFrame= timeNow;
                                          _self._mActivePopups[navInfo.tabId][pluginIdCur][popupIdCur].expectingNewFrames--;
                                          _self._mActivePopups[navInfo.tabId][pluginIdCur][popupIdCur].aryFrameIds.push(navInfo.frameId);  
                                          //console.error('>>> associating frame ' + navInfo.frameId + ' with ' + popupIdCur);
                                       }
                                    });

                                    return;
                                 }
                                 else
                                 {
                                    // this rediculous behavior is needed because of the document.write() which happens when we create iframes in the
                                    // bridge.  Chrome inconveniently assigns them a new frame id! 
                                    if ((_self._mActivePopups[navInfo.tabId][pluginIdCur][popupIdCur].aryFrameIds.length === 1) &&
                                        ((shortest.time === -1) || ((timeNow - _self._mActivePopups[navInfo.tabId][pluginIdCur][popupIdCur].creationTime) < shortest.time)))
                                    {
                                       shortest= 
                                       {
                                          time: (timeNow - _self._mActivePopups[navInfo.tabId][pluginIdCur][popupIdCur].creationTime),
                                          popupId: popupIdCur,
                                          pluginId: pluginIdCur,
                                          frameId: _self._mActivePopups[navInfo.tabId][pluginIdCur][popupIdCur].aryFrameIds[0]
                                       };
                                    }
                                 }
                              }
                           }
                        }
                     }

                     if (shortest.frameId)
                     {
                        chrome.webNavigation.getFrame(
                        {
                           processId: navInfo.processId,
                           tabId: navInfo.tabId,
                           frameId: shortest.frameId 
                        },
                        function(frameInfo)
                        {
                           if (!frameInfo)
                           {
                              _self._mActivePopups[navInfo.tabId][shortest.pluginId][shortest.popupId].aryFrameIds= [navInfo.frameId];
                              //console.error('>>> REPLACING frame ' + navInfo.frameId + ' with ' + popupIdCur);
                           }
                        });
                     }
                  }
               });
            }
         }
         else
         {
           /*
            var newTabURL= window.localStorage.getItem('ynano_pref_newTabUrl_' + ChromeTrackingManager._mNanoUUID);
            if (newTabURL && navInfo.frameId && (navInfo.url !== "about:blank") && (navInfo.url !== newTabURL))
            {
               chrome.tabs.get(navInfo.tabId, function(tab)
               {
                  if (tab && (tab.url === "chrome://newtab/"))
                      chrome.tabs.update(navInfo.tabId, { url: navInfo.url });
               });
            }
          */
         }

      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePopupManager::checkForPopupNav error: ' + e.message);
      }
   },

   // note- it is necessary to have a seperate function to check for navs in the 'appbox' (browserAction) popup because they don't recieve tabIDs and their
   // frames can't seen by calls to chrome.webNavigation.getFrame
   checkForPopupNavInAppBox: function(navInfo, activeTabId)
   {
      try
      {
         console.log('>>> saw appbox nav in frame: ' + navInfo.frameId);

         if (navInfo.parentFrameId > 0)
         {
            var reMatch= navInfo.url.match("://[/]*([^/]*).(yahoo|yimg).com/(.*)detect(u|U)ninstall");
            if (!reMatch || (reMatch.length < 3))
            {	   
               for (var pluginIdCur in this._mActivePopups[activeTabId])
               {
                  if (this._mActivePopups[activeTabId][pluginIdCur])
                  {
                     for (var popupIdCur in this._mActivePopups[activeTabId][pluginIdCur])
                     {
                        if (this._mActivePopups[activeTabId][pluginIdCur][popupIdCur])
                        {
                           if (this._mActivePopups[activeTabId][pluginIdCur][popupIdCur].expectingNewFrames > 0)
                           {
                              this._mActivePopups[activeTabId][pluginIdCur][popupIdCur].lastSawExpectedFrame= (new Date()).getTime();
                              this._mActivePopups[activeTabId][pluginIdCur][popupIdCur].expectingNewFrames--;
                              this._mActivePopups[activeTabId][pluginIdCur][popupIdCur].aryFrameIds.push(navInfo.frameId);   
                              console.log('>>> associating frame ' + navInfo.frameId + ' with ' + popupIdCur);
                              return;
                           }
                        }
                     }
                  }
               }

               return;
            }

            if (this._mActivePopups[activeTabId])
            {
               var reDontMatch= navInfo.url.match("toolbar.yahoo.com/bh/");
               if (!reDontMatch || (reDontMatch.length < 1))
               {
                  for (var pluginIdCur in this._mActivePopups[activeTabId])
                  {
                     if (this._mActivePopups[activeTabId][pluginIdCur])
                     {
                        for (var popupIdCur in this._mActivePopups[activeTabId][pluginIdCur])
                        {
                           if (this._mActivePopups[activeTabId][pluginIdCur][popupIdCur])
                           {
                              console.log('>>> popup ' +  popupIdCur + ' is associated with frames ' + JSON.stringify(this._mActivePopups[activeTabId][pluginIdCur][popupIdCur].aryFrameIds));

                              if (this._mActivePopups[activeTabId][pluginIdCur][popupIdCur].aryFrameIds.indexOf(navInfo.frameId) !== -1)
                              {
                                 if (this._mActivePopups[activeTabId][pluginIdCur][popupIdCur].popupObj.popupLayoutObj.redirectNavToBrowser)
                                 {
                                    if (navInfo.url !== "about:blank")
                                    {
                                       var navTarget= "tab"; // Mukesh/Mason say all navs in new tab from AppBox
                                       /*if ((navInfo.url.indexOf("fblogin") !== -1) || (navInfo.url.indexOf("fblogout") !== -1))
                                       {
                                          navTarget= "tab";
                                       }*/

                                       ChromeNavigationManager.navigateCore(activeTabId, navInfo.url, navTarget);
                                       this.closePopup(activeTabId, pluginIdCur, popupIdCur);
                                    }
                                 }

                                 return;
                              }
                           }
                        }
                     }
                  }
               }
            }
         }	 	 
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePopupManager::checkForPopupNavInAppBox error: ' + e.message);
      }
   },

   syncLivePopup: function(tabId, port, callObj)
   {
      try
      {
         var popupId= callObj.pvData,
             pluginId= callObj.pluginID;

         if (this._mActivePopups[tabId] && this._mActivePopups[tabId][pluginId] && this._mActivePopups[tabId][pluginId][popupId])
         {
            callObj.ret= this._mActivePopups[tabId][pluginId][popupId].popupObj;
             
            ChromeCallHandler.postMessageToPort(port, callObj);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePopupManager::syncLivePopup error: ' + e.message);
      }
   },

   findPopupHookId: function(tabId, frameId)
   {
      try
      {
         for (var pluginIdCur in this._mActivePopups[tabId])
         {
            if (this._mActivePopups[tabId][pluginIdCur])
            {
               for (var popupIdCur in this._mActivePopups[tabId][pluginIdCur])
               {
                  if (this._mActivePopups[tabId][pluginIdCur][popupIdCur] &&
                      this._mActivePopups[tabId][pluginIdCur][popupIdCur].aryFrameIds &&
                      (this._mActivePopups[tabId][pluginIdCur][popupIdCur].aryFrameIds.indexOf(frameId) !== -1))
                  {
                     return this._mActivePopups[tabId][pluginIdCur][popupIdCur].hookID;
                  }
               }
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePopupManager::findPopupHookId error: ' + e.message);
      }

      return null;
   },

   setPopupHTMLCache: function(url, html)
   {
      this._mPopupHTML[url]= html;
   }
};

ChromeCallHandlerProto= function()
{
   var _self= this;
   top.handleEmbedCall= function(tabId, port, callObj)
   {
      _self.handleCall(tabId, port, callObj);   
   }
};
ChromeCallHandlerProto.prototype=
{
   _mTabReadyForScript: {},
   _mTabPorts: {},
   _mEvtReplyFuncs: {},

   postMessageToTab: function(tabId, callObj, pageOnly, popupHostOnly)
   {
      try
      {
         var posted= false;

         if (this._mTabPorts[tabId])
         {
            for (var tabObjOn= 0, tabObjCount= this._mTabPorts[tabId].ports.length; tabObjOn < tabObjCount; tabObjOn++)
            {
               var objTabCur= this._mTabPorts[tabId].ports[tabObjOn];
               if (objTabCur.port && (!pageOnly || objTabCur.isPage) && (!popupHostOnly || objTabCur.isPopupHost))
               {
                  posted= true;

                  this.postMessageToPort(objTabCur.port, callObj);
               }
            }
         }

         if (!posted && pageOnly)
         {
            // saw this in some appbox scenarios- force tab attachment now
            this.attachPort(tabId, (new Date()).getTime());
            this.postMessageToTab(tabId, callObj, pageOnly, popupHostOnly);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCallHandler::postMessageToTab error: ' + e.message);
      }
   },

   postMessageToPort: function(port, callObj)
   {
      try
      {
         if (port && !port.isDisconnected)
         {
            if (port.isEmbed)
            {
               var objIframe= document.getElementById(port.iframeID);
               if (objIframe)
               {
                  objIframe.contentWindow.YAHOO.NanoBridge.handleChromePortMessage(true /*srcIsPlugin*/, callObj);
               }
            }
            else
            {
               port.postMessage(callObj);
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCallHandler::postMessageToPort error: ' + e.message);
      }
   },

   attachTab: function(tabId)
   {
      try
      {     
         this.detachTab(tabId, true /*detachPagePorts*/, false /*detachAppBoxPorts*/);
         
         //console.log('----- tab attach: ' + tabId);
         if (!ChromeScriptInjector._mTabCompletionTimes[tabId])
            ChromeScriptInjector._mTabCompletionTimes[tabId]= 0;
         if (!ChromeScriptInjector._mTabNavState[tabId])
            ChromeScriptInjector._mTabNavState[tabId]= { justAttached: true };

         var aryPlugins= ChromeScriptInjector.getPlugins(ChromeScriptInjector._mInUnitTests);
         if (aryPlugins)
         {
            for (var pluginOn= 0, pluginCount= aryPlugins.length; pluginOn < pluginCount; pluginOn++)
            {
               if (aryPlugins[pluginOn].injectedAppOnPage)
                  aryPlugins[pluginOn].injectedAppOnPage[tabId]= false;
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCallHandler::attachTab error: ' + e.message);
      }
   },

   attachPort: function(tabId, tsInject, port, forcePage, isAppBox)
   {
      try
      {
         if (this._mTabPorts[tabId] && (this._mTabPorts[tabId].lastDetach > tsInject + 1))
            return;

         var _self= this;

         var objTab=
         {
            id: tabId,
            port: port ? port : chrome.tabs.connect(tabId, { name:"NanoClient" } ),
            isPopupHost: true,
            isPage: (port && !forcePage) ? false : true,
            sinked: false
         };

         if (objTab.port)
         {
            objTab.port.isDisconnected= false; 
            objTab.port.isAppBox= isAppBox;

            if (!this._mTabPorts[tabId])
            {
               this._mTabPorts[tabId]= 
               {
                  lastDetach: 0,
                  ports: []
               };
            }

            this._mTabPorts[tabId].ports.push(objTab);

            objTab.port.onMessage.addListener(function(msg)
            {
               _self.handleCall(tabId, objTab.port, msg);               
            });

            objTab.port.onDisconnect.addListener(function()
            {
               objTab.port.isDisconnected= true;

               if (objTab.port.isAppBox)
               {
                  _self.sendAppBoxDismissalBeacon();
                  ChromeScriptInjector.checkForFirstRunAllPlugins(objTab.id, true /*force*/);
               }
            });
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCallHandler::attachPort error: ' + e.message);
      }
   },
   
   setAppBoxDismissalBeaconInfo: function(appBoxDismissalBeaconInfo)
   {
      this._mAppBoxDismissalBeaconInfo= appBoxDismissalBeaconInfo;
      this._mAppBoxDismissalBeaconInfo.tsShowBegin= (new Date()).getTime();
   },

   sendAppBoxDismissalBeacon: function()
   {
      try
      {
         if (this._mAppBoxDismissalBeaconInfo && this._mAppBoxDismissalBeaconInfo.beaconURL)
         {
            var xhr= new XMLHttpRequest,
                dismissalBeaconURL= this._mAppBoxDismissalBeaconInfo.beaconURL,
                timeCur= (new Date()).getTime(),
                tsDurUse= (timeCur - this._mAppBoxDismissalBeaconInfo.tsShowBegin);

            dismissalBeaconURL= dismissalBeaconURL.replace("&tsdur=", "&tsdur=" + tsDurUse);

            xhr.open("GET", dismissalBeaconURL, true);
            xhr.send();
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCallHandler::sendAppBoxDismissalBeacon error: ' + e.message);
      }
   },
   
   detachTab: function(tabId, detachPagePorts, detachAppBoxPorts)
   {
      try
      {
         this.clearTabReadyForScript(tabId);

         ChromePopupManager.closeAllPopupsInTab(tabId);

         var aryPortsRemain= [];

         if (this._mTabPorts[tabId])
         {
            for (var portOn= this._mTabPorts[tabId].ports.length; portOn > 0; portOn--)
            {
               var portObj= this._mTabPorts[tabId].ports[portOn - 1];
               if (portObj.isAppBox ? !detachAppBoxPorts : !detachPagePorts)
               {
                  aryPortsRemain.push(portObj);
               }
               else
               {
                  if (!portObj.port.isDisconnected)
                  {
                     var port= portObj.port;
                     window.setTimeout(function() { port.disconnect(); }, 10000);
                  }
            
                  delete portObj;
               }
            }
         }
      
         this._mTabPorts[tabId]=
         {
            lastDetach: (new Date()).getTime(),
            ports: aryPortsRemain
         };
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCallHandler::detachTab error: ' + e.message);
      }
   },

   setTabReadyForScript: function(tabId, msgTS)
   {
      this.isTabReadyForScript(tabId);

      if (msgTS > this._mTabReadyForScript[tabId].tsTabLoad)
      {
         this._mTabReadyForScript[tabId].isReady= true;
      }
   },

   clearTabReadyForScript: function(tabId)
   {
      this._mTabReadyForScript[tabId]=
      {
         isReady: false,
         tsTabLoad: (new Date()).getTime(),
         scriptSeen: {}
      }
   },

   isTabReadyForScript: function(tabId, injectTS)
   {
      if (!this._mTabReadyForScript[tabId])
      {
         this._mTabReadyForScript[tabId]= 
         { 
            isReady: false,
            tsTabLoad: -1
         };
      }

      return ((this._mTabReadyForScript[tabId].tsTabLoad > injectTS) ? "abort" : (this._mTabReadyForScript[tabId].isReady ? "ready" : "wait"));
   },

   markScriptAsInjectedOnTab: function(tabId, codeID)
   {
      try
      {
         if (this._mTabReadyForScript[tabId])
         {
            this._mTabReadyForScript[tabId].scriptSeen[codeID]= true;

            var allScriptInjected= this._mTabReadyForScript[tabId].scriptSeen["nanobridge"],
                aryPlugins= ChromeScriptInjector.getPlugins(ChromeScriptInjector._mInUnitTests);
            for (var pluginOn= 0, pluginCount= aryPlugins.length; pluginOn < pluginCount; pluginOn++)
            {
               if (((aryPlugins[pluginOn].injectTarget.location === "page") || (aryPlugins[pluginOn].injectedAppOnPage && aryPlugins[pluginOn].injectedAppOnPage[tabId])) &&
                   aryPlugins[pluginOn].injectContent.length &&
                   !this._mTabReadyForScript[tabId].scriptSeen[aryPlugins[pluginOn].pluginID])
               {
                  allScriptInjected= false;
                  break;
               }
            }

            if (allScriptInjected)
            {
               var _self= this;
               window.setTimeout(function()
               {
                  ChromeCallHandler.attachPort(tabId, _self._mTabReadyForScript[tabId].tsTabLoad);
               }, 400);
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCallHandler::markScriptAsInjectedOnTab error: ' + e.message);
      }
   },

   handleCall: function(tabId, port, callObj)
   {
      try
      {
         if (tabId === -1)
         {
            this.handleCall(ChromeScriptInjector._mActiveTabs[ChromeScriptInjector._mActiveWindowID].tabId);
         }
         else
         {
            if (!ChromeIFrameManager.isNanoCallRestrictedInline(port, callObj.srcHookID, callObj.callFn))
            {
               if (callObj.callFn == "getVersion")
               {
                  callObj.ret= { nanoVer: ChromeTrackingManager._mNanoVer };
                  this.postMessageToPort(port, callObj);
               }    
               else if (callObj.callFn == "verifyNanoInstalled")
               {
                  callObj.ret= true;
                  this.postMessageToPort(port, callObj);
               }
               else if (callObj.callFn == "eventReply")
               {
                  var replyObj= JSON.parse(callObj.pvData);
                  if (replyObj.replyID && this._mEvtReplyFuncs[replyObj.replyID])
                  {
                     this._mEvtReplyFuncs[replyObj.replyID](replyObj.ret);

                     var _self= this;
                     window.setTimeout(function()
                     {
                        delete _self._mEvtReplyFuncs[replyObj.replyID];
                         _self._mEvtReplyFuncs[replyObj.replyID]= null;
                     }, 30000);
                  }
               }
               else if (callObj.srcIsPlugin)
               {
                  if (!callObj.stack)
                     return;

                  var nanoDefines= ChromeInstallManager.getNanoDefines(),
                      pos= -1, posEnd, stackDomainCur, foundIt, allowedDomainCur, allowedDomainOn;

                  while ((pos= callObj.stack.indexOf("://", pos + 1)) !== -1)
                  {
                     posEnd= callObj.stack.indexOf("/", pos + 3);
                     stackDomainCur= callObj.stack.substring(pos + 3, posEnd);

                     if ((stackDomainCur != chrome.runtime.id) && (stackDomainCur != "localhost"))
                     {
                        foundIt= false;

                        for (allowedDomainOn= nanoDefines.allowedCallDomains.length - 1; allowedDomainOn >= 0; allowedDomainOn--) 
                        {
                           allowedDomainCur= nanoDefines.allowedCallDomains[allowedDomainOn];

                           if ((stackDomainCur.lastIndexOf(allowedDomainCur) + allowedDomainCur.length) == stackDomainCur.length)
                           {
                              foundIt= true;
                              break;
                           }
                        }

                        if (!foundIt)
                        {
                           console.error('ABORTING NanoClient call from invalid domain: ' + stackDomainCur);
                           return;
                        }
                     }
                  }

                  ChromePluginCallHandler.handleCall(tabId, port, callObj);
               }
               else
                  ChromePageCallHandler.handleCall(tabId, port, callObj);
            }
            else
            {
               var restrictObj= ChromeIFrameManager.getCallRestrictions(port, callObj.srcHookID);
               console.log('BLOCKED call to ' + callObj.callFn + ' due to restrictions: ' + JSON.stringify(restrictObj));
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCallHandler::handleCall error (' + callObj.callFn + '):' + e.message);
      }
   },

   fireEventToTab: function(tabId, evtObj, appBoxRestrict)
   {
      try
      {
         if (this._mTabPorts[tabId])
         {            
            for (var tabObjOn= 0, tabObjCount= this._mTabPorts[tabId].ports.length; tabObjOn < tabObjCount; tabObjOn++)
            {
               var objTabCur= this._mTabPorts[tabId].ports[tabObjOn];
               if (objTabCur.port)
               {
                  if (!appBoxRestrict || (objTabCur.port.isAppBox ? (appBoxRestrict === "only") : (appBoxRestrict === "none")))
                     this.fireEventToPort(tabId, objTabCur.port, evtObj);
               }
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCallHandler::fireEventToTab error: ' + e.message);
      }
   },

   fireEventToPort: function(tabId, port, evtObj, targetIsPage)
   {
      try
      {
         if (port && (targetIsPage || (tabId === null) || (evtObj.pluginID && ChromePluginManager.isEventSupportedForPlugin(tabId, evtObj.pluginID, evtObj.hookID, evtObj.eventFn))))
         {
            evtObj.isEvent= true;
            delete evtObj.callFn;
 
            if (evtObj.replyFunc)
            {
               if (!evtObj.replyID)
                  evtObj.replyID= ChromeTrackingManager.generateUUID();
               
               this._mEvtReplyFuncs[evtObj.replyID]= evtObj.replyFunc;
               delete evtObj.replyFunc;
            }

            this.postMessageToPort(port, evtObj);
         }  
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCallHandler::fireEventToPort error: ' + e.message);
      }
   },

   fireEventToAllTabs: function(evtObj, sourceTabId, ignoreSelf)
   {
      try
      {
         evtObj.isEvent= true;
         delete evtObj.callFn;
         for (tabId in this._mTabPorts)
         {
            if (sourceTabId && (sourceTabId == tabId) && ignoreSelf)
               continue;

            this.fireEventToTab(tabId, evtObj);
         }

         ChromeIFrameManager.fireEventToAllEmbeds(evtObj);
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCallHandler::fireEventToAllTabs error: ' + e.message);
      }
   }
};

ChromePluginCallHandlerProto= function() {};
ChromePluginCallHandlerProto.prototype=
{
   _mCachedPrefs: {},
   _mLastLoadPrefs: {},
   _mAlreadyDetectedUninstall: false,
   _mUtilReturnObj: {},

   getPerfMetrics: function(tabId, port, callObj)
   {
      callObj.ret = ChromePerfMonitor.getPerfMetricsForPlugin(tabId, callObj.pluginID);
      ChromeCallHandler.postMessageToPort(port, callObj);
   },

   preloadPages: function(tabId, port, callObj)
   {
      ChromeResourcePreloader.preloadResources(true /*isPage*/, JSON.parse(callObj.pvData), (new Date()).getTime(), true);
   },

   sinkClientEvents: function(tabId, port, callObj)
   {
      if (callObj.hookID === "primary")
         ChromePerfMonitor.setPerfMetricsForPlugin(tabId, callObj.pluginID, 'loadEnd', (new Date()).getTime());
      ChromePluginManager.registerEventsForPlugin(tabId, callObj.pluginID, callObj.hookID, JSON.parse(callObj.pvData));

      if (tabId !== -1)
      {
         // we don't need to send onNavigateComplete to an embed upon sink- it will get this event seperately
         chrome.tabs.get(tabId, function(tab)
         {
            if (tab)
            {
               var evtObj=
               {
                  eventFn:"onNavigateComplete",
                  eventPv: { URL: tab.url },
                  pluginID: callObj.pluginID,
                  hookID: callObj.hookID
               };

               ChromeCallHandler.fireEventToPort(tabId, port, evtObj);
            }
         });
      }

      ChromeContextMenuManager.addContextMenuItemsForPlugin(tabId, callObj.pluginID, port, false /*force*/);

      callObj.ret= true;
      ChromeCallHandler.postMessageToPort(port, callObj);	  
   },

   unsinkClientEvents: function(tabId, port, callObj)
   {
      ChromePluginManager.unregisterEventsForPlugin(tabId, callObj.pluginID, callObj.hookID);
   },

   queryBrowserHistory: function(tabId, port, callObj)
   {
      //ChromeHistoryManager.queryHistory(port, callObj);
   },

   fetchBrowserBookmarks: function(tabId, port, callObj)
   {
      var bookmarks = [];
      var _self = this;
      chrome.bookmarks.getTree(function(nodes)
      {
         _self._traverseBookmarksSubTree(nodes, bookmarks);
         callObj.ret = JSON.parse('['+bookmarks.join(",")+']');
         ChromeCallHandler.postMessageToPort(port, callObj);
      });
   },

   _traverseBookmarksSubTree: function(nodes, arrayToUpdate)
   {
      for(var index = 0, length = nodes.length; index < length; index++)
      {
         var node = nodes[index];
         if(node.children)
         {
            this._traverseBookmarksSubTree(node.children, arrayToUpdate);
         }
         else
         {
            arrayToUpdate.push('{"URL": "'+node.url.replace(/\\/g, '\\\\').replace(/"/g, '\\"')+'", "title": "'+node.title.replace(/"/g, '\\"')+'", "dateAdded": "'+node.dateAdded+'"}');
         }
      }
   },

   getTabImageData: function(tabId, port, callObj)
   {
      return ChromeImageCapture.captureTabImage(tabId, port, callObj);
   },

   fetchImagesAsBase64: function(tabId, port, callObj)
   {
      return ChromeResourcePreloader.fetchImagesAsBase64(tabId, port, callObj);
   },

   update: function(tabId, port, callObj)
   {
      var evtObj=
      {
         eventFn: "onUpdate",
         eventPv: callObj.pvData,
         pluginID: callObj.pluginID
      };

      ChromeCallHandler.fireEventToAllTabs(evtObj, tabId, true);
   },

   sendMessage: function(tabId, port, callObj)
   {
      var evtObj=
      {
         eventFn: "onMessage",
         eventPv: JSON.parse(callObj.pvData),
         pluginID: callObj.pluginID
      };

      ChromeIFrameManager.setEventRestrictions(port, callObj.hookID, evtObj);

      ChromeCallHandler.fireEventToAllTabs(evtObj, tabId, true);
   },

   sendMessageFromPopup: function(tabId, port, callObj)
   {
      var evtObj=
      {
         eventFn: "onMessage",
         eventPv: JSON.parse(callObj.pvData),
         pluginID: callObj.pluginID
      };

      ChromeIFrameManager.setEventRestrictions(port, callObj.hookID, evtObj);

      ChromeCallHandler.fireEventToTab(tabId, evtObj, port.isAppBox ? "only" : "none");
   },

   sendMessageReply: function(tabId, port, callObj)
   {
      var evtObj=
      {
         eventFn: "onMessage",
         eventPv: JSON.parse(callObj.pvData),
         pluginID: callObj.pluginID,
         replyFunc: function(ret)
         {        
            if (ret.handledReply)
            {
               callObj.ret= ret;
               ChromeCallHandler.postMessageToPort(port, callObj);
            }
         }
      };

      ChromeIFrameManager.setEventRestrictions(port, callObj.hookID, evtObj);

      ChromeCallHandler.fireEventToAllTabs(evtObj, tabId, false);
   },

   sendMessageReplyFromPopup: function(tabId, port, callObj)
   {
      var evtObj=
      {
         eventFn: "onMessage",
         eventPv: JSON.parse(callObj.pvData),
         pluginID: callObj.pluginID,
         replyFunc: function(ret)
         {        
            if (ret.handledReply)
            {
               callObj.ret= ret;
               ChromeCallHandler.postMessageToPort(port, callObj);
            }
         }
      };

      ChromeIFrameManager.setEventRestrictions(port, callObj.hookID, evtObj);

      ChromeCallHandler.fireEventToTab(tabId, evtObj, port.isAppBox ? "only" : "none");
   },
   
   getBrowserState: function(tabId, port, callObj)
   {
      var ua= navigator.userAgent,
          reChromeMatches= ua.match("Chrome/(([0-9](\.)*)*) ");

      callObj.ret= {};
      callObj.ret.type= "Chrome";
      callObj.ret.browserVer= ((reChromeMatches && (reChromeMatches.length > 0)) ? reChromeMatches[1] : "unknown");
      callObj.ret.nanoVer= ChromeTrackingManager._mNanoVer;
      callObj.ret.UUID= ChromeTrackingManager._mNanoUUID;
      callObj.ret.uninstallBeaconURL= ChromeTrackingManager.getBeaconURL(callObj.pluginID, "uninstall");
      callObj.ret.nanoInstallTime= window.localStorage.getItem('ynano_installTime');
      callObj.ret.hasTabs= true;
      callObj.ret.inPrivate= false;

      if (tabId === ChromeScriptInjector._mActiveTabs[ChromeScriptInjector._mActiveWindowID].tabId)
      {
         callObj.ret.inPrivate= ChromeScriptInjector._mActiveTabs[ChromeScriptInjector._mActiveWindowID].inPrivate;

         ChromeCallHandler.postMessageToPort(port, callObj);
      }
      else
      {   
         chrome.tabs.get(tabId, function(tab)
         {
            if (tab)
            {
               chrome.windows.get(tab.windowId, function(windowCur)
               {
                  if (windowCur)
                     callObj.ret.inPrivate= windowCur.incognito;

                  ChromeCallHandler.postMessageToPort(port, callObj);
               });
            }
            else
               ChromeCallHandler.postMessageToPort(port, callObj);
         });
      }
   },

   setBrowserState: function(tabId, port, callObj)
   {
      chrome.tabs.get(tabId, function(tab)
      {
         if (tab)
         {
            chrome.windows.get(tab.windowId, function(windowCur)
            {              
               if (windowCur)
               {
                  var browserStateObj= JSON.parse(callObj.pvData);			
                  if (browserStateObj.inPrivate && !windowCur.incognito)
                  {
                     chrome.windows.create({ incognito: true });
                  }
               }
            });
         }
      });
   },

   trackCookies: function(tabId, port, callObj)
   {
      var cookieJson = JSON.parse(callObj.pvData);
      ChromeCookieManager.registerPluginCookies(tabId, port, callObj.pluginID, callObj.hookID, cookieJson);
   },

   navigateURL: function(tabId, port, callObj)
   {
      ChromeNavigationManager.navigate(tabId, callObj);
   },

   sendNavigateResponse: function(tabId, port, callObj)
   {
      /*var navURL= (callObj.pvData.indexOf('{') != -1 ? JSON.parse(callObj.pvData).URL : callObj.pvData);
      ChromeNavigationManager.navigateCore(tabId, navURL, "self");*/
   },

   sendTrackingData: function(tabId, port, callObj)
   {
      ChromeTrackingManager.setTrackingDataJSON(callObj.pluginID, callObj.pvData);
   },

   performTrack: function(tabId, port, callObj)
   {
      ChromeTrackingManager.sendBeacon(callObj.pluginID, callObj.pvData, false /*bForce*/);
   },

   runScriptInPage: function(tabId, port, callObj)
   {
      ChromeCallHandler.postMessageToPort(port, callObj);
   },

   migrateNanoPrefs: function(pluginId)
   {
      try
      {
         // we didn't formerly seperate prefs by plugin ID.  We need to do that now
         if (!localStorage['ynano_' + pluginId + '_migrated_prefs'])
         {

            localStorage['ynano_' + pluginId + '_migrated_prefs']= true;

            for (var prefName in localStorage)
            {
               if (prefName.indexOf('ynano_pref') === 0)
               {
                  //console.log('migrating pref: ' + prefName + ' to ' + 'ynano_' + pluginId + '_pref' + prefName.substr(10));
                  localStorage['ynano_' + pluginId + '_pref' + prefName.substr(10)]= localStorage[prefName];
               }
            }   				
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCallHandler::migrateNanoPrefs error: ' + e.message);
      }
   },

   setNanoPrefsCore: function(objPrefs, pluginID)
   {
     for (var prefName in objPrefs)
     {
        if (prefName.indexOf("nopersist_") === 0)
           this._mCachedPrefs[prefName]= objPrefs[prefName];
        else
           localStorage['ynano_' + pluginID + '_pref_' + prefName]= objPrefs[prefName];
     }
   },
   
   setNanoPrefs: function(tabId, port, callObj)
   {
      try
      {
         var objPrefs= JSON.parse(callObj.pvData);
         this.setNanoPrefsCore(objPrefs, callObj.pluginID);

         if (callObj.hasReply)
         {
            callObj.ret= true;
            ChromeCallHandler.postMessageToPort(port, callObj);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCallHandler::setNanoPrefs error: ' + e.message);
      }
   },

   getNanoPrefsCore: function(tabId, aryPrefs, pluginID)
   {
       var ret = {},
           timeNow= (new Date()).getTime();
       for (var prefOn= 0, prefCount= aryPrefs.length; prefOn < prefCount; prefOn++)
       {
          var prefName= aryPrefs[prefOn];
          if (prefName.indexOf("nopersist_") === 0)
             ret[prefName]= this._mCachedPrefs[prefName];
          else
             ret[prefName]= localStorage['ynano_' + pluginID + '_pref_' + prefName];
       }

       var lastLoadPrefs= 0;
       for (var tabIdCur in this._mLastLoadPrefs)
       {
          if (parseInt(tabIdCur) !== tabId)
             lastLoadPrefs= Math.max(lastLoadPrefs, this._mLastLoadPrefs[tabIdCur]);
       }

       if (lastLoadPrefs > 0)
          ret.msecSinceLastPrefLoad= timeNow - lastLoadPrefs;

       this._mLastLoadPrefs[tabId]= timeNow;
       return ret;
   },

   getNanoPrefs: function(tabId, port, callObj)
   {
      try
      {
         var aryPrefs= JSON.parse(callObj.pvData);
         this.migrateNanoPrefs(callObj.pluginID);
         callObj.ret= this.getNanoPrefsCore(aryPrefs, callObj.pluginID);
         ChromeCallHandler.postMessageToPort(port, callObj);
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeCallHandler::getNanoPrefs error: ' + e.message);
      }
   },

   setDummyBandMarkup: function(tabId, port, callObj)
   {
      var dummyBandObj= {};
      dummyBandObj[callObj.pluginID]= callObj.pvData;
      localStorage['ynano_dummyband']= JSON.stringify(dummyBandObj);
   },

   priorUninstallDetected: function(tabId, port, callObj)
   {
      try
      { 
         if (this._mAlreadyDetectedUninstall)
         {
            return;
         }
         this._mAlreadyDetectedUninstall= true;

         // remove all tracking states which may be in local storage, also clear install time because we don't want to keep getting recalled here
         for (var storageCur in window.localStorage)
         {
            if (storageCur && ((storageCur === "ynano_installTime") || 
                               ((storageCur.indexOf('ynano_') === 0) && (storageCur.indexOf('_trackingState') === (storageCur.length - 14)))))
            {
               window.localStorage.removeItem(storageCur);
            }
         }

         ChromeTrackingManager.ensureInit(function()
         {
            var plugins= ChromeScriptInjector.getPlugins();
            for (var index in plugins)
            {
               var objPlugin= plugins[index];
               if (ChromePluginManager.isPluginInstalled(objPlugin.pluginID) &&
                   ChromeScriptInjector.pluginSupportedOnBrowser(objPlugin))
               {
                  ChromeScriptInjector.checkForFirstRun(tabId, objPlugin);
               }
            }         
         });
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.detectPriorUninstall error: ' + e.message);
      }
   },

   exposeInterfaceToPage: function(tabId, port, callObj)
   {
      ChromePageCallHandler.addExposedObj(tabId, port, callObj);
   },

   fireEventToPage: function(tabId, port, callObj)
   {
      var fireObj= JSON.parse(callObj.pvData);
      var evtObj=
      {
         targetIsPage: true,
         pluginID: callObj.pluginID,
         eventFn: fireObj.eventName,
         eventPv: (this._mIsIE && fireObj.pv) ? YAHOO.nanoLang.JSON.parse(fireObj.pv) : fireObj.pv,
         id: Math.floor(Math.random() * 65536)
      }
      ChromePageCallHandler.fireEventToPage(tabId, evtObj);
   },

   getInstallerData: function(tabId, port, callObj)
   {
      callObj.ret= ChromeInstallManager.getInstallerData();
      ChromeCallHandler.postMessageToPort(port, callObj);
   },

   getYahooBlindYID: function(tabId, port, callObj)
   {
      callObj.ret= ChromeCookieManager._mYahooBlindYID;
      ChromeCallHandler.postMessageToPort(port, callObj);
   },

   getAllBrowserTabs: function(tabId, port, callObj)
   {	 	
      chrome.tabs.query({}, function(aryTabs)
      {
         var aryTabsRet= [];
         for (var tabOn= 0, tabLim= aryTabs.length; tabOn < tabLim; tabOn++)
         {
            var tabObjCur=
            {
               title: aryTabs[tabOn].title,
               url: aryTabs[tabOn].url,
               tabID: aryTabs[tabOn].id
            };

            aryTabsRet.push(tabObjCur);
         }

         callObj.ret= aryTabsRet;
         ChromeCallHandler.postMessageToPort(port, callObj);
      });
   },

   closeBrowserTab: function(tabId, port, callObj)
   {
      chrome.tabs.remove([callObj.pvData]);
   },

   closeCurrentTab: function(tabId, port, callObj)
   {
      var optionsObj= JSON.parse(callObj.pvData);
      if (optionsObj && optionsObj.andWindow)
      {
         chrome.tabs.get(tabId, function(tab)
         {
            if (tab)
            {
               chrome.windows.remove(tab.windowId);
            }
         });
      }
      else
         chrome.tabs.remove([tabId]);
   },

   clearBrowserData: function(tabId, port, callObj)
   {
    /*  var objRemoveIn= JSON.parse(callObj.pvData);
      var objRemoveChrome=
      {
         "cache": objRemoveIn.clearCache,
         "cookies": objRemoveIn.clearCookies,
         "history": objRemoveIn.clearBrowsingHistory
      };

      chrome.browsingData.remove({}, objRemoveChrome, function()
      {
         ChromeCallHandler.postMessageToPort(port, callObj);  	
      });*/
   },

   waitForTabFocus: function(tabId, port, callObj)
   {
      var _self= this;
      chrome.tabs.get(tabId, function(tab)
      {
         if (tab)
         {
            if (tab.active)
            {
               callObj.ret= true;
               ChromeCallHandler.postMessageToPort(port, callObj);    
            }
            else
            {
               window.setTimeout(function() { _self.waitForTabFocus(tabId, port, callObj); _self= tabId= port= null; }, 500);
            }
         }
      });   
   },

   setDynamicURLs: function(tabId, port, callObj)
   {
      ChromeScriptInjector.setDynamicURLObj(tabId, callObj.pluginID, JSON.parse(callObj.pvData));
   },

   launchPopup: function(tabId, port, callObj)
   {
      ChromePopupManager.launchPopup(tabId, port, callObj);
   },

   closePopup: function(tabId, port, callObj)
   {
      ChromePopupManager.closePopup(tabId, callObj.pluginID, callObj.pvData);
   },

   changePopupLayout: function(tabId, port, callObj)
   {
      ChromePopupManager.changePopupLayout(tabId, callObj.pluginID, callObj.pvData);
   },

   sendPopupMessage: function(tabId, port, callObj)
   {
      ChromePopupManager.sendPopupMessage(tabId, callObj.pluginID, callObj.pvData);
   },

   registerPopupSubframe: function(tabId, port, callObj)
   {
      ChromePopupManager.registerPopupSubframe(tabId, port, callObj);
   },

   closeAllPopups: function(tabId, port, callObj)
   {
      ChromePopupManager.closeAllPopupsInTab(tabId, callObj.pvData);
   },

   syncLivePopup: function(tabId, port, callObj)
   {
      ChromePopupManager.syncLivePopup(tabId, port, callObj);
   },

   fetchURL: function(tabId, port, callObj)
   {
      var requestInfo= JSON.parse(callObj.pvData),
          cachedResp= ChromeInstallManager.getFetchURLCache(requestInfo.url);

      if (cachedResp)
      {
         var responseObj=
         {
            status: 200,
            responseText: cachedResp
         };
 
         callObj.ret= responseObj;
         ChromeCallHandler.postMessageToPort(port, callObj);
      }
      else
      {
         var xhr= new window.XMLHttpRequest();
         xhr.open(requestInfo.method, requestInfo.url, true);

         if (requestInfo.method === "POST")
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

         xhr.onreadystatechange= function() 
         {
            if (xhr.readyState == 4)
            {
               var responseObj=
               {
                  status: xhr.status,
                  responseText: xhr.responseText
               };
 
	           callObj.ret= responseObj;
    	       ChromeCallHandler.postMessageToPort(port, callObj);
            }
         }

         xhr.send((requestInfo.method === "POST") ? requestInfo.postData : null);  
      }
   },

   createNanoIFrame: function(tabId, port, callObj)
   {
      ChromeIFrameManager.createIFrame(tabId, port, callObj);
   },

   createNanoEmbedIFrame: function(tabId, port, callObj)
   {
      ChromeIFrameManager.createIFrame(tabId, port, callObj, true /*isEmbed*/);
   },

   sendIFrameMessage: function(tabId, port, callObj)
   {
      ChromeIFrameManager.sendEmbedIFrameMessage(port, callObj);
   },

   removeNanoEmbedIFrame: function(tabId, port, callObj)
   {
      ChromeIFrameManager.removeEmbedIFrame(tabId, port, callObj);
   },

   hasNanoIFrame: function(tabId, port, callObj)
   {
     ChromeIFrameManager.hasNanoIFrame(tabId, port, callObj);
   },

   returnHasNanoIFrame: function(tabId, port, callObj)
   {
     ChromeIFrameManager.returnHasNanoIFrame(tabId, port, callObj);
   },

   hasNanoEmbedIFrame: function(tabId, port, callObj)
   {
      ChromeIFrameManager.hasEmbedIFrame(tabId, port, callObj);
   },

   nanoEmbedIFrameInitComplete: function(tabId, port, callObj)
   {
      ChromeIFrameManager.onEmbedInitComplete(tabId, port, callObj);
   },   

   isNanoCallRestricted: function(tabId, port, callObj)
   {
      ChromeIFrameManager.isNanoCallRestricted(tabId, port, callObj);
   },

   getPageInfo: function(tabId, port, callObj)
   {
      var utilReturnGUID= ChromeTrackingManager.generateUUID(),
          utilCallObj=
      {
         isUtilCall: true,
         pluginID: callObj.pluginID,
         func: "getPageInfo",
         pvData:
         {
            utilReturnGUID: utilReturnGUID
         }
      };

      this._mUtilReturnObj[utilReturnGUID]= 
      {
         port: port,
         callObj: callObj
      };

      ChromeCallHandler.postMessageToTab(tabId, utilCallObj, true /*pageOnly*/);
   },

   returnPageInfo: function(tabId, port, callObj)
   {
      var params= JSON.parse(callObj.pvData),
          returnObj= this._mUtilReturnObj[params.utilReturnGUID];

      if (returnObj)
      {
         returnObj.callObj.ret= params.pageInfo;
         ChromeCallHandler.postMessageToPort(returnObj.port, returnObj.callObj);  

         this._mUtilReturnObj[params.utilReturnGUID]= null;         
      }
   },

   getPageMarkup: function(tabId, port, callObj)
   {
      var params= JSON.parse(callObj.pvData),
          utilReturnGUID= ChromeTrackingManager.generateUUID(),
          utilCallObj=
      {
         isUtilCall: true,
         pluginID: callObj.pluginID,
         func: "getPageMarkup",
         pvData:
         {
            utilReturnGUID: utilReturnGUID,
            bodyOrHead: params.bodyOrHead
         }
      };

      this._mUtilReturnObj[utilReturnGUID]= 
      {
         port: port,
         callObj: callObj
      };

      ChromeCallHandler.postMessageToTab(tabId, utilCallObj, true /*pageOnly*/);
   },

   returnPageMarkup: function(tabId, port, callObj)
   {
      var params= JSON.parse(callObj.pvData),
          returnObj= this._mUtilReturnObj[params.utilReturnGUID];

      if (returnObj)
      {
         returnObj.callObj.ret= params.pageMarkup;
         ChromeCallHandler.postMessageToPort(returnObj.port, returnObj.callObj);  

         this._mUtilReturnObj[params.utilReturnGUID]= null;         
      }
   },

   getPluginMarkup: function(tabId, port, callObj)
   {
      var params= JSON.parse(callObj.pvData),
          utilReturnGUID= ChromeTrackingManager.generateUUID(),
          utilCallObj=
      {
         isUtilCall: true,
         pluginID: callObj.pluginID,
         func: "getPluginMarkup",
         pvData:
         {
            utilReturnGUID: utilReturnGUID
         }
      };

      this._mUtilReturnObj[utilReturnGUID]= 
      {
         port: port,
         callObj: callObj
      };

      ChromeCallHandler.postMessageToTab(tabId, utilCallObj, true /*pageOnly*/);
   },

   returnPluginMarkup: function(tabId, port, callObj)
   {
      var params= JSON.parse(callObj.pvData),
          returnObj= this._mUtilReturnObj[params.utilReturnGUID];

      if (returnObj)
      {
         returnObj.callObj.ret= params.pluginMarkup;
         ChromeCallHandler.postMessageToPort(returnObj.port, returnObj.callObj);  

         this._mUtilReturnObj[params.utilReturnGUID]= null;         
      }
   },

   getPopupMarkup: function(tabId, port, callObj)
   {
      var params= JSON.parse(callObj.pvData),
          utilReturnGUID= ChromeTrackingManager.generateUUID(),
          utilCallObj=
      {
         isUtilCall: true,
         pluginID: callObj.pluginID,
         func: "getPopupMarkup",
         pvData:
         {
            popupID: params.popupID,
            utilReturnGUID: utilReturnGUID
         }
      };

      this._mUtilReturnObj[utilReturnGUID]= 
      {
         port: port,
         callObj: callObj
      };

      ChromeCallHandler.postMessageToTab(tabId, utilCallObj, true /*pageOnly*/);
   },

   returnPopupMarkup: function(tabId, port, callObj)
   {
      var params= JSON.parse(callObj.pvData),
          returnObj= this._mUtilReturnObj[params.utilReturnGUID];

      if (returnObj)
      {
         returnObj.callObj.ret= params.popupMarkup;
         ChromeCallHandler.postMessageToPort(returnObj.port, returnObj.callObj);  

         this._mUtilReturnObj[params.utilReturnGUID]= null;         
      }
   },   

   getLivePopupDimensions: function(tabId, port, callObj)
   {
      var params= JSON.parse(callObj.pvData),
          utilReturnGUID= ChromeTrackingManager.generateUUID(),
          utilCallObj=
      {
         isUtilCall: true,
         pluginID: callObj.pluginID,
         func: "getLivePopupDimensions",
         pvData:
         {
            popupID: params.popupID,
            utilReturnGUID: utilReturnGUID
         }
      };

      this._mUtilReturnObj[utilReturnGUID]= 
      {
         port: port,
         callObj: callObj
      };

      ChromeCallHandler.postMessageToTab(tabId, utilCallObj, true /*pageOnly*/);
   },

   returnLivePopupDimensions: function(tabId, port, callObj)
   {
      var params= JSON.parse(callObj.pvData),
          returnObj= this._mUtilReturnObj[params.utilReturnGUID];

      if (returnObj)
      {
         returnObj.callObj.ret= params.popupDimensions;
         ChromeCallHandler.postMessageToPort(returnObj.port, returnObj.callObj);  

         this._mUtilReturnObj[params.utilReturnGUID]= null;         
      }
   },     

   sendAppBoxDismissalBeaconInfo: function(tabId, port, callObj)
   {
      ChromeCallHandler.setAppBoxDismissalBeaconInfo(JSON.parse(callObj.pvData));
   },
   
   handleCall: function(tabId, port, callObj)
   {   
      if (this[callObj.callFn])
         this[callObj.callFn](tabId, port, callObj);
   }
};

ChromePageCallHandlerProto= function() {};
ChromePageCallHandlerProto.prototype=
{
   _mExposedPluginObjs: {},
   _mPageEvtPorts: {},

   sinkClientEvents: function(tabId, port, callObj)
   {
      this._mPageEvtPorts[tabId]= port;
   },
   
   installPlugin: function(tabId, port, callObj)
   {
      this.isTabAYahooSite(tabId, function(ret)     
      {
         if (ret)
         {
            var pluginID= callObj.pvData;
            ChromePluginManager.installPlugin(pluginID);
         }
      });
   },

   uninstallPlugin: function(tabId, port, callObj)
   {
      this.isTabAYahooSite(tabId, function(ret)     
      {
         if (ret)
         {
            var pluginID= callObj.pvData;
            ChromePluginManager.uninstallPlugin(pluginID);
         }
      });
   },

   getInstalledPlugins: function(tabId, port, callObj)
   {
      var installedPlugins= ChromePluginManager.getInstalledPlugins(callObj);
      callObj.ret= installedPlugins;
      ChromeCallHandler.postMessageToPort(port, callObj);
   },

   setNanoPrefs: function(tabId, port, callObj)
   {
      this.isTabAYahooSite(tabId, function(ret)
      {
         if (ret)
            ChromePluginCallHandler.setNanoPrefs(tabId, port, callObj);
      });
   },

   getNanoPrefs: function(tabId, port, callObj)
   {
      this.isTabAYahooSite(tabId, function(ret)
      {
         if (ret)
            ChromePluginCallHandler.getNanoPrefs(tabId, port, callObj);
      });
   },

   callExposedPluginInterface: function(tabId, port, callObj)
   {
      try
      {
         var pvData= JSON.parse(callObj.pvData);
         if (pvData.pluginID && pvData.interfaceName && pvData.funcName)
         {
            var _self= this;
            var pluginInt= window.setInterval(function()
            {
               if (_self._mExposedPluginObjs[tabId] &&
                   _self._mExposedPluginObjs[tabId][pvData.pluginID] && 
                   _self._mExposedPluginObjs[tabId][pvData.pluginID][pvData.interfaceName])
               {   
                  var portUse= _self._mExposedPluginObjs[tabId][pvData.pluginID][pvData.interfaceName];
                  if (portUse && !portUse.isDisconnected)
                  {
                     window.clearInterval(pluginInt);

                     var evtObj=
                     {
                        eventFn: "onCallPluginInterface",
                        eventPv: 
                        { 
                           interfaceName: pvData.interfaceName,
                           funcName: pvData.funcName,
                           params: pvData.params
                        },
                        pluginID: pvData.pluginID
                     };

                     if (callObj.hasReply)
                     {
                        evtObj.replyID= ChromeTrackingManager.generateUUID();
                        if (!evtObj.eventPv.params)
                           evtObj.eventPv.params= {};
                        evtObj.eventPv.params.replyID= evtObj.replyID;

                        evtObj.replyFunc= function(ret)
                        {       
                           if (ret != "nano_async")
                           {
                              callObj.ret= ret;
                              ChromeCallHandler.postMessageToPort(port, callObj);
                           }
                        }
                     }

                     ChromeCallHandler.fireEventToPort(tabId, portUse, evtObj);
                  }
               }
            }, 100);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePageCallHandler::callExposedPluginInterface error: ' + e.message);
      }
   },
   
   handleCall: function(tabId, port, callObj)
   {
      if (this[callObj.callFn])
         this[callObj.callFn](tabId, port, callObj);
   },

   isTabAYahooSite: function(tabId, fnRet)
   {
      chrome.tabs.get(tabId, function(tab)
      {
         if (tab)
         {
            var reMatch= tab.url.match("://[/]*([^/]*).yahoo.com[$|/]*");
            fnRet((reMatch && (reMatch.length > 0)) ? true : false);
         }
         else
         {
            fnRet(false);

         }
      });   
   },

   addExposedObj: function(tabId, port, callObj)
   {
      try
      {
         if (!this._mExposedPluginObjs[tabId])
            this._mExposedPluginObjs[tabId]= {};
         if (!this._mExposedPluginObjs[tabId][callObj.pluginID])
            this._mExposedPluginObjs[tabId][callObj.pluginID]= {};

         this._mExposedPluginObjs[tabId][callObj.pluginID][callObj.pvData]= port;
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromePageCallHandler::addExposedObj error: ' + e.message);
      }
   },

   fireEventToPage: function(tabId, evtObj)
   {
      if (this._mPageEvtPorts[tabId])
         ChromeCallHandler.fireEventToPort(tabId, this._mPageEvtPorts[tabId], evtObj, true /*targetIsPage*/); 
   }
};

ChromePluginHistoryManagerProto= function() {};
ChromePluginHistoryManagerProto.prototype=
{
   getPluginFirstLoadTime: function(pluginId, pluginVer)
   {
      return window.localStorage.getItem('ynano_' + pluginId + '_' + pluginVer + '_' + ChromeTrackingManager._mNanoVer + '_firstLoadTime');
   },

   setPluginFirstLoadTime: function(pluginId, pluginVer, time)
   {
      window.localStorage.setItem('ynano_' + pluginId + '_' + pluginVer + '_' + ChromeTrackingManager._mNanoVer + '_firstLoadTime', time);
   }
};

ChromeScriptInjectorProto= function() {};
ChromeScriptInjectorProto.prototype=
{
   _mNanoBridgeCodeURL: "",
   _mNanoBridgeCode: null,
   _mPageBridgeURL: "",
   _mFeedJSON: null,
   _mAryPluginResourceCollection: {ts: 0, normal:{}, unittest:{}},
   _mTabsToInsertScript: {},
   _mInUnitTests: false,
   _mPluginsAreReady: false,
   _mDeferInject: {},
   _mForceUpdateInt: null,
   //_mNewTabUrl: null,
   _mBandInjectScript: {},
   _mRetriedNanoFeed: false,
   _mRecordUninstallURL: null,
   _mDetectUninstallURL: null,
   _mInjectAtTop: false,
   _mDevPluginJSON: null,
   _mSeenNanoMode: false,
   _mQAMode: null,
   _mDOMStatusPrev: {},
   _mTabNavState: {},
   _mTabCompletionTimes: {},
   _mTriggerDynamicFirstRun: false,
   _mPluginFrameIDs: {},
   _mActiveWindowID: 0,
   _mInitialTabInfo: null,
   _mActiveTabs: {},
   _mEverGotAppBoxScript: false,
   _mAppBoxScript: "",
   _mAppBoxOpenCount: 0,
   _mFailedToFetchErr: null,
   _mAtLeastOneAppBoxPlugin: false,
   _mAnyUsingNativeClickStream: false,
   _mAppBoxLaunched: false,
   _mSeenPageParamRet: false,
   _mRawHashParams: null,   
   _mLastNewTabID: -1,

   addContent: function(pluginId, injectContent, forUnitTests)
   {
      try
      {
         var bInlineContent= !injectContent.injectRemote && !injectContent.injectWithBridge;
         if (bInlineContent)
         {
            var _self= this,
                tsBeforeFetch= this._mAryPluginResourceCollection.ts;

            var aryPluginResourceCollection= this._mAryPluginResourceCollection[forUnitTests ? "unittest" : "normal"];	
            if (pluginId)
               aryPluginResourceCollection[pluginId].resourcesRemain++;

            var xhr = new XMLHttpRequest();
            xhr.open("GET", injectContent.contentUrlSSL ? injectContent.contentUrlSSL : injectContent.contentUrl, true);
            xhr.onreadystatechange = function() 
            {
               if (xhr.readyState == 4)
               {
                  if (xhr.status == 200)
                  {
                     if (_self._mAryPluginResourceCollection.ts == tsBeforeFetch)
                     {
                        var injectCode= xhr.responseText;
                        injectCode= injectCode.replace(/\n([ ]*)/g, "");
                        injectCode= injectCode.replace(/\r([ ]*)/g, "");

                        if (pluginId && !injectContent.injectRemote)
                           injectContent.injectCode = injectCode;
                        else if (!pluginId)
                           _self._mNanoBridgeCode = injectCode;
                        else
                           injectContent.injectCode= "";

                        if (pluginId && (--aryPluginResourceCollection[pluginId]['resourcesRemain'] == 0))
                           aryPluginResourceCollection['pluginsNotReady']--;

                        if (aryPluginResourceCollection['pluginsNotReady'] <= 0 && _self._mNanoBridgeCode)
                        { 
                           ChromePerfMonitor.setBootEnd((new Date()).getTime());

                           for (var injectTabID in _self._mDeferInject)
                           {
                              var injectTabObj= _self._mDeferInject[injectTabID];
                              if (injectTabObj && _self._mTabsToInsertScript[injectTabID])
                              {
                                 injectTabObj.wasInjected= true;

                                 _self.injectPlugins(parseIntNoNaN(injectTabID),
                                                     injectTabObj.tabUrlInject,
                                                     injectTabObj.securePage, true /*force*/);
                              }
                           }
                        }
                     }
                  }
                  else
                     _self._mFailedToFetchErr= xhr.status;
               }
            }
            
            xhr.send();
         }

         return bInlineContent;
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.addScript error: ' + e.message);
      }
   },  

   preFetchFeed: function()
   {
      try
      {
         //alert('booted');
         var _self= this;

         ChromePerfMonitor.setBootStart((new Date()).getTime());
         //ChromeHistoryManager.ensureInit(false, null);
         ChromeInstallManager.init(function()
         {
            _self.fetchFeed(false /*forceDefaultFeedURL*/, false /*forceNoHTTPS*/, localStorage['qamode']);
            chrome.browserAction ? ChromeBrowserActionManager.init() : false;
            ChromeMailNotifications ? ChromeMailNotifications.init() : false;
            ChromeBucketManager ? ChromeBucketManager.init() : false;
         });
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.preFetchFeed error: ' + e.message);
      }
   },

   forceRetryFetchNanoFeedIfErr: function()
   {
      if (typeof(this._mFailedToFetchErr) === "number")
      {
         this._mFailedToFetchErr= null;
         this._mRetriedNanoFeed= false;
         this.fetchFeed(false /*forceDefaultFeedURL*/, false /*forceNoHTTPS*/, localStorage['qamode']);
      }
   },

   convertUILangToTBIntl: function(lang)
   {
      var langIntl= lang.indexOf('-');
      return ((langIntl !== -1) ? lang.substr(langIntl + 1) : lang).toLowerCase();
   },

   fetchFeed: function(forceDefaultFeedURL, forceNoHTTPS, qaMode)
   {
      try
      {
         this._mQAMode= qaMode;

         this._mAryPluginResourceCollection=
         {
            ts:(new Date()).getTime(), 
            normal:{}, 
            unittest:{}
         };             

         var _self= this;
         if (localStorage['devJSONpath'] && (localStorage['devJSONpath'] != ""))
         {
            var xhrDevJSON= new XMLHttpRequest;
            xhrDevJSON.open("GET", localStorage['devJSONpath'], true);
            xhrDevJSON.onreadystatechange = function()
            {
               if ((xhrDevJSON.readyState == 4) && (xhrDevJSON.status == 200))
               {
                  _self._mDevPluginJSON= JSON.parse(xhrDevJSON.responseText);

                  for (var index= 0, lindex= _self._mDevPluginJSON.plugins.length; index < lindex; index++)
                     ChromePluginManager.installPlugin(_self._mDevPluginJSON.plugins[index].pluginID);   
               }
            }
            xhrDevJSON.send();
         }

         var nanoDefines= ChromeInstallManager.getNanoDefines(),
             feedUrl= nanoDefines.nanoFeedURL;

         if (localStorage['devfeedpath'] && (localStorage['devfeedpath'] != ""))
            this._mFeedURLOverride= localStorage['devfeedpath'];

         forceDefaultFeedURL= true;
         if (this._mFeedURLOverride)
         {
            feedUrl= this._mFeedURLOverride;
         }
         else if (!forceDefaultFeedURL)
         {
            var storedFeedUrl= localStorage['ynano_pref_nanoFeedURL_' + nanoDefines.extensionID];
            if (typeof(storedFeedUrl) == "string")
            {
               var reMatch= storedFeedUrl.match("://[/]*([^/]*).yahoo.com[$|/]*");
               if (reMatch && (reMatch.length > 0))
                  feedUrl= storedFeedUrl;
            }
         }              

         feedUrl += ((feedUrl.indexOf("?") !== -1) ? "&" : "?");
         feedUrl += ("nanoVer=" + encodeURIComponent(ChromeTrackingManager._mNanoVer));

         var intlMatch= feedUrl.match("[&|?]intl=");
         if (!intlMatch || (intlMatch.length === 0))
            feedUrl += ("&intl=" + this.convertUILangToTBIntl(chrome.i18n.getUILanguage())); //-// restore if localization restored

         // modify this to specify your own dev server for next-gen toolbar
         //feedUrl += "&devServer=icethinsquare-vm0.atlanta.corp.yahoo.com";

         if (this._mQAMode)
            feedUrl += ("&qamode=" + this._mQAMode);

         if (forceNoHTTPS)
            feedUrl= feedUrl.replace('https://', 'http://');

         var xhr= new XMLHttpRequest();		
         xhr.open("GET", feedUrl, true);
         xhr.onreadystatechange = function() 
         {
            if (xhr.readyState == 4)
            {
               if (xhr.status == 200)
               {
                  chrome.tabs.query(
                  { 
                     lastFocusedWindow: true,
                     active: true
                  }, function(aryTabs)
                  {
                     if (aryTabs && (aryTabs.length === 1))
                     {
                        ChromeScriptInjector.setActiveTabInfo(aryTabs[0]);

                        _self.handleTabUpdate("loading", aryTabs[0]);
                        _self._mForceUpdateInt= window.setInterval(function()
                        {
                           _self.handleTabUpdate("complete", aryTabs[0]);
                        }, 3000);

                        var responseText= xhr.responseText,
                            scriptPos= responseText.indexOf("<scr" + "ipt");
                        if (scriptPos !== -1)
                           responseText= responseText.substr(0, scriptPos);

                        _self._mFeedJSON= JSON.parse(responseText);

                        if (_self._mFeedJSON.YNanoClientFeed)
                        {
                           _self.readFeedConfig();

                           if (_self._mDevPluginJSON)
                              _self._mFeedJSON.YNanoClientFeed.plugins= _self._mDevPluginJSON.plugins;

                           _self.mergeInstallerDataFromPlugins();

                           if (!inRestrictedPermissionsMode())
                           {
                              if (_self._mFeedJSON.YNanoClientFeed.unittest)
                                 _self.addAllScript(_self.getPlugins(true), true);

                              _self.addAllScript(_self.getPlugins(false), false);    

                              window.setInterval(function() { ChromeScriptInjector.checkForAliasExtensionsAllPlugins(); }, 30000);
                           }
                        }
                     }
                  });
               }
               else if ((xhr.status == 0) && (feedUrl.indexOf('https://') == 0))
               {
                  _self.fetchFeed(_self._mRetriedNanoFeed /*forceDefaultFeedURL*/, true /*forceNoHTTPS*/, _self._mQAMode);
               }
               else if (!_self._mRetriedNanoFeed)
               {
                  _self._mRetriedNanoFeed= true;
                  _self.fetchFeed(true /*forceDefaultFeedURL*/, false /*forceNoHTTPS*/, _self._mQAMode);
               }
               else
                  _self._mFailedToFetchErr= xhr.status;
            }
         }
            
         xhr.send();
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.fetchFeed error: ' + e.message);
      }
   },

   hasReadFeed: function()
   {
      return (this._mFeedJSON && this._mFeedJSON.YNanoClientFeed);   
   },

   readFeedConfig: function()
   {
      try
      {     
         var nanoDefines= ChromeInstallManager.getNanoDefines(),
             configObj= this._mFeedJSON.YNanoClientFeed.config;

         if (configObj)
         {
            if (configObj.preloadURL)
               ChromeResourcePreloader._mPreloadURL= configObj.preloadURL;
            if (configObj.preloadUA)
               ChromeResourcePreloader._mPreloadUA= configObj.preloadUA;
            if (configObj.nanoBridgeJS)
               this._mNanoBridgeCodeURL= nanoDefines.nanoBridgeJSOverride ? nanoDefines.nanoBridgeJSOverride : configObj.nanoBridgeJS;
            if (configObj.pageBridgeJS)
               this._mPageBridgeURL= nanoDefines.pageBridgeJSOverride ? nanoDefines.pageBridgeJSOverride : configObj.pageBridgeJS;
            if (configObj.debugMode)
               ChromeDebugManager._mDebugMode= configObj.debugMode;
            if (configObj.nanoFeedURL)
               window.localStorage.setItem('ynano_pref_nanoFeedURL_' + nanoDefines.extensionID, configObj.nanoFeedURL);
            if (configObj.recordUninstallURL)
               this._mRecordUninstallURL= nanoDefines.recordUninstallURLOverride ? nanoDefines.recordUninstallURLOverride : configObj.recordUninstallURL;
            if (configObj.detectUninstallURL)
               this._mDetectUninstallURL= nanoDefines.detectUninstallURLOverride ? nanoDefines.detectUninstallURLOverride : configObj.detectUninstallURL;
            if (configObj.injectAtTop)
               this._mInjectAtTop= configObj.injectAtTop;
            if (configObj.injectDelayMetrics && configObj.injectDelayMetrics.chrome)
               window.localStorage['ynano_injectDelay']= JSON.stringify(configObj.injectDelayMetrics.chrome);
            else
               window.localStorage['ynano_injectDelay']= "{}";
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.readFeedConfig error: ' + e.message);
      }
   },

   getPlugins: function(forUnitTests)
   {
      if (this._mFeedJSON && this._mFeedJSON.YNanoClientFeed && (forUnitTests ? this._mFeedJSON.YNanoClientFeed.unittest.plugins :
                                                                                this._mFeedJSON.YNanoClientFeed.plugins))
         return (forUnitTests ? this._mFeedJSON.YNanoClientFeed.unittest.plugins : this._mFeedJSON.YNanoClientFeed.plugins);
   },

   getAllPluginIDsAsString: function()
   {
      try
      {
         var aryPlugins= this.getPlugins(this._mInUnitTests),
             strRet= "_";

         for (var pluginOn= 0, pluginCount= aryPlugins.length; pluginOn < pluginCount; pluginOn++)
         {
            strRet += aryPlugins[pluginOn].pluginID;
         }

         return strRet.substr(1);
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.getAllPluginIDsAsString error: ' + e.message);
      }
   },

   getPluginDataFromID: function(pluginId)
   {
      try
      {
         var aryPlugins= this.getPlugins(this._mInUnitTests);

         for (var pluginOn= 0, pluginCount= aryPlugins.length; pluginOn < pluginCount; pluginOn++)
         {
             if (aryPlugins[pluginOn].pluginID == pluginId)
                return aryPlugins[pluginOn];
         }

         return null;
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.getPluginDataFromID error: ' + e.message);
      }
   },

   mergeInstallerDataFromPlugins: function()
   {
      try
      {
         var aryPlugins= this.getPlugins(false);
         for (var pluginOn= 0, pluginCount= aryPlugins.length; pluginOn < pluginCount; pluginOn++)
         {
            if (aryPlugins[pluginOn].installerDataOverrides)
               ChromeInstallManager.mergeInstallerDataFromFeed(aryPlugins[pluginOn].installerDataOverrides);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.mergeInstallerDataFromPlugins error: ' + e.message);
      }
   },

   pluginsAreReady: function(activeURL)
   {
      try
      {
         if (!this._mPluginsAreReady && this._mFeedJSON && this._mFeedJSON.YNanoClientFeed)
         {
            var triggerURL= this._mFeedJSON.YNanoClientFeed.unittest ? this._mFeedJSON.YNanoClientFeed.unittest.triggerURL : null;
                        
            var paramIdx= activeURL.indexOf('?');
            if (paramIdx != -1)
               activeURL= activeURL.substr(0, paramIdx);
                           
            if (triggerURL && (activeURL.indexOf(triggerURL) === 0))
            {
               this._mInUnitTests= true;
            }
            else if (!this._mSeenNanoMode && (activeURL.indexOf('http://ynano-') == 0))
            {
               this._mSeenNanoMode= true;

               var qaMode= activeURL.substr(13),
                   posSlash= -1;

               do
               {
                  posSlash= qaMode.lastIndexOf('/');
                  if (posSlash != -1)
                     qaMode= qaMode.substr(0, posSlash);
               }
               while (posSlash != -1);
               
               this.fetchFeed(false /*forceDefaultFeedURL*/, false /*forceNoHTTPS*/, qaMode);
               return false;
            }

            //this.checkForNewTabOverride();

            var aryPluginResourceCollection= this._mAryPluginResourceCollection[this._mInUnitTests ? "unittest" : "normal"];
            this._mPluginsAreReady= (aryPluginResourceCollection['pluginsNotReady'] <= 0);
         }
      }   
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.pluginsAreReady error: ' + e.message);
      }

      return this._mPluginsAreReady;
   },

   checkForNewTabOverride: function(force)
   {
      /*
      try
      {
         if (!force && (this._mInUnitTests || this._mNewTabUrl || 
             window.localStorage['ynano_pref_sawPageOverride_' + ChromeTrackingManager._mNanoUUID]))
            return;

         var plugins= this.getPlugins(this._mInUnitTests);

         window.localStorage.setItem('ynano_pref_newTabUrl_' + ChromeTrackingManager._mNanoUUID, "");

         for (var index = 0, lindex = plugins.length; index < lindex; index++)
         {
            if (ChromePluginManager.isPluginInstalled(plugins[index].pluginID) && 
                this.pluginSupportedOnBrowser(plugins[index]) &&
                (force || (!this._mNewTabUrl && plugins[index].newTabOverride)))
            {
               this._mNewTabUrl= ChromeScriptInjector.includePageParams(plugins[index].newTabOverride, "nt");
               window.localStorage.setItem('ynano_pref_newTabUrl_' + ChromeTrackingManager._mNanoUUID, this._mNewTabUrl);

               break;
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.checkForNewTabOverride error: ' + e.message);
      }  
      */
   },

   checkForTrackingData: function()
   {
      try
      {
         var plugins= this.getPlugins(this._mInUnitTests);
         for (var index = 0, lindex = plugins.length; index < lindex; index++)
         {
            if (ChromePluginManager.isPluginInstalled(plugins[index].pluginID) && 
                this.pluginSupportedOnBrowser(plugins[index]) &&
                plugins[index].trackingData)
            {
               if (window.localStorage['ynano_pref_sawPageOverride_' + ChromeTrackingManager._mNanoUUID])
                  ChromeTrackingManager.sendBeacon(plugins[index].pluginID, 'install');
               else
                  ChromeTrackingManager.setTrackingDataJSON(plugins[index].pluginID, JSON.stringify(plugins[index].trackingData));
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.checkForTrackingData error: ' + e.message);
      }  
   },

   addAllScript: function(plugins, forUnitTests)
   {
      try
      {
         this.addContent(null, {"contentUrl": this._mNanoBridgeCodeURL}, forUnitTests);
         var aryPluginResourceCollection= this._mAryPluginResourceCollection[forUnitTests ? "unittest" : "normal"];	
         aryPluginResourceCollection['pluginsNotReady'] = 1;
         for (var index = 0, lindex = plugins.length; index < lindex; index++)
         {
            if (ChromePluginManager.isPluginInstalled(plugins[index].pluginID) &&
                this.pluginSupportedOnBrowser(plugins[index]))
            {	
               this._mAtLeastOneAppBoxPlugin |= (plugins[index].injectTarget.location === 'app');

               if (plugins[index].useNativeClickStream)
               {
                  this._mAnyUsingNativeClickStream= true;

                  plugins[index].clickStreamHandler= new NanoClickStreamHandlerProto();
                  plugins[index].clickStreamHandler.init(plugins[index].pluginID, ChromeInstallManager.getInstallerData(), 
                                                                                  ChromeTrackingManager._mNanoVer, 
                                                                                  ChromeTrackingManager._mNanoUUID);
               }

               var bFoundInlineContent= false,
                   pluginId= plugins[index].pluginID;            

               aryPluginResourceCollection[pluginId] = {};
               aryPluginResourceCollection[pluginId]['scripts'] = new Array();
               aryPluginResourceCollection[pluginId]['styles'] = new Array();
               aryPluginResourceCollection[pluginId]['html'] = new Array();
               aryPluginResourceCollection[pluginId].resourcesRemain = 0;

               var injectContents = plugins[index].injectContent;
               for (var cindex = 0, lcindex = injectContents.length; cindex < lcindex; cindex++)
               {
                  var injectContent = injectContents[cindex];
                  if (this.addContent(pluginId, injectContent, forUnitTests) && !bFoundInlineContent)
                  {
                     aryPluginResourceCollection['pluginsNotReady']++;
                     bFoundInlineContent= true;
                  }
               }
            
               aryPluginResourceCollection['pluginsNotReady']--;
               aryPluginResourceCollection[pluginId]['startedLoading'] = true;
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.addAllScript error: ' + e.message);
      }
   },

   pluginSupportedOnBrowser: function(plugin)
   {
      var ret= true;

      try
      {
         if (plugin.minBrowserVers)
         {
            var minChromeVer= plugin.minBrowserVers['Chrome'];
            if (minChromeVer)
            {
               var ua= navigator.userAgent,
                   reChromeMatches= ua.match("Chrome/(([0-9](\.)*)*) "),
                   browserVer= ((reChromeMatches && (reChromeMatches.length > 0)) ? reChromeMatches[1] : "unknown");

               if (browserVer !== "unknown")
               {
                  var aryBrowserVer= [], aryMinVer= [],
                      dotPos;

                  do
                  {
                     aryBrowserVer.push(parseIntNoNaN(browserVer));
                     dotPos= browserVer.indexOf(".");
                     if (dotPos !== -1)
                     {
                        browserVer= browserVer.substr(dotPos + 1);
                     }
                  }
                  while (dotPos !== -1);

                  verPartOn= 0;

                  do
                  {
                     aryMinVer.push(parseIntNoNaN(minChromeVer));
                     dotPos= minChromeVer.indexOf(".");
                     if (dotPos !== -1)
                     {
                        minChromeVer= minChromeVer.substr(dotPos + 1);
                     }
                  }
                  while (dotPos !== -1);

                  while (aryBrowserVer.length < aryMinVer.length)
                     aryBrowserVer.push(0);
                  while (aryMinVer.length < aryBrowserVer.length)
                     aryMinVer.push(0);

                  for (var verPartOn= 0; verPartOn < aryBrowserVer.length; verPartOn++)
                  {
                     if (aryBrowserVer[verPartOn] < aryMinVer[verPartOn])
                     {
                        console.log('not injecting plugin ' + plugin.pluginID + ' because it requires Chrome ' + plugin.minBrowserVers['Chrome']);
                        ret= false;
                        break;
                     }
                     else if (aryBrowserVer[verPartOn] > aryMinVer[verPartOn])
                        break;
                  }
               }
               else
                  ret= false;
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.pluginSupportedOnBrowser error: ' + e.message);
      }

      return ret;
   },

   pluginWantsInjectOnWindowType: function(plugin, windowType, windowURL)
   {
      var ret= true;

      try
      {
         if ((windowType !== "normal") && !plugin.injectTarget.injectOnPopups)
         {
            var foundException= false;
            if (plugin.injectTarget.allowPopupInjectExceptions)
            {
               for (var excepOn= 0, excepLim= plugin.injectTarget.allowPopupInjectExceptions.length; excepOn < excepLim; excepOn++)
               {
                  var exceptionURLCur= plugin.injectTarget.allowPopupInjectExceptions[excepOn],
                      reMatch= windowURL.match(exceptionURLCur);

                  if (reMatch && (reMatch.length > 0))
                  {
                     foundException= true;
                     break;
                  }
               }
            }

            ret= foundException;
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.pluginWantsInjectOnWindowType error: ' + e.message);
      }

      return ret;
   },

   getAppBoxInfo: function(replyFunc)
   {
      try
      {
         this._mAppBoxLaunched= true;

         var installerData= ChromeInstallManager.getInstallerData();
         if (installerData)
         {
            var appBoxInfo= ((installerData && 
                              installerData.currentInstall && 
                              installerData.currentInstall.installerData && 
                              installerData.currentInstall.installerData.NanoCoreDefines) ? installerData.currentInstall.installerData.NanoCoreDefines.appBoxInfo : null);

            if (!appBoxInfo)
            {
               appBoxInfo=
               {
                  width: 300,
                  height: 300

               };
            }

            this._mAppBoxOpenCount++;
            this._mAppBoxInitStart= (new Date()).getTime();

            replyFunc(
            {
               success: true,
               pluginID: appBoxInfo.pluginID,
               width: appBoxInfo.width,
               height: appBoxInfo.height,
               showLoading: appBoxInfo.showLoading,
               loadingText: appBoxInfo.loadingText,
               noAppIconDuringLoad: appBoxInfo.noAppIconDuringLoad,
               hideLogo: appBoxInfo.hideLogo,
               errorText: appBoxInfo.errorText,
               shortName: appBoxInfo.shortName,
               debugMode: ChromeDebugManager._mDebugMode,
               scriptContent: ((this._mAppBoxScript.length > 0) ? this._mAppBoxScript : null)
            });

            // ensure blind YID is set up properly in case of cookie changes while appbox not running
            ChromeCookieManager.getBlindYID();
         }
         else
            replyFunc({ success: false });
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.getAppBoxInfo error: ' + e.message);
      }
   },
   
   getAppBoxScript: function(replyFunc)
   {
      try
      {
         this.forceRetryFetchNanoFeedIfErr();

         var activeTab= this._mActiveTabs[this._mActiveWindowID];
         if (activeTab)
         {
            if (this._mAppBoxScript.length === 0)
               this.injectPluginsCore(activeTab.tabId, activeTab.url, true /*bSecurePage*/, "normal", true /*isAppBox*/);

            if (this._mAppBoxScript.length > 0)
            {
               replyFunc(
               { 
                  success: true,
                  scriptContent: this._mAppBoxScript
               });

               return;
            }
         }	 
         else
            this.ensureActiveTab();

         replyFunc({ success: false });		 
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.getAppBoxScript error: ' + e.message);
      }
   },

   ensureActiveTab: function(fnRet)
   {
      chrome.tabs.query(
      { 
         lastFocusedWindow: true,
         active: true
      }, function(aryTabs)
      {
         if (aryTabs && (aryTabs.length === 1))
         {
            ChromeScriptInjector.setActiveTabInfo(aryTabs[0]);
         }

         if (fnRet)
            fnRet();
      });
   },

   setActiveTabInfo: function(tab)
   {
      try
      {
         if (!this._mInitialTabInfo)
            this._mInitialTabInfo= { tabId: tab.id, winId: tab.windowId }; 

         this._mActiveWindowID= tab.windowId;
         this._mActiveTabs[tab.windowId]=
         {
            tabId: tab.id,
            url: tab.url	
         };                     

         chrome.windows.get(tab.windowId, function(windowCur)
         {
            if (windowCur)
               ChromeScriptInjector._mActiveTabs[tab.windowId].inPrivate= windowCur.incognito;
         });		
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.setActiveTabInfo error: ' + e.message);
      }
   },

   isInitialTab: function(tab)
   {
      return (this._mInitialTabInfo && (this._mInitialTabInfo.tabId == tab.id) && (this._mInitialTabInfo.winId == tab.windowId));
   },

   getNewTabInfo: function(replyFunc)
   {
       /*
      try
      {
         if (ChromeTrackingManager._mNanoUUID && (ChromeTrackingManager._mNanoUUID !== ""))
         {
            replyFunc(
            {
               success: true,
               newTabURL: window.localStorage.getItem('ynano_pref_newTabUrl_' + ChromeTrackingManager._mNanoUUID)
            })
         }
         else
         {
            replyFunc(
            {
               success: false
            })
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.getNewTabInfo error: ' + e.message);
      }
      */
   },

   getInjectInfo: function(replyFunc)
   {
      try
      {
         var installerData= ChromeInstallManager.getInstallerData();
         if (installerData)
         {
            var needDetectPluginID= ((installerData && 
                                      installerData.currentInstall && 
                                      installerData.currentInstall.installerData && 
                                      installerData.currentInstall.installerData.NanoCoreDefines) ? installerData.currentInstall.installerData.NanoCoreDefines.needDetectPluginID : null);

            var injectInfo=
            {
               needDetectPluginID: needDetectPluginID,
               delayInfo: JSON.parse(window.localStorage['ynano_injectDelay'])
            };

            if (needDetectPluginID)
            {

               injectInfo.uninstallBeaconURL= ChromeTrackingManager.getBeaconURL(needDetectPluginID, "uninstall")
            }

            replyFunc(injectInfo);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.getInjectInfo error: ' + e.message);
      }
   },   

   injectPlugins: function(tabId, tabUrl, bSecurePage, force)
   {
      if (this._mDeferInject[tabId])
      {
         if (this._mDeferInject[tabId].sawTabLoadComplete && this._mDeferInject[tabId].wasInjected)
         {
            this._mDeferInject[tabId]= null;
         }
         else if (!force)
         {
            return;
         }
      }
  
      var _self= this;
      chrome.tabs.get(tabId, function(tab)
      {
         if (tab)
         {
            chrome.windows.get(tab.windowId, function(windowCur)
            {
               if (windowCur)
               {
                  _self.injectPluginsCore(tabId, tabUrl, bSecurePage, windowCur.type);
                  if (_self._mAtLeastOneAppBoxPlugin)
                     _self.injectPluginsCore(tabId, tabUrl, bSecurePage, windowCur.type, true);
               }
            });
         }
      });
   },

   injectPluginsCore: function(tabId, tabUrl, bSecurePage, windowType, isAppBox)
   {
      try
      {		 
         this._mTabsToInsertScript[tabId]= true;

         if (!this.pluginsAreReady(tabUrl) || !this._mNanoBridgeCode)
         {
            if (!isAppBox)
            {
               this._mDeferInject[tabId]=
               { 
                  tabUrlInject: tabUrl, 
                  securePage: bSecurePage 
               };
            }

            return false;
         }

         var _tabId;
         var plugins= this.getPlugins(this._mInUnitTests);

         if (!plugins)
            return false;

         for (var _tabIdStr in this._mTabsToInsertScript)
         {
            var _tabId= parseInt(_tabIdStr); 
            if (this._mTabsToInsertScript[_tabId])
            {
               this._mTabsToInsertScript[_tabId]= false;

               // the app box case will actually inject the NanoBridge under InjectPluginScript
               if (!isAppBox)
                  this.injectNanoBridge(_tabId, tabUrl);

               for (var index = 0, lindex = plugins.length; index < lindex; index++)
               {
                  var pluginId = plugins[index].pluginID;
            
                  if (!ChromePluginManager.isPluginInstalled(pluginId)) continue;
                  if (!this.pluginSupportedOnBrowser(plugins[index])) continue;
                  if (!this.pluginWantsInjectOnWindowType(plugins[index], windowType, tabUrl)) continue;

                  var bInject= false;

                  switch (plugins[index].injectTarget.location)
                  {
                     case 'app':
                     {
                        bInject= (isAppBox || tabUrl.match(INJECT_YAPPBOX_MATCH));
                        if (bInject && !isAppBox)
                        {
                           if (!plugins[index].injectedAppOnPage)
                              plugins[index].injectedAppOnPage= {};

                           plugins[index].injectedAppOnPage[_tabId]= true;
                        }

                        break;
                     }
                     case 'page':
                     {
                        bInject= (!bSecurePage || plugins[index].injectTarget.injectOnSecurePages);
                        if (!bInject)
                           this.checkForFirstRun(tabId, plugins[index]);

                        break;
                     }
                     case 'chrome':
                     {
                        bInject= true;
                        break;
                     }
                  }


                  if (bInject)
                  {              
                     this.checkForFirstRun(tabId, plugins[index]);

                     var bDontInjectInPageForAppBox= (tabUrl.indexOf("http") !== 0);

                     ChromePerfMonitor.setPerfMetricsForPlugin(tabId, pluginId, 'loadStart', (new Date()).getTime());

                     this.injectPluginScript(_tabId, tabUrl, pluginId, plugins[index].injectTarget, plugins[index].injectContent, !index, bSecurePage, isAppBox, bDontInjectInPageForAppBox);
                  }
               }
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.injectPlugins error: ' + e.message);
      }

      return true;
   },

   checkForAliasExtensions: function(objPlugin)
   {
      try
      {
         if (!inRestrictedPermissionsMode())
         {
            chrome.management.getAll(function(allExtensions)
            {
                var extIds = {};
                for(cur in allExtensions)
                {
                    extIds[allExtensions[cur].id] = true;
                }
                var nanoDefines= ChromeInstallManager.getNanoDefines(),      
                    aryAliases= objPlugin.chromeExtensionAliases;

                if (nanoDefines && nanoDefines.extensionAliases)
                    aryAliases= (aryAliases ? nanoDefines.extensionAliases.contact(aryAliases) : nanoDefines.extensionAliases);

                if (aryAliases)
                {
                   for (var aliasOn= aryAliases.length; aliasOn > 0; aliasOn--)
                   {
                      var curAlias= aryAliases[aliasOn - 1];
                      if (curAlias)
                      {
                         if (curAlias !== chrome.runtime.id && extIds[curAlias])
                         {
                            try
                            {
                               chrome.management.get(curAlias, function(extInfo)
                               {
                                  if (extInfo && extInfo.enabled)
                                  {
                                     var timerUninstall= window.setTimeout(function()
                                     {
                                        // we can no longer uninstall due to an exception from Chrome about this not coming from a 'user gesture', but we can
                                        // disable.
                                        chrome.management.setEnabled(extInfo.id, false);

                                     }, 1000);

                                     chrome.runtime.sendMessage(extInfo.id, { msg: "getAllStorage" }, function(resp)
                                     {
                                        window.clearTimeout(timerUninstall);

                                        if (resp)
                                        {
                                           for (var mem in resp)
                                           {
                                              if (mem)
                                              {
                                                 window.localStorage[mem]= resp[mem];

                                              }
                                           }
                                        }

                                        // we can no longer uninstall due to an exception from Chrome about this not coming from a 'user gesture', but we can
                                        // disable.
                                        chrome.management.setEnabled(extInfo.id, false);
                                     });
                                  }
                               });
                            }
                            catch (e)
                            {
                               // may throw if extension does not exist.  That's fine, ignore.
                            }
                         }
                      }
                   }
               }
            });
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.checkForAliasExtensions error: ' + e.message);
      }
   },

   checkForFirstRunAllPlugins: function(tabId, force)
   {
      try
      {
         var plugins= this.getPlugins(this._mInUnitTests);
         if (plugins)
         {
            for (var index= 0, lindex= plugins.length; index < lindex; index++)
               this.checkForFirstRun(tabId, plugins[index], force);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.checkForFirstRunAllPlugins error: ' + e.message);
      }
   },

   checkForAliasExtensionsAllPlugins: function()
   {
      try
      {
         var _self = this;
         var plugins= this.getPlugins(this._mInUnitTests);
         if (plugins)
         {
            for (var index= 0, lindex= plugins.length; index < lindex; index++)
            {
                _self.checkForAliasExtensions(plugins[index]);
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.checkForAliasExtensionsAllPlugins error: ' + e.message);
      }
   },

   clearPageOverrideOnFreshInstall: function()
   {
      var nanoDefines= ChromeInstallManager.getNanoDefines();
      if (nanoDefines && nanoDefines.reCalcNewTabOnInstall)
         window.localStorage.removeItem("ynano_pref_sawPageOverride_" + ChromeTrackingManager._mNanoUUID);
   },

   handlePageParams: function(params, tab, fromTabOpen)
   {
      try
      {
         if (!this._mFeedJSON)
         {
            window.setTimeout(function() { ChromeScriptInjector.handlePageParams(params, tab, fromTabOpen); }, 100);
            return;
         }

         // don't consider page params which might be on a page other than the installing page
         if (!fromTabOpen && !this.isInitialTab(tab))
            return;

         var tabUrl= tab.url,
             timeNow= (new Date()).getTime(),
             force= (fromTabOpen ? false : ((timeNow - window.localStorage.getItem('ynano_installTime')) < 60000)),
             curNewTabUrl= window.localStorage['ynano_pref_newTabUrl_' + ChromeTrackingManager._mNanoUUID];

         /*
         // if the current new tab URL lacks an FR code, then use the page params / default params to get a new one
         if ((typeof(curNewTabUrl) === "string") && !curNewTabUrl.match("[?|&]fr="))
         {
            force= true;
         }
         */

         if (force || (!this._mSeenPageParamRet && !window.localStorage.getItem("ynano_pref_sawPageOverride_" + ChromeTrackingManager._mNanoUUID)))
         {
            this._mSeenPageParamRet= true;
            this._mRawHashParams= params;

            if (!params || (params.indexOf("{{replace") !== -1))
            {
               var installerData= ChromeInstallManager.getInstallerData();
               if (installerData)
               {
                  var defaultPageParams= ((installerData && 
                                           installerData.currentInstall && 
                                           installerData.currentInstall.installerData && 
                                           installerData.currentInstall.installerData.NanoCoreDefines) ? installerData.currentInstall.installerData.NanoCoreDefines.defaultPageParams : null);

                  if (defaultPageParams)
                     this._mRawHashParams= defaultPageParams;
               }
            }

            this.findHashParamsInUrl(tabUrl);

            if (params)
            {
               // handle any directives to replace default parameter contents from on-page parameters
               var replacePos= params.indexOf("{{replace");
               while (replacePos !== -1)
               {
                  var replaceEnd= params.indexOf("}}", replacePos);
                  if (replaceEnd)
                  {
                     var replaceStr= params.substring(replacePos, replaceEnd),
                         replaceMatch= replaceStr.match("{{replace,([^,]*),([^,]*)");

                     if (replaceMatch && replaceMatch.length > 2)
                     {
                        var replaceFrom= replaceMatch[1];
                            replaceTo= replaceMatch[2];

                        this._mRawHashParams= this._mRawHashParams.replace(replaceFrom, replaceTo);
                     }
                  }	

                  replacePos= params.indexOf("{{replace", replacePos + 9);
               }
            }

            params= this._mRawHashParams;

            // handle any directives to do something different based on OS type
            var osPos= params.indexOf("{{ostype");
            while (osPos !== -1)
            {
               var osEnd= params.indexOf("}}", osPos);
               if (osEnd)
               {
                  var osStr= params.substring(osPos, osEnd + 2),
                      osMatch= osStr.match("{{ostype,win:([^,]*),mac:([^,]*),def:([^}]*)}}");

                  if (osMatch && osMatch.length > 3)
                  {
                     var replaceTo= osMatch[3];
                     if (navigator.userAgent.indexOf("Macintosh") !== -1)
                     {
                        replaceTo= osMatch[2];
                     }
                     else if (navigator.userAgent.indexOf("Windows") !== -1)
                     {
                        replaceTo= osMatch[1];
                     }

                     this._mRawHashParams= this._mRawHashParams.replace(osStr, replaceTo);
                  }
               }

               osPos= params.indexOf("{{ostype", osPos + 8);
            }

            //this.checkForNewTabOverride(true /*force*/);
            this.checkForTrackingData();

            window.localStorage.setItem("ynano_pref_sawPageOverride_" + ChromeTrackingManager._mNanoUUID, true);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.handlePageParams error: ' + e.message);
      }
   },

   findHashParamsInUrl: function(tabUrl)
   {
      try
      {
         var hashParams= this._mRawHashParams;
         if (hashParams)
         {
            var reMatch= tabUrl.match("://[/]*([^/]*).yahoo.com[$|/]*"),
                urlParamStart= tabUrl.indexOf("?"),
                aryUrlParams= [],
                posSubst= -1;

            if (reMatch && (reMatch.length > 0) && (urlParamStart !== -1))
            {
               var tabUrl= tabUrl.substr(urlParamStart + 1),
               aryUrlParams= tabUrl.split("&");
            }

            do

            {
               posSubst= hashParams.indexOf("{{", posSubst + 1);
               if (posSubst !== -1)
               {
                  var posSubstEnd= hashParams.indexOf("}}", posSubst),
                      substVar= hashParams.substring(posSubst + 2, posSubstEnd),
                      arySubstVar= substVar.split("|"),
                      foundSubstInUrl= false;

                  for (var urlParamOn in aryUrlParams)
                  {
                     var aryParamCur= aryUrlParams[urlParamOn].split("=");
                     if (aryParamCur.length === 2)
                     {
                        for (var substOn= 0, substLim= arySubstVar.length - 1; substOn < substLim; substOn++)
                        {
                           var arySubstCur= arySubstVar[substOn].split(">");
                           if (aryParamCur[0] === arySubstCur[0])
                           {
                              if (arySubstCur.length === 2)
                                 hashParams= (hashParams.substr(0, posSubst) + arySubstCur[1] + hashParams.substr(posSubstEnd + 2));
                              else
                                 hashParams= (hashParams.substr(0, posSubst) + aryParamCur[1] + hashParams.substr(posSubstEnd + 2));

                              foundSubstInUrl= true;
                              break;
                           }
                        }
                     }
                  }	      

                  if (!foundSubstInUrl && (arySubstVar.length > 1))
                     hashParams= (hashParams.substr(0, posSubst) + arySubstVar[arySubstVar.length - 1] + hashParams.substr(posSubstEnd + 2));
               }
            }
            while (posSubst !== -1);

            this._mRawHashParams= hashParams;
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.findHashParamsInUrl error: ' + e.message);
      }
   },

   getPageParam: function(paramName)
   {
      try
      {
         var hashParams= this._mRawHashParams;
         if (hashParams)
         {
            var aryHashParams= hashParams.split("&");

            for (var paramOn in aryHashParams)
            {
               var paramCur= aryHashParams[paramOn],
                   aryParamCur= paramCur.split("=");

               if ((aryParamCur.length == 2) && (aryParamCur[0] === paramName))
                  return aryParamCur[1];
            }
         }
      }
      catch (e)
      {
        ChromeDebugManager.logError('ChromeScriptInjector.getPageParam error: ' + e.message);
      }
   },

   verifyDomain: function(overrideURL)
   {
      try
      {
         var domainStartPos= overrideURL.indexOf("://"),
             domainEndPos= overrideURL.indexOf("/", domainStartPos + 3),
             localDomains= ChromeInstallManager._mInstallerData.NanoCoreDefines.yahooDomains;
         if (domainStartPos !== -1)
         {
            for (var domain in localDomains)
            {
               var domainFoundPos= overrideURL.indexOf(localDomains[domain]);
               if ((domainFoundPos !== -1) && ((domainEndPos === -1) || (domainFoundPos < domainEndPos)))
                  return true;
            }
         }
      }
      catch (e)
      {
        ChromeDebugManager.logError('ChromeScriptInjector.verifyDomain error: ' + e.message);
        console.log(e.message);
      }
      return false;
   },

   includePageParams: function(url, substCode)
   {
      try
      {
         var _self = this;
         var hashParams= this._mRawHashParams;
         if (hashParams)
         {
            var aryHashParams= hashParams.split("&");

            for (var paramOn in aryHashParams)
            {
               var paramCur= aryHashParams[paramOn],
                   aryParamCur= paramCur.split("=");

               if ((aryParamCur.length == 2) && ((aryParamCur[0] === (substCode + "_p")) ||
                                                 (aryParamCur[0] === (substCode + "_o"))))
               {
                  if (aryParamCur[0] === (substCode + "_o"))
                  {
                     var overrideURL= decodeURIComponent(aryParamCur[1]);
                     if(_self.verifyDomain(overrideURL))
                     {
                        url= overrideURL;
                        //console.log('overriding ' + substCode + ' to: ' + url);
                     }
                  }
                  else if (url)
                  {
                     var urlParamStart= url.indexOf("?"),
                         aryOvrParams= aryParamCur[1].split(","),
                         aryURLParams= [],
                         paramObj= {};

                     if (urlParamStart != -1)
                     {
                        aryURLParams= url.substr(urlParamStart + 1).split("&");	
                        url= url.substr(0, urlParamStart + 1);

                     }

                     for (var urlParamOn in aryURLParams)
                     {
                        var urlParamCur= aryURLParams[urlParamOn],
                            aryURLParamCur= urlParamCur.split("=");

                        if (aryURLParamCur.length === 2)
                        {
                           //console.log('adding ' + aryURLParamCur[0] + '=' + aryURLParamCur[1] + ' from original url');
                           paramObj[aryURLParamCur[0]]= aryURLParamCur[1];
                        }
                     }

                     for (var ovrParamOn in aryOvrParams)
                     {
                        var ovrParamCur= aryOvrParams[ovrParamOn],
                            aryOvrParamCur= ovrParamCur.split(":");

                        if (aryOvrParamCur.length === 2)
                        {
                           //console.log('adding ' + aryOvrParamCur[0] + '=' + aryOvrParamCur[1] + ' from overrides');
                           paramObj[aryOvrParamCur[0]]= decodeURIComponent(aryOvrParamCur[1]);
                        }
                     }

                     for (var mem in paramObj)
                        url += (mem + "=" + paramObj[mem] + "&");

                     url= url.substr(0, url.length - 1);
                     //console.log('augmenting ' + substCode + ' to: ' + url);
                  }

                  break;
               }
            }
         }
      }
      catch (e)
      {
        ChromeDebugManager.logError('ChromeScriptInjector.includeHashParams error: ' + e.message);
      }

      return url;
   },

   checkForFirstRun: function(tabId, objPlugin, force)
   {
      try
      {
         if (!force && this._mAppBoxLaunched)
            return;

         var pluginVer= (objPlugin.pluginVer ? objPlugin.pluginVer : '0');
         if (!ChromePluginHistoryManager.getPluginFirstLoadTime(objPlugin.pluginID, pluginVer))
         {
            var nanoDefines= ChromeInstallManager.getNanoDefines(),
                firstRunURL= (nanoDefines.firstRunURLOverride ? nanoDefines.firstRunURLOverride : objPlugin.firstRunURL);

            ChromeScriptInjector.clearPageOverrideOnFreshInstall();

            if (firstRunURL)
            {
               if (firstRunURL !== "{{DYNAMIC}}")
                  ChromeNavigationManager.navigateTab(tabId, {url: firstRunURL});
               else if (this._mDynamicURLs && this._mDynamicURLs.firstRunURL)
                  ChromeNavigationManager.navigateTab(tabId, {url: this._mDynamicURLs.firstRunURL});
               else	
                  this._mTriggerDynamicFirstRun= true;

               if (!this._mTriggerDynamicFirstRun)
                  ChromePluginHistoryManager.setPluginFirstLoadTime(objPlugin.pluginID, pluginVer, (new Date()).getTime());
            }

            this.checkForAliasExtensions(objPlugin);
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.checkForFirstRun error: ' + e.message);
      }
   },

   setDynamicURLObj: function(tabId, pluginID, obj)
   {
      try
      {
         this._mDynamicURLs= obj;

         var objPlugin= this.getPluginDataFromID(pluginID);

         if (this._mTriggerDynamicFirstRun && obj.firstRunURL)
         {
            this._mTriggerDynamicFirstRun= false;

            if (objPlugin)
            {
               var pluginVer= (objPlugin.pluginVer ? objPlugin.pluginVer : '0');
               ChromePluginHistoryManager.setPluginFirstLoadTime(objPlugin.pluginID, pluginVer, (new Date()).getTime());
            }

            ChromeNavigationManager.navigateTab(tabId, {url: obj.firstRunURL});	 
         }

         /*
         if (obj.newTabURL)
            window.localStorage.setItem('ynano_pref_newTabUrl_' + ChromeTrackingManager._mNanoUUID, obj.newTabURL);
        */
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.setDynamicURLObj error: ' + e.message);
      }
   },

   getNanoPropScript: function(tabUrl, withEmbed)
   {
      var nanoPropScript= "";

      try
      {
         nanoPropScript= 
         "try {" +
         "  YAHOO.NanoBridge.setProperties({" +
         "    nanoVer: '" + ChromeTrackingManager._mNanoVer + "'," +
         "    nanoUUID: '" + ChromeTrackingManager._mNanoUUID + "'," +
         "    nanoInstallTime: " + window.localStorage.getItem('ynano_installTime') + "," +
         "    nanoBridgeJS: '" + this._mNanoBridgeCodeURL + "'," +
         "    pageBridgeJS: '" + this._mPageBridgeURL + "'," +
         "    recordUninstallURL: '" + this._mRecordUninstallURL + "'," +
         "    detectUninstallURL: '" + this._mDetectUninstallURL + "'," +
         "    debugMode: " + (ChromeDebugManager._mDebugMode ? "true," : "false,") + 
         "    appBoxInitStart: " + this._mAppBoxInitStart + "," +
         "    appBoxOpenCount: " + this._mAppBoxOpenCount + "," +
         "    appBoxHidden: " + (tabUrl.match(INJECT_YAPPBOX_HIDDEN_MATCH) ? "true," : "false,") +
         "    usingNativeClickStream: " + (this._mAnyUsingNativeClickStream ? "true" : "false") +
         "  }, " + (withEmbed ? "true" : "false") + ");" +
         "} catch(e) { }";
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.getNanoPropScript error: ' + e.message);
      }

      return nanoPropScript;      
   },

   injectNanoBridge: function(tabId, tabUrl)
   {
      try
      {	
         if (!inRestrictedPermissionsMode())
         {
            var injectCode;

            var aryPluginResourceCollection= this._mAryPluginResourceCollection[this._mInUnitTests ? "unittest" : "normal"];	
            //if (!aryPluginResourceCollection[pluginId]['startedLoading'] || aryPluginResourceCollection[pluginId]['resourcesRemain'] > 0)
            if (aryPluginResourceCollection['pluginsNotReady'] > 0 || !this._mNanoBridgeCode)
            {
               this._mTabsToInsertScript[tabId]= true;
               return;
            }

            injectCode= "if ((typeof(YAHOO) != 'undefined') && YAHOO.NanoBridge) { YAHOO.NanoBridge.uninitialize(); };";
            injectCode += this._mNanoBridgeCode;
            injectCode += this.getPageLevelScript();

            injectCode+= "YInjectNanoBridge= function() {" +
            "  var success= false;" +
            "  if (document && document.body && YAHOO && YAHOO.NanoBridge && YAHOO.NanoBridge.PluginInterface) {" +
            "    try {" +
            "      YAHOO.NanoBridge.initPageInterface();" + this.getNanoPropScript(tabUrl, false) + 
            "      injectPageLevelCode();" +
            "      YAHOO.NanoBridge.injectComplete= true;" +
            "    } catch (e) { }" +
            "    success= true;" +
            "  }" +
            "  if (!success) { window.setTimeout(function() { YInjectNanoBridge(); }, 5); }" +
            "};" +
            "YInjectNanoBridge();";

            var _self= this,
                timeExecute= (new Date()).getTime();

            //chrome.tabs.executeScript(tabId, {code: injectCode, runAt: "document_end" }, function()
            this.sendScriptToPort(tabId, "nanobridge", injectCode, timeExecute, function(didInject)
            {
               if (didInject)
               {
                  ChromeCallHandler.markScriptAsInjectedOnTab(tabId, "nanobridge");
               }
            });
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.injectNanoBridge error: ' + e.message);
      }
   },
  
   sendScriptToPort: function(tabId, codeID, code, tsInjectBegin, fnRet, inErrorRetry)
   {

      var tsNow= (new Date()).getTime(),
          _self= this,
          scriptReady= ChromeCallHandler.isTabReadyForScript(tabId, tsInjectBegin);

      if (scriptReady !== "abort")
      {
         if (scriptReady === "ready")
         {
            chrome.tabs.sendMessage(tabId, { msg: "inj", codeID: codeID, code: code }, function(didInject)
            {
               if (!inErrorRetry && (typeof(chrome.runtime.lastError) !== "undefined"))
               {
                  window.setTimeout(function() { _self.sendScriptToPort(tabId, codeID, code, tsNow, fnRet, true); }, 500);
               }
               else if (fnRet)
               {
                  fnRet(didInject);
               }
            });
         }
         else
         {
            window.setTimeout(function() { _self.sendScriptToPort(tabId, codeID, code, tsInjectBegin, fnRet, inErrorRetry); }, 200);
         }
      }
   },

   getPageLevelScript: function()
   {
      var injectCode= "";

      try
      {
         var pageLevelScript= "",
             inPagePos= 0,
             blockOn= 1,
             inPageLen;

         var plugins= this.getPlugins(this._mInUnitTests);
         if (plugins)
         {
            for (var index= 0, lindex= plugins.length; index < lindex; index++)
            {
               var injectContents= plugins[index].injectContent;
               for (var index= 0, lindex= injectContents.length; index < lindex; index++)
               {
                  var injectContent= injectContents[index];
                  if (injectContent.contentType == "JS_PAGE")
                  {
                     var content= injectContent.injectCode;
                     content= content.replace(/\\/g, "\\\\");
                     content= content.replace(/'/g, "\\'");
                     pageLevelScript += content;
                  }
               }
            }
         }

         injectCode += "function injectPageLevelCode() {";

         inPageLen= pageLevelScript.length;
         if (inPageLen > 0)
         {       

            while (inPageLen > 0)
            {
               var elemName= ("elem" + blockOn);

               injectCode += 	 
               "var " + elemName + "= document.createElement('div');" +
               elemName + ".className= 'YTB_Accessor_code_block';" +
               elemName + ".style.display= 'none';" +
               elemName + ".innerText= '" + pageLevelScript.substr(inPagePos, 1000) + "';" +
               "document.body.appendChild(" + elemName + ");";

               blockOn++;
               inPagePos += 1000;
               inPageLen -= 1000;
            }
         }

         injectCode += "}";
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.getPageLevelScript error: ' + e.message);
      }

      return injectCode;
   },

   injectPluginScript: function(tabId, tabUrl, pluginId, injectTarget, injectContents, injectBridgeCode, bSecurePage, isAppBox, bDontInjectInPageForAppBox)
   {
      try
      {		 
         var injectScriptTags= "", injectStyleTags= "", inlineScriptCode= "", inlineStyleCode= "";
         var injectHTMLToHeadTag= "<!doctype html><html><head>";
         var injectHTMLAfterHeadTag= "</head><body></body></html>";
         var nanoBridgeCode= this._mNanoBridgeCode;

         if (!isAppBox)
         {
            nanoBridgeCode= nanoBridgeCode.replace(/\\/g, "\\\\");
            nanoBridgeCode= nanoBridgeCode.replace(/'/g, "\\'");        
         }

         for (var index= 0, lindex= injectContents.length; index < lindex; index++)
         {
            var injectContent= injectContents[index];
            if (!injectContent.injectWithBridge)
            {
               if (injectContent.contentType == "JS")
               {
                  if (injectContent.injectRemote)
                  {
                     var contentUrl= (bSecurePage ? injectContent.contentUrlSSL : injectContent.contentUrl);
                     
                     injectScriptTags += '<scr' + 'ipt type="text/javascript" src="' + contentUrl + '"></scr\'+' + '\'ipt>';
                  }
                  else
                     inlineScriptCode += injectContent.injectCode;
               }
               else if (injectContent.contentType == "CSS")
               {
                  if (injectContent.injectRemote)
                  {
                     var contentUrl= (bSecurePage ? injectContent.contentUrlSSL : injectContent.contentUrl);
                     
                     injectStyleTags += '<sty' + 'le type="text/css" rel="stylesheet" src="' + contentUrl + '"></scr' + 'ipt>';
                  }
                  else
                     inlineStyleCode += injectContent.injectCode;
               }
               else if (injectContent.contentType == "HTML")
               {
                  var htmlCode= injectContent.injectCode;

                  if (isAppBox)
                  {
                     // inline script is not allowed in the appbox.  We need to change all script tags to <script_appbox> and then eval them later.
                     htmlCode= htmlCode.replace(/([^>])<\/script>/g, "$1</script_appbox>");
                     var pos= -1;
                     do
                     {
                        pos= htmlCode.indexOf("</script_appbox>", pos + 1);
                        if (pos !== -1)
                        {
                           var startPos= htmlCode.lastIndexOf("<script", pos);
                           if (startPos !== -1)
                           {
                              var oldLen= htmlCode.length;
                              htmlCode= htmlCode.substr(0, startPos) + "<script_appbox style=\"display:none\"" + htmlCode.substr(startPos + 7);
                              pos += (htmlCode.length - oldLen);
                           }
                        }
                     }
                     while (pos !== -1);
                  }

                  htmlCode= htmlCode.replace(/\\/g, "\\\\");
                  htmlCode= htmlCode.replace(/'/g, "\\'");
                  htmlCode= htmlCode.replace(/\r/g, "");
                  htmlCode= htmlCode.replace(/\n/g, "");
                  htmlCode= htmlCode.replace(/<\/script>/g, "</scr' + 'ipt>");

                  var nPosHeadTag= htmlCode.indexOf("<head>");
                  if (nPosHeadTag != -1)
                  {
                     injectHTMLToHeadTag= htmlCode.substr(0, nPosHeadTag + 6);
                     injectHTMLAfterHeadTag= htmlCode.substr(nPosHeadTag + 6);
                  }            
               }
            }
         }

         var injectCodePage= "",
             injectCodeAppBox= "",
             iframeCSS= ((injectTarget.location == "page") ? "position:fixed;width:1px;height:1px;top:0px;left:-9999px;" :
                                                             "position:fixed;left:0px;top:0px;margin:0px;padding:0px;height:100%;width:100%;background-color:transparent;pointer-events:none;z-index:999999998;");

         if ((injectTarget.location == "app") && !isAppBox && tabUrl.match(INJECT_YAPPBOX_HIDDEN_MATCH))
            iframeCSS= "display:none;";

         injectCodePage+=
	     "YInjectNanoPlugins_" + pluginId + "= function() {" +
	     "  var success= false;" +
	     "  if (document && document.body && (typeof(YAHOO) === 'object') && YAHOO.NanoBridge && YAHOO.NanoBridge.injectComplete) {" +
	     "    try {" +
	     "      var oldFrame= document.getElementById('ynano_iframe_"+pluginId+"');" +
	     "      if (oldFrame) { oldFrame.parentNode.removeChild(oldFrame); oldFrame= null; }" +
	     "      YAHOO.NanoBridge.PluginInterface.init({pluginID:'" + pluginId + "', name:'page'});" + this.getNanoPropScript(tabUrl, true);

         if (isAppBox)
         {
            // note that in the 'app box' scenario, we usually inject the bridge into page (so we can see the underlying page), but all plugins are
            // actually injected in the popup itself in response to a getAppBoxInfo call from appbox.js
            injectCodeAppBox += this._mNanoBridgeCode;

            injectCodeAppBox+=
            "YInjectNanoPlugins_" + pluginId + "= function() {" +
            "  var success= false;" +
            "  if (document && document.body && (typeof(YAHOO) === 'object') && YAHOO.NanoBridge) {" +
            "    try {" +
            "      var oldFrame= document.getElementById('ynano_iframe_"+pluginId+"');" +
            "      if (oldFrame) { oldFrame.parentNode.removeChild(oldFrame); oldFrame= null; }" +
            "      YAHOO.NanoBridge.PluginInterface.init({pluginID:'" + pluginId + "', name:'appbox'});" + this.getNanoPropScript(tabUrl, true) +
            "      var iframe= document.createElement('iframe');" +
            "      iframe.id = 'ynano_iframe_" + pluginId + "';" +
            "      iframe.style.cssText='" + iframeCSS + "';" +
            "      iframe.scrolling='no';" +
            "      iframe.frameBorder='0';";

            if (this._mInjectAtTop)
            {
               injectCodeAppBox += "if (document.body.firstChild)" +
                                   "  document.body.insertBefore(iframe, document.body.firstChild);" +
                                   "else";
            }

            injectCodeAppBox +=
            "      document.body.appendChild(iframe);" +
            "      var iframeDoc= iframe.contentDocument;" +   
            "      iframeDoc.open().write('" + injectHTMLToHeadTag;

            injectCodeAppBox += '<scr' + 'ipt_appbox escaped="true" style="display:none" type="text/javascript">' + escape(nanoBridgeCode + 'g_nanoTopHref= " + top.location.href + ";') + '</scr' + 'ipt_appbox>';
         }
         else
         {
	        injectCodePage+=
	        "      YAHOO.NanoBridge.PluginInterface.sinkClientEvents(function() {" +
	        "        YAHOO.NanoBridge.PluginInterface.waitForTabFocus(function() {" +
	        "          YAHOO.NanoBridge.PluginInterface.unsinkClientEvents();" +
	        "          var iframe= document.createElement('iframe');" +
	        "          iframe.id = 'ynano_iframe_" + pluginId + "';" +
	        "          iframe.style.cssText='" + iframeCSS + "';" +
	        "          iframe.scrolling='no';" +
	        "          iframe.frameBorder='0';";

            if (this._mInjectAtTop)
            {
               injectCodePage += "if (document.body.firstChild)" +
                                 "  document.body.insertBefore(iframe, document.body.firstChild);" +
                                 "else";
            }

            injectCodePage +="  document.body.appendChild(iframe);" +
            "          var iframeDoc= iframe.contentDocument;" +   
            "          iframeDoc.open().write('" + injectHTMLToHeadTag;

            injectCodePage += '<scr' + 'ipt type="text/javascript">' + nanoBridgeCode + 'g_nanoTopHref= " + top.location.href + ";' + this.getNanoPropScript(tabUrl, false).replace(/'/g, "\\'") + '</scr' + 'ipt>';
         }
      
         if (inlineScriptCode.length > 0)
         {
            inlineScriptCode= inlineScriptCode.replace(/\\/g, "\\\\");
            inlineScriptCode= inlineScriptCode.replace(/'/g, "\\'");

            if (isAppBox)
               injectCodeAppBox += '<scr' + 'ipt_appbox style="display:none" type="text/javascript">' + inlineScriptCode + '</scr' + 'ipt_appbox>';
            else
               injectCodePage += '<scr' + 'ipt type="text/javascript">' + inlineScriptCode + '</scr' + 'ipt>';               
         }
         if (inlineStyleCode.length > 0)
         {
            inlineStyleCode= inlineStyleCode.replace(/\\/g, "\\\\");
            inlineStyleCode= inlineStyleCode.replace(/'/g, "\\'");

            if (isAppBox)
               injectCodeAppBox += '<sty' + 'le type="text/css" rel="stylesheet">' + inlineStyleCode + '</sty' + 'le>';
            else
               injectCodePage += '<sty' + 'le type="text/css" rel="stylesheet">' + inlineStyleCode + '</sty' + 'le>';
         }

         if (isAppBox)
         {
            injectCodeAppBox += injectScriptTags + injectStyleTags;

            injectCodeAppBox += injectHTMLAfterHeadTag + "');" +
            "      iframeDoc.close();" +
            "      YAHOO.NanoBridge.PluginInterface.sinkWithIFrame(iframeDoc, '"+pluginId+"');" +
            "      var reinjectCheckInt= window.setInterval(function() {" +
            "        if (!document.getElementById('ynano_iframe_"+pluginId+"')) {" +
            "          window.clearInterval(reinjectCheckInt);" +
            "          YInjectNanoPlugins_"+pluginId+"();" +
            "        }" +
            "      }, 5000);" +
            "      success= true;" +
            "    } catch (e) { YAHOO.NanoBridge.logError('YInjectNanoPlugins error:' + e.message); }" +
            "  }" +
            "  if (!success) { window.setTimeout(function() { YInjectNanoPlugins_"+pluginId+"(); }, 5); }" +
            "};" +
            "YInjectNanoPlugins_"+pluginId+"();";
         }
         else
         {
            injectCodePage += injectScriptTags + injectStyleTags;

            injectCodePage += injectHTMLAfterHeadTag + "');" +
            "         iframeDoc.close();" +
            "         YAHOO.NanoBridge.PluginInterface.sinkWithIFrame(iframeDoc, '"+pluginId+"');" +
            "         var reinjectCheckInt= window.setInterval(function() {" +
            "           if (!document.getElementById('ynano_iframe_"+pluginId+"')) {" +
            "             window.clearInterval(reinjectCheckInt);" +
            "             YInjectNanoPlugins_"+pluginId+"();" +
            "           }" +
            "         }, 5000);" +
            "       });" +
            "     });";
         }

         injectCodePage+=
         "      success= true;" +
         "    } catch (e) { YAHOO.NanoBridge.logError('YInjectNanoPlugins error:' + e.message); }" +
         "  }" +
         "  if (!success) { window.setTimeout(function() { YInjectNanoPlugins_"+pluginId+"(); }, 5); }" +
         "};" +
         "YInjectNanoPlugins_"+pluginId+"();";

         if (!isAppBox || !bDontInjectInPageForAppBox)
         {
            var _self= this,
                timeExecute= (new Date()).getTime();
            //console.log(injectCodePage);
            this.sendScriptToPort(tabId, pluginId, injectCodePage, timeExecute, function(didInject)
            {
               if (didInject)
               {
                  ChromeCallHandler.markScriptAsInjectedOnTab(tabId, pluginId);
               }
            });
            //chrome.tabs.executeScript(tabId, {code: injectCodePage, runAt: "document_end" });
         }

         if (isAppBox)
            this._mAppBoxScript= injectCodeAppBox;
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.injectPluginScript error: ' + e.message);
      }
   },

   handleTabUpdate: function(status, tab, noDetach)
   {
      var _self= this;

      if (typeof(status) === "undefined")
         return;

      window.setTimeout(function()
      {
         try
         {		
            if (_self._mForceUpdateInt)
            {
               window.clearInterval(_self._mForceUpdateInt);
               _self._mForceUpdateInt= null;
            }
         
            var timeCur= (new Date()).getTime();

            if (!_self._mDOMStatusPrev[tab.id])
            {
               _self._mDOMStatusPrev[tab.id]= "";

               if (status == 'complete')
                  status= 'loading';
            }

            if (status != _self._mDOMStatusPrev[tab.id])
            {
               _self._mDOMStatusPrev[tab.id]= status;

               if (status == 'loading')
               {
                  if (!noDetach)
                     ChromeCallHandler.detachTab(tab.id, true /*detachPagePorts*/, false /*detachAppBoxPorts*/);

                  _self.handleLoadingStateCore(tab, timeCur, noDetach);
               }  
               else if (status == 'complete')
               {
                  _self.handleCompletedState(tab, timeCur);
               }
            }

            if (!ChromePluginManager._mPrevActiveTabID[tab.windowId])
               ChromePluginManager._mPrevActiveTabID[tab.windowId]= tab.id;
         }
         catch (e)
         {
            ChromeDebugManager.logError('ChromeScriptInjector.handleTabUpdate error: ' + e.message);
         }
      }, 200);               
   },

   pollTabCompletion: function(tabId)
   {
       try
       {
           var _self = this;
           chrome.tabs.get(tabId, function(tab)
           {
               if(tab.status === "complete")
               {
                   _self.handleCompletedState(tab, Date.now());
               }
               else
               {
                   window.setTimeout(_self.pollTabCompletion.bind(_self,tabId),200)
               }
           });
       }
       catch (e)
       {
           ChromeDebugManager.logError('ChromeScriptInjector.pollTabCompletion error: '+ e.message);
       }
   },

   handleLoadingStateCore: function(tab, timeCur, noAttach)
   {
      try
      {		 
         if (!noAttach)
            ChromeCallHandler.attachTab(tab.id);
        
         ChromePerfMonitor.setPageLoadStart(tab.id, timeCur, true /*overwrite*/);

         if ((tab.url.indexOf('http:') == 0) || (tab.url.indexOf('https:') == 0) /*|| (tab.url === 'chrome://newtab/')*/)
            this.injectPlugins(tab.id, tab.url, tab.url.indexOf('https:') == 0);


         window.setTimeout(this.pollTabCompletion.bind(this, tab.id), 200);
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.handleLoadingStateCore error: ' + e.message);
      }  
   },

   handleCompletedState: function(tab, timeCur)
   {
      try
      {		 

         if (this._mDeferInject[tab.id])
         {
            this._mDeferInject[tab.id].sawTabLoadComplete= true;
         }

         this._mTabCompletionTimes[tab.id]= timeCur;
         this._mDOMStatusPrev[tab.id]= "";

         ChromePerfMonitor.setPageLoadEnd(tab.id, timeCur, true /*overwrite*/);

         if (tab.url.indexOf("chrome://") !== 0)
         {
            var evtObj=
            {
               eventFn:"onNavigateComplete",
               eventPv: 
               { 
                  tabId: tab.id,
                  URL: tab.url 
               }
            };

            ChromeIFrameManager.fireEventToAllEmbeds(evtObj, true /*anyPlugin*/);		

            if (!inRestrictedPermissionsMode())
            {
               try
               {
                  // send a click stream ping if necessary.  We need data only available in the doc, so it will be round-tripped via onRequest handler
                  chrome.tabs.executeScript(tab.id, 
                  {
                     code: "chrome.extension.sendRequest({requestType:'sendClickStreamPing', href: document.location.href, host: document.location.host, referrer: document.referrer}, function(response) {})"
                  });
               }
               catch (e2)
               {
                  // tab may have closed due to delays in getting here.  I didn't want to remove those delays, so we can just fail gracefully here
               }
            }
         }
      }
      catch (e)
      {
         ChromeDebugManager.logError('ChromeScriptInjector.handleCompletedState error: ' + e.message);
      }  
   }
};
ChromeBrowserActionManagerProto = function() {};
ChromeBrowserActionManagerProto.prototype=
{
    _mBrowserActionConfig: {},

    init: function() 
    {
        var _self = this,
            installerData= ChromeInstallManager.getInstallerData();
        if (installerData)
        {
          var browserActionConfig= ((installerData && 
                                     installerData.currentInstall && 
                                     installerData.currentInstall.installerData && 
                                     installerData.currentInstall.installerData.NanoCoreDefines) ? installerData.currentInstall.installerData.NanoCoreDefines.browserActionConfig : null);
            if(browserActionConfig)
            {
                chrome.browserAction.setBadgeBackgroundColor({color: browserActionConfig.badgeColor});
                if( browserActionConfig.navUrl)
                {
                    chrome.browserAction.onClicked.addListener(function(tab)
                    {
                        if(ChromeMailNotifications && browserActionConfig.navUrl === "mailNotifyConfig")
                        {
                            ChromeMailNotifications.reportClick(true /*isBrowserAction*/);
                            ChromeMailNotifications.navToMailSite(tab.incognito);
                        }
                        else if(browserActionConfig.newTab)
                        {
                            chrome.tabs.create({url: browserActionConfig.navUrl}, function(tab){});
                        }
                        else
                        {
                            ChromeNavigationManager.navigateTab(tab.id, {url : browserActionConfig.navUrl}, true);
                        }
                    });
                }
            }
        }
    },
};

chrome.runtime.onConnect.addListener(function(port)
{
   // this function handles connects from the appbox
   var timeCur= (new Date()).getTime(),
       activeTab= ChromeScriptInjector._mActiveTabs[ChromeScriptInjector._mActiveWindowID];

   ChromeScriptInjector._mEverGotAppBoxScript= true;

   if (activeTab)
   {
      ChromeCallHandler.detachTab(activeTab.id, false /*detachPagePorts*/, true /*detachAppBoxPorts*/);
      ChromeCallHandler.attachPort(activeTab.tabId, timeCur, port, (activeTab.url.indexOf("http") !== 0), true /*isAppBox*/);
   }
   else
   {
      ChromeScriptInjector.ensureActiveTab(function()
      {
         var activeTab= ChromeScriptInjector._mActiveTabs[ChromeScriptInjector._mActiveWindowID];
         if (activeTab)
         {
            ChromeCallHandler.detachTab(activeTab.id, false /*detachPagePorts*/, true /*detachAppBoxPorts*/);
            ChromeCallHandler.attachPort(activeTab.tabId, timeCur, port, (activeTab.url.indexOf("http") !== 0), true /*isAppBox*/);
         }
      });
   }
});

chrome.runtime.onMessage.addListener(function(msg, sender, replyFunc)
{
   if (msg.msg)
   {
      switch (msg.msg)
      {
         case "verifyInstalled":
            replyFunc(
            { 
               installed: true, 
               pluginIDs: ChromeScriptInjector.getAllPluginIDsAsString(),
               uninstallBeaconURL: ChromeTrackingManager.getBeaconURL(msg.pluginID, "uninstall"),
               nanoInstallTime: window.localStorage.getItem('ynano_installTime')
            });
            break;
         case "getInjectInfo":
            ChromeScriptInjector.getInjectInfo(replyFunc);
            break;
         case "readyForScript":
            if (sender.tab)
                ChromeCallHandler.setTabReadyForScript(sender.tab.id, msg.ts);
            break;
         case "getPushDownInfo":
            replyFunc(ChromeInstallManager.getPushDownReply());
            break;
         case "getAppBoxInfo":
            ChromeScriptInjector.getAppBoxInfo(replyFunc);
      	    break;
         case "getAppBoxScript":
            ChromeScriptInjector.getAppBoxScript(replyFunc);
      	    break;
      	 case "sawPriorUninstall":
      	    ChromePluginCallHandler.priorUninstallDetected(ChromeScriptInjector._mActiveTabs[ChromeScriptInjector._mActiveWindowID].tabId);
      	    break;
      	 case "pageParamsResult":
            ChromeScriptInjector.handlePageParams(msg.params, sender.tab, false /*fromTabOpen*/);
      	    break;
         case "getNewTabInfo":
            replyFunc( { success: false });
      	    //ChromeScriptInjector.getNewTabInfo(replyFunc);
      	    break;
      }
   }
});

chrome.runtime.onMessageExternal.addListener(function(msg, sender, replyFunc)
{
   if (msg.msg && (msg.msg === "getAllStorage"))
   {
      var resp= {};
      for (var mem in window.localStorage)
      {
         if (mem && (mem.indexOf("ynano_") !== -1))
         {
            resp[mem]= window.localStorage[mem];

         }
      }

      replyFunc(resp);
      return true;
   }
});

chrome.extension.onRequest.addListener(function(request, sender, sendResponse)
{
   switch (request.requestType)
   {
      case "getBandContentInject":
         sendResponse(
         { 
            injectScript: ChromeScriptInjector._mBandInjectScript[request.tabId],
            tabId: request.tabId
         });
         break;
      case "sendClickStreamPing":
         var plugins= ChromeScriptInjector.getPlugins(ChromeScriptInjector._mInUnitTests);
         if (plugins)
         {
            for (var pluginOn= 0, length= plugins.length; pluginOn < length; pluginOn++)
            {
               var pluginCur= plugins[pluginOn];
               if (pluginCur.clickStreamHandler)
                  pluginCur.clickStreamHandler.onContentLoaded(request.href, request.host, request.referrer);
            }
         }
         // fallthru
      default:
         sendResponse({});
         break;
   };
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) 
{
   if ((tab.id === ChromeScriptInjector._mLastNewTabID) && (tab.url !== 'chrome://newtab/'))
   	  ChromeScriptInjector._mLastNewTabID= -1;
	  
   // protect against navigations that are really '#' hash links
   if (ChromeScriptInjector._mTabNavState[tabId] && 
       (ChromeScriptInjector._mTabNavState[tabId].justAttached ||
        (ChromeScriptInjector._mTabNavState[tabId].urlTarget === tab.url)))
   {
      if (ChromeScriptInjector._mTabNavState[tabId].wasNewTabURL !== tab.url)
      {
         //console.log('--== handling onUpdated for (' + tabId + ', ' + changeInfo.status + '): ' + tab.url);
         ChromeScriptInjector.handleTabUpdate(changeInfo.status, tab);

         if (changeInfo.status === 'complete')
         {
            //console.log('--== DELETING _mTabNavState[' + tabId + ']');
            delete ChromeScriptInjector._mTabNavState[tabId];
         }
      }
   }
   else
   {
      if (!ChromeScriptInjector._mTabNavState[tabId])
         ChromeScriptInjector._mTabNavState[tabId]= {};

      //console.log('--== NOT HANDLING onUpdated FOR (' + tabId + ', ' + changeInfo.status + '): ' + tab.url + ' vs. ' + ChromeScriptInjector._mTabNavState[tabId].urlTarget);

      ChromeScriptInjector._mTabNavState[tabId].lastUpdateDenied= 
      {
         timeStamp: (new Date()).getTime(),
         status: changeInfo.status,
         url: tab.url
      };
   }
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo)
{
   ChromeCallHandler.detachTab(tabId, true /*detachPagePorts*/, true /*detachAppBoxPorts*/);
});

chrome.tabs.onCreated.addListener(function(tab)
{
   if (ChromeScriptInjector.hasReadFeed())
      ChromeScriptInjector.handlePageParams(null, tab, true /*fromTabOpen*/); // in the event this has not been handled yet to ensure we get an override value.  Otherwise will be a no-op
   /* removing new tab functionality
   if (tab.url == 'chrome://newtab/')
   {
   	  ChromeScriptInjector._mLastNewTabID= tab.id;

      // TODO: this logic is an alternative of using newtab.html/newtab.js.   
      var prefNewTabOvr= (!ChromeBucketManager.checkPermission("defaultTab")).toString();
      if (prefNewTabOvr)
         prefNewTabOvr= prefNewTabOvr.toLowerCase();

      if (prefNewTabOvr && ((prefNewTabOvr == 'true') || (prefNewTabOvr == '1')))
      {                
         var _url= window.localStorage.getItem('ynano_pref_newTabUrl_' + ChromeTrackingManager._mNanoUUID);
         if (_url && (_url !== '{{DYNAMIC}}') && (_url.indexOf("http") === 0))
         {
            window.localStorage.setItem('ynano_pref_NewTabEverShown_' + ChromeTrackingManager._mNanoUUID, 'true');

            chrome.tabs.create(
            { 
               index: tab.index, 
               url: _url 
            });
            chrome.tabs.remove(tab.id);
         }
      }
   }
   */
});

chrome.windows.onFocusChanged.addListener(function(winId)
{
   if ((winId !== -1) && ChromeScriptInjector._mActiveTabs[winId])
   {
      ChromeScriptInjector._mActiveWindowID= winId;
   }
   
   ChromePopupManager.closeAllPopups(false /*force*/);
});

chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo)
{  
   // keep track of which tab is currently active
   chrome.windows.get(selectInfo.windowId, function(windowCur)
   {
      if (windowCur && (windowCur.type === "normal"))
      {
         try
         {
            chrome.tabs.get(tabId, function(tabCur)
            {
               if (tabCur)
               {
                  ChromeScriptInjector._mActiveWindowID= selectInfo.windowId;
                  ChromeScriptInjector._mActiveTabs[selectInfo.windowId]=
                  {
                     tabId: tabId,
                     url: tabCur.url
                  };

                  var plugins= ChromeScriptInjector.getPlugins(ChromeScriptInjector._mInUnitTests);
                  if (plugins)
                  {
                     var prevActiveTabID= ChromePluginManager._mPrevActiveTabID[selectInfo.windowId];
                     if (prevActiveTabID)
                     {
                        for (var pluginOn= 0, length= plugins.length; pluginOn < length; pluginOn++)
                        {
                           if (ChromePluginManager.isPluginInstalled(plugins[pluginOn].pluginID) &&
                               ChromeScriptInjector.pluginSupportedOnBrowser(plugins[pluginOn]))
                           {
                              callObj= {};
                              callObj.pluginID= plugins[pluginOn].pluginID;
                              callObj.eventFn= "onPageIdle";
                              ChromeCallHandler.fireEventToTab(prevActiveTabID, callObj);
                           }
                        }
                     }
                  
                     for (var pluginOn= 0, length= plugins.length; pluginOn < length; pluginOn++)
                     {
                        if (ChromePluginManager.isPluginInstalled(plugins[pluginOn].pluginID) &&
                            ChromeScriptInjector.pluginSupportedOnBrowser(plugins[pluginOn]))
                        {
                           callObj= {};
                           callObj.pluginID= plugins[pluginOn].pluginID;
                           callObj.eventFn= "onPageActive";
                           ChromeCallHandler.fireEventToTab(tabId, callObj);
                        }
                     }

                     ChromeContextMenuManager.addContextMenusForTab(tabId);

                     ChromePluginManager._mPrevActiveTabID[selectInfo.windowId]= tabId;
                  }
                }
            });
         }
         catch (e)
         {
            // it's possible for the tab to not exist at this point (D17784), just silently ignore an error
         }
      }
   });
});

if (!inRestrictedPermissionsMode())
{

chrome.cookies.onChanged.addListener(function(cookieChangeInfo)
{
   if (cookieChangeInfo.cause == 'explicit')
   {  
      if ((cookieChangeInfo.cookie.name == 'Y') && (cookieChangeInfo.cookie.domain.indexOf('.yahoo.com') != -1))
         ChromeCookieManager.getBlindYIDFromYCookie(cookieChangeInfo.cookie.value);

      if ((cookieChangeInfo.cookie.name == 'Y') && (cookieChangeInfo.cookie.domain.indexOf('.yahoo.com') != -1))
         ChromeTrackingManager.setBCookie(cookieChangeInfo.cookie.value);
         
      var plugins= ChromeCookieManager.getPluginIDsForCookie(cookieChangeInfo.cookie.name, cookieChangeInfo.cookie.domain);
      if (plugins)
      {
         for (var plugin in plugins)
         {
            var eventObj= {};
            eventObj.pluginID= plugin;
            eventObj.eventFn= "onCookieChange";
            eventObj.eventPv= 
            {
               cookieName: cookieChangeInfo.cookie.name, 
               cookieVal: cookieChangeInfo.cookie.value, 
               cookieDomain: cookieChangeInfo.cookie.domain,
               timeStamp: (new Date()).getTime()
            };
            
            ChromeCallHandler.fireEventToAllTabs(eventObj, null, false);
         }
      }
   }
});

}

chrome.webNavigation.onBeforeNavigate.addListener(function(navInfo)
{
   ChromeResourcePreloader.cancelActivePreloads();

   if (navInfo.frameId > 0)
   {
      if (ChromeScriptInjector._mTabNavState[navInfo.tabId] && (navInfo.url === ChromeScriptInjector._mTabNavState[navInfo.tabId].urlTarget))
      {
         //console.log('--** ignoring next update from onBeforeNav (' + navInfo.tabId + '): ' + navInfo.url);     
         ChromeScriptInjector._mTabNavState[navInfo.tabId].urlTarget= null;      
      }

      ChromePopupManager.checkForPopupNav(navInfo);
   }
   else
   {
      //console.log('--== setting nav onBeforeNavigate details URL (' + navInfo.tabId + '): ' + navInfo.url);
      ChromeScriptInjector._mTabNavState[navInfo.tabId]=
      {
         urlTarget: navInfo.url
      };

      ChromeScriptInjector._mDOMStatusPrev[navInfo.tabId]= "";      

      ChromeCallHandler.clearTabReadyForScript(navInfo.tabId);

      ChromeCallHandler.postMessageToTab(navInfo.tabId, { closeAppBox: true });
   }

   var hookID= (navInfo.frameId ? ChromePopupManager.findPopupHookId(navInfo.tabId, navInfo.frameId) : null);
   if (!navInfo.frameId || hookID)
   {
      var plugins= ChromeScriptInjector.getPlugins(ChromeScriptInjector._mInUnitTests);
      if (plugins)
      {
         for (var pluginOn in plugins)
         {
            var pluginCur= plugins[pluginOn];
            if (pluginCur)
            {
               var eventObj= {};
               eventObj.pluginID= pluginCur.pluginID;
               eventObj.eventFn= "onBeforeNavigate";
               eventObj.eventPv= 
               {
                  tabId: navInfo.tabId,
                  URL: navInfo.url
               };

               if (navInfo.frameId > 0)
               {
                  eventObj.eventPv.hookID= eventObj.hookID= hookID;
               }

               ChromeCallHandler.fireEventToTab(navInfo.tabId, eventObj);
            }
         }
      }
   }
});

chrome.webNavigation.onErrorOccurred.addListener(function(details)
{
   if (!details || !details.tabId)
      return;
      
   var plugins= ChromeScriptInjector.getPlugins(ChromeScriptInjector._mInUnitTests);
   if (plugins)
   {
      for (var pluginOn in plugins)
      {
         var pluginCur= plugins[pluginOn];
         if (pluginCur)
         {
            var eventObj= {};
            eventObj.pluginID= pluginCur.pluginID;
            eventObj.eventFn= "onNavigateError";
            eventObj.eventPv= 
            {
               errString: details.error
            };

            if (details.frameId > 0)
            {
               eventObj.eventPv.hookID= eventObj.hookID= ChromePopupManager.findPopupHookId(details.tabId, details.frameId);
            }
            
            ChromeCallHandler.fireEventToTab(details.tabId, eventObj);
         }
      }
   }     
});

chrome.webNavigation.onCommitted.addListener(function(navInfo)
{
   if (navInfo.frameId === 0)
   {
      var timeCur= (new Date()).getTime();

      if (ChromeScriptInjector._mTabNavState[navInfo.tabId])
      {
         //console.log('--== setting nav onCommitted details URL (' + navInfo.tabId + '): ' + navInfo.url);
         ChromeScriptInjector._mTabNavState[navInfo.tabId].urlTarget= navInfo.url;

         if (ChromeScriptInjector._mTabNavState[navInfo.tabId].lastUpdateDenied &&
            (ChromeScriptInjector._mTabNavState[navInfo.tabId].lastUpdateDenied.url === navInfo.url) &&
            ((timeCur - ChromeScriptInjector._mTabNavState[navInfo.tabId].lastUpdateDenied.timeStamp) < 2000))
         {
            chrome.tabs.get(navInfo.tabId, function(tab)
            {
               if (tab)
               {
                  // theoretical fix for D15570- it seems sometimes the nav can complete before we grab the tab data here.
                  if (ChromeScriptInjector._mTabNavState[navInfo.tabId] && ChromeScriptInjector._mTabNavState[navInfo.tabId].lastUpdateDenied)
                  {
                     //console.log('--== handling denied update for (' + navInfo.tabId + ', ' + ChromeScriptInjector._mTabNavState[navInfo.tabId].lastUpdateDenied.status + '): ' + navInfo.url); 
                      ChromeScriptInjector.handleTabUpdate(ChromeScriptInjector._mTabNavState[navInfo.tabId].lastUpdateDenied.status, tab);
                  }
               }
            });
         }
      }
   }
   else
   {
      if (ChromeScriptInjector._mTabNavState[navInfo.tabId] && (navInfo.url === ChromeScriptInjector._mTabNavState[navInfo.tabId].urlTarget))
      {
         //console.log('--** ignoring next update from onCommitted (' + navInfo.tabId + '): ' + navInfo.url);
         ChromeScriptInjector._mTabNavState[navInfo.tabId].urlTarget= null;
      }
   }
});

chrome.webRequest.onBeforeRequest.addListener(function(reqInfo)
{
   // this code is needed to catch navigations that occur in the appbox (browserAction) popup
   if ((reqInfo.tabId === -1) && (reqInfo.frameId > 0) && (reqInfo.type === "sub_frame"))
   {
      var activeTabId= ChromeScriptInjector._mActiveTabs[ChromeScriptInjector._mActiveWindowID].tabId;
      ChromePopupManager.checkForPopupNavInAppBox(reqInfo, activeTabId);

      var hookID= ChromePopupManager.findPopupHookId(activeTabId, reqInfo.frameId);
      if (hookID)
      {
         var plugins= ChromeScriptInjector.getPlugins(ChromeScriptInjector._mInUnitTests);
         if (plugins)
         {
            for (var pluginOn in plugins)
            {
               var pluginCur= plugins[pluginOn];
               if (pluginCur)
               {
                  var eventObj= {};
                  eventObj.pluginID= pluginCur.pluginID;
                  eventObj.eventFn= "onBeforeNavigate";
                  eventObj.eventPv= 
                  {
                     tabId: activeTabId,
                     URL: reqInfo.url
                  };

                  if (reqInfo.frameId > 0)
                  {
                     eventObj.eventPv.hookID= eventObj.hookID= hookID;
                  }

                  ChromeCallHandler.fireEventToTab(activeTabId, eventObj);
               }
            }
         }
      }
   }
},
{
   urls: ["<all_urls>"]
},
   ["blocking"]
);

function getDomainFromURL(url)
{
   url = url || "";
   var domainStartPos= url.indexOf("://"),
       domainEndPos= ((domainStartPos !== -1) ? url.indexOf("/", domainStartPos + 3) : -1),
       strDomain= ((domainStartPos !== -1) ? ((domainEndPos > domainStartPos) ? url.substring(domainStartPos + 3, domainEndPos) : url.substring(domainStartPos + 3)) : null);

   return strDomain;
}

chrome.webRequest.onHeadersReceived.addListener(function(webInfo)
{  
   var returnHeader= false,
   	   newTabDomain= getDomainFromURL(window.localStorage.getItem('ynano_pref_newTabUrl_' + ChromeTrackingManager._mNanoUUID));

   function mungeCSP(type, valueCSP, injectDomains)
   {
      var typeBeginPos= valueCSP.indexOf(type),
          typeEndPos= valueCSP.indexOf(";", typeBeginPos),
          selfPos= valueCSP.indexOf("'self'", typeBeginPos),
          unsafeInlinePos= valueCSP.indexOf("'unsafe-inline'", typeBeginPos),
          startDirectives= " ", typeVal;

      if (typeBeginPos !== -1)
      {
         if (typeEndPos === -1)
            typeEndPos= valueCSP.length;
                        
         typeBeginPos += type.length;

         if ((selfPos === -1) || (selfPos > typeEndPos))
            startDirectives += "'self' ";
         if ((unsafeInlinePos === -1) || (unsafeInlinePos > typeEndPos))
            startDirectives += "'unsafe-inline' ";

         typeVal= valueCSP.substring(typeBeginPos + 1, typeEndPos);
         if (typeVal !== "*")
            valueCSP= (valueCSP.substr(0, typeBeginPos) + startDirectives + typeVal + " " + injectDomains + ";" + valueCSP.substr(typeEndPos + 1));
      }

      return valueCSP;
   }

   if (ChromeInstallManager && (ChromeInstallManager.shouldMungeCSP() || newTabDomain))
   {   
      if (webInfo.responseHeaders)
      {
         for (var responseOn= 0, responseLim= webInfo.responseHeaders.length; responseOn < responseLim; responseOn++)
         {
            var nameCur= webInfo.responseHeaders[responseOn].name.toLowerCase();
            switch (nameCur)
            {
               case "x-frame-options":
                  if ((webInfo.tabId === ChromeScriptInjector._mLastNewTabID) && (getDomainFromURL(webInfo.url) === newTabDomain))
                  {
                     webInfo.responseHeaders[responseOn].value= "";
                     returnHeader= true;
                  }
                  break;
               case "content-security-policy":
               case "x-content-security-policy":
               case "x-webkit-csp":
               {
                  if (ChromeInstallManager.shouldMungeCSP())
                  {
                     var nanoDefines= ChromeInstallManager.getNanoDefines();
                     if (nanoDefines.cspInjectDomains)
                     {
                        var valueCSP= webInfo.responseHeaders[responseOn].value,
                            valueCSPOrig= valueCSP,
                            injectDomains= nanoDefines.cspInjectDomains.join(" ");

                        valueCSP= mungeCSP("script-src", valueCSP, injectDomains);
                        valueCSP= mungeCSP("style-src", valueCSP, injectDomains);
                        valueCSP= mungeCSP("object-src", valueCSP, injectDomains);
						
                        webInfo.responseHeaders[responseOn].value= valueCSP;

                        if (valueCSP !== valueCSPOrig)
                        {
                           returnHeader= true;
                        }
                     }
                  }
               }
            }
         }
      }
   }

   if (returnHeader)
   {
      return { responseHeaders: webInfo.responseHeaders };
   }
},
{
   urls: ["<all_urls>"]
},
   ["responseHeaders", "blocking"]
);

chrome.webNavigation.onTabReplaced.addListener(function(navInfo)
{
   chrome.tabs.get(navInfo.tabId, function(tab)
   {
      if (tab)
      {
         ChromeScriptInjector.handleTabUpdate("complete", tab);
      }
   });
});

chrome.webNavigation.onDOMContentLoaded.addListener(function(navInfo)
{
   if (navInfo.frameId > 0)
      return;
      
   function afterGotTab(tab)
   {
      if (tab)
      {
         var timeCur= (new Date()).getTime(),
             justAttached= false;

         if (!ChromeCallHandler._mTabPorts[tab.id])
         {
            ChromeCallHandler.attachTab(tab.id);
            
            ChromeScriptInjector.handleTabUpdate('loading', tab, true /*noDetach*/);
            ChromeScriptInjector.handleTabUpdate('complete', tab);
         }
      }
   }

   if (navInfo.tabId === -1)
   {
      chrome.tabs.getSelected(function(tabSel)
      {
         if (!ChromeScriptInjector._mTabNavState[tabSel.id])
            ChromeScriptInjector._mTabNavState[tabSel.id]= {};

         ChromeScriptInjector._mTabNavState[tabSel.id].wasNewTabURL= tabSel.url;
            
         window.setTimeout(function() { afterGotTab(tabSel); }, 500);
      });
   }
   else
   {
      try
      {
         chrome.tabs.get(navInfo.tabId, function(tab)
         {
            window.setTimeout(function() { afterGotTab(tab); }, 500);
         });
      }
      catch (e)
      {
         // avoid spurious errors in the log
      }
   }
});



/*chrome.management.onDisabled.addListener(function(extInfo)
{
   var nanoDefines= ChromeInstallManager.getNanoDefines();
   if (extInfo.name === nanoDefines.extensionName)
      ChromeTrackingManager.sendBeaconForAllPlugins('uninstall');
}); 

chrome.management.onUninstalled.addListener(function(extInfo)
{
   var nanoDefines= ChromeInstallManager.getNanoDefines();
   if (extInfo.name === nanoDefines.extensionName)
   {
      ChromeTrackingManager.sendBeaconForAllPlugins('uninstall');

      for (var storageCur in window.localStorage)
      {
         if (storageCur.indexOf('ynano_') == 0)
            window.localStorage.removeItem(storageCur);
      }
   }
});*/


ChromeDebugManager= new ChromeDebugManagerProto();
ChromeTrackingManager= new ChromeTrackingManagerProto();
ChromeInstallManager= new ChromeInstallManagerProto();
ChromeCookieManager= new ChromeCookieManagerProto();
ChromePluginManager= new ChromePluginManagerProto();
ChromeNavigationManager= new ChromeNavigationManagerProto();
Base64Encoder= new Base64EncoderProto();
ChromeResourcePreloader= new ChromeResourcePreloaderProto();
ChromeImageCapture= new ChromeImageCaptureProto();
//ChromeHistoryManager= new ChromeHistoryManagerProto();
ChromePerfMonitor= new ChromePerfMonitorProto();
ChromeContextMenuManager= new ChromeContextMenuManagerProto();
ChromeIFrameManager= new ChromeIFrameManagerProto();
ChromePopupManager= new ChromePopupManagerProto();
ChromeCallHandler= new ChromeCallHandlerProto();
ChromePluginCallHandler= new ChromePluginCallHandlerProto();
ChromePageCallHandler= new ChromePageCallHandlerProto();
ChromePluginHistoryManager= new ChromePluginHistoryManagerProto();
ChromeScriptInjector= new ChromeScriptInjectorProto();
ChromeBrowserActionManager=  new ChromeBrowserActionManagerProto();
ChromeMailNotifications= ChromeMailNotificationsProto ? new ChromeMailNotificationsProto(): null;
ChromeBucketManager= ChromeBucketManagerProto ? new ChromeBucketManagerProto() : null;
    


if (typeof(startUnitTests) == "undefined")
{
   ChromeScriptInjector.preFetchFeed();
}
else
{
   // global-ize these so that the specrunner can see these
   window.ChromeDebugManager= ChromeDebugManager;
   window.ChromeTrackingManager= ChromeTrackingManager;
   window.ChromeInstallManager= ChromeInstallManager;
   window.ChromeCookieManager= ChromeCookieManager;
   window.ChromePluginManager= ChromePluginManager;
   window.ChromeNavigationManager= ChromeNavigationManager;
   window.Base64Encoder= Base64Encoder;
   window.ChromeResourcePreloader= ChromeResourcePreloader;
   window.ChromeImageCapture= ChromeImageCapture;
   //window.ChromeHistoryManager= ChromeHistoryManager;
   window.ChromePerfMonitor= ChromePerfMonitor;
   window.ChromeContextMenuManager= ChromeContextMenuManager;
   window.ChromeIFrameManager= ChromeIFrameManager;
   window.ChromePopupManager= ChromePopupManager;
   window.ChromeCallHandler= ChromeCallHandler;
   window.ChromePluginCallHandler= ChromePluginCallHandler;
   window.ChromePageCallHandler= ChromePageCallHandler;
   window.ChromePluginHistoryManager= ChromePluginHistoryManager;
   window.ChromeScriptInjector= ChromeScriptInjector;
   window.ChromeBrowserActionManager= ChromeBrowserActionManager;
   window.ChromeMailNotifications= ChromeMailNotifications;
   window.ChromeBucketManager= ChromeBucketManager;
   
   startUnitTests();
}


} // initWithSecurity

var ChromeDebugManager= null,
    ChromeTrackingManager= null,
    ChromeInstallManager= null,
    ChromeCookieManager= null,
    ChromePluginManager= null,
    ChromeNavigationManager= null,
    Base64Encoder= null,
    ChromeResourcePreloader= null,
    ChromeImageCapture= null,
    //ChromeHistoryManager= null,
    ChromePerfMonitor= null,
    ChromeContextMenuManager= null,
    ChromeIFrameManager= null,
    ChromePopupManager= null,
    ChromeCallHandler= null,
    ChromePluginCallHandler= null,
    ChromePageCallHandler= null,
    ChromePluginHistoryManager= null,
    ChromeScriptInjector= null,
    ChromeBrowserActionManager= null,
    ChromeMailNotifications= null,
    ChromeBucketManager= null;

function initNano()
{
   /* this check is needed because we can start to inject before the body of the document is ready */
   if (document.body)
   {
      initWithSecurity();
   }
   else
      window.setTimeout(initNano, 100);
}

window.setTimeout(initNano, 5);
