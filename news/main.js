/* globals chrome */
'use strict';

require("babel-polyfill")

let defaults = require('../defaults')
let filter = require('./filter')

class Story {
    constructor(domnode, flists) {
	this.from = null
	this.title = null
	this.host = null

	this.domnode = domnode
	this.domnode_bottom = null
	this.btn = null

	this.fhostname = new filter.FilterExact()
	this.fhostname.blacklist = flists.hostname

	this.fuser = new filter.FilterExact()
	this.fuser.blacklist = flists.user

	this.ftitle = new filter.FilterRegexp()
	this.ftitle.whitelist = flists.title_white
	this.ftitle.blacklist = flists.title_black

	this.parse()
	this.mkbutton()
    }

    parse() {
	if (!this.domnode) return

	let a = this.domnode.querySelector('a[class="storylink"]')
	this.host = a.hostname
	this.title = a.innerText

	this.domnode_bottom = this.domnode.nextSibling
	this.from = this.domnode_bottom.querySelector('a[class="hnuser"]').innerText
    }

    match() {
	if (this.fhostname.match(this.host)) return "Host name"
	if (this.fuser.match(this.from)) return "User name"
	if (this.ftitle.match(this.title)) return "Story title"
	return null
    }

    mkbutton() {
	if (!this.domnode) return
	let match_reason = this.match()
	if (!match_reason) return

	this.btn = this.domnode.querySelector('span[class="rank"]')
	this.btn.innerHTML = ''
	this.btn.className = ''
	this.btn.title = match_reason
	this.btn.onclick = () => this.toggle()
	this.close()
    }

    toggle() {
	this.is_visible() ? this.close() : this.open()
    }

    is_visible() {
	if (!this.btn) return true
	return this.btn.classList.contains('hnd-story-btn-open')
    }

    close() {
	let nodes = Array.from(this.domnode.children).slice(1)
	nodes.forEach( (node) => node.style.display = 'none' )
	this.domnode_bottom.style.display = 'none'

	this.btn.classList.add('hnd-story-btn-closed')
	this.btn.classList.remove('hnd-story-btn-open')
    }

    open() {
	let nodes = Array.from(this.domnode.children).slice(1)
	nodes.forEach( (node) => node.style.display = '' )
	this.domnode_bottom.style.display = ''

	this.btn.classList.remove('hnd-story-btn-closed')
	this.btn.classList.add('hnd-story-btn-open')
    }
}

class News {
    constructor() {
	this.filtered = 0

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
	    if (!story.is_visible()) this.filtered++
	    console.log('%d. %s, %s, %s', idx+1, story.title, story.host, story.from)
	})
    }
}


let news = new News()

console.info("hn-dweller: news: init")
