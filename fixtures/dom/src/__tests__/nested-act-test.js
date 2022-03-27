/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

let React;
let DOMAct;
let TestRenderer;
let TestAct;

global.__DEV__ = process.env.NODE_ENV !== 'production';

expect.extend(require('../toWarnDev'));

/**
 * Helper function for flush tests.
 * @param  React
 * @param  TestRenderer
 * @param  TestAct
 */
function testFlush(React, TestRenderer, TestAct) {
  let log = [];
  function Effecty() {
    React.useEffect(() => {
      log.push('called');
    }, []);
    return null;
  }

  TestAct(() => {
    DOMAct(() => {
      TestRenderer.create(<Effecty />);
    });
    expect(log).toEqual([]);
  });
  expect(log).toEqual(['called']);

  log = [];
  // for doublechecking, we flip it inside out, and assert on the outermost
  DOMAct(() => {
    TestAct(() => {
      TestRenderer.create(<Effecty />);
    });
    expect(log).toEqual([]);
  });
  expect(log).toEqual(['called']);
}

describe('unmocked scheduler', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    DOMAct = require('react-dom/test-utils').act;
    TestRenderer = require('react-test-renderer');
    TestAct = TestRenderer.act;
  });

  it('flushes work only outside the outermost act() corresponding to its own renderer', () => {
    // in legacy mode, this tests whether an act only flushes its own effects
    testFlush(React, TestRenderer, TestAct);
  });
});

describe('mocked scheduler', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('scheduler', () =>
      require.requireActual('scheduler/unstable_mock')
    );
    React = require('react');
    DOMAct = require('react-dom/test-utils').act;
    TestRenderer = require('react-test-renderer');
    TestAct = TestRenderer.act;
  });

  afterEach(() => {
    jest.unmock('scheduler');
  });

  it('flushes work only outside the outermost act()', () => {
    // with a mocked scheduler, this tests whether it flushes all work only on the outermost act
    testFlush(React, TestRenderer, TestAct);
  });
});
