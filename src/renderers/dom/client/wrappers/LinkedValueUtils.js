/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule LinkedValueUtils
 */

'use strict';

var ReactPropTypesSecret = require('ReactPropTypesSecret');
var propTypesFactory = require('prop-types/factory');

var React = require('React');
var PropTypes = propTypesFactory(React.isValidElement);

var invariant = require('invariant');
var warning = require('warning');

var hasReadOnlyValue = {
  button: true,
  checkbox: true,
  image: true,
  hidden: true,
  radio: true,
  reset: true,
  submit: true,
};

function _assertSingleLink(inputProps) {
  invariant(
    inputProps.checkedLink == null || inputProps.valueLink == null,
    'Cannot provide a checkedLink and a valueLink. If you want to use ' +
      "checkedLink, you probably don't want to use valueLink and vice versa.",
  );
}
function _assertValueLink(inputProps) {
  _assertSingleLink(inputProps);
  invariant(
    inputProps.value == null && inputProps.onChange == null,
    'Cannot provide a valueLink and a value or onChange event. If you want ' +
      "to use value or onChange, you probably don't want to use valueLink.",
  );
}

function _assertCheckedLink(inputProps) {
  _assertSingleLink(inputProps);
  invariant(
    inputProps.checked == null && inputProps.onChange == null,
    'Cannot provide a checkedLink and a checked property or onChange event. ' +
      "If you want to use checked or onChange, you probably don't want to " +
      'use checkedLink',
  );
}

var propTypes = {
  value: function(props, propName, componentName) {
    if (
      !props[propName] ||
      hasReadOnlyValue[props.type] ||
      props.onChange ||
      props.readOnly ||
      props.disabled
    ) {
      return null;
    }
    return new Error(
      'You provided a `value` prop to a form field without an ' +
        '`onChange` handler. This will render a read-only field. If ' +
        'the field should be mutable use `defaultValue`. Otherwise, ' +
        'set either `onChange` or `readOnly`.',
    );
  },
  checked: function(props, propName, componentName) {
    if (
      !props[propName] ||
      props.onChange ||
      props.readOnly ||
      props.disabled
    ) {
      return null;
    }
    return new Error(
      'You provided a `checked` prop to a form field without an ' +
        '`onChange` handler. This will render a read-only field. If ' +
        'the field should be mutable use `defaultChecked`. Otherwise, ' +
        'set either `onChange` or `readOnly`.',
    );
  },
  onChange: PropTypes.func,
};

var loggedTypeFailures = {};
function getDeclarationErrorAddendum(owner) {
  if (owner) {
    var name = owner.getName();
    if (name) {
      return ' Check the render method of `' + name + '`.';
    }
  }
  return '';
}

/**
 * Provide a linked `value` attribute for controlled forms. You should not use
 * this outside of the ReactDOM controlled form components.
 */
var LinkedValueUtils = {
  checkPropTypes: function(tagName, props, owner) {
    for (var propName in propTypes) {
      if (propTypes.hasOwnProperty(propName)) {
        var error = propTypes[propName](
          props,
          propName,
          tagName,
          'prop',
          null,
          ReactPropTypesSecret,
        );
      }
      if (error instanceof Error && !(error.message in loggedTypeFailures)) {
        // Only monitor this failure once because there tends to be a lot of the
        // same error.
        loggedTypeFailures[error.message] = true;

        var addendum = getDeclarationErrorAddendum(owner);
        warning(false, 'Failed form propType: %s%s', error.message, addendum);
      }
    }
  },

  /**
   * @param {object} inputProps Props for form component
   * @return {*} current value of the input either from value prop or link.
   */
  getValue: function(inputProps) {
    if (inputProps.valueLink) {
      _assertValueLink(inputProps);
      return inputProps.valueLink.value;
    }
    return inputProps.value;
  },

  /**
   * @param {object} inputProps Props for form component
   * @return {*} current checked status of the input either from checked prop
   *             or link.
   */
  getChecked: function(inputProps) {
    if (inputProps.checkedLink) {
      _assertCheckedLink(inputProps);
      return inputProps.checkedLink.value;
    }
    return inputProps.checked;
  },

  /**
   * @param {object} inputProps Props for form component
   * @param {SyntheticEvent} event change event to handle
   */
  executeOnChange: function(inputProps, event) {
    if (inputProps.valueLink) {
      _assertValueLink(inputProps);
      return inputProps.valueLink.requestChange(event.target.value);
    } else if (inputProps.checkedLink) {
      _assertCheckedLink(inputProps);
      return inputProps.checkedLink.requestChange(event.target.checked);
    } else if (inputProps.onChange) {
      return inputProps.onChange.call(undefined, event);
    }
  },
};

module.exports = LinkedValueUtils;
