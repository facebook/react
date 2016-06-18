"use strict";
var PromiseCompleter = (function () {
    function PromiseCompleter() {
        var _this = this;
        this.promise = new Promise(function (res, rej) {
            _this.resolve = res;
            _this.reject = rej;
        });
    }
    return PromiseCompleter;
}());
exports.PromiseCompleter = PromiseCompleter;
var PromiseWrapper = (function () {
    function PromiseWrapper() {
    }
    PromiseWrapper.resolve = function (obj) { return Promise.resolve(obj); };
    PromiseWrapper.reject = function (obj, _) { return Promise.reject(obj); };
    // Note: We can't rename this method into `catch`, as this is not a valid
    // method name in Dart.
    PromiseWrapper.catchError = function (promise, onError) {
        return promise.catch(onError);
    };
    PromiseWrapper.all = function (promises) {
        if (promises.length == 0)
            return Promise.resolve([]);
        return Promise.all(promises);
    };
    PromiseWrapper.then = function (promise, success, rejection) {
        return promise.then(success, rejection);
    };
    PromiseWrapper.wrap = function (computation) {
        return new Promise(function (res, rej) {
            try {
                res(computation());
            }
            catch (e) {
                rej(e);
            }
        });
    };
    PromiseWrapper.scheduleMicrotask = function (computation) {
        PromiseWrapper.then(PromiseWrapper.resolve(null), computation, function (_) { });
    };
    PromiseWrapper.isPromise = function (obj) { return obj instanceof Promise; };
    PromiseWrapper.completer = function () { return new PromiseCompleter(); };
    return PromiseWrapper;
}());
exports.PromiseWrapper = PromiseWrapper;
//# sourceMappingURL=promise.js.map