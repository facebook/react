/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// TODO: direct imports like some-package/src/* are bad. Fix me.
import ReactDebugCurrentFiber from 'react-reconciler/src/ReactDebugCurrentFiber';
import warning from 'shared/warning';

import ReactControlledValuePropTypes from '../shared/ReactControlledValuePropTypes';

const {
  getCurrentFiberOwnerName,
  getCurrentFiberStackAddendum,
} = ReactDebugCurrentFiber;

let didWarnValueDefaultValue;

if (__DEV__) {
  didWarnValueDefaultValue = false;
}

type SelectWithWrapperState = HTMLSelectElement & {
  _wrapperState: {
    initialValue: ?string,
    wasMultiple: boolean,
  },
};

function getDeclarationErrorAddendum() {
  const ownerName = getCurrentFiberOwnerName();
  if (ownerName) {
    return '\n\nCheck the render method of `' + ownerName + '`.';
  }
  return '';
}

const valuePropNames = ['value', 'defaultValue'];

/**
 * Validation function for `value` and `defaultValue`.
 */
function checkSelectPropTypes(props) {
  ReactControlledValuePropTypes.checkPropTypes(
    'select',
    props,
    getCurrentFiberStackAddendum,
  );

  for (let i = 0; i < valuePropNames.length; i++) {
    const propName = valuePropNames[i];
    if (props[propName] == null) {
      continue;
    }
    const isArray = Array.isArray(props[propName]);
    if (props.multiple && !isArray) {
      warning(
        false,
        'The `%s` prop supplied to <select> must be an array if ' +
          '`multiple` is true.%s',
        propName,
        getDeclarationErrorAddendum(),
      );
    } else if (!props.multiple && isArray) {
      warning(
        false,
        'The `%s` prop supplied to <select> must be a scalar ' +
          'value if `multiple` is false.%s',
        propName,
        getDeclarationErrorAddendum(),
      );
    }
  }
}

function updateOptions(
  node: HTMLSelectElement,
  multiple: boolean,
  propValue: any,
  setDefaultSelected: boolean,
) {
  type IndexableHTMLOptionsCollection = HTMLOptionsCollection & {
    [key: number]: HTMLOptionElement,
  };
  const options: IndexableHTMLOptionsCollection = node.options;

  if (multiple) {
    let selectedValues = (propValue: Array<string>);
    let selectedValue = {};
    for (let i = 0; i < selectedValues.length; i++) {
      // Prefix to avoid chaos with special keys.
      selectedValue['$' + selectedValues[i]] = true;
    }
    for (let i = 0; i < options.length; i++) {
      const selected = selectedValue.hasOwnProperty('$' + options[i].value);
      if (options[i].selected !== selected) {
        options[i].selected = selected;
      }
      if (selected && setDefaultSelected) {
        options[i].defaultSelected = true;
      }
    }
  } else {
    // Do not set `select.value` as exact behavior isn't consistent across all
    // browsers for all cases.
    let selectedValue = '' + (propValue: string);
    let defaultSelected = null;
    for (let i = 0; i < options.length; i++) {
      if (options[i].value === selectedValue) {
        options[i].selected = true;
        if (setDefaultSelected) {
          options[i].defaultSelected = true;
        }
        return;
      }
      if (defaultSelected === null && !options[i].disabled) {
        defaultSelected = options[i];
      }
    }
    if (defaultSelected !== null) {
      defaultSelected.selected = true;
    }
  }
}

/**
 * Implements a <select> host component that allows optionally setting the
 * props `value` and `defaultValue`. If `multiple` is false, the prop must be a
 * stringable. If `multiple` is true, the prop must be an array of stringables.
 *
 * If `value` is not supplied (or null/undefined), user actions that change the
 * selected option will trigger updates to the rendered options.
 *
 * If it is supplied (and not null/undefined), the rendered options will not
 * update in response to user actions. Instead, the `value` prop must change in
 * order for the rendered options to update.
 *
 * If `defaultValue` is provided, any options with the supplied values will be
 * selected.
 */

export function getHostProps(element: Element, props: Object) {
  return Object.assign({}, props, {
    value: undefined,
  });
}

export function initWrapperState(element: Element, props: Object) {
  const node = ((element: any): SelectWithWrapperState);
  if (__DEV__) {
    checkSelectPropTypes(props);
  }

  const value = props.value;
  node._wrapperState = {
    initialValue: value != null ? value : props.defaultValue,
    wasMultiple: !!props.multiple,
  };

  if (__DEV__) {
    if (
      props.value !== undefined &&
      props.defaultValue !== undefined &&
      !didWarnValueDefaultValue
    ) {
      warning(
        false,
        'Select elements must be either controlled or uncontrolled ' +
          '(specify either the value prop, or the defaultValue prop, but not ' +
          'both). Decide between using a controlled or uncontrolled select ' +
          'element and remove one of these props. More info: ' +
          'https://fb.me/react-controlled-components',
      );
      didWarnValueDefaultValue = true;
    }
  }
}

export function postMountWrapper(element: Element, props: Object) {
  const node = ((element: any): SelectWithWrapperState);
  node.multiple = !!props.multiple;
  const value = props.value;
  if (value != null) {
    updateOptions(node, !!props.multiple, value, false);
  } else if (props.defaultValue != null) {
    updateOptions(node, !!props.multiple, props.defaultValue, true);
  }
}

export function postUpdateWrapper(element: Element, props: Object) {
  const node = ((element: any): SelectWithWrapperState);
  // After the initial mount, we control selected-ness manually so don't pass
  // this value down
  node._wrapperState.initialValue = undefined;

  const wasMultiple = node._wrapperState.wasMultiple;
  node._wrapperState.wasMultiple = !!props.multiple;

  const value = props.value;
  if (value != null) {
    updateOptions(node, !!props.multiple, value, false);
  } else if (wasMultiple !== !!props.multiple) {
    // For simplicity, reapply `defaultValue` if `multiple` is toggled.
    if (props.defaultValue != null) {
      updateOptions(node, !!props.multiple, props.defaultValue, true);
    } else {
      // Revert the select back to its default unselected state.
      updateOptions(node, !!props.multiple, props.multiple ? [] : '', false);
    }
  }
}

export function restoreControlledState(element: Element, props: Object) {
  const node = ((element: any): SelectWithWrapperState);
  const value = props.value;

  if (value != null) {
    updateOptions(node, !!props.multiple, value, false);
  }
}
