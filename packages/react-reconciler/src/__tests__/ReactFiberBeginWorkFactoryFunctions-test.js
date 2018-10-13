/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @jest-environment node
 */

'use strict';

let React;
let ReactNoop;

const createWarning = componentName =>
  `The <${componentName} /> component appears to be defined as a factory function. ` +
  `Those components will be deprecated with React 17.x. Please convert <${componentName} /> into a functional ` +
  'or class component. You can refer to https://github.com/facebook/react/issues/13560 for more info.';

function HelloFactory(props) {
  return {
    render() {
      return <div>Hello World</div>;
    },
  };
}

describe('ReactFiberBeginWorkFactoryFuntions', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  it('should warn about future deprecation of factory components', () => {
    ReactNoop.render(<HelloFactory />);
    expect(ReactNoop.flush).toWarnDev(createWarning('HelloFactory'), {
      withoutStack: true,
    });
  });

  it('should NOT warn about future deprecation of factory components in PRODUCTION', () => {
    spyOnProd(console, 'error');
    ReactNoop.render(<HelloFactory />);

    if (!__DEV__) {
      ReactNoop.flush();
      expect(console.error).toHaveBeenCalledTimes(0);
    }
  });

  it('should warn ONLY ONCE about future deprecation of factory components', () => {
    ReactNoop.render(<HelloFactory />);
    expect(ReactNoop.flush).toWarnDev(createWarning('HelloFactory'), {
      withoutStack: true,
    });

    if (__DEV__) {
      ReactNoop.render(<HelloFactory />);
      expect(ReactNoop.flush).not.toWarnDev(createWarning('HelloFactory'), {
        withoutStack: true,
      });
    }
  });

  it('should not warn about future deprecation of functional components', () => {
    function Hello(props) {
      return <div>Hello World</div>;
    }

    ReactNoop.render(<Hello />);

    if (__DEV__) {
      expect(ReactNoop.flush).not.toWarnDev(createWarning('Hello'), {
        withoutStack: true,
      });
    }
  });

  it('should not warn about future deprecation of class components', () => {
    class Hello extends React.Component {
      render() {
        return <div>Hello World</div>;
      }
    }

    ReactNoop.render(<Hello />);

    if (__DEV__) {
      expect(ReactNoop.flush).not.toWarnDev(createWarning('Hello'), {
        withoutStack: true,
      });
    }
  });
});
