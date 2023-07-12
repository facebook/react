/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const ReactTestUtils = require('react-dom/test-utils');

describe('input value tracking', () => {
  it('triggers descriptor installed before react', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    );
    const {get, set} = descriptor;

    const getterInterceptor = jest.fn();

    Object.defineProperty(HTMLInputElement.prototype, 'value', {
      configurable: true,
      get: function() {
        getterInterceptor();
        return get.call(this);
      },
      set: function(value) {
        set.call(this, value);
      }
    });

    class MyForm extends React.Component {
      render() {
        return (
          <form>
            <input type='text'></input>
          </form>
        )
      }
    }

    const myNode = ReactTestUtils.renderIntoDocument(<MyForm />);
    const myForm = ReactDOM.findDOMNode(myNode);
    const myInput = myForm.firstElementChild;


    // Access input value to trigger the descriptor above
    myInput.value;
  
    expect(getterInterceptor).toHaveBeenCalled();
  });

  it('triggers descriptor installed after react', () => {
    class MyForm extends React.Component {
      render() {
        return (
          <form>
            <input type='text'></input>
          </form>
        )
      }
    }

    const myNode = ReactTestUtils.renderIntoDocument(<MyForm />);
    const myForm = ReactDOM.findDOMNode(myNode);
    const myInput = myForm.firstElementChild;


    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    );
    const {get, set} = descriptor;

    const getterInterceptor = jest.fn();

    Object.defineProperty(HTMLInputElement.prototype, 'value', {
      configurable: true,
      get: function() {
        getterInterceptor();
        return get.call(this);
      },
      set: function(value) {
        set.call(this, value);
      }
    });

    // Access input value to trigger the descriptor above
    myInput.value;
  
    expect(getterInterceptor).toHaveBeenCalled();
  });

  it('triggers original descriptor when the current one has been deleted', () => {
    const descriptor = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'value',
    );
    const {get, set} = descriptor;
    Object.defineProperty(HTMLInputElement.prototype, 'value', {
      configurable: true,
      get: function() {
        getterInterceptor();
        return get.call(this);
      },
      set: function(value) {
        set.call(this, value);
      }
    });

    const getterInterceptor = jest.fn();

    class MyForm extends React.Component {
      render() {
        return (
          <form>
            <input type='text'></input>
          </form>
        )
      }
    }

    const myNode = ReactTestUtils.renderIntoDocument(<MyForm />);
    const myForm = ReactDOM.findDOMNode(myNode);
    const myInput = myForm.firstElementChild;

    delete HTMLInputElement.prototype.value

    // Access input value to trigger the descriptor above
    myInput.value;
  
    expect(getterInterceptor).toHaveBeenCalled();
  });
});
