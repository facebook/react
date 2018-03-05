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
let ReactTestRenderer;

describe('CreateComponentWithSubscriptions', () => {
  beforeEach(() => {
    jest.resetModules();
    createComponent = require('create-component-with-subscriptions')
      .createComponent;
    React = require('react');
    ReactTestRenderer = require('react-test-renderer');
  });

  function createFauxObservable() {
    let currentValue;
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
    const renderedValues = [];

    const Component = createComponent(
      {
        subscribablePropertiesMap: {observable: 'value'},
        getDataFor: (subscribable, propertyName) => {
          expect(propertyName).toBe('observable');
          return observable.getValue();
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
        renderedValues.push(value);
        return null;
      },
    );

    const observable = createFauxObservable();
    const render = ReactTestRenderer.create(
      <Component observable={observable} />,
    );

    // Updates while subscribed should re-render the child component
    expect(renderedValues).toEqual([undefined]);
    renderedValues.length = 0;
    observable.update(123);
    expect(renderedValues).toEqual([123]);
    renderedValues.length = 0;
    observable.update('abc');
    expect(renderedValues).toEqual(['abc']);

    // Unsetting the subscriber prop should reset subscribed values
    renderedValues.length = 0;
    render.update(<Component observable={null} />);
    expect(renderedValues).toEqual([undefined]);

    // Updates while unsubscribed should not re-render the child component
    renderedValues.length = 0;
    observable.update(789);
    expect(renderedValues).toEqual([]);
  });

  it('supports multiple subscriptions', () => {
    const renderedValues = [];

    const Component = createComponent(
      {
        subscribablePropertiesMap: {
          foo: 'foo',
          bar: 'bar',
        },
        getDataFor: (subscribable, propertyName) => {
          switch (propertyName) {
            case 'foo':
              return foo.getValue();
            case 'bar':
              return bar.getValue();
            default:
              throw Error('Unexpected propertyName ' + propertyName);
          }
        },
        subscribeTo: (valueChangedCallback, subscribable, propertyName) => {
          switch (propertyName) {
            case 'foo':
              return foo.subscribe(valueChangedCallback);
            case 'bar':
              return bar.subscribe(valueChangedCallback);
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
      ({foo, bar}) => {
        renderedValues.push({foo, bar});
        return null;
      },
    );

    const foo = createFauxObservable();
    const bar = createFauxObservable();
    const render = ReactTestRenderer.create(<Component foo={foo} bar={bar} />);

    // Updates while subscribed should re-render the child component
    expect(renderedValues).toEqual([{bar: undefined, foo: undefined}]);
    renderedValues.length = 0;
    foo.update(123);
    expect(renderedValues).toEqual([{bar: undefined, foo: 123}]);
    renderedValues.length = 0;
    bar.update('abc');
    expect(renderedValues).toEqual([{bar: 'abc', foo: 123}]);
    renderedValues.length = 0;
    foo.update(456);
    expect(renderedValues).toEqual([{bar: 'abc', foo: 456}]);

    // Unsetting the subscriber prop should reset subscribed values
    renderedValues.length = 0;
    render.update(<Component />);
    expect(renderedValues).toEqual([{bar: undefined, foo: undefined}]);

    // Updates while unsubscribed should not re-render the child component
    renderedValues.length = 0;
    foo.update(789);
    expect(renderedValues).toEqual([]);
  });
});
