// Load modules

var Dns = require('dns');
var Dgram = require('dgram');
var Lab = require('lab');
var Sntp = require('../lib');


// Declare internals

var internals = {};


// Test shortcuts

var lab = exports.lab = Lab.script();
var before = lab.before;
var after = lab.after;
var describe = lab.experiment;
var it = lab.test;
var expect = Lab.expect;


describe('SNTP', function () {

    describe('#time', function () {

        it('returns consistent result over multiple tries', function (done) {

            Sntp.time(function (err, time) {

                expect(err).to.not.exist;
                expect(time).to.exist;
                var t1 = time.t;

                Sntp.time(function (err, time) {

                    expect(err).to.not.exist;
                    expect(time).to.exist;
                    var t2 = time.t;
                    expect(Math.abs(t1 - t2)).is.below(200);
                    done();
                });
            });
        });

        it('resolves reference IP', function (done) {

            Sntp.time({ host: 'ntp.exnet.com', resolveReference: true }, function (err, time) {

                expect(err).to.not.exist;
                expect(time).to.exist;
                expect(time.referenceHost).to.exist;
                done();
            });
        });

        it('times out on no response', function (done) {

            Sntp.time({ port: 124, timeout: 100 }, function (err, time) {

                expect(err).to.exist;
                expect(time).to.not.exist;
                expect(err.message).to.equal('Timeout');
                done();
            });
        });

        it('errors on error event', { parallel: false }, function (done) {

            var orig = Dgram.createSocket;
            Dgram.createSocket = function (type) {

                Dgram.createSocket = orig;
                var socket = Dgram.createSocket(type);
                setImmediate(function () { socket.emit('error', new Error('Fake')) });
                return socket;
            };

            Sntp.time(function (err, time) {

                expect(err).to.exist;
                expect(time).to.not.exist;
                expect(err.message).to.equal('Fake');
                done();
            });
        });

        it('errors on incorrect sent size', { parallel: false }, function (done) {

            var orig = Dgram.Socket.prototype.send;
            Dgram.Socket.prototype.send = function (buf, offset, length, port, address, callback) {

                Dgram.Socket.prototype.send = orig;
                return callback(null, 40);
            };

            Sntp.time(function (err, time) {

                expect(err).to.exist;
                expect(time).to.not.exist;
                expect(err.message).to.equal('Could not send entire message');
                done();
            });
        });

        it('times out on invalid host', function (done) {

            Sntp.time({ host: 'error', timeout: 10000 }, function (err, time) {

                expect(err).to.exist;
                expect(time).to.not.exist;
                expect(err.message).to.contain('getaddrinfo');
                done();
            });
        });

        it('fails on bad response buffer size', function (done) {

            var server = Dgram.createSocket('udp4');
            server.on('message', function (message, remote) {
                var message = new Buffer(10);
                server.send(message, 0, message.length, remote.port, remote.address, function (err, bytes) {

                    server.close();
                });
            });

            server.bind(49123);

            Sntp.time({ host: 'localhost', port: 49123 }, function (err, time) {

                expect(err).to.exist;
                expect(err.message).to.equal('Invalid server response');
                done();
            });
        });

        var messup = function (bytes) {

            var server = Dgram.createSocket('udp4');
            server.on('message', function (message, remote) {

                var message = new Buffer([
                    0x24, 0x01, 0x00, 0xe3,
                    0x00, 0x00, 0x00, 0x00,
                    0x00, 0x00, 0x00, 0x00,
                    0x41, 0x43, 0x54, 0x53,
                    0xd4, 0xa8, 0x2d, 0xc7,
                    0x1c, 0x5d, 0x49, 0x1b,
                    0xd4, 0xa8, 0x2d, 0xe6,
                    0x67, 0xef, 0x9d, 0xb2,
                    0xd4, 0xa8, 0x2d, 0xe6,
                    0x71, 0xed, 0xb5, 0xfb,
                    0xd4, 0xa8, 0x2d, 0xe6,
                    0x71, 0xee, 0x6c, 0xc5
                ]);

                for (var i = 0, il = bytes.length; i < il; ++i) {
                    message[bytes[i][0]] = bytes[i][1];
                }

                server.send(message, 0, message.length, remote.port, remote.address, function (err, bytes) {

                    server.close();
                });
            });

            server.bind(49123);
        };

        it('fails on bad version', function (done) {

            messup([[0, (0 << 6) + (3 << 3) + (4 << 0)]]);

            Sntp.time({ host: 'localhost', port: 49123 }, function (err, time) {

                expect(err).to.exist;
                expect(time.version).to.equal(3);
                expect(err.message).to.equal('Invalid server response');
                done();
            });
        });

        it('fails on bad originateTimestamp', function (done) {

            messup([[24, 0x83], [25, 0xaa], [26, 0x7e], [27, 0x80], [28, 0], [29, 0], [30, 0], [31, 0]]);

            Sntp.time({ host: 'localhost', port: 49123 }, function (err, time) {

                expect(err).to.exist;
                expect(err.message).to.equal('Invalid server response');
                done();
            });
        });

        it('fails on bad receiveTimestamp', function (done) {

            messup([[32, 0x83], [33, 0xaa], [34, 0x7e], [35, 0x80], [36, 0], [37, 0], [38, 0], [39, 0]]);

            Sntp.time({ host: 'localhost', port: 49123 }, function (err, time) {

                expect(err).to.exist;
                expect(err.message).to.equal('Invalid server response');
                done();
            });
        });

        it('fails on bad originate timestamp and alarm li', function (done) {

            messup([[0, (3 << 6) + (4 << 3) + (4 << 0)]]);

            Sntp.time({ host: 'localhost', port: 49123 }, function (err, time) {

                expect(err).to.exist;
                expect(err.message).to.equal('Wrong originate timestamp');
                expect(time.leapIndicator).to.equal('alarm');
                done();
            });
        });

        it('returns time with death stratum and last61 li', function (done) {

            messup([[0, (1 << 6) + (4 << 3) + (4 << 0)], [1, 0]]);

            Sntp.time({ host: 'localhost', port: 49123 }, function (err, time) {

                expect(time.stratum).to.equal('death');
                expect(time.leapIndicator).to.equal('last-minute-61');
                done();
            });
        });

        it('returns time with reserved stratum and last59 li', function (done) {

            messup([[0, (2 << 6) + (4 << 3) + (4 << 0)], [1, 0x1f]]);

            Sntp.time({ host: 'localhost', port: 49123 }, function (err, time) {

                expect(time.stratum).to.equal('reserved');
                expect(time.leapIndicator).to.equal('last-minute-59');
                done();
            });
        });

        it('fails on bad mode (symmetric-active)', function (done) {

            messup([[0, (0 << 6) + (4 << 3) + (1 << 0)]]);

            Sntp.time({ host: 'localhost', port: 49123 }, function (err, time) {

                expect(err).to.exist;
                expect(time.mode).to.equal('symmetric-active');
                done();
            });
        });

        it('fails on bad mode (symmetric-passive)', function (done) {

            messup([[0, (0 << 6) + (4 << 3) + (2 << 0)]]);

            Sntp.time({ host: 'localhost', port: 49123 }, function (err, time) {

                expect(err).to.exist;
                expect(time.mode).to.equal('symmetric-passive');
                done();
            });
        });

        it('fails on bad mode (client)', function (done) {

            messup([[0, (0 << 6) + (4 << 3) + (3 << 0)]]);

            Sntp.time({ host: 'localhost', port: 49123 }, function (err, time) {

                expect(err).to.exist;
                expect(time.mode).to.equal('client');
                done();
            });
        });

        it('fails on bad mode (broadcast)', function (done) {

            messup([[0, (0 << 6) + (4 << 3) + (5 << 0)]]);

            Sntp.time({ host: 'localhost', port: 49123 }, function (err, time) {

                expect(err).to.exist;
                expect(time.mode).to.equal('broadcast');
                done();
            });
        });

        it('fails on bad mode (reserved)', function (done) {

            messup([[0, (0 << 6) + (4 << 3) + (6 << 0)]]);

            Sntp.time({ host: 'localhost', port: 49123 }, function (err, time) {

                expect(err).to.exist;
                expect(time.mode).to.equal('reserved');
                done();
            });
        });
    });

    describe('#offset', function () {

        it('gets the current offset', function (done) {

            Sntp.offset(function (err, offset) {

                expect(err).to.not.exist;
                expect(offset).to.not.equal(0);
                done();
            });
        });

        it('gets the current offset from cache', function (done) {

            Sntp.offset(function (err, offset) {

                expect(err).to.not.exist;
                expect(offset).to.not.equal(0);
                var offset1 = offset;
                Sntp.offset({}, function (err, offset) {

                    expect(err).to.not.exist;
                    expect(offset).to.equal(offset1);
                    done();
                });
            });
        });

        it('gets the new offset on different server', function (done) {

            Sntp.offset(function (err, offset) {

                expect(err).to.not.exist;
                expect(offset).to.not.equal(0);
                var offset1 = offset;
                Sntp.offset({ host: 'nist1-sj.ustiming.org' }, function (err, offset) {

                    expect(err).to.not.exist;
                    expect(offset).to.not.equal(offset1);
                    done();
                });
            });
        });

        it('gets the new offset on different server', function (done) {

            Sntp.offset(function (err, offset) {

                expect(err).to.not.exist;
                expect(offset).to.not.equal(0);
                var offset1 = offset;
                Sntp.offset({ port: 123 }, function (err, offset) {

                    expect(err).to.not.exist;
                    expect(offset).to.not.equal(offset1);
                    done();
                });
            });
        });

        it('fails getting the current offset on invalid server', function (done) {

            Sntp.offset({ host: 'error' }, function (err, offset) {

                expect(err).to.exist;
                expect(offset).to.equal(0);
                done();
            });
        });
    });

    describe('#now', function () {

        it('starts auto-sync, gets now, then stops', function (done) {

            Sntp.stop();

            var before = Sntp.now();
            expect(before).to.equal(Date.now());

            Sntp.start(function () {

                var now = Sntp.now();
                expect(now).to.not.equal(Date.now());
                Sntp.stop();

                done();
            });
        });

        it('starts twice', function (done) {

            Sntp.start(function () {

                Sntp.start(function () {

                    var now = Sntp.now();
                    expect(now).to.not.equal(Date.now());
                    Sntp.stop();

                    done();
                });
            });
        });

        it('starts auto-sync, gets now, waits, gets again after timeout', function (done) {

            Sntp.stop();

            var before = Sntp.now();
            expect(before).to.equal(Date.now());

            Sntp.start({ clockSyncRefresh: 100 }, function () {

                var now = Sntp.now();
                expect(now).to.not.equal(Date.now());
                expect(now).to.equal(Sntp.now());

                setTimeout(function () {

                    expect(Sntp.now()).to.not.equal(now);
                    Sntp.stop();
                    done();
                }, 110);
            });
        });
    });
});

