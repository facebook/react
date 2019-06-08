// @flow

import {
  ElementTypeClass,
  ElementTypeHostComponent,
  ElementTypeOtherOrUnknown,
} from 'src/types';
import { getDisplayName } from 'src/utils';

import type { InternalInstance } from './renderer';
import type { FiberData } from '../types';

export default function getData(internalInstance: InternalInstance): FiberData {
  let displayName = null;
  let key = null;
  let type = ElementTypeOtherOrUnknown;

  // != used deliberately here to catch undefined and null
  if (internalInstance._currentElement != null) {
    if (internalInstance._currentElement.key) {
      key = String(internalInstance._currentElement.key);
    }

    const elementType = internalInstance._currentElement.type;
    if (typeof elementType === 'string') {
      type = ElementTypeHostComponent;
      displayName = elementType;
    } else if (typeof elementType === 'function') {
      // TODO: detect function components.
      type = ElementTypeClass;
      displayName = getDisplayName(elementType);
    }
  }

  return {
    displayName,
    key,
    type,
  };
}
