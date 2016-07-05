'use strict';

let IGNORED_ELEMENTS = ['INPUT', 'TEXTAREA']

let is_valid_dom_node = function(name) {
    return IGNORED_ELEMENTS.indexOf(name) === -1
}

let listen = function(event) {
    if (!is_valid_dom_node(event.target.nodeName)) return

    if (event.key in exports.bindings) {
	let cmd = exports.bindings[event.key]
	cmd.method.apply(cmd.obj, cmd.args)
    }
}

exports.connect = function() {
    document.body.addEventListener('keydown', listen, false)
}

exports.bindings = {}

exports.register = function(data) {
    exports.bindings[data.key] = data
}
