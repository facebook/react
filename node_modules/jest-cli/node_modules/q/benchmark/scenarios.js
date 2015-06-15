"use strict";

var Q = require("../q");

suite("Chaining", function () {
    var numberToChain = 1000;

    bench("Chaining many already-fulfilled promises together", function (done) {
        var currentPromise = Q();
        for (var i = 0; i < numberToChain; ++i) {
            currentPromise = currentPromise.then(function () {
                return Q();
            });
        }

        currentPromise.then(done);
    });

    bench("Chaining and then fulfilling the end of the chain", function (done) {
        var deferred = Q.defer();

        var currentPromise = deferred.promise;
        for (var i = 0; i < numberToChain; ++i) {
            (function () {
                var promiseToReturn = currentPromise;
                currentPromise = Q().then(function () {
                    return promiseToReturn;
                });
            }());
        }

        currentPromise.then(done);

        deferred.resolve();
    });
});
