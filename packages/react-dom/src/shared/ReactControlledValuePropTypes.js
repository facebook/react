/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import checkPropTypes from 'prop-types/checkPropTypes';
import ReactSharedInternals from 'shared/ReactSharedInternals';

let ReactDebugCurrentFrame = null;

const ReactControlledValuePropTypes = {
  checkPropTypes: null,
};

if (__DEV__) {
  ReactDebugCurrentFrame = ReactSharedInternals.ReactDebugCurrentFrame;

  const hasReadOnlyValue = {
    button: true,
    checkbox: true,
    image: true,
    hidden: true,
    radio: true,
    reset: true,
    submit: true,
  };

  const propTypes = {
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
  ReactControlledValuePropTypes.checkPropTypes = function(tagName, props) {
    checkPropTypes(
      propTypes,
      props,
      'prop',
      tagName,
      ReactDebugCurrentFrame.getStackAddendum,
    );
  };
}

export default ReactControlledValuePropTypes;
