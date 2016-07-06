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
	    obj: () => this,
	    method: 'display',
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
	btn.onclick = () => this.toggle()

	let space = document.createElement('span')
	space.innerHTML = '&nbsp;'

	name_node.insertAdjacentElement('beforebegin', btn)
	name_node.insertAdjacentElement('beforebegin', space)
	return btn
    }

    toggle() {
	this.is_visible() ? this.close() : this.open()
    }

    is_visible() {
	return this.btn.classList.contains('hnd-msg-btn-open')
    }

    close() {
	let body = this.domnode.querySelector('span[class="comment"]')
	body.style.display = "none"
	this.btn.classList.add('hnd-msg-btn-closed')
	this.btn.classList.remove('hnd-msg-btn-open')

	for (let kid of this.kids) kid.close()
    }

    open() {
	let body = this.domnode.querySelector('span[class="comment"]')
	body.style.display = ""
	this.btn.classList.remove('hnd-msg-btn-closed')
	this.btn.classList.add('hnd-msg-btn-open')

	for (let kid of this.kids) kid.open()
    }

    select() {
	this.btn.classList.add('hnd-msg-btn-selected')
	this.domnode.scrollIntoView(true)
    }

    deselect() {
	this.btn.classList.remove('hnd-msg-btn-selected')
    }
}

class Forum {
    constructor() {
	this.root = new Message()
	this.flatlist = []
	this.index = 0
	this.selected = null
	this.mktree()

	// FIXME: select the 1st unread
	this.select(0)
    }

    select(index) {
	if (index >= this.flatlist.length) index = 0
	if (index < 0) index = this.flatlist.length-1

	this.index = index
	if (this.selected) this.selected.deselect()
	let msg = this.flatlist[index]
	msg.select()
	this.selected = msg
    }

    mktree() {
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
	    this.flatlist.push(msg)
//	    console.log(msg.id, msg.level, msg.from, msg.parent ? msg.parent.id : null)
	}
    }

    next() {
	this.select(this.index + 1)
    }

    prev() {
	this.select(this.index - 1)
    }

    register(kbd) {
	kbd.register({
	    key: 'j',
	    desc: 'Jump to the next comment',
	    obj: () => this,
	    method: 'next',
	    args: []
	})
	kbd.register({
	    key: 'k',
	    desc: 'Jump to the prev comment',
	    obj: () => this,
	    method: 'prev',
	    args: []
	})
	kbd.register({
	    key: '-',
	    desc: 'Toggle message & its kids',
	    obj: () => this.selected,
	    method: 'toggle',
	    args: []
	})
    }
}

keyboard.connect()

let help = new Help()
help.register(keyboard)

let forum = new Forum()
forum.register(keyboard)
//console.log(forum.root)

console.info("init")
