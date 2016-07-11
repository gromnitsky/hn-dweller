# hn-dweller

An enhanced version of Hacker News. A YA Chrome extension for HN. It's
similar to https://github.com/gromnitsky/hackernews_blacklist, but
has more "modern" internals.

Arrr, I can't stop writing those petty extensions!

<img src='http://s.quickmeme.com/img/67/67cf154511cbc862924e48669f13d3490367be675d699eb01e5b934f9ac0f227.jpg'>


## Hints

* While reading comments, press <kbd>?</kbd>.

* Don't use the native HN "collapse comments" feature (`[-]` on the
  right), for it doesn't expand _new_ comments in a collapsed thread,
  but do use the "collapse comments" feature that is provided by
  hn-dweller (`[-]` on the left!).


## Compile

Prerequisites:

* nodejs 6.3.0
* `npm i -g make-commonjs-depend coffee-script json`
* xxd (comes w/ `vim-common` package in Fedora)
* openssl

### Compilation

1. cd to a tmp dir outside of a repo.
2. `make -f ../hn-dweller/main.mk`

The unpacked extension will be in `development` dir. You can load it
in Chrome via enabling 'developer mode' & clicking 'Load unpacked
extension...' button.

### Making a crx

1. Generate a private RSA key:

	`openssl genrsa -out private.pem 1024`

2. `make -f ../hn-dweller/main.mk crx`

You should get `hn-dweller-x.y.z-development.crx` file.


## License

MIT.
