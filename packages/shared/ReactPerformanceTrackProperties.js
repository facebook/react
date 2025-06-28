/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import {OMITTED_PROP_ERROR} from 'shared/ReactFlightPropertyAccess';

import hasOwnProperty from 'shared/hasOwnProperty';
import isArray from 'shared/isArray';
import {REACT_ELEMENT_TYPE} from './ReactSymbols';
import getComponentNameFromType from './getComponentNameFromType';

const EMPTY_ARRAY = 0;
const COMPLEX_ARRAY = 1;
const PRIMITIVE_ARRAY = 2; // Primitive values only
const ENTRIES_ARRAY = 3; // Tuple arrays of string and value (like Headers, Map, etc)
function getArrayKind(array: Object): 0 | 1 | 2 | 3 {
  let kind = EMPTY_ARRAY;
  for (let i = 0; i < array.length; i++) {
    const value = array[i];
    if (typeof value === 'object' && value !== null) {
      if (
        isArray(value) &&
        value.length === 2 &&
        typeof value[0] === 'string'
      ) {
        // Key value tuple
        if (kind !== EMPTY_ARRAY && kind !== ENTRIES_ARRAY) {
          return COMPLEX_ARRAY;
        }
        kind = ENTRIES_ARRAY;
      } else {
        return COMPLEX_ARRAY;
      }
    } else if (typeof value === 'function') {
      return COMPLEX_ARRAY;
    } else if (typeof value === 'string' && value.length > 50) {
      return COMPLEX_ARRAY;
    } else if (kind !== EMPTY_ARRAY && kind !== PRIMITIVE_ARRAY) {
      return COMPLEX_ARRAY;
    } else {
      kind = PRIMITIVE_ARRAY;
    }
  }
  return kind;
}

export function addObjectToProperties(
  object: Object,
  properties: Array<[string, string]>,
  indent: number,
): void {
  for (const key in object) {
    if (hasOwnProperty.call(object, key) && key[0] !== '_') {
      const value = object[key];
      addValueToProperties(key, value, properties, indent);
    }
  }
}

export function addValueToProperties(
  propertyName: string,
  value: mixed,
  properties: Array<[string, string]>,
  indent: number,
): void {
  let desc;
  switch (typeof value) {
    case 'object':
      if (value === null) {
        desc = 'null';
        break;
      } else {
        if (value.$$typeof === REACT_ELEMENT_TYPE) {
          // JSX
          const typeName = getComponentNameFromType(value.type) || '\u2026';
          const key = value.key;
          const props: any = value.props;
          const propsKeys = Object.keys(props);
          const propsLength = propsKeys.length;
          if (key == null && propsLength === 0) {
            desc = '<' + typeName + ' />';
            break;
          }
          if (
            indent < 3 ||
            (propsLength === 1 && propsKeys[0] === 'children' && key == null)
          ) {
            desc = '<' + typeName + ' \u2026 />';
            break;
          }
          properties.push([
            '\xa0\xa0'.repeat(indent) + propertyName,
            '<' + typeName,
          ]);
          if (key !== null) {
            addValueToProperties('key', key, properties, indent + 1);
          }
          let hasChildren = false;
          for (const propKey in props) {
            if (propKey === 'children') {
              if (
                props.children != null &&
                (!isArray(props.children) || props.children.length > 0)
              ) {
                hasChildren = true;
              }
            } else if (
              hasOwnProperty.call(props, propKey) &&
              propKey[0] !== '_'
            ) {
              addValueToProperties(
                propKey,
                props[propKey],
                properties,
                indent + 1,
              );
            }
          }
          properties.push([
            '',
            hasChildren ? '>\u2026</' + typeName + '>' : '/>',
          ]);
          return;
        }
        // $FlowFixMe[method-unbinding]
        const objectToString = Object.prototype.toString.call(value);
        let objectName = objectToString.slice(8, objectToString.length - 1);
        if (objectName === 'Array') {
          const array: Array<any> = (value: any);
          const kind = getArrayKind(array);
          if (kind === PRIMITIVE_ARRAY || kind === EMPTY_ARRAY) {
            desc = JSON.stringify(array);
            break;
          } else if (kind === ENTRIES_ARRAY) {
            properties.push(['\xa0\xa0'.repeat(indent) + propertyName, '']);
            for (let i = 0; i < array.length; i++) {
              const entry = array[i];
              addValueToProperties(entry[0], entry[1], properties, indent + 1);
            }
            return;
          }
        }
        if (objectName === 'Object') {
          const proto: any = Object.getPrototypeOf(value);
          if (proto && typeof proto.constructor === 'function') {
            objectName = proto.constructor.name;
          }
        }
        properties.push([
          '\xa0\xa0'.repeat(indent) + propertyName,
          objectName === 'Object' ? (indent < 3 ? '' : '\u2026') : objectName,
        ]);
        if (indent < 3) {
          addObjectToProperties(value, properties, indent + 1);
        }
        return;
      }
    case 'function':
      if (value.name === '') {
        desc = '() => {}';
      } else {
        desc = value.name + '() {}';
      }
      break;
    case 'string':
      if (value === OMITTED_PROP_ERROR) {
        desc = '\u2026'; // ellipsis
      } else {
        desc = JSON.stringify(value);
      }
      break;
    case 'undefined':
      desc = 'undefined';
      break;
    case 'boolean':
      desc = value ? 'true' : 'false';
      break;
    default:
      // eslint-disable-next-line react-internal/safe-string-coercion
      desc = String(value);
  }
  properties.push(['\xa0\xa0'.repeat(indent) + propertyName, desc]);
}
