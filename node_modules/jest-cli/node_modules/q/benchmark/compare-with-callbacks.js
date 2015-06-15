"use strict";

var Q = require("../q");
var fs = require("fs");

suite("A single simple async operation", function () {
    bench("with an immediately-fulfilled promise", function (done) {
        Q().then(done);
    });

    bench("with direct setImmediate usage", function (done) {
        setImmediate(done);
    });

    bench("with direct setTimeout(…, 0)", function (done) {
        setTimeout(done, 0);
    });
});

suite("A fs.readFile", function () {
    var denodeified = Q.denodeify(fs.readFile);

    set("iterations", 1000);
    set("delay", 1000);

    bench("directly, with callbacks", function (done) {
        fs.readFile(__filename, done);
    });

    bench("with Q.nfcall", function (done) {
        Q.nfcall(fs.readFile, __filename).then(done);
    });

    bench("with a Q.denodeify'ed version", function (done) {
        denodeified(__filename).then(done);
    });

    bench("with manual usage of deferred.makeNodeResolver", function (done) {
        var deferred = Q.defer();
        fs.readFile(__filename, deferred.makeNodeResolver());
        deferred.promise.then(done);
    });
});

suite("1000 operations in parallel", function () {
    function makeCounter(desiredCount, ultimateCallback) {
        var soFar = 0;
        return function () {
            if (++soFar === desiredCount) {
                ultimateCallback();
            }
        };
    }
    var numberOfOps = 1000;

    bench("with immediately-fulfilled promises", function (done) {
        var counter = makeCounter(numberOfOps, done);

        for (var i = 0; i < numberOfOps; ++i) {
            Q().then(counter);
        }
    });

    bench("with direct setImmediate usage", function (done) {
        var counter = makeCounter(numberOfOps, done);

        for (var i = 0; i < numberOfOps; ++i) {
            setImmediate(counter);
        }
    });
});
