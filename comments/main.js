/* globals chrome */

'use strict';

require("babel-polyfill")

let keyboard = require('./keyboard')
let Help = require('./help')
let ClunkyStore = require('./clunkystore')

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

    close(kids = true) {
	let body = this.domnode.querySelector('span[class="comment"]')
	body.style.display = "none"
	this.btn.classList.add('hnd-msg-btn-closed')
	this.btn.classList.remove('hnd-msg-btn-open')

	if (kids) for (let kid of this.kids) kid.close()
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
    constructor(clunkystore) {
	this.db = clunkystore

	this.root = new Message()
	this.flatlist = []
	this.index = 0
	this.selected = null

	this.mktree().then( (result) => {
	    if (result.every( (val) => val === false )) {
		console.log('every message is closed')
		this.select(0)
	    } else {
		this.next_open(0)
	    }
	})
    }

    dump_info() {
	console.log(`this.index=${this.index}`,
		    `this.flatlist.length=${this.flatlist.length}`)
	console.log('this.selected:')
	console.log(this.selected)
	if (this.selected) this.db.del(this.selected.id)
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
	    return Promise.reject(0)
	}

	let promises = []
	let prev = null
	for (let node of domnodes) {
	    let msg = new Message(node)
	    msg.flatlist_index = this.flatlist.length
	    if (msg.level === 0) {
		this.root.kid_add(msg)
	    } else {
		let parent = prev.find_parent_for(msg)
		parent.kid_add(msg)
	    }
	    prev = msg
	    this.flatlist.push(msg)

	    // auto-closing facility
	    let check = new Promise( (resolve, _) => {
		this.db.exists(msg.id).then( ()=> {
		    // close the message (w/o its kids) because we've
		    // found it in the db
		    msg.close(false)
		    resolve(false)
		}).catch( (err) => {
		    // add to the db & don't wait for the result, for
		    // we don't care
		    console.log(err)
		    this.db.add(msg.id)
		    resolve(true)
		})
	    })
	    promises.push(check)
	}

	return Promise.all(promises)
    }

    next() {
	this.select(this.index + 1)
    }

    prev() {
	this.select(this.index - 1)
    }

    move_to(direction, loop_head_condition, loop_body_condition, start) {
	let can_retry = false
	if (start === undefined) {
	    start = this.index + direction
	    can_retry = true
	}
	if (start >= this.flatlist.length) start = 0
	if (start < 0) start = this.flatlist.length-1

	if (!loop_body_condition)
	    loop_body_condition = (msg) => msg.is_visible()

	for (let idx=start; loop_head_condition(idx); idx += direction) {
	    let msg = this.flatlist[idx]
	    if (loop_body_condition(msg)) {
		this.select(idx)
		return
	    }
	}

	if (can_retry) {
	    this.move_to(direction, loop_head_condition,
			 loop_body_condition,
			 (direction === 1 ? 0 : this.flatlist.length - 1))
	} else {
	    console.log('no open messages found')
	}
    }

    next_open(start) {
	this.move_to(1, (idx) => idx < this.flatlist.length, null, start)
    }

    prev_open() {
	this.move_to(-1, (idx) => idx >= 0)
    }

    close_subthread_and_move_on() {
	this.selected.close()
	this.next_open()
    }

    next_author() {
	this.move_to(1, (idx) => idx < this.flatlist.length,
		     (msg) => msg.from === this.selected.from)
    }

    prev_author() {
	this.move_to(-1, (idx) => idx >= 0,
		     (msg) => msg.from === this.selected.from)
    }

    next_level0() {
	this.move_to(1, (idx) => idx < this.flatlist.length,
		     (msg) => msg.level === 0)
    }

    prev_level0() {
	this.move_to(-1, (idx) => idx >= 0,
		     (msg) => msg.level === 0)
    }

    jump_to_parent() {
	let parent = this.selected.parent
	if (parent.level === -1) return
	parent.open()
	this.select(parent.flatlist_index)
    }

    register(kbd) {
	kbd.register({
	    key: '=',
	    desc: 'DEBUG console.log the selected msg object, index, etc',
	    obj: () => this,
	    method: 'dump_info',
	    args: []
	})
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
	kbd.register({
	    key: ',',
	    desc: 'Jump to the next <i>open</i> comment',
	    obj: () => this,
	    method: 'prev_open',
	    args: []
	})
	kbd.register({
	    key: '.',
	    desc: 'Jump to the prev <i>open</i> comment',
	    obj: () => this,
	    method: 'next_open',
	    args: []
	})
	kbd.register({
	    key: 'r',
	    desc: 'Close the current sub-thread & move to the next <i>open</i> comment',
	    obj: () => this,
	    method: 'close_subthread_and_move_on',
	    args: []
	})
	kbd.register({
	    key: 'l',
	    desc: 'Jump to the next comment of the same author',
	    obj: () => this,
	    method: 'next_author',
	    args: []
	})
	kbd.register({
	    key: 'h',
	    desc: 'Jump to the prev comment of the same author',
	    obj: () => this,
	    method: 'prev_author',
	    args: []
	})
	kbd.register({
	    key: '[',
	    desc: 'Jump to the next <i>root</i> comment',
	    obj: () => this,
	    method: 'prev_level0',
	    args: []
	})
	kbd.register({
	    key: ']',
	    desc: 'Jump to the prev <i>root</i> comment',
	    obj: () => this,
	    method: 'next_level0',
	    args: []
	})
	kbd.register({
	    key: 'g',
	    desc: 'Jump to the parent comment',
	    obj: () => this,
	    method: 'jump_to_parent',
	    args: []
	})
    }
}

keyboard.connect()

let help = new Help()
help.register(keyboard)

let clunkystore = new ClunkyStore('hn-dweller', 1, 'comments')
clunkystore.open().then( () => {
    let forum = new Forum(clunkystore)
    forum.register(keyboard)
})

console.info("hn-dweller: comments: init")
