/* globals chrome */

'use strict';

require("babel-polyfill")
let Mustache = require('mustache')

let Keyboard = require('./keyboard')

let bus = {
    cmd: {}
}

class Help {

    constructor(bus) {
	// register the command
	bus.cmd.help = { obj: this, name: this.display }
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
		keylist.push({key, desc: val[0]})
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


let help = new Help(bus)
let kbd = new Keyboard(bus)

console.log("comments: init")
