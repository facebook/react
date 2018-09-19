/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

/**
 * In the future, we should cleanup callbacks by cancelling them instead of
 * using this.
 */
export function mountSafeCallback_NOT_REALLY_SAFE(
  context: any,
  callback: ?Function,
): any {
  return function() {
    if (!callback) {
      return undefined;
    }
    // This protects against createClass() components.
    // We don't know if there is code depending on it.
    // We intentionally don't use isMounted() because even accessing
    // isMounted property on a React ES6 class will trigger a warning.
    if (typeof context.__isMounted === 'boolean') {
      if (!context.__isMounted) {
        return undefined;
      }
    }

    // FIXME: there used to be other branches that protected
    // against unmounted host components. But RN host components don't
    // define isMounted() anymore, so those checks didn't do anything.

    // They caused false positive warning noise so we removed them:
    // https://github.com/facebook/react-native/issues/18868#issuecomment-413579095

    // However, this means that the callback is NOT guaranteed to be safe
    // for host components. The solution we should implement is to make
    // UIManager.measure() and similar calls truly cancelable. Then we
    // can change our own code calling them to cancel when something unmounts.

    return callback.apply(context, arguments);
  };
}

export function throwOnStylesProp(component: any, props: any) {
  if (props.styles !== undefined) {
    const owner = component._owner || null;
    const name = component.constructor.displayName;
    let msg =
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

export function warnForStyleProps(props: any, validAttributes: any) {
  for (const key in validAttributes.style) {
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
