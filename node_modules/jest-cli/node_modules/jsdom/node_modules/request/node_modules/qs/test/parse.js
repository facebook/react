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


describe('parse()', function () {

    it('parses a simple string', function (done) {

        expect(Qs.parse('0=foo')).to.deep.equal({ '0': 'foo' }, { prototype: false });
        expect(Qs.parse('foo=c++')).to.deep.equal({ foo: 'c  ' }, { prototype: false });
        expect(Qs.parse('a[>=]=23')).to.deep.equal({ a: { '>=': '23' } }, { prototype: false });
        expect(Qs.parse('a[<=>]==23')).to.deep.equal({ a: { '<=>': '=23' } }, { prototype: false });
        expect(Qs.parse('a[==]=23')).to.deep.equal({ a: { '==': '23' } }, { prototype: false });
        expect(Qs.parse('foo', {strictNullHandling: true})).to.deep.equal({ foo: null }, { prototype: false });
        expect(Qs.parse('foo' )).to.deep.equal({ foo: '' }, { prototype: false });
        expect(Qs.parse('foo=')).to.deep.equal({ foo: '' }, { prototype: false });
        expect(Qs.parse('foo=bar')).to.deep.equal({ foo: 'bar' }, { prototype: false });
        expect(Qs.parse(' foo = bar = baz ')).to.deep.equal({ ' foo ': ' bar = baz ' }, { prototype: false });
        expect(Qs.parse('foo=bar=baz')).to.deep.equal({ foo: 'bar=baz' }, { prototype: false });
        expect(Qs.parse('foo=bar&bar=baz')).to.deep.equal({ foo: 'bar', bar: 'baz' }, { prototype: false });
        expect(Qs.parse('foo2=bar2&baz2=')).to.deep.equal({ foo2: 'bar2', baz2: '' }, { prototype: false });
        expect(Qs.parse('foo=bar&baz', {strictNullHandling: true})).to.deep.equal({ foo: 'bar', baz: null }, { prototype: false });
        expect(Qs.parse('foo=bar&baz')).to.deep.equal({ foo: 'bar', baz: '' }, { prototype: false });
        expect(Qs.parse('cht=p3&chd=t:60,40&chs=250x100&chl=Hello|World')).to.deep.equal({
            cht: 'p3',
            chd: 't:60,40',
            chs: '250x100',
            chl: 'Hello|World'
        }, { prototype: false });
        done();
    });

    it('allows disabling dot notation', function (done) {

        expect(Qs.parse('a.b=c')).to.deep.equal({ a: { b: 'c' } }, { prototype: false });
        expect(Qs.parse('a.b=c', { allowDots: false })).to.deep.equal({ 'a.b': 'c' }, { prototype: false });
        done();
    });

    it('parses a single nested string', function (done) {

        expect(Qs.parse('a[b]=c')).to.deep.equal({ a: { b: 'c' } }, { prototype: false });
        done();
    });

    it('parses a double nested string', function (done) {

        expect(Qs.parse('a[b][c]=d')).to.deep.equal({ a: { b: { c: 'd' } } }, { prototype: false });
        done();
    });

    it('defaults to a depth of 5', function (done) {

        expect(Qs.parse('a[b][c][d][e][f][g][h]=i')).to.deep.equal({ a: { b: { c: { d: { e: { f: { '[g][h]': 'i' } } } } } } }, { prototype: false });
        done();
    });

    it('only parses one level when depth = 1', function (done) {

        expect(Qs.parse('a[b][c]=d', { depth: 1 })).to.deep.equal({ a: { b: { '[c]': 'd' } } }, { prototype: false });
        expect(Qs.parse('a[b][c][d]=e', { depth: 1 })).to.deep.equal({ a: { b: { '[c][d]': 'e' } } }, { prototype: false });
        done();
    });

    it('parses a simple array', function (done) {

        expect(Qs.parse('a=b&a=c')).to.deep.equal({ a: ['b', 'c'] }, { prototype: false });
        done();
    });

    it('parses an explicit array', function (done) {

        expect(Qs.parse('a[]=b')).to.deep.equal({ a: ['b'] }, { prototype: false });
        expect(Qs.parse('a[]=b&a[]=c')).to.deep.equal({ a: ['b', 'c'] }, { prototype: false });
        expect(Qs.parse('a[]=b&a[]=c&a[]=d')).to.deep.equal({ a: ['b', 'c', 'd'] }, { prototype: false });
        done();
    });

    it('parses a mix of simple and explicit arrays', function (done) {

        expect(Qs.parse('a=b&a[]=c')).to.deep.equal({ a: ['b', 'c'] }, { prototype: false });
        expect(Qs.parse('a[]=b&a=c')).to.deep.equal({ a: ['b', 'c'] }, { prototype: false });
        expect(Qs.parse('a[0]=b&a=c')).to.deep.equal({ a: ['b', 'c'] }, { prototype: false });
        expect(Qs.parse('a=b&a[0]=c')).to.deep.equal({ a: ['b', 'c'] }, { prototype: false });
        expect(Qs.parse('a[1]=b&a=c')).to.deep.equal({ a: ['b', 'c'] }, { prototype: false });
        expect(Qs.parse('a=b&a[1]=c')).to.deep.equal({ a: ['b', 'c'] }, { prototype: false });
        done();
    });

    it('parses a nested array', function (done) {

        expect(Qs.parse('a[b][]=c&a[b][]=d')).to.deep.equal({ a: { b: ['c', 'd'] } }, { prototype: false });
        expect(Qs.parse('a[>=]=25')).to.deep.equal({ a: { '>=': '25' } }, { prototype: false });
        done();
    });

    it('allows to specify array indices', function (done) {

        expect(Qs.parse('a[1]=c&a[0]=b&a[2]=d')).to.deep.equal({ a: ['b', 'c', 'd'] }, { prototype: false });
        expect(Qs.parse('a[1]=c&a[0]=b')).to.deep.equal({ a: ['b', 'c'] }, { prototype: false });
        expect(Qs.parse('a[1]=c')).to.deep.equal({ a: ['c'] }, { prototype: false });
        done();
    });

    it('limits specific array indices to 20', function (done) {

        expect(Qs.parse('a[20]=a')).to.deep.equal({ a: ['a'] }, { prototype: false });
        expect(Qs.parse('a[21]=a')).to.deep.equal({ a: { '21': 'a' } }, { prototype: false });
        done();
    });

    it('supports keys that begin with a number', function (done) {

        expect(Qs.parse('a[12b]=c')).to.deep.equal({ a: { '12b': 'c' } }, { prototype: false });
        done();
    });

    it('supports encoded = signs', function (done) {

        expect(Qs.parse('he%3Dllo=th%3Dere')).to.deep.equal({ 'he=llo': 'th=ere' }, { prototype: false });
        done();
    });

    it('is ok with url encoded strings', function (done) {

        expect(Qs.parse('a[b%20c]=d')).to.deep.equal({ a: { 'b c': 'd' } }, { prototype: false });
        expect(Qs.parse('a[b]=c%20d')).to.deep.equal({ a: { b: 'c d' } }, { prototype: false });
        done();
    });

    it('allows brackets in the value', function (done) {

        expect(Qs.parse('pets=["tobi"]')).to.deep.equal({ pets: '["tobi"]' }, { prototype: false });
        expect(Qs.parse('operators=[">=", "<="]')).to.deep.equal({ operators: '[">=", "<="]' }, { prototype: false });
        done();
    });

    it('allows empty values', function (done) {

        expect(Qs.parse('')).to.deep.equal({}, { prototype: false });
        expect(Qs.parse(null)).to.deep.equal({}, { prototype: false });
        expect(Qs.parse(undefined)).to.deep.equal({}, { prototype: false });
        done();
    });

    it('transforms arrays to objects', function (done) {

        expect(Qs.parse('foo[0]=bar&foo[bad]=baz')).to.deep.equal({ foo: { '0': 'bar', bad: 'baz' } }, { prototype: false });
        expect(Qs.parse('foo[bad]=baz&foo[0]=bar')).to.deep.equal({ foo: { bad: 'baz', '0': 'bar' } }, { prototype: false });
        expect(Qs.parse('foo[bad]=baz&foo[]=bar')).to.deep.equal({ foo: { bad: 'baz', '0': 'bar' } }, { prototype: false });
        expect(Qs.parse('foo[]=bar&foo[bad]=baz')).to.deep.equal({ foo: { '0': 'bar', bad: 'baz' } }, { prototype: false });
        expect(Qs.parse('foo[bad]=baz&foo[]=bar&foo[]=foo')).to.deep.equal({ foo: { bad: 'baz', '0': 'bar', '1': 'foo' } }, { prototype: false });
        expect(Qs.parse('foo[0][a]=a&foo[0][b]=b&foo[1][a]=aa&foo[1][b]=bb')).to.deep.equal({foo: [ {a: 'a', b: 'b'}, {a: 'aa', b: 'bb'} ]}, { prototype: false });
        expect(Qs.parse('a[]=b&a[t]=u&a[hasOwnProperty]=c')).to.deep.equal({ a: { '0': 'b', t: 'u', hasOwnProperty: 'c' } }, { prototype: false });
        expect(Qs.parse('a[]=b&a[hasOwnProperty]=c&a[x]=y')).to.deep.equal({ a: { '0': 'b', hasOwnProperty: 'c', x: 'y' } }, { prototype: false });
        done();
    });

    it('transforms arrays to objects (dot notation)', function (done) {

        expect(Qs.parse('foo[0].baz=bar&fool.bad=baz')).to.deep.equal({ foo: [ { baz: 'bar'} ], fool: { bad: 'baz' } }, { prototype: false });
        expect(Qs.parse('foo[0].baz=bar&fool.bad.boo=baz')).to.deep.equal({ foo: [ { baz: 'bar'} ], fool: { bad: { boo: 'baz' } } }, { prototype: false });
        expect(Qs.parse('foo[0][0].baz=bar&fool.bad=baz')).to.deep.equal({ foo: [[ { baz: 'bar'} ]], fool: { bad: 'baz' } }, { prototype: false });
        expect(Qs.parse('foo[0].baz[0]=15&foo[0].bar=2')).to.deep.equal({ foo: [{ baz: ['15'], bar: '2' }] }, { prototype: false });
        expect(Qs.parse('foo[0].baz[0]=15&foo[0].baz[1]=16&foo[0].bar=2')).to.deep.equal({ foo: [{ baz: ['15', '16'], bar: '2' }] }, { prototype: false });
        expect(Qs.parse('foo.bad=baz&foo[0]=bar')).to.deep.equal({ foo: { bad: 'baz', '0': 'bar' } }, { prototype: false });
        expect(Qs.parse('foo.bad=baz&foo[]=bar')).to.deep.equal({ foo: { bad: 'baz', '0': 'bar' } }, { prototype: false });
        expect(Qs.parse('foo[]=bar&foo.bad=baz')).to.deep.equal({ foo: { '0': 'bar', bad: 'baz' } }, { prototype: false });
        expect(Qs.parse('foo.bad=baz&foo[]=bar&foo[]=foo')).to.deep.equal({ foo: { bad: 'baz', '0': 'bar', '1': 'foo' } }, { prototype: false });
        expect(Qs.parse('foo[0].a=a&foo[0].b=b&foo[1].a=aa&foo[1].b=bb')).to.deep.equal({foo: [ {a: 'a', b: 'b'}, {a: 'aa', b: 'bb'} ]}, { prototype: false });
        done();
    });

    it('can add keys to objects', function (done) {

        expect(Qs.parse('a[b]=c&a=d')).to.deep.equal({ a: { b: 'c', d: true } }, { prototype: false });
        done();
    });

    it('correctly prunes undefined values when converting an array to an object', function (done) {

        expect(Qs.parse('a[2]=b&a[99999999]=c')).to.deep.equal({ a: { '2': 'b', '99999999': 'c' } }, { prototype: false });
        done();
    });

    it('supports malformed uri characters', function (done) {

        expect(Qs.parse('{%:%}', {strictNullHandling: true})).to.deep.equal({ '{%:%}': null }, { prototype: false });
        expect(Qs.parse('{%:%}=')).to.deep.equal({ '{%:%}': '' }, { prototype: false });
        expect(Qs.parse('foo=%:%}')).to.deep.equal({ foo: '%:%}' }, { prototype: false });
        done();
    });

    it('doesn\'t produce empty keys', function (done) {

        expect(Qs.parse('_r=1&')).to.deep.equal({ '_r': '1' }, { prototype: false });
        done();
    });

    it('cannot access Object prototype', function (done) {

        Qs.parse('constructor[prototype][bad]=bad');
        Qs.parse('bad[constructor][prototype][bad]=bad');
        expect(typeof Object.prototype.bad).to.equal('undefined');
        done();
    });

    it('parses arrays of objects', function (done) {

        expect(Qs.parse('a[][b]=c')).to.deep.equal({ a: [{ b: 'c' }] }, { prototype: false });
        expect(Qs.parse('a[0][b]=c')).to.deep.equal({ a: [{ b: 'c' }] }, { prototype: false });
        done();
    });

    it('allows for empty strings in arrays', function (done) {

        expect(Qs.parse('a[]=b&a[]=&a[]=c')).to.deep.equal({ a: ['b', '', 'c'] }, { prototype: false });
        expect(Qs.parse('a[0]=b&a[1]&a[2]=c&a[19]=', {strictNullHandling: true})).to.deep.equal({ a: ['b', null, 'c', ''] }, { prototype: false });
        expect(Qs.parse('a[0]=b&a[1]=&a[2]=c&a[19]', {strictNullHandling: true})).to.deep.equal({ a: ['b', '', 'c', null] }, { prototype: false });
        expect(Qs.parse('a[]=&a[]=b&a[]=c')).to.deep.equal({ a: ['', 'b', 'c'] }, { prototype: false });
        done();
    });

    it('compacts sparse arrays', function (done) {

        expect(Qs.parse('a[10]=1&a[2]=2')).to.deep.equal({ a: ['2', '1'] }, { prototype: false });
        done();
    });

    it('parses semi-parsed strings', function (done) {

        expect(Qs.parse({ 'a[b]': 'c' })).to.deep.equal({ a: { b: 'c' } }, { prototype: false });
        expect(Qs.parse({ 'a[b]': 'c', 'a[d]': 'e' })).to.deep.equal({ a: { b: 'c', d: 'e' } }, { prototype: false });
        done();
    });

    it('parses buffers correctly', function (done) {

        var b = new Buffer('test');
        expect(Qs.parse({ a: b })).to.deep.equal({ a: b }, { prototype: false });
        done();
    });

    it('continues parsing when no parent is found', function (done) {

        expect(Qs.parse('[]=&a=b')).to.deep.equal({ '0': '', a: 'b' }, { prototype: false });
        expect(Qs.parse('[]&a=b', {strictNullHandling: true})).to.deep.equal({ '0': null, a: 'b' }, { prototype: false });
        expect(Qs.parse('[foo]=bar')).to.deep.equal({ foo: 'bar' }, { prototype: false });
        done();
    });

    it('does not error when parsing a very long array', function (done) {

        var str = 'a[]=a';
        while (Buffer.byteLength(str) < 128 * 1024) {
            str += '&' + str;
        }

        expect(function () {

            Qs.parse(str);
        }).to.not.throw();

        done();
    });

    it('should not throw when a native prototype has an enumerable property', { parallel: false }, function (done) {

        Object.prototype.crash = '';
        Array.prototype.crash = '';
        expect(Qs.parse.bind(null, 'a=b')).to.not.throw();
        expect(Qs.parse('a=b')).to.deep.equal({ a: 'b' }, { prototype: false });
        expect(Qs.parse.bind(null, 'a[][b]=c')).to.not.throw();
        expect(Qs.parse('a[][b]=c')).to.deep.equal({ a: [{ b: 'c' }] }, { prototype: false });
        delete Object.prototype.crash;
        delete Array.prototype.crash;
        done();
    });

    it('parses a string with an alternative string delimiter', function (done) {

        expect(Qs.parse('a=b;c=d', { delimiter: ';' })).to.deep.equal({ a: 'b', c: 'd' }, { prototype: false });
        done();
    });

    it('parses a string with an alternative RegExp delimiter', function (done) {

        expect(Qs.parse('a=b; c=d', { delimiter: /[;,] */ })).to.deep.equal({ a: 'b', c: 'd' }, { prototype: false });
        done();
    });

    it('does not use non-splittable objects as delimiters', function (done) {

        expect(Qs.parse('a=b&c=d', { delimiter: true })).to.deep.equal({ a: 'b', c: 'd' }, { prototype: false });
        done();
    });

    it('allows overriding parameter limit', function (done) {

        expect(Qs.parse('a=b&c=d', { parameterLimit: 1 })).to.deep.equal({ a: 'b' }, { prototype: false });
        done();
    });

    it('allows setting the parameter limit to Infinity', function (done) {

        expect(Qs.parse('a=b&c=d', { parameterLimit: Infinity })).to.deep.equal({ a: 'b', c: 'd' }, { prototype: false });
        done();
    });

    it('allows overriding array limit', function (done) {

        expect(Qs.parse('a[0]=b', { arrayLimit: -1 })).to.deep.equal({ a: { '0': 'b' } }, { prototype: false });
        expect(Qs.parse('a[-1]=b', { arrayLimit: -1 })).to.deep.equal({ a: { '-1': 'b' } }, { prototype: false });
        expect(Qs.parse('a[0]=b&a[1]=c', { arrayLimit: 0 })).to.deep.equal({ a: { '0': 'b', '1': 'c' } }, { prototype: false });
        done();
    });

    it('allows disabling array parsing', function (done) {

        expect(Qs.parse('a[0]=b&a[1]=c', { parseArrays: false })).to.deep.equal({ a: { '0': 'b', '1': 'c' } }, { prototype: false });
        done();
    });

    it('parses an object', function (done) {

        var input = {
            'user[name]': {'pop[bob]': 3},
            'user[email]': null
        };

        var expected = {
            'user': {
                'name': {'pop[bob]': 3},
                'email': null
            }
        };

        var result = Qs.parse(input);

        expect(result).to.deep.equal(expected, { prototype: false });
        done();
    });

    it('parses an object in dot notation', function (done) {

        var input = {
            'user.name': {'pop[bob]': 3},
            'user.email.': null
        };

        var expected = {
            'user': {
                'name': {'pop[bob]': 3},
                'email': null
            }
        };

        var result = Qs.parse(input);

        expect(result).to.deep.equal(expected, { prototype: false });
        done();
    });

    it('parses an object and not child values', function (done) {

        var input = {
            'user[name]': {'pop[bob]': { 'test': 3 }},
            'user[email]': null
        };

        var expected = {
            'user': {
                'name': {'pop[bob]': { 'test': 3 }},
                'email': null
            }
        };

        var result = Qs.parse(input);

        expect(result).to.deep.equal(expected, { prototype: false });
        done();
    });

    it('does not blow up when Buffer global is missing', function (done) {

        var tempBuffer = global.Buffer;
        delete global.Buffer;
        var result = Qs.parse('a=b&c=d');
        global.Buffer = tempBuffer;
        expect(result).to.deep.equal({ a: 'b', c: 'd' }, { prototype: false });
        done();
    });

    it('does not crash when parsing circular references', function (done) {

        var a = {};
        a.b = a;

        var parsed;

        expect(function () {

            parsed = Qs.parse({ 'foo[bar]': 'baz', 'foo[baz]': a });
        }).to.not.throw();

        expect(parsed).to.contain('foo');
        expect(parsed.foo).to.contain('bar', 'baz');
        expect(parsed.foo.bar).to.equal('baz');
        expect(parsed.foo.baz).to.deep.equal(a, { prototype: false });
        done();
    });

    it('parses plain objects correctly', function (done) {

        var a = Object.create(null);
        a.b = 'c';

        expect(Qs.parse(a)).to.deep.equal({ b: 'c' }, { prototype: false });
        var result = Qs.parse({ a: a });
        expect(result).to.contain('a');
        expect(result.a).to.deep.equal(a, { prototype: false });
        done();
    });

    it('parses dates correctly', function (done) {

        var now = new Date();
        expect(Qs.parse({ a: now })).to.deep.equal({ a: now }, { prototype: false });
        done();
    });

    it('parses regular expressions correctly', function (done) {

        var re = /^test$/;
        expect(Qs.parse({ a: re })).to.deep.equal({ a: re }, { prototype: false });
        done();
    });
});
