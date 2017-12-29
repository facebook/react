/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

const ReactDOMServerIntegrationUtils = require('./utils/ReactDOMServerIntegrationTestUtils');

const TEXT_NODE_TYPE = 3;

let React;
let ReactDOM;
let ReactDOMServer;

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

const {
  resetModules,
  itRenders,
  itThrowsWhenRendering,
  serverRender,
  streamRender,
  clientRenderOnServerString,
} = ReactDOMServerIntegrationUtils(initModules);

describe('ReactDOMServerIntegration', () => {
  beforeEach(() => {
    resetModules();
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
        const e = await render(
          <div>
            {''}
            {''}
            {''}
          </div>,
        );
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
        // prettier-ignore
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
        const e = await render(
          <div>
            Text<span>More Text</span>
          </div>,
        );
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
        const e = await render(
          <div>
            {'foo'}
            {'bar'}
          </div>,
        );
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
          const e = await render(
            <div>
              {'a'}
              <B />
              {'c'}
            </div>,
          );
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
        const e = await render(
          <div>
            {'foo'}
            {40}
          </div>,
        );
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
        const e = await render(
          <div>
            <NullComponent />
          </div>,
        );
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
        const e = await render(
          <div>
            {false}
            {null}foo{null}
            {false}
          </div>,
        );
        expect(e.childNodes.length).toBe(1);
        expectTextNode(e.childNodes[0], 'foo');
      });

      itRenders('only null and false children as blank', async render => {
        const e = await render(
          <div>
            {false}
            {null}
            {null}
            {false}
          </div>,
        );
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
            <svg>
              <image xlinkHref="http://i.imgur.com/w7GCRPb.png" />
            </svg>,
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
          <svg>
            <image xlinkhref="http://i.imgur.com/w7GCRPb.png" />
          </svg>,
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
        let e = await render(
          <svg>
            <filter>
              <feMorphology />
            </filter>
          </svg>,
        );
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
        for (let i = 0; i < 3; i++) {
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
              <Component />
              <Component />
            </Component>
            <Component>
              <Component />
              <Component />
            </Component>
          </Component>,
        );
        expect(e.tagName).toBe('DIV');
        expect(e.childNodes.length).toBe(2);
        for (let i = 0; i < 2; i++) {
          const child = e.childNodes[i];
          expect(child.tagName).toBe('DIV');
          expect(child.childNodes.length).toBe(2);
          for (let j = 0; j < 2; j++) {
            const grandchild = child.childNodes[j];
            expect(grandchild.tagName).toBe('DIV');
            expect(grandchild.childNodes.length).toBe(0);
          }
        }
      });

      itRenders('a div with a child', async render => {
        const e = await render(
          <div id="parent">
            <div id="child" />
          </div>,
        );
        expect(e.id).toBe('parent');
        expect(e.childNodes.length).toBe(1);
        expect(e.childNodes[0].id).toBe('child');
        expect(e.childNodes[0].childNodes.length).toBe(0);
      });

      itRenders('a div with multiple children', async render => {
        const e = await render(
          <div id="parent">
            <div id="child1" />
            <div id="child2" />
          </div>,
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
            <div id="parent">
              <div id="child1" /> <div id="child2" />
            </div>,
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
          <div>
            {'<span>Text1&quot;</span>'}
            {'<span>Text2&quot;</span>'}
          </div>,
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
          const e = await render(
            <div>
              {'foo\rbar'}
              {'\r\nbaz\nqux\u0000'}
            </div>,
          );
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
        'Objects are not valid as a React child (found: object with keys {x}).' +
          (__DEV__
            ? ' If you meant to render a collection of children, use ' +
              'an array instead.'
            : ''),
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
        'Objects are not valid as a React child (found: object with keys {x}).' +
          (__DEV__
            ? ' If you meant to render a collection of children, use ' +
              'an array instead.'
            : ''),
      );

      itThrowsWhenRendering(
        'top-level object',
        async render => {
          await render({x: 123});
        },
        'Objects are not valid as a React child (found: object with keys {x}).' +
          (__DEV__
            ? ' If you meant to render a collection of children, use ' +
              'an array instead.'
            : ''),
      );
    });
  });
});
