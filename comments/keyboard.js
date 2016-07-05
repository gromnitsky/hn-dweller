class Keyboard {

    constructor(bus) {
	this.bus = bus
	this.connect()
    }

    connect() {
	document.body.addEventListener('keydown', (event) => {
	    if (!this.is_valid_dom_node(event.target.nodeName)) return

	    if (event.key in Keyboard.bindings) {
		let cmd = this.bus.cmd[Keyboard.bindings[event.key][1]]
		let args = Keyboard.bindings[event.key].slice(2)
		cmd.name.apply(cmd.obj, args)
	    }
	}, false)
    }

    is_valid_dom_node(name) {
	return Keyboard.IGNORED_ELEMENTS.indexOf(name) === -1
    }
}

Keyboard.IGNORED_ELEMENTS = ['INPUT', 'TEXTAREA']
Keyboard.bindings = {
    ',': ['Jump to the previous unread comment', 'prev_unread'],
    '.': ['Jump to the next unread comment', 'next_unread'],
    '?': ['(Close) this help', 'help', () => Keyboard.bindings]
}

module.exports = Keyboard
