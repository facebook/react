/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let createSubscription;
let ReactFeatureFlags;
let React;
let ReactNoop;

describe('createSubscription', () => {
  beforeEach(() => {
    jest.resetModules();
    createSubscription = require('create-subscription').createSubscription;
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.debugRenderPhaseSideEffectsForStrictMode = false;
    React = require('react');
    ReactNoop = require('react-noop-renderer');
  });

  // Mimics a partial interface of RxJS `BehaviorSubject`
  function createFauxBehaviorSubject(initialValue) {
    let currentValue = initialValue;
    let subscribedCallbacks = [];
    return {
      getValue: () => currentValue,
      subscribe: callback => {
        subscribedCallbacks.push(callback);
        return {
          unsubscribe: () => {
            subscribedCallbacks.splice(
              subscribedCallbacks.indexOf(callback),
              1,
            );
          },
        };
      },
      update: value => {
        currentValue = value;
        subscribedCallbacks.forEach(subscribedCallback =>
          subscribedCallback(value),
        );
      },
    };
  }

  // Mimics a partial interface of RxJS `ReplaySubject`
  function createFauxReplaySubject(initialValue) {
    const observable = createFauxBehaviorSubject(initialValue);
    const {getValue, subscribe} = observable;
    observable.getValue = undefined;
    observable.subscribe = callback => {
      callback(getValue());
      return subscribe(callback);
    };
    return observable;
  }

  it('supports basic subscription pattern', () => {
    const Subscription = createSubscription({
      getValue: source => source.getValue(),
      subscribe: (source, callback) => source.subscribe(callback),
      unsubscribe: (source, subscription) => subscription.unsubscribe(),
    });

    const observable = createFauxBehaviorSubject();
    ReactNoop.render(
      <Subscription source={observable}>
        {(value = 'default') => {
          ReactNoop.yield(value);
          return null;
        }}
      </Subscription>,
    );

    // Updates while subscribed should re-render the child component
    expect(ReactNoop.flush()).toEqual(['default']);
    observable.update(123);
    expect(ReactNoop.flush()).toEqual([123]);
    observable.update('abc');
    expect(ReactNoop.flush()).toEqual(['abc']);

    // Unmounting the subscriber should remove listeners
    ReactNoop.render(<div />);
    observable.update(456);
    expect(ReactNoop.flush()).toEqual([]);
  });

  it('should support observable types like RxJS ReplaySubject', () => {
    const Subscription = createSubscription({
      getValue: source => {
        let currentValue;
        source
          .subscribe(value => {
            currentValue = value;
          })
          .unsubscribe();
        return currentValue;
      },
      subscribe: (source, callback) => source.subscribe(callback),
      unsubscribe: (source, subscription) => subscription.unsubscribe(),
    });

    function render(value = 'default') {
      ReactNoop.yield(value);
      return null;
    }

    const observable = createFauxReplaySubject('initial');

    ReactNoop.render(<Subscription source={observable}>{render}</Subscription>);
    expect(ReactNoop.flush()).toEqual(['initial']);
    observable.update('updated');
    expect(ReactNoop.flush()).toEqual(['updated']);

    // Unsetting the subscriber prop should reset subscribed values
    ReactNoop.render(<Subscription>{render}</Subscription>);
    expect(ReactNoop.flush()).toEqual(['default']);
  });

  describe('Promises', () => {
    it('should support Promises', async () => {
      const Subscription = createSubscription({
        getValue: source => undefined,
        subscribe: (source, callback) =>
          source.then(() => callback(true), () => callback(false)),
        unsubscribe: (source, subscription) => {},
      });

      function render(hasLoaded) {
        if (hasLoaded === undefined) {
          ReactNoop.yield('loading');
        } else {
          ReactNoop.yield(hasLoaded ? 'finished' : 'failed');
        }
        return null;
      }

      let resolveA, rejectB;
      const promiseA = new Promise((resolve, reject) => {
        resolveA = resolve;
      });
      const promiseB = new Promise((resolve, reject) => {
        rejectB = reject;
      });

      // Test a promise that resolves after render
      ReactNoop.render(<Subscription source={promiseA}>{render}</Subscription>);
      expect(ReactNoop.flush()).toEqual(['loading']);
      resolveA();
      await promiseA;
      expect(ReactNoop.flush()).toEqual(['finished']);

      // Test a promise that resolves before render
      // Note that this will require an extra render anyway,
      // Because there is no way to syncrhonously get a Promise's value
      rejectB();
      ReactNoop.render(<Subscription source={promiseB}>{render}</Subscription>);
      expect(ReactNoop.flush()).toEqual(['loading']);
      await promiseB.catch(() => true);
      expect(ReactNoop.flush()).toEqual(['failed']);
    });

    it('should still work if unsubscription is managed incorrectly', async () => {
      const Subscription = createSubscription({
        getValue: source => undefined,
        subscribe: (source, callback) => source.then(callback),
        unsubscribe: (source, subscription) => {},
      });

      function render(value = 'default') {
        ReactNoop.yield(value);
        return null;
      }

      let resolveA, resolveB;
      const promiseA = new Promise(resolve => (resolveA = resolve));
      const promiseB = new Promise(resolve => (resolveB = resolve));

      // Subscribe first to Promise A then Promsie B
      ReactNoop.render(<Subscription source={promiseA}>{render}</Subscription>);
      expect(ReactNoop.flush()).toEqual(['default']);
      ReactNoop.render(<Subscription source={promiseB}>{render}</Subscription>);
      expect(ReactNoop.flush()).toEqual(['default']);

      // Resolve both Promises
      resolveB(123);
      resolveA('abc');
      await Promise.all([promiseA, promiseB]);

      // Ensure that only Promise B causes an update
      expect(ReactNoop.flush()).toEqual([123]);
    });
  });

  it('should unsubscribe from old subscribables and subscribe to new subscribables when props change', () => {
    const Subscription = createSubscription({
      getValue: source => source.getValue(),
      subscribe: (source, callback) => source.subscribe(callback),
      unsubscribe: (source, subscription) => subscription.unsubscribe(),
    });

    function render(value = 'default') {
      ReactNoop.yield(value);
      return null;
    }

    const observableA = createFauxBehaviorSubject('a-0');
    const observableB = createFauxBehaviorSubject('b-0');

    ReactNoop.render(
      <Subscription source={observableA}>{render}</Subscription>,
    );

    // Updates while subscribed should re-render the child component
    expect(ReactNoop.flush()).toEqual(['a-0']);

    // Unsetting the subscriber prop should reset subscribed values
    ReactNoop.render(
      <Subscription source={observableB}>{render}</Subscription>,
    );
    expect(ReactNoop.flush()).toEqual(['b-0']);

    // Updates to the old subscribable should not re-render the child component
    observableA.update('a-1');
    expect(ReactNoop.flush()).toEqual([]);

    // Updates to the bew subscribable should re-render the child component
    observableB.update('b-1');
    expect(ReactNoop.flush()).toEqual(['b-1']);
  });

  it('should ignore values emitted by a new subscribable until the commit phase', () => {
    let parentInstance;

    function Child({value}) {
      ReactNoop.yield('Child: ' + value);
      return null;
    }

    const Subscription = createSubscription({
      getValue: source => source.getValue(),
      subscribe: (source, callback) => source.subscribe(callback),
      unsubscribe: (source, subscription) => subscription.unsubscribe(),
    });

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

      render() {
        parentInstance = this;

        return (
          <Subscription source={this.state.observed}>
            {(value = 'default') => {
              ReactNoop.yield('Subscriber: ' + value);
              return <Child value={value} />;
            }}
          </Subscription>
        );
      }
    }

    const observableA = createFauxBehaviorSubject('a-0');
    const observableB = createFauxBehaviorSubject('b-0');

    ReactNoop.render(<Parent observed={observableA} />);
    expect(ReactNoop.flush()).toEqual(['Subscriber: a-0', 'Child: a-0']);

    // Start React update, but don't finish
    ReactNoop.render(<Parent observed={observableB} />);
    ReactNoop.flushThrough(['Subscriber: b-0']);

    // Emit some updates from the uncommitted subscribable
    observableB.update('b-1');
    observableB.update('b-2');
    observableB.update('b-3');

    // Mimic a higher-priority interruption
    parentInstance.setState({observed: observableA});

    // Flush everything and ensure that the correct subscribable is used
    // We expect the last emitted update to be rendered (because of the commit phase value check)
    // But the intermediate ones should be ignored,
    // And the final rendered output should be the higher-priority observable.
    expect(ReactNoop.flush()).toEqual([
      'Child: b-0',
      'Subscriber: b-3',
      'Child: b-3',
      'Subscriber: a-0',
      'Child: a-0',
    ]);
  });

  it('should not drop values emitted between updates', () => {
    let parentInstance;

    function Child({value}) {
      ReactNoop.yield('Child: ' + value);
      return null;
    }

    const Subscription = createSubscription({
      getValue: source => source.getValue(),
      subscribe: (source, callback) => source.subscribe(callback),
      unsubscribe: (source, subscription) => subscription.unsubscribe(),
    });

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

      render() {
        parentInstance = this;

        return (
          <Subscription source={this.state.observed}>
            {(value = 'default') => {
              ReactNoop.yield('Subscriber: ' + value);
              return <Child value={value} />;
            }}
          </Subscription>
        );
      }
    }

    const observableA = createFauxBehaviorSubject('a-0');
    const observableB = createFauxBehaviorSubject('b-0');

    ReactNoop.render(<Parent observed={observableA} />);
    expect(ReactNoop.flush()).toEqual(['Subscriber: a-0', 'Child: a-0']);

    // Start React update, but don't finish
    ReactNoop.render(<Parent observed={observableB} />);
    ReactNoop.flushThrough(['Subscriber: b-0']);

    // Emit some updates from the old subscribable
    observableA.update('a-1');
    observableA.update('a-2');

    // Mimic a higher-priority interruption
    parentInstance.setState({observed: observableA});

    // Flush everything and ensure that the correct subscribable is used
    // We expect the new subscribable to finish rendering,
    // But then the updated values from the old subscribable should be used.
    expect(ReactNoop.flush()).toEqual([
      'Child: b-0',
      'Subscriber: a-2',
      'Child: a-2',
    ]);

    // Updates from the new subsribable should be ignored.
    observableB.update('b-1');
    expect(ReactNoop.flush()).toEqual([]);
  });

  describe('warnings', () => {
    it('should error for invalid missing getValue', () => {
      expect(() => {
        createSubscription(
          {
            property: 'somePropertyName',
            subscribe: () => {},
            unsubscribe: () => {},
          },
          () => null,
        );
      }).toThrow('Subscription must specify a getValue function');
    });

    it('should error for invalid missing subscribe', () => {
      expect(() => {
        createSubscription(
          {
            property: 'somePropertyName',
            getValue: () => {},
            unsubscribe: () => {},
          },
          () => null,
        );
      }).toThrow('Subscription must specify a subscribe function');
    });

    it('should error for invalid missing unsubscribe', () => {
      expect(() => {
        createSubscription(
          {
            property: 'somePropertyName',
            getValue: () => {},
            subscribe: () => {},
          },
          () => null,
        );
      }).toThrow('Subscription must specify an unsubscribe function');
    });
  });
});
