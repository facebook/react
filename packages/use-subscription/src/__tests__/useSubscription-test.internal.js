/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let act;
let useSubscription;
let BehaviorSubject;
let React;
let ReactTestRenderer;
let Scheduler;
let ReplaySubject;

describe('useSubscription', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.mock('scheduler', () => require('scheduler/unstable_mock'));

    useSubscription = require('use-subscription').useSubscription;
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
    Scheduler = require('scheduler');

    act = ReactTestRenderer.act;

    BehaviorSubject = require('rxjs').BehaviorSubject;
    ReplaySubject = require('rxjs').ReplaySubject;
  });

  function createBehaviorSubject(initialValue) {
    const behaviorSubject = new BehaviorSubject();
    if (initialValue) {
      behaviorSubject.next(initialValue);
    }
    return behaviorSubject;
  }

  function createReplaySubject(initialValue) {
    const replaySubject = new ReplaySubject();
    if (initialValue) {
      replaySubject.next(initialValue);
    }
    return replaySubject;
  }

  it('supports basic subscription pattern', () => {
    function Child({value = 'default'}) {
      Scheduler.unstable_yieldValue(value);
      return null;
    }

    function Subscription({source}) {
      const value = useSubscription(
        React.useMemo(
          () => ({
            getCurrentValue: () => source.getValue(),
            subscribe: callback => {
              const subscription = source.subscribe(callback);
              return () => subscription.unsubscribe();
            },
          }),
          [source],
        ),
      );
      return <Child value={value} />;
    }

    const observable = createBehaviorSubject();
    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <Subscription source={observable} />,
        {unstable_isConcurrent: true},
      );
    });
    expect(Scheduler).toHaveYielded(['default']);

    // Updates while subscribed should re-render the child component
    act(() => observable.next(123));
    expect(Scheduler).toHaveYielded([123]);
    act(() => observable.next('abc'));
    expect(Scheduler).toHaveYielded(['abc']);

    // Unmounting the subscriber should remove listeners
    act(() => renderer.update(<div />));
    act(() => observable.next(456));
    expect(Scheduler).toFlushAndYield([]);
  });

  it('should support observable types like RxJS ReplaySubject', () => {
    function Child({value = 'default'}) {
      Scheduler.unstable_yieldValue(value);
      return null;
    }

    function Subscription({source}) {
      const value = useSubscription(
        React.useMemo(
          () => ({
            getCurrentValue: () => {
              let currentValue;
              source
                .subscribe(tempValue => {
                  currentValue = tempValue;
                })
                .unsubscribe();
              return currentValue;
            },
            subscribe: callback => {
              const subscription = source.subscribe(callback);
              return () => subscription.unsubscribe();
            },
          }),
          [source],
        ),
      );
      return <Child value={value} />;
    }

    let observable = createReplaySubject('initial');
    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <Subscription source={observable} />,
        {unstable_isConcurrent: true},
      );
    });
    expect(Scheduler).toHaveYielded(['initial']);
    act(() => observable.next('updated'));
    expect(Scheduler).toHaveYielded(['updated']);

    Scheduler.unstable_flushAll();

    // Unsetting the subscriber prop should reset subscribed values
    observable = createReplaySubject(undefined);
    act(() => renderer.update(<Subscription source={observable} />));
    expect(Scheduler).toHaveYielded(['default']);
  });

  it('should unsubscribe from old sources and subscribe to new sources when memoized props change', () => {
    function Child({value = 'default'}) {
      Scheduler.unstable_yieldValue(value);
      return null;
    }

    let subscriptions = [];

    function Subscription({source}) {
      const value = useSubscription(
        React.useMemo(
          () => ({
            getCurrentValue: () => source.getValue(),
            subscribe: callback => {
              subscriptions.push(source);
              const subscription = source.subscribe(callback);
              return () => subscription.unsubscribe();
            },
          }),
          [source],
        ),
      );
      return <Child value={value} />;
    }

    const observableA = createBehaviorSubject('a-0');
    const observableB = createBehaviorSubject('b-0');

    expect(subscriptions).toHaveLength(0);

    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <Subscription source={observableA} />,
        {unstable_isConcurrent: true},
      );
    });

    // Updates while subscribed should re-render the child component
    expect(Scheduler).toHaveYielded(['a-0']);
    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0]).toBe(observableA);

    // Unsetting the subscriber prop should reset subscribed values
    act(() => renderer.update(<Subscription source={observableB} />));

    expect(Scheduler).toHaveYielded(['b-0']);
    expect(subscriptions).toHaveLength(2);
    expect(subscriptions[1]).toBe(observableB);

    // Updates to the old subscribable should not re-render the child component
    act(() => observableA.next('a-1'));
    expect(Scheduler).toFlushAndYield([]);

    // Updates to the bew subscribable should re-render the child component
    act(() => observableB.next('b-1'));
    expect(Scheduler).toHaveYielded(['b-1']);

    expect(subscriptions).toHaveLength(2);
  });

  it('should unsubscribe from old sources and subscribe to new sources when useCallback functions change', () => {
    function Child({value = 'default'}) {
      Scheduler.unstable_yieldValue(value);
      return null;
    }

    let subscriptions = [];

    function Subscription({source}) {
      const value = useSubscription({
        getCurrentValue: React.useCallback(() => source.getValue(), [source]),
        subscribe: React.useCallback(
          callback => {
            subscriptions.push(source);
            const subscription = source.subscribe(callback);
            return () => subscription.unsubscribe();
          },
          [source],
        ),
      });
      return <Child value={value} />;
    }

    const observableA = createBehaviorSubject('a-0');
    const observableB = createBehaviorSubject('b-0');

    expect(subscriptions).toHaveLength(0);

    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <Subscription source={observableA} />,
        {unstable_isConcurrent: true},
      );
    });

    // Updates while subscribed should re-render the child component
    expect(Scheduler).toHaveYielded(['a-0']);
    expect(subscriptions).toHaveLength(1);
    expect(subscriptions[0]).toBe(observableA);

    // Unsetting the subscriber prop should reset subscribed values
    act(() => renderer.update(<Subscription source={observableB} />));
    expect(Scheduler).toHaveYielded(['b-0']);
    expect(subscriptions).toHaveLength(2);
    expect(subscriptions[1]).toBe(observableB);

    // Updates to the old subscribable should not re-render the child component
    act(() => observableA.next('a-1'));
    expect(Scheduler).toFlushAndYield([]);

    // Updates to the bew subscribable should re-render the child component
    act(() => observableB.next('b-1'));
    expect(Scheduler).toHaveYielded(['b-1']);

    expect(subscriptions).toHaveLength(2);
  });

  it('should ignore values emitted by a new subscribable until the commit phase', () => {
    const log = [];

    function Grandchild({value}) {
      Scheduler.unstable_yieldValue('Grandchild: ' + value);
      return null;
    }

    function Child({value = 'default'}) {
      Scheduler.unstable_yieldValue('Child: ' + value);
      return <Grandchild value={value} />;
    }

    function Subscription({source}) {
      const value = useSubscription(
        React.useMemo(
          () => ({
            getCurrentValue: () => source.getValue(),
            subscribe: callback => {
              const subscription = source.subscribe(callback);
              return () => subscription.unsubscribe();
            },
          }),
          [source],
        ),
      );
      return <Child value={value} />;
    }

    class Parent extends React.Component {
      state = {};

      static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.observed !== prevState.observed) {
          return {
            observed: nextProps.observed,
          };
        }

        return null;
      }

      componentDidMount() {
        log.push('Parent.componentDidMount');
      }

      componentDidUpdate() {
        log.push('Parent.componentDidUpdate');
      }

      render() {
        return <Subscription source={this.state.observed} />;
      }
    }

    const observableA = createBehaviorSubject('a-0');
    const observableB = createBehaviorSubject('b-0');

    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(<Parent observed={observableA} />, {
        unstable_isConcurrent: true,
      });
    });
    expect(Scheduler).toHaveYielded(['Child: a-0', 'Grandchild: a-0']);
    expect(log).toEqual(['Parent.componentDidMount']);

    // Start React update, but don't finish
    act(() => {
      renderer.update(<Parent observed={observableB} />);
      expect(Scheduler).toFlushAndYieldThrough(['Child: b-0']);
      expect(log).toEqual(['Parent.componentDidMount']);

      // Emit some updates from the uncommitted subscribable
      observableB.next('b-1');
      observableB.next('b-2');
      observableB.next('b-3');
    });

    // Update again
    act(() => renderer.update(<Parent observed={observableA} />));

    // Flush everything and ensure that the correct subscribable is used
    // We expect the last emitted update to be rendered (because of the commit phase value check)
    // But the intermediate ones should be ignored,
    // And the final rendered output should be the higher-priority observable.
    expect(Scheduler).toHaveYielded([
      'Grandchild: b-0',
      'Child: b-3',
      'Grandchild: b-3',
      'Child: a-0',
      'Grandchild: a-0',
    ]);
    expect(log).toEqual([
      'Parent.componentDidMount',
      'Parent.componentDidUpdate',
      'Parent.componentDidUpdate',
    ]);
  });

  it('should not drop values emitted between updates', () => {
    const log = [];

    function Grandchild({value}) {
      Scheduler.unstable_yieldValue('Grandchild: ' + value);
      return null;
    }

    function Child({value = 'default'}) {
      Scheduler.unstable_yieldValue('Child: ' + value);
      return <Grandchild value={value} />;
    }

    function Subscription({source}) {
      const value = useSubscription(
        React.useMemo(
          () => ({
            getCurrentValue: () => source.getValue(),
            subscribe: callback => {
              const subscription = source.subscribe(callback);
              return () => subscription.unsubscribe();
            },
          }),
          [source],
        ),
      );
      return <Child value={value} />;
    }

    class Parent extends React.Component {
      state = {};

      static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.observed !== prevState.observed) {
          return {
            observed: nextProps.observed,
          };
        }

        return null;
      }

      componentDidMount() {
        log.push('Parent.componentDidMount:' + this.props.observed.value);
      }

      componentDidUpdate() {
        log.push('Parent.componentDidUpdate:' + this.props.observed.value);
      }

      render() {
        return <Subscription source={this.state.observed} />;
      }
    }

    const observableA = createBehaviorSubject('a-0');
    const observableB = createBehaviorSubject('b-0');

    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(<Parent observed={observableA} />, {
        unstable_isConcurrent: true,
      });
    });
    expect(Scheduler).toHaveYielded(['Child: a-0', 'Grandchild: a-0']);
    expect(log).toEqual(['Parent.componentDidMount:a-0']);
    log.splice(0);

    // Start React update, but don't finish
    act(() => {
      renderer.update(<Parent observed={observableB} />);
      expect(Scheduler).toFlushAndYieldThrough(['Child: b-0']);
      expect(log).toEqual([]);

      // Emit some updates from the old subscribable
      observableA.next('a-1');
      observableA.next('a-2');

      // Update again
      renderer.update(<Parent observed={observableA} />);

      // Flush everything and ensure that the correct subscribable is used
      // We expect the new subscribable to finish rendering,
      // But then the updated values from the old subscribable should be used.
      expect(Scheduler).toFlushAndYield([
        'Grandchild: b-0',
        'Child: a-2',
        'Grandchild: a-2',
      ]);
      expect(log).toEqual([
        'Parent.componentDidUpdate:b-0',
        'Parent.componentDidUpdate:a-2',
      ]);
    });

    // Updates from the new subscribable should be ignored.
    log.splice(0);
    act(() => observableB.next('b-1'));
    expect(Scheduler).toFlushAndYield([]);
    expect(log).toEqual([]);
  });

  it('should guard against updates that happen after unmounting', () => {
    function Child({value = 'default'}) {
      Scheduler.unstable_yieldValue(value);
      return null;
    }

    function Subscription({source}) {
      const value = useSubscription(
        React.useMemo(
          () => ({
            getCurrentValue: () => source.getValue(),
            subscribe: callback => {
              return source.subscribe(callback);
            },
          }),
          [source],
        ),
      );
      return <Child value={value} />;
    }

    const eventHandler = {
      _callbacks: [],
      _value: true,
      change(value) {
        eventHandler._value = value;
        const _callbacks = eventHandler._callbacks.slice(0);
        _callbacks.forEach(callback => callback(value));
      },
      getValue() {
        return eventHandler._value;
      },
      subscribe(callback) {
        eventHandler._callbacks.push(callback);
        return () => {
          eventHandler._callbacks.splice(
            eventHandler._callbacks.indexOf(callback),
            1,
          );
        };
      },
    };

    eventHandler.subscribe(value => {
      if (value === false) {
        renderer.unmount();
        expect(Scheduler).toFlushAndYield([]);
      }
    });

    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <Subscription source={eventHandler} />,
        {unstable_isConcurrent: true},
      );
    });
    expect(Scheduler).toHaveYielded([true]);

    // This event should unmount
    eventHandler.change(false);
  });

  it('does not return a value from the previous subscription if the source is updated', () => {
    const subscription1 = {
      getCurrentValue: () => 'one',
      subscribe: () => () => {},
    };

    const subscription2 = {
      getCurrentValue: () => 'two',
      subscribe: () => () => {},
    };

    function Subscription({subscription}) {
      const value = useSubscription(subscription);
      if (value !== subscription.getCurrentValue()) {
        throw Error(
          `expected value "${subscription.getCurrentValue()}" but got value "${value}"`,
        );
      }
      return null;
    }

    let renderer;
    act(() => {
      renderer = ReactTestRenderer.create(
        <Subscription subscription={subscription1} />,
        {unstable_isConcurrent: true},
      );
    });
    Scheduler.unstable_flushAll();

    act(() => renderer.update(<Subscription subscription={subscription2} />));
    Scheduler.unstable_flushAll();
  });
});
