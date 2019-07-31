/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let React;
let ReactDOM;
let ReactFeatureFlags;

describe('ReactLegacyContextDisabled', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.disableLegacyContext = true;
  });

  it('throws for a legacy context provider', () => {
    class Provider extends React.Component {
      static childContextTypes = {
        foo() {},
      };
      getChildContext() {
        return {foo: 10};
      }
      render() {
        return null;
      }
    }

    const container = document.createElement('div');
    expect(() => {
      ReactDOM.render(<Provider />, container);
    }).toThrow(
      'The legacy childContextTypes API is no longer supported. ' +
        'Use React.createContext() instead.',
    );
  });

  it('throws for a legacy context consumer', () => {
    class Consumer extends React.Component {
      static contextTypes = {
        foo() {},
      };
      render() {
        return null;
      }
    }

    const container = document.createElement('div');
    expect(() => {
      ReactDOM.render(<Consumer />, container);
    }).toThrow(
      'The legacy contextTypes API is no longer supported. ' +
        'Use React.createContext() with contextType instead.',
    );
  });

  it('renders a tree with modern context', () => {
    let Ctx = React.createContext();

    class Provider extends React.Component {
      render() {
        return (
          <Ctx.Provider value={this.props.value}>
            {this.props.children}
          </Ctx.Provider>
        );
      }
    }

    class RenderPropConsumer extends React.Component {
      render() {
        return <Ctx.Consumer>{value => value}</Ctx.Consumer>;
      }
    }

    class ContextTypeConsumer extends React.Component {
      static contextType = Ctx;
      render() {
        return this.context;
      }
    }

    function FnConsumer() {
      return React.useContext(Ctx);
    }

    const container = document.createElement('div');
    ReactDOM.render(
      <Provider value="a">
        <span>
          <RenderPropConsumer />
          <ContextTypeConsumer />
          <FnConsumer />
        </span>
      </Provider>,
      container,
    );
    expect(container.textContent).toBe('aaa');
  });
});
