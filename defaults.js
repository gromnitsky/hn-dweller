'use strict';

module.exports = {

    favourites: {
	black: 'BrendanEich',
	gray: 'wycats',
	white: 'edw519',
	maroon: 'jgrahamc',
	red: 'tptacek',
	purple: 'petercooper',
	fuchsia: 'patio11',
	green: '',
	lime: '',
	olive: '',
	yellow: '',
	orange: 'pg',
	navy: '',
	blue: '',
	teal: '',
	aqua: ''
    },

    filters: {
	// blacklist (exact)
	hostname: [
	    'www.theguardian.com',
	    'medium.com',
	    'www.nytimes.com',
	    'www.newyorker.com',
	    'www.slate.com',
	    'www.huffingtonpost.com',

	    'www.apple.com',
	    'daringfireball.net',
	    'www.themacro.com'
	],

	// blacklist (exact)
	user: [],

	// whitelist (regexp)
	title_white: [
	    'ruby',
	    'rails',
	    'javascript',
	    '\bNode(js)?\b'
	],

	// blacklist (regexp)
	title_black: [
	    'haskell',
	    'java',
	    '\\bApple\\b',
	    '\\bIOS(\\d+)?\\b',
	    'Iphone',
	    '\\bIp[ao]d',
	    '\\bMac(book)?\\b',
	    '\\b(Mac\\s+)?OS(\\s+)?X\\b',
	    '\\bIcloud',
	    '\\bItunes',
	    'Python',
	    'Django',
	    'Pycon',
	    '\\bPatent',
	    'Legislation',
	    'Govern?ment',
	    'Judge',
	    'Court\\b',
	    '\\bVim\\b',
	    'A/B\\sTest',
	    'Pirate',
	    'Torrent',
	    'App\\.net',
	    '\\bAsp\\.net',
	    'Nokia',
	    '\\bFlash'
	]
    }
}
