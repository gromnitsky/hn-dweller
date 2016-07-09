/* globals chrome */

'use strict';

require("babel-polyfill")

let defaults = require('../defaults')
let colours = require('../colours')

let favourites_get = function() {
    let colourpairs = defaults.favourites
    chrome.storage.local.get('favourites', (val) => {
	if (Object.keys(val).length) colourpairs = val.favourites

	let tbody = document.querySelector('#favourites table tbody')
	for (let key in colourpairs) {
	    let val = colourpairs[key]
	    let tr = document.createElement('tr')
	    tr.innerHTML = `<td><span class="colourbox">${key}</span></td><td><input name="${key}" value="${val}" spellcheck="false"></td>`
	    tbody.appendChild(tr)

	    let colourbox = tr.querySelector('span')
	    colours.paint_node(colourbox, key)
	}

    })
}

let favourites_save = function() {
    let inputs = document.querySelectorAll('#favourites table input')
    let r = {}
    for (let idx of inputs) {
	r[idx.name] = idx.value || ""
	idx.disabled = true
    }

    chrome.storage.local.set({favourites: r}, (val) => {
	for (let idx of inputs) idx.disabled = false
    })
}


favourites_get()

document.querySelector('#btn_save').onclick = function(event) {
    favourites_save()
}
