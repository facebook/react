/* eslint no-extend-native:0 */
// Load modules

var Code = require('code');
var Lab = require('lab');
var Qs = require('../');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var expect = Code.expect;
var describe = lab.experiment;
var it = lab.test;


describe('stringify()', function () {

    it('stringifies a querystring object', function (done) {

        expect(Qs.stringify({ a: 'b' })).to.equal('a=b');
        expect(Qs.stringify({ a: 1 })).to.equal('a=1');
        expect(Qs.stringify({ a: 1, b: 2 })).to.equal('a=1&b=2');
        expect(Qs.stringify({ a: 'A_Z' })).to.equal('a=A_Z');
        expect(Qs.stringify({ a: '€' })).to.equal('a=%E2%82%AC');
        expect(Qs.stringify({ a: '' })).to.equal('a=%EE%80%80');
        expect(Qs.stringify({ a: 'א' })).to.equal('a=%D7%90');
        expect(Qs.stringify({ a: '𐐷' })).to.equal('a=%F0%90%90%B7');
        done();
    });

    it('stringifies a nested object', function (done) {

        expect(Qs.stringify({ a: { b: 'c' } })).to.equal('a%5Bb%5D=c');
        expect(Qs.stringify({ a: { b: { c: { d: 'e' } } } })).to.equal('a%5Bb%5D%5Bc%5D%5Bd%5D=e');
        done();
    });

    it('stringifies an array value', function (done) {

        expect(Qs.stringify({ a: ['b', 'c', 'd'] })).to.equal('a%5B0%5D=b&a%5B1%5D=c&a%5B2%5D=d');
        done();
    });

    it('omits array indices when asked', function (done) {

        expect(Qs.stringify({ a: ['b', 'c', 'd'] }, { indices: false })).to.equal('a=b&a=c&a=d');
        done();
    });

    it('stringifies a nested array value', function (done) {

        expect(Qs.stringify({ a: { b: ['c', 'd'] } })).to.equal('a%5Bb%5D%5B0%5D=c&a%5Bb%5D%5B1%5D=d');
        done();
    });

    it('stringifies an object inside an array', function (done) {

        expect(Qs.stringify({ a: [{ b: 'c' }] })).to.equal('a%5B0%5D%5Bb%5D=c');
        expect(Qs.stringify({ a: [{ b: { c: [1] } }] })).to.equal('a%5B0%5D%5Bb%5D%5Bc%5D%5B0%5D=1');
        done();
    });

    it('does not omit object keys when indices = false', function (done) {

        expect(Qs.stringify({ a: [{ b: 'c' }] }, { indices: false })).to.equal('a%5Bb%5D=c');
        done();
    });

    it('uses indices notation for arrays when indices=true', function (done) {

        expect(Qs.stringify({ a: ['b', 'c'] }, { indices: true })).to.equal('a%5B0%5D=b&a%5B1%5D=c');
        done();
    });

    it('uses indices notation for arrays when no arrayFormat is specified', function (done) {

        expect(Qs.stringify({ a: ['b', 'c'] })).to.equal('a%5B0%5D=b&a%5B1%5D=c');
        done();
    });

    it('uses indices notation for arrays when no arrayFormat=indices', function (done) {

        expect(Qs.stringify({ a: ['b', 'c'] }, { arrayFormat: 'indices' })).to.equal('a%5B0%5D=b&a%5B1%5D=c');
        done();
    });

    it('uses repeat notation for arrays when no arrayFormat=repeat', function (done) {

        expect(Qs.stringify({ a: ['b', 'c'] }, { arrayFormat: 'repeat' })).to.equal('a=b&a=c');
        done();
    });

    it('uses brackets notation for arrays when no arrayFormat=brackets', function (done) {

        expect(Qs.stringify({ a: ['b', 'c'] }, { arrayFormat: 'brackets' })).to.equal('a%5B%5D=b&a%5B%5D=c');
        done();
    });

    it('stringifies a complicated object', function (done) {

        expect(Qs.stringify({ a: { b: 'c', d: 'e' } })).to.equal('a%5Bb%5D=c&a%5Bd%5D=e');
        done();
    });

    it('stringifies an empty value', function (done) {

        expect(Qs.stringify({ a: '' })).to.equal('a=');
        expect(Qs.stringify({ a: null }, {strictNullHandling: true})).to.equal('a');

        expect(Qs.stringify({ a: '', b: '' })).to.equal('a=&b=');
        expect(Qs.stringify({ a: null, b: '' }, {strictNullHandling: true})).to.equal('a&b=');

        expect(Qs.stringify({ a: { b: '' } })).to.equal('a%5Bb%5D=');
        expect(Qs.stringify({ a: { b: null } }, {strictNullHandling: true})).to.equal('a%5Bb%5D');
        expect(Qs.stringify({ a: { b: null } }, {strictNullHandling: false})).to.equal('a%5Bb%5D=');

        done();
    });

    it('stringifies an empty object', function (done) {

        var obj = Object.create(null);
        obj.a = 'b';
        expect(Qs.stringify(obj)).to.equal('a=b');
        done();
    });

    it('returns an empty string for invalid input', function (done) {

        expect(Qs.stringify(undefined)).to.equal('');
        expect(Qs.stringify(false)).to.equal('');
        expect(Qs.stringify(null)).to.equal('');
        expect(Qs.stringify('')).to.equal('');
        done();
    });

    it('stringifies an object with an empty object as a child', function (done) {

        var obj = {
            a: Object.create(null)
        };

        obj.a.b = 'c';
        expect(Qs.stringify(obj)).to.equal('a%5Bb%5D=c');
        done();
    });

    it('drops keys with a value of undefined', function (done) {

        expect(Qs.stringify({ a: undefined })).to.equal('');

        expect(Qs.stringify({ a: { b: undefined, c: null } }, {strictNullHandling: true})).to.equal('a%5Bc%5D');
        expect(Qs.stringify({ a: { b: undefined, c: null } }, {strictNullHandling: false})).to.equal('a%5Bc%5D=');
        expect(Qs.stringify({ a: { b: undefined, c: '' } })).to.equal('a%5Bc%5D=');
        done();
    });

    it('url encodes values', function (done) {

        expect(Qs.stringify({ a: 'b c' })).to.equal('a=b%20c');
        done();
    });

    it('stringifies a date', function (done) {

        var now = new Date();
        var str = 'a=' + encodeURIComponent(now.toISOString());
        expect(Qs.stringify({ a: now })).to.equal(str);
        done();
    });

    it('stringifies the weird object from qs', function (done) {

        expect(Qs.stringify({ 'my weird field': '~q1!2"\'w$5&7/z8)?' })).to.equal('my%20weird%20field=~q1%212%22%27w%245%267%2Fz8%29%3F');
        done();
    });

    it('skips properties that are part of the object prototype', function (done) {

        Object.prototype.crash = 'test';
        expect(Qs.stringify({ a: 'b'})).to.equal('a=b');
        expect(Qs.stringify({ a: { b: 'c' } })).to.equal('a%5Bb%5D=c');
        delete Object.prototype.crash;
        done();
    });

    it('stringifies boolean values', function (done) {

        expect(Qs.stringify({ a: true })).to.equal('a=true');
        expect(Qs.stringify({ a: { b: true } })).to.equal('a%5Bb%5D=true');
        expect(Qs.stringify({ b: false })).to.equal('b=false');
        expect(Qs.stringify({ b: { c: false } })).to.equal('b%5Bc%5D=false');
        done();
    });

    it('stringifies buffer values', function (done) {

        expect(Qs.stringify({ a: new Buffer('test') })).to.equal('a=test');
        expect(Qs.stringify({ a: { b: new Buffer('test') } })).to.equal('a%5Bb%5D=test');
        done();
    });

    it('stringifies an object using an alternative delimiter', function (done) {

        expect(Qs.stringify({ a: 'b', c: 'd' }, { delimiter: ';' })).to.equal('a=b;c=d');
        done();
    });

    it('doesn\'t blow up when Buffer global is missing', function (done) {

        var tempBuffer = global.Buffer;
        delete global.Buffer;
        expect(Qs.stringify({ a: 'b', c: 'd' })).to.equal('a=b&c=d');
        global.Buffer = tempBuffer;
        done();
    });

    it('selects properties when filter=array', function (done) {

        expect(Qs.stringify({ a: 'b' }, { filter: ['a'] })).to.equal('a=b');
        expect(Qs.stringify({ a: 1}, { filter: [] })).to.equal('');
        expect(Qs.stringify({ a: { b: [1, 2, 3, 4], c: 'd' }, c: 'f' }, { filter: ['a', 'b', 0, 2]})).to.equal('a%5Bb%5D%5B0%5D=1&a%5Bb%5D%5B2%5D=3');
        done();

    });

    it('supports custom representations when filter=function', function (done) {

        var calls = 0;
        var obj = { a: 'b', c: 'd', e: { f: new Date(1257894000000) } };
        var filterFunc = function (prefix, value) {

            calls++;
            if (calls === 1) {
                expect(prefix).to.be.empty();
                expect(value).to.equal(obj);
            }
            else if (prefix === 'c') {
                return;
            }
            else if (value instanceof Date) {
                expect(prefix).to.equal('e[f]');
                return value.getTime();
            }
            return value;
        };

        expect(Qs.stringify(obj, { filter: filterFunc })).to.equal('a=b&e%5Bf%5D=1257894000000');
        expect(calls).to.equal(5);
        done();

    });
});
