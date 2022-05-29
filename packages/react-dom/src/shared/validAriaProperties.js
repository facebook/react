/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const properties = [
  'current', // state
  'description',
  'details',
  'disabled', // state
  'hidden', // state
  'invalid', // state
  'keyshortcuts',
  'label',
  'roledescription',
  // Widget Attributes
  'autocomplete',
  'checked',
  'expanded',
  'haspopup',
  'level',
  'modal',
  'multiline',
  'multiselectable',
  'orientation',
  'placeholder',
  'pressed',
  'readonly',
  'required',
  'selected',
  'sort',
  'valuemax',
  'valuemin',
  'valuenow',
  'valuetext',
  // Live Region Attributes
  'atomic',
  'busy',
  'live',
  'relevant',
  // Drag-and-Drop Attributes
  'dropeffect',
  'grabbed',
  // Relationship Attributes
  'activedescendant',
  'colcount',
  'colindex',
  'colspan',
  'controls',
  'describedby',
  'errormessage',
  'flowto',
  'labelledby',
  'owns',
  'posinset',
  'rowcount',
  'rowindex',
  'rowspan',
  'setsize',
];

const ariaProperties = {};

properties.forEach(property => {
  ariaProperties['aria-' + property] = 0;
});

export default ariaProperties;
