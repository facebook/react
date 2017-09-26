/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule ReactDOM
 */

/* globals __REACT_DEVTOOLS_GLOBAL_HOOK__*/

'use strict';

var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactDefaultInjection = require('ReactDefaultInjection');
var ReactMount = require('ReactMount');
var ReactReconciler = require('ReactReconciler');
var ReactUpdates = require('ReactUpdates');
var ReactVersion = require('ReactVersion');

var findDOMNode = require('findDOMNode');
var getHostComponentFromComposite = require('getHostComponentFromComposite');
var renderSubtreeIntoContainer = require('renderSubtreeIntoContainer');
var warning = require('warning');

ReactDefaultInjection.inject();

var ReactDOM = {
  findDOMNode: findDOMNode,
  render: ReactMount.render,
  unmountComponentAtNode: ReactMount.unmountComponentAtNode,
  version: ReactVersion,

  /* eslint-disable camelcase */
  unstable_batchedUpdates: ReactUpdates.batchedUpdates,
  unstable_renderSubtreeIntoContainer: renderSubtreeIntoContainer,
  /* eslint-enable camelcase */
};

// Inject the runtime into a devtools global hook regardless of browser.
// Allows for debugging when the hook is injected on the page.
if (
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' &&
  typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.inject === 'function'
) {
  __REACT_DEVTOOLS_GLOBAL_HOOK__.inject({
    ComponentTree: {
      getClosestInstanceFromNode:
        ReactDOMComponentTree.getClosestInstanceFromNode,
      getNodeFromInstance: function(inst) {
        // inst is an internal instance (but could be a composite)
        if (inst._renderedComponent) {
          inst = getHostComponentFromComposite(inst);
        }
        if (inst) {
          return ReactDOMComponentTree.getNodeFromInstance(inst);
        } else {
          return null;
        }
      },
    },
    Mount: ReactMount,
    Reconciler: ReactReconciler,
  });
}

if (__DEV__) {
  var ExecutionEnvironment = require('ExecutionEnvironment');
  if (ExecutionEnvironment.canUseDOM && window.top === window.self) {
    // First check if devtools is not installed
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === 'undefined') {
      // If we're in Chrome or Firefox, provide a download link if not installed.
      if (
        (navigator.userAgent.indexOf('Chrome') > -1 &&
          navigator.userAgent.indexOf('Edge') === -1) ||
        navigator.userAgent.indexOf('Firefox') > -1
      ) {
        // Firefox does not have the issue with devtools loaded over file://
        var showFileUrlMessage =
          window.location.protocol.indexOf('http') === -1 &&
          navigator.userAgent.indexOf('Firefox') === -1;
        console.debug(
          'Download the React DevTools ' +
            (showFileUrlMessage
              ? 'and use an HTTP server (instead of a file: URL) '
              : '') +
            'for a better development experience: ' +
            'https://fb.me/react-devtools',
        );
      }
    }

    var testFunc = function testFn() {};
    warning(
      (testFunc.name || testFunc.toString()).indexOf('testFn') !== -1,
      "It looks like you're using a minified copy of the development build " +
        'of React. When deploying React apps to production, make sure to use ' +
        'the production build which skips development warnings and is faster. ' +
        'See https://fb.me/react-minification for more details.',
    );

    // If we're in IE8, check to see if we are in compatibility mode and provide
    // information on preventing compatibility mode
    var ieCompatibilityMode =
      document.documentMode && document.documentMode < 8;

    warning(
      !ieCompatibilityMode,
      'Internet Explorer is running in compatibility mode; please add the ' +
        'following tag to your HTML to prevent this from happening: ' +
        '<meta http-equiv="X-UA-Compatible" content="IE=edge" />',
    );

    var expectedFeatures = [
      // shims
      Array.isArray,
      Array.prototype.every,
      Array.prototype.forEach,
      Array.prototype.indexOf,
      Array.prototype.map,
      Date.now,
      Function.prototype.bind,
      Object.keys,
      String.prototype.trim,
    ];

    for (var i = 0; i < expectedFeatures.length; i++) {
      if (!expectedFeatures[i]) {
        warning(
          false,
          'One or more ES5 shims expected by React are not available: ' +
            'https://fb.me/react-warning-polyfills',
        );
        break;
      }
    }
  }
}

if (__DEV__) {
  var ReactInstrumentation = require('ReactInstrumentation');
  var ReactDOMUnknownPropertyHook = require('ReactDOMUnknownPropertyHook');
  var ReactDOMNullInputValuePropHook = require('ReactDOMNullInputValuePropHook');
  var ReactDOMInvalidARIAHook = require('ReactDOMInvalidARIAHook');

  ReactInstrumentation.debugTool.addHook(ReactDOMUnknownPropertyHook);
  ReactInstrumentation.debugTool.addHook(ReactDOMNullInputValuePropHook);
  ReactInstrumentation.debugTool.addHook(ReactDOMInvalidARIAHook);
}

module.exports = ReactDOM;
