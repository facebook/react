/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMServerStackEntry
 */

'use strict';

var ReactServerRendering = require('ReactServerRendering');
var ReactVersion = require('ReactVersion');

require('ReactDOMStackInjection');

var ReactDOMServerStack = {
  renderToString: ReactServerRendering.renderToString,
  renderToStaticMarkup: ReactServerRendering.renderToStaticMarkup,
  version: ReactVersion,
};

if (__DEV__) {
  var ReactInstrumentation = require('ReactInstrumentation');
  var ReactDOMUnknownPropertyHook = require('ReactDOMUnknownPropertyHook');
  var ReactDOMNullInputValuePropHook = require('ReactDOMNullInputValuePropHook');

  ReactInstrumentation.debugTool.addHook(ReactDOMUnknownPropertyHook);
  ReactInstrumentation.debugTool.addHook(ReactDOMNullInputValuePropHook);
}

module.exports = ReactDOMServerStack;
