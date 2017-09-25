/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactPropTypes
 */

'use strict';

var {isValidElement} = require('ReactElement');
var factory = require('prop-types/factory');

module.exports = factory(isValidElement);
