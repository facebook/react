/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { IntlVariations, IntlViewerContext, init } from "fbt";
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

export type StringKeyedObject = { [key: string]: unknown };

export const CONST_STRING0 = "global string 0";
export const CONST_STRING1 = "global string 1";
export const CONST_STRING2 = "global string 2";

export const CONST_NUMBER0 = 0;
export const CONST_NUMBER1 = 1;
export const CONST_NUMBER2 = 2;

export const CONST_TRUE = true;
export const CONST_FALSE = false;

export function initFbt() {
  const viewerContext: IntlViewerContext = {
    GENDER: IntlVariations.GENDER_UNKNOWN,
    locale: "en_US",
  };

  init({
    translations: {},
    hooks: {
      getViewerContext: () => viewerContext,
    },
  });
}

export function mutate(arg: any): void {
  // don't mutate primitive
  if (typeof arg === null || typeof arg !== "object") {
    return;
  }

  let count: number = 0;
  let key;
  while (true) {
    key = "wat" + count;
    if (!Object.hasOwn(arg, key)) {
      arg[key] = "joe";
      return;
    }
    count++;
  }
}

export function mutateAndReturn<T>(arg: T): T {
  mutate(arg);
  return arg;
}

export function mutateAndReturnNewValue<T>(arg: T): string {
  mutate(arg);
  return "hello!";
}

export function setProperty(arg: any, property: any): void {
  // don't mutate primitive
  if (typeof arg === null || typeof arg !== "object") {
    return;
  }

  let count: number = 0;
  let key;
  while (true) {
    key = "wat" + count;
    if (!Object.hasOwn(arg, key)) {
      arg[key] = property;
      return;
    }
    count++;
  }
}

export function graphql(value: string): string {
  return value;
}

export function identity<T>(x: T): T {
  return x;
}

export function getNumber(): number {
  return 4;
}

export function calculateExpensiveNumber(x: number): number {
  return x;
}

/**
 * Functions that do not mutate their parameters
 */
export function shallowCopy(obj: Object): object {
  return Object.assign({}, obj);
}

export function makeObject_Primitives(): StringKeyedObject {
  return { a: 0, b: "value1", c: true };
}

export function addOne(value: number): number {
  return value + 1;
}

export function sum(...args: Array<number>): number {
  return args.reduce((result, arg) => result + arg, 0);
}

export function throwErrorWithMessage(message: string): never {
  throw new Error(message);
}

export function throwInput(x: Object): never {
  throw x;
}

const noAliasObject = Object.freeze({});
export function useNoAlias(...args: Array<any>): object {
  return noAliasObject;
}

export function invoke<T extends Array<any>, ReturnType>(
  fn: (...input: T) => ReturnType,
  ...params: T
) {
  return fn(...params);
}

/**
 * React Components
 */
export function Text(props: {
  value: string;
  children?: Array<React.ReactNode>;
}) {
  return React.createElement("div", null, props.value, props.children);
}

export function StaticText1(props: { children?: Array<React.ReactNode> }) {
  return React.createElement("div", null, "StaticText1", props.children);
}

export function StaticText2(props: { children?: Array<React.ReactNode> }) {
  return React.createElement("div", null, "StaticText2", props.children);
}

export function RenderPropAsChild(props: {
  items: Array<() => React.ReactNode>;
}) {
  return React.createElement(
    "div",
    null,
    "HigherOrderComponent",
    props.items.map((item) => item())
  );
}

export function Stringify(props: any): React.ReactElement {
  return React.createElement("div", null, toJSON(props));
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

export const ObjectWithHooks = {
  useFoo(): number {
    return 0;
  },
};
