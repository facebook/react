import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import TestRenderer from 'react-test-renderer';

let spy;
beforeEach(() => {
  spy = jest.spyOn(global.console, 'error');
});

function confirmWarning() {
  expect(spy).toHaveBeenCalledWith(
    expect.stringContaining(
      "It looks like you're using the wrong act() around your interactions."
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

it('warns when using the wrong act version - dom + test: render', () => {
  TestUtils.act(() => {
    TestRenderer.create(<App />);
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

// similarly react-art?
