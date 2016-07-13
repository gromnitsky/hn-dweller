/* globals chrome */

'use strict';

require("babel-polyfill")

let keyboard = require('../keyboard')
let Help = require('./help')
let ClunkyStore = require('./clunkystore')
let Fav = require('./fav')
let colours = require('../colours')
let defaults = require('../defaults')

class Message {

    constructor(domnode) {
	this.id = null
	this.from = null

	this.domnode = domnode
	this.domnode_from = null
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
	this.domnode_from = this.domnode.querySelector('a[class="hnuser"]')
	if (!this.domnode_from) throw new Error("a deleted message?")
	this.from = this.domnode_from.innerHTML
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

    open(kids = true) {
	let body = this.domnode.querySelector('span[class="comment"]')
	body.style.display = ""
	this.btn.classList.remove('hnd-msg-btn-closed')
	this.btn.classList.add('hnd-msg-btn-open')

	if (kids) for (let kid of this.kids) kid.open()
    }

    select() {
	this.btn.classList.add('hnd-msg-btn-selected')
	this.domnode.scrollIntoViewIfNeeded(true) // a non-standard feature
    }

    deselect() {
	this.btn.classList.remove('hnd-msg-btn-selected')
    }
}

let users_blacklist = function() {
    let list = defaults.filters.user
    return new Promise( (resolve, _) => {
	chrome.storage.local.get('filters', (val) => {
	    resolve(val.filters ? val.filters.user : list)
	})
    })
}

let close_unwanted_user = function(msg) {
    let node = msg.domnode_from
    node.style.padding = '0px 3px 0px 3px'
    node.style.border = `1px solid black`
    node.className = 'hnd-unwanted-user'
    node.innerHTML = node.innerText.replace(/./g, '&nbsp;&nbsp;')
    node.title = msg.from

    if (!msg.is_visible()) return false
    msg.close()
    return true
}

class Forum {
    constructor(clunkystore, kbd) {
	this.db = clunkystore
	this.kbd = kbd

	this.root = new Message()
	this.flatlist = []
	this.index = 0
	this.selected = null
	this.selected_history = []

	this.mktree().then( (result) => {
	    if (result.every( (val) => val === false )) {
		console.log('every message is closed')
		this.select(0)
	    } else {
		this.next_open(0)
	    }

	    let fav = new Fav(this)
	    fav.register(kbd)

	    // paint messages
	    fav.users().then( (favs) => {
		if (!favs.length) return
		favs.forEach( (user) => {
		    user.indices.forEach( (idx) => {
			colours.paint_node(this.flatlist[idx].domnode_from,
					   user.colour)
		    })
		})

		fav.display()
	    })

	    // paint unwanted users
	    users_blacklist().then( (list) => {
		let unwanted = 0
		for (let msg of this.flatlist) {
		    if (list.includes(msg.from)) {
			if (close_unwanted_user(msg)) unwanted++
		    }
		}

		let opened_msg = result.reduce( (n, val) => (val === true) ? n + 1: n, 0) - unwanted
		chrome.runtime.sendMessage({
		    comments_stat: {
			opened: opened_msg < 0 ? 0 : opened_msg
		    }
		})

	    })

	})
    }

    dump_info() {
	console.log(`this.index=${this.index}`,
		    `this.flatlist.length=${this.flatlist.length}`)
	console.log(`this.selected_history: `, this.selected_history)
	console.log('this.selected:')
	console.log(this.selected)
	if (this.selected) this.db.del(this.selected.id)
    }

    select(index, modify_history = true) {
	if (index >= this.flatlist.length) index = 0
	if (index < 0) index = this.flatlist.length-1

	this.index = index
	if (this.selected) this.selected.deselect()
	let msg = this.flatlist[index]
	msg.select()
	this.selected = msg
	if (modify_history)
	    this.selected_history.push(this.selected.flatlist_index)
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
	    let msg
	    try {
		msg = new Message(node)
	    } catch (err) {
		console.log(err)
		continue
	    }

	    msg.flatlist_index = this.flatlist.length
	    msg.btn.addEventListener('click', (event) => {
		this.select(msg.flatlist_index)
	    }, false)

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

    next_author(author) {
	if (author === undefined) author = this.selected.from
	this.move_to(1, (idx) => idx < this.flatlist.length,
		     (msg) => msg.from === author)
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

    jump_to_parent(open_kids = true) {
	let parent = this.selected.parent
	if (parent.level === -1) return
	parent.open(open_kids)
	this.select(parent.flatlist_index)
    }

    open_all() {
	this.flatlist.forEach( (msg) => msg.open(false) )
    }

    history_jump(L = true) {
	let history = this.selected_history
	if (!history.length) return

	if (L) {
	    let last = history.pop()
	    history.unshift(last)	// the last becomes the 1st
	} else {
	    let first = history.shift()
	    history.push(first)	// the 1st becomes the last
	}
	this.select(history[history.length - 1], false)
//	console.log(history)
    }

    register() {
	this.kbd.register({
	    key: '=',
	    desc: 'DEBUG console.log the selected msg object, index, etc',
	    obj: () => this,
	    method: 'dump_info',
	    args: []
	})
	this.kbd.register({
	    key: 'j',
	    desc: 'Jump to the next comment',
	    obj: () => this,
	    method: 'next',
	    args: []
	})
	this.kbd.register({
	    key: 'k',
	    desc: 'Jump to the prev comment',
	    obj: () => this,
	    method: 'prev',
	    args: []
	})
	this.kbd.register({
	    key: '-',
	    desc: 'Toggle message & its kids',
	    obj: () => this.selected,
	    method: 'toggle',
	    args: []
	})
	this.kbd.register({
	    key: ',',
	    desc: 'Jump to the next <i>open</i> comment',
	    obj: () => this,
	    method: 'prev_open',
	    args: []
	})
	this.kbd.register({
	    key: '.',
	    desc: 'Jump to the prev <i>open</i> comment',
	    obj: () => this,
	    method: 'next_open',
	    args: []
	})
	this.kbd.register({
	    key: 'r',
	    desc: 'Close the current sub-thread & move to the next <i>open</i> comment',
	    obj: () => this,
	    method: 'close_subthread_and_move_on',
	    args: []
	})
	this.kbd.register({
	    key: 'l',
	    desc: 'Jump to the next comment of the same author',
	    obj: () => this,
	    method: 'next_author',
	    args: []
	})
	this.kbd.register({
	    key: 'h',
	    desc: 'Jump to the prev comment of the same author',
	    obj: () => this,
	    method: 'prev_author',
	    args: []
	})
	this.kbd.register({
	    key: '[',
	    desc: 'Jump to the next <i>root</i> comment',
	    obj: () => this,
	    method: 'prev_level0',
	    args: []
	})
	this.kbd.register({
	    key: ']',
	    desc: 'Jump to the prev <i>root</i> comment',
	    obj: () => this,
	    method: 'next_level0',
	    args: []
	})
	this.kbd.register({
	    key: 'g',
	    desc: 'Jump to the parent comment, open it & its kids',
	    obj: () => this,
	    method: 'jump_to_parent',
	    args: []
	})
	this.kbd.register({
	    key: 'G',
	    desc: 'Jump to the parent comment & open it',
	    obj: () => this,
	    method: 'jump_to_parent',
	    args: [false]
	})
	this.kbd.register({
	    key: 'a',
	    desc: 'Open all (closed) comments',
	    obj: () => this,
	    method: 'open_all',
	    args: []
	})
	this.kbd.register({
	    key: 'L',
	    desc: 'Move back in history to the last message you were at',
	    obj: () => this,
	    method: 'history_jump',
	    args: []
	})
	this.kbd.register({
	    key: 'R',
	    desc: 'Move forward in history to the message you returned from after using <kbd>L</kbd>',
	    obj: () => this,
	    method: 'history_jump',
	    args: [false]
	})
    }
}

keyboard.connect()

let help = new Help()
help.register(keyboard)

let clunkystore = new ClunkyStore('hn-dweller', 1, 'comments')
clunkystore.open().then( () => {
    let forum = new Forum(clunkystore, keyboard)
    forum.register()
})

console.info("hn-dweller: comments: init")
