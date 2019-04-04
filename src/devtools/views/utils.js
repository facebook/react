// @flow

import escapeStringRegExp from 'escape-string-regexp';
import { meta } from '../../hydration';

import type { HooksTree } from 'src/backend/types';

export function createRegExp(string: string): RegExp {
  // 'item' should match 'Item' and 'ListItem', but not 'InviteMom'.
  // To do this, we'll slice off 'tem' and check first letter separately.
  const escaped = escapeStringRegExp(string);
  const firstLetter = escaped[0];
  let restRegex = '';
  // For 'item' input, restRegex becomes '[tT][eE][mM]'
  // We can't simply make it case-insensitive because first letter case matters.
  for (let i = 1; i < escaped.length; i++) {
    const char = escaped[i];
    restRegex += '[' + char.toLowerCase() + char.toUpperCase() + ']';
  }
  // Respect first letter only if it starts a word.
  return new RegExp(
    // For example:
    // (^[iI]|I)[tT][eE][mM]
    // Matches:
    // 'Item'
    // 'ListItem'
    // but not 'InviteMom'
    '(^[' +
      firstLetter +
      firstLetter.toLowerCase() +
      ']' +
      '|' +
      firstLetter.toUpperCase() +
      ')' +
      restRegex
  );
}

export function getMetaValueLabel(data: Object): string | null {
  switch (data[meta.type]) {
    case 'react_element':
      return `<${data[meta.name]} />`;
    case 'function':
      return `${data[meta.name] || 'fn'}()`;
    case 'object':
      return 'Object';
    case 'date':
    case 'symbol':
      return data[meta.name];
    case 'iterator':
      return `${data[meta.name]}(…)`;
    case 'array_buffer':
    case 'data_view':
    case 'array':
    case 'typed_array':
      return `${data[meta.name]}[${data[meta.meta].length}]`;
    default:
      return null;
  }
}

function sanitize(data: Object): void {
  for (const key in data) {
    const value = data[key];

    if (value && value[meta.type]) {
      data[key] = getMetaValueLabel(value);
    } else if (value != null) {
      if (Array.isArray(value)) {
        sanitize(value);
      } else if (typeof value === 'object') {
        sanitize(value);
      }
    }
  }
}

export function serializeDataForCopy(props: Object): string {
  const cloned = Object.assign({}, props);

  sanitize(cloned);

  try {
    return JSON.stringify(cloned, null, 2);
  } catch (error) {
    return '';
  }
}

export function serializeHooksForCopy(hooks: HooksTree | null): string {
  // $FlowFixMe "HooksTree is not an object"
  const cloned = Object.assign([], hooks);

  const queue = [...cloned];

  while (queue.length > 0) {
    const current = queue.pop();

    // These aren't meaningful
    delete current.id;
    delete current.isStateEditable;

    if (current.subHooks.length > 0) {
      queue.push(...current.subHooks);
    }
  }

  sanitize(cloned);

  try {
    return JSON.stringify(cloned, null, 2);
  } catch (error) {
    return '';
  }
}
