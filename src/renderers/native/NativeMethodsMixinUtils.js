/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule NativeMethodsMixinUtils
 * @flow
 */
'use strict';

export type MeasureOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
  pageX: number,
  pageY: number,
) => void;

export type MeasureInWindowOnSuccessCallback = (
  x: number,
  y: number,
  width: number,
  height: number,
) => void;

export type MeasureLayoutOnSuccessCallback = (
  left: number,
  top: number,
  width: number,
  height: number,
) => void;

/**
 * Shared between ReactNativeFiberHostComponent and NativeMethodsMixin to keep
 * API in sync.
 */
export interface NativeMethodsInterface {
  blur(): void,
  focus(): void,
  measure(callback: MeasureOnSuccessCallback): void,
  measureInWindow(callback: MeasureInWindowOnSuccessCallback): void,
  measureLayout(
    relativeToNativeNode: number,
    onSuccess: MeasureLayoutOnSuccessCallback,
    onFail: () => void,
  ): void,
  setNativeProps(nativeProps: Object): void,
}

/**
 * In the future, we should cleanup callbacks by cancelling them instead of
 * using this.
 */
function mountSafeCallback(context: any, callback: ?Function): any {
  return function() {
    if (
      !callback ||
      (typeof context.isMounted === 'function' && !context.isMounted())
    ) {
      return undefined;
    }
    return callback.apply(context, arguments);
  };
}

function throwOnStylesProp(component: any, props: any) {
  if (props.styles !== undefined) {
    var owner = component._owner || null;
    var name = component.constructor.displayName;
    var msg =
      '`styles` is not a supported property of `' +
      name +
      '`, did ' +
      'you mean `style` (singular)?';
    if (owner && owner.constructor && owner.constructor.displayName) {
      msg +=
        '\n\nCheck the `' +
        owner.constructor.displayName +
        '` parent ' +
        ' component.';
    }
    throw new Error(msg);
  }
}

function warnForStyleProps(props: any, validAttributes: any) {
  for (var key in validAttributes.style) {
    if (!(validAttributes[key] || props[key] === undefined)) {
      console.error(
        'You are setting the style `{ ' +
          key +
          ': ... }` as a prop. You ' +
          'should nest it in a style object. ' +
          'E.g. `{ style: { ' +
          key +
          ': ... } }`',
      );
    }
  }
}

module.exports = {
  mountSafeCallback,
  throwOnStylesProp,
  warnForStyleProps,
};
