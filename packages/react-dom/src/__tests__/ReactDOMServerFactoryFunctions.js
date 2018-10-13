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
let ReactDOMServer;
const createWarning = componentName =>
  `The <${componentName} /> component appears to be defined as a factory function. ` +
  `Those components will be deprecated with React 17.x. Please convert <${componentName} /> into a functional ` +
  'or class component. You can refer to https://github.com/facebook/react/issues/13560 for more info.';

function initModules() {
  jest.resetModuleRegistry();
  React = require('react');
  ReactDOM = require('react-dom');
  ReactDOMServer = require('react-dom/server');

  // Make them available to the helpers.
  return {
    ReactDOM,
    ReactDOMServer,
  };
}

const FactoryComponent = () => {
  return {
    render: function() {
      return <div>foo</div>;
    },
  };
};

const {resetModules, itRenders} = ReactDOMServerIntegrationUtils(initModules);

describe('ReactDOMServerFactoryFunctions', () => {
  beforeEach(() => {
    resetModules();
  });

  itRenders(
    'should warn about future deprecation of factory components',
    render => {
      expect(() =>
        ReactDOMServer.renderToString(<FactoryComponent />),
      ).toWarnDev(createWarning('FactoryComponent'), {withoutStack: true});
    },
  );

  itRenders(
    'should NOT warn about future deprecation of factory components in PRODUCTION',
    render => {
      spyOnProd(console, 'error');

      if (!__DEV__) {
        ReactDOMServer.renderToString(<FactoryComponent />);
        expect(console.error).toHaveBeenCalledTimes(0);
      }
    },
  );

  itRenders(
    'should warn ONLY ONCE about future deprecation of factory components',
    render => {
      expect(() =>
        ReactDOMServer.renderToString(<FactoryComponent />),
      ).toWarnDev(createWarning('FactoryComponent'), {withoutStack: true});

      if (__DEV__) {
        expect(() =>
          ReactDOMServer.renderToString(<FactoryComponent />),
        ).not.toWarnDev(createWarning('FactoryComponent'), {
          withoutStack: true,
        });
      }
    },
  );

  itRenders(
    'should not warn about future deprecation of functional components',
    render => {
      function Hello(props) {
        return <div>foo</div>;
      }

      if (__DEV__) {
        expect(() => ReactDOMServer.renderToString(<Hello />)).not.toWarnDev(
          createWarning('Hello'),
          {withoutStack: true},
        );
      }
    },
  );

  itRenders(
    'should not warn about future deprecation of class components',
    render => {
      class Hello extends React.Component {
        render() {
          return <div>foo</div>;
        }
      }

      if (__DEV__) {
        expect(() => ReactDOMServer.renderToString(<Hello />)).not.toWarnDev(
          createWarning('Hello'),
          {withoutStack: true},
        );
      }
    },
  );
});
