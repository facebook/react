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
  var checkPropTypes = require('prop-types/checkPropTypes');

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
  };

  /**
   * Provide a linked `value` attribute for controlled forms. You should not use
   * this outside of the ReactDOM controlled form components.
   */
  ReactControlledValuePropTypes.checkPropTypes = function(
    tagName,
    props,
    getStack,
  ) {
    checkPropTypes(propTypes, props, 'prop', tagName, getStack);
  };
}

module.exports = ReactControlledValuePropTypes;
