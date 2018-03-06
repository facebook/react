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
let ReactFeatureFlags;
let ReactNoop;

describe('CreateComponentWithSubscriptions', () => {
  beforeEach(() => {
    jest.resetModules();
    createComponent = require('create-component-with-subscriptions')
      .createComponent;
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
    const Subscriber = createComponent(
      {
        subscribablePropertiesMap: {observable: 'value'},
        getDataFor: (subscribable, propertyName) => {
          expect(propertyName).toBe('observable');
          return subscribable.getValue();
        },
        subscribeTo: (valueChangedCallback, subscribable, propertyName) => {
          expect(propertyName).toBe('observable');
          return subscribable.subscribe(valueChangedCallback);
        },
        unsubscribeFrom: (subscribable, propertyName, subscription) => {
          expect(propertyName).toBe('observable');
          subscription.unsubscribe();
        },
      },
      ({value}) => {
        ReactNoop.yield(value);
        return null;
      },
    );

    const observable = createFauxBehaviorSubject();
    ReactNoop.render(<Subscriber observable={observable} />);

    // Updates while subscribed should re-render the child component
    expect(ReactNoop.flush()).toEqual([undefined]);
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
    const Subscriber = createComponent(
      {
        subscribablePropertiesMap: {
          foo: 'foo',
          bar: 'bar',
        },
        getDataFor: (subscribable, propertyName) => {
          switch (propertyName) {
            case 'foo':
              return subscribable.getValue();
            case 'bar':
              return subscribable.getValue();
            default:
              throw Error('Unexpected propertyName ' + propertyName);
          }
        },
        subscribeTo: (valueChangedCallback, subscribable, propertyName) => {
          switch (propertyName) {
            case 'foo':
              return subscribable.subscribe(valueChangedCallback);
            case 'bar':
              return subscribable.subscribe(valueChangedCallback);
            default:
              throw Error('Unexpected propertyName ' + propertyName);
          }
        },
        unsubscribeFrom: (subscribable, propertyName, subscription) => {
          switch (propertyName) {
            case 'foo':
            case 'bar':
              subscription.unsubscribe();
              break;
            default:
              throw Error('Unexpected propertyName ' + propertyName);
          }
        },
      },
      ({bar, foo}) => {
        ReactNoop.yield(`bar:${bar}, foo:${foo}`);
        return null;
      },
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
        subscribablePropertiesMap: {observable: 'value'},
        getDataFor: (subscribable, propertyName, subscription) => {
          let currentValue;
          const temporarySubscription = subscribable.subscribe(value => {
            currentValue = value;
          });
          temporarySubscription.unsubscribe();
          return currentValue;
        },
        subscribeTo: (valueChangedCallback, subscribable, propertyName) =>
          subscribable.subscribe(valueChangedCallback),
        unsubscribeFrom: (subscribable, propertyName, subscription) =>
          subscription.unsubscribe(),
      },
      ({value}) => {
        ReactNoop.yield(value);
        return null;
      },
    );

    const observable = createFauxReplaySubject('initial');

    ReactNoop.render(<Subscriber observable={observable} />);
    expect(ReactNoop.flush()).toEqual(['initial']);
    observable.update('updated');
    expect(ReactNoop.flush()).toEqual(['updated']);

    // Unsetting the subscriber prop should reset subscribed values
    ReactNoop.render(<Subscriber />);
    expect(ReactNoop.flush()).toEqual([undefined]);
  });

  it('should support Promises', async () => {
    const Subscriber = createComponent(
      {
        subscribablePropertiesMap: {promise: 'value'},
        getDataFor: (subscribable, propertyName, subscription) => undefined,
        subscribeTo: (valueChangedCallback, subscribable, propertyName) => {
          let subscribed = true;
          subscribable.then(value => {
            if (subscribed) {
              valueChangedCallback(value);
            }
          });
          return {
            unsubscribe() {
              subscribed = false;
            },
          };
        },
        unsubscribeFrom: (subscribable, propertyName, subscription) =>
          subscription.unsubscribe(),
      },
      ({value}) => {
        ReactNoop.yield(value);
        return null;
      },
    );

    let resolveA, resolveB;
    const promiseA = new Promise(r => (resolveA = r));
    const promiseB = new Promise(r => (resolveB = r));

    // Test a promise that resolves after render
    ReactNoop.render(<Subscriber promise={promiseA} />);
    expect(ReactNoop.flush()).toEqual([undefined]);
    resolveA('abc');
    await promiseA;
    expect(ReactNoop.flush()).toEqual(['abc']);

    // Test a promise that resolves before render
    // Note that this will require an extra render anyway,
    // Because there is no way to syncrhonously get a Promise's value
    resolveB(123);
    ReactNoop.render(<Subscriber promise={promiseB} />);
    expect(ReactNoop.flush()).toEqual([undefined]);
    await promiseB;
    expect(ReactNoop.flush()).toEqual([123]);
  });

  it('should unsubscribe from old subscribables and subscribe to new subscribables when props change', () => {
    const Subscriber = createComponent(
      {
        subscribablePropertiesMap: {observable: 'value'},
        getDataFor: (subscribable, propertyName) => subscribable.getValue(),
        subscribeTo: (valueChangedCallback, subscribable, propertyName) =>
          subscribable.subscribe(valueChangedCallback),
        unsubscribeFrom: (subscribable, propertyName, subscription) =>
          subscription.unsubscribe(),
      },
      ({value}) => {
        ReactNoop.yield(value);
        return null;
      },
    );

    const observableA = createFauxBehaviorSubject('a-0');
    const observableB = createFauxBehaviorSubject('b-0');

    ReactNoop.render(<Subscriber observable={observableA} />);

    // Updates while subscribed should re-render the child component
    expect(ReactNoop.flush()).toEqual(['a-0']);

    // Unsetting the subscriber prop should reset subscribed values
    ReactNoop.render(<Subscriber observable={observableB} />);
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
        subscribablePropertiesMap: {observable: 'value'},
        getDataFor: (subscribable, propertyName) => subscribable.getValue(),
        subscribeTo: (valueChangedCallback, subscribable, propertyName) =>
          subscribable.subscribe(valueChangedCallback),
        unsubscribeFrom: (subscribable, propertyName, subscription) =>
          subscription.unsubscribe(),
      },
      ({value}) => {
        ReactNoop.yield('Subscriber: ' + value);
        return <Child value={value} />;
      },
    );

    class Parent extends React.Component {
      state = {};

      static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.observable !== prevState.observable) {
          return {
            observable: nextProps.observable,
          };
        }

        return null;
      }

      render() {
        parentInstance = this;

        return <Subscriber observable={this.state.observable} />;
      }
    }

    const observableA = createFauxBehaviorSubject('a-0');
    const observableB = createFauxBehaviorSubject('b-0');

    ReactNoop.render(<Parent observable={observableA} />);
    expect(ReactNoop.flush()).toEqual(['Subscriber: a-0', 'Child: a-0']);

    // Start React update, but don't finish
    ReactNoop.render(<Parent observable={observableB} />);
    ReactNoop.flushThrough(['Subscriber: b-0']);

    // Emit some updates from the uncommitted subscribable
    observableB.update('b-1');
    observableB.update('b-2');
    observableB.update('b-3');

    // Mimic a higher-priority interruption
    parentInstance.setState({observable: observableA});

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
        subscribablePropertiesMap: {observable: 'value'},
        getDataFor: (subscribable, propertyName) => subscribable.getValue(),
        subscribeTo: (valueChangedCallback, subscribable, propertyName) =>
          subscribable.subscribe(valueChangedCallback),
        unsubscribeFrom: (subscribable, propertyName, subscription) =>
          subscription.unsubscribe(),
      },
      ({value}) => {
        ReactNoop.yield('Subscriber: ' + value);
        return <Child value={value} />;
      },
    );

    class Parent extends React.Component {
      state = {};

      static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.observable !== prevState.observable) {
          return {
            observable: nextProps.observable,
          };
        }

        return null;
      }

      render() {
        parentInstance = this;

        return <Subscriber observable={this.state.observable} />;
      }
    }

    const observableA = createFauxBehaviorSubject('a-0');
    const observableB = createFauxBehaviorSubject('b-0');

    ReactNoop.render(<Parent observable={observableA} />);
    expect(ReactNoop.flush()).toEqual(['Subscriber: a-0', 'Child: a-0']);

    // Start React update, but don't finish
    ReactNoop.render(<Parent observable={observableB} />);
    ReactNoop.flushThrough(['Subscriber: b-0']);

    // Emit some updates from the old subscribable
    observableA.update('a-1');
    observableA.update('a-2');

    // Mimic a higher-priority interruption
    parentInstance.setState({observable: observableA});

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
        subscribablePropertiesMap: {observable: 'value'},
        getDataFor: (subscribable, propertyName) => subscribable.getValue(),
        subscribeTo: (valueChangedCallback, subscribable, propertyName) =>
          subscribable.subscribe(valueChangedCallback),
        unsubscribeFrom: (subscribable, propertyName, subscription) =>
          subscription.unsubscribe(),
      },
      ({bar, foo, value}) => {
        ReactNoop.yield(`bar:${bar}, foo:${foo}, value:${value}`);
        return null;
      },
    );

    const observable = createFauxBehaviorSubject(true);
    ReactNoop.render(
      <Subscriber observable={observable} foo={123} bar="abc" />,
    );
    expect(ReactNoop.flush()).toEqual(['bar:abc, foo:123, value:true']);
  });

  describe('class component', () => {
    it('should support class components', () => {
      const Subscriber = createComponent(
        {
          subscribablePropertiesMap: {observable: 'value'},
          getDataFor: (subscribable, propertyName) => subscribable.getValue(),
          subscribeTo: (valueChangedCallback, subscribable, propertyName) =>
            subscribable.subscribe(valueChangedCallback),
          unsubscribeFrom: (subscribable, propertyName, subscription) =>
            subscription.unsubscribe(),
        },
        class extends React.Component {
          state = {};
          render() {
            ReactNoop.yield(this.state.value);
            return null;
          }
        },
      );

      const observable = createFauxBehaviorSubject('initial');

      ReactNoop.render(<Subscriber observable={observable} />);
      expect(ReactNoop.flush()).toEqual(['initial']);
      observable.update('updated');
      expect(ReactNoop.flush()).toEqual(['updated']);

      // Unsetting the subscriber prop should reset subscribed values
      ReactNoop.render(<Subscriber />);
      expect(ReactNoop.flush()).toEqual([undefined]);
    });

    it('should class mixed-in class component lifecycles', () => {
      const lifecycles = [];
      const Subscriber = createComponent(
        {
          subscribablePropertiesMap: {observable: 'value'},
          getDataFor: (subscribable, propertyName) => subscribable.getValue(),
          subscribeTo: (valueChangedCallback, subscribable, propertyName) =>
            subscribable.subscribe(valueChangedCallback),
          unsubscribeFrom: (subscribable, propertyName, subscription) =>
            subscription.unsubscribe(),
        },
        class extends React.Component {
          state = {
            foo: 1,
          };
          constructor(props) {
            super(props);
            lifecycles.push('constructor');
          }
          static getDerivedStateFromProps(nextProps, prevState) {
            lifecycles.push('getDerivedStateFromProps');
            return {
              foo: prevState.foo + 1,
            };
          }
          componentDidMount() {
            lifecycles.push('componentDidMount');
          }
          componentDidUpdate(prevProps, prevState) {
            lifecycles.push('componentDidUpdate');
          }
          componentWillUnmount() {
            lifecycles.push('componentWillUnmount');
          }
          render() {
            ReactNoop.yield({foo: this.state.foo, value: this.state.value});
            return null;
          }
        },
      );

      const observable = createFauxBehaviorSubject('initial');

      ReactNoop.render(<Subscriber observable={observable} />);
      expect(ReactNoop.flush()).toEqual([{foo: 2, value: 'initial'}]);
      expect(lifecycles).toEqual([
        'constructor',
        'getDerivedStateFromProps',
        'componentDidMount',
      ]);
      lifecycles.length = 0;
      observable.update('updated');
      expect(ReactNoop.flush()).toEqual([{foo: 2, value: 'updated'}]);
      expect(lifecycles).toEqual(['componentDidUpdate']);

      // Unsetting the subscriber prop should reset subscribed values
      lifecycles.length = 0;
      ReactNoop.render(<Subscriber />);
      expect(ReactNoop.flush()).toEqual([{foo: 3, value: undefined}]);
      expect(lifecycles).toEqual([
        'getDerivedStateFromProps',
        'componentDidUpdate',
      ]);

      // Test unmounting lifecycle as well
      lifecycles.length = 0;
      ReactNoop.render(<div />);
      expect(ReactNoop.flush()).toEqual([]);
      expect(lifecycles).toEqual(['componentWillUnmount']);
    });

    it('should not mask the displayName used for errors and DevTools', () => {
      const Subscriber = createComponent(
        {
          subscribablePropertiesMap: {observable: 'value'},
          getDataFor: (subscribable, propertyName) => subscribable.getValue(),
          subscribeTo: (valueChangedCallback, subscribable, propertyName) =>
            subscribable.subscribe(valueChangedCallback),
          unsubscribeFrom: (subscribable, propertyName, subscription) =>
            subscription.unsubscribe(),
        },
        class MyExampleComponent extends React.Component {
          static displayName = 'MyExampleComponent';
          state = {};
          render() {
            return null;
          }
        },
      );

      expect(Subscriber.displayName).toBe('MyExampleComponent');
    });
  });

  // TODO Test create-class component (for FluxSubscriberMixin use case)

  // TODO Test with react-lifecycle-polyfill to make sure gDSFP isn't broken by mixin approach

  describe('invariants', () => {
    it('should error for invalid Component', () => {
      expect(() => {
        createComponent(
          {
            subscribablePropertiesMap: {},
            getDataFor: () => {},
            subscribeTo: () => {},
            unsubscribeFrom: () => {},
          },
          null,
        );
      }).toThrow('Invalid subscribable Component specified');
    });

    it('should error for invalid missing subscribablePropertiesMap', () => {
      expect(() => {
        createComponent(
          {
            getDataFor: () => {},
            subscribeTo: () => {},
            unsubscribeFrom: () => {},
          },
          () => null,
        );
      }).toThrow(
        'Subscribable config must specify a subscribablePropertiesMap map',
      );
    });

    it('should error for invalid missing getDataFor', () => {
      expect(() => {
        createComponent(
          {
            subscribablePropertiesMap: {},
            subscribeTo: () => {},
            unsubscribeFrom: () => {},
          },
          () => null,
        );
      }).toThrow('Subscribable config must specify a getDataFor function');
    });

    it('should error for invalid missing subscribeTo', () => {
      expect(() => {
        createComponent(
          {
            subscribablePropertiesMap: {},
            getDataFor: () => {},
            unsubscribeFrom: () => {},
          },
          () => null,
        );
      }).toThrow('Subscribable config must specify a subscribeTo function');
    });

    it('should error for invalid missing unsubscribeFrom', () => {
      expect(() => {
        createComponent(
          {
            subscribablePropertiesMap: {},
            getDataFor: () => {},
            subscribeTo: () => {},
          },
          () => null,
        );
      }).toThrow('Subscribable config must specify a unsubscribeFrom function');
    });
  });
});
