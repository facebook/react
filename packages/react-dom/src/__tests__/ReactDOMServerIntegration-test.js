/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

let ExecutionEnvironment;
let PropTypes;
let React;
let ReactDOM;
let ReactDOMServer;
let ReactTestUtils;

const stream = require('stream');

const TEXT_NODE_TYPE = 3;

// Helper functions for rendering tests
// ====================================

// promisified version of ReactDOM.render()
function asyncReactDOMRender(reactElement, domElement, forceHydrate) {
  return new Promise(resolve => {
    if (forceHydrate) {
      ReactDOM.hydrate(reactElement, domElement);
    } else {
      ReactDOM.render(reactElement, domElement);
    }
    // We can't use the callback for resolution because that will not catch
    // errors. They're thrown.
    resolve();
  });
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
    console.error.calls.count() !== count &&
    console.error.calls.count() !== 0
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
function renderIntoDom(reactElement, domElement, forceHydrate, errorCount = 0) {
  return expectErrors(async () => {
    ExecutionEnvironment.canUseDOM = true;
    await asyncReactDOMRender(reactElement, domElement, forceHydrate);
    ExecutionEnvironment.canUseDOM = false;
    return domElement.firstChild;
  }, errorCount);
}

async function renderIntoString(reactElement, errorCount = 0) {
  return await expectErrors(
    () =>
      new Promise(resolve =>
        resolve(ReactDOMServer.renderToString(reactElement)),
      ),
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

// this just drains a readable piped into it to a string, which can be accessed
// via .buffer.
class DrainWritable extends stream.Writable {
  constructor(options) {
    super(options);
    this.buffer = '';
  }

  _write(chunk, encoding, cb) {
    this.buffer += chunk;
    cb();
  }
}

async function renderIntoStream(reactElement, errorCount = 0) {
  return await expectErrors(
    () =>
      new Promise(resolve => {
        let writable = new DrainWritable();
        ReactDOMServer.renderToNodeStream(reactElement).pipe(writable);
        writable.on('finish', () => resolve(writable.buffer));
      }),
    errorCount,
  );
}

// Renders text using node stream SSR and then stuffs it into a DOM node;
// returns the DOM element that corresponds with the reactElement.
// Does not render on client or perform client-side revival.
async function streamRender(reactElement, errorCount = 0) {
  const markup = await renderIntoStream(reactElement, errorCount);
  var domElement = document.createElement('div');
  domElement.innerHTML = markup;
  return domElement.firstChild;
}

const clientCleanRender = (element, errorCount = 0) => {
  const div = document.createElement('div');
  return renderIntoDom(element, div, false, errorCount);
};

const clientRenderOnServerString = async (element, errorCount = 0) => {
  const markup = await renderIntoString(element, errorCount);
  resetModules();

  var domElement = document.createElement('div');
  domElement.innerHTML = markup;
  let serverNode = domElement.firstChild;

  const firstClientNode = await renderIntoDom(
    element,
    domElement,
    true,
    errorCount,
  );
  let clientNode = firstClientNode;

  // Make sure all top level nodes match up
  while (serverNode || clientNode) {
    expect(serverNode != null).toBe(true);
    expect(clientNode != null).toBe(true);
    expect(clientNode.nodeType).toBe(serverNode.nodeType);
    // Assert that the DOM element hasn't been replaced.
    // Note that we cannot use expect(serverNode).toBe(clientNode) because
    // of jest bug #1772.
    expect(serverNode === clientNode).toBe(true);
    serverNode = serverNode.nextSibling;
    clientNode = clientNode.nextSibling;
  }
  return firstClientNode;
};

function BadMarkupExpected() {}

const clientRenderOnBadMarkup = async (element, errorCount = 0) => {
  // First we render the top of bad mark up.
  var domElement = document.createElement('div');
  domElement.innerHTML =
    '<div id="badIdWhichWillCauseMismatch" data-reactroot="" data-reactid="1"></div>';
  await renderIntoDom(element, domElement, true, errorCount + 1);

  // This gives us the resulting text content.
  var hydratedTextContent = domElement.textContent;

  // Next we render the element into a clean DOM node client side.
  const cleanDomElement = document.createElement('div');
  ExecutionEnvironment.canUseDOM = true;
  await asyncReactDOMRender(element, cleanDomElement, true);
  ExecutionEnvironment.canUseDOM = false;
  // This gives us the expected text content.
  const cleanTextContent = cleanDomElement.textContent;

  // The only guarantee is that text content has been patched up if needed.
  expect(hydratedTextContent).toBe(cleanTextContent);

  // Abort any further expects. All bets are off at this point.
  throw new BadMarkupExpected();
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
  it(`renders ${desc} with server stream render`, () => testFn(streamRender));
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
  it(`renders ${desc} with client render on top of bad server markup`, async () => {
    try {
      await testFn(clientRenderOnBadMarkup);
    } catch (x) {
      // We expect this to trigger the BadMarkupExpected rejection.
      if (!(x instanceof BadMarkupExpected)) {
        // If not, rethrow.
        throw x;
      }
    }
  });
}

function itThrows(desc, testFn, partialMessage) {
  it(`throws ${desc}`, () => {
    return testFn().then(
      () => expect(false).toBe('The promise resolved and should not have.'),
      err => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toContain(partialMessage);
      },
    );
  });
}

function itThrowsWhenRendering(desc, testFn, partialMessage) {
  itThrows(
    `when rendering ${desc} with server string render`,
    () => testFn(serverRender),
    partialMessage,
  );
  itThrows(
    `when rendering ${desc} with clean client render`,
    () => testFn(clientCleanRender),
    partialMessage,
  );

  // we subtract one from the warning count here because the throw means that it won't
  // get the usual markup mismatch warning.
  itThrows(
    `when rendering ${desc} with client render on top of bad server markup`,
    () =>
      testFn((element, warningCount = 0) =>
        clientRenderOnBadMarkup(element, warningCount - 1),
      ),
    partialMessage,
  );
}

// renders serverElement to a string, sticks it into a DOM element, and then
// tries to render clientElement on top of it. shouldMatch is a boolean
// telling whether we should expect the markup to match or not.
async function testMarkupMatch(serverElement, clientElement, shouldMatch) {
  const domElement = await serverRender(serverElement);
  resetModules();
  return renderIntoDom(
    clientElement,
    domElement.parentNode,
    true,
    shouldMatch ? 0 : 1,
  );
}

// expects that rendering clientElement on top of a server-rendered
// serverElement does NOT raise a markup mismatch warning.
function expectMarkupMatch(serverElement, clientElement) {
  return testMarkupMatch(serverElement, clientElement, true);
}

// expects that rendering clientElement on top of a server-rendered
// serverElement DOES raise a markup mismatch warning.
function expectMarkupMismatch(serverElement, clientElement) {
  return testMarkupMatch(serverElement, clientElement, false);
}

// When there is a test that renders on server and then on client and expects a logged
// error, you want to see the error show up both on server and client. Unfortunately,
// React refuses to issue the same error twice to avoid clogging up the console.
// To get around this, we must reload React modules in between server and client render.
function resetModules() {
  // First, reset the modules to load the client renderer.
  jest.resetModuleRegistry();

  // TODO: can we express this test with only public API?
  ExecutionEnvironment = require('fbjs/lib/ExecutionEnvironment');

  PropTypes = require('prop-types');
  React = require('react');
  ReactDOM = require('react-dom');
  ReactTestUtils = require('react-dom/test-utils');

  // Now we reset the modules again to load the server renderer.
  // Resetting is important because we want to avoid any shared state
  // influencing the tests.
  jest.resetModuleRegistry();
  ReactDOMServer = require('react-dom/server');
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

    itRenders('a self-closing tag', async render => {
      const e = await render(<br />);
      expect(e.tagName).toBe('BR');
    });

    itRenders('a self-closing tag as a child', async render => {
      const e = await render(<div><br /></div>);
      expect(e.childNodes.length).toBe(1);
      expect(e.firstChild.tagName).toBe('BR');
    });

    itRenders('a string', async render => {
      let e = await render('Hello');
      expect(e.nodeType).toBe(3);
      expect(e.nodeValue).toMatch('Hello');
    });

    itRenders('a number', async render => {
      let e = await render(42);
      expect(e.nodeType).toBe(3);
      expect(e.nodeValue).toMatch('42');
    });

    itRenders('an array with one child', async render => {
      let e = await render([<div key={1}>text1</div>]);
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
    });

    itRenders('an array with several children', async render => {
      let Header = props => {
        return <p>header</p>;
      };
      let Footer = props => {
        return [<h2 key={1}>footer</h2>, <h3 key={2}>about</h3>];
      };
      let e = await render([
        <div key={1}>text1</div>,
        <span key={2}>text2</span>,
        <Header key={3} />,
        <Footer key={4} />,
      ]);
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
      expect(parent.childNodes[1].tagName).toBe('SPAN');
      expect(parent.childNodes[2].tagName).toBe('P');
      expect(parent.childNodes[3].tagName).toBe('H2');
      expect(parent.childNodes[4].tagName).toBe('H3');
    });

    itRenders('a nested array', async render => {
      let e = await render([
        [<div key={1}>text1</div>],
        <span key={1}>text2</span>,
        [[[null, <p key={1} />], false]],
      ]);
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
      expect(parent.childNodes[1].tagName).toBe('SPAN');
      expect(parent.childNodes[2].tagName).toBe('P');
    });

    itRenders('a fragment with one child', async render => {
      let e = await render(<React.Fragment><div>text1</div></React.Fragment>);
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
    });

    itRenders('a fragment with several children', async render => {
      let Header = props => {
        return <p>header</p>;
      };
      let Footer = props => {
        return <React.Fragment><h2>footer</h2><h3>about</h3></React.Fragment>;
      };
      let e = await render(
        <React.Fragment>
          <div>text1</div>
          <span>text2</span>
          <Header />
          <Footer />
        </React.Fragment>,
      );
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
      expect(parent.childNodes[1].tagName).toBe('SPAN');
      expect(parent.childNodes[2].tagName).toBe('P');
      expect(parent.childNodes[3].tagName).toBe('H2');
      expect(parent.childNodes[4].tagName).toBe('H3');
    });

    itRenders('a nested fragment', async render => {
      let e = await render(
        <React.Fragment>
          <React.Fragment>
            <div>text1</div>
          </React.Fragment>
          <span>text2</span>
          <React.Fragment>
            <React.Fragment>
              <React.Fragment>{null}<p /></React.Fragment>{false}
            </React.Fragment>
          </React.Fragment>
        </React.Fragment>,
      );
      let parent = e.parentNode;
      expect(parent.childNodes[0].tagName).toBe('DIV');
      expect(parent.childNodes[1].tagName).toBe('SPAN');
      expect(parent.childNodes[2].tagName).toBe('P');
    });

    itRenders('an iterable', async render => {
      const threeDivIterable = {
        '@@iterator': function() {
          var i = 0;
          return {
            next: function() {
              if (i++ < 3) {
                return {value: <div key={i} />, done: false};
              } else {
                return {value: undefined, done: true};
              }
            },
          };
        },
      };
      let e = await render(threeDivIterable);
      let parent = e.parentNode;
      expect(parent.childNodes.length).toBe(3);
      expect(parent.childNodes[0].tagName).toBe('DIV');
      expect(parent.childNodes[1].tagName).toBe('DIV');
      expect(parent.childNodes[2].tagName).toBe('DIV');
    });

    itRenders('emptyish values', async render => {
      let e = await render(0);
      expect(e.nodeType).toBe(TEXT_NODE_TYPE);
      expect(e.nodeValue).toMatch('0');

      // Empty string is special because client renders a node
      // but server returns empty HTML. So we compare parent text.
      expect((await render(<div>{''}</div>)).textContent).toBe('');

      expect(await render(<React.Fragment />)).toBe(null);
      expect(await render([])).toBe(null);
      expect(await render(false)).toBe(null);
      expect(await render(true)).toBe(null);
      expect(await render(undefined)).toBe(null);
      expect(await render([[[false]], undefined])).toBe(null);
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

      itRenders('no string prop with true value', async render => {
        const e = await render(<a href={true} />, 1);
        expect(e.hasAttribute('href')).toBe(false);
      });

      itRenders('no string prop with false value', async render => {
        const e = await render(<a href={false} />, 1);
        expect(e.hasAttribute('href')).toBe(false);
      });

      itRenders('no string prop with null value', async render => {
        const e = await render(<div width={null} />);
        expect(e.hasAttribute('width')).toBe(false);
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

      itRenders('no boolean prop with null value', async render => {
        const e = await render(<div hidden={null} />);
        expect(e.hasAttribute('hidden')).toBe(false);
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

      itRenders('download prop with string "false" value', async render => {
        const e = await render(<a download="false" />);
        expect(e.getAttribute('download')).toBe('false');
      });

      itRenders('download prop with string "true" value', async render => {
        const e = await render(<a download={'true'} />);
        expect(e.getAttribute('download')).toBe('true');
      });

      itRenders('download prop with number 0 value', async render => {
        const e = await render(<a download={0} />);
        expect(e.getAttribute('download')).toBe('0');
      });

      itRenders('no download prop with null value', async render => {
        const e = await render(<div download={null} />);
        expect(e.hasAttribute('download')).toBe(false);
      });

      itRenders('no download prop with undefined value', async render => {
        const e = await render(<div download={undefined} />);
        expect(e.hasAttribute('download')).toBe(false);
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

      itRenders('no className prop with true value', async render => {
        const e = await render(<div className={true} />, 1);
        expect(e.hasAttribute('class')).toBe(false);
      });

      itRenders('no className prop with false value', async render => {
        const e = await render(<div className={false} />, 1);
        expect(e.hasAttribute('class')).toBe(false);
      });

      itRenders('no className prop with null value', async render => {
        const e = await render(<div className={null} />);
        expect(e.hasAttribute('className')).toBe(false);
      });

      itRenders('badly cased className with a warning', async render => {
        const e = await render(<div classname="test" />, 1);
        expect(e.hasAttribute('class')).toBe(false);
        expect(e.hasAttribute('classname')).toBe(true);
      });

      itRenders(
        'className prop when given the alias with a warning',
        async render => {
          const e = await render(<div class="test" />, 1);
          expect(e.className).toBe('test');
        },
      );

      itRenders(
        'className prop when given a badly cased alias',
        async render => {
          const e = await render(<div cLASs="test" />, 1);
          expect(e.className).toBe('test');
        },
      );

      itRenders('class for custom elements', async render => {
        const e = await render(<div is="custom-element" class="test" />, 0);
        expect(e.getAttribute('class')).toBe('test');
      });

      itRenders('className for custom elements', async render => {
        const e = await render(<div is="custom-element" className="test" />, 0);
        expect(e.getAttribute('className')).toBe('test');
      });
    });

    describe('htmlFor property', function() {
      itRenders('htmlFor with string value', async render => {
        const e = await render(<div htmlFor="myFor" />);
        expect(e.getAttribute('for')).toBe('myFor');
      });

      itRenders('no badly cased htmlfor', async render => {
        const e = await render(<div htmlfor="myFor" />, 1);
        expect(e.hasAttribute('for')).toBe(false);
        expect(e.getAttribute('htmlfor')).toBe('myFor');
      });

      itRenders('htmlFor with an empty string', async render => {
        const e = await render(<div htmlFor="" />);
        expect(e.getAttribute('for')).toBe('');
      });

      itRenders('no htmlFor prop with true value', async render => {
        const e = await render(<div htmlFor={true} />, 1);
        expect(e.hasAttribute('for')).toBe(false);
      });

      itRenders('no htmlFor prop with false value', async render => {
        const e = await render(<div htmlFor={false} />, 1);
        expect(e.hasAttribute('for')).toBe(false);
      });

      itRenders('no htmlFor prop with null value', async render => {
        const e = await render(<div htmlFor={null} />);
        expect(e.hasAttribute('htmlFor')).toBe(false);
      });

      itRenders('htmlFor attribute on custom elements', async render => {
        const e = await render(<div is="custom-element" htmlFor="test" />);
        expect(e.getAttribute('htmlFor')).toBe('test');
      });

      itRenders('for attribute on custom elements', async render => {
        const e = await render(<div is="custom-element" for="test" />);
        expect(e.getAttribute('for')).toBe('test');
      });
    });

    describe('numeric properties', function() {
      itRenders(
        'positive numeric property with positive value',
        async render => {
          const e = await render(<input size={2} />);
          expect(e.getAttribute('size')).toBe('2');
        },
      );

      itRenders(
        'no positive numeric property with zero value',
        async render => {
          const e = await render(<input size={0} />);
          expect(e.hasAttribute('size')).toBe(false);
        },
      );

      itRenders('numeric property with zero value', async render => {
        const e = await render(<ol start={0} />);
        expect(e.getAttribute('start')).toBe('0');
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
          <div dangerouslySetInnerHTML={{__html: '<foo />'}} />,
        );
        expect(e.getAttribute('dangerouslySetInnerHTML')).toBe(null);
      });

      itRenders('no suppressContentEditableWarning attribute', async render => {
        const e = await render(<div suppressContentEditableWarning={true} />);
        expect(e.getAttribute('suppressContentEditableWarning')).toBe(null);
      });

      itRenders('no suppressHydrationWarning attribute', async render => {
        const e = await render(<span suppressHydrationWarning={true} />);
        expect(e.getAttribute('suppressHydrationWarning')).toBe(null);
      });
    });

    describe('inline styles', function() {
      itRenders('simple styles', async render => {
        const e = await render(<div style={{color: 'red', width: '30px'}} />);
        expect(e.style.color).toBe('red');
        expect(e.style.width).toBe('30px');
      });

      itRenders('relevant styles with px', async render => {
        const e = await render(
          <div
            style={{
              left: 0,
              margin: 16,
              opacity: 0.5,
              padding: '4px',
            }}
          />,
        );
        expect(e.style.left).toBe('0px');
        expect(e.style.margin).toBe('16px');
        expect(e.style.opacity).toBe('0.5');
        expect(e.style.padding).toBe('4px');
      });

      itRenders('custom properties', async render => {
        const e = await render(<div style={{'--foo': 5}} />);
        // This seems like an odd way computed properties are exposed in jsdom.
        // In a real browser we'd read it with e.style.getPropertyValue('--foo')
        expect(e.style.Foo).toBe('5');
      });

      itRenders('no undefined styles', async render => {
        const e = await render(
          <div style={{color: undefined, width: '30px'}} />,
        );
        expect(e.style.color).toBe('');
        expect(e.style.width).toBe('30px');
      });

      itRenders('no null styles', async render => {
        const e = await render(<div style={{color: null, width: '30px'}} />);
        expect(e.style.color).toBe('');
        expect(e.style.width).toBe('30px');
      });

      itRenders('no empty styles', async render => {
        const e = await render(<div style={{color: null, width: null}} />);
        expect(e.style.color).toBe('');
        expect(e.style.width).toBe('');
        expect(e.hasAttribute('style')).toBe(false);
      });

      itRenders('unitless-number rules with prefixes', async render => {
        const {style} = await render(
          <div
            style={{
              lineClamp: 10,
              WebkitLineClamp: 10,
              MozFlexGrow: 10,
              msFlexGrow: 10,
              msGridRow: 10,
              msGridRowEnd: 10,
              msGridRowSpan: 10,
              msGridRowStart: 10,
              msGridColumn: 10,
              msGridColumnEnd: 10,
              msGridColumnSpan: 10,
              msGridColumnStart: 10,
            }}
          />,
        );

        expect(style.lineClamp).toBe('10');
        expect(style.WebkitLineClamp).toBe('10');
        expect(style.MozFlexGrow).toBe('10');
        // jsdom is inconsistent in the style property name
        // it uses on the client and when processing server markup.
        // But it should be there either way.
        expect(style.MsFlexGrow || style.msFlexGrow).toBe('10');
        expect(style.MsGridRow || style.msGridRow).toBe('10');
        expect(style.MsGridRowEnd || style.msGridRowEnd).toBe('10');
        expect(style.MsGridRowSpan || style.msGridRowSpan).toBe('10');
        expect(style.MsGridRowStart || style.msGridRowStart).toBe('10');
        expect(style.MsGridColumn || style.msGridColumn).toBe('10');
        expect(style.MsGridColumnEnd || style.msGridColumnEnd).toBe('10');
        expect(style.MsGridColumnSpan || style.msGridColumnSpan).toBe('10');
        expect(style.MsGridColumnStart || style.msGridColumnStart).toBe('10');
      });
    });

    describe('aria attributes', function() {
      itRenders('simple strings', async render => {
        const e = await render(<div aria-label="hello" />);
        expect(e.getAttribute('aria-label')).toBe('hello');
      });

      // this probably is just masking programmer error, but it is existing behavior.
      itRenders('aria string prop with false value', async render => {
        const e = await render(<div aria-label={false} />);
        expect(e.getAttribute('aria-label')).toBe('false');
      });

      itRenders('no aria prop with null value', async render => {
        const e = await render(<div aria-label={null} />);
        expect(e.hasAttribute('aria-label')).toBe(false);
      });

      itRenders('"aria" attribute with a warning', async render => {
        // Reserved for future use.
        const e = await render(<div aria="hello" />, 1);
        expect(e.getAttribute('aria')).toBe('hello');
      });
    });

    describe('cased attributes', function() {
      itRenders(
        'badly cased aliased HTML attribute with a warning',
        async render => {
          const e = await render(<meta httpequiv="refresh" />, 1);
          expect(e.hasAttribute('http-equiv')).toBe(false);
          expect(e.getAttribute('httpequiv')).toBe('refresh');
        },
      );

      itRenders('badly cased SVG attribute with a warning', async render => {
        const e = await render(<text textlength="10" />, 1);
        expect(e.getAttribute('textLength')).toBe('10');
      });

      itRenders('no badly cased aliased SVG attribute alias', async render => {
        const e = await render(<text strokedasharray="10 10" />, 1);
        expect(e.hasAttribute('stroke-dasharray')).toBe(false);
        expect(e.getAttribute('strokedasharray')).toBe('10 10');
      });

      itRenders(
        'no badly cased original SVG attribute that is aliased',
        async render => {
          const e = await render(<text stroke-dasharray="10 10" />, 1);
          expect(e.getAttribute('stroke-dasharray')).toBe('10 10');
        },
      );
    });

    describe('unknown attributes', function() {
      itRenders('unknown attributes', async render => {
        const e = await render(<div foo="bar" />);
        expect(e.getAttribute('foo')).toBe('bar');
      });

      itRenders('unknown data- attributes', async render => {
        const e = await render(<div data-foo="bar" />);
        expect(e.getAttribute('data-foo')).toBe('bar');
      });

      itRenders('badly cased reserved attributes', async render => {
        const e = await render(<div CHILDREN="5" />, 1);
        expect(e.getAttribute('CHILDREN')).toBe('5');
      });

      itRenders('"data" attribute', async render => {
        // For `<object />` acts as `src`.
        const e = await render(<object data="hello" />);
        expect(e.getAttribute('data')).toBe('hello');
      });

      itRenders('no unknown data- attributes with null value', async render => {
        const e = await render(<div data-foo={null} />);
        expect(e.hasAttribute('data-foo')).toBe(false);
      });

      itRenders('unknown data- attributes with casing', async render => {
        const e = await render(<div data-fooBar="true" />, 1);
        expect(e.getAttribute('data-foobar')).toBe('true');
      });

      itRenders('unknown data- attributes with boolean true', async render => {
        const e = await render(<div data-foobar={true} />);
        expect(e.getAttribute('data-foobar')).toBe('true');
      });

      itRenders('unknown data- attributes with boolean false', async render => {
        const e = await render(<div data-foobar={false} />);
        expect(e.getAttribute('data-foobar')).toBe('false');
      });

      itRenders(
        'no unknown data- attributes with casing and null value',
        async render => {
          const e = await render(<div data-fooBar={null} />, 1);
          expect(e.hasAttribute('data-foobar')).toBe(false);
        },
      );

      itRenders('custom attributes for non-standard elements', async render => {
        const e = await render(<nonstandard foo="bar" />);
        expect(e.getAttribute('foo')).toBe('bar');
      });

      itRenders('unknown attributes for custom elements', async render => {
        const e = await render(<custom-element foo="bar" />);
        expect(e.getAttribute('foo')).toBe('bar');
      });

      itRenders(
        'no unknown attributes for custom elements with null value',
        async render => {
          const e = await render(<custom-element foo={null} />);
          expect(e.hasAttribute('foo')).toBe(false);
        },
      );

      itRenders(
        'unknown attributes for custom elements using is',
        async render => {
          const e = await render(<div is="custom-element" foo="bar" />);
          expect(e.getAttribute('foo')).toBe('bar');
        },
      );

      itRenders(
        'no unknown attributes for custom elements using is with null value',
        async render => {
          const e = await render(<div is="custom-element" foo={null} />);
          expect(e.hasAttribute('foo')).toBe(false);
        },
      );

      itRenders('SVG tags with dashes in them', async render => {
        const e = await render(<svg><font-face accentHeight={10} /></svg>);
        expect(e.firstChild.hasAttribute('accentHeight')).toBe(false);
        expect(e.firstChild.getAttribute('accent-height')).toBe('10');
      });

      itRenders('cased custom attributes', async render => {
        const e = await render(<div fooBar="test" />, 1);
        expect(e.getAttribute('foobar')).toBe('test');
      });
    });

    itRenders('no HTML events', async render => {
      const e = await render(<div onClick={() => {}} />);
      expect(e.getAttribute('onClick')).toBe(null);
      expect(e.getAttribute('onClick')).toBe(null);
      expect(e.getAttribute('click')).toBe(null);
    });

    itRenders('no unknown events', async render => {
      const e = await render(
        <div onunknownevent="alert(&quot;hack&quot;)" />,
        1,
      );
      expect(e.getAttribute('onunknownevent')).toBe(null);
    });

    itRenders('custom attribute named `on`', async render => {
      const e = await render(<div on="tap:do-something" />);
      expect(e.getAttribute('on')).toEqual('tap:do-something');
    });
  });

  describe('elements and children', function() {
    function expectNode(node, type, value) {
      expect(node).not.toBe(null);
      expect(node.nodeType).toBe(type);
      expect(node.nodeValue).toMatch(value);
    }

    function expectTextNode(node, text) {
      expectNode(node, TEXT_NODE_TYPE, text);
    }

    describe('text children', function() {
      itRenders('a div with text', async render => {
        const e = await render(<div>Text</div>);
        expect(e.tagName).toBe('DIV');
        expect(e.childNodes.length).toBe(1);
        expectNode(e.firstChild, TEXT_NODE_TYPE, 'Text');
      });

      itRenders('a div with text with flanking whitespace', async render => {
        // prettier-ignore
        const e = await render(<div>  Text </div>);
        expect(e.childNodes.length).toBe(1);
        expectNode(e.childNodes[0], TEXT_NODE_TYPE, '  Text ');
      });

      itRenders('a div with an empty text child', async render => {
        const e = await render(<div>{''}</div>);
        expect(e.childNodes.length).toBe(0);
      });

      itRenders('a div with multiple empty text children', async render => {
        const e = await render(<div>{''}{''}{''}</div>);
        if (render === serverRender || render === streamRender) {
          // For plain server markup result we should have no text nodes if
          // they're all empty.
          expect(e.childNodes.length).toBe(0);
          expect(e.textContent).toBe('');
        } else {
          expect(e.childNodes.length).toBe(3);
          expectTextNode(e.childNodes[0], '');
          expectTextNode(e.childNodes[1], '');
          expectTextNode(e.childNodes[2], '');
        }
      });

      itRenders('a div with multiple whitespace children', async render => {
        const e = await render(<div>{' '}{' '}{' '}</div>);
        if (
          render === serverRender ||
          render === clientRenderOnServerString ||
          render === streamRender
        ) {
          // For plain server markup result we have comments between.
          // If we're able to hydrate, they remain.
          expect(e.childNodes.length).toBe(5);
          expectTextNode(e.childNodes[0], ' ');
          expectTextNode(e.childNodes[2], ' ');
          expectTextNode(e.childNodes[4], ' ');
        } else {
          expect(e.childNodes.length).toBe(3);
          expectTextNode(e.childNodes[0], ' ');
          expectTextNode(e.childNodes[1], ' ');
          expectTextNode(e.childNodes[2], ' ');
        }
      });

      itRenders('a div with text sibling to a node', async render => {
        const e = await render(<div>Text<span>More Text</span></div>);
        let spanNode;
        expect(e.childNodes.length).toBe(2);
        spanNode = e.childNodes[1];
        expectTextNode(e.childNodes[0], 'Text');
        expect(spanNode.tagName).toBe('SPAN');
        expect(spanNode.childNodes.length).toBe(1);
        expectNode(spanNode.firstChild, TEXT_NODE_TYPE, 'More Text');
      });

      itRenders('a non-standard element with text', async render => {
        const e = await render(<nonstandard>Text</nonstandard>);
        expect(e.tagName).toBe('NONSTANDARD');
        expect(e.childNodes.length).toBe(1);
        expectNode(e.firstChild, TEXT_NODE_TYPE, 'Text');
      });

      itRenders('a custom element with text', async render => {
        const e = await render(<custom-element>Text</custom-element>);
        expect(e.tagName).toBe('CUSTOM-ELEMENT');
        expect(e.childNodes.length).toBe(1);
        expectNode(e.firstChild, TEXT_NODE_TYPE, 'Text');
      });

      itRenders('a leading blank child with a text sibling', async render => {
        const e = await render(<div>{''}foo</div>);
        if (render === serverRender || render === streamRender) {
          expect(e.childNodes.length).toBe(1);
          expectTextNode(e.childNodes[0], 'foo');
        } else {
          expect(e.childNodes.length).toBe(2);
          expectTextNode(e.childNodes[0], '');
          expectTextNode(e.childNodes[1], 'foo');
        }
      });

      itRenders('a trailing blank child with a text sibling', async render => {
        const e = await render(<div>foo{''}</div>);
        // with Fiber, there are just two text nodes.
        if (render === serverRender || render === streamRender) {
          expect(e.childNodes.length).toBe(1);
          expectTextNode(e.childNodes[0], 'foo');
        } else {
          expect(e.childNodes.length).toBe(2);
          expectTextNode(e.childNodes[0], 'foo');
          expectTextNode(e.childNodes[1], '');
        }
      });

      itRenders('an element with two text children', async render => {
        const e = await render(<div>{'foo'}{'bar'}</div>);
        if (
          render === serverRender ||
          render === clientRenderOnServerString ||
          render === streamRender
        ) {
          // In the server render output there's a comment between them.
          expect(e.childNodes.length).toBe(3);
          expectTextNode(e.childNodes[0], 'foo');
          expectTextNode(e.childNodes[2], 'bar');
        } else {
          expect(e.childNodes.length).toBe(2);
          expectTextNode(e.childNodes[0], 'foo');
          expectTextNode(e.childNodes[1], 'bar');
        }
      });

      itRenders(
        'a component returning text node between two text nodes',
        async render => {
          const B = () => 'b';
          const e = await render(<div>{'a'}<B />{'c'}</div>);
          if (
            render === serverRender ||
            render === clientRenderOnServerString ||
            render === streamRender
          ) {
            // In the server render output there's a comment between them.
            expect(e.childNodes.length).toBe(5);
            expectTextNode(e.childNodes[0], 'a');
            expectTextNode(e.childNodes[2], 'b');
            expectTextNode(e.childNodes[4], 'c');
          } else {
            expect(e.childNodes.length).toBe(3);
            expectTextNode(e.childNodes[0], 'a');
            expectTextNode(e.childNodes[1], 'b');
            expectTextNode(e.childNodes[2], 'c');
          }
        },
      );

      itRenders('a tree with sibling host and text nodes', async render => {
        class X extends React.Component {
          render() {
            return [null, [<Y key="1" />], false];
          }
        }

        function Y() {
          return [<Z key="1" />, ['c']];
        }

        function Z() {
          return null;
        }

        const e = await render(
          <div>
            {[['a'], 'b']}
            <div>
              <X key="1" />
              d
            </div>
            e
          </div>,
        );
        if (
          render === serverRender ||
          render === clientRenderOnServerString ||
          render === streamRender
        ) {
          // In the server render output there's comments between text nodes.
          expect(e.childNodes.length).toBe(5);
          expectTextNode(e.childNodes[0], 'a');
          expectTextNode(e.childNodes[2], 'b');
          expect(e.childNodes[3].childNodes.length).toBe(3);
          expectTextNode(e.childNodes[3].childNodes[0], 'c');
          expectTextNode(e.childNodes[3].childNodes[2], 'd');
          expectTextNode(e.childNodes[4], 'e');
        } else {
          expect(e.childNodes.length).toBe(4);
          expectTextNode(e.childNodes[0], 'a');
          expectTextNode(e.childNodes[1], 'b');
          expect(e.childNodes[2].childNodes.length).toBe(2);
          expectTextNode(e.childNodes[2].childNodes[0], 'c');
          expectTextNode(e.childNodes[2].childNodes[1], 'd');
          expectTextNode(e.childNodes[3], 'e');
        }
      });
    });

    describe('number children', function() {
      itRenders('a number as single child', async render => {
        const e = await render(<div>{3}</div>);
        expect(e.textContent).toBe('3');
      });

      // zero is falsey, so it could look like no children if the code isn't careful.
      itRenders('zero as single child', async render => {
        const e = await render(<div>{0}</div>);
        expect(e.textContent).toBe('0');
      });

      itRenders('an element with number and text children', async render => {
        const e = await render(<div>{'foo'}{40}</div>);
        // with Fiber, there are just two text nodes.
        if (
          render === serverRender ||
          render === clientRenderOnServerString ||
          render === streamRender
        ) {
          // In the server markup there's a comment between.
          expect(e.childNodes.length).toBe(3);
          expectTextNode(e.childNodes[0], 'foo');
          expectTextNode(e.childNodes[2], '40');
        } else {
          expect(e.childNodes.length).toBe(2);
          expectTextNode(e.childNodes[0], 'foo');
          expectTextNode(e.childNodes[1], '40');
        }
      });
    });

    describe('null, false, and undefined children', function() {
      itRenders('null single child as blank', async render => {
        const e = await render(<div>{null}</div>);
        expect(e.childNodes.length).toBe(0);
      });

      itRenders('false single child as blank', async render => {
        const e = await render(<div>{false}</div>);
        expect(e.childNodes.length).toBe(0);
      });

      itRenders('undefined single child as blank', async render => {
        const e = await render(<div>{undefined}</div>);
        expect(e.childNodes.length).toBe(0);
      });

      itRenders('a null component children as empty', async render => {
        const NullComponent = () => null;
        const e = await render(<div><NullComponent /></div>);
        expect(e.childNodes.length).toBe(0);
      });

      itRenders('null children as blank', async render => {
        const e = await render(<div>{null}foo</div>);
        expect(e.childNodes.length).toBe(1);
        expectTextNode(e.childNodes[0], 'foo');
      });

      itRenders('false children as blank', async render => {
        const e = await render(<div>{false}foo</div>);
        expect(e.childNodes.length).toBe(1);
        expectTextNode(e.childNodes[0], 'foo');
      });

      itRenders('null and false children together as blank', async render => {
        const e = await render(<div>{false}{null}foo{null}{false}</div>);
        expect(e.childNodes.length).toBe(1);
        expectTextNode(e.childNodes[0], 'foo');
      });

      itRenders('only null and false children as blank', async render => {
        const e = await render(<div>{false}{null}{null}{false}</div>);
        expect(e.childNodes.length).toBe(0);
      });
    });

    describe('elements with implicit namespaces', function() {
      itRenders('an svg element', async render => {
        const e = await render(<svg />);
        expect(e.childNodes.length).toBe(0);
        expect(e.tagName).toBe('svg');
        expect(e.namespaceURI).toBe('http://www.w3.org/2000/svg');
      });

      itRenders('svg child element with an attribute', async render => {
        let e = await render(<svg viewBox="0 0 0 0" />);
        expect(e.childNodes.length).toBe(0);
        expect(e.tagName).toBe('svg');
        expect(e.namespaceURI).toBe('http://www.w3.org/2000/svg');
        expect(e.getAttribute('viewBox')).toBe('0 0 0 0');
      });

      itRenders(
        'svg child element with a namespace attribute',
        async render => {
          let e = await render(
            <svg><image xlinkHref="http://i.imgur.com/w7GCRPb.png" /></svg>,
          );
          e = e.firstChild;
          expect(e.childNodes.length).toBe(0);
          expect(e.tagName).toBe('image');
          expect(e.namespaceURI).toBe('http://www.w3.org/2000/svg');
          expect(e.getAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe(
            'http://i.imgur.com/w7GCRPb.png',
          );
        },
      );

      itRenders('svg child element with a badly cased alias', async render => {
        let e = await render(
          <svg><image xlinkhref="http://i.imgur.com/w7GCRPb.png" /></svg>,
          1,
        );
        e = e.firstChild;
        expect(e.hasAttributeNS('http://www.w3.org/1999/xlink', 'href')).toBe(
          false,
        );
        expect(e.getAttribute('xlinkhref')).toBe(
          'http://i.imgur.com/w7GCRPb.png',
        );
      });

      itRenders('svg element with a tabIndex attribute', async render => {
        let e = await render(<svg tabIndex="1" />);
        expect(e.tabIndex).toBe(1);
      });

      itRenders(
        'svg element with a badly cased tabIndex attribute',
        async render => {
          let e = await render(<svg tabindex="1" />, 1);
          expect(e.tabIndex).toBe(1);
        },
      );

      itRenders('svg element with a mixed case name', async render => {
        let e = await render(<svg><filter><feMorphology /></filter></svg>);
        e = e.firstChild.firstChild;
        expect(e.childNodes.length).toBe(0);
        expect(e.tagName).toBe('feMorphology');
        expect(e.namespaceURI).toBe('http://www.w3.org/2000/svg');
      });

      itRenders('a math element', async render => {
        const e = await render(<math />);
        expect(e.childNodes.length).toBe(0);
        expect(e.tagName).toBe('math');
        expect(e.namespaceURI).toBe('http://www.w3.org/1998/Math/MathML');
      });
    });
    // specially wrapped components
    // (see the big switch near the beginning ofReactDOMComponent.mountComponent)
    itRenders('an img', async render => {
      const e = await render(<img />);
      expect(e.childNodes.length).toBe(0);
      expect(e.nextSibling).toBe(null);
      expect(e.tagName).toBe('IMG');
    });

    itRenders('a button', async render => {
      const e = await render(<button />);
      expect(e.childNodes.length).toBe(0);
      expect(e.nextSibling).toBe(null);
      expect(e.tagName).toBe('BUTTON');
    });

    itRenders('a div with dangerouslySetInnerHTML', async render => {
      const e = await render(
        <div dangerouslySetInnerHTML={{__html: "<span id='child'/>"}} />,
      );
      expect(e.childNodes.length).toBe(1);
      expect(e.firstChild.tagName).toBe('SPAN');
      expect(e.firstChild.getAttribute('id')).toBe('child');
      expect(e.firstChild.childNodes.length).toBe(0);
    });

    describe('newline-eating elements', function() {
      itRenders(
        'a newline-eating tag with content not starting with \\n',
        async render => {
          const e = await render(<pre>Hello</pre>);
          expect(e.textContent).toBe('Hello');
        },
      );
      itRenders(
        'a newline-eating tag with content starting with \\n',
        async render => {
          const e = await render(<pre>{'\nHello'}</pre>);
          expect(e.textContent).toBe('\nHello');
        },
      );
      itRenders('a normal tag with content starting with \\n', async render => {
        const e = await render(<div>{'\nHello'}</div>);
        expect(e.textContent).toBe('\nHello');
      });
    });

    describe('different component implementations', function() {
      function checkFooDiv(e) {
        expect(e.childNodes.length).toBe(1);
        expectNode(e.firstChild, TEXT_NODE_TYPE, 'foo');
      }

      itRenders('stateless components', async render => {
        const StatelessComponent = () => <div>foo</div>;
        checkFooDiv(await render(<StatelessComponent />));
      });

      itRenders('ES6 class components', async render => {
        class ClassComponent extends React.Component {
          render() {
            return <div>foo</div>;
          }
        }
        checkFooDiv(await render(<ClassComponent />));
      });

      itRenders('factory components', async render => {
        const FactoryComponent = () => {
          return {
            render: function() {
              return <div>foo</div>;
            },
          };
        };
        checkFooDiv(await render(<FactoryComponent />));
      });
    });

    describe('component hierarchies', async function() {
      itRenders('single child hierarchies of components', async render => {
        const Component = props => <div>{props.children}</div>;
        let e = await render(
          <Component>
            <Component>
              <Component>
                <Component />
              </Component>
            </Component>
          </Component>,
        );
        for (var i = 0; i < 3; i++) {
          expect(e.tagName).toBe('DIV');
          expect(e.childNodes.length).toBe(1);
          e = e.firstChild;
        }
        expect(e.tagName).toBe('DIV');
        expect(e.childNodes.length).toBe(0);
      });

      itRenders('multi-child hierarchies of components', async render => {
        const Component = props => <div>{props.children}</div>;
        const e = await render(
          <Component>
            <Component>
              <Component /><Component />
            </Component>
            <Component>
              <Component /><Component />
            </Component>
          </Component>,
        );
        expect(e.tagName).toBe('DIV');
        expect(e.childNodes.length).toBe(2);
        for (var i = 0; i < 2; i++) {
          var child = e.childNodes[i];
          expect(child.tagName).toBe('DIV');
          expect(child.childNodes.length).toBe(2);
          for (var j = 0; j < 2; j++) {
            var grandchild = child.childNodes[j];
            expect(grandchild.tagName).toBe('DIV');
            expect(grandchild.childNodes.length).toBe(0);
          }
        }
      });

      itRenders('a div with a child', async render => {
        const e = await render(<div id="parent"><div id="child" /></div>);
        expect(e.id).toBe('parent');
        expect(e.childNodes.length).toBe(1);
        expect(e.childNodes[0].id).toBe('child');
        expect(e.childNodes[0].childNodes.length).toBe(0);
      });

      itRenders('a div with multiple children', async render => {
        const e = await render(
          <div id="parent"><div id="child1" /><div id="child2" /></div>,
        );
        expect(e.id).toBe('parent');
        expect(e.childNodes.length).toBe(2);
        expect(e.childNodes[0].id).toBe('child1');
        expect(e.childNodes[0].childNodes.length).toBe(0);
        expect(e.childNodes[1].id).toBe('child2');
        expect(e.childNodes[1].childNodes.length).toBe(0);
      });

      itRenders(
        'a div with multiple children separated by whitespace',
        async render => {
          const e = await render(
            <div id="parent"><div id="child1" /> <div id="child2" /></div>,
          );
          expect(e.id).toBe('parent');
          let child1, child2, textNode;
          expect(e.childNodes.length).toBe(3);
          child1 = e.childNodes[0];
          textNode = e.childNodes[1];
          child2 = e.childNodes[2];
          expect(child1.id).toBe('child1');
          expect(child1.childNodes.length).toBe(0);
          expectTextNode(textNode, ' ');
          expect(child2.id).toBe('child2');
          expect(child2.childNodes.length).toBe(0);
        },
      );

      itRenders(
        'a div with a single child surrounded by whitespace',
        async render => {
          // prettier-ignore
          const e = await render(<div id="parent">  <div id="child" />   </div>); // eslint-disable-line no-multi-spaces
          let textNode1, child, textNode2;
          expect(e.childNodes.length).toBe(3);
          textNode1 = e.childNodes[0];
          child = e.childNodes[1];
          textNode2 = e.childNodes[2];
          expect(e.id).toBe('parent');
          expectTextNode(textNode1, '  ');
          expect(child.id).toBe('child');
          expect(child.childNodes.length).toBe(0);
          expectTextNode(textNode2, '   ');
        },
      );

      itRenders('a composite with multiple children', async render => {
        const Component = props => props.children;
        const e = await render(
          <Component>{['a', 'b', [undefined], [[false, 'c']]]}</Component>,
        );

        let parent = e.parentNode;
        if (
          render === serverRender ||
          render === clientRenderOnServerString ||
          render === streamRender
        ) {
          // For plain server markup result we have comments between.
          // If we're able to hydrate, they remain.
          expect(parent.childNodes.length).toBe(5);
          expectTextNode(parent.childNodes[0], 'a');
          expectTextNode(parent.childNodes[2], 'b');
          expectTextNode(parent.childNodes[4], 'c');
        } else {
          expect(parent.childNodes.length).toBe(3);
          expectTextNode(parent.childNodes[0], 'a');
          expectTextNode(parent.childNodes[1], 'b');
          expectTextNode(parent.childNodes[2], 'c');
        }
      });
    });

    describe('escaping >, <, and &', function() {
      itRenders('>,<, and & as single child', async render => {
        const e = await render(<div>{'<span>Text&quot;</span>'}</div>);
        expect(e.childNodes.length).toBe(1);
        expectNode(e.firstChild, TEXT_NODE_TYPE, '<span>Text&quot;</span>');
      });

      itRenders('>,<, and & as multiple children', async render => {
        const e = await render(
          <div>{'<span>Text1&quot;</span>'}{'<span>Text2&quot;</span>'}</div>,
        );
        if (
          render === serverRender ||
          render === clientRenderOnServerString ||
          render === streamRender
        ) {
          expect(e.childNodes.length).toBe(3);
          expectTextNode(e.childNodes[0], '<span>Text1&quot;</span>');
          expectTextNode(e.childNodes[2], '<span>Text2&quot;</span>');
        } else {
          expect(e.childNodes.length).toBe(2);
          expectTextNode(e.childNodes[0], '<span>Text1&quot;</span>');
          expectTextNode(e.childNodes[1], '<span>Text2&quot;</span>');
        }
      });
    });

    describe('carriage return and null character', () => {
      // HTML parsing normalizes CR and CRLF to LF.
      // It also ignores null character.
      // https://www.w3.org/TR/html5/single-page.html#preprocessing-the-input-stream
      // If we have a mismatch, it might be caused by that (and should not be reported).
      // We won't be patching up in this case as that matches our past behavior.

      itRenders(
        'an element with one text child with special characters',
        async render => {
          const e = await render(<div>{'foo\rbar\r\nbaz\nqux\u0000'}</div>);
          if (render === serverRender || render === streamRender) {
            expect(e.childNodes.length).toBe(1);
            // Everything becomes LF when parsed from server HTML.
            // Null character is ignored.
            expectNode(e.childNodes[0], TEXT_NODE_TYPE, 'foo\nbar\nbaz\nqux');
          } else {
            expect(e.childNodes.length).toBe(1);
            // Client rendering (or hydration) uses JS value with CR.
            // Null character stays.
            expectNode(
              e.childNodes[0],
              TEXT_NODE_TYPE,
              'foo\rbar\r\nbaz\nqux\u0000',
            );
          }
        },
      );

      itRenders(
        'an element with two text children with special characters',
        async render => {
          const e = await render(<div>{'foo\rbar'}{'\r\nbaz\nqux\u0000'}</div>);
          if (render === serverRender || render === streamRender) {
            // We have three nodes because there is a comment between them.
            expect(e.childNodes.length).toBe(3);
            // Everything becomes LF when parsed from server HTML.
            // Null character is ignored.
            expectNode(e.childNodes[0], TEXT_NODE_TYPE, 'foo\nbar');
            expectNode(e.childNodes[2], TEXT_NODE_TYPE, '\nbaz\nqux');
          } else if (render === clientRenderOnServerString) {
            // We have three nodes because there is a comment between them.
            expect(e.childNodes.length).toBe(3);
            // Hydration uses JS value with CR and null character.
            expectNode(e.childNodes[0], TEXT_NODE_TYPE, 'foo\rbar');
            expectNode(e.childNodes[2], TEXT_NODE_TYPE, '\r\nbaz\nqux\u0000');
          } else {
            expect(e.childNodes.length).toBe(2);
            // Client rendering uses JS value with CR and null character.
            expectNode(e.childNodes[0], TEXT_NODE_TYPE, 'foo\rbar');
            expectNode(e.childNodes[1], TEXT_NODE_TYPE, '\r\nbaz\nqux\u0000');
          }
        },
      );

      itRenders(
        'an element with an attribute value with special characters',
        async render => {
          const e = await render(<a title={'foo\rbar\r\nbaz\nqux\u0000'} />);
          if (
            render === serverRender ||
            render === streamRender ||
            render === clientRenderOnServerString
          ) {
            // Everything becomes LF when parsed from server HTML.
            // Null character in an attribute becomes the replacement character.
            // Hydration also ends up with LF because we don't patch up attributes.
            expect(e.title).toBe('foo\nbar\nbaz\nqux\uFFFD');
          } else {
            // Client rendering uses JS value with CR and null character.
            expect(e.title).toBe('foo\rbar\r\nbaz\nqux\u0000');
          }
        },
      );
    });

    describe('components that throw errors', function() {
      itThrowsWhenRendering(
        'a function returning undefined',
        async render => {
          const UndefinedComponent = () => undefined;
          await render(<UndefinedComponent />, 1);
        },
        'UndefinedComponent(...): Nothing was returned from render. ' +
          'This usually means a return statement is missing. Or, to ' +
          'render nothing, return null.',
      );

      itThrowsWhenRendering(
        'a class returning undefined',
        async render => {
          class UndefinedComponent extends React.Component {
            render() {
              return undefined;
            }
          }
          await render(<UndefinedComponent />, 1);
        },
        'UndefinedComponent(...): Nothing was returned from render. ' +
          'This usually means a return statement is missing. Or, to ' +
          'render nothing, return null.',
      );

      itThrowsWhenRendering(
        'a function returning an object',
        async render => {
          const ObjectComponent = () => ({x: 123});
          await render(<ObjectComponent />, 1);
        },
        'Objects are not valid as a React child (found: object with keys ' +
          '{x}). If you meant to render a collection of children, use ' +
          'an array instead.',
      );

      itThrowsWhenRendering(
        'a class returning an object',
        async render => {
          class ObjectComponent extends React.Component {
            render() {
              return {x: 123};
            }
          }
          await render(<ObjectComponent />, 1);
        },
        'Objects are not valid as a React child (found: object with keys ' +
          '{x}). If you meant to render a collection of children, use ' +
          'an array instead.',
      );

      itThrowsWhenRendering(
        'top-level object',
        async render => {
          await render({x: 123});
        },
        'Objects are not valid as a React child (found: object with keys ' +
          '{x}). If you meant to render a collection of children, use ' +
          'an array instead.',
      );
    });
  });

  describe('form controls', function() {
    describe('inputs', function() {
      itRenders('an input with a value and an onChange', async render => {
        const e = await render(<input value="foo" onChange={() => {}} />);
        expect(e.value).toBe('foo');
      });

      itRenders('an input with a value and readOnly', async render => {
        const e = await render(<input value="foo" readOnly={true} />);
        expect(e.value).toBe('foo');
      });

      itRenders(
        'an input with a value and no onChange/readOnly',
        async render => {
          // this configuration should raise a dev warning that value without
          // onChange or readOnly is a mistake.
          const e = await render(<input value="foo" />, 1);
          expect(e.value).toBe('foo');
          expect(e.getAttribute('value')).toBe('foo');
        },
      );

      itRenders('an input with a defaultValue', async render => {
        const e = await render(<input defaultValue="foo" />);
        expect(e.value).toBe('foo');
        expect(e.getAttribute('value')).toBe('foo');
        expect(e.getAttribute('defaultValue')).toBe(null);
      });

      itRenders('an input value overriding defaultValue', async render => {
        const e = await render(
          <input value="foo" defaultValue="bar" readOnly={true} />,
          1,
        );
        expect(e.value).toBe('foo');
        expect(e.getAttribute('value')).toBe('foo');
        expect(e.getAttribute('defaultValue')).toBe(null);
      });

      itRenders(
        'an input value overriding defaultValue no matter the prop order',
        async render => {
          const e = await render(
            <input defaultValue="bar" value="foo" readOnly={true} />,
            1,
          );
          expect(e.value).toBe('foo');
          expect(e.getAttribute('value')).toBe('foo');
          expect(e.getAttribute('defaultValue')).toBe(null);
        },
      );
    });

    describe('checkboxes', function() {
      itRenders('a checkbox that is checked with an onChange', async render => {
        const e = await render(
          <input type="checkbox" checked={true} onChange={() => {}} />,
        );
        expect(e.checked).toBe(true);
      });

      itRenders('a checkbox that is checked with readOnly', async render => {
        const e = await render(
          <input type="checkbox" checked={true} readOnly={true} />,
        );
        expect(e.checked).toBe(true);
      });

      itRenders(
        'a checkbox that is checked and no onChange/readOnly',
        async render => {
          // this configuration should raise a dev warning that checked without
          // onChange or readOnly is a mistake.
          const e = await render(<input type="checkbox" checked={true} />, 1);
          expect(e.checked).toBe(true);
        },
      );

      itRenders('a checkbox with defaultChecked', async render => {
        const e = await render(<input type="checkbox" defaultChecked={true} />);
        expect(e.checked).toBe(true);
        expect(e.getAttribute('defaultChecked')).toBe(null);
      });

      itRenders(
        'a checkbox checked overriding defaultChecked',
        async render => {
          const e = await render(
            <input
              type="checkbox"
              checked={true}
              defaultChecked={false}
              readOnly={true}
            />,
            1,
          );
          expect(e.checked).toBe(true);
          expect(e.getAttribute('defaultChecked')).toBe(null);
        },
      );

      itRenders(
        'a checkbox checked overriding defaultChecked no matter the prop order',
        async render => {
          const e = await render(
            <input
              type="checkbox"
              defaultChecked={false}
              checked={true}
              readOnly={true}
            />,
            1,
          );
          expect(e.checked).toBe(true);
          expect(e.getAttribute('defaultChecked')).toBe(null);
        },
      );
    });

    describe('textareas', function() {
      // textareas
      // ---------
      itRenders('a textarea with a value and an onChange', async render => {
        const e = await render(<textarea value="foo" onChange={() => {}} />);
        // textarea DOM elements don't have a value **attribute**, the text is
        // a child of the element and accessible via the .value **property**.
        expect(e.getAttribute('value')).toBe(null);
        expect(e.value).toBe('foo');
      });

      itRenders('a textarea with a value and readOnly', async render => {
        const e = await render(<textarea value="foo" readOnly={true} />);
        // textarea DOM elements don't have a value **attribute**, the text is
        // a child of the element and accessible via the .value **property**.
        expect(e.getAttribute('value')).toBe(null);
        expect(e.value).toBe('foo');
      });

      itRenders(
        'a textarea with a value and no onChange/readOnly',
        async render => {
          // this configuration should raise a dev warning that value without
          // onChange or readOnly is a mistake.
          const e = await render(<textarea value="foo" />, 1);
          expect(e.getAttribute('value')).toBe(null);
          expect(e.value).toBe('foo');
        },
      );

      itRenders('a textarea with a defaultValue', async render => {
        const e = await render(<textarea defaultValue="foo" />);
        expect(e.getAttribute('value')).toBe(null);
        expect(e.getAttribute('defaultValue')).toBe(null);
        expect(e.value).toBe('foo');
      });

      itRenders('a textarea value overriding defaultValue', async render => {
        const e = await render(
          <textarea value="foo" defaultValue="bar" readOnly={true} />,
          1,
        );
        expect(e.getAttribute('value')).toBe(null);
        expect(e.getAttribute('defaultValue')).toBe(null);
        expect(e.value).toBe('foo');
      });

      itRenders(
        'a textarea value overriding defaultValue no matter the prop order',
        async render => {
          const e = await render(
            <textarea defaultValue="bar" value="foo" readOnly={true} />,
            1,
          );
          expect(e.getAttribute('value')).toBe(null);
          expect(e.getAttribute('defaultValue')).toBe(null);
          expect(e.value).toBe('foo');
        },
      );
    });

    describe('selects', function() {
      var options;
      beforeEach(function() {
        options = [
          <option key={1} value="foo" id="foo">Foo</option>,
          <option key={2} value="bar" id="bar">Bar</option>,
          <option key={3} value="baz" id="baz">Baz</option>,
        ];
      });

      // a helper function to test the selected value of a <select> element.
      // takes in a <select> DOM element (element) and a value or array of
      // values that should be selected (selected).
      const expectSelectValue = (element, selected) => {
        if (!Array.isArray(selected)) {
          selected = [selected];
        }
        // the select DOM element shouldn't ever have a value or defaultValue
        // attribute; that is not how select values are expressed in the DOM.
        expect(element.getAttribute('value')).toBe(null);
        expect(element.getAttribute('defaultValue')).toBe(null);

        ['foo', 'bar', 'baz'].forEach(value => {
          const expectedValue = selected.indexOf(value) !== -1;
          var option = element.querySelector(`#${value}`);
          expect(option.selected).toBe(expectedValue);
        });
      };

      itRenders('a select with a value and an onChange', async render => {
        const e = await render(
          <select value="bar" onChange={() => {}}>{options}</select>,
        );
        expectSelectValue(e, 'bar');
      });

      itRenders('a select with a value and readOnly', async render => {
        const e = await render(
          <select value="bar" readOnly={true}>{options}</select>,
        );
        expectSelectValue(e, 'bar');
      });

      itRenders(
        'a select with a multiple values and an onChange',
        async render => {
          const e = await render(
            <select value={['bar', 'baz']} multiple={true} onChange={() => {}}>
              {options}
            </select>,
          );
          expectSelectValue(e, ['bar', 'baz']);
        },
      );

      itRenders(
        'a select with a multiple values and readOnly',
        async render => {
          const e = await render(
            <select value={['bar', 'baz']} multiple={true} readOnly={true}>
              {options}
            </select>,
          );
          expectSelectValue(e, ['bar', 'baz']);
        },
      );

      itRenders(
        'a select with a value and no onChange/readOnly',
        async render => {
          // this configuration should raise a dev warning that value without
          // onChange or readOnly is a mistake.
          const e = await render(<select value="bar">{options}</select>, 1);
          expectSelectValue(e, 'bar');
        },
      );

      itRenders('a select with a defaultValue', async render => {
        const e = await render(<select defaultValue="bar">{options}</select>);
        expectSelectValue(e, 'bar');
      });

      itRenders('a select value overriding defaultValue', async render => {
        const e = await render(
          <select value="bar" defaultValue="baz" readOnly={true}>
            {options}
          </select>,
          1,
        );
        expectSelectValue(e, 'bar');
      });

      itRenders(
        'a select value overriding defaultValue no matter the prop order',
        async render => {
          const e = await render(
            <select defaultValue="baz" value="bar" readOnly={true}>
              {options}
            </select>,
            1,
          );
          expectSelectValue(e, 'bar');
        },
      );
    });

    describe('user interaction', function() {
      let ControlledInput,
        ControlledTextArea,
        ControlledCheckbox,
        ControlledSelect;
      beforeEach(() => {
        ControlledInput = class extends React.Component {
          constructor() {
            super();
            this.state = {value: 'Hello'};
          }
          handleChange(event) {
            if (this.props.onChange) {
              this.props.onChange(event);
            }
            this.setState({value: event.target.value});
          }
          render() {
            return (
              <input
                value={this.state.value}
                onChange={this.handleChange.bind(this)}
              />
            );
          }
        };
        ControlledTextArea = class extends React.Component {
          constructor() {
            super();
            this.state = {value: 'Hello'};
          }
          handleChange(event) {
            if (this.props.onChange) {
              this.props.onChange(event);
            }
            this.setState({value: event.target.value});
          }
          render() {
            return (
              <textarea
                value={this.state.value}
                onChange={this.handleChange.bind(this)}
              />
            );
          }
        };
        ControlledCheckbox = class extends React.Component {
          constructor() {
            super();
            this.state = {value: true};
          }
          handleChange(event) {
            if (this.props.onChange) {
              this.props.onChange(event);
            }
            this.setState({value: event.target.checked});
          }
          render() {
            return (
              <input
                type="checkbox"
                checked={this.state.value}
                onChange={this.handleChange.bind(this)}
              />
            );
          }
        };
        ControlledSelect = class extends React.Component {
          constructor() {
            super();
            this.state = {value: 'Hello'};
          }
          handleChange(event) {
            if (this.props.onChange) {
              this.props.onChange(event);
            }
            this.setState({value: event.target.value});
          }
          render() {
            return (
              <select
                value={this.state.value}
                onChange={this.handleChange.bind(this)}>
                <option key="1" value="Hello">Hello</option>
                <option key="2" value="Goodbye">Goodbye</option>
              </select>
            );
          }
        };
      });

      describe('user interaction with controlled inputs', function() {
        itClientRenders('a controlled text input', async render => {
          let changeCount = 0;
          const e = await render(
            <ControlledInput onChange={() => changeCount++} />,
          );
          expect(changeCount).toBe(0);
          expect(e.value).toBe('Hello');

          // simulate a user typing.
          e.value = 'Goodbye';
          ReactTestUtils.Simulate.change(e);

          expect(changeCount).toBe(1);
          expect(e.value).toBe('Goodbye');
        });

        itClientRenders('a controlled textarea', async render => {
          let changeCount = 0;
          const e = await render(
            <ControlledTextArea onChange={() => changeCount++} />,
          );
          expect(changeCount).toBe(0);
          expect(e.value).toBe('Hello');

          // simulate a user typing.
          e.value = 'Goodbye';
          ReactTestUtils.Simulate.change(e);

          expect(changeCount).toBe(1);
          expect(e.value).toBe('Goodbye');
        });

        itClientRenders('a controlled checkbox', async render => {
          let changeCount = 0;
          const e = await render(
            <ControlledCheckbox onChange={() => changeCount++} />,
          );
          expect(changeCount).toBe(0);
          expect(e.checked).toBe(true);

          // simulate a user typing.
          e.checked = false;
          ReactTestUtils.Simulate.change(e);

          expect(changeCount).toBe(1);
          expect(e.checked).toBe(false);
        });

        itClientRenders('a controlled select', async render => {
          let changeCount = 0;
          const e = await render(
            <ControlledSelect onChange={() => changeCount++} />,
          );
          expect(changeCount).toBe(0);
          expect(e.value).toBe('Hello');

          // simulate a user typing.
          e.value = 'Goodbye';
          ReactTestUtils.Simulate.change(e);

          expect(changeCount).toBe(1);
          expect(e.value).toBe('Goodbye');
        });
      });

      describe('user interaction with inputs before client render', function() {
        // renders the element and changes the value **before** the client
        // code has a chance to render; this simulates what happens when a
        // user starts to interact with a server-rendered form before
        // ReactDOM.render is called. the client render should NOT blow away
        // the changes the user has made.
        const testUserInteractionBeforeClientRender = async (
          element,
          initialValue = 'Hello',
          changedValue = 'Goodbye',
          valueKey = 'value',
        ) => {
          const field = await serverRender(element);
          expect(field[valueKey]).toBe(initialValue);

          // simulate a user typing in the field **before** client-side reconnect happens.
          field[valueKey] = changedValue;

          resetModules();
          // client render on top of the server markup.
          const clientField = await renderIntoDom(
            element,
            field.parentNode,
            true,
          );
          // verify that the input field was not replaced.
          // Note that we cannot use expect(clientField).toBe(field) because
          // of jest bug #1772
          expect(clientField === field).toBe(true);
          // confirm that the client render has not changed what the user typed.
          expect(clientField[valueKey]).toBe(changedValue);
        };

        it('should not blow away user-entered text on successful reconnect to an uncontrolled input', () =>
          testUserInteractionBeforeClientRender(
            <input defaultValue="Hello" />,
          ));

        it('should not blow away user-entered text on successful reconnect to a controlled input', async () => {
          let changeCount = 0;
          await testUserInteractionBeforeClientRender(
            <ControlledInput onChange={() => changeCount++} />,
          );
          // note that there's a strong argument to be made that the DOM revival
          // algorithm should notice that the user has changed the value and fire
          // an onChange. however, it does not now, so that's what this tests.
          expect(changeCount).toBe(0);
        });

        it('should not blow away user-entered text on successful reconnect to an uncontrolled checkbox', () =>
          testUserInteractionBeforeClientRender(
            <input type="checkbox" defaultChecked={true} />,
            true,
            false,
            'checked',
          ));

        it('should not blow away user-entered text on successful reconnect to a controlled checkbox', async () => {
          let changeCount = 0;
          await testUserInteractionBeforeClientRender(
            <ControlledCheckbox onChange={() => changeCount++} />,
            true,
            false,
            'checked',
          );
          expect(changeCount).toBe(0);
        });

        // skipping this test because React 15 does the wrong thing. it blows
        // away the user's typing in the textarea.
        xit(
          'should not blow away user-entered text on successful reconnect to an uncontrolled textarea',
          () =>
            testUserInteractionBeforeClientRender(
              <textarea defaultValue="Hello" />,
            ),
        );

        // skipping this test because React 15 does the wrong thing. it blows
        // away the user's typing in the textarea.
        xit(
          'should not blow away user-entered text on successful reconnect to a controlled textarea',
          async () => {
            let changeCount = 0;
            await testUserInteractionBeforeClientRender(
              <ControlledTextArea onChange={() => changeCount++} />,
            );
            expect(changeCount).toBe(0);
          },
        );

        it('should not blow away user-selected value on successful reconnect to an uncontrolled select', () =>
          testUserInteractionBeforeClientRender(
            <select defaultValue="Hello">
              <option key="1" value="Hello">Hello</option>
              <option key="2" value="Goodbye">Goodbye</option>
            </select>,
          ));

        it('should not blow away user-selected value on successful reconnect to an controlled select', async () => {
          let changeCount = 0;
          await testUserInteractionBeforeClientRender(
            <ControlledSelect onChange={() => changeCount++} />,
          );
          expect(changeCount).toBe(0);
        });
      });
    });
  });

  describe('context', function() {
    let PurpleContext, RedContext;
    beforeEach(() => {
      class Parent extends React.Component {
        getChildContext() {
          return {text: this.props.text};
        }
        render() {
          return this.props.children;
        }
      }
      Parent.childContextTypes = {text: PropTypes.string};

      PurpleContext = props => <Parent text="purple">{props.children}</Parent>;
      RedContext = props => <Parent text="red">{props.children}</Parent>;
    });

    itRenders('class child with context', async render => {
      class ClassChildWithContext extends React.Component {
        render() {
          return <div>{this.context.text}</div>;
        }
      }
      ClassChildWithContext.contextTypes = {text: PropTypes.string};

      const e = await render(
        <PurpleContext><ClassChildWithContext /></PurpleContext>,
      );
      expect(e.textContent).toBe('purple');
    });

    itRenders('stateless child with context', async render => {
      function StatelessChildWithContext(props, context) {
        return <div>{context.text}</div>;
      }
      StatelessChildWithContext.contextTypes = {text: PropTypes.string};

      const e = await render(
        <PurpleContext><StatelessChildWithContext /></PurpleContext>,
      );
      expect(e.textContent).toBe('purple');
    });

    itRenders('class child without context', async render => {
      class ClassChildWithoutContext extends React.Component {
        render() {
          // this should render blank; context isn't passed to this component.
          return <div>{this.context.text}</div>;
        }
      }

      const e = await render(
        <PurpleContext><ClassChildWithoutContext /></PurpleContext>,
      );
      expect(e.textContent).toBe('');
    });

    itRenders('stateless child without context', async render => {
      function StatelessChildWithoutContext(props, context) {
        // this should render blank; context isn't passed to this component.
        return <div>{context.text}</div>;
      }

      const e = await render(
        <PurpleContext><StatelessChildWithoutContext /></PurpleContext>,
      );
      expect(e.textContent).toBe('');
    });

    itRenders('class child with wrong context', async render => {
      class ClassChildWithWrongContext extends React.Component {
        render() {
          // this should render blank; context.text isn't passed to this component.
          return <div id="classWrongChild">{this.context.text}</div>;
        }
      }
      ClassChildWithWrongContext.contextTypes = {foo: PropTypes.string};

      const e = await render(
        <PurpleContext><ClassChildWithWrongContext /></PurpleContext>,
      );
      expect(e.textContent).toBe('');
    });

    itRenders('stateless child with wrong context', async render => {
      function StatelessChildWithWrongContext(props, context) {
        // this should render blank; context.text isn't passed to this component.
        return <div id="statelessWrongChild">{context.text}</div>;
      }
      StatelessChildWithWrongContext.contextTypes = {
        foo: PropTypes.string,
      };

      const e = await render(
        <PurpleContext><StatelessChildWithWrongContext /></PurpleContext>,
      );
      expect(e.textContent).toBe('');
    });

    itRenders('with context passed through to a grandchild', async render => {
      function Grandchild(props, context) {
        return <div>{context.text}</div>;
      }
      Grandchild.contextTypes = {text: PropTypes.string};

      const Child = props => <Grandchild />;

      const e = await render(<PurpleContext><Child /></PurpleContext>);
      expect(e.textContent).toBe('purple');
    });

    itRenders('a child context overriding a parent context', async render => {
      const Grandchild = (props, context) => {
        return <div>{context.text}</div>;
      };
      Grandchild.contextTypes = {text: PropTypes.string};

      const e = await render(
        <PurpleContext><RedContext><Grandchild /></RedContext></PurpleContext>,
      );
      expect(e.textContent).toBe('red');
    });

    itRenders('a child context merged with a parent context', async render => {
      class Parent extends React.Component {
        getChildContext() {
          return {text1: 'purple'};
        }
        render() {
          return <Child />;
        }
      }
      Parent.childContextTypes = {text1: PropTypes.string};

      class Child extends React.Component {
        getChildContext() {
          return {text2: 'red'};
        }
        render() {
          return <Grandchild />;
        }
      }
      Child.childContextTypes = {text2: PropTypes.string};

      const Grandchild = (props, context) => {
        return (
          <div>
            <div id="first">{context.text1}</div>
            <div id="second">{context.text2}</div>
          </div>
        );
      };
      Grandchild.contextTypes = {
        text1: PropTypes.string,
        text2: PropTypes.string,
      };

      const e = await render(<Parent />);
      expect(e.querySelector('#first').textContent).toBe('purple');
      expect(e.querySelector('#second').textContent).toBe('red');
    });

    itRenders(
      'with a call to componentWillMount before getChildContext',
      async render => {
        class WillMountContext extends React.Component {
          getChildContext() {
            return {text: this.state.text};
          }
          componentWillMount() {
            this.setState({text: 'foo'});
          }
          render() {
            return <Child />;
          }
        }
        WillMountContext.childContextTypes = {text: PropTypes.string};

        const Child = (props, context) => {
          return <div>{context.text}</div>;
        };
        Child.contextTypes = {text: PropTypes.string};

        const e = await render(<WillMountContext />);
        expect(e.textContent).toBe('foo');
      },
    );

    itThrowsWhenRendering(
      'if getChildContext exists without childContextTypes',
      render => {
        class MyComponent extends React.Component {
          render() {
            return <div />;
          }
          getChildContext() {
            return {foo: 'bar'};
          }
        }
        return render(<MyComponent />);
      },
      'MyComponent.getChildContext(): childContextTypes must be defined ' +
        'in order to use getChildContext().',
    );

    itThrowsWhenRendering(
      'if getChildContext returns a value not in childContextTypes',
      render => {
        class MyComponent extends React.Component {
          render() {
            return <div />;
          }
          getChildContext() {
            return {value1: 'foo', value2: 'bar'};
          }
        }
        MyComponent.childContextTypes = {value1: PropTypes.string};
        return render(<MyComponent />);
      },
      'MyComponent.getChildContext(): key "value2" is not defined in childContextTypes.',
    );
  });

  describe('refs', function() {
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
      await asyncReactDOMRender(
        <RefsComponent ref={e => (component = e)} />,
        root,
        true,
      );
      expect(component.refs.myDiv).toBe(root.firstChild);
    });
  });

  describe('reconnecting to server markup', function() {
    var EmptyComponent;
    beforeEach(() => {
      EmptyComponent = class extends React.Component {
        render() {
          return null;
        }
      };
    });

    describe('elements', function() {
      describe('reconnecting different component implementations', function() {
        let ES6ClassComponent, PureComponent, bareElement;
        beforeEach(() => {
          // try each type of component on client and server.
          ES6ClassComponent = class extends React.Component {
            render() {
              return <div id={this.props.id} />;
            }
          };
          PureComponent = props => <div id={props.id} />;
          bareElement = <div id="foobarbaz" />;
        });

        it('should reconnect ES6 Class to ES6 Class', () =>
          expectMarkupMatch(
            <ES6ClassComponent id="foobarbaz" />,
            <ES6ClassComponent id="foobarbaz" />,
          ));

        it('should reconnect Pure Component to ES6 Class', () =>
          expectMarkupMatch(
            <ES6ClassComponent id="foobarbaz" />,
            <PureComponent id="foobarbaz" />,
          ));

        it('should reconnect Bare Element to ES6 Class', () =>
          expectMarkupMatch(<ES6ClassComponent id="foobarbaz" />, bareElement));

        it('should reconnect ES6 Class to Pure Component', () =>
          expectMarkupMatch(
            <PureComponent id="foobarbaz" />,
            <ES6ClassComponent id="foobarbaz" />,
          ));

        it('should reconnect Pure Component to Pure Component', () =>
          expectMarkupMatch(
            <PureComponent id="foobarbaz" />,
            <PureComponent id="foobarbaz" />,
          ));

        it('should reconnect Bare Element to Pure Component', () =>
          expectMarkupMatch(<PureComponent id="foobarbaz" />, bareElement));

        it('should reconnect ES6 Class to Bare Element', () =>
          expectMarkupMatch(bareElement, <ES6ClassComponent id="foobarbaz" />));

        it('should reconnect Pure Component to Bare Element', () =>
          expectMarkupMatch(bareElement, <PureComponent id="foobarbaz" />));

        it('should reconnect Bare Element to Bare Element', () =>
          expectMarkupMatch(bareElement, bareElement));
      });

      it('should error reconnecting different element types', () =>
        expectMarkupMismatch(<div />, <span />));

      it('should error reconnecting fewer root children', () =>
        expectMarkupMismatch(<span key="a" />, [
          <span key="a" />,
          <span key="b" />,
        ]));

      it('should error reconnecting missing attributes', () =>
        expectMarkupMismatch(<div id="foo" />, <div />));

      it('should error reconnecting added attributes', () =>
        expectMarkupMismatch(<div />, <div id="foo" />));

      it('should error reconnecting different attribute values', () =>
        expectMarkupMismatch(<div id="foo" />, <div id="bar" />));

      it('can explicitly ignore errors reconnecting different element types of children', () =>
        expectMarkupMatch(
          <div><div /></div>,
          <div suppressHydrationWarning={true}><span /></div>,
        ));

      it('can explicitly ignore errors reconnecting missing attributes', () =>
        expectMarkupMatch(
          <div id="foo" />,
          <div suppressHydrationWarning={true} />,
        ));

      it('can explicitly ignore errors reconnecting added attributes', () =>
        expectMarkupMatch(
          <div />,
          <div id="foo" suppressHydrationWarning={true} />,
        ));

      it('can explicitly ignore errors reconnecting different attribute values', () =>
        expectMarkupMatch(
          <div id="foo" />,
          <div id="bar" suppressHydrationWarning={true} />,
        ));

      it('can not deeply ignore errors reconnecting different attribute values', () =>
        expectMarkupMismatch(
          <div><div id="foo" /></div>,
          <div suppressHydrationWarning={true}><div id="bar" /></div>,
        ));
    });

    describe('inline styles', function() {
      it('should error reconnecting missing style attribute', () =>
        expectMarkupMismatch(<div style={{width: '1px'}} />, <div />));

      it('should error reconnecting added style attribute', () =>
        expectMarkupMismatch(<div />, <div style={{width: '1px'}} />));

      it('should error reconnecting empty style attribute', () =>
        expectMarkupMismatch(
          <div style={{width: '1px'}} />,
          <div style={{}} />,
        ));

      it('should error reconnecting added style values', () =>
        expectMarkupMismatch(
          <div style={{}} />,
          <div style={{width: '1px'}} />,
        ));

      it('should error reconnecting different style values', () =>
        expectMarkupMismatch(
          <div style={{width: '1px'}} />,
          <div style={{width: '2px'}} />,
        ));

      it('should reconnect number and string versions of a number', () =>
        expectMarkupMatch(
          <div style={{width: '1px', height: 2}} />,
          <div style={{width: 1, height: '2px'}} />,
        ));

      it('should error reconnecting reordered style values', () =>
        expectMarkupMismatch(
          <div style={{width: '1px', fontSize: '2px'}} />,
          <div style={{fontSize: '2px', width: '1px'}} />,
        ));

      it('can explicitly ignore errors reconnecting added style values', () =>
        expectMarkupMatch(
          <div style={{}} />,
          <div style={{width: '1px'}} suppressHydrationWarning={true} />,
        ));

      it('can explicitly ignore reconnecting different style values', () =>
        expectMarkupMatch(
          <div style={{width: '1px'}} />,
          <div style={{width: '2px'}} suppressHydrationWarning={true} />,
        ));
    });

    describe('text nodes', function() {
      it('should error reconnecting different text', () =>
        expectMarkupMismatch(<div>Text</div>, <div>Other Text</div>));

      it('should reconnect a div with a number and string version of number', () =>
        expectMarkupMatch(<div>{2}</div>, <div>2</div>));

      it('should error reconnecting different numbers', () =>
        expectMarkupMismatch(<div>{2}</div>, <div>{3}</div>));

      it('should error reconnecting different number from text', () =>
        expectMarkupMismatch(<div>{2}</div>, <div>3</div>));

      it('should error reconnecting different text in two code blocks', () =>
        expectMarkupMismatch(
          <div>{'Text1'}{'Text2'}</div>,
          <div>{'Text1'}{'Text3'}</div>,
        ));

      it('can explicitly ignore reconnecting different text', () =>
        expectMarkupMatch(
          <div>Text</div>,
          <div suppressHydrationWarning={true}>Other Text</div>,
        ));

      it('can explicitly ignore reconnecting different text in two code blocks', () =>
        expectMarkupMatch(
          <div suppressHydrationWarning={true}>{'Text1'}{'Text2'}</div>,
          <div suppressHydrationWarning={true}>{'Text1'}{'Text3'}</div>,
        ));
    });

    describe('element trees and children', function() {
      it('should error reconnecting missing children', () =>
        expectMarkupMismatch(<div><div /></div>, <div />));

      it('should error reconnecting added children', () =>
        expectMarkupMismatch(<div />, <div><div /></div>));

      it('should error reconnecting more children', () =>
        expectMarkupMismatch(<div><div /></div>, <div><div /><div /></div>));

      it('should error reconnecting fewer children', () =>
        expectMarkupMismatch(<div><div /><div /></div>, <div><div /></div>));

      it('should error reconnecting reordered children', () =>
        expectMarkupMismatch(
          <div><div /><span /></div>,
          <div><span /><div /></div>,
        ));

      it('should error reconnecting a div with children separated by whitespace on the client', () =>
        expectMarkupMismatch(
          <div id="parent"><div id="child1" /><div id="child2" /></div>,
          // prettier-ignore
          <div id="parent"><div id="child1" />      <div id="child2" /></div>, // eslint-disable-line no-multi-spaces
        ));

      it('should error reconnecting a div with children separated by different whitespace on the server', () =>
        expectMarkupMismatch(
          // prettier-ignore
          <div id="parent"><div id="child1" />      <div id="child2" /></div>, // eslint-disable-line no-multi-spaces
          <div id="parent"><div id="child1" /><div id="child2" /></div>,
        ));

      it('should error reconnecting a div with children separated by different whitespace', () =>
        expectMarkupMismatch(
          <div id="parent"><div id="child1" /> <div id="child2" /></div>,
          // prettier-ignore
          <div id="parent"><div id="child1" />      <div id="child2" /></div>, // eslint-disable-line no-multi-spaces
        ));

      it('can distinguish an empty component from a dom node', () =>
        expectMarkupMismatch(
          <div><span /></div>,
          <div><EmptyComponent /></div>,
        ));

      it('can distinguish an empty component from an empty text component', () =>
        expectMarkupMatch(<div><EmptyComponent /></div>, <div>{''}</div>));

      it('can explicitly ignore reconnecting more children', () =>
        expectMarkupMatch(
          <div><div /></div>,
          <div suppressHydrationWarning={true}><div /><div /></div>,
        ));

      it('can explicitly ignore reconnecting fewer children', () =>
        expectMarkupMatch(
          <div><div /><div /></div>,
          <div suppressHydrationWarning={true}><div /></div>,
        ));

      it('can explicitly ignore reconnecting reordered children', () =>
        expectMarkupMatch(
          <div suppressHydrationWarning={true}><div /><span /></div>,
          <div suppressHydrationWarning={true}><span /><div /></div>,
        ));

      it('can not deeply ignore reconnecting reordered children', () =>
        expectMarkupMismatch(
          <div suppressHydrationWarning={true}><div><div /><span /></div></div>,
          <div suppressHydrationWarning={true}><div><span /><div /></div></div>,
        ));
    });

    // Markup Mismatches: misc
    it('should error reconnecting a div with different dangerouslySetInnerHTML', () =>
      expectMarkupMismatch(
        <div dangerouslySetInnerHTML={{__html: "<span id='child1'/>"}} />,
        <div dangerouslySetInnerHTML={{__html: "<span id='child2'/>"}} />,
      ));

    it('can explicitly ignore reconnecting a div with different dangerouslySetInnerHTML', () =>
      expectMarkupMatch(
        <div dangerouslySetInnerHTML={{__html: "<span id='child1'/>"}} />,
        <div
          dangerouslySetInnerHTML={{__html: "<span id='child2'/>"}}
          suppressHydrationWarning={true}
        />,
      ));
  });
});
