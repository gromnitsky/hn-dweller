class Keyboard {

    constructor() {
	this.connect()
    }

    connect() {
	document.body.addEventListener('keydown', (event) => {
	    if (!this.is_valid_dom_node(event.target)) return
	    console.log(event.keyCode)
	}, false)
    }

    is_valid_dom_node(node) {
	return Keyboard.IGNORED_ELEMENTS.indexOf(node.nodeName) !== -1
    }
}

Keyboard.IGNORED_ELEMENTS = ['INPUT', 'TEXTAREA']
Keyboard.bindings = {
    '188': [',', 'jump to previous unread comment', 'jump_prev_unread'],
    '190': ['.', 'jump to next unread comment', 'jump_next_unread']
}

module.exports = Keyboard
