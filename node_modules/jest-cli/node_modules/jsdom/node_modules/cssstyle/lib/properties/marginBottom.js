'use strict';

module.exports.definition = {
    set: function (v) {
        this._setProperty('margin-bottom', v);
    },
    get: function () {
        return this.getPropertyValue('margin-bottom');
    },
    enumerable: true,
    configurable: true
};
