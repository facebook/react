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
  if (console.error.calls.count() !== count && console.error.calls.count() !== 0) {
    console.log(`We expected ${count} warning(s), but saw ${console.error.calls.count()} warning(s).`);
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
    errorCount
  );
}

// Renders text using SSR and then stuffs it into a DOM node; returns the DOM
// element that corresponds with the reactElement.
// Does not render on client or perform client-side revival.
async function serverRender(reactElement, errorCount = 0) {
  const markup = await expectErrors(
    () => Promise.resolve(ReactDOMServer.renderToString(reactElement)),
    errorCount
  );
  var domElement = document.createElement('div');
  domElement.innerHTML = markup;
  return domElement.firstChild;
}

const clientCleanRender = (element, errorCount = 0) => {
  const div = document.createElement('div');
  return renderIntoDom(element, div, errorCount);
};

const clientRenderOnServerString = async (element, errorCount = 0) => {
  const markup = await serverRender(element, errorCount);
  var domElement = document.createElement('div');
  domElement.innerHTML = markup;
  return renderIntoDom(element, domElement, errorCount);
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
  it(`renders ${desc} with server string render`,
    () => testFn(serverRender));
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
  it(`renders ${desc} with clean client render`,
    () => testFn(clientCleanRender));
  it(`renders ${desc} with client render on top of good server markup`,
    () => testFn(clientRenderOnServerString));
  it(`renders ${desc} with client render on top of bad server markup`,
    () => testFn(clientRenderOnBadMarkup));
}

describe('ReactDOMServerIntegration', () => {
  beforeEach(() => {
    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactDOMServer = require('ReactDOMServer');

    ExecutionEnvironment = require('ExecutionEnvironment');
    ExecutionEnvironment.canUseDOM = false;
  });

  describe('basic rendering', function() {
    itRenders('a blank div', async render => {
      const e = await render(<div />);
      expect(e.tagName).toBe('DIV');
    });

    itRenders('a div with inline styles', async render => {
      const e = await render(<div style={{color:'red', width:'30px'}} />);
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
});
