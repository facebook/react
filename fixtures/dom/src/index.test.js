/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

import React from 'react';
import ReactDOM from 'react-dom';
import ReactART from 'react-art';
import ARTSVGMode from 'art/modes/svg';
import ARTCurrentMode from 'art/modes/current';
import TestUtils from 'react-dom/test-utils';
import TestRenderer from 'react-test-renderer';

ARTCurrentMode.setCurrent(ARTSVGMode);

global.__DEV__ = process.env.NODE_ENV !== 'production';

expect.extend(require('./toWarnDev'));

function App(props) {
  return 'hello world';
}

it("doesn't warn when you use the right act + renderer: dom", () => {
  TestUtils.act(() => {
    TestUtils.renderIntoDocument(<App />);
  });
});

it("doesn't warn when you use the right act + renderer: test", () => {
  TestRenderer.act(() => {
    TestRenderer.create(<App />);
  });
});

it('warns when using createRoot() + .render', () => {
  const root = ReactDOM.unstable_createRoot(document.createElement('div'));
  expect(() => {
    TestRenderer.act(() => {
      root.render(<App />);
    });
  }).toWarnDev(["It looks like you're using the wrong act()"], {
    withoutStack: true,
  });
});

it('warns when using the wrong act version - test + dom: render', () => {
  expect(() => {
    TestRenderer.act(() => {
      TestUtils.renderIntoDocument(<App />);
    });
  }).toWarnDev(["It looks like you're using the wrong act()"], {
    withoutStack: true,
  });
});

it('warns when using the wrong act version - test + dom: updates', () => {
  let setCtr;
  function Counter(props) {
    const [ctr, _setCtr] = React.useState(0);
    setCtr = _setCtr;
    return ctr;
  }
  TestUtils.renderIntoDocument(<Counter />);
  expect(() => {
    TestRenderer.act(() => {
      setCtr(1);
    });
  }).toWarnDev([
    'An update to Counter inside a test was not wrapped in act',
    "It looks like you're using the wrong act()",
  ]);
});

it('warns when using the wrong act version - dom + test: .create()', () => {
  expect(() => {
    TestUtils.act(() => {
      TestRenderer.create(<App />);
    });
  }).toWarnDev(["It looks like you're using the wrong act()"], {
    withoutStack: true,
  });
});

it('warns when using the wrong act version - dom + test: .update()', () => {
  const root = TestRenderer.create(<App key="one" />);
  expect(() => {
    TestUtils.act(() => {
      root.update(<App key="two" />);
    });
  }).toWarnDev(["It looks like you're using the wrong act()"], {
    withoutStack: true,
  });
});

it('warns when using the wrong act version - dom + test: updates', () => {
  let setCtr;
  function Counter(props) {
    const [ctr, _setCtr] = React.useState(0);
    setCtr = _setCtr;
    return ctr;
  }
  const root = TestRenderer.create(<Counter />);
  expect(() => {
    TestUtils.act(() => {
      setCtr(1);
    });
  }).toWarnDev([
    'An update to Counter inside a test was not wrapped in act',
    "It looks like you're using the wrong act()",
  ]);
});
