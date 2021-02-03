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

  it('renders a tree with array of modern context', () => {
    const Ctx1 = React.createContext();
    const Ctx2 = React.createContext();

    class Provider extends React.Component {
      render() {
        return (
          <Ctx1.Provider value={this.props.value}>
            <Ctx2.Provider value={this.props.value2}>
              {this.props.children}
            </Ctx2.Provider>
          </Ctx1.Provider>
        );
      }
    }

    class RenderPropConsumer extends React.Component {
      render() {
        return <Ctx1.Consumer>{value => formatValue(value)}</Ctx1.Consumer>;
      }
    }

    const lifecycleContextLog = [];
    class ContextTypeConsumer extends React.Component {
      static contextType = [Ctx1, Ctx2];
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
        return formatValue(this.context[0]) + formatValue(this.context[1]);
      }
    }

    function FnConsumer() {
      return formatValue(React.useContext(Ctx1));
    }

    const container = document.createElement('div');
    ReactDOM.render(
      <Provider value="a" value2="b">
        <span>
          <RenderPropConsumer />
          <ContextTypeConsumer />
          <FnConsumer />
        </span>
      </Provider>,
      container,
    );
    expect(container.textContent).toBe('aaba');
    expect(lifecycleContextLog).toEqual([]);

    // Test update path
    ReactDOM.render(
      <Provider value="a" value2="b">
        <span>
          <RenderPropConsumer />
          <ContextTypeConsumer />
          <FnConsumer />
        </span>
      </Provider>,
      container,
    );
    expect(container.textContent).toBe('aaba');
    expect(lifecycleContextLog).toEqual([['a', 'b'], ['a', 'b'], ['a', 'b']]);
    lifecycleContextLog.length = 0;

    ReactDOM.render(
      <Provider value="b" value2="a">
        <span>
          <RenderPropConsumer />
          <ContextTypeConsumer />
          <FnConsumer />
        </span>
      </Provider>,
      container,
    );
    expect(container.textContent).toBe('bbab');
    expect(lifecycleContextLog).toEqual([['b', 'a'], ['b', 'a']]); // sCU skipped due to changed context value.
    ReactDOM.unmountComponentAtNode(container);
  });
});
