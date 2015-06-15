'use strict';

module.exports.definition = {
    set: function (v) {
        this._setProperty('padding-left', v);
    },
    get: function () {
        return this.getPropertyValue('padding-left');
    },
    enumerable: true,
    configurable: true
};
