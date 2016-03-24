/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NativeMethodsMixin
 * @flow
 */
'use strict';

var ReactNativeAttributePayload = require('ReactNativeAttributePayload');
var TextInputState = require('TextInputState');
var UIManager = require('UIManager');

var findNodeHandle = require('findNodeHandle');
var invariant = require('fbjs/lib/invariant');

type MeasureOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number
) => void

type MeasureInWindowOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void

type MeasureLayoutOnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number
) => void

function warnForStyleProps(props, validAttributes) {
  for (var key in validAttributes.style) {
    if (!(validAttributes[key] || props[key] === undefined)) {
      console.error(
        'You are setting the style `{ ' + key + ': ... }` as a prop. You ' +
        'should nest it in a style object. ' +
        'E.g. `{ style: { ' + key + ': ... } }`'
      );
    }
  }
}

/**
 * `NativeMethodsMixin` provides methods to access the underlying native
 * component directly. This can be useful in cases when you want to focus
 * a view or measure its on-screen dimensions, for example.
 *
 * The methods described here are available on most of the default components
 * provided by React Native. Note, however, that they are *not* available on
 * composite components that aren't directly backed by a native view. This will
 * generally include most components that you define in your own app. For more
 * information, see [Direct
 * Manipulation](docs/direct-manipulation.html).
 */
var NativeMethodsMixin = {
  /**
   * Determines the location on screen, width, and height of the given view and
   * returns the values via an async callback. If successful, the callback will
   * be called with the following arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   *  - pageX
   *  - pageY
   *
   * Note that these measurements are not available until after the rendering
   * has been completed in native. If you need the measurements as soon as
   * possible, consider using the [`onLayout`
   * prop](docs/view.html#onlayout) instead.
   */
  measure: function(callback: MeasureOnSuccessCallback) {
    UIManager.measure(
      findNodeHandle(this),
      mountSafeCallback(this, callback)
    );
  },

  /**
   * Determines the location of the given view in the window and returns the
   * values via an async callback. If the React root view is embedded in
   * another native view, this will give you the absolute coordinates. If
   * successful, the callback will be called with the following
   * arguments:
   *
   *  - x
   *  - y
   *  - width
   *  - height
   *
   * Note that these measurements are not available until after the rendering
   * has been completed in native.
   */
  measureInWindow: function(callback: MeasureInWindowOnSuccessCallback) {
    UIManager.measureInWindow(
      findNodeHandle(this),
      mountSafeCallback(this, callback)
    );
  },

  /**
   * Like [`measure()`](#measure), but measures the view relative an ancestor,
   * specified as `relativeToNativeNode`. This means that the returned x, y
   * are relative to the origin x, y of the ancestor view.
   *
   * As always, to obtain a native node handle for a component, you can use
   * `React.findNodeHandle(component)`.
   */
  measureLayout: function(
    relativeToNativeNode: number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail: () => void /* currently unused */
  ) {
    UIManager.measureLayout(
      findNodeHandle(this),
      relativeToNativeNode,
      mountSafeCallback(this, onFail),
      mountSafeCallback(this, onSuccess)
    );
  },

  /**
   * This function sends props straight to native. They will not participate in
   * future diff process - this means that if you do not include them in the
   * next render, they will remain active (see [Direct
   * Manipulation](docs/direct-manipulation.html)).
   */
  setNativeProps: function(nativeProps: Object) {
    if (__DEV__) {
      warnForStyleProps(nativeProps, this.viewConfig.validAttributes);
    }

    var updatePayload = ReactNativeAttributePayload.create(
      nativeProps,
      this.viewConfig.validAttributes
    );

    UIManager.updateView(
      findNodeHandle(this),
      this.viewConfig.uiViewClassName,
      updatePayload
    );
  },

  /**
   * Requests focus for the given input or view. The exact behavior triggered
   * will depend on the platform and type of view.
   */
  focus: function() {
    TextInputState.focusTextInput(findNodeHandle(this));
  },

  /**
   * Removes focus from an input or view. This is the opposite of `focus()`.
   */
  blur: function() {
    TextInputState.blurTextInput(findNodeHandle(this));
  }
};

function throwOnStylesProp(component, props) {
  if (props.styles !== undefined) {
    var owner = component._owner || null;
    var name = component.constructor.displayName;
    var msg = '`styles` is not a supported property of `' + name + '`, did ' +
      'you mean `style` (singular)?';
    if (owner && owner.constructor && owner.constructor.displayName) {
      msg += '\n\nCheck the `' + owner.constructor.displayName + '` parent ' +
        ' component.';
    }
    throw new Error(msg);
  }
}
if (__DEV__) {
  // hide this from Flow since we can't define these properties outside of
  // __DEV__ without actually implementing them (setting them to undefined
  // isn't allowed by ReactClass)
  var NativeMethodsMixin_DEV = (NativeMethodsMixin: any);
  invariant(
    !NativeMethodsMixin_DEV.componentWillMount &&
    !NativeMethodsMixin_DEV.componentWillReceiveProps,
    'Do not override existing functions.'
  );
  NativeMethodsMixin_DEV.componentWillMount = function () {
    throwOnStylesProp(this, this.props);
  };
  NativeMethodsMixin_DEV.componentWillReceiveProps = function (newProps) {
    throwOnStylesProp(this, newProps);
  };
}

/**
 * In the future, we should cleanup callbacks by cancelling them instead of
 * using this.
 */
var mountSafeCallback = function(context: ReactComponent, callback: ?Function): any {
  return function() {
    if (!callback || (context.isMounted && !context.isMounted())) {
      return;
    }
    return callback.apply(context, arguments);
  };
};

module.exports = NativeMethodsMixin;
