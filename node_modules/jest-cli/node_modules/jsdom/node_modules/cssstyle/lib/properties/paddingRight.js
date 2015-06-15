'use strict';

module.exports.definition = {
    set: function (v) {
        this._setProperty('padding-right', v);
    },
    get: function () {
        return this.getPropertyValue('padding-right');
    },
    enumerable: true,
    configurable: true
};
