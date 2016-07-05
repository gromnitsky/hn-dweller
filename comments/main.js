/* globals chrome */

'use strict';

require("babel-polyfill")
let Mustache = require('mustache')

let Keyboard = require('./keyboard')

class App {

    constructor() {
    }

    help_close() {
	let node = document.getElementById("hnd-help")
	if (node) {
	    document.body.removeChild(node)
	    return true
	}
    }

    help(kb) {
	if (this.help_close()) return

	fetch(chrome.extension.getURL('comments/help.html')).then( (res) => {
	    return res.text()
	}).then( (text) => {
	    let keylist = []
	    for (let key in kb()) {
		let val = kb()[key]
		keylist.push({key, desc: val[0]})
	    }
	    let html = Mustache.render(text, {keylist})

	    let div = document.createElement('div')
	    div.id = 'hnd-help'
	    document.body.appendChild(div)
	    div.innerHTML = html

	    let close = div.querySelector('#hnd-help span[class="hnd-btn-close"]')
	    close.onclick = () => this.help_close()
	}).catch( (err) => {
	    alert(`No help file: ${err.message}`)
	})
    }
}

let app = new App()
let kbd = new Keyboard(app)

console.log("comments: init")
