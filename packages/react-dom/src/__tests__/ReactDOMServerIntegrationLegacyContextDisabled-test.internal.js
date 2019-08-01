/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const ReactDOMServerIntegrationUtils = require('./utils/ReactDOMServerIntegrationTestUtils');

let React;
let ReactDOM;
let ReactFeatureFlags;
let ReactDOMServer;
let ReactTestUtils;

function initModules() {
  // Reset warning cache.
  jest.resetModuleRegistry();
  React = require('react');
  ReactDOM = require('react-dom');
  ReactDOMServer = require('react-dom/server');
  ReactTestUtils = require('react-dom/test-utils');

  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.disableLegacyContext = true;

  // Make them available to the helpers.
  return {
    ReactDOM,
    ReactDOMServer,
    ReactTestUtils,
  };
}

const {resetModules, itRenders} = ReactDOMServerIntegrationUtils(initModules);

describe('ReactDOMServerIntegrationLegacyContextDisabled', () => {
  beforeEach(() => {
    resetModules();
  });

  itRenders('undefined legacy context with warning', async render => {
    class LegacyProvider extends React.Component {
      static childContextTypes = {
        foo() {},
      };
      getChildContext() {
        return {foo: 10};
      }
      render() {
        return this.props.children;
      }
    }

    let lifecycleContextLog = [];
    class LegacyClsConsumer extends React.Component {
      static contextTypes = {
        foo() {},
      };
      shouldComponentUpdate(nextProps, nextState, nextContext) {
        lifecycleContextLog.push(nextContext);
        return true;
      }
      UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        lifecycleContextLog.push(nextContext);
      }
      UNSAFE_componentWillUpdate(nextProps, nextState, nextContext) {
        lifecycleContextLog.push(nextContext);
      }
      render() {
        return typeof this.context;
      }
    }

    function LegacyFnConsumer(props, context) {
      return typeof context;
    }
    LegacyFnConsumer.contextTypes = {foo() {}};

    function RegularFn(props, context) {
      return typeof context;
    }

    const e = await render(
      <LegacyProvider>
        <span>
          <LegacyClsConsumer />
          <LegacyFnConsumer />
          <RegularFn />
        </span>
      </LegacyProvider>,
      3,
    );
    expect(e.textContent).toBe('undefinedundefinedundefined');
    expect(lifecycleContextLog).toEqual([]);
  });

  itRenders('modern context', async render => {
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

    let lifecycleContextLog = [];
    class ContextTypeConsumer extends React.Component {
      static contextType = Ctx;
      shouldComponentUpdate(nextProps, nextState, nextContext) {
        lifecycleContextLog.push(nextContext);
        return true;
      }
      UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        lifecycleContextLog.push(nextContext);
      }
      UNSAFE_componentWillUpdate(nextProps, nextState, nextContext) {
        lifecycleContextLog.push(nextContext);
      }
      render() {
        return this.context;
      }
    }

    function FnConsumer() {
      return React.useContext(Ctx);
    }

    const e = await render(
      <Provider value="a">
        <span>
          <RenderPropConsumer />
          <ContextTypeConsumer />
          <FnConsumer />
        </span>
      </Provider>,
    );
    expect(e.textContent).toBe('aaa');
    expect(lifecycleContextLog).toEqual([]);
  });
});
