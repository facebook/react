/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;

describe('ReactDOMHooks', () => {
  let container;

  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');

    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('can ReactDOM.render() from useEffect', () => {
    let container2 = document.createElement('div');
    let container3 = document.createElement('div');

    function Example1({n}) {
      React.useEffect(() => {
        ReactDOM.render(<Example2 n={n} />, container2);
      });
      return 1 * n;
    }

    function Example2({n}) {
      React.useEffect(() => {
        ReactDOM.render(<Example3 n={n} />, container3);
      });
      return 2 * n;
    }

    function Example3({n}) {
      return 3 * n;
    }

    ReactDOM.render(<Example1 n={1} />, container);
    expect(container.textContent).toBe('1');
    expect(container2.textContent).toBe('');
    expect(container3.textContent).toBe('');
    jest.runAllTimers();
    expect(container.textContent).toBe('1');
    expect(container2.textContent).toBe('2');
    expect(container3.textContent).toBe('3');

    ReactDOM.render(<Example1 n={2} />, container);
    expect(container.textContent).toBe('2');
    expect(container2.textContent).toBe('2'); // Not flushed yet
    expect(container3.textContent).toBe('3'); // Not flushed yet
    jest.runAllTimers();
    expect(container.textContent).toBe('2');
    expect(container2.textContent).toBe('4');
    expect(container3.textContent).toBe('6');
  });

  it('can batch synchronous work inside effects with other work', () => {
    let otherContainer = document.createElement('div');

    let calledA = false;
    function A() {
      calledA = true;
      return 'A';
    }

    let calledB = false;
    function B() {
      calledB = true;
      return 'B';
    }

    let _set;
    function Foo() {
      _set = React.useState(0)[1];
      React.useEffect(() => {
        ReactDOM.render(<A />, otherContainer);
      });
      return null;
    }

    ReactDOM.render(<Foo />, container);
    ReactDOM.unstable_batchedUpdates(() => {
      _set(0); // Forces the effect to be flushed
      expect(otherContainer.textContent).toBe('');
      ReactDOM.render(<B />, otherContainer);
      expect(otherContainer.textContent).toBe('');
    });
    expect(otherContainer.textContent).toBe('B');
    expect(calledA).toBe(false); // It was in a batch
    expect(calledB).toBe(true);
  });

  it('should not bail out when an update is scheduled from within an event handler', () => {
    const {createRef, useCallback, useState} = React;

    const Example = ({inputRef, labelRef}) => {
      const [text, setText] = useState('');
      const handleInput = useCallback(event => {
        setText(event.target.value);
      });

      return (
        <React.Fragment>
          <input ref={inputRef} onInput={handleInput} />
          <label ref={labelRef}>{text}</label>
        </React.Fragment>
      );
    };

    const inputRef = createRef();
    const labelRef = createRef();

    ReactDOM.render(
      <Example inputRef={inputRef} labelRef={labelRef} />,
      container,
    );

    inputRef.current.value = 'abc';
    inputRef.current.dispatchEvent(
      new Event('input', {bubbles: true, cancelable: true}),
    );

    expect(labelRef.current.innerHTML).toBe('abc');
  });

  it('should not bail out when an update is scheduled from within an event handler in ConcurrentMode', () => {
    const {createRef, useCallback, useState} = React;

    const Example = ({inputRef, labelRef}) => {
      const [text, setText] = useState('');
      const handleInput = useCallback(event => {
        setText(event.target.value);
      });

      return (
        <React.Fragment>
          <input ref={inputRef} onInput={handleInput} />
          <label ref={labelRef}>{text}</label>
        </React.Fragment>
      );
    };

    const inputRef = createRef();
    const labelRef = createRef();

    const root = ReactDOM.unstable_createRoot(container);
    root.render(
      <React.unstable_ConcurrentMode>
        <Example inputRef={inputRef} labelRef={labelRef} />
      </React.unstable_ConcurrentMode>,
    );

    jest.runAllTimers();

    inputRef.current.value = 'abc';
    inputRef.current.dispatchEvent(
      new Event('input', {bubbles: true, cancelable: true}),
    );

    jest.runAllTimers();

    expect(labelRef.current.innerHTML).toBe('abc');
  });
});
