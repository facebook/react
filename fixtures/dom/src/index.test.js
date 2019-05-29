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
import TestUtils from 'react-dom/test-utils';
import TestRenderer from 'react-test-renderer';

let spy;
beforeEach(() => {
  spy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

function confirmWarning() {
  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining(
      "It looks like you're using the wrong act() around your test interactions."
    ),
    ''
  );
}

function App(props) {
  return 'hello world';
}

it("doesn't warn when you use the right act + renderer: dom", () => {
  TestUtils.act(() => {
    TestUtils.renderIntoDocument(<App />);
  });
  expect(spy).not.toHaveBeenCalled();
});

it("doesn't warn when you use the right act + renderer: test", () => {
  TestRenderer.act(() => {
    TestRenderer.create(<App />);
  });
  expect(spy).not.toHaveBeenCalled();
});

it('works with createRoot().render combo', () => {
  const root = ReactDOM.unstable_createRoot(document.createElement('div'));
  TestRenderer.act(() => {
    root.render(<App />);
  });
  confirmWarning();
});

it('warns when using the wrong act version - test + dom: render', () => {
  TestRenderer.act(() => {
    TestUtils.renderIntoDocument(<App />);
  });
  confirmWarning();
});

it('warns when using the wrong act version - test + dom: updates', () => {
  let setCtr;
  function Counter(props) {
    const [ctr, _setCtr] = React.useState(0);
    setCtr = _setCtr;
    return ctr;
  }
  TestUtils.renderIntoDocument(<Counter />);
  TestRenderer.act(() => {
    setCtr(1);
  });
  confirmWarning();
});

it('warns when using the wrong act version - dom + test: .create()', () => {
  TestUtils.act(() => {
    TestRenderer.create(<App />);
  });
  confirmWarning();
});

it('warns when using the wrong act version - dom + test: .update()', () => {
  let root;
  // use the right one here so we don't get the first warning
  TestRenderer.act(() => {
    root = TestRenderer.create(<App key="one" />);
  });
  TestUtils.act(() => {
    root.update(<App key="two" />);
  });
  confirmWarning();
});

it('warns when using the wrong act version - dom + test: updates', () => {
  let setCtr;
  function Counter(props) {
    const [ctr, _setCtr] = React.useState(0);
    setCtr = _setCtr;
    return ctr;
  }
  const root = TestRenderer.create(<Counter />);
  TestUtils.act(() => {
    setCtr(1);
  });
  confirmWarning();
});
