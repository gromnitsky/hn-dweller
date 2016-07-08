/* global indexedDB */
'use strict';

class ClunkyStore {
    constructor(dbname, version, table) {
	this.dbname = dbname
	this.version = version
	this.table = table
	this.db = null

	this.log = function() {	// TODO: extract to utils.js
	    let args = [...arguments]
	    args[0] = `clunkystore: ${args[0]}`
	    console.log.apply(console, args)
	}
    }

    open() {
	return new Promise( (resolve, reject) => {
	    let req = indexedDB.open(this.dbname, this.version)
	    req.onerror = (event) => reject(event.target.error)
	    req.onupgradeneeded = (event) => {
		this.db = event.target.result
		// out-of-line keys
		this.db.createObjectStore(this.table)
		resolve('upgraded')
	    }
	    req.onsuccess = (event) => {
		this.db = event.target.result
		this.log(`${this.dbname} ${this.version}: open '${this.table}' objectstore`)
		resolve('opened')
	    }
	})
    }

    add(msgid, value = true) {
	return new Promise( (resolve, reject) => {
	    let tran = this.db.transaction([this.table], "readwrite")
	    let objectstore = tran.objectStore(this.table)
	    let req = objectstore.put(value, msgid)
	    req.onsuccess = (event) => {
		this.log(`add: ${msgid}`)
		resolve('alright')
	    }
	    req.onerror = (event) => reject(event.target.error)
	})
    }

    del(msgid) {
	return new Promise( (resolve, reject) => {
	    let tran = this.db.transaction([this.table], "readwrite")
	    let objectstore = tran.objectStore(this.table)
	    let req = objectstore.delete(msgid)
	    req.onsuccess = (event) => {
		this.log(`delete: ${msgid}`)
		resolve('alright')
	    }
	    req.onerror = (event) => reject(event.target.error)
	})
    }

    exists(msgid) {
	return new Promise( (resolve, reject) => {
	    let tran = this.db.transaction([this.table])
	    let objectstore = tran.objectStore(this.table)
	    let req = objectstore.get(msgid)
	    req.onsuccess = (event) => {
		if (event.target.result) {
		    this.log(`exists: ${msgid}: ok`)
		    resolve(event.target.result)
		} else {
		    reject(new Error(`exists: ${msgid}: NOT FOUND`))
		}
	    }
	    req.onerror = (event) => reject(event.target.error)
	})
    }
}

module.exports = ClunkyStore
