/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

type PropertyType = 0 | 1 | 2 | 3 | 4 | 5 | 6;

// A simple string attribute.
// Attributes that aren't in the filter are presumed to have this type.
export const STRING = 1;

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
  +attributeNamespace: string | null,
  +type: PropertyType,
};

export function getPropertyInfo(name: string): PropertyInfo | null {
  return properties.hasOwnProperty(name) ? properties[name] : null;
}

// $FlowFixMe[missing-this-annot]
function PropertyInfoRecord(
  type: PropertyType,
  attributeName: string,
  attributeNamespace: string | null,
) {
  this.acceptsBooleans = type === BOOLEAN || type === OVERLOADED_BOOLEAN;
  this.attributeName = attributeName;
  this.attributeNamespace = attributeNamespace;
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
    null, // attributeNamespace
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
    null, // attributeNamespace
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
    null, // attributeNamespace
  );
});

// These are HTML attributes that must be numbers.
['rowSpan', 'start'].forEach(name => {
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    NUMERIC,
    name.toLowerCase(), // attributeName
    null, // attributeNamespace
  );
});

const CAMELIZE = /[\-\:]([a-z])/g;
const capitalize = (token: string) => token[1].toUpperCase();

// String SVG attributes with the xlink namespace.
[
  'xlink:actuate',
  'xlink:arcrole',
  'xlink:role',
  'xlink:show',
  'xlink:title',
  'xlink:type',

  // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
].forEach(attributeName => {
  const name = attributeName.replace(CAMELIZE, capitalize);
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    STRING,
    attributeName,
    'http://www.w3.org/1999/xlink',
  );
});

// String SVG attributes with the xml namespace.
[
  'xml:base',
  'xml:lang',
  'xml:space',

  // NOTE: if you add a camelCased prop to this list,
  // you'll need to set attributeName to name.toLowerCase()
  // instead in the assignment below.
].forEach(attributeName => {
  const name = attributeName.replace(CAMELIZE, capitalize);
  // $FlowFixMe[invalid-constructor] Flow no longer supports calling new on functions
  properties[name] = new PropertyInfoRecord(
    STRING,
    attributeName,
    'http://www.w3.org/XML/1998/namespace',
  );
});
