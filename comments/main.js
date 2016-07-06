/* globals chrome */

'use strict';

require("babel-polyfill")
let Mustache = require('mustache')

let keyboard = require('./keyboard')

class Help {

    register(kbd) {
	kbd.register({
	    key: '?',
	    desc: '(Close) this help',
	    obj: this,
	    method: this.display,
	    args: [() => kbd.bindings]
	})
    }

    close() {
	let node = document.getElementById("hnd-help")
	if (node) {
	    document.body.removeChild(node)
	    return true
	}
    }

    display(kb) {
	if (this.close()) return

	fetch(chrome.extension.getURL('comments/help.html')).then( (res) => {
	    return res.text()
	}).then( (text) => {
	    let keylist = []
	    for (let key in kb()) {
		let val = kb()[key]
		keylist.push({key, desc: val.desc})
	    }
	    let html = Mustache.render(text, {keylist})

	    let div = document.createElement('div')
	    div.id = 'hnd-help'
	    document.body.appendChild(div)
	    div.innerHTML = html

	    let close_btn = div.querySelector('#hnd-help span[class="hnd-btn-close"]')
	    close_btn.onclick = () => this.close()
	}).catch( (err) => {
	    alert(`No help file: ${err.message}`)
	})
    }
}


class Message {

    constructor(domnode) {
	this.id = null
	this.from = null

	this.domnode = domnode
	this.parent = null	// a Message object
	this.level = -1
	this.kids = []

	this.parse()

	// gui state
	this.visible = true
	this.btn = this.mkbutton()
    }

    parse() {
	if (!this.domnode) return

	this.id = this.domnode.id
	this.level = this.domnode.querySelector('img[height="1"]').width
	this.from = this.domnode.querySelector('a[class="hnuser"]').innerHTML
    }

    kid_add(msg) {
	msg.parent = this
	this.kids.push(msg)
    }

    find_parent_for(msg) {
	if (!msg) throw new Error("cannot find parent for nil")

	const magic = 40
	if (msg.level - this.level === magic) return this
	if (this.level <= 0) return this

	// RECURSION!
	return this.parent.find_parent_for(msg)
    }

    mkbutton() {
	if (!this.domnode) return

	let name_node = this.domnode.querySelector('a[class="hnuser"]')
	let btn = document.createElement('span')
	btn.className = 'hnd-msg-btn-open'
	btn.innerHTML = '&nbsp;'
	btn.onclick = () => this.toggle()

	name_node.insertAdjacentElement('beforebegin', btn)
	return btn
    }

    toggle() {
	this.visible ? this.close() : this.open()
    }

    close() {
	let body = this.domnode.querySelector('span[class="comment"]')
	body.style.display = "none"
	this.btn.className = 'hnd-msg-btn-closed'
	this.visible = false

	for (let kid of this.kids) kid.close()
    }

    open() {
	let body = this.domnode.querySelector('span[class="comment"]')
	body.style.display = ""
	this.btn.className = 'hnd-msg-btn-open'
	this.visible = true

	for (let kid of this.kids) kid.open()
    }
}

class Forum {
    constructor() {
	this.root = new Message()
	let domnodes = document.querySelectorAll('tr[class*="comtr"]')
	if (!(domnodes && domnodes.length)) {
	    console.info("no messages")
	    return
	}

	let prev = null
	for (let node of domnodes) {
	    let msg = new Message(node)
	    if (msg.level === 0) {
		this.root.kid_add(msg)
	    } else {
		let parent = prev.find_parent_for(msg)
		parent.kid_add(msg)
	    }
	    prev = msg
	    console.log(msg.id, msg.level, msg.from, msg.parent ? msg.parent.id : null)
	}
    }
}

keyboard.connect()

let help = new Help()
help.register(keyboard)

let forum = new Forum()
//console.log(forum.root)

console.info("init")
