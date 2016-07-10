/* globals chrome */
'use strict';

chrome.runtime.onMessage.addListener( (request, sender, sendResponse) => {
    let name = Object.keys(request)[0]
    switch (name) {
    case 'news_stat':
	chrome.browserAction.setBadgeText({
	    text: request[name].filtered.toString()
	})
	break
    default:
	throw new Error('unknown message:', request)
    }
})

console.info('event page')
