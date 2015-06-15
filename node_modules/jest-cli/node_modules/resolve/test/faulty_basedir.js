var path = require('path');
var test = require('tap').test;
var resolve = require('../');

test('faulty basedir must produce error in windows', function (t) {
    t.plan(1);

    var resolverDir = 'C:\\a\\b\\c\\d';

    resolve('tap/lib/main.js', { basedir : resolverDir }, function (err, res, pkg) {
        t.equal(true, !!err);
    });

});
