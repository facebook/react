// Load modules

var Code = require('code');
var Lab = require('lab');
var Utils = require('../lib/utils');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.experiment;
var it = lab.test;


describe('merge()', function () {

    it('can merge two objects with the same key', function (done) {

        expect(Utils.merge({ a: 'b' }, { a: 'c' })).to.deep.equal({ a: ['b', 'c'] });
        done();
    });
});
