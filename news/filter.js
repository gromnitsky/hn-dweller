// Return an array from a string str.
exports.parseRawData = function(str) {
    let arr = str.split("\n")
    let r = []
    for (let idx of arr) {
	let v = idx.trim()
	if (v.length) r.push(v)
    }
    return r
}

class FilterInterface {
    constructor() {
	this.blacklist = []
	this.whitelist = []
	this.log = console.log.bind(console, 'filter:')
    }

    match(val) {
	try {
	    if (this.match_in_list(val, this.whitelist)) return false
	    return this.match_in_list(val, this.blacklist)
	} catch (err) {
	    this.log(`match error: ${err.message}`)
	}
	return false
    }
}

class FilterRegexp extends FilterInterface {
    match_in_list(val, list) {
	for (let idx of list) {
	    let re = new RegExp(idx, 'i')
	    if (val.match(re)) return true
	}
	return false
    }
}

exports.FilterRegexp = FilterRegexp

class FilterExact extends FilterInterface {
    match_in_list(val, list) {
	return list.includes(val)
    }
}

exports.FilterExact = FilterExact
