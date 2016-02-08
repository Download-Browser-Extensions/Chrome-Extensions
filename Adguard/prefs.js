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
 * Extension global preferences
 */
var Prefs = exports.Prefs = {

	appId: ext.i18n.getMessage("@@extension_id"),
	version: ext.app.getDetails().version,
	locale: ext.i18n.getMessage("@@ui_locale"),
	getLocalFilterPath: function (filterId) {
		var url = "filters/filter_" + filterId + ".txt";
		return ext.getURL(url);
	},
	localGroupsMetadataPath: ext.getURL('filters/groups.xml'),
	localFiltersMetadataPath: ext.getURL('filters/filters.xml'),
	safebrowsingPagePath: ext.getURL("pages/sb.html"),
	platform: "chromium",
	getBrowser: function () {
		if (!Prefs.browser) {
			var browser;
			var userAgent = navigator.userAgent;
			if (userAgent.toLowerCase().indexOf("yabrowser") >= 0) {
				browser = "YaBrowser";
			} else if (userAgent.toLowerCase().indexOf("opera") >= 0 || userAgent.toLowerCase().indexOf("opr") >= 0) {
				browser = "Opera";
			} else if (userAgent.indexOf("Safari") >= 0 && userAgent.indexOf('Chrome') < 0) {
				browser = "Safari";
			} else {
				browser = "Chrome";
			}
			Prefs.browser = browser;
		}
		return Prefs.browser;
	},
	speedupStartup: function () {
		return false;
	}
};