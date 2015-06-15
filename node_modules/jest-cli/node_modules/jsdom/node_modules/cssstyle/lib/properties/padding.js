'use strict';

module.exports.definition = {
    set: function (v) {
        this._setProperty('padding', v);
    },
    get: function () {
        return this.getPropertyValue('padding');
    },
    enumerable: true,
    configurable: true
};
