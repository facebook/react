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
      const log = [];
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
            log.push('constructor');
          }
          static getDerivedStateFromProps(nextProps, prevState) {
            log.push('getDerivedStateFromProps');
            return {
              foo: prevState.foo + 1,
            };
          }
          componentDidMount() {
            log.push('componentDidMount');
          }
          componentDidUpdate(prevProps, prevState) {
            log.push('componentDidUpdate');
          }
          componentWillUnmount() {
            log.push('componentWillUnmount');
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
      expect(log).toEqual([
        'constructor',
        'getDerivedStateFromProps',
        'componentDidMount',
      ]);
      log.length = 0;
      observable.update('updated');
      expect(ReactNoop.flush()).toEqual([{foo: 2, value: 'updated'}]);
      expect(log).toEqual(['componentDidUpdate']);

      // Unsetting the subscriber prop should reset subscribed values
      log.length = 0;
      ReactNoop.render(<Subscriber />);
      expect(ReactNoop.flush()).toEqual([{foo: 3, value: undefined}]);
      expect(log).toEqual(['getDerivedStateFromProps', 'componentDidUpdate']);

      // Test unmounting lifecycle as well
      log.length = 0;
      ReactNoop.render(<div />);
      expect(ReactNoop.flush()).toEqual([]);
      expect(log).toEqual(['componentWillUnmount']);
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

    it('should preserve refs attached to class components', () => {
      class MyExampleComponent extends React.Component {
        state = {};
        customMethod() {}
        render() {
          ReactNoop.yield(this.state.value);
          return null;
        }
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
        MyExampleComponent,
      );

      const observable = createFauxBehaviorSubject('initial');
      const ref = React.createRef();

      ReactNoop.render(<Subscriber ref={ref} observable={observable} />);
      expect(ReactNoop.flush()).toEqual(['initial']);

      expect(ref.value instanceof MyExampleComponent).toBe(true);
      expect(typeof ref.value.customMethod).toBe('function');
    });
  });

  it('should support create-react-class components', () => {
    const createReactClass = require('create-react-class/factory')(
      React.Component,
      React.isValidElement,
      new React.Component().updater,
    );

    const log = [];

    const Component = createReactClass({
      mixins: [
        {
          componentDidMount() {
            log.push('mixin componentDidMount');
          },
          componentDidUpdate() {
            log.push('mixin componentDidUpdate');
          },
          componentWillUnmount() {
            log.push('mixin componentWillUnmount');
          },
          statics: {
            getDerivedStateFromProps() {
              log.push('mixin getDerivedStateFromProps');
              return null;
            },
          },
        },
      ],
      getInitialState() {
        return {};
      },
      componentDidMount() {
        log.push('componentDidMount');
      },
      componentDidUpdate() {
        log.push('componentDidUpdate');
      },
      componentWillUnmount() {
        log.push('componentWillUnmount');
      },
      render() {
        ReactNoop.yield(this.state.value);
        return null;
      },
      statics: {
        getDerivedStateFromProps() {
          log.push('getDerivedStateFromProps');
          return null;
        },
      },
    });

    const Subscriber = createComponent(
      {
        subscribablePropertiesMap: {observable: 'value'},
        getDataFor: (subscribable, propertyName) => subscribable.getValue(),
        subscribeTo: (valueChangedCallback, subscribable, propertyName) =>
          subscribable.subscribe(valueChangedCallback),
        unsubscribeFrom: (subscribable, propertyName, subscription) =>
          subscription.unsubscribe(),
      },
      Component,
    );

    const observable = createFauxBehaviorSubject('initial');

    ReactNoop.render(<Subscriber observable={observable} />);
    expect(ReactNoop.flush()).toEqual(['initial']);
    expect(log).toEqual([
      'mixin getDerivedStateFromProps',
      'getDerivedStateFromProps',
      'mixin componentDidMount',
      'componentDidMount',
    ]);
    log.length = 0;
    observable.update('updated');
    expect(ReactNoop.flush()).toEqual(['updated']);
    expect(log).toEqual(['mixin componentDidUpdate', 'componentDidUpdate']);

    // Unsetting the subscriber prop should reset subscribed values
    log.length = 0;
    ReactNoop.render(<Subscriber />);
    expect(ReactNoop.flush()).toEqual([undefined]);
    expect(log).toEqual([
      'mixin getDerivedStateFromProps',
      'getDerivedStateFromProps',
      'mixin componentDidUpdate',
      'componentDidUpdate',
    ]);

    // Test unmounting lifecycle as well
    log.length = 0;
    ReactNoop.render(<div />);
    expect(ReactNoop.flush()).toEqual([]);
    expect(log).toEqual(['mixin componentWillUnmount', 'componentWillUnmount']);
  });

  it('should be compatible with react-lifecycles-compat', () => {
    const polyfill = require('react-lifecycles-compat');

    class MyExampleComponent extends React.Component {
      state = {
        foo: 1,
      };
      static getDerivedStateFromProps(nextProps, prevState) {
        return {
          foo: prevState.foo + 1,
        };
      }
      render() {
        ReactNoop.yield({foo: this.state.foo, value: this.state.value});
        return null;
      }
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
      polyfill(MyExampleComponent),
    );

    const observable = createFauxBehaviorSubject('initial');

    ReactNoop.render(<Subscriber observable={observable} />);
    expect(ReactNoop.flush()).toEqual([{foo: 2, value: 'initial'}]);
    observable.update('updated');
    expect(ReactNoop.flush()).toEqual([{foo: 2, value: 'updated'}]);

    // Unsetting the subscriber prop should reset subscribed values
    ReactNoop.render(<Subscriber />);
    expect(ReactNoop.flush()).toEqual([{foo: 3, value: undefined}]);

    // Test unmounting lifecycle as well
    ReactNoop.render(<div />);
    expect(ReactNoop.flush()).toEqual([]);
  });
});
