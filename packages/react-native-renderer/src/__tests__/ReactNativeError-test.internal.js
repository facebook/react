/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let React;
let ReactNative;
let createReactNativeComponentClass;
let computeComponentStackForErrorReporting;

function normalizeCodeLocInfo(str) {
  return (
    str &&
    str.replace(/\n +(?:at|in) ([\S]+)[^\n]*/g, function (m, name) {
      return '\n    in ' + name + ' (at **)';
    })
  );
}

describe('ReactNativeError', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactNative = require('react-native-renderer');
    createReactNativeComponentClass =
      require('react-native/Libraries/ReactPrivate/ReactNativePrivateInterface')
        .ReactNativeViewConfigRegistry.register;
    computeComponentStackForErrorReporting =
      ReactNative.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
        .computeComponentStackForErrorReporting;
  });

  it('should throw error if null component registration getter is used', () => {
    expect(() => {
      try {
        createReactNativeComponentClass('View', null);
      } catch (e) {
        throw new Error(e.toString());
      }
    }).toThrow(
      'View config getter callback for component `View` must be a function (received `null`)',
    );
  });

  // @gate !disableLegacyMode
  it('should be able to extract a component stack from a native view', () => {
    const View = createReactNativeComponentClass('View', () => ({
      validAttributes: {foo: true},
      uiViewClassName: 'View',
    }));

    const ref = React.createRef();

    function FunctionComponent(props) {
      return props.children;
    }

    class ClassComponent extends React.Component {
      render() {
        return (
          <FunctionComponent>
            <View foo="test" ref={ref} />
          </FunctionComponent>
        );
      }
    }

    ReactNative.render(<ClassComponent />, 1);

    const reactTag = ReactNative.findNodeHandle(ref.current);

    const componentStack = normalizeCodeLocInfo(
      computeComponentStackForErrorReporting(reactTag),
    );

    expect(componentStack).toBe(
      '\n' +
        '    in View (at **)\n' +
        '    in FunctionComponent (at **)\n' +
        '    in ClassComponent (at **)',
    );
  });
});
