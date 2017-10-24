/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

var ReactControlledValuePropTypes = {
  checkPropTypes: null,
};

if (__DEV__) {
  var warning = require('fbjs/lib/warning');
  var emptyFunction = require('fbjs/lib/emptyFunction');
  var PropTypes = require('prop-types');
  var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

  ReactControlledValuePropTypes.checkPropTypes = emptyFunction;
  var hasReadOnlyValue = {
    button: true,
    checkbox: true,
    image: true,
    hidden: true,
    radio: true,
    reset: true,
    submit: true,
  };

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

  /**
   * Provide a linked `value` attribute for controlled forms. You should not use
   * this outside of the ReactDOM controlled form components.
   */
  ReactControlledValuePropTypes.checkPropTypes = function(
    tagName,
    props,
    getStack,
  ) {
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

        warning(false, 'Failed form propType: %s%s', error.message, getStack());
      }
    }
  };
}

module.exports = ReactControlledValuePropTypes;
