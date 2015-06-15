'use strict';

module.exports.definition = {
    set: function (v) {
        this._setProperty('padding-bottom', v);
    },
    get: function () {
        return this.getPropertyValue('padding-bottom');
    },
    enumerable: true,
    configurable: true
};
