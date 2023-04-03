/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type PropertyType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// A real boolean attribute.
// When true, it should be present (set either to an empty string or its name).
// When false, it should be omitted.
export const BOOLEAN = 3;

// An attribute that can be used as a flag as well as with a value.
// When true, it should be present (set either to an empty string or its name).
// When false, it should be omitted.
// For any other value, should be present with that value.
export const OVERLOADED_BOOLEAN = 4;

// An attribute that must be numeric or parse as a numeric.
// When falsy, it should be removed.
export const NUMERIC = 5;

// An attribute that must be positive numeric or parse as a positive numeric.
// When falsy, it should be removed.
export const POSITIVE_NUMERIC = 6;

export type PropertyInfo = {
  +acceptsBooleans: boolean,
  +attributeName: string,
  +type: PropertyType,
};

export function getPropertyInfo(name: string): PropertyInfo | null {
  return properties.hasOwnProperty(name) ? properties[name] : null;
}

// $FlowFixMe[missing-this-annot]
function PropertyInfoRecord(type: PropertyType, attributeName: string) {
  this.acceptsBooleans = type === BOOLEAN || type === OVERLOADED_BOOLEAN;
  this.attributeName = attributeName;
  this.type = type;
}

// When adding attributes to this list, be sure to also add them to
// the `possibleStandardNames` module to ensure casing and incorrect
// name warnings.
const properties: {[string]: $FlowFixMe} = {};

// These are HTML boolean attributes.
[
  'allowFullScreen',
  'async',
  'autoPlay',
  'controls',
  'default',
  'defer',
  'disabled',
  'disablePictureInPicture',
  'disableRemotePlayback',
  'formNoValidate',
  'hidden',
  'loop',
  'noModule',
  'noValidate',
  'open',
  'playsInline',
  'readOnly',
  'required',
  'reversed',
  'scoped',
  'seamless',
  // Microdata
  'itemScope',
].forEach(name => {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    BOOLEAN,
    name.toLowerCase(), // attributeName
  );
});

// These are HTML attributes that are "overloaded booleans": they behave like
// booleans, but can also accept a string value.
[
  'capture',
  'download',

  // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
].forEach(name => {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    OVERLOADED_BOOLEAN,
    name, // attributeName
  );
});

// These are HTML attributes that must be positive numbers.
[
  'cols',
  'rows',
  'size',
  'span',

  // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
].forEach(name => {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    POSITIVE_NUMERIC,
    name, // attributeName
  );
});

// These are HTML attributes that must be numbers.
['rowSpan', 'start'].forEach(name => {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    NUMERIC,
    name.toLowerCase(), // attributeName
  );
});
