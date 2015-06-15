'use strict';

module.exports.definition = {
    set: function (v) {
        this._setProperty('margin-left', v);
    },
    get: function () {
        return this.getPropertyValue('margin-left');
    },
    enumerable: true,
    configurable: true
};
