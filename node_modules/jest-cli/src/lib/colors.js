/**
 * Copyright (c) 2014, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var BOLD = '\x1B[1m';
var GRAY = '\x1B[90m';
var GREEN = '\x1B[32m';
var GREEN_BG = '\x1B[42m';
var MAGENTA_BG = '\x1B[45m';
var RED = '\x1B[31m';
var RED_BG = '\x1B[41m';
var RESET = '\x1B[0m';
var UNDERLINE = '\x1B[4m';
var YELLOW = '\x1B[33m';

function colorize(str, color) {
  return color + str.toString().split(RESET).join(RESET + color) + RESET;
}

exports.BOLD = BOLD;
exports.GRAY = GRAY;
exports.GREEN = GREEN;
exports.GREEN_BG = GREEN_BG;
exports.MAGENTA_BG = MAGENTA_BG;
exports.RED = RED;
exports.RED_BG = RED_BG;
exports.RESET = RESET;
exports.UNDERLINE = UNDERLINE;
exports.YELLOW = YELLOW;

exports.colorize = colorize;
