/* globals chrome */
'use strict';

let activate_icons = function(sender) {
    let icon_paths = {
	'19': 'icons/19.png',
	'38': 'icons/38.png'
    }
    chrome.browserAction.setIcon({ tabId: sender.tab.id, path: icon_paths })
}

chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
    let name = Object.keys(request)[0]
    switch (name) {
    case 'news_stat':
	chrome.browserAction.setBadgeText({
	    text: request[name].filtered.toString(),
	    tabId: sender.tab.id
	})
	activate_icons(sender)
	break
    case 'comments_stat':
	activate_icons(sender)
	break
    default:
	throw new Error('unknown message:', request)
    }
})

console.info('event page')
