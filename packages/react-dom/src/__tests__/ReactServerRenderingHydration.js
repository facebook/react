/**
 * Copyright (c) 2013-present, Facebook, Inc.
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

// These tests rely both on ReactDOMServer and ReactDOM.
// If a test only needs ReactDOMServer, put it in ReactServerRendering-test instead.
describe('ReactDOMServerHydration', () => {
  beforeEach(() => {
    jest.resetModules();
    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
  });

  it('should have the correct mounting behavior (old hydrate API)', () => {
    let mountCount = 0;
    let numClicks = 0;

    class TestComponent extends React.Component {
      componentDidMount() {
        mountCount++;
      }

      click = () => {
        numClicks++;
      };

      render() {
        return (
          <span ref="span" onClick={this.click}>
            Name: {this.props.name}
          </span>
        );
      }
    }

    const element = document.createElement('div');
    document.body.appendChild(element);
    try {
      ReactDOM.render(<TestComponent />, element);

      let lastMarkup = element.innerHTML;

      // Exercise the update path. Markup should not change,
      // but some lifecycle methods should be run again.
      ReactDOM.render(<TestComponent name="x" />, element);
      expect(mountCount).toEqual(1);

      // Unmount and remount. We should get another mount event and
      // we should get different markup, as the IDs are unique each time.
      ReactDOM.unmountComponentAtNode(element);
      expect(element.innerHTML).toEqual('');
      ReactDOM.render(<TestComponent name="x" />, element);
      expect(mountCount).toEqual(2);
      expect(element.innerHTML).not.toEqual(lastMarkup);

      // Now kill the node and render it on top of server-rendered markup, as if
      // we used server rendering. We should mount again, but the markup should
      // be unchanged. We will append a sentinel at the end of innerHTML to be
      // sure that innerHTML was not changed.
      ReactDOM.unmountComponentAtNode(element);
      expect(element.innerHTML).toEqual('');

      lastMarkup = ReactDOMServer.renderToString(<TestComponent name="x" />);
      element.innerHTML = lastMarkup;

      let instance;

      expect(() => {
        instance = ReactDOM.render(<TestComponent name="x" />, element);
      }).toLowPriorityWarnDev(
        'render(): Calling ReactDOM.render() to hydrate server-rendered markup ' +
          'will stop working in React v17. Replace the ReactDOM.render() call ' +
          'with ReactDOM.hydrate() if you want React to attach to the server HTML.',
      );
      expect(mountCount).toEqual(3);
      expect(element.innerHTML).toBe(lastMarkup);

      // Ensure the events system works after mount into server markup
      expect(numClicks).toEqual(0);

      instance.refs.span.click();
      expect(numClicks).toEqual(1);

      ReactDOM.unmountComponentAtNode(element);
      expect(element.innerHTML).toEqual('');

      // Now simulate a situation where the app is not idempotent. React should
      // warn but do the right thing.
      element.innerHTML = lastMarkup;
      expect(() => {
        instance = ReactDOM.render(<TestComponent name="y" />, element);
      }).toWarnDev('Text content did not match. Server: "x" Client: "y"');
      expect(mountCount).toEqual(4);
      expect(element.innerHTML.length > 0).toBe(true);
      expect(element.innerHTML).not.toEqual(lastMarkup);

      // Ensure the events system works after markup mismatch.
      expect(numClicks).toEqual(1);
      instance.refs.span.click();
      expect(numClicks).toEqual(2);
    } finally {
      document.body.removeChild(element);
    }
  });

  it('should have the correct mounting behavior (new hydrate API)', () => {
    let mountCount = 0;
    let numClicks = 0;

    class TestComponent extends React.Component {
      componentDidMount() {
        mountCount++;
      }

      click = () => {
        numClicks++;
      };

      render() {
        return (
          <span ref="span" onClick={this.click}>
            Name: {this.props.name}
          </span>
        );
      }
    }

    const element = document.createElement('div');
    document.body.appendChild(element);
    try {
      ReactDOM.render(<TestComponent />, element);

      let lastMarkup = element.innerHTML;

      // Exercise the update path. Markup should not change,
      // but some lifecycle methods should be run again.
      ReactDOM.render(<TestComponent name="x" />, element);
      expect(mountCount).toEqual(1);

      // Unmount and remount. We should get another mount event and
      // we should get different markup, as the IDs are unique each time.
      ReactDOM.unmountComponentAtNode(element);
      expect(element.innerHTML).toEqual('');
      ReactDOM.render(<TestComponent name="x" />, element);
      expect(mountCount).toEqual(2);
      expect(element.innerHTML).not.toEqual(lastMarkup);

      // Now kill the node and render it on top of server-rendered markup, as if
      // we used server rendering. We should mount again, but the markup should
      // be unchanged. We will append a sentinel at the end of innerHTML to be
      // sure that innerHTML was not changed.
      ReactDOM.unmountComponentAtNode(element);
      expect(element.innerHTML).toEqual('');

      lastMarkup = ReactDOMServer.renderToString(<TestComponent name="x" />);
      element.innerHTML = lastMarkup;

      let instance = ReactDOM.hydrate(<TestComponent name="x" />, element);
      expect(mountCount).toEqual(3);
      expect(element.innerHTML).toBe(lastMarkup);

      // Ensure the events system works after mount into server markup
      expect(numClicks).toEqual(0);
      instance.refs.span.click();
      expect(numClicks).toEqual(1);

      ReactDOM.unmountComponentAtNode(element);
      expect(element.innerHTML).toEqual('');

      // Now simulate a situation where the app is not idempotent. React should
      // warn but do the right thing.
      element.innerHTML = lastMarkup;
      expect(() => {
        instance = ReactDOM.hydrate(<TestComponent name="y" />, element);
      }).toWarnDev('Text content did not match. Server: "x" Client: "y"');
      expect(mountCount).toEqual(4);
      expect(element.innerHTML.length > 0).toBe(true);
      expect(element.innerHTML).not.toEqual(lastMarkup);

      // Ensure the events system works after markup mismatch.
      expect(numClicks).toEqual(1);
      instance.refs.span.click();
      expect(numClicks).toEqual(2);
    } finally {
      document.body.removeChild(element);
    }
  });

  // We have a polyfill for autoFocus on the client, but we intentionally don't
  // want it to call focus() when hydrating because this can mess up existing
  // focus before the JS has loaded.
  it('should emit autofocus on the server but not focus() when hydrating', () => {
    const element = document.createElement('div');
    element.innerHTML = ReactDOMServer.renderToString(
      <input autoFocus={true} />,
    );
    expect(element.firstChild.autofocus).toBe(true);

    // It should not be called on mount.
    element.firstChild.focus = jest.fn();
    ReactDOM.hydrate(<input autoFocus={true} />, element);
    expect(element.firstChild.focus).not.toHaveBeenCalled();

    // Or during an update.
    ReactDOM.render(<input autoFocus={true} />, element);
    expect(element.firstChild.focus).not.toHaveBeenCalled();
  });

  it('should not focus on either server or client with autofocus={false}', () => {
    const element = document.createElement('div');
    element.innerHTML = ReactDOMServer.renderToString(
      <input autoFocus={false} />,
    );
    expect(element.firstChild.autofocus).toBe(false);

    element.firstChild.focus = jest.fn();
    ReactDOM.hydrate(<input autoFocus={false} />, element);
    expect(element.firstChild.focus).not.toHaveBeenCalled();

    ReactDOM.render(<input autoFocus={false} />, element);
    expect(element.firstChild.focus).not.toHaveBeenCalled();
  });

  // Regression test for https://github.com/facebook/react/issues/11726
  it('should not focus on either server or client with autofocus={false} even if there is a markup mismatch', () => {
    const element = document.createElement('div');
    element.innerHTML = ReactDOMServer.renderToString(
      <button autoFocus={false}>server</button>,
    );
    expect(element.firstChild.autofocus).toBe(false);

    element.firstChild.focus = jest.fn();

    expect(() =>
      ReactDOM.hydrate(<button autoFocus={false}>client</button>, element),
    ).toWarnDev(
      'Warning: Text content did not match. Server: "server" Client: "client"',
    );

    expect(element.firstChild.focus).not.toHaveBeenCalled();
  });

  it('should throw rendering portals on the server', () => {
    const div = document.createElement('div');
    expect(() => {
      ReactDOMServer.renderToString(
        <div>{ReactDOM.createPortal(<div />, div)}</div>,
      );
    }).toThrow(
      'Portals are not currently supported by the server renderer. ' +
        'Render them conditionally so that they only appear on the client render.',
    );
  });
});
