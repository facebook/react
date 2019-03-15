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

  it('should work with updating a derived value from useState', () => {
    let _updateName;

    function SomeComponent({defaultName}) {
      const [name, updateName] = React.useState(defaultName);
      const [prevName, updatePrevName] = React.useState(defaultName);
      const [letter, updateLetter] = React.useState(name[0]);

      _updateName = updateName;

      if (name !== prevName) {
        updatePrevName(name);
        updateLetter(name[0]);
      }

      return (
        <div>
          <p>
            Your name is: <span>{name + ' (' + letter + ')'}</span>
          </p>
        </div>
      );
    }

    const shallowRenderer = createRenderer();
    let result = shallowRenderer.render(
      <SomeComponent defaultName={'Sophie'} />,
    );
    expect(result).toEqual(
      <div>
        <p>
          Your name is: <span>Sophie (S)</span>
        </p>
      </div>,
    );

    result = shallowRenderer.render(<SomeComponent defaultName={'Dan'} />);
    expect(result).toEqual(
      <div>
        <p>
          Your name is: <span>Sophie (S)</span>
        </p>
      </div>,
    );

    _updateName('Dan');
    expect(shallowRenderer.getRenderOutput()).toEqual(
      <div>
        <p>
          Your name is: <span>Dan (D)</span>
        </p>
      </div>,
    );
  });

  it('should work with useReducer', () => {
    function reducer(state, action) {
      switch (action.type) {
        case 'increment':
          return {count: state.count + 1};
        case 'decrement':
          return {count: state.count - 1};
      }
    }

    function SomeComponent(props) {
      const [state] = React.useReducer(reducer, props, p => ({
        count: p.initialCount,
      }));

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
    function reducer(state, action) {
      switch (action.type) {
        case 'increment':
          return {count: state.count + 1};
        case 'decrement':
          return {count: state.count - 1};
      }
    }

    function SomeComponent(props) {
      const [state, dispatch] = React.useReducer(reducer, props, p => ({
        count: p.initialCount,
      }));

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

  it('should work with with forwardRef + any hook', () => {
    const SomeComponent = React.forwardRef((props, ref) => {
      const randomNumberRef = React.useRef({number: Math.random()});

      return (
        <div ref={ref}>
          <p>The random number is: {randomNumberRef.current.number}</p>
        </div>
      );
    });

    const shallowRenderer = createRenderer();
    let firstResult = shallowRenderer.render(<SomeComponent />);
    let secondResult = shallowRenderer.render(<SomeComponent />);

    expect(firstResult).toEqual(secondResult);
  });

  it('should update a value from useState outside the render', () => {
    let _dispatch;

    function SomeComponent({defaultName}) {
      const [count, dispatch] = React.useReducer(
        (s, a) => (a === 'inc' ? s + 1 : s),
        0,
      );
      const [name, updateName] = React.useState(defaultName);
      _dispatch = () => dispatch('inc');

      return (
        <div onClick={() => updateName('Dan')}>
          <p>
            Your name is: <span>{name}</span> ({count})
          </p>
        </div>
      );
    }

    const shallowRenderer = createRenderer();
    const element = <SomeComponent defaultName={'Dominic'} />;
    const result = shallowRenderer.render(element);
    expect(result.props.children).toEqual(
      <p>
        Your name is: <span>Dominic</span> ({0})
      </p>,
    );

    result.props.onClick();
    let updated = shallowRenderer.render(element);
    expect(updated.props.children).toEqual(
      <p>
        Your name is: <span>Dan</span> ({0})
      </p>,
    );

    _dispatch('foo');
    updated = shallowRenderer.render(element);
    expect(updated.props.children).toEqual(
      <p>
        Your name is: <span>Dan</span> ({1})
      </p>,
    );

    _dispatch('inc');
    updated = shallowRenderer.render(element);
    expect(updated.props.children).toEqual(
      <p>
        Your name is: <span>Dan</span> ({2})
      </p>,
    );
  });

  it('should ignore a foreign update outside the render', () => {
    let _updateCountForFirstRender;

    function SomeComponent() {
      const [count, updateCount] = React.useState(0);
      if (!_updateCountForFirstRender) {
        _updateCountForFirstRender = updateCount;
      }
      return count;
    }

    const shallowRenderer = createRenderer();
    const element = <SomeComponent />;
    let result = shallowRenderer.render(element);
    expect(result).toEqual(0);
    _updateCountForFirstRender(1);
    result = shallowRenderer.render(element);
    expect(result).toEqual(1);

    shallowRenderer.unmount();
    result = shallowRenderer.render(element);
    expect(result).toEqual(0);
    _updateCountForFirstRender(1); // Should be ignored.
    result = shallowRenderer.render(element);
    expect(result).toEqual(0);
  });

  it('should not forget render phase updates', () => {
    let _updateCount;

    function SomeComponent() {
      const [count, updateCount] = React.useState(0);
      _updateCount = updateCount;
      if (count < 5) {
        updateCount(x => x + 1);
      }
      return count;
    }

    const shallowRenderer = createRenderer();
    const element = <SomeComponent />;
    let result = shallowRenderer.render(element);
    expect(result).toEqual(5);

    _updateCount(10);
    result = shallowRenderer.render(element);
    expect(result).toEqual(10);

    _updateCount(x => x + 1);
    result = shallowRenderer.render(element);
    expect(result).toEqual(11);

    _updateCount(x => x - 10);
    result = shallowRenderer.render(element);
    expect(result).toEqual(5);
  });
});
