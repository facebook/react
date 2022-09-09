/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 * @jest-environment node
 */

/* eslint-disable no-func-assign */

'use strict';

import {useInsertionEffect} from 'react';

describe('useEvent', () => {
  let React;
  let ReactNoop;
  let Scheduler;
  let act;
  let useState;
  let useEvent;
  let useEffect;
  let useLayoutEffect;

  beforeEach(() => {
    React = require('react');
    ReactNoop = require('react-noop-renderer');
    Scheduler = require('scheduler');

    // const ReactFeatureFlags = require('shared/ReactFeatureFlags');
    // ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;

    act = require('jest-react').act;
    useState = React.useState;
    useEvent = React.useEvent;
    useEffect = React.useEffect;
    useLayoutEffect = React.useLayoutEffect;
  });

  function span(prop) {
    return {type: 'span', hidden: false, children: [], prop};
  }

  function Text(props) {
    Scheduler.unstable_yieldValue(props.text);
    return <span prop={props.text} />;
  }

  it('memoizes basic case correctly', () => {
    class IncrementButton extends React.PureComponent {
      increment = () => {
        this.props.onClick();
      };
      render() {
        return <Text text="Increment" />;
      }
    }

    function Counter({incrementBy}) {
      const [count, updateCount] = useState(0);
      const onClick = useEvent(() => updateCount(c => c + incrementBy));

      return (
        <>
          <IncrementButton onClick={onClick} ref={button} />
          <Text text={'Count: ' + count} />
        </>
      );
    }

    const button = React.createRef(null);
    ReactNoop.render(<Counter incrementBy={1} />);
    expect(Scheduler).toFlushAndYield(['Increment', 'Count: 0']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 0'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      // Button should not re-render, because its props haven't changed
      'Count: 1',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 1'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      // Event should use the updated callback function closed over the new value.
      'Count: 2',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 2'),
    ]);

    // Increase the increment prop amount
    ReactNoop.render(<Counter incrementBy={10} />);
    expect(Scheduler).toFlushAndYield(['Count: 2']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 2'),
    ]);

    // Event uses the new prop
    act(button.current.increment);
    expect(Scheduler).toHaveYielded(['Count: 12']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 12'),
    ]);
  });

  it('throws when called in render', () => {
    class IncrementButton extends React.PureComponent {
      increment = () => {
        this.props.onClick();
      };

      render() {
        // Will throw.
        this.props.onClick();

        return <Text text="Increment" />;
      }
    }

    function Counter({incrementBy}) {
      const [count, updateCount] = useState(0);
      const onClick = useEvent(() => updateCount(c => c + incrementBy));

      return (
        <>
          <IncrementButton onClick={onClick} />
          <Text text={'Count: ' + count} />
        </>
      );
    }

    ReactNoop.render(<Counter incrementBy={1} />);
    expect(Scheduler).toFlushAndThrow(
      'An event from useEvent was called during render',
    );

    // TODO: Why?
    expect(Scheduler).toHaveYielded(['Count: 0', 'Count: 0']);
  });

  it('useLayoutEffect shouldn’t re-fire when event handlers change', () => {
    class IncrementButton extends React.PureComponent {
      increment = () => {
        this.props.onClick();
      };
      render() {
        return <Text text="Increment" />;
      }
    }

    function Counter({incrementBy}) {
      const [count, updateCount] = useState(0);
      const increment = useEvent(amount =>
        updateCount(c => c + (amount || incrementBy)),
      );

      useLayoutEffect(() => {
        Scheduler.unstable_yieldValue('Effect: by ' + incrementBy * 2);
        increment(incrementBy * 2);
      }, [incrementBy]);

      return (
        <>
          <IncrementButton onClick={increment} ref={button} />
          <Text text={'Count: ' + count} />
        </>
      );
    }

    const button = React.createRef(null);
    ReactNoop.render(<Counter incrementBy={1} />);
    expect(Scheduler).toHaveYielded([]);
    expect(Scheduler).toFlushAndYield([
      'Increment',
      'Count: 0',
      'Effect: by 2',
      'Count: 2',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 2'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      // Effect should not re-run because the dependency hasn't changed.
      'Count: 3',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 3'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      // Event should use the updated callback function closed over the new value.
      'Count: 4',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 4'),
    ]);

    // Increase the increment prop amount
    ReactNoop.render(<Counter incrementBy={10} />);
    expect(Scheduler).toFlushAndYield([
      'Count: 4',
      'Effect: by 20',
      'Count: 24',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 24'),
    ]);

    // Event uses the new prop
    act(button.current.increment);
    expect(Scheduler).toHaveYielded(['Count: 34']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 34'),
    ]);
  });

  it('useEffect shouldn’t re-fire when event handlers change', () => {
    class IncrementButton extends React.PureComponent {
      increment = () => {
        this.props.onClick();
      };
      render() {
        return <Text text="Increment" />;
      }
    }

    function Counter({incrementBy}) {
      const [count, updateCount] = useState(0);
      const increment = useEvent(amount =>
        updateCount(c => c + (amount || incrementBy)),
      );

      useEffect(() => {
        Scheduler.unstable_yieldValue('Effect: by ' + incrementBy * 2);
        increment(incrementBy * 2);
      }, [incrementBy]);

      return (
        <>
          <IncrementButton onClick={increment} ref={button} />
          <Text text={'Count: ' + count} />
        </>
      );
    }

    const button = React.createRef(null);
    ReactNoop.render(<Counter incrementBy={1} />);
    expect(Scheduler).toFlushAndYield([
      'Increment',
      'Count: 0',
      'Effect: by 2',
      'Count: 2',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 2'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      // Effect should not re-run because the dependency hasn't changed.
      'Count: 3',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 3'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      // Event should use the updated callback function closed over the new value.
      'Count: 4',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 4'),
    ]);

    // Increase the increment prop amount
    ReactNoop.render(<Counter incrementBy={10} />);
    expect(Scheduler).toFlushAndYield([
      'Count: 4',
      'Effect: by 20',
      'Count: 24',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 24'),
    ]);

    // Event uses the new prop
    act(button.current.increment);
    expect(Scheduler).toHaveYielded(['Count: 34']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 34'),
    ]);
  });

  it('is stable in a custom hook', () => {
    class IncrementButton extends React.PureComponent {
      increment = () => {
        this.props.onClick();
      };
      render() {
        return <Text text="Increment" />;
      }
    }

    function useCount(incrementBy) {
      const [count, updateCount] = useState(0);
      const increment = useEvent(amount =>
        updateCount(c => c + (amount || incrementBy)),
      );

      return [count, increment];
    }

    function Counter({incrementBy}) {
      const [count, increment] = useCount(incrementBy);

      useEffect(() => {
        Scheduler.unstable_yieldValue('Effect: by ' + incrementBy * 2);
        increment(incrementBy * 2);
      }, [incrementBy]);

      return (
        <>
          <IncrementButton onClick={increment} ref={button} />
          <Text text={'Count: ' + count} />
        </>
      );
    }

    const button = React.createRef(null);
    ReactNoop.render(<Counter incrementBy={1} />);
    expect(Scheduler).toFlushAndYield([
      'Increment',
      'Count: 0',
      'Effect: by 2',
      'Count: 2',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 2'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      // Effect should not re-run because the dependency hasn't changed.
      'Count: 3',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 3'),
    ]);

    act(button.current.increment);
    expect(Scheduler).toHaveYielded([
      // Event should use the updated callback function closed over the new value.
      'Count: 4',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 4'),
    ]);

    // Increase the increment prop amount
    ReactNoop.render(<Counter incrementBy={10} />);
    expect(Scheduler).toFlushAndYield([
      'Count: 4',
      'Effect: by 20',
      'Count: 24',
    ]);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 24'),
    ]);

    // Event uses the new prop
    act(button.current.increment);
    expect(Scheduler).toHaveYielded(['Count: 34']);
    expect(ReactNoop.getChildren()).toEqual([
      span('Increment'),
      span('Count: 34'),
    ]);
  });

  it('is mutated before all other effects', () => {
    function Counter({value}) {
      useInsertionEffect(() => {
        Scheduler.unstable_yieldValue('Effect value: ' + value);
        increment();
      }, [value]);

      // This is defined after the insertion effect, but it should
      // update the event fn _before_ the insertion effect fires.
      const increment = useEvent(() => {
        Scheduler.unstable_yieldValue('Event value: ' + value);
      });

      return (
        <>
        </>
      );
    }

    ReactNoop.render(<Counter value={1} />);
    expect(Scheduler).toFlushAndYield([
      'Effect value: 1',
      'Event value: 1',
    ]);


    act(() => ReactNoop.render(<Counter value={2} />));
    expect(Scheduler).toHaveYielded([
      'Effect value: 2',
      'Event value: 2',
    ]);
  });
});
