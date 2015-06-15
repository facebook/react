/*
 Copyright (c) 2012, Yahoo! Inc.  All rights reserved.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */

var OPT_PREFIX = "      ",
    OPT_START = OPT_PREFIX.length,
    TEXT_START = 14,
    STOP = 80,
    wrap = require('wordwrap')(TEXT_START, STOP),
    paraWrap = require('wordwrap')(1, STOP);

function formatPara(text) {
    return paraWrap(text);
}

function formatOption(option, helpText) {
    var formattedText = wrap(helpText);

    if (option.length > TEXT_START - OPT_START - 2) {
        return OPT_PREFIX + option + '\n' + formattedText;
    } else {
        return OPT_PREFIX + option + formattedText.substring((OPT_PREFIX + option).length);
    }
}

module.exports = {
    formatPara: formatPara,
    formatOption: formatOption
};