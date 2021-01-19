/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

// test() is part of Jest's serializer API
export function test(maybeDehydratedValue) {
  const {meta} = require('react-devtools-shared/src/hydration');

  const hasOwnProperty = Object.prototype.hasOwnProperty.bind(
    maybeDehydratedValue,
  );
  return (
    maybeDehydratedValue !== null &&
    typeof maybeDehydratedValue === 'object' &&
    hasOwnProperty(meta.inspectable) &&
    maybeDehydratedValue[meta.inspected] !== true
  );
}

function serializeDehydratedValuePreview(preview) {
  const date = new Date(preview);
  const isDatePreview = !Number.isNaN(date.valueOf());
  if (isDatePreview) {
    // The preview is just `String(date)` which formats the date in the local timezone.
    // This results in a snapshot mismatch between tests run in e.g. GMT and ET
    // WARNING: This does not guard against dates created with the default timezone i.e. the local timezone e.g. new Date('05 October 2011 14:48').
    return date.toISOString();
  }
  return preview;
}

// print() is part of Jest's serializer API
export function print(dehydratedValue, serialize, indent) {
  const {meta} = require('react-devtools-shared/src/hydration');
  const indentation = Math.max(indent('.').indexOf('.') - 2, 0);
  const paddingLeft = ' '.repeat(indentation);
  return (
    'Dehydrated {\n' +
    paddingLeft +
    '  "preview_short": ' +
    serializeDehydratedValuePreview(dehydratedValue[meta.preview_short]) +
    ',\n' +
    paddingLeft +
    '  "preview_long": ' +
    serializeDehydratedValuePreview(dehydratedValue[meta.preview_long]) +
    ',\n' +
    paddingLeft +
    '}'
  );
}
