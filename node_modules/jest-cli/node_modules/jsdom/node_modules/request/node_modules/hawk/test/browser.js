// Load modules

var Url = require('url');
var Code = require('code');
var Hawk = require('../lib');
var Hoek = require('hoek');
var Lab = require('lab');
var Browser = require('../lib/browser');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.test;
var expect = Code.expect;


describe('Browser', function () {

    var credentialsFunc = function (id, callback) {

        var credentials = {
            id: id,
            key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
            algorithm: (id === '1' ? 'sha1' : 'sha256'),
            user: 'steve'
        };

        return callback(null, credentials);
    };

    it('should generate a bewit then successfully authenticate it', function (done) {

        var req = {
            method: 'GET',
            url: '/resource/4?a=1&b=2',
            host: 'example.com',
            port: 80
        };

        credentialsFunc('123456', function (err, credentials) {

            var bewit = Browser.client.bewit('http://example.com/resource/4?a=1&b=2', { credentials: credentials, ttlSec: 60 * 60 * 24 * 365 * 100, ext: 'some-app-data' });
            req.url += '&bewit=' + bewit;

            Hawk.uri.authenticate(req, credentialsFunc, {}, function (err, credentials, attributes) {

                expect(err).to.not.exist();
                expect(credentials.user).to.equal('steve');
                expect(attributes.ext).to.equal('some-app-data');
                done();
            });
        });
    });

    it('should generate a bewit then successfully authenticate it (no ext)', function (done) {

        var req = {
            method: 'GET',
            url: '/resource/4?a=1&b=2',
            host: 'example.com',
            port: 80
        };

        credentialsFunc('123456', function (err, credentials) {

            var bewit = Browser.client.bewit('http://example.com/resource/4?a=1&b=2', { credentials: credentials, ttlSec: 60 * 60 * 24 * 365 * 100 });
            req.url += '&bewit=' + bewit;

            Hawk.uri.authenticate(req, credentialsFunc, {}, function (err, credentials, attributes) {

                expect(err).to.not.exist();
                expect(credentials.user).to.equal('steve');
                done();
            });
        });
    });

    describe('#bewit', function () {

        it('returns a valid bewit value', function (done) {

            var credentials = {
                id: '123456',
                key: '2983d45yun89q',
                algorithm: 'sha256'
            };

            var bewit = Browser.client.bewit('https://example.com/somewhere/over/the/rainbow', { credentials: credentials, ttlSec: 300, localtimeOffsetMsec: 1356420407232 - Hawk.utils.now(), ext: 'xandyandz' });
            expect(bewit).to.equal('MTIzNDU2XDEzNTY0MjA3MDdca3NjeHdOUjJ0SnBQMVQxekRMTlBiQjVVaUtJVTl0T1NKWFRVZEc3WDloOD1ceGFuZHlhbmR6');
            done();
        });

        it('returns a valid bewit value (explicit HTTP port)', function (done) {

            var credentials = {
                id: '123456',
                key: '2983d45yun89q',
                algorithm: 'sha256'
            };

            var bewit = Browser.client.bewit('http://example.com:8080/somewhere/over/the/rainbow', { credentials: credentials, ttlSec: 300, localtimeOffsetMsec: 1356420407232 - Hawk.utils.now(), ext: 'xandyandz' });
            expect(bewit).to.equal('MTIzNDU2XDEzNTY0MjA3MDdcaFpiSjNQMmNLRW80a3kwQzhqa1pBa1J5Q1p1ZWc0V1NOYnhWN3ZxM3hIVT1ceGFuZHlhbmR6');
            done();
        });

        it('returns a valid bewit value (explicit HTTPS port)', function (done) {

            var credentials = {
                id: '123456',
                key: '2983d45yun89q',
                algorithm: 'sha256'
            };

            var bewit = Browser.client.bewit('https://example.com:8043/somewhere/over/the/rainbow', { credentials: credentials, ttlSec: 300, localtimeOffsetMsec: 1356420407232 - Hawk.utils.now(), ext: 'xandyandz' });
            expect(bewit).to.equal('MTIzNDU2XDEzNTY0MjA3MDdcL2t4UjhwK0xSaTdvQTRnUXc3cWlxa3BiVHRKYkR4OEtRMC9HRUwvVytTUT1ceGFuZHlhbmR6');
            done();
        });

        it('returns a valid bewit value (null ext)', function (done) {

            var credentials = {
                id: '123456',
                key: '2983d45yun89q',
                algorithm: 'sha256'
            };

            var bewit = Browser.client.bewit('https://example.com/somewhere/over/the/rainbow', { credentials: credentials, ttlSec: 300, localtimeOffsetMsec: 1356420407232 - Hawk.utils.now(), ext: null });
            expect(bewit).to.equal('MTIzNDU2XDEzNTY0MjA3MDdcSUdZbUxnSXFMckNlOEN4dktQczRKbFdJQStValdKSm91d2dBUmlWaENBZz1c');
            done();
        });

        it('errors on invalid options', function (done) {

            var credentials = {
                id: '123456',
                key: '2983d45yun89q',
                algorithm: 'sha256'
            };

            var bewit = Browser.client.bewit('https://example.com/somewhere/over/the/rainbow', 4);
            expect(bewit).to.equal('');
            done();
        });

        it('errors on missing uri', function (done) {

            var credentials = {
                id: '123456',
                key: '2983d45yun89q',
                algorithm: 'sha256'
            };

            var bewit = Browser.client.bewit('', { credentials: credentials, ttlSec: 300, localtimeOffsetMsec: 1356420407232 - Hawk.utils.now(), ext: 'xandyandz' });
            expect(bewit).to.equal('');
            done();
        });

        it('errors on invalid uri', function (done) {

            var credentials = {
                id: '123456',
                key: '2983d45yun89q',
                algorithm: 'sha256'
            };

            var bewit = Browser.client.bewit(5, { credentials: credentials, ttlSec: 300, localtimeOffsetMsec: 1356420407232 - Hawk.utils.now(), ext: 'xandyandz' });
            expect(bewit).to.equal('');
            done();
        });

        it('errors on invalid credentials (id)', function (done) {

            var credentials = {
                key: '2983d45yun89q',
                algorithm: 'sha256'
            };

            var bewit = Browser.client.bewit('https://example.com/somewhere/over/the/rainbow', { credentials: credentials, ttlSec: 3000, ext: 'xandyandz' });
            expect(bewit).to.equal('');
            done();
        });

        it('errors on missing credentials', function (done) {

            var bewit = Browser.client.bewit('https://example.com/somewhere/over/the/rainbow', { ttlSec: 3000, ext: 'xandyandz' });
            expect(bewit).to.equal('');
            done();
        });

        it('errors on invalid credentials (key)', function (done) {

            var credentials = {
                id: '123456',
                algorithm: 'sha256'
            };

            var bewit = Browser.client.bewit('https://example.com/somewhere/over/the/rainbow', { credentials: credentials, ttlSec: 3000, ext: 'xandyandz' });
            expect(bewit).to.equal('');
            done();
        });

        it('errors on invalid algorithm', function (done) {

            var credentials = {
                id: '123456',
                key: '2983d45yun89q',
                algorithm: 'hmac-sha-0'
            };

            var bewit = Browser.client.bewit('https://example.com/somewhere/over/the/rainbow', { credentials: credentials, ttlSec: 300, ext: 'xandyandz' });
            expect(bewit).to.equal('');
            done();
        });

        it('errors on missing options', function (done) {

            var credentials = {
                id: '123456',
                key: '2983d45yun89q',
                algorithm: 'hmac-sha-0'
            };

            var bewit = Browser.client.bewit('https://example.com/somewhere/over/the/rainbow');
            expect(bewit).to.equal('');
            done();
        });
    });

    it('generates a header then successfully parse it (configuration)', function (done) {

        var req = {
            method: 'GET',
            url: '/resource/4?filter=a',
            host: 'example.com',
            port: 8080
        };

        credentialsFunc('123456', function (err, credentials) {

            req.authorization = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, ext: 'some-app-data' }).field;
            expect(req.authorization).to.exist();

            Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                expect(err).to.not.exist();
                expect(credentials.user).to.equal('steve');
                expect(artifacts.ext).to.equal('some-app-data');
                done();
            });
        });
    });

    it('generates a header then successfully parse it (node request)', function (done) {

        var req = {
            method: 'POST',
            url: '/resource/4?filter=a',
            headers: {
                host: 'example.com:8080',
                'content-type': 'text/plain;x=y'
            }
        };

        var payload = 'some not so random text';

        credentialsFunc('123456', function (err, credentials) {

            var reqHeader = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, ext: 'some-app-data', payload: payload, contentType: req.headers['content-type'] });
            req.headers.authorization = reqHeader.field;

            Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                expect(err).to.not.exist();
                expect(credentials.user).to.equal('steve');
                expect(artifacts.ext).to.equal('some-app-data');
                expect(Hawk.server.authenticatePayload(payload, credentials, artifacts, req.headers['content-type'])).to.equal(true);

                var res = {
                    headers: {
                        'content-type': 'text/plain'
                    },
                    getResponseHeader: function (header) {

                        return res.headers[header.toLowerCase()];
                    }
                };

                res.headers['server-authorization'] = Hawk.server.header(credentials, artifacts, { payload: 'some reply', contentType: 'text/plain', ext: 'response-specific' });
                expect(res.headers['server-authorization']).to.exist();

                expect(Browser.client.authenticate(res, credentials, artifacts, { payload: 'some reply' })).to.equal(true);
                done();
            });
        });
    });

    it('generates a header then successfully parse it (browserify)', function (done) {

        var req = {
            method: 'POST',
            url: '/resource/4?filter=a',
            headers: {
                host: 'example.com:8080',
                'content-type': 'text/plain;x=y'
            }
        };

        var payload = 'some not so random text';

        credentialsFunc('123456', function (err, credentials) {

            var reqHeader = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, ext: 'some-app-data', payload: payload, contentType: req.headers['content-type'] });
            req.headers.authorization = reqHeader.field;

            Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                expect(err).to.not.exist();
                expect(credentials.user).to.equal('steve');
                expect(artifacts.ext).to.equal('some-app-data');
                expect(Hawk.server.authenticatePayload(payload, credentials, artifacts, req.headers['content-type'])).to.equal(true);

                var res = {
                    headers: {
                        'content-type': 'text/plain'
                    },
                    getHeader: function (header) {

                        return res.headers[header.toLowerCase()];
                    }
                };

                res.headers['server-authorization'] = Hawk.server.header(credentials, artifacts, { payload: 'some reply', contentType: 'text/plain', ext: 'response-specific' });
                expect(res.headers['server-authorization']).to.exist();

                expect(Browser.client.authenticate(res, credentials, artifacts, { payload: 'some reply' })).to.equal(true);
                done();
            });
        });
    });

    it('generates a header then successfully parse it (time offset)', function (done) {

        var req = {
            method: 'GET',
            url: '/resource/4?filter=a',
            host: 'example.com',
            port: 8080
        };

        credentialsFunc('123456', function (err, credentials) {

            req.authorization = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, ext: 'some-app-data', localtimeOffsetMsec: 100000 }).field;
            expect(req.authorization).to.exist();

            Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 100000 }, function (err, credentials, artifacts) {

                expect(err).to.not.exist();
                expect(credentials.user).to.equal('steve');
                expect(artifacts.ext).to.equal('some-app-data');
                done();
            });
        });
    });

    it('generates a header then successfully parse it (no server header options)', function (done) {

        var req = {
            method: 'POST',
            url: '/resource/4?filter=a',
            headers: {
                host: 'example.com:8080',
                'content-type': 'text/plain;x=y'
            }
        };

        var payload = 'some not so random text';

        credentialsFunc('123456', function (err, credentials) {

            var reqHeader = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, ext: 'some-app-data', payload: payload, contentType: req.headers['content-type'] });
            req.headers.authorization = reqHeader.field;

            Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                expect(err).to.not.exist();
                expect(credentials.user).to.equal('steve');
                expect(artifacts.ext).to.equal('some-app-data');
                expect(Hawk.server.authenticatePayload(payload, credentials, artifacts, req.headers['content-type'])).to.equal(true);

                var res = {
                    headers: {
                        'content-type': 'text/plain'
                    },
                    getResponseHeader: function (header) {

                        return res.headers[header.toLowerCase()];
                    }
                };

                res.headers['server-authorization'] = Hawk.server.header(credentials, artifacts);
                expect(res.headers['server-authorization']).to.exist();

                expect(Browser.client.authenticate(res, credentials, artifacts)).to.equal(true);
                done();
            });
        });
    });

    it('generates a header then successfully parse it (no server header)', function (done) {

        var req = {
            method: 'POST',
            url: '/resource/4?filter=a',
            headers: {
                host: 'example.com:8080',
                'content-type': 'text/plain;x=y'
            }
        };

        var payload = 'some not so random text';

        credentialsFunc('123456', function (err, credentials) {

            var reqHeader = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, ext: 'some-app-data', payload: payload, contentType: req.headers['content-type'] });
            req.headers.authorization = reqHeader.field;

            Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                expect(err).to.not.exist();
                expect(credentials.user).to.equal('steve');
                expect(artifacts.ext).to.equal('some-app-data');
                expect(Hawk.server.authenticatePayload(payload, credentials, artifacts, req.headers['content-type'])).to.equal(true);

                var res = {
                    headers: {
                        'content-type': 'text/plain'
                    },
                    getResponseHeader: function (header) {

                        return res.headers[header.toLowerCase()];
                    }
                };

                expect(Browser.client.authenticate(res, credentials, artifacts)).to.equal(true);
                done();
            });
        });
    });

    it('generates a header with stale ts and successfully authenticate on second call', function (done) {

        var req = {
            method: 'GET',
            url: '/resource/4?filter=a',
            host: 'example.com',
            port: 8080
        };

        credentialsFunc('123456', function (err, credentials) {

            Browser.utils.setNtpOffset(60 * 60 * 1000);
            var header = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, ext: 'some-app-data' });
            req.authorization = header.field;
            expect(req.authorization).to.exist();

            Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                expect(err).to.exist();
                expect(err.message).to.equal('Stale timestamp');

                var res = {
                    headers: {
                        'www-authenticate': err.output.headers['WWW-Authenticate']
                    },
                    getResponseHeader: function (header) {

                        return res.headers[header.toLowerCase()];
                    }
                };

                expect(Browser.utils.getNtpOffset()).to.equal(60 * 60 * 1000);
                expect(Browser.client.authenticate(res, credentials, header.artifacts)).to.equal(true);
                expect(Browser.utils.getNtpOffset()).to.equal(0);

                req.authorization = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, ext: 'some-app-data' }).field;
                expect(req.authorization).to.exist();

                Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                    expect(err).to.not.exist();
                    expect(credentials.user).to.equal('steve');
                    expect(artifacts.ext).to.equal('some-app-data');
                    done();
                });
            });
        });
    });

    it('generates a header with stale ts and successfully authenticate on second call (manual localStorage)', function (done) {

        var req = {
            method: 'GET',
            url: '/resource/4?filter=a',
            host: 'example.com',
            port: 8080
        };

        credentialsFunc('123456', function (err, credentials) {

            var localStorage = new Browser.internals.LocalStorage();

            Browser.utils.setStorage(localStorage)

            Browser.utils.setNtpOffset(60 * 60 * 1000);
            var header = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, ext: 'some-app-data' });
            req.authorization = header.field;
            expect(req.authorization).to.exist();

            Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                expect(err).to.exist();
                expect(err.message).to.equal('Stale timestamp');

                var res = {
                    headers: {
                        'www-authenticate': err.output.headers['WWW-Authenticate']
                    },
                    getResponseHeader: function (header) {

                        return res.headers[header.toLowerCase()];
                    }
                };

                expect(parseInt(localStorage.getItem('hawk_ntp_offset'))).to.equal(60 * 60 * 1000);
                expect(Browser.utils.getNtpOffset()).to.equal(60 * 60 * 1000);
                expect(Browser.client.authenticate(res, credentials, header.artifacts)).to.equal(true);
                expect(Browser.utils.getNtpOffset()).to.equal(0);
                expect(parseInt(localStorage.getItem('hawk_ntp_offset'))).to.equal(0);

                req.authorization = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, ext: 'some-app-data' }).field;
                expect(req.authorization).to.exist();

                Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                    expect(err).to.not.exist();
                    expect(credentials.user).to.equal('steve');
                    expect(artifacts.ext).to.equal('some-app-data');
                    done();
                });
            });
        });
    });

    it('generates a header then fails to parse it (missing server header hash)', function (done) {

        var req = {
            method: 'POST',
            url: '/resource/4?filter=a',
            headers: {
                host: 'example.com:8080',
                'content-type': 'text/plain;x=y'
            }
        };

        var payload = 'some not so random text';

        credentialsFunc('123456', function (err, credentials) {

            var reqHeader = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, ext: 'some-app-data', payload: payload, contentType: req.headers['content-type'] });
            req.headers.authorization = reqHeader.field;

            Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                expect(err).to.not.exist();
                expect(credentials.user).to.equal('steve');
                expect(artifacts.ext).to.equal('some-app-data');
                expect(Hawk.server.authenticatePayload(payload, credentials, artifacts, req.headers['content-type'])).to.equal(true);

                var res = {
                    headers: {
                        'content-type': 'text/plain'
                    },
                    getResponseHeader: function (header) {

                        return res.headers[header.toLowerCase()];
                    }
                };

                res.headers['server-authorization'] = Hawk.server.header(credentials, artifacts);
                expect(res.headers['server-authorization']).to.exist();

                expect(Browser.client.authenticate(res, credentials, artifacts, { payload: 'some reply' })).to.equal(false);
                done();
            });
        });
    });

    it('generates a header then successfully parse it (with hash)', function (done) {

        var req = {
            method: 'GET',
            url: '/resource/4?filter=a',
            host: 'example.com',
            port: 8080
        };

        credentialsFunc('123456', function (err, credentials) {

            req.authorization = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, payload: 'hola!', ext: 'some-app-data' }).field;
            Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                expect(err).to.not.exist();
                expect(credentials.user).to.equal('steve');
                expect(artifacts.ext).to.equal('some-app-data');
                done();
            });
        });
    });

    it('generates a header then successfully parse it then validate payload', function (done) {

        var req = {
            method: 'GET',
            url: '/resource/4?filter=a',
            host: 'example.com',
            port: 8080
        };

        credentialsFunc('123456', function (err, credentials) {

            req.authorization = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, payload: 'hola!', ext: 'some-app-data' }).field;
            Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                expect(err).to.not.exist();
                expect(credentials.user).to.equal('steve');
                expect(artifacts.ext).to.equal('some-app-data');
                expect(Hawk.server.authenticatePayload('hola!', credentials, artifacts)).to.be.true();
                expect(Hawk.server.authenticatePayload('hello!', credentials, artifacts)).to.be.false();
                done();
            });
        });
    });

    it('generates a header then successfully parse it (app)', function (done) {

        var req = {
            method: 'GET',
            url: '/resource/4?filter=a',
            host: 'example.com',
            port: 8080
        };

        credentialsFunc('123456', function (err, credentials) {

            req.authorization = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, ext: 'some-app-data', app: 'asd23ased' }).field;
            Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                expect(err).to.not.exist();
                expect(credentials.user).to.equal('steve');
                expect(artifacts.ext).to.equal('some-app-data');
                expect(artifacts.app).to.equal('asd23ased');
                done();
            });
        });
    });

    it('generates a header then successfully parse it (app, dlg)', function (done) {

        var req = {
            method: 'GET',
            url: '/resource/4?filter=a',
            host: 'example.com',
            port: 8080
        };

        credentialsFunc('123456', function (err, credentials) {

            req.authorization = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, ext: 'some-app-data', app: 'asd23ased', dlg: '23434szr3q4d' }).field;
            Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                expect(err).to.not.exist();
                expect(credentials.user).to.equal('steve');
                expect(artifacts.ext).to.equal('some-app-data');
                expect(artifacts.app).to.equal('asd23ased');
                expect(artifacts.dlg).to.equal('23434szr3q4d');
                done();
            });
        });
    });

    it('generates a header then fail authentication due to bad hash', function (done) {

        var req = {
            method: 'GET',
            url: '/resource/4?filter=a',
            host: 'example.com',
            port: 8080
        };

        credentialsFunc('123456', function (err, credentials) {

            req.authorization = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, payload: 'hola!', ext: 'some-app-data' }).field;
            Hawk.server.authenticate(req, credentialsFunc, { payload: 'byebye!' }, function (err, credentials, artifacts) {

                expect(err).to.exist();
                expect(err.output.payload.message).to.equal('Bad payload hash');
                done();
            });
        });
    });

    it('generates a header for one resource then fail to authenticate another', function (done) {

        var req = {
            method: 'GET',
            url: '/resource/4?filter=a',
            host: 'example.com',
            port: 8080
        };

        credentialsFunc('123456', function (err, credentials) {

            req.authorization = Browser.client.header('http://example.com:8080/resource/4?filter=a', req.method, { credentials: credentials, ext: 'some-app-data' }).field;
            req.url = '/something/else';

            Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                expect(err).to.exist();
                expect(credentials).to.exist();
                done();
            });
        });
    });

    describe('client', function () {

        describe('#header', function () {

            it('returns a valid authorization header (sha1)', function (done) {

                var credentials = {
                    id: '123456',
                    key: '2983d45yun89q',
                    algorithm: 'sha1'
                };

                var header = Browser.client.header('http://example.net/somewhere/over/the/rainbow', 'POST', { credentials: credentials, ext: 'Bazinga!', timestamp: 1353809207, nonce: 'Ygvqdz', payload: 'something to write about' }).field;
                expect(header).to.equal('Hawk id="123456", ts="1353809207", nonce="Ygvqdz", hash="bsvY3IfUllw6V5rvk4tStEvpBhE=", ext="Bazinga!", mac="qbf1ZPG/r/e06F4ht+T77LXi5vw="');
                done();
            });

            it('returns a valid authorization header (sha256)', function (done) {

                var credentials = {
                    id: '123456',
                    key: '2983d45yun89q',
                    algorithm: 'sha256'
                };

                var header = Browser.client.header('https://example.net/somewhere/over/the/rainbow', 'POST', { credentials: credentials, ext: 'Bazinga!', timestamp: 1353809207, nonce: 'Ygvqdz', payload: 'something to write about', contentType: 'text/plain' }).field;
                expect(header).to.equal('Hawk id="123456", ts="1353809207", nonce="Ygvqdz", hash="2QfCt3GuY9HQnHWyWD3wX68ZOKbynqlfYmuO2ZBRqtY=", ext="Bazinga!", mac="q1CwFoSHzPZSkbIvl0oYlD+91rBUEvFk763nMjMndj8="');
                done();
            });

            it('returns a valid authorization header (empty payload)', function (done) {

                var credentials = {
                    id: '123456',
                    key: '2983d45yun89q',
                    algorithm: 'sha1'
                };

                var header = Browser.client.header('http://example.net/somewhere/over/the/rainbow', 'POST', { credentials: credentials, ext: 'Bazinga!', timestamp: 1353809207, nonce: 'Ygvqdz', payload: '' }).field;
                expect(header).to.equal('Hawk id=\"123456\", ts=\"1353809207\", nonce=\"Ygvqdz\", hash=\"404ghL7K+hfyhByKKejFBRGgTjU=\", ext=\"Bazinga!\", mac=\"Bh1sj1DOfFRWOdi3ww52nLCJdBE=\"');
                done();
            });

            it('returns a valid authorization header (no ext)', function (done) {

                var credentials = {
                    id: '123456',
                    key: '2983d45yun89q',
                    algorithm: 'sha256'
                };

                var header = Browser.client.header('https://example.net/somewhere/over/the/rainbow', 'POST', { credentials: credentials, timestamp: 1353809207, nonce: 'Ygvqdz', payload: 'something to write about', contentType: 'text/plain' }).field;
                expect(header).to.equal('Hawk id="123456", ts="1353809207", nonce="Ygvqdz", hash="2QfCt3GuY9HQnHWyWD3wX68ZOKbynqlfYmuO2ZBRqtY=", mac="HTgtd0jPI6E4izx8e4OHdO36q00xFCU0FolNq3RiCYs="');
                done();
            });

            it('returns a valid authorization header (null ext)', function (done) {

                var credentials = {
                    id: '123456',
                    key: '2983d45yun89q',
                    algorithm: 'sha256'
                };

                var header = Browser.client.header('https://example.net/somewhere/over/the/rainbow', 'POST', { credentials: credentials, timestamp: 1353809207, nonce: 'Ygvqdz', payload: 'something to write about', contentType: 'text/plain', ext: null }).field;
                expect(header).to.equal('Hawk id="123456", ts="1353809207", nonce="Ygvqdz", hash="2QfCt3GuY9HQnHWyWD3wX68ZOKbynqlfYmuO2ZBRqtY=", mac="HTgtd0jPI6E4izx8e4OHdO36q00xFCU0FolNq3RiCYs="');
                done();
            });

            it('returns a valid authorization header (uri object)', function (done) {

                var credentials = {
                    id: '123456',
                    key: '2983d45yun89q',
                    algorithm: 'sha256'
                };

                var uri = Browser.utils.parseUri('https://example.net/somewhere/over/the/rainbow');
                var header = Browser.client.header(uri, 'POST', { credentials: credentials, timestamp: 1353809207, nonce: 'Ygvqdz', payload: 'something to write about', contentType: 'text/plain' }).field;
                expect(header).to.equal('Hawk id="123456", ts="1353809207", nonce="Ygvqdz", hash="2QfCt3GuY9HQnHWyWD3wX68ZOKbynqlfYmuO2ZBRqtY=", mac="HTgtd0jPI6E4izx8e4OHdO36q00xFCU0FolNq3RiCYs="');
                done();
            });

            it('errors on missing options', function (done) {

                var header = Browser.client.header('https://example.net/somewhere/over/the/rainbow', 'POST');
                expect(header.field).to.equal('');
                expect(header.err).to.equal('Invalid argument type');
                done();
            });

            it('errors on empty uri', function (done) {

                var credentials = {
                    id: '123456',
                    key: '2983d45yun89q',
                    algorithm: 'sha256'
                };

                var header = Browser.client.header('', 'POST', { credentials: credentials, timestamp: 1353809207, nonce: 'Ygvqdz', payload: 'something to write about', contentType: 'text/plain' });
                expect(header.field).to.equal('');
                expect(header.err).to.equal('Invalid argument type');
                done();
            });

            it('errors on invalid uri', function (done) {

                var credentials = {
                    id: '123456',
                    key: '2983d45yun89q',
                    algorithm: 'sha256'
                };

                var header = Browser.client.header(4, 'POST', { credentials: credentials, timestamp: 1353809207, nonce: 'Ygvqdz', payload: 'something to write about', contentType: 'text/plain' });
                expect(header.field).to.equal('');
                expect(header.err).to.equal('Invalid argument type');
                done();
            });

            it('errors on missing method', function (done) {

                var credentials = {
                    id: '123456',
                    key: '2983d45yun89q',
                    algorithm: 'sha256'
                };

                var header = Browser.client.header('https://example.net/somewhere/over/the/rainbow', '', { credentials: credentials, timestamp: 1353809207, nonce: 'Ygvqdz', payload: 'something to write about', contentType: 'text/plain' });
                expect(header.field).to.equal('');
                expect(header.err).to.equal('Invalid argument type');
                done();
            });

            it('errors on invalid method', function (done) {

                var credentials = {
                    id: '123456',
                    key: '2983d45yun89q',
                    algorithm: 'sha256'
                };

                var header = Browser.client.header('https://example.net/somewhere/over/the/rainbow', 5, { credentials: credentials, timestamp: 1353809207, nonce: 'Ygvqdz', payload: 'something to write about', contentType: 'text/plain' });
                expect(header.field).to.equal('');
                expect(header.err).to.equal('Invalid argument type');
                done();
            });

            it('errors on missing credentials', function (done) {

                var header = Browser.client.header('https://example.net/somewhere/over/the/rainbow', 'POST', { ext: 'Bazinga!', timestamp: 1353809207 });
                expect(header.field).to.equal('');
                expect(header.err).to.equal('Invalid credentials object');
                done();
            });

            it('errors on invalid credentials (id)', function (done) {

                var credentials = {
                    key: '2983d45yun89q',
                    algorithm: 'sha256'
                };

                var header = Browser.client.header('https://example.net/somewhere/over/the/rainbow', 'POST', { credentials: credentials, ext: 'Bazinga!', timestamp: 1353809207 });
                expect(header.field).to.equal('');
                expect(header.err).to.equal('Invalid credentials object');
                done();
            });

            it('errors on invalid credentials (key)', function (done) {

                var credentials = {
                    id: '123456',
                    algorithm: 'sha256'
                };

                var header = Browser.client.header('https://example.net/somewhere/over/the/rainbow', 'POST', { credentials: credentials, ext: 'Bazinga!', timestamp: 1353809207 });
                expect(header.field).to.equal('');
                expect(header.err).to.equal('Invalid credentials object');
                done();
            });

            it('errors on invalid algorithm', function (done) {

                var credentials = {
                    id: '123456',
                    key: '2983d45yun89q',
                    algorithm: 'hmac-sha-0'
                };

                var header = Browser.client.header('https://example.net/somewhere/over/the/rainbow', 'POST', { credentials: credentials, payload: 'something, anything!', ext: 'Bazinga!', timestamp: 1353809207 });
                expect(header.field).to.equal('');
                expect(header.err).to.equal('Unknown algorithm');
                done();
            });

            it('uses a pre-calculated payload hash', function (done) {

                var credentials = {
                    id: '123456',
                    key: '2983d45yun89q',
                    algorithm: 'sha256'
                };

                var options = { credentials: credentials, ext: 'Bazinga!', timestamp: 1353809207, nonce: 'Ygvqdz', payload: 'something to write about', contentType: 'text/plain' };
                options.hash = Browser.crypto.calculatePayloadHash(options.payload, credentials.algorithm, options.contentType);
                var header = Browser.client.header('https://example.net/somewhere/over/the/rainbow', 'POST', options).field;
                expect(header).to.equal('Hawk id="123456", ts="1353809207", nonce="Ygvqdz", hash="2QfCt3GuY9HQnHWyWD3wX68ZOKbynqlfYmuO2ZBRqtY=", ext="Bazinga!", mac="q1CwFoSHzPZSkbIvl0oYlD+91rBUEvFk763nMjMndj8="');
                done();
            });
        });

        describe('#authenticate', function () {

            it('skips tsm validation when missing ts', function (done) {

                var res = {
                    headers: {
                        'www-authenticate': 'Hawk error="Stale timestamp"'
                    },
                    getResponseHeader: function (header) {

                        return res.headers[header.toLowerCase()];
                    }
                };

                var credentials = {
                    id: '123456',
                    key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                    algorithm: 'sha256',
                    user: 'steve'
                };

                var artifacts = {
                    ts: 1402135580,
                    nonce: 'iBRB6t',
                    method: 'GET',
                    resource: '/resource/4?filter=a',
                    host: 'example.com',
                    port: '8080',
                    ext: 'some-app-data'
                };

                expect(Browser.client.authenticate(res, credentials, artifacts)).to.equal(true);
                done();
            });

            it('returns false on invalid header', function (done) {

                var res = {
                    headers: {
                        'server-authorization': 'Hawk mac="abc", bad="xyz"'
                    },
                    getResponseHeader: function (header) {

                        return res.headers[header.toLowerCase()];
                    }
                };

                expect(Browser.client.authenticate(res, {})).to.equal(false);
                done();
            });

            it('returns false on invalid mac', function (done) {

                var res = {
                    headers: {
                        'content-type': 'text/plain',
                        'server-authorization': 'Hawk mac="_IJRsMl/4oL+nn+vKoeVZPdCHXB4yJkNnBbTbHFZUYE=", hash="f9cDF/TDm7TkYRLnGwRMfeDzT6LixQVLvrIKhh0vgmM=", ext="response-specific"'
                    },
                    getResponseHeader: function (header) {

                        return res.headers[header.toLowerCase()];
                    }
                };

                var artifacts = {
                    method: 'POST',
                    host: 'example.com',
                    port: '8080',
                    resource: '/resource/4?filter=a',
                    ts: '1362336900',
                    nonce: 'eb5S_L',
                    hash: 'nJjkVtBE5Y/Bk38Aiokwn0jiJxt/0S2WRSUwWLCf5xk=',
                    ext: 'some-app-data',
                    app: undefined,
                    dlg: undefined,
                    mac: 'BlmSe8K+pbKIb6YsZCnt4E1GrYvY1AaYayNR82dGpIk=',
                    id: '123456'
                };

                var credentials = {
                    id: '123456',
                    key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                    algorithm: 'sha256',
                    user: 'steve'
                };

                expect(Browser.client.authenticate(res, credentials, artifacts)).to.equal(false);
                done();
            });

            it('returns true on ignoring hash', function (done) {

                var res = {
                    headers: {
                        'content-type': 'text/plain',
                        'server-authorization': 'Hawk mac="XIJRsMl/4oL+nn+vKoeVZPdCHXB4yJkNnBbTbHFZUYE=", hash="f9cDF/TDm7TkYRLnGwRMfeDzT6LixQVLvrIKhh0vgmM=", ext="response-specific"'
                    },
                    getResponseHeader: function (header) {

                        return res.headers[header.toLowerCase()];
                    }
                };

                var artifacts = {
                    method: 'POST',
                    host: 'example.com',
                    port: '8080',
                    resource: '/resource/4?filter=a',
                    ts: '1362336900',
                    nonce: 'eb5S_L',
                    hash: 'nJjkVtBE5Y/Bk38Aiokwn0jiJxt/0S2WRSUwWLCf5xk=',
                    ext: 'some-app-data',
                    app: undefined,
                    dlg: undefined,
                    mac: 'BlmSe8K+pbKIb6YsZCnt4E1GrYvY1AaYayNR82dGpIk=',
                    id: '123456'
                };

                var credentials = {
                    id: '123456',
                    key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                    algorithm: 'sha256',
                    user: 'steve'
                };

                expect(Browser.client.authenticate(res, credentials, artifacts)).to.equal(true);
                done();
            });

            it('errors on invalid WWW-Authenticate header format', function (done) {

                var res = {
                    headers: {
                        'www-authenticate': 'Hawk ts="1362346425875", tsm="PhwayS28vtnn3qbv0mqRBYSXebN/zggEtucfeZ620Zo=", x="Stale timestamp"'
                    },
                    getResponseHeader: function (header) {

                        return res.headers[header.toLowerCase()];
                    }
                };

                expect(Browser.client.authenticate(res, {})).to.equal(false);
                done();
            });

            it('errors on invalid WWW-Authenticate header format', function (done) {

                var credentials = {
                    id: '123456',
                    key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                    algorithm: 'sha256',
                    user: 'steve'
                };

                var res = {
                    headers: {
                        'www-authenticate': 'Hawk ts="1362346425875", tsm="hwayS28vtnn3qbv0mqRBYSXebN/zggEtucfeZ620Zo=", error="Stale timestamp"'
                    },
                    getResponseHeader: function (header) {

                        return res.headers[header.toLowerCase()];
                    }
                };

                expect(Browser.client.authenticate(res, credentials)).to.equal(false);
                done();
            });
        });

        describe('#message', function () {

            it('generates an authorization then successfully parse it', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var auth = Browser.client.message('example.com', 8080, 'some message', { credentials: credentials });
                    expect(auth).to.exist();

                    Hawk.server.authenticateMessage('example.com', 8080, 'some message', auth, credentialsFunc, {}, function (err, credentials) {

                        expect(err).to.not.exist();
                        expect(credentials.user).to.equal('steve');
                        done();
                    });
                });
            });

            it('generates an authorization using custom nonce/timestamp', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var auth = Browser.client.message('example.com', 8080, 'some message', { credentials: credentials, nonce: 'abc123', timestamp: 1398536270957 });
                    expect(auth).to.exist();
                    expect(auth.nonce).to.equal('abc123');
                    expect(auth.ts).to.equal(1398536270957);
                    done();
                });
            });

            it('errors on missing host', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var auth = Browser.client.message(null, 8080, 'some message', { credentials: credentials });
                    expect(auth).to.not.exist();
                    done();
                });
            });

            it('errors on invalid host', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var auth = Browser.client.message(5, 8080, 'some message', { credentials: credentials });
                    expect(auth).to.not.exist();
                    done();
                });
            });

            it('errors on missing port', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var auth = Browser.client.message('example.com', 0, 'some message', { credentials: credentials });
                    expect(auth).to.not.exist();
                    done();
                });
            });

            it('errors on invalid port', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var auth = Browser.client.message('example.com', 'a', 'some message', { credentials: credentials });
                    expect(auth).to.not.exist();
                    done();
                });
            });

            it('errors on missing message', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var auth = Browser.client.message('example.com', 8080, undefined, { credentials: credentials });
                    expect(auth).to.not.exist();
                    done();
                });
            });

            it('errors on null message', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var auth = Browser.client.message('example.com', 8080, null, { credentials: credentials });
                    expect(auth).to.not.exist();
                    done();
                });
            });

            it('errors on invalid message', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var auth = Browser.client.message('example.com', 8080, 5, { credentials: credentials });
                    expect(auth).to.not.exist();
                    done();
                });
            });

            it('errors on missing credentials', function (done) {

                var auth = Browser.client.message('example.com', 8080, 'some message', {});
                expect(auth).to.not.exist();
                done();
            });

            it('errors on missing options', function (done) {

                var auth = Browser.client.message('example.com', 8080, 'some message');
                expect(auth).to.not.exist();
                done();
            });

            it('errors on invalid credentials (id)', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var creds = Hoek.clone(credentials);
                    delete creds.id;
                    var auth = Browser.client.message('example.com', 8080, 'some message', { credentials: creds });
                    expect(auth).to.not.exist();
                    done();
                });
            });

            it('errors on invalid credentials (key)', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var creds = Hoek.clone(credentials);
                    delete creds.key;
                    var auth = Browser.client.message('example.com', 8080, 'some message', { credentials: creds });
                    expect(auth).to.not.exist();
                    done();
                });
            });

            it('errors on invalid algorithm', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var creds = Hoek.clone(credentials);
                    creds.algorithm = 'blah';
                    var auth = Browser.client.message('example.com', 8080, 'some message', { credentials: creds });
                    expect(auth).to.not.exist();
                    done();
                });
            });
        });

        describe('#authenticateTimestamp', function (done) {

            it('validates a timestamp', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var tsm = Hawk.crypto.timestampMessage(credentials);
                    expect(Browser.client.authenticateTimestamp(tsm, credentials)).to.equal(true);
                    done();
                });
            });

            it('validates a timestamp without updating local time', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var offset = Browser.utils.getNtpOffset();
                    var tsm = Hawk.crypto.timestampMessage(credentials, 10000);
                    expect(Browser.client.authenticateTimestamp(tsm, credentials, false)).to.equal(true);
                    expect(offset).to.equal(Browser.utils.getNtpOffset());
                    done();
                });
            });

            it('detects a bad timestamp', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var tsm = Hawk.crypto.timestampMessage(credentials);
                    tsm.ts = 4;
                    expect(Browser.client.authenticateTimestamp(tsm, credentials)).to.equal(false);
                    done();
                });
            });
        });
    });

    describe('internals', function () {

        describe('LocalStorage', function () {

            it('goes through the full lifecycle', function (done) {

                var storage = new Browser.internals.LocalStorage();
                expect(storage.length).to.equal(0);
                expect(storage.getItem('a')).to.equal(null);
                storage.setItem('a', 5);
                expect(storage.length).to.equal(1);
                expect(storage.key()).to.equal('a');
                expect(storage.key(0)).to.equal('a');
                expect(storage.getItem('a')).to.equal('5');
                storage.setItem('b', 'test');
                expect(storage.key()).to.equal('a');
                expect(storage.key(0)).to.equal('a');
                expect(storage.key(1)).to.equal('b');
                expect(storage.length).to.equal(2);
                expect(storage.getItem('b')).to.equal('test');
                storage.removeItem('a');
                expect(storage.length).to.equal(1);
                expect(storage.getItem('a')).to.equal(null);
                expect(storage.getItem('b')).to.equal('test');
                storage.clear();
                expect(storage.length).to.equal(0);
                expect(storage.getItem('a')).to.equal(null);
                expect(storage.getItem('b')).to.equal(null);
                done();
            });
        });
    });

    describe('utils', function () {

        describe('#setStorage', function () {

            it('sets storage for the first time', function (done) {

                Browser.utils.storage = new Browser.internals.LocalStorage();        // Reset state

                expect(Browser.utils.storage.getItem('hawk_ntp_offset')).to.not.exist();
                Browser.utils.storage.setItem('test', '1');
                Browser.utils.setStorage(new Browser.internals.LocalStorage());
                expect(Browser.utils.storage.getItem('test')).to.not.exist();
                Browser.utils.storage.setItem('test', '2');
                expect(Browser.utils.storage.getItem('test')).to.equal('2');
                done();
            });
        });

        describe('#setNtpOffset', function (done) {

            it('catches localStorage errors', function (done) {

                var orig = Browser.utils.storage.setItem;
                var error = console.error;
                var count = 0;
                console.error = function () { if (count++ === 2) { console.error = error; } };
                Browser.utils.storage.setItem = function () {

                    Browser.utils.storage.setItem = orig;
                    throw new Error()
                };

                expect(function () {
                    Browser.utils.setNtpOffset(100);
                }).not.to.throw();

                done();
            });
        });

        describe('#parseAuthorizationHeader', function (done) {

            it('returns null on missing header', function (done) {

                expect(Browser.utils.parseAuthorizationHeader()).to.equal(null);
                done();
            });

            it('returns null on bad header syntax (structure)', function (done) {

                expect(Browser.utils.parseAuthorizationHeader('Hawk')).to.equal(null);
                done();
            });

            it('returns null on bad header syntax (parts)', function (done) {

                expect(Browser.utils.parseAuthorizationHeader(' ')).to.equal(null);
                done();
            });

            it('returns null on bad scheme name', function (done) {

                expect(Browser.utils.parseAuthorizationHeader('Basic asdasd')).to.equal(null);
                done();
            });

            it('returns null on bad attribute value', function (done) {

                expect(Browser.utils.parseAuthorizationHeader('Hawk test="\t"', ['test'])).to.equal(null);
                done();
            });

            it('returns null on duplicated attribute', function (done) {

                expect(Browser.utils.parseAuthorizationHeader('Hawk test="a", test="b"', ['test'])).to.equal(null);
                done();
            });
        });

        describe('#parseUri', function () {

            it('returns empty port when unknown scheme', function (done) {

                var uri = Browser.utils.parseUri('ftp://domain');
                expect(uri.port).to.equal('');
                done();
            });

            it('returns default port when missing', function (done) {

                var uri = Browser.utils.parseUri('http://');
                expect(uri.port).to.equal('80');
                done();
            });
        });

        var str = "https://www.google.ca/webhp?sourceid=chrome-instant&ion=1&espv=2&ie=UTF-8#q=url";
        var base64str = "aHR0cHM6Ly93d3cuZ29vZ2xlLmNhL3dlYmhwP3NvdXJjZWlkPWNocm9tZS1pbnN0YW50Jmlvbj0xJmVzcHY9MiZpZT1VVEYtOCNxPXVybA";

        describe('#base64urlEncode', function () {

            it('should base64 URL-safe decode a string', function (done) {

                expect(Browser.utils.base64urlEncode(str)).to.equal(base64str);
                done();
            });

        });

    });
});
