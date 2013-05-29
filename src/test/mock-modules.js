/**
 * @providesModule mock-modules
 */

var global = Function("return this")();
require('test/mock-timers').installMockTimers(global);

exports.dumpCache = function() {
    require("mocks").clear();
    return exports;
};

exports.dontMock = function() {
    return exports;
};

exports.autoMockOff = function() {
    return exports;
};

exports.mock = function() {
    return exports;
};
