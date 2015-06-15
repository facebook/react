// Load modules

var Url = require('url');
var Code = require('code');
var Hawk = require('../lib');
var Hoek = require('hoek');
var Lab = require('lab');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.test;
var expect = Code.expect;


describe('Hawk', function () {

    var credentialsFunc = function (id, callback) {

        var credentials = {
            id: id,
            key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
            algorithm: (id === '1' ? 'sha1' : 'sha256'),
            user: 'steve'
        };

        return callback(null, credentials);
    };

    it('should generate an authorization then successfully parse it', function (done) {

        credentialsFunc('123456', function (err, credentials) {

            var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials });
            expect(auth).to.exist();

            Hawk.server.authenticateMessage('example.com', 8080, 'some message', auth, credentialsFunc, {}, function (err, credentials) {

                expect(err).to.not.exist();
                expect(credentials.user).to.equal('steve');
                done();
            });
        });
    });

    it('should fail authorization on mismatching host', function (done) {

        credentialsFunc('123456', function (err, credentials) {

            var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials });
            expect(auth).to.exist();

            Hawk.server.authenticateMessage('example1.com', 8080, 'some message', auth, credentialsFunc, {}, function (err, credentials) {

                expect(err).to.exist();
                expect(err.message).to.equal('Bad mac');
                done();
            });
        });
    });

    it('should fail authorization on stale timestamp', function (done) {

        credentialsFunc('123456', function (err, credentials) {

            var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials });
            expect(auth).to.exist();

            Hawk.server.authenticateMessage('example.com', 8080, 'some message', auth, credentialsFunc, { localtimeOffsetMsec: 100000 }, function (err, credentials) {

                expect(err).to.exist();
                expect(err.message).to.equal('Stale timestamp');
                done();
            });
        });
    });

    it('overrides timestampSkewSec', function (done) {

        credentialsFunc('123456', function (err, credentials) {

            var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials, localtimeOffsetMsec: 100000 });
            expect(auth).to.exist();

            Hawk.server.authenticateMessage('example.com', 8080, 'some message', auth, credentialsFunc, { timestampSkewSec: 500 }, function (err, credentials) {

                expect(err).to.not.exist();
                done();
            });
        });
    });

    it('should fail authorization on invalid authorization', function (done) {

        credentialsFunc('123456', function (err, credentials) {

            var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials });
            expect(auth).to.exist();
            delete auth.id;

            Hawk.server.authenticateMessage('example.com', 8080, 'some message', auth, credentialsFunc, {}, function (err, credentials) {

                expect(err).to.exist();
                expect(err.message).to.equal('Invalid authorization');
                done();
            });
        });
    });

    it('should fail authorization on bad hash', function (done) {

        credentialsFunc('123456', function (err, credentials) {

            var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials });
            expect(auth).to.exist();

            Hawk.server.authenticateMessage('example.com', 8080, 'some message1', auth, credentialsFunc, {}, function (err, credentials) {

                expect(err).to.exist();
                expect(err.message).to.equal('Bad message hash');
                done();
            });
        });
    });

    it('should fail authorization on nonce error', function (done) {

        credentialsFunc('123456', function (err, credentials) {

            var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials });
            expect(auth).to.exist();

            Hawk.server.authenticateMessage('example.com', 8080, 'some message', auth, credentialsFunc, { nonceFunc: function (nonce, ts, callback) { callback (new Error('kaboom')); } }, function (err, credentials) {

                expect(err).to.exist();
                expect(err.message).to.equal('Invalid nonce');
                done();
            });
        });
    });

    it('should fail authorization on credentials error', function (done) {

        credentialsFunc('123456', function (err, credentials) {

            var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials });
            expect(auth).to.exist();

            var errFunc = function (id, callback) {

                callback(new Error('kablooey'));
            };

            Hawk.server.authenticateMessage('example.com', 8080, 'some message', auth, errFunc, {}, function (err, credentials) {

                expect(err).to.exist();
                expect(err.message).to.equal('kablooey');
                done();
            });
        });
    });

    it('should fail authorization on missing credentials', function (done) {

        credentialsFunc('123456', function (err, credentials) {

            var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials });
            expect(auth).to.exist();

            var errFunc = function (id, callback) {

                callback();
            };

            Hawk.server.authenticateMessage('example.com', 8080, 'some message', auth, errFunc, {}, function (err, credentials) {

                expect(err).to.exist();
                expect(err.message).to.equal('Unknown credentials');
                done();
            });
        });
    });

    it('should fail authorization on invalid credentials', function (done) {

        credentialsFunc('123456', function (err, credentials) {

            var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials });
            expect(auth).to.exist();

            var errFunc = function (id, callback) {

                callback(null, {});
            };

            Hawk.server.authenticateMessage('example.com', 8080, 'some message', auth, errFunc, {}, function (err, credentials) {

                expect(err).to.exist();
                expect(err.message).to.equal('Invalid credentials');
                done();
            });
        });
    });

    it('should fail authorization on invalid credentials algorithm', function (done) {

        credentialsFunc('123456', function (err, credentials) {

            var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials });
            expect(auth).to.exist();

            var errFunc = function (id, callback) {

                callback(null, { key: '123', algorithm: '456' });
            };

            Hawk.server.authenticateMessage('example.com', 8080, 'some message', auth, errFunc, {}, function (err, credentials) {

                expect(err).to.exist();
                expect(err.message).to.equal('Unknown algorithm');
                done();
            });
        });
    });

    it('should fail on missing host', function (done) {

        credentialsFunc('123456', function (err, credentials) {

            var auth = Hawk.client.message(null, 8080, 'some message', { credentials: credentials });
            expect(auth).to.not.exist();
            done();
        });
    });

    it('should fail on missing credentials', function (done) {

        var auth = Hawk.client.message('example.com', 8080, 'some message', {});
        expect(auth).to.not.exist();
        done();
    });

    it('should fail on invalid algorithm', function (done) {

        credentialsFunc('123456', function (err, credentials) {

            var creds = Hoek.clone(credentials);
            creds.algorithm = 'blah';
            var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: creds });
            expect(auth).to.not.exist();
            done();
        });
    });
});
