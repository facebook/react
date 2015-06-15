// Load modules

var Code = require('code');
var Hawk = require('../lib');
var Lab = require('lab');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.test;
var expect = Code.expect;


describe('Hawk', function () {

    describe('Crypto', function () {

        describe('#generateNormalizedString', function () {

            it('should return a valid normalized string', function (done) {

                expect(Hawk.crypto.generateNormalizedString('header', {
                    credentials: {
                        key: 'dasdfasdf',
                        algorithm: 'sha256'
                    },
                    ts: 1357747017,
                    nonce: 'k3k4j5',
                    method: 'GET',
                    resource: '/resource/something',
                    host: 'example.com',
                    port: 8080
                })).to.equal('hawk.1.header\n1357747017\nk3k4j5\nGET\n/resource/something\nexample.com\n8080\n\n\n');

                done();
            });

            it('should return a valid normalized string (ext)', function (done) {

                expect(Hawk.crypto.generateNormalizedString('header', {
                    credentials: {
                        key: 'dasdfasdf',
                        algorithm: 'sha256'
                    },
                    ts: 1357747017,
                    nonce: 'k3k4j5',
                    method: 'GET',
                    resource: '/resource/something',
                    host: 'example.com',
                    port: 8080,
                    ext: 'this is some app data'
                })).to.equal('hawk.1.header\n1357747017\nk3k4j5\nGET\n/resource/something\nexample.com\n8080\n\nthis is some app data\n');

                done();
            });

            it('should return a valid normalized string (payload + ext)', function (done) {

                expect(Hawk.crypto.generateNormalizedString('header', {
                    credentials: {
                        key: 'dasdfasdf',
                        algorithm: 'sha256'
                    },
                    ts: 1357747017,
                    nonce: 'k3k4j5',
                    method: 'GET',
                    resource: '/resource/something',
                    host: 'example.com',
                    port: 8080,
                    hash: 'U4MKKSmiVxk37JCCrAVIjV/OhB3y+NdwoCr6RShbVkE=',
                    ext: 'this is some app data'
                })).to.equal('hawk.1.header\n1357747017\nk3k4j5\nGET\n/resource/something\nexample.com\n8080\nU4MKKSmiVxk37JCCrAVIjV/OhB3y+NdwoCr6RShbVkE=\nthis is some app data\n');

                done();
            });
        });
    });
});

