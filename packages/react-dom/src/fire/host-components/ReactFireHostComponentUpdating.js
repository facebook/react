/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {isCustomComponent, isPropAnEvent} from '../ReactFireUtils';
import {
  updateWrapper as applyHostComponentInputUpdateWrapper,
  updateChecked,
} from './controlled/ReactFireInput';
import {applyHostComponentSelectUpdateWrapper} from './controlled/ReactFireSelect';
import {updateWrapper as applyHostComponentTextareaUpdateWrapper} from './controlled/ReactFireTextarea';
import {
  CHILDREN,
  DANGEROUSLY_SET_INNER_HTML,
  STYLE,
} from '../ReactFireDOMConfig';
import {setInnerHTML} from './ReactFireHostComponentInnerHTML';
import {setHostComponentAttribute} from './ReactFireHostComponentAttributes';
import {setValueForStyles} from './ReactFireHostComponentStyling';

export function updateHostComponentProperties(
  domNode: Element,
  updatePayload: Array<any>,
  type: string,
  lastRawProps: Object,
  nextRawProps: Object,
) {
  // Update checked *before* name.
  // In the middle of an update, it is possible to have multiple checked.
  // When a checked radio tries to change name, browser makes another radio's checked false.
  if (
    type === 'input' &&
    nextRawProps.type === 'radio' &&
    nextRawProps.name != null
  ) {
    updateChecked(domNode, nextRawProps);
  }
  const isCustomComponentTag = isCustomComponent(type, nextRawProps);

  // Apply the diff.
  // TODO: Handle wasCustomComponentTag
  for (let i = 0; i < updatePayload.length; i += 2) {
    const propName = updatePayload[i];
    const propValue = updatePayload[i + 1];
    if (propName === STYLE) {
      setValueForStyles(domNode, propValue);
    } else if (propName === DANGEROUSLY_SET_INNER_HTML) {
      setInnerHTML(domNode, propValue);
    } else if (propName === CHILDREN) {
      const lastChildren = lastRawProps.children;
      if (
        typeof lastChildren !== 'string' ||
        domNode.firstChild == null ||
        propValue === ''
      ) {
        domNode.textContent = propValue;
      } else {
        domNode.firstChild.nodeValue = propValue;
      }
    } else if (!isPropAnEvent(propName) || isCustomComponentTag) {
      setHostComponentAttribute(
        domNode,
        propName,
        propValue,
        isCustomComponentTag,
      );
    }
  }

  // TODO: Ensure that an update gets scheduled if any of the special props
  // changed.
  switch (type) {
    case 'input':
      // Update the wrapper around inputs *after* updating props. This has to
      // happen after `updateDOMProperties`. Otherwise HTML5 input validations
      // raise warnings and prevent the new value from being assigned.
      applyHostComponentInputUpdateWrapper(domNode, nextRawProps);
      break;
    case 'textarea':
      applyHostComponentTextareaUpdateWrapper(domNode, nextRawProps);
      break;
    case 'select':
      // <select> value update needs to occur after <option> children
      // reconciliation
      applyHostComponentSelectUpdateWrapper(domNode, nextRawProps);
      break;
  }
}
