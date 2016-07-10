/* globals chrome */

'use strict';

require("babel-polyfill")

let defaults = require('../defaults')
let colours = require('../colours')
let filter = require('../news/filter')

let favourites_get = function(reset) {
    let colourpairs = defaults.favourites
    chrome.storage.local.get('favourites', (val) => {
	if (!reset && val.favourites) colourpairs = val.favourites
	favourites_set(colourpairs)
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
	r[idx.name] = idx.value || ""
	idx.disabled = true
    }

    chrome.storage.local.set({favourites: r}, (val) => {
	for (let idx of inputs) idx.disabled = false
    })
}

let lists_get = function(reset) {
    let lists = defaults
    chrome.storage.local.get(['hostname', 'user', 'title_white', 'title_black'], (val) => {
	if (!reset && Object.keys(val).length === 4) lists = val
	lists_set(lists)
    })
}

let lists_set = function(lists) {
    let nodes = document.querySelectorAll('textarea')
    nodes.forEach( (node) => node.value = lists[node.name].join("\n") )
}

let lists_save = function() {
    let nodes = document.querySelectorAll('textarea')
    nodes.forEach( (node) => node.disabled = true)

    for (let node of nodes) {
	let r = {}
	r[node.name] = filter.parseRawData(node.value)
	chrome.storage.local.set(r, (val) => node.disabled = false )
    }
}


favourites_get()
lists_get()

document.querySelector('#btn_save').onclick = function(event) {
    favourites_save()
    lists_save()
}

document.querySelector('#btn_defaults').onclick = function(event) {
    if (!window.confirm('Are you sure?')) return
    favourites_get(true)
    lists_get(true)
}

document.querySelector('#btn_export').onclick = function(event) {
    // TODO
}

// TODO: dnd import
