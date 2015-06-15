'use strict';

module.exports.definition = {
    set: function (v) {
        this._setProperty('margin-right', v);
    },
    get: function () {
        return this.getPropertyValue('margin-right');
    },
    enumerable: true,
    configurable: true
};
