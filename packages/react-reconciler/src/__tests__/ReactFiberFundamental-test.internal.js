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
let ReactNoop;
let Scheduler;
let ReactFeatureFlags;
let ReactTestRenderer;
let ReactDOM;
let ReactDOMServer;

function createReactFundamentalComponent(fundamentalImpl) {
  return React.unstable_createFundamental(fundamentalImpl);
}

function init() {
  jest.resetModules();
  ReactFeatureFlags = require('shared/ReactFeatureFlags');
  ReactFeatureFlags.enableFundamentalAPI = true;
  React = require('react');
  Scheduler = require('scheduler');
}

function initNoopRenderer() {
  init();
  ReactNoop = require('react-noop-renderer');
}

function initTestRenderer() {
  init();
  ReactTestRenderer = require('react-test-renderer');
}

function initReactDOM() {
  init();
  ReactDOM = require('react-dom');
}

function initReactDOMServer() {
  init();
  ReactDOMServer = require('react-dom/server');
}

describe('ReactFiberFundamental', () => {
  describe('NoopRenderer', () => {
    beforeEach(() => {
      initNoopRenderer();
    });

    // @gate experimental
    it('should render a simple fundamental component with a single child', () => {
      const FundamentalComponent = createReactFundamentalComponent({
        reconcileChildren: true,
        getInstance(context, props, state) {
          const instance = {
            children: [],
            text: null,
            type: 'test',
          };
          return instance;
        },
      });

      const Test = ({children}) => (
        <FundamentalComponent>{children}</FundamentalComponent>
      );

      ReactNoop.render(<Test>Hello world</Test>);
      expect(Scheduler).toFlushWithoutYielding();
      expect(ReactNoop).toMatchRenderedOutput(<test>Hello world</test>);
      ReactNoop.render(<Test>Hello world again</Test>);
      expect(Scheduler).toFlushWithoutYielding();
      expect(ReactNoop).toMatchRenderedOutput(<test>Hello world again</test>);
      ReactNoop.render(null);
      expect(Scheduler).toFlushWithoutYielding();
      expect(ReactNoop).toMatchRenderedOutput(null);
    });
  });

  describe('NoopTestRenderer', () => {
    beforeEach(() => {
      initTestRenderer();
    });

    // @gate experimental
    it('should render a simple fundamental component with a single child', () => {
      const FundamentalComponent = createReactFundamentalComponent({
        reconcileChildren: true,
        getInstance(context, props, state) {
          const instance = {
            children: [],
            props,
            type: 'test',
            tag: 'INSTANCE',
          };
          return instance;
        },
      });

      const Test = ({children}) => (
        <FundamentalComponent>{children}</FundamentalComponent>
      );

      const root = ReactTestRenderer.create(null);
      root.update(<Test>Hello world</Test>);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(<test>Hello world</test>);
      root.update(<Test>Hello world again</Test>);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(<test>Hello world again</test>);
      root.update(null);
      expect(Scheduler).toFlushWithoutYielding();
      expect(root).toMatchRenderedOutput(null);
    });
  });

  describe('ReactDOM', () => {
    beforeEach(() => {
      initReactDOM();
    });

    // @gate experimental
    it('should render a simple fundamental component with a single child', () => {
      const FundamentalComponent = createReactFundamentalComponent({
        reconcileChildren: true,
        getInstance(context, props, state) {
          const instance = document.createElement('div');
          return instance;
        },
      });

      const Test = ({children}) => (
        <FundamentalComponent>{children}</FundamentalComponent>
      );

      const container = document.createElement('div');
      ReactDOM.render(<Test>Hello world</Test>, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('<div>Hello world</div>');
      ReactDOM.render(<Test>Hello world again</Test>, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('<div>Hello world again</div>');
      ReactDOM.render(null, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('');
    });

    // @gate experimental
    it('should render a simple fundamental component without reconcileChildren', () => {
      const FundamentalComponent = createReactFundamentalComponent({
        reconcileChildren: false,
        getInstance(context, props, state) {
          const instance = document.createElement('div');
          instance.textContent = 'Hello world';
          return instance;
        },
      });

      const Test = () => <FundamentalComponent />;

      const container = document.createElement('div');
      ReactDOM.render(<Test />, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('<div>Hello world</div>');
      // Children should be ignored
      ReactDOM.render(<Test>Hello world again</Test>, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('<div>Hello world</div>');
      ReactDOM.render(null, container);
      expect(Scheduler).toFlushWithoutYielding();
      expect(container.innerHTML).toBe('');
    });
  });

  describe('ReactDOMServer', () => {
    beforeEach(() => {
      initReactDOMServer();
    });

    // @gate experimental
    it('should render a simple fundamental component with a single child', () => {
      const getInstance = jest.fn();
      const FundamentalComponent = createReactFundamentalComponent({
        reconcileChildren: true,
        getInstance,
        getServerSideString(context, props) {
          return `<div>`;
        },
        getServerSideStringClose(context, props) {
          return `</div>`;
        },
      });

      const Test = ({children}) => (
        <FundamentalComponent>{children}</FundamentalComponent>
      );

      expect(getInstance).not.toBeCalled();
      let output = ReactDOMServer.renderToString(<Test>Hello world</Test>);
      expect(output).toBe('<div>Hello world</div>');
      output = ReactDOMServer.renderToString(<Test>Hello world again</Test>);
      expect(output).toBe('<div>Hello world again</div>');
    });

    // @gate experimental
    it('should render a simple fundamental component without reconcileChildren', () => {
      const FundamentalComponent = createReactFundamentalComponent({
        reconcileChildren: false,
        getServerSideString(context, props) {
          return `<div>Hello world</div>`;
        },
      });

      const Test = () => <FundamentalComponent />;

      let output = ReactDOMServer.renderToString(<Test />);
      expect(output).toBe('<div>Hello world</div>');
      // Children should be ignored
      output = ReactDOMServer.renderToString(<Test>Hello world again</Test>);
      expect(output).toBe('<div>Hello world</div>');
    });
  });
});
