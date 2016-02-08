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

var UI = {

	ICON_BLUE: {
		'19': ext.getURL('icons/blue-19.png'),
		'38': ext.getURL('icons/blue-38.png')
	},
	ICON_GREEN: {
		'19': ext.getURL('icons/green-19.png'),
		'38': ext.getURL('icons/green-38.png')
	},
	ICON_GRAY: {
		'19': ext.getURL('icons/gray-19.png'),
		'38': ext.getURL('icons/gray-38.png')
	},

	nextMenuId: 0,
	browserActionTitle: ext.i18n.getMessage('name'),

	updateTabIconAndContextMenu: function (tab, reloadFrameData) {
		if (reloadFrameData) {
			framesMap.reloadFrameData(tab);
		}
		UI.updateTabIcon(tab);
		UI.updateTabContextMenu(tab);
	},

	/**
	 * Update icon for tab
	 * @param tab Tab
	 * @param options Options for icon or badge values
	 */
	updateTabIcon: function (tab, options) {

		var icon, badge;

		if (options) {

			icon = options.icon;
			badge = options.badge;

		} else {

			var blocked;
			var disabled;

			var tabInfo = framesMap.getFrameInfo(tab);
			if (tabInfo.adguardDetected) {
				disabled = tabInfo.documentWhiteListed;
				blocked = "";
			} else {
				disabled = tabInfo.applicationFilteringDisabled;
				disabled = disabled || tabInfo.urlFilteringDisabled;
				disabled = disabled || tabInfo.documentWhiteListed;

				if (!disabled && userSettings.showPageStatistic()) {
					blocked = tabInfo.totalBlockedTab.toString();
				} else {
					blocked = "0";
				}
			}

			badge = blocked == "0" ? "" : blocked;

			if (disabled) {
				icon = this.ICON_GRAY;
			} else if (tabInfo.adguardDetected) {
				icon = this.ICON_BLUE;
			} else {
				icon = this.ICON_GREEN;
			}
		}

		ext.browserAction.setBrowserAction(tab, icon, badge, "#555", this.browserActionTitle);
	},

	updateTabIconAsync: Utils.debounce(function (tab) {
		UI.updateTabIcon(tab);
	}, 250),

	/**
	 * Update context menu for tab
	 * @param tab Tab
	 */
	updateTabContextMenu: function (tab) {
		ext.contextMenus.removeAll();
		if (userSettings.showContextMenu()) {
			UI.customizeContextMenu(tab);
		}
	},

	changeApplicationFilteringDisabled: function (disabled) {
		antiBannerService.changeApplicationFilteringDisabled(disabled);
		this._getCurrentTab(function (tab) {
			this.updateTabIconAndContextMenu(tab, true);
		}.bind(this));
	},

	whiteListCurrentTab: function () {
		this._getCurrentTab(function (tab) {

			var tabInfo = framesMap.getFrameInfo(tab);
			antiBannerService.whiteListFrame(tabInfo);

			if (framesMap.isTabAdguardDetected(tab)) {
				var domain = UrlUtils.getHost(tab.url);
				adguardApplication.addRuleToApp("@@//" + domain + "^$document", function () {
					this._reloadWithoutCache(tab);
				}.bind(this));
			} else {
				this.updateTabIconAndContextMenu(tab, true);
			}
		}.bind(this));
	},

	unWhiteListCurrentTab: function () {
		this._getCurrentTab(function (tab) {

			var tabInfo = framesMap.getFrameInfo(tab);
			antiBannerService.unWhiteListFrame(tabInfo);

			if (framesMap.isTabAdguardDetected(tab)) {
				var rule = framesMap.getTabAdguardUserWhiteListRule(tab);
				if (rule) {
					adguardApplication.removeRuleFromApp(rule.ruleText, function () {
						this._reloadWithoutCache(tab);
					}.bind(this));
				}
			} else {
				this.updateTabIconAndContextMenu(tab, true);
			}
		}.bind(this));
	},

	openTab: function (url, options) {

		var inBackground, activateSameTab, onOpen, tabType;
		if (options) {
			inBackground = options.inBackground;
			activateSameTab = options.activateSameTab;
			onOpen = options.onOpen;
			tabType = options.tabType;
		}

		var onTabFound = function (tab) {
			if (tab.url != url) {
				tab.reload(url);
			}
			if (!inBackground) {
				tab.activate();
			}
			if (onOpen) {
				onOpen(tab);
			}
		};

		url = (StringUtils.contains(url, "://") ? url : ext.getURL(url));
		var isExtensionTab = !UrlUtils.isHttpRequest(url);
		UI.getAllOpenedTabs(function (tabs) {
			//try to find between opened tabs
			if (activateSameTab) {
				for (var i = 0; i < tabs.length; i++) {
					var tab = tabs[i];
					if (UrlUtils.urlEquals(tab.url, url)) {
						onTabFound(tab);
						return;
					}
				}
			}
			if (tabType == "popup" && !Utils.isSafariBrowser()) {
				ext.windows.createPopup(url, onOpen);
			} else {
				//create new tab in last focused or new window
				ext.windows.getOrCreate(function (win) {
					win.openTab(url, inBackground, onOpen);
				}, isExtensionTab);
			}
		});
	},

	openExportRulesTab: function (whitelist) {
		UI.openTab("pages/export.html" + (whitelist ? '#wl' : ''));
	},

	openSettingsTab: function (anchor) {
		UI.openTab("pages/options.html" + (anchor ? '#' + anchor : ''), {activateSameTab: true});
	},

	openSiteReportTab: function (url) {
		var domain = UrlUtils.toPunyCode(UrlUtils.getDomainName(url));
		if (domain) {
			UI.openTab("https://adguard.com/site.html?domain=" + encodeURIComponent(domain) + "&utm_source=extension&aid=16593");
		}
	},

	openFiltersDownloadPage: function () {
		UI.openTab("pages/filter-download.html", {inBackground: Utils.isYaBrowser()});
	},

	openThankYouPage: function () {

		var filtersDownloadUrl = ext.getURL("pages/filter-download.html");
		var thankyouUrl = ext.getURL("pages/thankyou.html");

		ext.windows.getLastFocused(function (win) {

			win.getAllTabs(function (tabs) {

				for (var i = 0; i < tabs.length; i++) {
					var tab = tabs[i];
					if (tab.url == filtersDownloadUrl || tab.url == thankyouUrl) {
						if (tab.active) {
							tab.activate();
						}
						if (tab.url != thankyouUrl) {
							tab.reload(thankyouUrl);
						}
						return;
					}
				}
				win.openTab(thankyouUrl);
			});
		});
	},

	openExtensionStore: function () {
		var url = Utils.getExtensionStoreLink();
		UI.openTab(url);
	},

	showAlertMessagePopup: function (title, text, showForAdguardTab) {
		ext.windows.getLastFocused(function (win) {
			win.getActiveTab(function (tab) {
				if (tab) {
					if (!showForAdguardTab && framesMap.isTabAdguardDetected(tab)) {
						return;
					}
					tab.sendMessage({
						type: 'show-alert-popup',
						title: title,
						text: text
					});
				}
			});
		});
	},

	getFiltersUpdateResultInfo: function (success, updatedFilters) {
		return Utils.getFiltersUpdateResultMessage(ext.i18n.getMessage.bind(ext.i18n), success, updatedFilters);
	},

	openFilteringLog: function (tabId) {
		UI.openTab("pages/log.html" + (tabId ? "?tabId=" + tabId : ""), {activateSameTab: true, tabType: "popup"});
	},

	openCurrentTabFilteringLog: function () {
		ext.windows.getLastFocused(function (win) {
			win.getActiveTab(function (tab) {
				if (tab) {
					var tabInfo = filteringLog.getTabInfo(tab);
					var tabId = tabInfo ? tabInfo.tabId : null;
					UI.openFilteringLog(tabId);
				}
			})
		});
	},

	openChangeLog: function () {
		UI.openTab("pages/release-notes.html", {activateSameTab: true});
	},

	openSafebrowsingTrusted: function (url) {
		antiBannerService.getRequestFilter().addToSafebrowsingTrusted(url);
		ext.windows.getLastFocused(function (win) {
			win.getActiveTab(function (tab) {
				tab.reload(url);
			});
		});
	},

	customizeContextMenu: function (tab) {

		var callbackMappings = {
			'context_block_site_ads': function () {
				tab.sendMessage({type: "open-assistant"}, function () {
				});
			},
			'context_block_site_element': function () {
				tab.sendMessage({type: "open-assistant", selectElement: true}, function () {
				});
			},
			'context_security_report': function () {
				UI.openSiteReportTab(tab.url);
			},
			'context_site_filtering_on': function () {
				UI.unWhiteListCurrentTab();
			},
			'context_site_filtering_off': function () {
				UI.whiteListCurrentTab();
			},
			'context_enable_protection': function () {
				UI.changeApplicationFilteringDisabled(false);
			},
			'context_disable_protection': function () {
				UI.changeApplicationFilteringDisabled(true);
			},
			'context_general_settings': function () {
				UI.openSettingsTab('general-settings');
			},
			'context_antibanner': function () {
				UI.openSettingsTab('antibanner');
			},
			'context_safebrowsing': function () {
				UI.openSettingsTab('safebrowsing');
			},
			'context_whitelist': function () {
				UI.openSettingsTab('whitelist');
			},
			'context_userfilter': function () {
				UI.openSettingsTab('userfilter');
			},
			'context_miscellaneous_settings': function () {
				UI.openSettingsTab('miscellaneous-settings');
			},
			'context_open_log': function () {
				UI.openCurrentTabFilteringLog();
			},
			'context_update_antibanner_filters': UI._checkAntiBannerFiltersUpdate
		};

		function addMenu(title, options) {
			var createProperties = {
				contexts: ["all"],
				title: ext.i18n.getMessage(title)
			};
			var callbackTitle;
			if (options) {
				if (options.id) {
					createProperties.id = options.id;
				}
				if (options.parentId) {
					createProperties.parentId = options.parentId;
				}
				if (options.disabled) {
					createProperties.enabled = false;
				}
				if (options.messageArgs) {
					createProperties.title = ext.i18n.getMessage(title, options.messageArgs);
				}
				if (options.contexts) {
					createProperties.contexts = options.contexts;
				}
				callbackTitle = options.callbackTitle;
			}
			var callback = callbackMappings[callbackTitle || title];
			if (callback) {
				createProperties.onclick = callback;
			}
			ext.contextMenus.create(createProperties);
		}

		function addSeparator() {
			ext.contextMenus.create({
				type: 'separator'
			});
		}

		function addSettingsSubMenu() {
			UI.nextMenuId += 1;
			var menuId = 'adguard-settings-context-menu-' + UI.nextMenuId;
			addMenu('context_open_settings', {id: menuId});
			addMenu('context_general_settings', {parentId: menuId});
			addMenu('context_antibanner', {parentId: menuId});
			addMenu('context_safebrowsing', {parentId: menuId});
			addMenu('context_whitelist', {parentId: menuId});
			addMenu('context_userfilter', {parentId: menuId});
			addMenu('context_miscellaneous_settings', {parentId: menuId});
		}

		var tabInfo = framesMap.getFrameInfo(tab);

		if (tabInfo.applicationFilteringDisabled) {
			addMenu('context_site_protection_disabled');
			addSeparator();
			addSettingsSubMenu();
			addMenu('context_enable_protection');
		} else if (tabInfo.urlFilteringDisabled) {
			addMenu('context_site_filtering_disabled');
			addSeparator();
			addSettingsSubMenu();
			addMenu('context_update_antibanner_filters');
		} else {
			if (tabInfo.adguardDetected) {
				if (tabInfo.adguardProductName) {
					addMenu('context_ads_has_been_removed_by_adguard', {messageArgs: [tabInfo.adguardProductName]});
				} else {
					addMenu('context_ads_has_been_removed');
				}
				addSeparator();
			}
			if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
				addMenu('context_site_exception');
			} else if (tabInfo.canAddRemoveRule) {
				if (tabInfo.documentWhiteListed) {
					addMenu('context_site_filtering_on');
				} else {
					addMenu('context_site_filtering_off');
				}
			}
			addSeparator();

			if (!tabInfo.documentWhiteListed) {
				addMenu('context_block_site_ads');
				addMenu('context_block_site_element', {contexts: ["image", "video", "audio"]});
			}
			addMenu('context_open_log');
			addMenu('context_security_report');
			if (!tabInfo.adguardDetected) {
				addSeparator();
				addSettingsSubMenu();
				addMenu('context_update_antibanner_filters');
				addMenu('context_disable_protection');
			}
		}
	},

	getAllOpenedTabs: function (callback) {

		var openedWindows = [];
		var openedTabs = [];

		var getWindowTabs = function (wnd) {
			var dfd = new Promise();
			wnd.getAllTabs(function (tabs) {
				openedTabs = openedTabs.concat(tabs);
				dfd.resolve();
			});
			return dfd;
		};

		var wndDfd = new Promise();
		ext.windows.getAll(function (windows) {
			openedWindows = openedTabs.concat(windows);
			wndDfd.resolve();
		});

		wndDfd.then(function () {
			var dfds = [];
			for (var i = 0; i < openedWindows.length; i++) {
				dfds.push(getWindowTabs(openedWindows[i]));
			}
			Promise.all(dfds).then(function () {
				callback(openedTabs);
			});
		});
	},

	bindEvents: function () {

		//update icon on event received
		EventNotifier.addListener(function (event, tab, reset) {

			if (event != EventNotifierTypes.UPDATE_TAB_BUTTON_STATE || !tab) {
				return;
			}

			var options;
			if (reset) {
				options = {icon: UI.ICON_GRAY, badge: ''};
			}

			UI.updateTabIcon(tab, options);
		});


		//update icon on ads blocked
		EventNotifier.addListener(function (event, rule, tab, blocked) {

			if (event != EventNotifierTypes.ADS_BLOCKED || !tab) {
				return;
			}

			var tabBlocked = framesMap.updateBlockedAdsCount(tab, blocked);
			if (tabBlocked == null) {
				return;
			}
			this.updateTabIconAsync(tab);

		}.bind(this));

		//update context menu on change user settings
		EventNotifier.addListener(function (event, setting) {
			if (event == EventNotifierTypes.CHANGE_USER_SETTINGS && setting == userSettings.settings.DISABLE_SHOW_CONTEXT_MENU) {
				ext.windows.getLastFocused(function (win) {
					win.getActiveTab(function (tab) {
						UI.updateTabContextMenu(tab);
					})
				});
			}
		});

		//on filter auto-enabled event
		EventNotifier.addListener(function (event, enabledFilters) {
			if (event == EventNotifierTypes.ENABLE_FILTER_SHOW_POPUP) {
				var result = Utils.getFiltersEnabledResultMessage(ext.i18n.getMessage.bind(ext.i18n), enabledFilters);
				UI.showAlertMessagePopup(result.title, result.text);
			}
		});

		//on filters updated event
		EventNotifier.addListener(function (event, success, updatedFilters) {
			if (event == EventNotifierTypes.UPDATE_FILTERS_SHOW_POPUP) {
				var result = UI.getFiltersUpdateResultInfo(success, updatedFilters);
				UI.showAlertMessagePopup(result.title, result.text);
			}
		});

		//update tab icon while loading
		ext.tabs.onLoading.addListener(function (tab) {
			UI.updateTabIconAndContextMenu(tab);
		});
		//update tab icon on completed
		ext.tabs.onCompleted.addListener(function (tab) {
			UI.updateTabIconAndContextMenu(tab);
		});
		//update tab icon on active tab change
		ext.tabs.onActivated.addListener(function (tab) {
			UI.updateTabIconAndContextMenu(tab, true);
		});
		//update tab icon on window focus change
		ext.windows.onFocusChanged.addListener(function () {
			ext.windows.getLastFocused(function (win) {
				win.getActiveTab(function (tab) {
					UI.updateTabIconAndContextMenu(tab, true);
				})
			});
		});
	},

	_checkAntiBannerFiltersUpdate: function () {
		this.antiBannerService.checkAntiBannerFiltersUpdate(true, function (updatedFilters) {
			EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_FILTERS_SHOW_POPUP, true, updatedFilters);
		}, function () {
			EventNotifier.notifyListeners(EventNotifierTypes.UPDATE_FILTERS_SHOW_POPUP, false);
		});
	},

	_getCurrentTab: function (callback) {
		ext.windows.getLastFocused(function (win) {
			win.getActiveTab(function (tab) {
				if (tab && callback) {
					callback(tab);
				}
			});
		});
	},

	_reloadWithoutCache: function (tab) {
		//reload page without cache via content script
		tab.sendMessage({type: 'no-cache-reload'});
	}
};




