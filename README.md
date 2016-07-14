# hn-dweller

An enhanced version of Hacker News. A YA Chrome extension. It's
somewhat similar to an old
https://github.com/gromnitsky/hackernews_blacklist, but has more
"modern" internals.

Arrr, I can't stop writing those petty extensions!

![I am not crazy, I swear](http://s.quickmeme.com/img/67/67cf154511cbc862924e48669f13d3490367be675d699eb01e5b934f9ac0f227.jpg)


## Why?

The idea is to have such an interface to _comments pages_ that makes
them fully controllable from the keyboard. For this hn-dweller
creates a tree structure of messages that allows us to collapse them,
jump to parent, slide to root comments, etc.

After opening a comments page, I usually use <kbd>.</kbd> to jump to
the next _open_ comment. Those open comments become closed
automatically if you refresh the page. This allows us to never read a
comment twice.

When reading a (sub)thread & becoming tired of it, press
<kbd>r</kbd>. To jump to the next root comment, press <kbd>]</kbd>.

If you want to move to the next message of the same author, press
<kbd>l</kbd>.

Pressing <kbd>L</kbd>, in any moment, moves you to the previous
message you were on.

To see all keybindings, press <kbd>?</kbd>. This is what renders to
you when you do it:

![kbd](https://raw.github.com/gromnitsky/hn-dweller/master/README.keybindings.png)

*A hint*: don't use the native HN "collapse comments" feature (`[-]` on
the _right_), for it doesn't expand _new_ comments in a collapsed
thread, but do use the "collapse comments" feature that is provided by
hn-dweller (`[-]` on the _left_!).

### Black lists & Favourites

In the options page, there are several lists that hn-dweller uses to
filter-out the news stories (on the HN front page).

Comments pages use the _Favourites_ list to paint the chosen users in
different colours & fill a special _Favourites_ dialog, accessible via
<kbd>f</kbd> key.


## Compile

Prerequisites:

* nodejs 6.3.0
* `npm i -g json`
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
