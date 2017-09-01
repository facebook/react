/* eslint-disable */

import {
  getCanonicalizedValue,
  getRenderedAttributeValue,
  attributes,
  types,
} from './attributeBehavior';

const React = global.React;
const {Component} = React;

const ReactDOM16 = global.ReactDOM16;
const ReactDOMServer16 = global.ReactDOMServer16;

function getUniqueKey(t, key, depth = 1) {
  if (depth !== 1) {
    key = `${key} (variant ${depth})`;
  }
  if (t.has(key)) {
    return getUniqueKey(t, key, depth + 1);
  }
  return key;
}

function test() {
  let log = '';
  for (let attribute of attributes) {
    log += `${attribute.name}\n`;
    for (let type of types) {
      const result = getRenderedAttributeValue(
        React,
        ReactDOM16,
        ReactDOMServer16,
        attribute,
        type
      );

      const {
        didError,
        didWarn,
        canonicalResult,
        canonicalDefaultValue,
        ssrHasSameBehavior,
        ssrHasSameBehaviorExceptWarnings,
      } = result;

      let descriptions = [];
      if (canonicalResult === canonicalDefaultValue) {
        descriptions.push('NO CHANGE');
      }
      if (didError) {
        descriptions.push('ERROR');
      }
      if (didWarn) {
        descriptions.push('WARN');
      }
      if (!ssrHasSameBehavior) {
        if (ssrHasSameBehaviorExceptWarnings) {
          descriptions.push('SSR WARNS');
        } else {
          descriptions.push('SSR DEVIATION');
        }
      }

      log += `\t${type.name} -> ${canonicalResult} ${descriptions.join(', ')}\n`;
    }
  }

  return log;
}

window.test = test;
