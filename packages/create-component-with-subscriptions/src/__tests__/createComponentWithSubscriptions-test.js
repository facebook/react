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

  // Mimics the interface of RxJS `BehaviorSubject`
  function createFauxObservable(initialValue) {
    let currentValue = initialValue;
    let subscribedCallback = null;
    return {
      getValue: () => currentValue,
      subscribe: callback => {
        expect(subscribedCallback).toBe(null);
        subscribedCallback = callback;
        return {
          unsubscribe: () => {
            expect(subscribedCallback).not.toBe(null);
            subscribedCallback = null;
          },
        };
      },
      update: value => {
        currentValue = value;
        if (typeof subscribedCallback === 'function') {
          subscribedCallback(value);
        }
      },
    };
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

    const observable = createFauxObservable();
    ReactNoop.render(<Subscriber observable={observable} />);

    // Updates while subscribed should re-render the child component
    expect(ReactNoop.flush()).toEqual([undefined]);
    observable.update(123);
    expect(ReactNoop.flush()).toEqual([123]);
    observable.update('abc');
    expect(ReactNoop.flush()).toEqual(['abc']);

    // Unsetting the subscriber prop should reset subscribed values
    ReactNoop.render(<Subscriber observable={null} />);
    expect(ReactNoop.flush()).toEqual([undefined]);
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

    const foo = createFauxObservable();
    const bar = createFauxObservable();

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

    const observableA = createFauxObservable('a-0');
    const observableB = createFauxObservable('b-0');

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

    const observableA = createFauxObservable('a-0');
    const observableB = createFauxObservable('b-0');

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

    const observableA = createFauxObservable('a-0');
    const observableB = createFauxObservable('b-0');

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

    const observable = createFauxObservable(true);
    ReactNoop.render(
      <Subscriber observable={observable} foo={123} bar="abc" />,
    );
    expect(ReactNoop.flush()).toEqual(['bar:abc, foo:123, value:true']);
  });
});
