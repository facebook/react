var test = require('tap').test;
var resolve = require('../');

test('$NODE_PATH', function (t) {
    t.plan(3);
    
    resolve('aaa', {
        paths: [
            __dirname + '/node_path/x',
            __dirname + '/node_path/y'
        ],
        basedir: __dirname,
    }, function (err, res) {
        t.equal(res, __dirname + '/node_path/x/aaa/index.js');
    });
    
    resolve('bbb', {
        paths: [
            __dirname + '/node_path/x',
            __dirname + '/node_path/y'
        ],
        basedir: __dirname,
    }, function (err, res) {
        t.equal(res, __dirname + '/node_path/y/bbb/index.js');
    });
    
    resolve('ccc', {
        paths: [
            __dirname + '/node_path/x',
            __dirname + '/node_path/y'
        ],
        basedir: __dirname,
    }, function (err, res) {
        t.equal(res, __dirname + '/node_path/x/ccc/index.js');
    });
});
