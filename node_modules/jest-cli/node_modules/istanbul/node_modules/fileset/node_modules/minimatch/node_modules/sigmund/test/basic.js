var test = require('tap').test
var sigmund = require('../sigmund.js')


// occasionally there are duplicates
// that's an acceptable edge-case.  JSON.stringify and util.inspect
// have some collision potential as well, though less, and collision
// detection is expensive.
var hash = '{abc/def/g{0h1i2{jkl'
var obj1 = {a:'b',c:/def/,g:['h','i',{j:'',k:'l'}]}
var obj2 = {a:'b',c:'/def/',g:['h','i','{jkl']}

var obj3 = JSON.parse(JSON.stringify(obj1))
obj3.c = /def/
obj3.g[2].cycle = obj3
var cycleHash = '{abc/def/g{0h1i2{jklcycle'

test('basic', function (t) {
    t.equal(sigmund(obj1), hash)
    t.equal(sigmund(obj2), hash)
    t.equal(sigmund(obj3), cycleHash)
    t.end()
})

