'use strict';

let IGNORED_ELEMENTS = ['INPUT', 'TEXTAREA']

let BINDINGS = {
    ',': ['Jump to the previous unread comment', 'prev_unread'],
    '.': ['Jump to the next unread comment', 'next_unread'],
    '?': ['(Close) this help', 'help', () => BINDINGS]
}

let is_valid_dom_node = function(name) {
    return IGNORED_ELEMENTS.indexOf(name) === -1
}

exports.connect = function(bus) {
    document.body.addEventListener('keydown', (event) => {
	if (!is_valid_dom_node(event.target.nodeName)) return

	if (event.key in BINDINGS) {
	    let cmd = bus.cmd[BINDINGS[event.key][1]]
	    let args = BINDINGS[event.key].slice(2)
	    cmd.name.apply(cmd.obj, args)
	}
    }, false)
}
