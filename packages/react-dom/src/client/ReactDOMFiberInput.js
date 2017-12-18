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
import invariant from 'fbjs/lib/invariant';
import warning from 'fbjs/lib/warning';

import * as DOMPropertyOperations from './DOMPropertyOperations';
import {getFiberCurrentPropsFromNode} from './ReactDOMComponentTree';
import ReactControlledValuePropTypes from '../shared/ReactControlledValuePropTypes';
import * as inputValueTracking from './inputValueTracking';

type InputWithWrapperState = HTMLInputElement & {
  _wrapperState: {
    initialValue: string,
    initialChecked: ?boolean,
    controlled?: boolean,
  },
};

const {
  getCurrentFiberOwnerName,
  getCurrentFiberStackAddendum,
} = ReactDebugCurrentFiber;
let didWarnValueDefaultValue = false;
let didWarnCheckedDefaultChecked = false;
let didWarnControlledToUncontrolled = false;
let didWarnUncontrolledToControlled = false;

function isControlled(props) {
  const usesChecked = props.type === 'checkbox' || props.type === 'radio';
  return usesChecked ? props.checked != null : props.value != null;
}

/**
 * Implements an <input> host component that allows setting these optional
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
 * See http://www.w3.org/TR/2012/WD-html5-20121025/the-input-element.html
 */

export function getHostProps(element: Element, props: Object) {
  const node = ((element: any): InputWithWrapperState);
  const checked = props.checked;

  const hostProps = Object.assign({}, props, {
    defaultChecked: undefined,
    defaultValue: undefined,
    value: undefined,
    checked: checked != null ? checked : node._wrapperState.initialChecked,
  });

  return hostProps;
}

export function initWrapperState(element: Element, props: Object) {
  if (__DEV__) {
    ReactControlledValuePropTypes.checkPropTypes(
      'input',
      props,
      getCurrentFiberStackAddendum,
    );

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
        getCurrentFiberOwnerName() || 'A component',
        props.type,
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
        getCurrentFiberOwnerName() || 'A component',
        props.type,
      );
      didWarnValueDefaultValue = true;
    }
  }

  const node = ((element: any): InputWithWrapperState);
  const defaultValue = props.defaultValue == null ? '' : props.defaultValue;

  node._wrapperState = {
    initialChecked:
      props.checked != null ? props.checked : props.defaultChecked,
    initialValue: getSafeValue(
      props.value != null ? props.value : defaultValue,
    ),
    controlled: isControlled(props),
  };
}

export function updateChecked(element: Element, props: Object) {
  const node = ((element: any): InputWithWrapperState);
  const checked = props.checked;
  if (checked != null) {
    DOMPropertyOperations.setValueForProperty(node, 'checked', checked, false);
  }
}

export function updateWrapper(element: Element, props: Object) {
  const node = ((element: any): InputWithWrapperState);
  if (__DEV__) {
    const controlled = isControlled(props);

    if (
      !node._wrapperState.controlled &&
      controlled &&
      !didWarnUncontrolledToControlled
    ) {
      warning(
        false,
        'A component is changing an uncontrolled input of type %s to be controlled. ' +
          'Input elements should not switch from uncontrolled to controlled (or vice versa). ' +
          'Decide between using a controlled or uncontrolled input ' +
          'element for the lifetime of the component. More info: https://fb.me/react-controlled-components%s',
        props.type,
        getCurrentFiberStackAddendum(),
      );
      didWarnUncontrolledToControlled = true;
    }
    if (
      node._wrapperState.controlled &&
      !controlled &&
      !didWarnControlledToUncontrolled
    ) {
      warning(
        false,
        'A component is changing a controlled input of type %s to be uncontrolled. ' +
          'Input elements should not switch from controlled to uncontrolled (or vice versa). ' +
          'Decide between using a controlled or uncontrolled input ' +
          'element for the lifetime of the component. More info: https://fb.me/react-controlled-components%s',
        props.type,
        getCurrentFiberStackAddendum(),
      );
      didWarnControlledToUncontrolled = true;
    }
  }

  updateChecked(element, props);

  const value = getSafeValue(props.value);

  if (value != null) {
    if (props.type === 'number') {
      if (
        (value === 0 && node.value === '') ||
        // eslint-disable-next-line
        node.value != value
      ) {
        node.value = '' + value;
      }
    } else if (node.value !== '' + value) {
      node.value = '' + value;
    }
  }

  if (props.hasOwnProperty('value')) {
    setDefaultValue(node, props.type, value);
  } else if (props.hasOwnProperty('defaultValue')) {
    setDefaultValue(node, props.type, getSafeValue(props.defaultValue));
  }

  if (props.checked == null && props.defaultChecked != null) {
    node.defaultChecked = !!props.defaultChecked;
  }
}

export function postMountWrapper(element: Element, props: Object) {
  const node = ((element: any): InputWithWrapperState);

  if (props.hasOwnProperty('value') || props.hasOwnProperty('defaultValue')) {
    // Do not assign value if it is already set. This prevents user text input
    // from being lost during SSR hydration.
    if (node.value === '') {
      node.value = '' + node._wrapperState.initialValue;
    }

    // value must be assigned before defaultValue. This fixes an issue where the
    // visually displayed value of date inputs disappears on mobile Safari and Chrome:
    // https://github.com/facebook/react/issues/7233
    node.defaultValue = '' + node._wrapperState.initialValue;
  }

  // Normally, we'd just do `node.checked = node.checked` upon initial mount, less this bug
  // this is needed to work around a chrome bug where setting defaultChecked
  // will sometimes influence the value of checked (even after detachment).
  // Reference: https://bugs.chromium.org/p/chromium/issues/detail?id=608416
  // We need to temporarily unset name to avoid disrupting radio button groups.
  const name = node.name;
  if (name !== '') {
    node.name = '';
  }
  node.defaultChecked = !node.defaultChecked;
  node.defaultChecked = !node.defaultChecked;
  if (name !== '') {
    node.name = name;
  }
}

export function restoreControlledState(element: Element, props: Object) {
  const node = ((element: any): InputWithWrapperState);
  updateWrapper(node, props);
  updateNamedCousins(node, props);
}

function updateNamedCousins(rootNode, props) {
  const name = props.name;
  if (props.type === 'radio' && name != null) {
    let queryRoot: Element = rootNode;

    while (queryRoot.parentNode) {
      queryRoot = ((queryRoot.parentNode: any): Element);
    }

    // If `rootNode.form` was non-null, then we could try `form.elements`,
    // but that sometimes behaves strangely in IE8. We could also try using
    // `form.getElementsByName`, but that will only return direct children
    // and won't include inputs that use the HTML5 `form=` attribute. Since
    // the input might not even be in a form. It might not even be in the
    // document. Let's just use the local `querySelectorAll` to ensure we don't
    // miss anything.
    const group = queryRoot.querySelectorAll(
      'input[name=' + JSON.stringify('' + name) + '][type="radio"]',
    );

    for (let i = 0; i < group.length; i++) {
      const otherNode = ((group[i]: any): HTMLInputElement);
      if (otherNode === rootNode || otherNode.form !== rootNode.form) {
        continue;
      }
      // This will throw if radio buttons rendered by different copies of React
      // and the same name are rendered into the same form (same as #1939).
      // That's probably okay; we don't support it just as we don't support
      // mixing React radio buttons with non-React ones.
      const otherProps = getFiberCurrentPropsFromNode(otherNode);
      invariant(
        otherProps,
        'ReactDOMInput: Mixing React and non-React radio inputs with the ' +
          'same `name` is not supported.',
      );

      // We need update the tracked value on the named cousin since the value
      // was changed but the input saw no event or value set
      inputValueTracking.updateValueIfChanged(otherNode);

      // If this is a controlled radio button group, forcing the input that
      // was previously checked to update will cause it to be come re-checked
      // as appropriate.
      updateWrapper(otherNode, otherProps);
    }
  }
}

// In Chrome, assigning defaultValue to certain input types triggers input validation.
// For number inputs, the display value loses trailing decimal points. For email inputs,
// Chrome raises "The specified value <x> is not a valid email address".
//
// Here we check to see if the defaultValue has actually changed, avoiding these problems
// when the user is inputting text
//
// https://github.com/facebook/react/issues/7253
export function setDefaultValue(
  node: InputWithWrapperState,
  type: ?string,
  value: *,
) {
  if (
    // Focused number inputs synchronize on blur. See ChangeEventPlugin.js
    type !== 'number' ||
    node.ownerDocument.activeElement !== node
  ) {
    if (value == null) {
      node.defaultValue = '' + node._wrapperState.initialValue;
    } else if (node.defaultValue !== '' + value) {
      node.defaultValue = '' + value;
    }
  }
}

function getSafeValue(value: *): * {
  switch (typeof value) {
    case 'boolean':
    case 'number':
    case 'object':
    case 'string':
    case 'undefined':
      return value;
    default:
      // function, symbol are assigned as empty strings
      return '';
  }
}
