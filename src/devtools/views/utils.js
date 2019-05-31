// @flow

import escapeStringRegExp from 'escape-string-regexp';
import { meta } from '../../hydration';

import type { HooksTree } from 'src/backend/types';

export function createRegExp(string: string): RegExp {
  // Allow /regex/ syntax with optional last /
  if (string[0] === '/') {
    // Cut off first slash
    string = string.substring(1);
    // Cut off last slash, but only if it's there
    if (string[string.length - 1] === '/') {
      string = string.substring(0, string.length - 1);
    }
    try {
      return new RegExp(string, 'i');
    } catch (err) {
      // Bad regex. Make it not match anything.
      // TODO: maybe warn in console?
      return new RegExp('.^');
    }
  }

  function isLetter(char: string) {
    return char.toLowerCase() !== char.toUpperCase();
  }

  function matchAnyCase(char: string) {
    if (!isLetter(char)) {
      // Don't mess with special characters like [.
      return char;
    }
    return '[' + char.toLowerCase() + char.toUpperCase() + ']';
  }

  // 'item' should match 'Item' and 'ListItem', but not 'InviteMom'.
  // To do this, we'll slice off 'tem' and check first letter separately.
  const escaped = escapeStringRegExp(string);
  const firstChar = escaped[0];
  let restRegex = '';
  // For 'item' input, restRegex becomes '[tT][eE][mM]'
  // We can't simply make it case-insensitive because first letter case matters.
  for (let i = 1; i < escaped.length; i++) {
    restRegex += matchAnyCase(escaped[i]);
  }

  if (!isLetter(firstChar)) {
    // We can't put a non-character like [ in a group
    // so we fall back to the simple case.
    return new RegExp(firstChar + restRegex);
  }

  // Construct a smarter regex.
  return new RegExp(
    // For example:
    // (^[iI]|I)[tT][eE][mM]
    // Matches:
    // 'Item'
    // 'ListItem'
    // but not 'InviteMom'
    '(^' +
      matchAnyCase(firstChar) +
      '|' +
      firstChar.toUpperCase() +
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

// Keeping this in memory seems to be enough to enable the browser to download larger profiles.
// Without this, we would see a "Download failed: network error" failure.
let downloadUrl = null;

export function downloadFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });

  if (downloadUrl !== null) {
    URL.revokeObjectURL(downloadUrl);
  }

  downloadUrl = URL.createObjectURL(blob);

  const element = document.createElement('a');
  element.setAttribute('href', downloadUrl);
  element.setAttribute('download', filename);
  element.style.display = 'none';
  ((document.body: any): HTMLBodyElement).appendChild(element);

  element.click();

  ((document.body: any): HTMLBodyElement).removeChild(element);
}

export function truncateText(text: string, maxLength: number): string {
  const { length } = text;
  if (length > maxLength) {
    return (
      text.substr(0, Math.floor(maxLength / 2)) +
      '…' +
      text.substr(length - Math.ceil(maxLength / 2) + 1)
    );
  } else {
    return text;
  }
}
