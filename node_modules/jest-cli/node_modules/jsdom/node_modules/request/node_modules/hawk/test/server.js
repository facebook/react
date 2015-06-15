// Load modules

var Url = require('url');
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

    describe('server', function () {

        var credentialsFunc = function (id, callback) {

            var credentials = {
                id: id,
                key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                algorithm: (id === '1' ? 'sha1' : 'sha256'),
                user: 'steve'
            };

            return callback(null, credentials);
        };

        describe('#authenticate', function () {

            it('parses a valid authentication header (sha1)', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="1", ts="1353788437", nonce="k3j4h2", mac="zy79QQ5/EYFmQqutVnYb73gAc/U=", ext="hello"'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.not.exist();
                    expect(credentials.user).to.equal('steve');
                    done();
                });
            });

            it('parses a valid authentication header (sha256)', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/1?b=1&a=2',
                    host: 'example.com',
                    port: 8000,
                    authorization: 'Hawk id="dh37fgj492je", ts="1353832234", nonce="j4h3g2", mac="m8r1rHbXN6NgO+KIIhjO7sFRyd78RNGVUwehe8Cp2dU=", ext="some-app-data"'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353832234000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.not.exist();
                    expect(credentials.user).to.equal('steve');
                    done();
                });
            });

            it('parses a valid authentication header (host override)', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    headers: {
                        host: 'example1.com:8080',
                        authorization: 'Hawk id="1", ts="1353788437", nonce="k3j4h2", mac="zy79QQ5/EYFmQqutVnYb73gAc/U=", ext="hello"'
                    }
                };

                Hawk.server.authenticate(req, credentialsFunc, { host: 'example.com', localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.not.exist();
                    expect(credentials.user).to.equal('steve');
                    done();
                });
            });

            it('parses a valid authentication header (host port override)', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    headers: {
                        host: 'example1.com:80',
                        authorization: 'Hawk id="1", ts="1353788437", nonce="k3j4h2", mac="zy79QQ5/EYFmQqutVnYb73gAc/U=", ext="hello"'
                    }
                };

                Hawk.server.authenticate(req, credentialsFunc, { host: 'example.com', port: 8080, localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.not.exist();
                    expect(credentials.user).to.equal('steve');
                    done();
                });
            });

            it('parses a valid authentication header (POST with payload)', function (done) {

                var req = {
                    method: 'POST',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123456", ts="1357926341", nonce="1AwuJD", hash="qAiXIVv+yjDATneWxZP2YCTa9aHRgQdnH9b3Wc+o3dg=", ext="some-app-data", mac="UeYcj5UoTVaAWXNvJfLVia7kU3VabxCqrccXP8sUGC4="'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1357926341000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.not.exist();
                    expect(credentials.user).to.equal('steve');
                    done();
                });
            });

            it('errors on missing hash', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/1?b=1&a=2',
                    host: 'example.com',
                    port: 8000,
                    authorization: 'Hawk id="dh37fgj492je", ts="1353832234", nonce="j4h3g2", mac="m8r1rHbXN6NgO+KIIhjO7sFRyd78RNGVUwehe8Cp2dU=", ext="some-app-data"'
                };

                Hawk.server.authenticate(req, credentialsFunc, { payload: 'body', localtimeOffsetMsec: 1353832234000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Missing required payload hash');
                    done();
                });
            });

            it('errors on a stale timestamp', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123456", ts="1362337299", nonce="UzmxSs", ext="some-app-data", mac="wnNUxchvvryMH2RxckTdZ/gY3ijzvccx4keVvELC61w="'
                };

                Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Stale timestamp');
                    var header = err.output.headers['WWW-Authenticate'];
                    var ts = header.match(/^Hawk ts\=\"(\d+)\"\, tsm\=\"([^\"]+)\"\, error=\"Stale timestamp\"$/);
                    var now = Hawk.utils.now();
                    expect(parseInt(ts[1], 10) * 1000).to.be.within(now - 1000, now + 1000);

                    var res = {
                        headers: {
                            'www-authenticate': header
                        }
                    };

                    expect(Hawk.client.authenticate(res, credentials, artifacts)).to.equal(true);
                    done();
                });
            });

            it('errors on a replay', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123", ts="1353788437", nonce="k3j4h2", mac="bXx7a7p1h9QYQNZ8x7QhvDQym8ACgab4m3lVSFn4DBw=", ext="hello"'
                };

                var memoryCache = {};
                var options = {
                    localtimeOffsetMsec: 1353788437000 - Hawk.utils.now(),
                    nonceFunc: function (nonce, ts, callback) {

                        if (memoryCache[nonce]) {
                            return callback(new Error());
                        }

                        memoryCache[nonce] = true;
                        return callback();
                    }
                };

                Hawk.server.authenticate(req, credentialsFunc, options, function (err, credentials, artifacts) {

                    expect(err).to.not.exist();
                    expect(credentials.user).to.equal('steve');

                    Hawk.server.authenticate(req, credentialsFunc, options, function (err, credentials, artifacts) {

                        expect(err).to.exist();
                        expect(err.output.payload.message).to.equal('Invalid nonce');
                        done();
                    });
                });
            });

            it('errors on an invalid authentication header: wrong scheme', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Basic asdasdasdasd'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.not.exist();
                    done();
                });
            });

            it('errors on an invalid authentication header: no scheme', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: '!@#'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Invalid header syntax');
                    done();
                });
            });

            it('errors on an missing authorization header', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080
                };

                Hawk.server.authenticate(req, credentialsFunc, {}, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.isMissing).to.equal(true);
                    done();
                });
            });

            it('errors on an missing host header', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    headers: {
                        authorization: 'Hawk id="123", ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                    }
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Invalid Host header');
                    done();
                });
            });

            it('errors on an missing authorization attribute (id)', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Missing attributes');
                    done();
                });
            });

            it('errors on an missing authorization attribute (ts)', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Missing attributes');
                    done();
                });
            });

            it('errors on an missing authorization attribute (nonce)', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123", ts="1353788437", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Missing attributes');
                    done();
                });
            });

            it('errors on an missing authorization attribute (mac)', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123", ts="1353788437", nonce="k3j4h2", ext="hello"'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Missing attributes');
                    done();
                });
            });

            it('errors on an unknown authorization attribute', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123", ts="1353788437", nonce="k3j4h2", x="3", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Unknown attribute: x');
                    done();
                });
            });

            it('errors on an bad authorization header format', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123\\", ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Bad header format');
                    done();
                });
            });

            it('errors on an bad authorization attribute value', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="\t", ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Bad attribute value: id');
                    done();
                });
            });

            it('errors on an empty authorization attribute value', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="", ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Bad attribute value: id');
                    done();
                });
            });

            it('errors on duplicated authorization attribute key', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123", id="456", ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Duplicate attribute: id');
                    done();
                });
            });

            it('errors on an invalid authorization header format', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk'
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Invalid header syntax');
                    done();
                });
            });

            it('errors on an bad host header (missing host)', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    headers: {
                        host: ':8080',
                        authorization: 'Hawk id="123", ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                    }
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Invalid Host header');
                    done();
                });
            });

            it('errors on an bad host header (pad port)', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    headers: {
                        host: 'example.com:something',
                        authorization: 'Hawk id="123", ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                    }
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Invalid Host header');
                    done();
                });
            });

            it('errors on credentialsFunc error', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123", ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                var credentialsFunc = function (id, callback) {

                    return callback(new Error('Unknown user'));
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.message).to.equal('Unknown user');
                    done();
                });
            });

            it('errors on credentialsFunc error (with credentials)', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123", ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                var credentialsFunc = function (id, callback) {

                    return callback(new Error('Unknown user'), { some: 'value' });
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.message).to.equal('Unknown user');
                    expect(credentials.some).to.equal('value');
                    done();
                });
            });

            it('errors on missing credentials', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123", ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                var credentialsFunc = function (id, callback) {

                    return callback(null, null);
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Unknown credentials');
                    done();
                });
            });

            it('errors on invalid credentials (id)', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123", ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                var credentialsFunc = function (id, callback) {

                    var credentials = {
                        key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                        user: 'steve'
                    };

                    return callback(null, credentials);
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.message).to.equal('Invalid credentials');
                    expect(err.output.payload.message).to.equal('An internal server error occurred');
                    done();
                });
            });

            it('errors on invalid credentials (key)', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123", ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                var credentialsFunc = function (id, callback) {

                    var credentials = {
                        id: '23434d3q4d5345d',
                        user: 'steve'
                    };

                    return callback(null, credentials);
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.message).to.equal('Invalid credentials');
                    expect(err.output.payload.message).to.equal('An internal server error occurred');
                    done();
                });
            });

            it('errors on unknown credentials algorithm', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123", ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcUyW6EEgUH4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                var credentialsFunc = function (id, callback) {

                    var credentials = {
                        key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                        algorithm: 'hmac-sha-0',
                        user: 'steve'
                    };

                    return callback(null, credentials);
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.message).to.equal('Unknown algorithm');
                    expect(err.output.payload.message).to.equal('An internal server error occurred');
                    done();
                });
            });

            it('errors on unknown bad mac', function (done) {

                var req = {
                    method: 'GET',
                    url: '/resource/4?filter=a',
                    host: 'example.com',
                    port: 8080,
                    authorization: 'Hawk id="123", ts="1353788437", nonce="k3j4h2", mac="/qwS4UjfVWMcU4jlr7T/wuKe3dKijvTvSos=", ext="hello"'
                };

                var credentialsFunc = function (id, callback) {

                    var credentials = {
                        key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                        algorithm: 'sha256',
                        user: 'steve'
                    };

                    return callback(null, credentials);
                };

                Hawk.server.authenticate(req, credentialsFunc, { localtimeOffsetMsec: 1353788437000 - Hawk.utils.now() }, function (err, credentials, artifacts) {

                    expect(err).to.exist();
                    expect(err.output.payload.message).to.equal('Bad mac');
                    done();
                });
            });
        });

        describe('#header', function () {

            it('generates header', function (done) {

                var credentials = {
                    id: '123456',
                    key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                    algorithm: 'sha256',
                    user: 'steve'
                };

                var artifacts = {
                    method: 'POST',
                    host: 'example.com',
                    port: '8080',
                    resource: '/resource/4?filter=a',
                    ts: '1398546787',
                    nonce: 'xUwusx',
                    hash: 'nJjkVtBE5Y/Bk38Aiokwn0jiJxt/0S2WRSUwWLCf5xk=',
                    ext: 'some-app-data',
                    mac: 'dvIvMThwi28J61Jc3P0ryAhuKpanU63GXdx6hkmQkJA=',
                    id: '123456'
                };

                var header = Hawk.server.header(credentials, artifacts, { payload: 'some reply', contentType: 'text/plain', ext: 'response-specific' });
                expect(header).to.equal('Hawk mac=\"n14wVJK4cOxAytPUMc5bPezQzuJGl5n7MYXhFQgEKsE=\", hash=\"f9cDF/TDm7TkYRLnGwRMfeDzT6LixQVLvrIKhh0vgmM=\", ext=\"response-specific\"');
                done();
            });

            it('generates header (empty payload)', function (done) {

                var credentials = {
                    id: '123456',
                    key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                    algorithm: 'sha256',
                    user: 'steve'
                };

                var artifacts = {
                    method: 'POST',
                    host: 'example.com',
                    port: '8080',
                    resource: '/resource/4?filter=a',
                    ts: '1398546787',
                    nonce: 'xUwusx',
                    hash: 'nJjkVtBE5Y/Bk38Aiokwn0jiJxt/0S2WRSUwWLCf5xk=',
                    ext: 'some-app-data',
                    mac: 'dvIvMThwi28J61Jc3P0ryAhuKpanU63GXdx6hkmQkJA=',
                    id: '123456'
                };

                var header = Hawk.server.header(credentials, artifacts, { payload: '', contentType: 'text/plain', ext: 'response-specific' });
                expect(header).to.equal('Hawk mac=\"i8/kUBDx0QF+PpCtW860kkV/fa9dbwEoe/FpGUXowf0=\", hash=\"q/t+NNAkQZNlq/aAD6PlexImwQTxwgT2MahfTa9XRLA=\", ext=\"response-specific\"');
                done();
            });

            it('generates header (pre calculated hash)', function (done) {

                var credentials = {
                    id: '123456',
                    key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                    algorithm: 'sha256',
                    user: 'steve'
                };

                var artifacts = {
                    method: 'POST',
                    host: 'example.com',
                    port: '8080',
                    resource: '/resource/4?filter=a',
                    ts: '1398546787',
                    nonce: 'xUwusx',
                    hash: 'nJjkVtBE5Y/Bk38Aiokwn0jiJxt/0S2WRSUwWLCf5xk=',
                    ext: 'some-app-data',
                    mac: 'dvIvMThwi28J61Jc3P0ryAhuKpanU63GXdx6hkmQkJA=',
                    id: '123456'
                };

                var options = { payload: 'some reply', contentType: 'text/plain', ext: 'response-specific' };
                options.hash = Hawk.crypto.calculatePayloadHash(options.payload, credentials.algorithm, options.contentType);
                var header = Hawk.server.header(credentials, artifacts, options);
                expect(header).to.equal('Hawk mac=\"n14wVJK4cOxAytPUMc5bPezQzuJGl5n7MYXhFQgEKsE=\", hash=\"f9cDF/TDm7TkYRLnGwRMfeDzT6LixQVLvrIKhh0vgmM=\", ext=\"response-specific\"');
                done();
            });

            it('generates header (null ext)', function (done) {

                var credentials = {
                    id: '123456',
                    key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                    algorithm: 'sha256',
                    user: 'steve'
                };

                var artifacts = {
                    method: 'POST',
                    host: 'example.com',
                    port: '8080',
                    resource: '/resource/4?filter=a',
                    ts: '1398546787',
                    nonce: 'xUwusx',
                    hash: 'nJjkVtBE5Y/Bk38Aiokwn0jiJxt/0S2WRSUwWLCf5xk=',
                    mac: 'dvIvMThwi28J61Jc3P0ryAhuKpanU63GXdx6hkmQkJA=',
                    id: '123456'
                };

                var header = Hawk.server.header(credentials, artifacts, { payload: 'some reply', contentType: 'text/plain', ext: null });
                expect(header).to.equal('Hawk mac=\"6PrybJTJs20jsgBw5eilXpcytD8kUbaIKNYXL+6g0ns=\", hash=\"f9cDF/TDm7TkYRLnGwRMfeDzT6LixQVLvrIKhh0vgmM=\"');
                done();
            });

            it('errors on missing artifacts', function (done) {

                var credentials = {
                    id: '123456',
                    key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                    algorithm: 'sha256',
                    user: 'steve'
                };

                var header = Hawk.server.header(credentials, null, { payload: 'some reply', contentType: 'text/plain', ext: 'response-specific' });
                expect(header).to.equal('');
                done();
            });

            it('errors on invalid artifacts', function (done) {

                var credentials = {
                    id: '123456',
                    key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                    algorithm: 'sha256',
                    user: 'steve'
                };

                var header = Hawk.server.header(credentials, 5, { payload: 'some reply', contentType: 'text/plain', ext: 'response-specific' });
                expect(header).to.equal('');
                done();
            });

            it('errors on missing credentials', function (done) {

                var artifacts = {
                    method: 'POST',
                    host: 'example.com',
                    port: '8080',
                    resource: '/resource/4?filter=a',
                    ts: '1398546787',
                    nonce: 'xUwusx',
                    hash: 'nJjkVtBE5Y/Bk38Aiokwn0jiJxt/0S2WRSUwWLCf5xk=',
                    ext: 'some-app-data',
                    mac: 'dvIvMThwi28J61Jc3P0ryAhuKpanU63GXdx6hkmQkJA=',
                    id: '123456'
                };

                var header = Hawk.server.header(null, artifacts, { payload: 'some reply', contentType: 'text/plain', ext: 'response-specific' });
                expect(header).to.equal('');
                done();
            });

            it('errors on invalid credentials (key)', function (done) {

                var credentials = {
                    id: '123456',
                    algorithm: 'sha256',
                    user: 'steve'
                };

                var artifacts = {
                    method: 'POST',
                    host: 'example.com',
                    port: '8080',
                    resource: '/resource/4?filter=a',
                    ts: '1398546787',
                    nonce: 'xUwusx',
                    hash: 'nJjkVtBE5Y/Bk38Aiokwn0jiJxt/0S2WRSUwWLCf5xk=',
                    ext: 'some-app-data',
                    mac: 'dvIvMThwi28J61Jc3P0ryAhuKpanU63GXdx6hkmQkJA=',
                    id: '123456'
                };

                var header = Hawk.server.header(credentials, artifacts, { payload: 'some reply', contentType: 'text/plain', ext: 'response-specific' });
                expect(header).to.equal('');
                done();
            });

            it('errors on invalid algorithm', function (done) {

                var credentials = {
                    id: '123456',
                    key: 'werxhqb98rpaxn39848xrunpaw3489ruxnpa98w4rxn',
                    algorithm: 'x',
                    user: 'steve'
                };

                var artifacts = {
                    method: 'POST',
                    host: 'example.com',
                    port: '8080',
                    resource: '/resource/4?filter=a',
                    ts: '1398546787',
                    nonce: 'xUwusx',
                    hash: 'nJjkVtBE5Y/Bk38Aiokwn0jiJxt/0S2WRSUwWLCf5xk=',
                    ext: 'some-app-data',
                    mac: 'dvIvMThwi28J61Jc3P0ryAhuKpanU63GXdx6hkmQkJA=',
                    id: '123456'
                };

                var header = Hawk.server.header(credentials, artifacts, { payload: 'some reply', contentType: 'text/plain', ext: 'response-specific' });
                expect(header).to.equal('');
                done();
            });
        });

        describe('#authenticateMessage', function () {

            it('errors on invalid authorization (ts)', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials });
                    delete auth.ts;

                    Hawk.server.authenticateMessage('example.com', 8080, 'some message', auth, credentialsFunc, {}, function (err, credentials) {

                        expect(err).to.exist();
                        expect(err.message).to.equal('Invalid authorization');
                        done();
                    });
                });
            });

            it('errors on invalid authorization (nonce)', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials });
                    delete auth.nonce;

                    Hawk.server.authenticateMessage('example.com', 8080, 'some message', auth, credentialsFunc, {}, function (err, credentials) {

                        expect(err).to.exist();
                        expect(err.message).to.equal('Invalid authorization');
                        done();
                    });
                });
            });

            it('errors on invalid authorization (hash)', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials });
                    delete auth.hash;

                    Hawk.server.authenticateMessage('example.com', 8080, 'some message', auth, credentialsFunc, {}, function (err, credentials) {

                        expect(err).to.exist();
                        expect(err.message).to.equal('Invalid authorization');
                        done();
                    });
                });
            });

            it('errors with credentials', function (done) {

                credentialsFunc('123456', function (err, credentials) {

                    var auth = Hawk.client.message('example.com', 8080, 'some message', { credentials: credentials });

                    Hawk.server.authenticateMessage('example.com', 8080, 'some message', auth, function (id, callback) { callback(new Error('something'), { some: 'value' }); }, {}, function (err, credentials) {

                        expect(err).to.exist();
                        expect(err.message).to.equal('something');
                        expect(credentials.some).to.equal('value');
                        done();
                    });
                });
            });
        });

        describe('#authenticatePayloadHash', function () {

            it('checks payload hash', function (done) {

                expect(Hawk.server.authenticatePayloadHash('abcdefg', { hash: 'abcdefg' })).to.equal(true);
                expect(Hawk.server.authenticatePayloadHash('1234567', { hash: 'abcdefg' })).to.equal(false);
                done();
            });
        });
    });
});
