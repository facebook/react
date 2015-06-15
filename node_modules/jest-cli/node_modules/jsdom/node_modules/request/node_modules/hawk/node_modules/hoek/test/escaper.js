// Load modules

var Code = require('code');
var Hoek = require('../lib');
var Lab = require('lab');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.test;
var expect = Code.expect;


describe('escapeJavaScript()', function () {

    it('encodes / characters', function (done) {

        var encoded = Hoek.escapeJavaScript('<script>alert(1)</script>');
        expect(encoded).to.equal('\\x3cscript\\x3ealert\\x281\\x29\\x3c\\x2fscript\\x3e');
        done();
    });

    it('encodes \' characters', function (done) {

        var encoded = Hoek.escapeJavaScript('something(\'param\')');
        expect(encoded).to.equal('something\\x28\\x27param\\x27\\x29');
        done();
    });

    it('encodes large unicode characters with the correct padding', function (done) {

        var encoded = Hoek.escapeJavaScript(String.fromCharCode(500) + String.fromCharCode(1000));
        expect(encoded).to.equal('\\u0500\\u1000');
        done();
    });

    it('doesn\'t throw an exception when passed null', function (done) {

        var encoded = Hoek.escapeJavaScript(null);
        expect(encoded).to.equal('');
        done();
    });
});

describe('escapeHtml()', function () {

    it('encodes / characters', function (done) {

        var encoded = Hoek.escapeHtml('<script>alert(1)</script>');
        expect(encoded).to.equal('&lt;script&gt;alert&#x28;1&#x29;&lt;&#x2f;script&gt;');
        done();
    });

    it('encodes < and > as named characters', function (done) {

        var encoded = Hoek.escapeHtml('<script><>');
        expect(encoded).to.equal('&lt;script&gt;&lt;&gt;');
        done();
    });

    it('encodes large unicode characters', function (done) {

        var encoded = Hoek.escapeHtml(String.fromCharCode(500) + String.fromCharCode(1000));
        expect(encoded).to.equal('&#500;&#1000;');
        done();
    });

    it('doesn\'t throw an exception when passed null', function (done) {

        var encoded = Hoek.escapeHtml(null);
        expect(encoded).to.equal('');
        done();
    });

    it('encodes {} characters', function (done) {

        var encoded = Hoek.escapeHtml('{}');
        expect(encoded).to.equal('&#x7b;&#x7d;');
        done();
    });
});
