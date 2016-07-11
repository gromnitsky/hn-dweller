/* globals chrome */

'use strict';

require("babel-polyfill")

let defaults = require('../defaults')
let colours = require('../colours')
let filter = require('../news/filter')

let favourites_get = function(reset) {
    let colourpairs = defaults.favourites
    return new Promise( (resolve, _) => {
	chrome.storage.local.get('favourites', (val) => {
	    if (!reset && val.favourites) colourpairs = val.favourites
	    resolve(colourpairs)
	})
    })
}

let favourites_set = function(colourpairs) {
    let tbody = document.querySelector('#favourites table tbody')
    tbody.innerHTML = ''
    for (let key in colourpairs) {
	let val = colourpairs[key]
	let tr = document.createElement('tr')
	tr.innerHTML = `<td><span class="colourbox">${key}</span></td><td><input name="${key}" value="${val}" spellcheck="false"></td>`
	tbody.appendChild(tr)

	let colourbox = tr.querySelector('span')
	colours.paint_node(colourbox, key)
    }
}

let favourites_save = function() {
    let inputs = document.querySelectorAll('#favourites table input')
    let r = {}
    for (let idx of inputs) {
	r[idx.name] = idx.value
	idx.disabled = true
    }

    chrome.storage.local.set({favourites: r}, () => {
	for (let idx of inputs) idx.disabled = false
    })
}

let lists_get = function(reset) {
    let lists = defaults.filters
    return new Promise( (resolve, _) => {
	chrome.storage.local.get('filters', (val) => {
	    if (!reset && val.filters) lists = val.filters
	    resolve(lists)
	})
    })
}

let lists_set = function(lists) {
    let nodes = document.querySelectorAll('textarea')
    nodes.forEach( (node) => node.value = lists[node.name].join("\n") )
}

let lists_save = function() {
    let nodes = document.querySelectorAll('textarea')
    let val = {}
    nodes.forEach( (node) => {
	val[node.name] = filter.parseRawData(node.value)
	node.disabled = true
    })

    chrome.storage.local.set({filters: val}, () => {
	nodes.forEach( (node) => node.disabled = false )
    })
}

let settings2str = function() {
    return Promise.all([favourites_get(), lists_get()]).then( (val) => {
	return JSON.stringify({
	    favourites: val[0],
	    filters: val[1]
	})
    })
}


favourites_get().then( (val) => favourites_set(val) )
lists_get().then( (val) => lists_set(val) )

document.querySelector('#btn_save').onclick = function(event) {
    favourites_save()
    lists_save()
}

document.querySelector('#btn_defaults').onclick = function(event) {
    if (!window.confirm('Are you sure?')) return
    favourites_get(true).then( (val) => favourites_set(val) )
    lists_get(true).then( (val) => lists_set(val) )
}

document.querySelector('#btn_export').onclick = function(event) {
    settings2str().then( (settings) => {
	let blob = new Blob([settings], {type: 'text/plain'})
	let url = URL.createObjectURL(blob)

	let a = document.createElement('a')
	a.download = 'hn-dweller_settings.json'
	a.href = url
	a.click()

	URL.revokeObjectURL(url)
    })
}

// TODO: dnd import
