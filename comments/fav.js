/* globals chrome */
'use strict';

let Mustache = require('mustache')

let defaults = require('../defaults')
let colours = require('../colours')

class Fav {

    constructor(forum) {
	this.forum = forum
    }

    register(kbd) {
	kbd.register({
	    key: 'f',
	    desc: 'Toggle Favourites window',
	    obj: () => this,
	    method: 'display',
	    args: []
	})
    }

    close() {
	let node = document.getElementById("hnd-fav")
	if (node) {
	    document.body.removeChild(node)
	    return true
	}
    }

    favourites() {
	let colourpairs = defaults.favourites
	return new Promise( (resolve, _) => {
	    chrome.storage.local.get('favourites', (val) => {
		if (val && val.favourites) colourpairs = val.favourites
		resolve(colourpairs)
	    })
	})
    }

    users() {
	return this.favourites().then( (fav) => {
	    let cache = {}
	    for (let msg of this.forum.flatlist) {
		for (let colour in fav) {
		    let user = fav[colour]
		    if (msg.from === user) {
			cache[user] = cache[user] || {
			    name: user,
			    tm: 0,
			    nm: 0,
			    colour
			}
			cache[user].tm++
			if (msg.is_visible()) cache[user].nm++
		    }
		}
	    }

	    let favs = []
	    for (let key in cache) favs.push(cache[key])
	    return favs
	})
    }

    display() {
	if (this.close()) return

	fetch(chrome.extension.getURL('comments/fav.html')).then( (res) => {
	    return res.text()
	}).then( (text) => {

	    this.users().then( (favs) => {
		let html = Mustache.render(text, {users: favs})

		let div = document.createElement('div')
		div.id = 'hnd-fav'
		div.innerHTML = html
		document.body.appendChild(div)

		// paint & bind
		let nodes = div.querySelectorAll('span[class="hnd-colourbox"]')
		for (let node of nodes) {
		    colours.paint_node(node, node.dataset.colour)
		    node.style.cursor = 'pointer'
		    node.onclick = () => this.forum.next_author(node.innerText)
		}

		let close_btn = div.querySelector('#hnd-fav span[class="hnd-btn-close"]')
		close_btn.onclick = () => this.close()
	    })

	}).catch( (err) => {
	    alert(`No .html file: ${err.message}`)
	})
    }
}

module.exports = Fav
