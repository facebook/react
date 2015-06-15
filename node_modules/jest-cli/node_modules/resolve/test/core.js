var test = require('tap').test;
var resolve = require('../');

test('core modules', function (t) {
    t.ok(resolve.isCore('fs'));
    t.ok(resolve.isCore('net'));
    t.ok(resolve.isCore('http'));
    
    t.ok(!resolve.isCore('seq'));
    t.ok(!resolve.isCore('../'));
    t.end();
});
