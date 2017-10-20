/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var DOMProperty = require('./DOMProperty');
var HTMLDOMPropertyConfig = require('./HTMLDOMPropertyConfig');
var SVGDOMPropertyConfig = require('./SVGDOMPropertyConfig');

DOMProperty.injection.injectDOMPropertyConfig(HTMLDOMPropertyConfig);
DOMProperty.injection.injectDOMPropertyConfig(SVGDOMPropertyConfig);
