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

function getTestDocument(markup) {
  const doc = document.implementation.createHTMLDocument('');
  doc.open();
  doc.write(
    markup ||
      '<!doctype html><html><meta charset=utf-8><title>test doc</title>',
  );
  doc.close();
  return doc;
}

describe('rendering React components at document', () => {
  beforeEach(() => {
    jest.resetModules();

    React = require('react');
    ReactDOM = require('react-dom');
    ReactDOMServer = require('react-dom/server');
  });

  describe('with new explicit hydration API', () => {
    it('should be able to adopt server markup', () => {
      class Root extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>{'Hello ' + this.props.hello}</body>
            </html>
          );
        }
      }

      const markup = ReactDOMServer.renderToString(<Root hello="world" />);
      expect(markup).not.toContain('DOCTYPE');
      const testDocument = getTestDocument(markup);
      const body = testDocument.body;

      ReactDOM.hydrate(<Root hello="world" />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');

      ReactDOM.hydrate(<Root hello="moon" />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello moon');

      expect(body === testDocument.body).toBe(true);
    });

    it('should not be able to unmount component from document node', () => {
      class Root extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>Hello world</body>
            </html>
          );
        }
      }

      const markup = ReactDOMServer.renderToString(<Root />);
      const testDocument = getTestDocument(markup);
      ReactDOM.hydrate(<Root />, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');

      // In Fiber this actually works. It might not be a good idea though.
      ReactDOM.unmountComponentAtNode(testDocument);
      expect(testDocument.firstChild).toBe(null);
    });

    it('should not be able to switch root constructors', () => {
      class Component extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>Hello world</body>
            </html>
          );
        }
      }

      class Component2 extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>Goodbye world</body>
            </html>
          );
        }
      }

      const markup = ReactDOMServer.renderToString(<Component />);
      const testDocument = getTestDocument(markup);

      ReactDOM.hydrate(<Component />, testDocument);

      expect(testDocument.body.innerHTML).toBe('Hello world');

      // This works but is probably a bad idea.
      ReactDOM.hydrate(<Component2 />, testDocument);

      expect(testDocument.body.innerHTML).toBe('Goodbye world');
    });

    it('should be able to mount into document', () => {
      class Component extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>{this.props.text}</body>
            </html>
          );
        }
      }

      const markup = ReactDOMServer.renderToString(
        <Component text="Hello world" />,
      );
      const testDocument = getTestDocument(markup);

      ReactDOM.hydrate(<Component text="Hello world" />, testDocument);

      expect(testDocument.body.innerHTML).toBe('Hello world');
    });

    it('cannot render over an existing text child at the root', () => {
      const container = document.createElement('div');
      container.textContent = 'potato';
      expect(() => ReactDOM.hydrate(<div>parsnip</div>, container)).toErrorDev(
        'Expected server HTML to contain a matching <div> in <div>.',
      );
      // This creates an unfortunate double text case.
      expect(container.textContent).toBe('potatoparsnip');
    });

    it('renders over an existing nested text child without throwing', () => {
      const container = document.createElement('div');
      const wrapper = document.createElement('div');
      wrapper.textContent = 'potato';
      container.appendChild(wrapper);
      expect(() =>
        ReactDOM.hydrate(
          <div>
            <div>parsnip</div>
          </div>,
          container,
        ),
      ).toErrorDev(
        'Expected server HTML to contain a matching <div> in <div>.',
      );
      expect(container.textContent).toBe('parsnip');
    });

    it('should give helpful errors on state desync', () => {
      class Component extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>{this.props.text}</body>
            </html>
          );
        }
      }

      const markup = ReactDOMServer.renderToString(
        <Component text="Goodbye world" />,
      );
      const testDocument = getTestDocument(markup);

      expect(() =>
        ReactDOM.hydrate(<Component text="Hello world" />, testDocument),
      ).toErrorDev('Warning: Text content did not match.');
      expect(testDocument.body.innerHTML).toBe('Hello world');
    });

    it('should render w/ no markup to full document', () => {
      const testDocument = getTestDocument();

      class Component extends React.Component {
        render() {
          return (
            <html>
              <head>
                <title>Hello World</title>
              </head>
              <body>{this.props.text}</body>
            </html>
          );
        }
      }

      // getTestDocument() has an extra <meta> that we didn't render.
      expect(() =>
        ReactDOM.hydrate(<Component text="Hello world" />, testDocument),
      ).toErrorDev('Did not expect server HTML to contain a <meta> in <head>.');
      expect(testDocument.body.innerHTML).toBe('Hello world');
    });

    it('supports findDOMNode on full-page components', () => {
      const tree = (
        <html>
          <head>
            <title>Hello World</title>
          </head>
          <body>Hello world</body>
        </html>
      );

      const markup = ReactDOMServer.renderToString(tree);
      const testDocument = getTestDocument(markup);
      const component = ReactDOM.hydrate(tree, testDocument);
      expect(testDocument.body.innerHTML).toBe('Hello world');
      expect(ReactDOM.findDOMNode(component).tagName).toBe('HTML');
    });
  });
});
