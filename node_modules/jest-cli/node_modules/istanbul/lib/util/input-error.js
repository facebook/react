/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

module.exports.create = function (message) {
    var err = new Error(message);
    err.inputError = true;
    return err;
};


