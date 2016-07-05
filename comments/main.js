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


keyboard.connect()

let help = new Help()
help.register(keyboard)


console.info("comments: init")
