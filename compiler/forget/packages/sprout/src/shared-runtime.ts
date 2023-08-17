/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from "react";

/**
 * This file is meant for use by `runner-evaluator` and fixture tests.
 *
 * Any fixture test can import constants or functions exported here.
 * However, the import path must be the relative path from `runner-evaluator`
 * (which calls `eval` on each fixture) to this file.
 *
 * ```js
 * // test.js
 * import {CONST_STRING0} from './shared-runtime';
 *
 * // ...
 * ```
 */

export const CONST_STRING0 = "global string 0";
export const CONST_STRING1 = "global string 1";
export const CONST_STRING2 = "global string 2";

export const CONST_NUMBER0 = 0;
export const CONST_NUMBER1 = 1;
export const CONST_NUMBER2 = 2;

export const CONST_TRUE = true;
export const CONST_FALSE = false;

export function graphql(value: string): string {
  return value;
}

export function identity<T>(x: T): T {
  return x;
}

export function getNumber(): number {
  return 4;
}

/**
 * Functions that do not mutate their parameters
 */
export function shallowCopy(obj: Object): object {
  return Object.assign({}, obj);
}

export function makeObject_Primitives(): object {
  return { a: 0, b: "value1", c: true };
}

export function addOne(value: number): number {
  return value + 1;
}

export function sum(...args: Array<number>): number {
  return args.reduce((result, arg) => result + arg, 0);
}

/**
 * React Components
 */
export function Text(props: { value: string; children: any }) {
  return React.createElement("div", null, props.value, props.children);
}

export function StaticText1(props: { children: any }) {
  return React.createElement("div", null, "StaticText1", props.children);
}

export function StaticText2(props: { children: any }) {
  return React.createElement("div", null, "StaticText2", props.children);
}

export function Stringify(props: any) {
  return toJSON(props);
}

// helper functions
export function toJSON(value: any) {
  const seen = new Map();

  return JSON.stringify(value, (_key: string, val: any) => {
    if (typeof val === "function") {
      return `[[ function params=${val.length} ]]`;
    } else if (typeof val === "object") {
      let id = seen.get(val);
      if (id != null) {
        return `[[ cyclic ref *${id} ]]`;
      } else if (val instanceof Map) {
        return {
          kind: "Map",
          value: Array.from(val.entries()),
        };
      } else if (val instanceof Set) {
        return {
          kind: "Set",
          value: Array.from(val.values()),
        };
      }
      seen.set(val, seen.size);
    }
    return val;
  });
}
