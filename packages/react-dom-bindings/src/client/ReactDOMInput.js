/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {getCurrentFiberOwnerNameInDevOrNull} from 'react-reconciler/src/ReactCurrentFiber';
import {getFiberCurrentPropsFromNode} from './ReactDOMComponentTree';
import {getToStringValue, toString} from './ToStringValue';
import {track, trackHydrated, updateValueIfChanged} from './inputValueTracking';
import getActiveElement from './getActiveElement';
import {
  disableInputAttributeSyncing,
  enableHydrationChangeEvent,
} from 'shared/ReactFeatureFlags';
import {checkAttributeStringCoercion} from 'shared/CheckStringCoercion';

import type {ToStringValue} from './ToStringValue';
import escapeSelectorAttributeValueInsideDoubleQuotes from './escapeSelectorAttributeValueInsideDoubleQuotes';
import {queueChangeEvent} from '../events/ReactDOMEventReplaying';

let didWarnValueDefaultValue = false;
let didWarnCheckedDefaultChecked = false;

export function validateInputProps(element: Element, props: Object) {
  if (__DEV__) {
    if (
      props.checked !== undefined &&
      props.defaultChecked !== undefined &&
      !didWarnCheckedDefaultChecked
    ) {
      console.error(
        '%s contains an input of type %s with both checked and defaultChecked props. ' +
          'Input elements must be either controlled or uncontrolled ' +
          '(specify either the checked prop, or the defaultChecked prop, but not ' +
          'both). Decide between using a controlled or uncontrolled input ' +
          'element and remove one of these props. More info: ' +
          'https://react.dev/link/controlled-components',
        getCurrentFiberOwnerNameInDevOrNull() || 'A component',
        props.type,
      );
      didWarnCheckedDefaultChecked = true;
    }
    if (
      props.value !== undefined &&
      props.defaultValue !== undefined &&
      !didWarnValueDefaultValue
    ) {
      console.error(
        '%s contains an input of type %s with both value and defaultValue props. ' +
          'Input elements must be either controlled or uncontrolled ' +
          '(specify either the value prop, or the defaultValue prop, but not ' +
          'both). Decide between using a controlled or uncontrolled input ' +
          'element and remove one of these props. More info: ' +
          'https://react.dev/link/controlled-components',
        getCurrentFiberOwnerNameInDevOrNull() || 'A component',
        props.type,
      );
      didWarnValueDefaultValue = true;
    }
  }
}

export function updateInput(
  element: Element,
  value: ?string,
  defaultValue: ?string,
  lastDefaultValue: ?string,
  checked: ?boolean,
  defaultChecked: ?boolean,
  type: ?string,
  name: ?string,
) {
  const node: HTMLInputElement = (element: any);

  node.name = '';

  if (
    type != null &&
    typeof type !== 'function' &&
    typeof type !== 'symbol' &&
    typeof type !== 'boolean'
  ) {
    if (DEV) {
      checkAttributeStringCoercion(type, 'type');
    }
    node.type = type;
  } else {
    node.removeAttribute('type');
  }

  if (typeof value === 'function' || typeof value === 'symbol') {
    node.removeAttribute('value');
  } else if (value != null) {
    if (type === 'number') {
      if ((value === 0 && node.value === '') || node.value != (value: any)) {
        node.value = toString(getToStringValue(value));
      }
    } else if (node.value !== toString(getToStringValue(value))) {
      node.value = toString(getToStringValue(value));
    }
  } else if (type === 'submit' || type === 'reset') {
    node.removeAttribute('value');
  }

  if (disableInputAttributeSyncing) {
    if (defaultValue != null) {
      setDefaultValue(node, type, getToStringValue(defaultValue));
    } else if (lastDefaultValue != null) {
      node.removeAttribute('value');
    }
  } else {
    if (value != null) {
      setDefaultValue(node, type, getToStringValue(value));
    } else if (defaultValue != null) {
      setDefaultValue(node, type, getToStringValue(defaultValue));
    } else if (lastDefaultValue != null) {
      node.removeAttribute('value');
    }
  }

  if (disableInputAttributeSyncing) {
    if (defaultChecked == null) {
      node.removeAttribute('checked');
    } else {
      node.defaultChecked = !!defaultChecked;
    }
  } else {
    if (checked == null && defaultChecked != null) {
      node.defaultChecked = !!defaultChecked;
    }
  }

  if (checked != null) {
    node.checked =
      checked && typeof checked !== 'function' && typeof checked !== 'symbol';
  }

  if (
    name != null &&
    typeof name !== 'function' &&
    typeof name !== 'symbol' &&
    typeof name !== 'boolean'
  ) {
    if (DEV) {
      checkAttributeStringCoercion(name, 'name');
    }
    node.name = toString(getToStringValue(name));
  } else {
    node.removeAttribute('name');
  }
}

export function initInput(
  element: Element,
  value: ?string,
  defaultValue: ?string,
  checked: ?boolean,
  defaultChecked: ?boolean,
  type: ?string,
  name: ?string,
  isHydrating: boolean,
) {
  const node: HTMLInputElement = (element: any);

  if (
    type != null &&
    typeof type !== 'function' &&
    typeof type !== 'symbol' &&
    typeof type !== 'boolean'
  ) {
    if (DEV) {
      checkAttributeStringCoercion(type, 'type');
    }
    node.type = type;
  }

  const isButton = type === 'submit' || type === 'reset';

  const defaultValueStr =
    defaultValue != null ? toString(getToStringValue(defaultValue)) : '';
  const initialValue =
    typeof value === 'function' || typeof value === 'symbol'
      ? ''
      : value != null
      ? toString(getToStringValue(value))
      : defaultValueStr;

  if (!isHydrating || enableHydrationChangeEvent) {
    if (disableInputAttributeSyncing) {
      if (
        typeof value !== 'function' &&
        typeof value !== 'symbol' &&
        value != null
      ) {
        if (isButton || toString(getToStringValue(value)) !== node.value) {
          node.value = toString(getToStringValue(value));
        }
      }
    } else {
      if (initialValue !== node.value) {
        node.value = initialValue;
      }
    }
  }

  if (disableInputAttributeSyncing) {
    if (defaultValue != null) {
      node.defaultValue = defaultValueStr;
    }
  } else {
    node.defaultValue = initialValue;
  }

  const checkedOrDefault = checked != null ? checked : defaultChecked;
  const initialChecked =
    typeof checkedOrDefault !== 'function' &&
    typeof checkedOrDefault !== 'symbol' &&
    !!checkedOrDefault;

  if (isHydrating && !enableHydrationChangeEvent) {
    node.checked = node.checked;
  } else {
    node.checked = !!initialChecked;
  }

  if (disableInputAttributeSyncing) {
    if (defaultChecked != null) {
      node.defaultChecked = !node.defaultChecked;
      node.defaultChecked = !!defaultChecked;
    }
  } else {
    node.defaultChecked = !node.defaultChecked;
    node.defaultChecked = !!initialChecked;
  }

  if (
    name != null &&
    typeof name !== 'function' &&
    typeof name !== 'symbol' &&
    typeof name !== 'boolean'
  ) {
    if (DEV) {
      checkAttributeStringCoercion(name, 'name');
    }
    node.name = name;
  }
  track((element: any));
}

export function hydrateInput(
  element: Element,
  value: ?string,
  defaultValue: ?string,
  checked: ?boolean,
  defaultChecked: ?boolean,
): void {
  const node: HTMLInputElement = (element: any);

  const defaultValueStr =
    defaultValue != null ? toString(getToStringValue(defaultValue)) : '';
  const initialValue =
    value != null ? toString(getToStringValue(value)) : defaultValueStr;

  const checkedOrDefault = checked != null ? checked : defaultChecked;
  const initialChecked =
    typeof checkedOrDefault !== 'function' &&
    typeof checkedOrDefault !== 'symbol' &&
    !!checkedOrDefault;

  node.checked = node.checked;

  const changed = trackHydrated((node: any), initialValue, initialChecked);
  if (changed) {
    if (node.type !== 'radio' || node.checked) {
      queueChangeEvent(node);
    }
  }
}

export function restoreControlledInputState(element: Element, props: Object) {
  const rootNode: HTMLInputElement = (element: any);
  updateInput(
    rootNode,
    props.value,
    props.defaultValue,
    props.defaultValue,
    props.checked,
    props.defaultChecked,
    props.type,
    props.name,
  );
  const name = props.name;
  if (props.type === 'radio' && name != null) {
    let queryRoot: Element = rootNode;

    while (queryRoot.parentNode) {
      queryRoot = ((queryRoot.parentNode: any): Element);
    }

    if (DEV) {
      checkAttributeStringCoercion(name, 'name');
    }
    const group = queryRoot.querySelectorAll(
      'input[name="' +
        escapeSelectorAttributeValueInsideDoubleQuotes('' + name) +
        '"][type="radio"]',
    );

    for (let i = 0; i < group.length; i++) {
      const otherNode = ((group[i]: any): HTMLInputElement);
      if (otherNode === rootNode || otherNode.form !== rootNode.form) {
        continue;
      }
      const otherProps: any = getFiberCurrentPropsFromNode(otherNode);

      if (!otherProps) {
        throw new Error(
          'ReactDOMInput: Mixing React and non-React radio inputs with the ' +
            'same name is not supported.',
        );
      }

      updateInput(
        otherNode,
        otherProps.value,
        otherProps.defaultValue,
        otherProps.defaultValue,
        otherProps.checked,
        otherProps.defaultChecked,
        otherProps.type,
        otherProps.name,
      );
    }

    for (let i = 0; i < group.length; i++) {
      const otherNode = ((group[i]: any): HTMLInputElement);
      if (otherNode.form !== rootNode.form) {
        continue;
      }
      updateValueIfChanged(otherNode);
    }
  }
}

export function setDefaultValue(
  node: HTMLInputElement,
  type: ?string,
  value: ToStringValue,
) {
  if (
    type !== 'number' ||
    getActiveElement(node.ownerDocument) !== node
  ) {
    if (node.defaultValue !== toString(value)) {
      node.defaultValue = toString(value);
    }
  }
}
