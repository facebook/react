/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactDOMServerStackEntry
 */

'use strict';

var ReactServerRendering = require('ReactServerRendering');
var ReactVersion = require('ReactVersion');

require('ReactDOMInjection');
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
  var ReactDOMInvalidARIAHook = require('ReactDOMInvalidARIAHook');

  ReactInstrumentation.debugTool.addHook(ReactDOMUnknownPropertyHook);
  ReactInstrumentation.debugTool.addHook(ReactDOMNullInputValuePropHook);
  ReactInstrumentation.debugTool.addHook(ReactDOMInvalidARIAHook);
}

module.exports = ReactDOMServerStack;
