/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactDOMInput
 */

'use strict';

var DOMPropertyOperations = require('DOMPropertyOperations');
var LinkedValueUtils = require('LinkedValueUtils');
var ReactDOMComponentTree = require('ReactDOMComponentTree');
var ReactUpdates = require('ReactUpdates');

var invariant = require('invariant');
var warning = require('warning');

var didWarnValueLink = false;
var didWarnCheckedLink = false;
var didWarnValueNull = false;
var didWarnValueDefaultValue = false;
var didWarnCheckedDefaultChecked = false;
var didWarnControlledToUncontrolled = false;
var didWarnUncontrolledToControlled = false;

function forceUpdateIfMounted() {
  if (this._rootNodeID) {
    // DOM component is still mounted; update
    ReactDOMInput.updateWrapper(this);
  }
}

function warnIfValueIsNull(props) {
  if (props != null && props.value === null && !didWarnValueNull) {
    warning(
      false,
      '`value` prop on `input` should not be null. ' +
      'Consider using the empty string to clear the component or `undefined` ' +
      'for uncontrolled components.'
    );

    didWarnValueNull = true;
  }
}

/**
 * Implements an <input> native component that allows setting these optional
 * props: `checked`, `value`, `defaultChecked`, and `defaultValue`.
 *
 * If `checked` or `value` are not supplied (or null/undefined), user actions
 * that affect the checked state or value will trigger updates to the element.
 *
 * If they are supplied (and not null/undefined), the rendered element will not
 * trigger updates to the element. Instead, the props must change in order for
 * the rendered element to be updated.
 *
 * The rendered element will be initialized as unchecked (or `defaultChecked`)
 * with an empty value (or `defaultValue`).
 *
 * @see http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html
 */
var ReactDOMInput = {
  getNativeProps: function(inst, props) {
    var value = LinkedValueUtils.getValue(props);
    var checked = LinkedValueUtils.getChecked(props);

    var nativeProps = Object.assign({
      // Make sure we set .type before any other properties (setting .value
      // before .type means .value is lost in IE11 and below)
      type: undefined,
    }, props, {
      defaultChecked: undefined,
      defaultValue: undefined,
      value: value != null ? value : inst._wrapperState.initialValue,
      checked: checked != null ? checked : inst._wrapperState.initialChecked,
      onChange: inst._wrapperState.onChange,
    });

    return nativeProps;
  },

  mountWrapper: function(inst, props) {
    if (__DEV__) {
      LinkedValueUtils.checkPropTypes(
        'input',
        props,
        inst._currentElement._owner
      );

      var owner = inst._currentElement._owner;

      if (props.valueLink !== undefined && !didWarnValueLink) {
        warning(
          false,
          '`valueLink` prop on `input` is deprecated; set `value` and `onChange` instead.'
        );
        didWarnValueLink = true;
      }
      if (props.checkedLink !== undefined && !didWarnCheckedLink) {
        warning(
          false,
          '`checkedLink` prop on `input` is deprecated; set `value` and `onChange` instead.'
        );
        didWarnCheckedLink = true;
      }
      if (
        props.checked !== undefined &&
        props.defaultChecked !== undefined &&
        !didWarnCheckedDefaultChecked
      ) {
        warning(
          false,
          '%s contains an input of type %s with both checked and defaultChecked props. ' +
          'Input elements must be either controlled or uncontrolled ' +
          '(specify either the checked prop, or the defaultChecked prop, but not ' +
          'both). Decide between using a controlled or uncontrolled input ' +
          'element and remove one of these props. More info: ' +
          'https://fb.me/react-controlled-components',
          owner && owner.getName() || 'A component',
          props.type
        );
        didWarnCheckedDefaultChecked = true;
      }
      if (
        props.value !== undefined &&
        props.defaultValue !== undefined &&
        !didWarnValueDefaultValue
      ) {
        warning(
          false,
          '%s contains an input of type %s with both value and defaultValue props. ' +
          'Input elements must be either controlled or uncontrolled ' +
          '(specify either the value prop, or the defaultValue prop, but not ' +
          'both). Decide between using a controlled or uncontrolled input ' +
          'element and remove one of these props. More info: ' +
          'https://fb.me/react-controlled-components',
          owner && owner.getName() || 'A component',
          props.type
        );
        didWarnValueDefaultValue = true;
      }
      warnIfValueIsNull(props);
    }

    var defaultValue = props.defaultValue;
    inst._wrapperState = {
      initialChecked: props.defaultChecked || false,
      initialValue: defaultValue != null ? defaultValue : null,
      listeners: null,
      onChange: _handleChange.bind(inst),
    };

    if (__DEV__) {
      inst._wrapperState.controlled = props.checked !== undefined || props.value !== undefined;
    }
  },

  updateWrapper: function(inst) {
    var props = inst._currentElement.props;

    if (__DEV__) {
      warnIfValueIsNull(props);

      var initialValue = inst._wrapperState.initialChecked || inst._wrapperState.initialValue;
      var defaultValue = props.defaultChecked || props.defaultValue;
      var controlled = props.checked !== undefined || props.value !== undefined;
      var owner = inst._currentElement._owner;

      if (
        (initialValue || !inst._wrapperState.controlled) &&
        controlled && !didWarnUncontrolledToControlled
      ) {
        warning(
          false,
          '%s is changing a uncontrolled input of type %s to be controlled. ' +
          'Input elements should not switch from uncontrolled to controlled (or vice versa). ' +
          'Decide between using a controlled or uncontrolled input ' +
          'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
          owner && owner.getName() || 'A component',
          props.type
        );
        didWarnUncontrolledToControlled = true;
      }
      if (
        inst._wrapperState.controlled &&
        (defaultValue || !controlled) &&
        !didWarnControlledToUncontrolled
      ) {
        warning(
          false,
          '%s is changing a controlled input of type %s to be uncontrolled. ' +
          'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
          'Decide between using a controlled or uncontrolled input ' +
          'element for the lifetime of the component. More info: https://fb.me/react-controlled-components',
          owner && owner.getName() || 'A component',
          props.type
        );
        didWarnControlledToUncontrolled = true;
      }
    }

    // TODO: Shouldn't this be getChecked(props)?
    var checked = props.checked;
    if (checked != null) {
      DOMPropertyOperations.setValueForProperty(
        ReactDOMComponentTree.getNodeFromInstance(inst),
        'checked',
        checked || false
      );
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

  // Here we use asap to wait until all updates have propagated, which
  // is important when using controlled components within layers:
  // https://github.com/facebook/react/issues/1698
  ReactUpdates.asap(forceUpdateIfMounted, this);

  var name = props.name;
  if (props.type === 'radio' && name != null) {
    var rootNode = ReactDOMComponentTree.getNodeFromInstance(this);
    var queryRoot = rootNode;

    while (queryRoot.parentNode) {
      queryRoot = queryRoot.parentNode;
    }

    // If `rootNode.form` was non-null, then we could try `form.elements`,
    // but that sometimes behaves strangely in IE8. We could also try using
    // `form.getElementsByName`, but that will only return direct children
    // and won't include inputs that use the HTML5 `form=` attribute. Since
    // the input might not even be in a form, let's just use the global
    // `querySelectorAll` to ensure we don't miss anything.
    var group = queryRoot.querySelectorAll(
      'input[name=' + JSON.stringify('' + name) + '][type="radio"]');

    for (var i = 0; i < group.length; i++) {
      var otherNode = group[i];
      if (otherNode === rootNode ||
          otherNode.form !== rootNode.form) {
        continue;
      }
      // This will throw if radio buttons rendered by different copies of React
      // and the same name are rendered into the same form (same as #1939).
      // That's probably okay; we don't support it just as we don't support
      // mixing React radio buttons with non-React ones.
      var otherInstance = ReactDOMComponentTree.getInstanceFromNode(otherNode);
      invariant(
        otherInstance,
        'ReactDOMInput: Mixing React and non-React radio inputs with the ' +
        'same `name` is not supported.'
      );
      // If this is a controlled radio button group, forcing the input that
      // was previously checked to update will cause it to be come re-checked
      // as appropriate.
      ReactUpdates.asap(forceUpdateIfMounted, otherInstance);
    }
  }

  return returnValue;
}

module.exports = ReactDOMInput;
