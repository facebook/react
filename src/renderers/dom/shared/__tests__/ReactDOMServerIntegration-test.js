/**
 * Copyright 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

'use strict';

let ExecutionEnvironment;
let React;
let ReactDOM;
let ReactDOMServer;

// Helper functions for rendering tests
// ====================================

// promisified version of ReactDOM.render()
function asyncReactDOMRender(reactElement, domElement) {
  return new Promise(resolve =>
    ReactDOM.render(reactElement, domElement, resolve));
}
// performs fn asynchronously and expects count errors logged to console.error.
// will fail the test if the count of errors logged is not equal to count.
async function expectErrors(fn, count) {
  if (console.error.calls && console.error.calls.reset) {
    console.error.calls.reset();
  } else {
    spyOn(console, 'error');
  }

  const result = await fn();
  if (
    console.error.calls.count() !== count && console.error.calls.count() !== 0
  ) {
    console.log(
      `We expected ${count} warning(s), but saw ${console.error.calls.count()} warning(s).`,
    );
    if (console.error.calls.count() > 0) {
      console.log(`We saw these warnings:`);
      for (var i = 0; i < console.error.calls.count(); i++) {
        console.log(console.error.calls.argsFor(i)[0]);
      }
    }
  }
  expectDev(console.error.calls.count()).toBe(count);
  return result;
}

// renders the reactElement into domElement, and expects a certain number of errors.
// returns a Promise that resolves when the render is complete.
function renderIntoDom(reactElement, domElement, errorCount = 0) {
  return expectErrors(
    async () => {
      ExecutionEnvironment.canUseDOM = true;
      await asyncReactDOMRender(reactElement, domElement);
      ExecutionEnvironment.canUseDOM = false;
      return domElement.firstChild;
    },
    errorCount,
  );
}

async function renderIntoString(reactElement, errorCount = 0) {
  return await expectErrors(
    () =>
      new Promise(resolve =>
        resolve(ReactDOMServer.renderToString(reactElement))),
    errorCount,
  );
}

// Renders text using SSR and then stuffs it into a DOM node; returns the DOM
// element that corresponds with the reactElement.
// Does not render on client or perform client-side revival.
async function serverRender(reactElement, errorCount = 0) {
  const markup = await renderIntoString(reactElement, errorCount);
  var domElement = document.createElement('div');
  domElement.innerHTML = markup;
  return domElement.firstChild;
}

const clientCleanRender = (element, errorCount = 0) => {
  const div = document.createElement('div');
  return renderIntoDom(element, div, errorCount);
};

const clientRenderOnServerString = async (element, errorCount = 0) => {
  const markup = await renderIntoString(element, errorCount);
  resetModules();
  var domElement = document.createElement('div');
  domElement.innerHTML = markup;
  const serverElement = domElement.firstChild;
  const clientElement = await renderIntoDom(element, domElement, errorCount);
  // assert that the DOM element hasn't been replaced.
  // Note that we cannot use expect(serverElement).toBe(clientElement) because
  // of jest bug #1772
  expect(serverElement === clientElement).toBe(true);
  return clientElement;
};

const clientRenderOnBadMarkup = (element, errorCount = 0) => {
  var domElement = document.createElement('div');
  domElement.innerHTML = '<div id="badIdWhichWillCauseMismatch" data-reactroot="" data-reactid="1"></div>';
  return renderIntoDom(element, domElement, errorCount + 1);
};

// runs a DOM rendering test as four different tests, with four different rendering
// scenarios:
// -- render to string on server
// -- render on client without any server markup "clean client render"
// -- render on client on top of good server-generated string markup
// -- render on client on top of bad server-generated markup
//
// testFn is a test that has one arg, which is a render function. the render
// function takes in a ReactElement and an optional expected error count and
// returns a promise of a DOM Element.
//
// You should only perform tests that examine the DOM of the results of
// render; you should not depend on the interactivity of the returned DOM element,
// as that will not work in the server string scenario.
function itRenders(desc, testFn) {
  it(`renders ${desc} with server string render`, () => testFn(serverRender));
  itClientRenders(desc, testFn);
}

// run testFn in three different rendering scenarios:
// -- render on client without any server markup "clean client render"
// -- render on client on top of good server-generated string markup
// -- render on client on top of bad server-generated markup
//
// testFn is a test that has one arg, which is a render function. the render
// function takes in a ReactElement and an optional expected error count and
// returns a promise of a DOM Element.
//
// Since all of the renders in this function are on the client, you can test interactivity,
// unlike with itRenders.
function itClientRenders(desc, testFn) {
  it(`renders ${desc} with clean client render`, () =>
    testFn(clientCleanRender));
  it(`renders ${desc} with client render on top of good server markup`, () =>
    testFn(clientRenderOnServerString));
  it(`renders ${desc} with client render on top of bad server markup`, () =>
    testFn(clientRenderOnBadMarkup));
}

// When there is a test that renders on server and then on client and expects a logged
// error, you want to see the error show up both on server and client. Unfortunately,
// React refuses to issue the same error twice to avoid clogging up the console.
// To get around this, we must reload React modules in between server and client render.
function resetModules() {
  jest.resetModuleRegistry();
  React = require('React');
  ReactDOM = require('ReactDOM');
  ReactDOMServer = require('ReactDOMServer');
  ExecutionEnvironment = require('ExecutionEnvironment');
}

describe('ReactDOMServerIntegration', () => {
  beforeEach(() => {
    resetModules();

    ExecutionEnvironment.canUseDOM = false;
  });

  describe('basic rendering', function() {
    itRenders('a blank div', async render => {
      const e = await render(<div />);
      expect(e.tagName).toBe('DIV');
    });

    itRenders('a div with inline styles', async render => {
      const e = await render(<div style={{color: 'red', width: '30px'}} />);
      expect(e.style.color).toBe('red');
      expect(e.style.width).toBe('30px');
    });

    itRenders('a self-closing tag', async render => {
      const e = await render(<br />);
      expect(e.tagName).toBe('BR');
    });

    itRenders('a self-closing tag as a child', async render => {
      const e = await render(<div><br /></div>);
      expect(e.childNodes.length).toBe(1);
      expect(e.firstChild.tagName).toBe('BR');
    });
  });

  describe('property to attribute mapping', function() {
    describe('string properties', function() {
      itRenders('simple numbers', async render => {
        const e = await render(<div width={30} />);
        expect(e.getAttribute('width')).toBe('30');
      });

      itRenders('simple strings', async render => {
        const e = await render(<div width={'30'} />);
        expect(e.getAttribute('width')).toBe('30');
      });

      // this seems like it might mask programmer error, but it's existing behavior.
      itRenders('string prop with true value', async render => {
        const e = await render(<a href={true} />);
        expect(e.getAttribute('href')).toBe('true');
      });

      // this seems like it might mask programmer error, but it's existing behavior.
      itRenders('string prop with false value', async render => {
        const e = await render(<a href={false} />);
        expect(e.getAttribute('href')).toBe('false');
      });
    });

    describe('boolean properties', function() {
      itRenders('boolean prop with true value', async render => {
        const e = await render(<div hidden={true} />);
        expect(e.getAttribute('hidden')).toBe('');
      });

      itRenders('boolean prop with false value', async render => {
        const e = await render(<div hidden={false} />);
        expect(e.getAttribute('hidden')).toBe(null);
      });

      itRenders('boolean prop with self value', async render => {
        const e = await render(<div hidden="hidden" />);
        expect(e.getAttribute('hidden')).toBe('');
      });

      // this does not seem like correct behavior, since hidden="" in HTML indicates
      // that the boolean property is present. however, it is how the current code
      // behaves, so the test is included here.
      itRenders('boolean prop with "" value', async render => {
        const e = await render(<div hidden="" />);
        expect(e.getAttribute('hidden')).toBe(null);
      });

      // this seems like it might mask programmer error, but it's existing behavior.
      itRenders('boolean prop with string value', async render => {
        const e = await render(<div hidden="foo" />);
        expect(e.getAttribute('hidden')).toBe('');
      });

      // this seems like it might mask programmer error, but it's existing behavior.
      itRenders('boolean prop with array value', async render => {
        const e = await render(<div hidden={['foo', 'bar']} />);
        expect(e.getAttribute('hidden')).toBe('');
      });

      // this seems like it might mask programmer error, but it's existing behavior.
      itRenders('boolean prop with object value', async render => {
        const e = await render(<div hidden={{foo: 'bar'}} />);
        expect(e.getAttribute('hidden')).toBe('');
      });

      // this seems like it might mask programmer error, but it's existing behavior.
      itRenders('boolean prop with non-zero number value', async render => {
        const e = await render(<div hidden={10} />);
        expect(e.getAttribute('hidden')).toBe('');
      });

      // this seems like it might mask programmer error, but it's existing behavior.
      itRenders('boolean prop with zero value', async render => {
        const e = await render(<div hidden={0} />);
        expect(e.getAttribute('hidden')).toBe(null);
      });
    });

    describe('download property (combined boolean/string attribute)', function() {
      itRenders('download prop with true value', async render => {
        const e = await render(<a download={true} />);
        expect(e.getAttribute('download')).toBe('');
      });

      itRenders('download prop with false value', async render => {
        const e = await render(<a download={false} />);
        expect(e.getAttribute('download')).toBe(null);
      });

      itRenders('download prop with string value', async render => {
        const e = await render(<a download="myfile" />);
        expect(e.getAttribute('download')).toBe('myfile');
      });

      itRenders('download prop with string "true" value', async render => {
        const e = await render(<a download={'true'} />);
        expect(e.getAttribute('download')).toBe('true');
      });
    });

    describe('className property', function() {
      itRenders('className prop with string value', async render => {
        const e = await render(<div className="myClassName" />);
        expect(e.getAttribute('class')).toBe('myClassName');
      });

      itRenders('className prop with empty string value', async render => {
        const e = await render(<div className="" />);
        expect(e.getAttribute('class')).toBe('');
      });

      // this probably is just masking programmer error, but it is existing behavior.
      itRenders('className prop with true value', async render => {
        const e = await render(<div className={true} />);
        expect(e.getAttribute('class')).toBe('true');
      });

      // this probably is just masking programmer error, but it is existing behavior.
      itRenders('className prop with false value', async render => {
        const e = await render(<div className={false} />);
        expect(e.getAttribute('class')).toBe('false');
      });
    });

    describe('htmlFor property', function() {
      itRenders('htmlFor with string value', async render => {
        const e = await render(<div htmlFor="myFor" />);
        expect(e.getAttribute('for')).toBe('myFor');
      });

      itRenders('htmlFor with an empty string', async render => {
        const e = await render(<div htmlFor="" />);
        expect(e.getAttribute('for')).toBe('');
      });

      // this probably is just masking programmer error, but it is existing behavior.
      itRenders('className prop with true value', async render => {
        const e = await render(<div htmlFor={true} />);
        expect(e.getAttribute('for')).toBe('true');
      });

      // this probably is just masking programmer error, but it is existing behavior.
      itRenders('className prop with false value', async render => {
        const e = await render(<div htmlFor={false} />);
        expect(e.getAttribute('for')).toBe('false');
      });
    });

    describe('props with special meaning in React', function() {
      itRenders('no ref attribute', async render => {
        class RefComponent extends React.Component {
          render() {
            return <div ref="foo" />;
          }
        }
        const e = await render(<RefComponent />);
        expect(e.getAttribute('ref')).toBe(null);
      });

      itRenders('no children attribute', async render => {
        const e = await render(React.createElement('div', {}, 'foo'));
        expect(e.getAttribute('children')).toBe(null);
      });

      itRenders('no key attribute', async render => {
        const e = await render(<div key="foo" />);
        expect(e.getAttribute('key')).toBe(null);
      });

      itRenders('no dangerouslySetInnerHTML attribute', async render => {
        const e = await render(
          <div dangerouslySetInnerHTML={{__html: 'foo'}} />,
        );
        expect(e.getAttribute('dangerouslySetInnerHTML')).toBe(null);
      });
    });

    describe('unknown attributes', function() {
      itRenders('no unknown attributes', async render => {
        const e = await render(<div foo="bar" />, 1);
        expect(e.getAttribute('foo')).toBe(null);
      });

      itRenders('unknown data- attributes', async render => {
        const e = await render(<div data-foo="bar" />);
        expect(e.getAttribute('data-foo')).toBe('bar');
      });

      itRenders(
        'no unknown attributes for non-standard elements',
        async render => {
          const e = await render(<nonstandard foo="bar" />, 1);
          expect(e.getAttribute('foo')).toBe(null);
        },
      );

      itRenders('unknown attributes for custom elements', async render => {
        const e = await render(<custom-element foo="bar" />);
        expect(e.getAttribute('foo')).toBe('bar');
      });

      itRenders(
        'unknown attributes for custom elements using is',
        async render => {
          const e = await render(<div is="custom-element" foo="bar" />);
          expect(e.getAttribute('foo')).toBe('bar');
        },
      );
    });

    itRenders('no HTML events', async render => {
      const e = await render(<div onClick={() => {}} />);
      expect(e.getAttribute('onClick')).toBe(null);
      expect(e.getAttribute('onClick')).toBe(null);
      expect(e.getAttribute('click')).toBe(null);
    });
  });
});
