/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
let ReactTestUtils;

function initModules() {
  // Reset warning cache.
  jest.resetModules();
  React = require('react');
  ReactDOM = require('react-dom');
  ReactDOMServer = require('react-dom/server');
  ReactTestUtils = require('react-dom/test-utils');

  // Make them available to the helpers.
  return {
    ReactDOM,
    ReactDOMServer,
    ReactTestUtils,
  };
}

const {
  resetModules,
  asyncReactDOMRender,
  clientRenderOnServerString,
  expectMarkupMatch,
} = ReactDOMServerIntegrationUtils(initModules);

describe('ReactDOMServerIntegration', () => {
  beforeEach(() => {
    resetModules();
  });

  describe('refs', function () {
    it('should not run ref code on server', async () => {
      let refCount = 0;
      class RefsComponent extends React.Component {
        render() {
          return <div ref={e => refCount++} />;
        }
      }
      await expectMarkupMatch(<RefsComponent />, <div />);
      expect(refCount).toBe(0);
    });

    it('should run ref code on client', async () => {
      let refCount = 0;
      class RefsComponent extends React.Component {
        render() {
          return <div ref={e => refCount++} />;
        }
      }
      await expectMarkupMatch(<div />, <RefsComponent />);
      expect(refCount).toBe(1);
    });

    it('should send the correct element to ref functions on client', async () => {
      let refElement = null;
      class RefsComponent extends React.Component {
        render() {
          return <div ref={e => (refElement = e)} />;
        }
      }
      const e = await clientRenderOnServerString(<RefsComponent />);
      expect(refElement).not.toBe(null);
      expect(refElement).toBe(e);
    });

    it('should have string refs on client when rendered over server markup', async () => {
      class RefsComponent extends React.Component {
        render() {
          return <div ref="myDiv" />;
        }
      }

      const markup = ReactDOMServer.renderToString(<RefsComponent />);
      const root = document.createElement('div');
      root.innerHTML = markup;
      let component = null;
      resetModules();
      await expect(async () => {
        await asyncReactDOMRender(
          <RefsComponent ref={e => (component = e)} />,
          root,
          true,
        );
      }).toErrorDev([
        'Warning: Component "RefsComponent" contains the string ref "myDiv". ' +
          'Support for string refs will be removed in a future major release. ' +
          'We recommend using useRef() or createRef() instead. ' +
          'Learn more about using refs safely here: https://reactjs.org/link/strict-mode-string-ref\n' +
          '    in RefsComponent (at **)',
      ]);
      expect(component.refs.myDiv).toBe(root.firstChild);
    });
  });

  it('should forward refs', async () => {
    const divRef = React.createRef();

    class InnerComponent extends React.Component {
      render() {
        return <div ref={this.props.forwardedRef}>{this.props.value}</div>;
      }
    }

    const OuterComponent = React.forwardRef((props, ref) => (
      <InnerComponent {...props} forwardedRef={ref} />
    ));

    await clientRenderOnServerString(
      <OuterComponent ref={divRef} value="hello" />,
    );

    expect(divRef.current).not.toBe(null);
    expect(divRef.current.textContent).toBe('hello');
  });
});
