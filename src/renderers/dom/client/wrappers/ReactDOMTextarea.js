/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMTextarea
 */

'use strict';

var DOMPropertyOperations = require('DOMPropertyOperations');
var LinkedValueUtils = require('LinkedValueUtils');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactUpdates = require('ReactUpdates');

var invariant = require('invariant');
var warning = require('warning');

var didWarnValueLink = false;
var didWarnValueNull = false;
var didWarnValDefaultVal = false;

function forceUpdateIfMounted() {
  if (this._rootNodeID) {
    // DOM component is still mounted; update
    ReactDOMTextarea.updateWrapper(this);
  }
}

function warnIfValueIsNull(props) {
  if (props != null && props.value === null && !didWarnValueNull) {
    warning(
      false,
      '`value` prop on `textarea` should not be null. ' +
      'Consider using the empty string to clear the component or `undefined` ' +
      'for uncontrolled components.'
    );

    didWarnValueNull = true;
  }
}

/**
 * Implements a <textarea> native component that allows setting `value`, and
 * `defaultValue`. This differs from the traditional DOM API because value is
 * usually set as PCDATA children.
 *
 * If `value` is not supplied (or null/undefined), user actions that affect the
 * value will trigger updates to the element.
 *
 * If `value` is supplied (and not null/undefined), the rendered element will
 * not trigger updates to the element. Instead, the `value` prop must change in
 * order for the rendered element to be updated.
 *
 * The rendered element will be initialized with an empty value, the prop
 * `defaultValue` if specified, or the children content (deprecated).
 */
var ReactDOMTextarea = {
  getNativeProps: function(inst, props) {
    invariant(
      props.dangerouslySetInnerHTML == null,
      '`dangerouslySetInnerHTML` does not make sense on <textarea>.'
    );

    // Always set children to the same thing. In IE9, the selection range will
    // get reset if `textContent` is mutated.
    var nativeProps = Object.assign({}, props, {
      defaultValue: undefined,
      value: undefined,
      children: inst._wrapperState.initialValue,
      onChange: inst._wrapperState.onChange,
    });

    return nativeProps;
  },

  mountWrapper: function(inst, props) {
    if (__DEV__) {
      LinkedValueUtils.checkPropTypes(
        'textarea',
        props,
        inst._currentElement._owner
      );
      if (props.valueLink !== undefined && !didWarnValueLink) {
        warning(
          false,
          '`valueLink` prop on `textarea` is deprecated; set `value` and `onChange` instead.'
        );
        didWarnValueLink = true;
      }
      if (
        props.value !== undefined &&
        props.defaultValue !== undefined &&
        !didWarnValDefaultVal
      ) {
        warning(
          false,
          'Textarea elements must be either controlled or uncontrolled ' +
          '(specify either the value prop, or the defaultValue prop, but not ' +
          'both). Decide between using a controlled or uncontrolled textarea ' +
          'and remove one of these props. More info: ' +
          'https://fb.me/react-controlled-components'
        );
        didWarnValDefaultVal = true;
      }
      warnIfValueIsNull(props);
    }

    var defaultValue = props.defaultValue;
    // TODO (yungsters): Remove support for children content in <textarea>.
    var children = props.children;
    if (children != null) {
      if (__DEV__) {
        warning(
          false,
          'Use the `defaultValue` or `value` props instead of setting ' +
          'children on <textarea>.'
        );
      }
      invariant(
        defaultValue == null,
        'If you supply `defaultValue` on a <textarea>, do not pass children.'
      );
      if (Array.isArray(children)) {
        invariant(
          children.length <= 1,
          '<textarea> can only have at most one child.'
        );
        children = children[0];
      }

      defaultValue = '' + children;
    }
    if (defaultValue == null) {
      defaultValue = '';
    }
    var value = LinkedValueUtils.getValue(props);
    inst._wrapperState = {
      // We save the initial value so that `ReactDOMComponent` doesn't update
      // `textContent` (unnecessary since we update value).
      // The initial value can be a boolean or object so that's why it's
      // forced to be a string.
      initialValue: '' + (value != null ? value : defaultValue),
      listeners: null,
      onChange: _handleChange.bind(inst),
    };
  },

  updateWrapper: function(inst) {
    var props = inst._currentElement.props;

    if (__DEV__) {
      warnIfValueIsNull(props);
    }

    var value = LinkedValueUtils.getValue(props);
    if (value != null) {
      // Cast `value` to a string to ensure the value is set correctly. While
      // browsers typically do this as necessary, jsdom doesn't.
      DOMPropertyOperations.setValueForProperty(
        ReactDOMComponentTree.getNodeFromInstance(inst),
        'value',
        '' + value
      );
    }
  },
};

function _handleChange(event) {
  var props = this._currentElement.props;
  var returnValue = LinkedValueUtils.executeOnChange(props, event);
  ReactUpdates.asap(forceUpdateIfMounted, this);
  return returnValue;
}

module.exports = ReactDOMTextarea;
