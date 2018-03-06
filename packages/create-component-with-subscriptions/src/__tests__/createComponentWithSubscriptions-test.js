/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let createComponent;
let React;
let ReactNoop;

describe('CreateComponentWithSubscriptions', () => {
  beforeEach(() => {
    jest.resetModules();
    createComponent = require('create-component-with-subscriptions')
      .createComponent;
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
    const Subscriber = createComponent(
      {
        property: 'observed',
        getValue: props => props.observed.getValue(),
        subscribe: (props, valueChangedCallback) =>
          props.observed.subscribe(valueChangedCallback),
        unsubscribe: (props, subscription) => subscription.unsubscribe(),
      },
      ({observed = 'default'}) => {
        ReactNoop.yield(observed);
        return null;
      },
    );

    const observable = createFauxBehaviorSubject();
    ReactNoop.render(<Subscriber observed={observable} />);

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

  it('supports multiple subscriptions', () => {
    const InnerComponent = ({bar, foo}) => {
      ReactNoop.yield(`bar:${bar}, foo:${foo}`);
      return null;
    };

    const Subscriber = createComponent(
      {
        property: 'foo',
        getValue: props => props.foo.getValue(),
        subscribe: (props, valueChangedCallback) =>
          props.foo.subscribe(valueChangedCallback),
        unsubscribe: (props, subscription) => subscription.unsubscribe(),
      },
      createComponent(
        {
          property: 'bar',
          getValue: props => props.bar.getValue(),
          subscribe: (props, valueChangedCallback) =>
            props.bar.subscribe(valueChangedCallback),
          unsubscribe: (props, subscription) => subscription.unsubscribe(),
        },
        InnerComponent,
      ),
    );

    const foo = createFauxBehaviorSubject();
    const bar = createFauxBehaviorSubject();

    ReactNoop.render(<Subscriber foo={foo} bar={bar} />);

    // Updates while subscribed should re-render the child component
    expect(ReactNoop.flush()).toEqual([`bar:undefined, foo:undefined`]);
    foo.update(123);
    expect(ReactNoop.flush()).toEqual([`bar:undefined, foo:123`]);
    bar.update('abc');
    expect(ReactNoop.flush()).toEqual([`bar:abc, foo:123`]);
    foo.update(456);
    expect(ReactNoop.flush()).toEqual([`bar:abc, foo:456`]);

    // Unsetting the subscriber prop should reset subscribed values
    ReactNoop.render(<Subscriber />);
    expect(ReactNoop.flush()).toEqual([`bar:undefined, foo:undefined`]);
  });

  it('should support observable types like RxJS ReplaySubject', () => {
    const Subscriber = createComponent(
      {
        property: 'observed',
        getValue: props => {
          let currentValue;
          const temporarySubscription = props.observed.subscribe(value => {
            currentValue = value;
          });
          temporarySubscription.unsubscribe();
          return currentValue;
        },
        subscribe: (props, valueChangedCallback) =>
          props.observed.subscribe(valueChangedCallback),
        unsubscribe: (props, subscription) => subscription.unsubscribe(),
      },
      ({observed}) => {
        ReactNoop.yield(observed);
        return null;
      },
    );

    const observable = createFauxReplaySubject('initial');

    ReactNoop.render(<Subscriber observed={observable} />);
    expect(ReactNoop.flush()).toEqual(['initial']);
    observable.update('updated');
    expect(ReactNoop.flush()).toEqual(['updated']);

    // Unsetting the subscriber prop should reset subscribed values
    ReactNoop.render(<Subscriber />);
    expect(ReactNoop.flush()).toEqual([undefined]);
  });

  describe('Promises', () => {
    it('should support Promises', async () => {
      const Subscriber = createComponent(
        {
          property: 'hasLoaded',
          getValue: props => undefined,
          subscribe: (props, valueChangedCallback) => {
            props.hasLoaded.then(
              () => valueChangedCallback(true),
              () => valueChangedCallback(false),
            );
          },
          unsubscribe: (props, subscription) => {},
        },
        ({hasLoaded}) => {
          if (hasLoaded === undefined) {
            ReactNoop.yield('loading');
          } else {
            ReactNoop.yield(hasLoaded ? 'finished' : 'failed');
          }
          return null;
        },
      );

      let resolveA, rejectB;
      const promiseA = new Promise((resolve, reject) => {
        resolveA = resolve;
      });
      const promiseB = new Promise((resolve, reject) => {
        rejectB = reject;
      });

      // Test a promise that resolves after render
      ReactNoop.render(<Subscriber hasLoaded={promiseA} />);
      expect(ReactNoop.flush()).toEqual(['loading']);
      resolveA();
      await promiseA;
      expect(ReactNoop.flush()).toEqual(['finished']);

      // Test a promise that resolves before render
      // Note that this will require an extra render anyway,
      // Because there is no way to syncrhonously get a Promise's value
      rejectB();
      ReactNoop.render(<Subscriber hasLoaded={promiseB} />);
      expect(ReactNoop.flush()).toEqual(['loading']);
      await promiseB.catch(() => true);
      expect(ReactNoop.flush()).toEqual(['failed']);
    });

    it('should still work if unsubscription is managed incorrectly', async () => {
      const Subscriber = createComponent(
        {
          property: 'promised',
          getValue: props => undefined,
          subscribe: (props, valueChangedCallback) =>
            props.promised.then(valueChangedCallback),
          unsubscribe: (props, subscription) => {},
        },
        ({promised}) => {
          ReactNoop.yield(promised);
          return null;
        },
      );

      let resolveA, resolveB;
      const promiseA = new Promise(resolve => (resolveA = resolve));
      const promiseB = new Promise(resolve => (resolveB = resolve));

      // Subscribe first to Promise A then Promsie B
      ReactNoop.render(<Subscriber promised={promiseA} />);
      expect(ReactNoop.flush()).toEqual([undefined]);
      ReactNoop.render(<Subscriber promised={promiseB} />);
      expect(ReactNoop.flush()).toEqual([undefined]);

      // Resolve both Promises
      resolveB(123);
      resolveA('abc');
      await Promise.all([promiseA, promiseB]);

      // Ensure that only Promise B causes an update
      expect(ReactNoop.flush()).toEqual([123]);
    });
  });

  it('should unsubscribe from old subscribables and subscribe to new subscribables when props change', () => {
    const Subscriber = createComponent(
      {
        property: 'observed',
        getValue: props => props.observed.getValue(),
        subscribe: (props, valueChangedCallback) =>
          props.observed.subscribe(valueChangedCallback),
        unsubscribe: (props, subscription) => subscription.unsubscribe(),
      },
      ({observed}) => {
        ReactNoop.yield(observed);
        return null;
      },
    );

    const observableA = createFauxBehaviorSubject('a-0');
    const observableB = createFauxBehaviorSubject('b-0');

    ReactNoop.render(<Subscriber observed={observableA} />);

    // Updates while subscribed should re-render the child component
    expect(ReactNoop.flush()).toEqual(['a-0']);

    // Unsetting the subscriber prop should reset subscribed values
    ReactNoop.render(<Subscriber observed={observableB} />);
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

    const Subscriber = createComponent(
      {
        property: 'observed',
        getValue: props => props.observed.getValue(),
        subscribe: (props, valueChangedCallback) =>
          props.observed.subscribe(valueChangedCallback),
        unsubscribe: (props, subscription) => subscription.unsubscribe(),
      },
      ({observed}) => {
        ReactNoop.yield('Subscriber: ' + observed);
        return <Child value={observed} />;
      },
    );

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

        return <Subscriber observed={this.state.observed} />;
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

    const Subscriber = createComponent(
      {
        property: 'observed',
        getValue: props => props.observed.getValue(),
        subscribe: (props, valueChangedCallback) =>
          props.observed.subscribe(valueChangedCallback),
        unsubscribe: (props, subscription) => subscription.unsubscribe(),
      },
      ({observed}) => {
        ReactNoop.yield('Subscriber: ' + observed);
        return <Child value={observed} />;
      },
    );

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

        return <Subscriber observed={this.state.observed} />;
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

  it('should pass all non-subscribable props through to the child component', () => {
    const Subscriber = createComponent(
      {
        property: 'observed',
        getValue: props => props.observed.getValue(),
        subscribe: (props, valueChangedCallback) =>
          props.observed.subscribe(valueChangedCallback),
        unsubscribe: (props, subscription) => subscription.unsubscribe(),
      },
      ({bar, foo, observed}) => {
        ReactNoop.yield(`bar:${bar}, foo:${foo}, observed:${observed}`);
        return null;
      },
    );

    const observable = createFauxBehaviorSubject(true);
    ReactNoop.render(<Subscriber observed={observable} foo={123} bar="abc" />);
    expect(ReactNoop.flush()).toEqual(['bar:abc, foo:123, observed:true']);
  });

  describe('invariants', () => {
    it('should error for invalid Component', () => {
      expect(() => {
        createComponent(
          {
            property: 'somePropertyName',
            getValue: () => {},
            subscribe: () => {},
            unsubscribe: () => {},
          },
          null,
        );
      }).toThrow('Invalid subscribable Component specified');
    });

    it('should error for invalid missing property', () => {
      expect(() => {
        createComponent(
          {
            getValue: () => {},
            subscribe: () => {},
            unsubscribe: () => {},
          },
          () => null,
        );
      }).toThrow('Subscribable config must specify a subscribable property');
    });

    it('should error for invalid missing getValue', () => {
      expect(() => {
        createComponent(
          {
            property: 'somePropertyName',
            subscribe: () => {},
            unsubscribe: () => {},
          },
          () => null,
        );
      }).toThrow('Subscribable config must specify a getValue function');
    });

    it('should error for invalid missing subscribe', () => {
      expect(() => {
        createComponent(
          {
            property: 'somePropertyName',
            getValue: () => {},
            unsubscribe: () => {},
          },
          () => null,
        );
      }).toThrow('Subscribable config must specify a subscribe function');
    });

    it('should error for invalid missing unsubscribe', () => {
      expect(() => {
        createComponent(
          {
            property: 'somePropertyName',
            getValue: () => {},
            subscribe: () => {},
          },
          () => null,
        );
      }).toThrow('Subscribable config must specify a unsubscribe function');
    });
  });
});
