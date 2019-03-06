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

    useSubscription = require('react-hooks').useSubscription;
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
    function Subscription({source}) {
      const value = useSubscription(
        () => ({
          getCurrentValue: () => source.getValue(),
          subscribe: callback => {
            const subscription = source.subscribe(callback);
            return () => subscription.unsubscribe();
          },
        }),
        [source],
      );
      return <Child value={value} />;
    }

    function Child({value = 'default'}) {
      Scheduler.yieldValue(value);
      return null;
    }

    const observable = createBehaviorSubject();
    const renderer = ReactTestRenderer.create(
      <Subscription source={observable} />,
      {unstable_isConcurrent: true},
    );

    // Updates while subscribed should re-render the child component
    expect(Scheduler).toFlushAndYield(['default']);
    act(() => observable.next(123));
    expect(Scheduler).toFlushAndYield([123]);
    act(() => observable.next('abc'));
    expect(Scheduler).toFlushAndYield(['abc']);

    // Unmounting the subscriber should remove listeners
    renderer.update(<div />);
    act(() => observable.next(456));
    expect(Scheduler).toFlushAndYield([]);
  });

  it('should support observable types like RxJS ReplaySubject', () => {
    function Subscription({source}) {
      const value = useSubscription(
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
      );
      return <Child value={value} />;
    }

    function Child({value = 'default'}) {
      Scheduler.yieldValue(value);
      return null;
    }

    let observable = createReplaySubject('initial');
    const renderer = ReactTestRenderer.create(
      <Subscription source={observable} />,
      {unstable_isConcurrent: true},
    );
    expect(Scheduler).toFlushAndYield(['initial']);
    act(() => observable.next('updated'));
    expect(Scheduler).toFlushAndYield(['updated']);

    Scheduler.flushAll();

    // Unsetting the subscriber prop should reset subscribed values
    observable = createReplaySubject(undefined);
    renderer.update(<Subscription source={observable} />);
    expect(Scheduler).toFlushAndYield(['default']);
  });

  it('should unsubscribe from old subscribables and subscribe to new subscribables when props change', () => {
    function Subscription({source}) {
      const value = useSubscription(
        () => ({
          getCurrentValue: () => source.getValue(),
          subscribe: callback => {
            const subscription = source.subscribe(callback);
            return () => subscription.unsubscribe();
          },
        }),
        [source],
      );
      return <Child value={value} />;
    }

    function Child({value = 'default'}) {
      Scheduler.yieldValue(value);
      return null;
    }

    const observableA = createBehaviorSubject('a-0');
    const observableB = createBehaviorSubject('b-0');

    const renderer = ReactTestRenderer.create(
      <Subscription source={observableA} />,
      {unstable_isConcurrent: true},
    );

    // Updates while subscribed should re-render the child component
    expect(Scheduler).toFlushAndYield(['a-0']);

    // Unsetting the subscriber prop should reset subscribed values
    renderer.update(<Subscription source={observableB} />);
    expect(Scheduler).toFlushAndYield(['b-0']);

    // Updates to the old subscribable should not re-render the child component
    act(() => observableA.next('a-1'));
    expect(Scheduler).toFlushAndYield([]);

    // Updates to the bew subscribable should re-render the child component
    act(() => observableB.next('b-1'));
    expect(Scheduler).toFlushAndYield(['b-1']);
  });

  it('should ignore values emitted by a new subscribable until the commit phase', () => {
    const log = [];

    function Subscription({source}) {
      const value = useSubscription(
        () => ({
          getCurrentValue: () => source.getValue(),
          subscribe: callback => {
            const subscription = source.subscribe(callback);
            return () => subscription.unsubscribe();
          },
        }),
        [source],
      );
      return <Outer value={value} />;
    }

    function Outer({value}) {
      Scheduler.yieldValue('Outer: ' + value);
      return <Inner value={value} />;
    }

    function Inner({value}) {
      Scheduler.yieldValue('Inner: ' + value);
      return null;
    }

    class Parent extends React.Component {
      componentDidMount() {
        log.push('Parent.componentDidMount');
      }

      componentDidUpdate() {
        log.push('Parent.componentDidUpdate');
      }

      render() {
        return <Subscription source={this.props.observed} />;
      }
    }

    const observableA = createBehaviorSubject('a-0');
    const observableB = createBehaviorSubject('b-0');

    const renderer = ReactTestRenderer.create(
      <Parent observed={observableA} />,
      {unstable_isConcurrent: true},
    );
    expect(Scheduler).toFlushAndYield(['Outer: a-0', 'Inner: a-0']);
    expect(log).toEqual(['Parent.componentDidMount']);

    // Start React update, but don't finish
    renderer.update(<Parent observed={observableB} />);
    expect(Scheduler).toFlushAndYieldThrough(['Outer: b-0']);
    expect(log).toEqual(['Parent.componentDidMount']);

    // Emit some updates from the uncommitted subscribable
    observableB.next('b-1');
    observableB.next('b-2');
    observableB.next('b-3');

    // Update again
    renderer.update(<Parent observed={observableA} />);

    // Flush everything and ensure that the correct subscribable is used
    // We expect the last emitted update to be rendered (because of the commit phase value check)
    // But the intermediate ones should be ignored,
    // And the final rendered output should be the higher-priority observable.
    expect(Scheduler).toFlushAndYield([
      'Inner: b-0',
      'Outer: b-3',
      'Inner: b-3',
      'Outer: a-0',
      'Inner: a-0',
    ]);
    expect(log).toEqual([
      'Parent.componentDidMount',
      'Parent.componentDidUpdate',
      'Parent.componentDidUpdate',
    ]);
  });

  it('should not drop values emitted between updates', () => {
    const log = [];

    function Subscription({source}) {
      const value = useSubscription(
        () => ({
          getCurrentValue: () => source.getValue(),
          subscribe: callback => {
            const subscription = source.subscribe(callback);
            return () => subscription.unsubscribe();
          },
        }),
        [source],
      );
      return <Outer value={value} />;
    }

    function Outer({value}) {
      Scheduler.yieldValue('Outer: ' + value);
      return <Inner value={value} />;
    }

    function Inner({value}) {
      Scheduler.yieldValue('Inner: ' + value);
      return null;
    }

    class Parent extends React.Component {
      componentDidMount() {
        log.push('Parent.componentDidMount');
      }

      componentDidUpdate() {
        log.push('Parent.componentDidUpdate');
      }

      render() {
        return <Subscription source={this.props.observed} />;
      }
    }

    const observableA = createBehaviorSubject('a-0');
    const observableB = createBehaviorSubject('b-0');

    const renderer = ReactTestRenderer.create(
      <Parent observed={observableA} />,
      {unstable_isConcurrent: true},
    );
    expect(Scheduler).toFlushAndYield(['Outer: a-0', 'Inner: a-0']);
    expect(log).toEqual(['Parent.componentDidMount']);

    // Start React update, but don't finish
    renderer.update(<Parent observed={observableB} />);
    expect(Scheduler).toFlushAndYieldThrough(['Outer: b-0']);
    expect(log).toEqual(['Parent.componentDidMount']);

    // Emit some updates from the old subscribable
    act(() => observableA.next('a-1'));
    act(() => observableA.next('a-2'));

    // Update again
    renderer.update(<Parent observed={observableA} />);

    // Flush everything and ensure that the correct subscribable is used
    // We expect the new subscribable to finish rendering,
    // But then the updated values from the old subscribable should be used.
    expect(Scheduler).toFlushAndYield([
      'Inner: b-0',
      'Outer: a-2',
      'Inner: a-2',
    ]);
    expect(log).toEqual([
      'Parent.componentDidMount',
      'Parent.componentDidUpdate',
      'Parent.componentDidUpdate',
    ]);

    // Updates from the new subscribable should be ignored.
    act(() => observableB.next('b-1'));
    expect(Scheduler).toFlushAndYield([]);
    expect(log).toEqual([
      'Parent.componentDidMount',
      'Parent.componentDidUpdate',
      'Parent.componentDidUpdate',
    ]);
  });

  it('should guard against updates that happen after unmounting', () => {
    function Subscription({source}) {
      const value = useSubscription(
        () => ({
          getCurrentValue: () => source.getValue(),
          subscribe: callback => {
            const unsubscribe = source.subscribe(callback);
            return () => unsubscribe();
          },
        }),
        [source],
      );
      return <Child value={value} />;
    }

    function Child({value}) {
      Scheduler.yieldValue(value);
      return null;
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

    const renderer = ReactTestRenderer.create(
      <Subscription source={eventHandler} />,
      {unstable_isConcurrent: true},
    );

    expect(Scheduler).toFlushAndYield([true]);

    // This event should unmount
    eventHandler.change(false);
  });
});
