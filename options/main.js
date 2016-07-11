/* globals chrome */

'use strict';

require("babel-polyfill")

let defaults = require('../defaults')
let colours = require('../colours')
let filter = require('../news/filter')

let settings = function(reset) {
    return new Promise( (resolve, _) => {
	chrome.storage.local.get(null, (val) => {
	    resolve( (!reset && val.favourites && val.filters) ? val : defaults)
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

let dnd_setup = function() {
    let holder = document
    holder.addEventListener('dragenter', (event) => {
	event.stopPropagation()
	event.preventDefault()
	colours.invert_element(holder.body)
    }, false)

    holder.addEventListener('dragleave', (event) => {
	event.stopPropagation()
	event.preventDefault()
	colours.invert_element(holder.body)
    }, false)

    holder.addEventListener('dragover', (event) => {
	event.stopPropagation()
	event.preventDefault()
    }, false)

    holder.addEventListener('drop', (event) => {
	event.stopPropagation()
	event.preventDefault()
	colours.invert_element(holder.body)

	let dt = event.dataTransfer
	if (!dt.files || dt.files.length !== 1) {
	    alert('You need exactly 1 .json file. Try again.')
	    return
	}

	settings_import(dt.files[0])
    }, false)
}

let settings_import = function(file) {
    if (!file) return

    let exit_now = false

    let reader = new FileReader()
    reader.readAsText(file)

    reader.onerror = () => {
	alert(`Error reading '${file.name}'`)
	exit_now = true
    }

    reader.onload = (data) => {
	if (exit_now) return

	let r = null
	try {
	    r = JSON.parse(data.target.result)
	} catch (err) {
	    alert(`Error parsing '${file.name}': ${err.message}`)
	    return
	}

	favourites_set(r.favourites)
	lists_set(r.filters)
    }
}


settings().then( (val) => {
    favourites_set(val.favourites)
    lists_set(val.filters)
})

document.querySelector('#btn_save').onclick = function(event) {
    favourites_save()
    lists_save()
}

document.querySelector('#btn_defaults').onclick = function(event) {
    if (!window.confirm('Are you sure?')) return
    settings(true).then( (val) => {
	favourites_set(val.favourites)
	lists_set(val.filters)
    })
}

document.querySelector('#btn_export').onclick = function(event) {
    settings().then( (val) => {
	val = JSON.stringify(val)
	let blob = new Blob([val], {type: 'text/plain'})
	let url = URL.createObjectURL(blob)

	let a = document.createElement('a')
	a.download = 'hn-dweller_settings.json'
	a.href = url
	a.click()

	URL.revokeObjectURL(url)
    })
}

dnd_setup()
