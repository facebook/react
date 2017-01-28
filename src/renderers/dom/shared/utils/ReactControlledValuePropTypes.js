/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactControlledValuePropTypes
 */

'use strict';

var React = require('React');

var warning = require('warning');

var hasReadOnlyValue = {
  'button': true,
  'checkbox': true,
  'image': true,
  'hidden': true,
  'radio': true,
  'reset': true,
  'submit': true,
};

var propTypes = {
  value: function(props, propName, componentName) {
    if (!props[propName] ||
        hasReadOnlyValue[props.type] ||
        props.onChange ||
        props.readOnly ||
        props.disabled) {
      return null;
    }
    return new Error(
      'You provided a `value` prop to a form field without an ' +
      '`onChange` handler. This will render a read-only field. If ' +
      'the field should be mutable use `defaultValue`. Otherwise, ' +
      'set either `onChange` or `readOnly`.'
    );
  },
  checked: function(props, propName, componentName) {
    if (!props[propName] ||
        props.onChange ||
        props.readOnly ||
        props.disabled) {
      return null;
    }
    return new Error(
      'You provided a `checked` prop to a form field without an ' +
      '`onChange` handler. This will render a read-only field. If ' +
      'the field should be mutable use `defaultChecked`. Otherwise, ' +
      'set either `onChange` or `readOnly`.'
    );
  },
  onChange: React.PropTypes.func,
};

var loggedTypeFailures = {};
function getDeclarationErrorAddendum(ownerName) {
  if (ownerName) {
    return '\n\nCheck the render method of `' + ownerName + '`.';
  }
  return '';
}

/**
 * Provide a linked `value` attribute for controlled forms. You should not use
 * this outside of the ReactDOM controlled form components.
 */
var ReactControlledValuePropTypes = {
  checkPropTypes: function(tagName, props, ownerName) {
    for (var propName in propTypes) {
      if (propTypes.hasOwnProperty(propName)) {
        var error = propTypes[propName](
          props,
          propName,
          tagName,
          'prop',
        );
      }
      if (error instanceof Error && !(error.message in loggedTypeFailures)) {
        // Only monitor this failure once because there tends to be a lot of the
        // same error.
        loggedTypeFailures[error.message] = true;

        var addendum = getDeclarationErrorAddendum(ownerName);
        warning(false, 'Failed form propType: %s%s', error.message, addendum);
      }
    }
  },
};

module.exports = ReactControlledValuePropTypes;
