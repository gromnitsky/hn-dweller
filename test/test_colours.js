'use strict';

let assert = require('assert')

let colours = require('../colours')

suite('Colour', function() {
    test('str2rgb', function() {
	assert.equal(null, colours.str2rgb(null))
	assert.equal(null, colours.str2rgb(""))
	assert.deepEqual({red:1,green:2,blue:3}, colours.str2rgb("1, 2, 3"))
	assert.deepEqual({red:255,green:255,blue:0}, colours.str2rgb('rgb(255, 255, 0)'))
    })
})
