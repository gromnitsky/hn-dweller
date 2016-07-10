/* globals chrome */
'use strict';

require("babel-polyfill")

let defaults = require('../defaults')
let filter = require('./filter')

class Story {
    constructor(domnode, flists) {
	this.from = null
	this.title = null
	this.url = null

	this.domnode = domnode
	this.domnode_bottom = null

	this.hostname = new filter.FilterExact()
	this.hostname.blacklist = flists.hostname

	this.user = new filter.FilterExact()
	this.user.blacklist = flists.user

	this.title = new filter.FilterRegexp()
	this.title.whitelist = flists.title_white
	this.title.blacklist = flists.title_black

	this.parse()
//	this.btn = mkbutton()
    }

    parse() {
	if (!this.domnode) return

	let a = this.domnode.querySelector('a[class="storylink"]')
	this.url = a.hostname
	this.title = a.innerText

	this.domnode_bottom = this.domnode.nextSibling
	this.from = this.domnode_bottom.querySelector('a[class="hnuser"]').innerText
    }
}

class News {
    constructor() {
	this.flists().then( (lists) => {
	    this.mkstories(lists)
	})
    }

    flists() {
	let lists = defaults
	return new Promise( (resolve, _) => {
	    chrome.storage.local.get(['hostname', 'user', 'title_white', 'title_black'], (val) => {
		if (Object.keys(val).length === 4) lists = val
		resolve(lists)
	    })
	})
    }

    mkstories(lists) {
	let domnodes = document.querySelectorAll('tr[class="athing"]')
	if (!(domnodes && domnodes.length)) {
	    console.info("no news stories!")
	    return
	}

	domnodes.forEach( (node, idx) => {
	    let story = new Story(node, lists)
	    console.log('%d. %s, %s, %s', idx+1, story.title, story.url, story.from)
	})
    }
}


let news = new News()

console.info("hn-dweller: news: init")
