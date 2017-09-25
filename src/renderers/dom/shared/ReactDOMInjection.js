/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMInjection
 */

'use strict';

var DOMProperty = require('DOMProperty');
var HTMLDOMPropertyConfig = require('HTMLDOMPropertyConfig');
var SVGDOMPropertyConfig = require('SVGDOMPropertyConfig');

DOMProperty.injection.injectDOMPropertyConfig(HTMLDOMPropertyConfig);
DOMProperty.injection.injectDOMPropertyConfig(SVGDOMPropertyConfig);
