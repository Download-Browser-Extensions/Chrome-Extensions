

NanoInjectHandlerProto= function() {};
NanoInjectHandlerProto.prototype= 
{ 	
   _mIntReadyMsg: null,
   _mAryCodeInjected: [],
   _mWaitStart: null,
   _mLastInstallVerifyTS: 0,
   	
   init: function()
   {
      var _self= this,
          timerTryInitAgain= window.setTimeout(function() { var self= _self; _self= null; self.init(); self= null; }, 200);

      chrome.runtime.sendMessage({ "msg": "verifyInstalled" }, function(obj)
      {
         if (obj && (typeof(obj.pluginIDs) === "string"))
         {
            window.clearTimeout(timerTryInitAgain);

            var intAddInstalledDiv= null;
            intAddInstalledDiv= window.setInterval(function()
            {
               if (document.body)
               {
                  window.clearInterval(intAddInstalledDiv);
				  
                  var isInstalledNode= document.createElement('div');
                  isInstalledNode.id = 'ynano_installed_' + obj.pluginIDs;
                  isInstalledNode.style.cssText= 'display:none';
                  document.body.appendChild(isInstalledNode);

                  var activeURL= document.location.href,
                      domainStartPos= activeURL.indexOf("://"),
                      domainEndPos= activeURL.indexOf("/", domainStartPos + 3);

                  if ((activeURL.indexOf("yahoo.com") !== -1) && (domainStartPos !== -1) && (domainEndPos !== -1) && (activeURL.indexOf("yahoo.com") < domainEndPos))
                  {
                     var triesRemain= 20,
                         intParamCheck= window.setInterval(function()
                     {
                        console.log('checking for page params');

                        var paramTag= document.getElementById("yset_params"),
                            paramRet= (paramTag ? paramTag.getAttribute("data-yset") : null);
                        
                        if (paramRet)
                        { 
                           console.log('sending page param result: ' + paramRet);
                           chrome.runtime.sendMessage(
                           {
                              "msg": "pageParamsResult",
                              "params": paramRet
                           });
                        }

                        if (paramRet || (--triesRemain == 0))
                        {
                           console.log('no longer looking for page params');
                           window.clearInterval(intParamCheck);
                        }
                     }, 500);
                  }
               }
            }, 100);		
         }
      });
	  
      chrome.runtime.sendMessage({ "msg": "getInjectInfo" }, function(injectInfo)
      {
         if (_self && injectInfo)
         {	 
            _self.listenForInjectCode();

            if (injectInfo.delayInfo.forceDelayBeforeMsec)
               window.setTimeout(function() { _self.waitToSendReadyMsg(injectInfo.delayInfo); _self= injectInfo= null; }, injectInfo.delayInfo.forceDelayBeforeMsec);
            else
               _self.waitToSendReadyMsg(injectInfo.delayInfo);

            if (injectInfo.needDetectPluginID)
            {
               var _self2= _self;

               _self.needDetectPluginID= injectInfo.needDetectPluginID;
               _self.uninstallBeaconURL= injectInfo.uninstallBeaconURL;

               _self.checkForPriorUninstall();

               _self.checkDisableInt= window.setInterval(function() { _self2.checkForDisable(); }, 1000);
            }
         }
      });
   },

   waitToSendReadyMsg: function(injectDelayInfo)
   {
      var _self= this,
          timeNow= (new Date()).getTime();

      if (!this._mWaitStart)
      {
         this._mWaitStart= timeNow;
      }	  
	  
      if (top.document.body && (!injectDelayInfo || !injectDelayInfo.readyStateWait || (top.document.readyState === injectDelayInfo.readyStateWait) || (top.document.readyState === "complete")))
      {
         if (injectDelayInfo && injectDelayInfo.forceDelayAfterMsec)
         {
            window.setTimeout(function() { _self.listenForInjectCode(); _self= null; }, injectDelayInfo.forceDelayAfterMsec);
         }
         else
         {
            if (_self._mIntReadyMsg)
            {
               window.clearInterval(_self._mIntReadyMsg);
               _self._mIntReadyMsg= null;
            }

            this._mIntReadyMsg= window.setInterval(this.sendReadyMessage, 200);
            this.timeoutInterval("_mIntReadyMsg", 5000);
         }
      }
      else if ((timeNow - this._mWaitStart) < 30000)
      {
         //console.error('waiting...' + top.document.readyState);
         window.setTimeout(function() { _self.waitToSendReadyMsg(injectDelayInfo); _self= null; }, 200);
      }
      else
      {
         if (_self._mIntReadyMsg)
         {
            window.clearInterval(_self._mIntReadyMsg);
            _self._mIntReadyMsg= null;
         }

         this._mIntReadyMsg= window.setInterval(this.sendReadyMessage, 200);
         this.timeoutInterval("_mIntReadyMsg", 5000);
      }
   },

   listenForInjectCode: function()
   {
      //console.error('saw complete:' + top.document.readyState);
      var _self= this;
      chrome.runtime.onMessage.addListener(function(msg, sender, fnRet)
      {
         if (sender.id === chrome.runtime.id)
         {
            var didInject= false;
			   
            if (_self._mIntReadyMsg)
            {
               window.clearInterval(_self._mIntReadyMsg);
               _self._mIntReadyMsg= null;
            }

            if (_self._mAryCodeInjected.indexOf(msg.codeID) === -1)
            {
               _self._mAryCodeInjected.push(msg.codeID);
				  
               eval(msg.code);
				  
               didInject= true;
            }
			   
            if (fnRet)
            {
               fnRet(didInject);
            } 
         }
      });

   },

   sendReadyMessage: function()
   {
      var timeCur= (new Date()).getTime();

      chrome.runtime.sendMessage(
      { 
         "msg": "readyForScript",
         "ts": timeCur
      });
   },

   timeoutInterval: function(interval, timeout)
   {
       var _self = this;
       window.setTimeout(function()
       {
           window.clearInterval(_self[interval]);
           _self[interval] = null;
       }, timeout);
   },

   checkForDisable: function()
   {
      var _self= this,
          timeCur= (new Date()).getTime();

      try
      {
         chrome.runtime.sendMessage(
         { 
            "msg": "verifyInstalled",
            "pluginID": this.needDetectPluginID
         }, function(ret)
         {
            _self.uninstallBeaconURL= ret.uninstallBeaconURL;
            _self._mLastInstallVerifyTS= (new Date()).getTime();
            _self= timeCur= null;

            // the install time can be changed if we detect reinstall after the fact.  Ensure we 
            if ((typeof(YAHOO) === "object") && YAHOO.NanoBridge && YAHOO.NanoBridge.NanoProps)
               YAHOO.NanoBridge.NanoProps.nanoInstallTime= ret.nanoInstallTime;
         });
      }
      catch (e)
      {
      }

      if ((this._mLastInstallVerifyTS > 0) && ((timeCur - this._mLastInstallVerifyTS) > 3000))
      {
         window.clearTimeout(this.checkDisableInt);
		 
         var needDetectPluginID= this.needDetectPluginID,
             uninstallBeaconURL= this.uninstallBeaconURL,	 
             waitMsec= Math.floor(Math.random() * 5000);

         window.setTimeout(function() { YAHOO.NanoBridge.recordUninstall(needDetectPluginID, uninstallBeaconURL); }, waitMsec);
      }   
   },

   checkForPriorUninstall: function()
   {
      if ((typeof(YAHOO) !== "object") || (typeof(YAHOO.NanoBridge) !== "object"))
      {
         var _self= this;
         window.setTimeout(function() { _self.checkForPriorUninstall(); }, 500);
      }
      else
      {
         YAHOO.NanoBridge.checkForPriorUninstall(function()
         {
            chrome.runtime.sendMessage({ "msg": "sawPriorUninstall" });
         });
      }
   }   
};

if (top === window)
{
   var NanoInjectHandlerProto= new NanoInjectHandlerProto();
   NanoInjectHandlerProto.init();
}

