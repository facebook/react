/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {REACT_ELEMENT_TYPE, REACT_FRAGMENT_TYPE} from 'shared/ReactSymbols';

import invariant from 'shared/invariant';

function captureAssertion(fn) {
  // Trick to use a Jest matcher inside another Jest matcher. `fn` contains an
  // assertion; if it throws, we capture the error and return it, so the stack
  // trace presented to the user points to the original assertion in the
  // test file.
  try {
    fn();
  } catch (error) {
    return {
      pass: false,
      message: () => error.message,
    };
  }
  return {pass: true};
}

function assertYieldsWereCleared(root) {
  const actualYields = root.unstable_clearYields();
  invariant(
    actualYields.length === 0,
    'Log of yielded values is not empty. ' +
      'Call expect(ReactTestRenderer).toHaveYielded(...) first.',
  );
}

export function toFlushAndYield(root, expectedYields) {
  return captureAssertion(() => {
    assertYieldsWereCleared(root);
    const actualYields = root.unstable_flushAll();
    expect(actualYields).toEqual(expectedYields);
  });
}

export function toFlushAndYieldThrough(root, expectedYields) {
  return captureAssertion(() => {
    assertYieldsWereCleared(root);
    const actualYields = root.unstable_flushNumberOfYields(
      expectedYields.length,
    );
    expect(actualYields).toEqual(expectedYields);
  });
}

export function toFlushWithoutYielding(root) {
  return toFlushAndYield(root, []);
}

export function toHaveYielded(ReactTestRenderer, expectedYields) {
  return captureAssertion(() => {
    if (
      ReactTestRenderer === null ||
      typeof ReactTestRenderer !== 'object' ||
      typeof ReactTestRenderer.unstable_setNowImplementation !== 'function'
    ) {
      invariant(
        false,
        'The matcher `toHaveYielded` expects an instance of React Test ' +
          'Renderer.\n\nTry: ' +
          'expect(ReactTestRenderer).toHaveYielded(expectedYields)',
      );
    }
    const actualYields = ReactTestRenderer.unstable_clearYields();
    expect(actualYields).toEqual(expectedYields);
  });
}

export function toFlushAndThrow(root, ...rest) {
  return captureAssertion(() => {
    assertYieldsWereCleared(root);
    expect(() => {
      root.unstable_flushAll();
    }).toThrow(...rest);
  });
}

export function toMatchRenderedOutput(root, expectedJSX) {
  const actualJSON = root.toJSON();

  let actualJSX;
  if (actualJSON === null || typeof actualJSON === 'string') {
    actualJSX = actualJSON;
  } else if (Array.isArray(actualJSON)) {
    if (actualJSON.length === 0) {
      actualJSX = null;
    } else if (actualJSON.length === 1) {
      actualJSX = jsonChildToJSXChild(actualJSON[0]);
    } else {
      const actualJSXChildren = jsonChildrenToJSXChildren(actualJSON);
      if (actualJSXChildren === null || typeof actualJSXChildren === 'string') {
        actualJSX = actualJSXChildren;
      } else {
        actualJSX = {
          $$typeof: REACT_ELEMENT_TYPE,
          type: REACT_FRAGMENT_TYPE,
          key: null,
          ref: null,
          props: {
            children: actualJSXChildren,
          },
          _owner: null,
          _store: __DEV__ ? {} : undefined,
        };
      }
    }
  } else {
    actualJSX = jsonChildToJSXChild(actualJSON);
  }

  return captureAssertion(() => {
    expect(actualJSX).toEqual(expectedJSX);
  });
}

function jsonChildToJSXChild(jsonChild) {
  if (jsonChild === null || typeof jsonChild === 'string') {
    return jsonChild;
  } else {
    const jsxChildren = jsonChildrenToJSXChildren(jsonChild.children);
    return {
      $$typeof: REACT_ELEMENT_TYPE,
      type: jsonChild.type,
      key: null,
      ref: null,
      props:
        jsxChildren === null
          ? jsonChild.props
          : {...jsonChild.props, children: jsxChildren},
      _owner: null,
      _store: __DEV__ ? {} : undefined,
    };
  }
}

function jsonChildrenToJSXChildren(jsonChildren) {
  if (jsonChildren !== null) {
    if (jsonChildren.length === 1) {
      return jsonChildToJSXChild(jsonChildren[0]);
    } else if (jsonChildren.length > 1) {
      let jsxChildren = [];
      let allJSXChildrenAreStrings = true;
      let jsxChildrenString = '';
      for (let i = 0; i < jsonChildren.length; i++) {
        const jsxChild = jsonChildrenToJSXChildren(jsonChildren[i]);
        jsxChildren.push(jsxChild);
        if (allJSXChildrenAreStrings) {
          if (typeof jsxChild === 'string') {
            jsxChildrenString += jsxChild;
          } else if (jsxChild !== null) {
            allJSXChildrenAreStrings = false;
          }
        }
      }
      return allJSXChildrenAreStrings ? jsxChildrenString : jsxChildren;
    }
  }
  return null;
}
