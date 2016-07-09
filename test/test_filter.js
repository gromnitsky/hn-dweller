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

    test('white set/get', function() {
	let data = '  foo\n bar\n\n\n'
	this.fe.white_set(data)
	assert.equal('foo\nbar', this.fe.white_get())

	this.fe.white_set('')
	assert.equal('', this.fe.white_get())
    })

    test('match exact', function() {
	this.fe.white_set('foo\nbar\nlist')
	this.fe.black_set('list\narray')

	assert.equal(false, this.fe.match('list'))
	assert.equal(true, this.fe.match('array'))
	this.fe.white_set('')
	assert.equal(true, this.fe.match('list'))
    })

    test('match regexp', function() {
	this.fr.white_set('foo\nbar\nlist')
	this.fr.black_set('list\narray')

	assert.equal(false, this.fr.match('a list in the forrest'))
	assert.equal(true, this.fr.match('array!'))
	this.fe.white_set('')
	assert.equal(true, this.fr.match('array!'))
	this.fr.black_set('')
	assert.equal(false, this.fr.match('array'))
    })

    test('invalid regexp', function() {
	this.fr.black_set('ok\ninvalid)')
	this.fr.log = () =>
	assert.equal(false, this.fr.match('invalid input'))
    })
})
