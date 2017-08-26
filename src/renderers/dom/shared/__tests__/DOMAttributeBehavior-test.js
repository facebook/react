/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

describe('DOMAttributeBehavior', () => {
  var React;
  var ReactDOM;
  var ReactDOMFeatureFlags = require('ReactDOMFeatureFlags');
  var DOMAttributeBehavior = require('../../../../../fixtures/attribute-behavior/src/attributeBehavior');

  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
  });

  function displayTypeOf(value) {
    switch (typeof result) {
      case 'undefined':
        return '<undefined>';
      case 'object':
        if (value === null) {
          return '<null>';
        }
        return '<object>';
      case 'function':
        return '<function>';
      case 'symbol':
        return '<symbol>';
      case 'number':
        return `<number: ${value}>`;
      case 'string':
        if (value === '') {
          return '<empty string>';
        }
        return '"' + value + '"';
      case 'boolean':
        return `<boolean: ${value}>`;
      default:
        throw new Error('Switch statement should be exhaustive.');
    }
  }

  function getUniqueKey(t, key, depth = 1) {
    if (depth !== 1) {
      key = `${key} (variant ${depth})`;
    }
    if (t.has(key)) {
      return getUniqueKey(t, key, depth + 1);
    }
    return key;
  }

  it('sets DOM attributes and properties', () => {
    if (ReactDOMFeatureFlags.useFiber) {
      const {
        getRenderedAttributeValue,
        attributes,
        types,
      } = DOMAttributeBehavior;
      const table = new Map();

      for (let attribute of attributes) {
        const row = new Map();
        for (let type of types) {
          const result = getRenderedAttributeValue(
            React,
            ReactDOM,
            attribute,
            type,
          );

          let description;
          if (result.didError) {
            description = 'ERROR';
          } else if (result.didWarn) {
            description = 'WARN';
          } else if (result.result === result.defaultValue) {
            description = `NO CHANGE - ${displayTypeOf(result.result)}`;
          } else {
            description = `CHANGE - ${displayTypeOf(result.result)}`;
          }

          row.set(type.name, description);
        }
        const key = getUniqueKey(table, attribute.name);
        table.set(key, row);
      }

      expect(table).toMatchSnapshot();
    }
  });
});
