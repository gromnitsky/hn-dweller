'use strict';

// All functions operate with a simple color object as in 'white' const.

const white = {
    red: 255,
    green: 255,
    blue: 255
}

const black = {
    red: 0,
    green: 0,
    blue: 0
}

let str2rgb = function(str) {
    if (!str) return null
    let m = str.match(/(\d{1,3}), *(\d{1,3}), *(\d{1,3})/)
    if (!m) return null
    return {
	red: parseInt(m[1]),
	green: parseInt(m[2]),
	blue: parseInt(m[3])
    }
}

let inverted = function(node, css) {
    let rgb = str2rgb(window.getComputedStyle(node).getPropertyValue(css))
    if (!rgb) throw new Error(`cannot parse ${css} value`)
    for (let key in rgb) rgb[key] = 255 - rgb[key]
    return rgb
}

let contrasted = function(node, css) {
    let c = inverted(node, css)
    let yiq = ((c.red * 299) + (c.green * 587) + (c.blue * 114)) / 1000
//    console.log(c, node.innerText, yiq)
    return yiq >= 127 ? white : black
}

let toRGBA = function(colour) {
    return `rgba(${colour.red}, ${colour.green}, ${colour.blue}, 1)`
}

exports.paint_node = function(node, colour) {
    node.style.padding = '0px 3px 0px 3px'
    node.style.background = colour

    let rgb = contrasted(node, 'background-color')
    node.style.color = toRGBA(rgb)
    node.style.border = `1px solid ${toRGBA(rgb)}`
}

// 4 tests
exports.str2rgb = str2rgb
