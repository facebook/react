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
let ReactDOMServer;
let ReactFeatureFlags;

describe('ReactLegacyContextDisabled', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
    ReactFeatureFlags = require('shared/ReactFeatureFlags');
    ReactFeatureFlags.disableLegacyContext = true;
  });

  function formatValue(val) {
    if (val === null) {
      return 'null';
    }
    if (val === undefined) {
      return 'undefined';
    }
    if (typeof val === 'string') {
      return val;
    }
    return JSON.stringify(val);
  }

  it('warns for legacy context', () => {
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

    const lifecycleContextLog = [];
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
        return formatValue(this.context);
      }
    }

    function LegacyFnConsumer(props, context) {
      return formatValue(context);
    }
    LegacyFnConsumer.contextTypes = {foo() {}};

    function RegularFn(props, context) {
      return formatValue(context);
    }

    const container = document.createElement('div');
    expect(() => {
      ReactDOM.render(
        <LegacyProvider>
          <span>
            <LegacyClsConsumer />
            <LegacyFnConsumer />
            <RegularFn />
          </span>
        </LegacyProvider>,
        container,
      );
    }).toErrorDev([
      'LegacyProvider uses the legacy childContextTypes API which is no longer supported. ' +
        'Use React.createContext() instead.',
      'LegacyClsConsumer uses the legacy contextTypes API which is no longer supported. ' +
        'Use React.createContext() with static contextType instead.',
      'LegacyFnConsumer uses the legacy contextTypes API which is no longer supported. ' +
        'Use React.createContext() with React.useContext() instead.',
    ]);
    expect(container.textContent).toBe('{}undefinedundefined');
    expect(lifecycleContextLog).toEqual([]);

    // Test update path.
    ReactDOM.render(
      <LegacyProvider>
        <span>
          <LegacyClsConsumer />
          <LegacyFnConsumer />
          <RegularFn />
        </span>
      </LegacyProvider>,
      container,
    );
    expect(container.textContent).toBe('{}undefinedundefined');
    expect(lifecycleContextLog).toEqual([{}, {}, {}]);
    ReactDOM.unmountComponentAtNode(container);

    // test server path.
    let text;
    expect(() => {
      text = ReactDOMServer.renderToString(
        <LegacyProvider>
          <span>
            <LegacyClsConsumer />
            <LegacyFnConsumer />
            <RegularFn />
          </span>
        </LegacyProvider>,
        container,
      );
    }).toErrorDev([
      'LegacyProvider uses the legacy childContextTypes API which is no longer supported. ' +
        'Use React.createContext() instead.',
      'LegacyClsConsumer uses the legacy contextTypes API which is no longer supported. ' +
        'Use React.createContext() with static contextType instead.',
      'LegacyFnConsumer uses the legacy contextTypes API which is no longer supported. ' +
        'Use React.createContext() with React.useContext() instead.',
    ]);
    expect(text).toBe(
      '<span data-reactroot="">{}<!-- -->undefined<!-- -->undefined</span>',
    );
    expect(lifecycleContextLog).toEqual([{}, {}, {}]);
  });

  it('renders a tree with modern context', () => {
    const Ctx = React.createContext();

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
        return <Ctx.Consumer>{value => formatValue(value)}</Ctx.Consumer>;
      }
    }

    const lifecycleContextLog = [];
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
        return formatValue(this.context);
      }
    }

    function FnConsumer() {
      return formatValue(React.useContext(Ctx));
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
    expect(lifecycleContextLog).toEqual([]);

    // Test update path
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
    expect(lifecycleContextLog).toEqual(['a', 'a', 'a']);
    lifecycleContextLog.length = 0;

    ReactDOM.render(
      <Provider value="b">
        <span>
          <RenderPropConsumer />
          <ContextTypeConsumer />
          <FnConsumer />
        </span>
      </Provider>,
      container,
    );
    expect(container.textContent).toBe('bbb');
    expect(lifecycleContextLog).toEqual(['b', 'b']); // sCU skipped due to changed context value.
    ReactDOM.unmountComponentAtNode(container);
  });
});
