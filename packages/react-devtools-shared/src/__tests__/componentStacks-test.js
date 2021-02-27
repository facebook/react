/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

function normalizeCodeLocInfo(str) {
  if (typeof str !== 'string') {
    return str;
  }
  // This special case exists only for the special source location in
  // ReactElementValidator. That will go away if we remove source locations.
  str = str.replace(/Check your code at .+?:\d+/g, 'Check your code at **');
  // V8 format:
  //  at Component (/path/filename.js:123:45)
  // React format:
  //    in Component (at filename.js:123)
  return str.replace(/\n +(?:at|in) ([\S]+)[^\n]*/g, function(m, name) {
    return '\n    in ' + name + ' (at **)';
  });
}

describe('component stack', () => {
  let React;
  let ReactDOM;
  let act;
  let mockError;
  let mockWarn;

  beforeEach(() => {
    // Intercept native console methods before DevTools bootstraps.
    // Normalize component stack locations.
    mockError = jest.fn();
    mockWarn = jest.fn();
    console.error = (...args) => {
      mockError(...args.map(normalizeCodeLocInfo));
    };
    console.warn = (...args) => {
      mockWarn(...args.map(normalizeCodeLocInfo));
    };

    const utils = require('./utils');
    act = utils.act;

    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should log the current component stack along with an error or warning', () => {
    const Grandparent = () => <Parent />;
    const Parent = () => <Child />;
    const Child = () => {
      console.error('Test error.');
      console.warn('Test warning.');
      return null;
    };

    const container = document.createElement('div');

    act(() => ReactDOM.render(<Grandparent />, container));

    expect(mockError).toHaveBeenCalledWith(
      'Test error.',
      '\n    in Child (at **)' +
        '\n    in Parent (at **)' +
        '\n    in Grandparent (at **)',
    );
    expect(mockWarn).toHaveBeenCalledWith(
      'Test warning.',
      '\n    in Child (at **)' +
        '\n    in Parent (at **)' +
        '\n    in Grandparent (at **)',
    );
  });

  // This test should have caught #19911
  // but didn't because both DevTools and ReactDOM are running in the same memory space,
  // so the case we're testing against (DevTools prod build and React DEV build) doesn't exist.
  // It would be nice to figure out a way to test this combination at some point...
  xit('should disable the current dispatcher before shallow rendering so no effects get scheduled', () => {
    let useEffectCount = 0;

    const Example = props => {
      React.useEffect(() => {
        useEffectCount++;
        expect(props).toBeDefined();
      }, [props]);
      console.warn('Warning to trigger appended component stacks.');
      return null;
    };

    const container = document.createElement('div');
    act(() => ReactDOM.render(<Example test="abc" />, container));

    expect(useEffectCount).toBe(1);

    expect(mockWarn).toHaveBeenCalledWith(
      'Warning to trigger appended component stacks.',
      '\n    in Example (at **)',
    );
  });
});
