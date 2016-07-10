let assert = require('assert')

let filter = require('../news/filter')

suite('Filter', function() {
    setup(function() {
	this.fe = new filter.FilterExact()
	this.fr = new filter.FilterRegexp()
    })

    test('parse raw data', function() {
	assert.equal('foo|bar', filter.parseRawData('  foo\n bar\n\n\n').join('|'))
	assert.equal('', filter.parseRawData('').join('|'))
	assert.equal('', filter.parseRawData('  ').join('|'))
	assert.equal('', filter.parseRawData('  \n ').join('|'))
    })

    test('match exact', function() {
	this.fe.whitelist = filter.parseRawData('foo\nbar\nlist')
	this.fe.blacklist = filter.parseRawData('list\narray')

	assert.equal(false, this.fe.match('list'))
	assert.equal(true, this.fe.match('array'))
	this.fe.whitelist = []
	assert.equal(true, this.fe.match('list'))
    })

    test('match regexp', function() {
	this.fr.whitelist = filter.parseRawData('foo\nbar\nlist')
	this.fr.blacklist = filter.parseRawData('list\narray')

	assert.equal(false, this.fr.match('a list in the forrest'))
	assert.equal(true, this.fr.match('array!'))
	this.fe.whitelist = []
	assert.equal(true, this.fr.match('array!'))
	this.fr.blacklist = []
	assert.equal(false, this.fr.match('array'))
    })

    test('invalid regexp', function() {
	this.fr.blacklist = filter.parseRawData('ok\ninvalid)')
	this.fr.log = () =>
	assert.equal(false, this.fr.match('invalid input'))
    })
})
