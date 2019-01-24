/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

'use strict';

let createRenderer;
let React;

describe('ReactShallowRenderer with hooks', () => {
  beforeEach(() => {
    jest.resetModules();
    createRenderer = require('react-test-renderer/shallow').createRenderer;
    React = require('react');
  });

  it('should work with useState', () => {
    function SomeComponent({defaultName}) {
      const [name] = React.useState(defaultName);

      return (
        <div>
          <p>
            Your name is: <span>{name}</span>
          </p>
        </div>
      );
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(
      <SomeComponent defaultName={'Dominic'} />,
    );

    expect(result).toEqual(
      <div>
        <p>
          Your name is: <span>Dominic</span>
        </p>
      </div>,
    );

    result = shallowRenderer.render(
      <SomeComponent defaultName={'Should not use this name'} />,
    );

    expect(result).toEqual(
      <div>
        <p>
          Your name is: <span>Dominic</span>
        </p>
      </div>,
    );
  });

  it('should work with updating a value from useState', () => {
    function SomeComponent({defaultName}) {
      const [name, updateName] = React.useState(defaultName);

      if (name !== 'Dan') {
        updateName('Dan');
      }

      return (
        <div>
          <p>
            Your name is: <span>{name}</span>
          </p>
        </div>
      );
    }

    const shallowRenderer = createRenderer();
    const result = shallowRenderer.render(
      <SomeComponent defaultName={'Dominic'} />,
    );

    expect(result).toEqual(
      <div>
        <p>
          Your name is: <span>Dan</span>
        </p>
      </div>,
    );
  });

  it('should work with useReducer', () => {
    const initialState = {count: 0};

    function reducer(state, action) {
      switch (action.type) {
        case 'reset':
          return initialState;
        case 'increment':
          return {count: state.count + 1};
        case 'decrement':
          return {count: state.count - 1};
        default:
          return state;
      }
    }

    function SomeComponent({initialCount}) {
      const [state] = React.useReducer(reducer, {count: initialCount});

      return (
        <div>
          <p>
            The counter is at: <span>{state.count.toString()}</span>
          </p>
        </div>
      );
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(<SomeComponent initialCount={0} />);

    expect(result).toEqual(
      <div>
        <p>
          The counter is at: <span>0</span>
        </p>
      </div>,
    );

    result = shallowRenderer.render(<SomeComponent initialCount={10} />);

    expect(result).toEqual(
      <div>
        <p>
          The counter is at: <span>0</span>
        </p>
      </div>,
    );
  });

  it('should work with a dispatched state change for a useReducer', () => {
    const initialState = {count: 0};

    function reducer(state, action) {
      switch (action.type) {
        case 'reset':
          return initialState;
        case 'increment':
          return {count: state.count + 1};
        case 'decrement':
          return {count: state.count - 1};
        default:
          return state;
      }
    }

    function SomeComponent({initialCount}) {
      const [state, dispatch] = React.useReducer(reducer, {
        count: initialCount,
      });

      if (state.count === 0) {
        dispatch({type: 'increment'});
      }

      return (
        <div>
          <p>
            The counter is at: <span>{state.count.toString()}</span>
          </p>
        </div>
      );
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(<SomeComponent initialCount={0} />);

    expect(result).toEqual(
      <div>
        <p>
          The counter is at: <span>1</span>
        </p>
      </div>,
    );
  });

  it('should not trigger effects', () => {
    let effectsCalled = [];

    function SomeComponent({defaultName}) {
      React.useEffect(() => {
        effectsCalled.push('useEffect');
      });

      React.useLayoutEffect(() => {
        effectsCalled.push('useEffect');
      });

      return <div>Hello world</div>;
    }

    const shallowRenderer = createRenderer();
    shallowRenderer.render(<SomeComponent />);

    expect(effectsCalled).toEqual([]);
  });

  it('should work with useRef', () => {
    function SomeComponent() {
      const randomNumberRef = React.useRef({number: Math.random()});

      return (
        <div>
          <p>The random number is: {randomNumberRef.current.number}</p>
        </div>
      );
    }

    const shallowRenderer = createRenderer();
    let firstResult = shallowRenderer.render(<SomeComponent />);
    let secondResult = shallowRenderer.render(<SomeComponent />);

    expect(firstResult).toEqual(secondResult);
  });

  it('should work with useMemo', () => {
    function SomeComponent() {
      const randomNumber = React.useMemo(() => {
        return {number: Math.random()};
      }, []);

      return (
        <div>
          <p>The random number is: {randomNumber.number}</p>
        </div>
      );
    }

    const shallowRenderer = createRenderer();
    let firstResult = shallowRenderer.render(<SomeComponent />);
    let secondResult = shallowRenderer.render(<SomeComponent />);

    expect(firstResult).toEqual(secondResult);
  });

  it('should work with useContext', () => {
    const SomeContext = React.createContext('default');

    function SomeComponent() {
      const value = React.useContext(SomeContext);

      return (
        <div>
          <p>{value}</p>
        </div>
      );
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(<SomeComponent />);

    expect(result).toEqual(
      <div>
        <p>default</p>
      </div>,
    );
  });

  it('should not leak state when component type changes', () => {
    function SomeComponent({defaultName}) {
      const [name] = React.useState(defaultName);

      return (
        <div>
          <p>
            Your name is: <span>{name}</span>
          </p>
        </div>
      );
    }

    function SomeOtherComponent({defaultName}) {
      const [name] = React.useState(defaultName);

      return (
        <div>
          <p>
            Your name is: <span>{name}</span>
          </p>
        </div>
      );
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(
      <SomeComponent defaultName={'Dominic'} />,
    );
    expect(result).toEqual(
      <div>
        <p>
          Your name is: <span>Dominic</span>
        </p>
      </div>,
    );

    result = shallowRenderer.render(<SomeOtherComponent defaultName={'Dan'} />);
    expect(result).toEqual(
      <div>
        <p>
          Your name is: <span>Dan</span>
        </p>
      </div>,
    );
  });
});
