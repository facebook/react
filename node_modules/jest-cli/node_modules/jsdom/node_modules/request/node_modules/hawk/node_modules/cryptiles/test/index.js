// Load modules

var Lab = require('lab');
var Cryptiles = require('../lib');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var before = lab.before;
var after = lab.after;
var describe = lab.experiment;
var it = lab.test;
var expect = Lab.expect;


describe('Cryptiles', function () {

    describe('#randomString', function () {

        it('should generate the right length string', function (done) {

            for (var i = 1; i <= 1000; ++i) {
                expect(Cryptiles.randomString(i).length).to.equal(i);
            }

            done();
        });

        it('returns an error on invalid bits size', function (done) {

            expect(Cryptiles.randomString(99999999999999999999).message).to.equal('Failed generating random bits: Argument #1 must be number > 0');
            done();
        });
    });

    describe('#randomBits', function () {

        it('returns an error on invalid input', function (done) {

            expect(Cryptiles.randomBits(0).message).to.equal('Invalid random bits count');
            done();
        });
    });

    describe('#fixedTimeComparison', function () {

        var a = Cryptiles.randomString(50000);
        var b = Cryptiles.randomString(150000);

        it('should take the same amount of time comparing different string sizes', function (done) {

            var now = Date.now();
            Cryptiles.fixedTimeComparison(b, a);
            var t1 = Date.now() - now;

            now = Date.now();
            Cryptiles.fixedTimeComparison(b, b);
            var t2 = Date.now() - now;

            expect(t2 - t1).to.be.within(-20, 20);
            done();
        });

        it('should return true for equal strings', function (done) {

            expect(Cryptiles.fixedTimeComparison(a, a)).to.equal(true);
            done();
        });

        it('should return false for different strings (size, a < b)', function (done) {

            expect(Cryptiles.fixedTimeComparison(a, a + 'x')).to.equal(false);
            done();
        });

        it('should return false for different strings (size, a > b)', function (done) {

            expect(Cryptiles.fixedTimeComparison(a + 'x', a)).to.equal(false);
            done();
        });

        it('should return false for different strings (size, a = b)', function (done) {

            expect(Cryptiles.fixedTimeComparison(a + 'x', a + 'y')).to.equal(false);
            done();
        });

        it('should return false when not a string', function (done) {

            expect(Cryptiles.fixedTimeComparison('x', null)).to.equal(false);
            done();
        });

        it('should return false when not a string (left)', function (done) {

            expect(Cryptiles.fixedTimeComparison(null, 'x')).to.equal(false);
            done();
        });
    });
});


