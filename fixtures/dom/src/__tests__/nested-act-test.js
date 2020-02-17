/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

let React;
let ReactDOM;
let TestRenderer;

global.__DEV__ = process.env.NODE_ENV !== 'production';

jest.mock('react-dom', () =>
  require.requireActual('react-dom/cjs/react-dom-testing.development.js')
);
// we'll replace the above with react/testing and react-dom/testing right before the next minor

expect.extend(require('../toWarnDev'));

describe('unmocked scheduler', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    TestRenderer = require('react-test-renderer');
  });

  it('flushes work only outside the outermost act() corresponding to its own renderer', () => {
    let log = [];
    function Effecty() {
      React.useEffect(() => {
        log.push('called');
      }, []);
      return null;
    }
    // in legacy mode, this tests whether an act only flushes its own effects
    TestRenderer.act(() => {
      ReactDOM.act(() => {
        TestRenderer.create(<Effecty />);
      });
      expect(log).toEqual([]);
    });
    expect(log).toEqual(['called']);

    log = [];
    // for doublechecking, we flip it inside out, and assert on the outermost
    ReactDOM.act(() => {
      TestRenderer.act(() => {
        TestRenderer.create(<Effecty />);
      });
      expect(log).toEqual(['called']);
    });
    expect(log).toEqual(['called']);
  });
});

describe('mocked scheduler', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('scheduler', () =>
      require.requireActual('scheduler/unstable_mock')
    );
    React = require('react');
    ReactDOM = require('react-dom');
    TestRenderer = require('react-test-renderer');
  });

  afterEach(() => {
    jest.unmock('scheduler');
  });

  it('flushes work only outside the outermost act()', () => {
    let log = [];
    function Effecty() {
      React.useEffect(() => {
        log.push('called');
      }, []);
      return null;
    }
    // with a mocked scheduler, this tests whether it flushes all work only on the outermost act
    TestRenderer.act(() => {
      ReactDOM.act(() => {
        TestRenderer.create(<Effecty />);
      });
      expect(log).toEqual([]);
    });
    expect(log).toEqual(['called']);

    log = [];
    // for doublechecking, we flip it inside out, and assert on the outermost
    ReactDOM.act(() => {
      TestRenderer.act(() => {
        TestRenderer.create(<Effecty />);
      });
      expect(log).toEqual([]);
    });
    expect(log).toEqual(['called']);
  });
});
