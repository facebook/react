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

var ExecutionEnvironment;
var React;
var ReactDOM;
var ReactMarkupChecksum;
var ReactReconcileTransaction;
var ReactTestUtils;
var ReactServerRendering;

var ID_ATTRIBUTE_NAME;
var ROOT_ATTRIBUTE_NAME;

const TEXT_NODE_TYPE = 3;
const COMMENT_NODE_TYPE = 8;

// Renders text using SSR and then stuffs it into a DOM node, which is returned.
// Does not perform client-side reconnect.
function renderOnServer(reactElement, warningCount = 0) {
  const markup = expectWarnings(
    () => ReactServerRendering.renderToString(reactElement),
    warningCount);

  var domElement = document.createElement('div');
  domElement.innerHTML = markup;
  return domElement;
}

// returns a DOM of the react element when server rendered and NOT rendered on client.
function getSsrDom(reactElement, warningCount = 0) {
  return renderOnServer(reactElement, warningCount).firstChild;
}

function expectWarnings(fn, count) {
  var oldConsoleError = console.error;
  console.error = jasmine.createSpy();
  try {
    var result = fn();
  } finally {
    expect(console.error.argsForCall.length).toBe(count);
    console.error = oldConsoleError;
  }
  return result;
}

function renderOnClient(reactElement, domElement, warningCount = 0) {
  expectWarnings(() => ReactDOM.render(reactElement, domElement), warningCount);
  return domElement;
}
// renders the first element with renderToString, puts it into a DOM node,
// runs React.render on that DOM node with the second element. returns the DOM
// node.
function connectToServerRendering(
  elementToRenderOnServer,
  elementToRenderOnClient = elementToRenderOnServer,
  shouldMatch = true,
  warningCount = 0
) {
  return renderOnClient(
    elementToRenderOnClient,
    renderOnServer(elementToRenderOnServer, warningCount),
    shouldMatch ? 0 : 1);
}

function expectMarkupMismatch(serverRendering, elementToRenderOnClient, warningCount = 0) {
  if (typeof serverRendering === 'string') {
    var domElement = document.createElement('div');
    domElement.innerHTML = serverRendering;
    return renderOnClient(elementToRenderOnClient, domElement, warningCount + 1);
  }
  return connectToServerRendering(serverRendering, elementToRenderOnClient, false, warningCount);
}

function expectMarkupMatch(serverRendering, elementToRenderOnClient = serverRendering, warningCount = 0) {
  if (typeof serverRendering === 'string') {
    var domElement = document.createElement('div');
    domElement.innerHTML = serverRendering;
    return renderOnClient(elementToRenderOnClient, domElement, warningCount);
  }
  return connectToServerRendering(serverRendering, elementToRenderOnClient, true, warningCount);
}

function itResolves(desc, testFn) {
  it(desc, function() {
    var done = false;
    waitsFor(() => done);
    testFn().then(() => done = true);

  });
}

function itRejects(desc, testFn) {
  it(desc, function() {
    var done = false;
    waitsFor(() => done);
    testFn().catch(() => done = true);
  });
}

const serverStringRender = (element, warningCount = 0) => {
  try {
    return Promise.resolve(getSsrDom(element, warningCount));
  } catch (e) {
    return Promise.reject(e);
  }
};
const clientRender = (element, warningCount = 0) => {
  try {
    const div = document.createElement('div');
    return Promise.resolve(renderOnClient(element, div, warningCount).firstChild);
  } catch (e) {
    return Promise.reject(e);
  }
};
const clientRenderOnServerString = (element, warningCount = 0) => {
  try {
    return Promise.resolve(connectToServerRendering(element, element, true, warningCount).firstChild);
  } catch (e) {
    return Promise.reject(e);
  }
};
const clientRenderOnBadMarkup = (element, warningCount = 0) => {
  try {
    var domElement = document.createElement('div');
    domElement.innerHTML = '<div id="badIdWhichWillCauseMismatch" data-reactroot="" data-reactid="1"></div>';
    // ReactDOM.render(element,domElement);
    return Promise.resolve(renderOnClient(element, domElement, warningCount + 1).firstChild);
  } catch (e) {
    return Promise.reject(e);
  }
};

// runs a DOM rendering test as four different tests, with four different rendering
// scenarios:
// -- render to string on server
// -- render on client without any server markup "clean client render"
// -- render on client on top of good server-generated string markup
// -- render on client on top of bad server-generated markup
//
// testFn is a test that has one arg, which is a render function. the render
// function takes in a ReactElement and returns a promise of a DOM Element.
//
// Note that you should only perform tests that examine the DOM of the results of
// render; you should not depend on the interactivity of the returned DOM element,
// as that will not work in the server string scenario.
function itRenders(desc, testFn) {
  itResolves(`${desc} with server string render`,
    () => testFn(serverStringRender));
  itClientRenders(desc, testFn);
}

// run testFn in four different rendering scenarios:
// -- render on client without any server markup "clean client render"
// -- render on client on top of good server-generated string markup
// -- render on client on top of bad server-generated markup
//
// testFn takes in a render function and returns a Promise that resolves or rejects
// when the test is done. the render function takes in a ReactElement and returns a
// Promise of a DOM element.
// Since all of the renders in this function are on the client, you can test interactivity,
// unlike with itRenders.
function itClientRenders(desc, testFn) {
  itResolves(`${desc} with clean client render`,
    () => testFn(clientRender));
  itResolves(`${desc} with client render on top of server string markup`,
    () => testFn(clientRenderOnServerString));
  itResolves(`${desc} with client render on top of bad server markup`,
    () => testFn(clientRenderOnBadMarkup));
}

function itThrowsOnRender(desc, testFn) {
  itRejects(`${desc} with server string render`,
    () => testFn(serverStringRender));
  itRejects(`${desc} with clean client render`,
    () => testFn(clientRender));

  // we subtract one from the warning count here because the throw means that it won't
  // get the usual markup mismatch warning.
  itRejects(`${desc} with client render on top of bad server markup`,
    () => testFn((element, warningCount = 0) => clientRenderOnBadMarkup(element, warningCount - 1)));
}


describe('ReactServerRendering', function() {
  beforeEach(function() {
    jest.resetModuleRegistry();
    React = require('React');
    ReactDOM = require('ReactDOM');
    ReactMarkupChecksum = require('ReactMarkupChecksum');
    ReactTestUtils = require('ReactTestUtils');
    ReactReconcileTransaction = require('ReactReconcileTransaction');

    ExecutionEnvironment = require('ExecutionEnvironment');
    ExecutionEnvironment.canUseDOM = false;
    ReactServerRendering = require('ReactServerRendering');

    var DOMProperty = require('DOMProperty');
    ID_ATTRIBUTE_NAME = DOMProperty.ID_ATTRIBUTE_NAME;
    ROOT_ATTRIBUTE_NAME = DOMProperty.ROOT_ATTRIBUTE_NAME;
  });

  describe('renderToString', function() {
    it('should generate simple markup', function() {
      var response = ReactServerRendering.renderToString(
        <span>hello world</span>
      );
      expect(response).toMatch(
        '<span ' + ROOT_ATTRIBUTE_NAME + '="" ' +
          ID_ATTRIBUTE_NAME + '="[^"]+" ' +
          ReactMarkupChecksum.CHECKSUM_ATTR_NAME + '="[^"]+">hello world</span>'
      );
    });

    it('should generate simple markup for self-closing tags', function() {
      var response = ReactServerRendering.renderToString(
        <img />
      );
      expect(response).toMatch(
        '<img ' + ROOT_ATTRIBUTE_NAME + '="" ' +
          ID_ATTRIBUTE_NAME + '="[^"]+" ' +
          ReactMarkupChecksum.CHECKSUM_ATTR_NAME + '="[^"]+"/>'
      );
    });

    it('should generate simple markup for attribute with `>` symbol', function() {
      var response = ReactServerRendering.renderToString(
        <img data-attr=">" />
      );
      expect(response).toMatch(
        '<img data-attr="&gt;" ' + ROOT_ATTRIBUTE_NAME + '="" ' +
          ID_ATTRIBUTE_NAME + '="[^"]+" ' +
          ReactMarkupChecksum.CHECKSUM_ATTR_NAME + '="[^"]+"/>'
      );
    });

    it('should generate comment markup for component returns null', function() {
      var NullComponent = React.createClass({
        render: function() {
          return null;
        },
      });
      var response = ReactServerRendering.renderToString(<NullComponent />);
      expect(response).toBe('<!-- react-empty: 1 -->');
    });

    it('should not register event listeners', function() {
      var EventPluginHub = require('EventPluginHub');
      var cb = jest.fn();

      ReactServerRendering.renderToString(
        <span onClick={cb}>hello world</span>
      );
      expect(EventPluginHub.__getListenerBank()).toEqual({});
    });

    it('should render composite components', function() {
      var Parent = React.createClass({
        render: function() {
          return <div><Child name="child" /></div>;
        },
      });
      var Child = React.createClass({
        render: function() {
          return <span>My name is {this.props.name}</span>;
        },
      });
      var response = ReactServerRendering.renderToString(
        <Parent />
      );
      expect(response).toMatch(
        '<div ' + ROOT_ATTRIBUTE_NAME + '="" ' +
          ID_ATTRIBUTE_NAME + '="[^"]+" ' +
          ReactMarkupChecksum.CHECKSUM_ATTR_NAME + '="[^"]+">' +
          '<span ' + ID_ATTRIBUTE_NAME + '="[^"]+">' +
            '<!-- react-text: [0-9]+ -->My name is <!-- /react-text -->' +
            '<!-- react-text: [0-9]+ -->child<!-- /react-text -->' +
          '</span>' +
        '</div>'
      );
    });

    it('should only execute certain lifecycle methods', function() {
      function runTest() {
        var lifecycle = [];
        var TestComponent = React.createClass({
          componentWillMount: function() {
            lifecycle.push('componentWillMount');
          },
          componentDidMount: function() {
            lifecycle.push('componentDidMount');
          },
          getInitialState: function() {
            lifecycle.push('getInitialState');
            return {name: 'TestComponent'};
          },
          render: function() {
            lifecycle.push('render');
            return <span>Component name: {this.state.name}</span>;
          },
          componentWillUpdate: function() {
            lifecycle.push('componentWillUpdate');
          },
          componentDidUpdate: function() {
            lifecycle.push('componentDidUpdate');
          },
          shouldComponentUpdate: function() {
            lifecycle.push('shouldComponentUpdate');
          },
          componentWillReceiveProps: function() {
            lifecycle.push('componentWillReceiveProps');
          },
          componentWillUnmount: function() {
            lifecycle.push('componentWillUnmount');
          },
        });

        var response = ReactServerRendering.renderToString(
          <TestComponent />
        );

        expect(response).toMatch(
          '<span ' + ROOT_ATTRIBUTE_NAME + '="" ' +
            ID_ATTRIBUTE_NAME + '="[^"]+" ' +
            ReactMarkupChecksum.CHECKSUM_ATTR_NAME + '="[^"]+">' +
            '<!-- react-text: [0-9]+ -->Component name: <!-- /react-text -->' +
            '<!-- react-text: [0-9]+ -->TestComponent<!-- /react-text -->' +
          '</span>'
        );
        expect(lifecycle).toEqual(
          ['getInitialState', 'componentWillMount', 'render']
        );
      }

      runTest();

      // This should work the same regardless of whether you can use DOM or not.
      ExecutionEnvironment.canUseDOM = true;
      runTest();
    });

    it('should have the correct mounting behavior', function() {
      // This test is testing client-side behavior.
      ExecutionEnvironment.canUseDOM = true;

      var mountCount = 0;
      var numClicks = 0;

      var TestComponent = React.createClass({
        componentDidMount: function() {
          mountCount++;
        },
        click: function() {
          numClicks++;
        },
        render: function() {
          return (
            <span ref="span" onClick={this.click}>Name: {this.props.name}</span>
          );
        },
      });

      var element = document.createElement('div');
      ReactDOM.render(<TestComponent />, element);

      var lastMarkup = element.innerHTML;

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

      ExecutionEnvironment.canUseDOM = false;
      lastMarkup = ReactServerRendering.renderToString(
        <TestComponent name="x" />
      );
      ExecutionEnvironment.canUseDOM = true;
      element.innerHTML = lastMarkup;

      var instance = ReactDOM.render(<TestComponent name="x" />, element);
      expect(mountCount).toEqual(3);
      expect(element.innerHTML).toBe(lastMarkup);

      // Ensure the events system works after mount into server markup
      expect(numClicks).toEqual(0);
      ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(instance.refs.span));
      expect(numClicks).toEqual(1);

      ReactDOM.unmountComponentAtNode(element);
      expect(element.innerHTML).toEqual('');

      // Now simulate a situation where the app is not idempotent. React should
      // warn but do the right thing.
      element.innerHTML = lastMarkup;
      spyOn(console, 'error');
      instance = ReactDOM.render(<TestComponent name="y" />, element);
      expect(mountCount).toEqual(4);
      expect(console.error.argsForCall.length).toBe(1);
      expect(element.innerHTML.length > 0).toBe(true);
      expect(element.innerHTML).not.toEqual(lastMarkup);

      // Ensure the events system works after markup mismatch.
      expect(numClicks).toEqual(1);
      ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(instance.refs.span));
      expect(numClicks).toEqual(2);
    });

    itRenders('should get initial state from getInitialState', (render) => {
      const Component = React.createClass({
        getInitialState: function() {
          return {text: 'foo'};
        },
        render: function() {
          return <div>{this.state.text}</div>;
        },
      });
      return render(<Component/>).then(e => expect(e.textContent).toBe('foo'));
    });

    describe('basic rendering', function() {
      itRenders('should render a blank div', render =>
        render(<div/>).then(e => expect(e.tagName.toLowerCase()).toBe('div')));
      itRenders('should reconnect a div with inline styles', render =>
        render(<div style={{color:'red', width:'30px'}}/>).then(e => {
          expect(e.style.color).toBe('red');
          expect(e.style.width).toBe('30px');
        })
      );
      itRenders('should reconnect a self-closing tag', render =>
        render(<br/>).then(e => expect(e.tagName.toLowerCase()).toBe('br')));
      itRenders('should reconnect a self-closing tag as a child', render =>
        render(<div><br/></div>).then(e => {
          expect(e.childNodes.length).toBe(1);
          expect(e.firstChild.tagName.toLowerCase()).toBe('br');
        }));
    });

    describe('property to attribute mapping', function() {
      itRenders('renders simple numbers', (render) => {
        return render(<div width={30}/>).then(e => expect(e.getAttribute('width')).toBe('30'));
      });

      itRenders('renders simple strings', (render) => {
        return render(<div width={"30"}/>).then(e => expect(e.getAttribute('width')).toBe('30'));
      });

      itRenders('renders booleans correctly', (render) => {
        return Promise.all([
          render(<div hidden={true}/>).then(e => expect(e.getAttribute('hidden')).toBe('')),
          /* eslint-disable react/jsx-boolean-value */
          render(<div hidden/>).then(e => expect(e.getAttribute('hidden')).toBe('')),
          /* eslint-enable react/jsx-boolean-value */
          render(<div hidden="hidden"/>).then(e => expect(e.getAttribute('hidden')).toBe('')),

          // I think this is not correct behavior, since hidden="" in HTML indicates
          // that the boolean property is present. however, it is how the current code
          // behaves, so the test is included here.
          render(<div hidden=""/>).then(e => expect(e.getAttribute('hidden')).toBe(null)),
          // I also disagree with the behavior of the next five tests; I think it's
          // overly clever and masks what may be a programmer error. Ideally, it would
          // warn and pass the value through.
          render(<div hidden="foo"/>).then(e => expect(e.getAttribute('hidden')).toBe('')),
          render(<div hidden={['foo', 'bar']}/>).then(e => expect(e.getAttribute('hidden')).toBe('')),
          render(<div hidden={{foo:'bar'}}/>).then(e => expect(e.getAttribute('hidden')).toBe('')),
          render(<div hidden={10}/>).then(e => expect(e.getAttribute('hidden')).toBe('')),
          render(<div hidden={0}/>).then(e => expect(e.getAttribute('hidden')).toBe(null)),

          render(<div hidden={false}/>).then(e => expect(e.getAttribute('hidden')).toBe(null)),
          render(<div/>).then(e => expect(e.getAttribute('hidden')).toBe(null)),
        ]);
      });

      itRenders('renders booleans as strings for string attributes', (render) => {
        return Promise.all([
          // I disagree with this behavior; I think it is undesirable and masks a
          // probable programmer error. I'd prefer that {true} & {false} be rendered as
          // they are for boolean attributes.
          render(<a href={true}/>).then(e => expect(e.getAttribute('href')).toBe('true')),
          /* eslint-disable react/jsx-boolean-value */
          render(<a href/>).then(e => expect(e.getAttribute('href')).toBe('true')),
          /* eslint-enable react/jsx-boolean-value */
          render(<a href={false}/>).then(e => expect(e.getAttribute('href')).toBe('false')),
        ]);
      });

      itRenders('handles download as a combined boolean/string attribute', (render) => {
        return Promise.all([
          render(<a download={true}/>).then(e => expect(e.getAttribute('download')).toBe('')),
          /* eslint-disable react/jsx-boolean-value */
          render(<a download/>).then(e => expect(e.getAttribute('download')).toBe('')),
          /* eslint-enable react/jsx-boolean-value */
          render(<a download={false}/>).then(e => expect(e.getAttribute('download')).toBe(null)),
          render(<a download="myfile"/>).then(e => expect(e.getAttribute('download')).toBe('myfile')),
          render(<a download={'true'}/>).then(e => expect(e.getAttribute('download')).toBe('true')),
        ]);
      });

      itRenders('renders className and htmlFor correctly', (render) => {
        return Promise.all([
          render(<div/>).then(e => expect(e.getAttribute('class')).toBe(null)),
          render(<div className="myClassName"/>).then(e => expect(e.getAttribute('class')).toBe('myClassName')),
          render(<div className=""/>).then(e => expect(e.getAttribute('class')).toBe('')),
          // I disagree with the behavior of the next three tests; I think that a boolean value should
          // warn, and not transform the value. These tests express current behavior.
          render(<div className={true}/>).then(e => expect(e.getAttribute('class')).toBe('true')),
          /* eslint-disable react/jsx-boolean-value */
          render(<div className/>).then(e => expect(e.getAttribute('class')).toBe('true')),
          /* eslint-enable react/jsx-boolean-value */
          render(<div className={false}/>).then(e => expect(e.getAttribute('class')).toBe('false')),

          render(<div/>).then(e => expect(e.getAttribute('for')).toBe(null)),
          render(<div htmlFor="myFor"/>).then(e => expect(e.getAttribute('for')).toBe('myFor')),
          render(<div htmlFor=""/>).then(e => expect(e.getAttribute('for')).toBe('')),
          // I disagree with the behavior of the next three tests; I think that a boolean value should
          // warn, and not transform the value. These tests express current behavior.
          render(<div htmlFor={true}/>).then(e => expect(e.getAttribute('for')).toBe('true')),
          /* eslint-disable react/jsx-boolean-value */
          render(<div htmlFor/>).then(e => expect(e.getAttribute('for')).toBe('true')),
          /* eslint-enable react/jsx-boolean-value */
          render(<div htmlFor={false}/>).then(e => expect(e.getAttribute('for')).toBe('false')),
        ]);
      });

      itRenders('does not render key, children, ref, or dangerouslySetInnerHTML as attributes', (render) => {
        class RefComponent extends React.Component {
          render() {
            return <div ref="foo"/>;
          }
        }
        return Promise.all([
          render(<RefComponent/>).then(e => expect(e.getAttribute('ref')).toBe(null)),
          render(<div key="foo"/>).then(e => expect(e.getAttribute('key')).toBe(null)),
          render(React.createElement('div', {}, 'foo')).then(e => expect(e.getAttribute('children')).toBe(null)),
          render(<div dangerouslySetInnerHTML={{__html:'foo'}}/>)
            .then(e => expect(e.getAttribute('dangerouslySetInnerHTML')).toBe(null)),
        ]);
      });

      itRenders('does not render unknown attributes', (render) => {
        return render(<div foo="bar"/>).then(e => expect(e.getAttribute('foo')).toBe(null));
      });

      itRenders('does not render HTML events', (render) => {
        return Promise.all([
          render(<div onClick={() => {}}/>).then(e => expect(e.getAttribute('onClick')).toBe(null)),
          render(<div onClick={() => {}}/>).then(e => expect(e.getAttribute('onclick')).toBe(null)),
          render(<div onClick={() => {}}/>).then(e => expect(e.getAttribute('click')).toBe(null)),
          render(<div onKeyDown={() => {}}/>).then(e => expect(e.getAttribute('onKeyDown')).toBe(null)),
          render(<div onCustomEvent={() => {}}/>).then(e => expect(e.getAttribute('onCustomEvent')).toBe(null)),
        ]);
      });
    });

    describe('components and children', function() {
      function expectNode(node, type, value) {
        expect(node).not.toBe(null);
        expect(node.nodeType).toBe(type);
        expect(node.nodeValue).toMatch(value);
      }

      function expectTextNode(node, text) {
        expectNode(node, COMMENT_NODE_TYPE, ' react-text: [0-9]+ ');
        if (text.length > 0) {
          node = node.nextSibling;
          expectNode(node, TEXT_NODE_TYPE, text);
        }
        expectNode(node.nextSibling, COMMENT_NODE_TYPE, ' /react-text ');
      }

      function expectEmptyNode(node) {
        expectNode(node, COMMENT_NODE_TYPE, ' react-empty: [0-9]+ ');
      }

      itRenders('renders a number as single child',
        render => render(<div>{3}</div>).then(e => expect(e.textContent).toBe('3')));
      // zero is falsey, so it could look like no children if the code isn't careful.
      itRenders('renders zero as single child',
        render => render(<div>{0}</div>).then(e => expect(e.textContent).toBe('0')));
      itRenders('renders null single child as blank',
        render => render(<div>{null}</div>).then(e => expect(e.childNodes.length).toBe(0)));
      itRenders('renders false single child as blank',
        render => render(<div>{false}</div>).then(e => expect(e.childNodes.length).toBe(0)));
      itRenders('renders undefined single child as blank',
        render => render(<div>{undefined}</div>).then(e => expect(e.childNodes.length).toBe(0)));

      itRenders('renders a null component as empty', (render) => {
        const NullComponent = () => null;
        return render(<NullComponent/>).then(e => expectEmptyNode(e));
      });

      itRenders('renders a false component as empty', (render) => {
        const FalseComponent = () => false;
        return render(<FalseComponent />).then(e => expectEmptyNode(e));
      });

      itThrowsOnRender('throws rendering a string component', (render) => {
        const StringComponent = () => 'foo';
        return render(<StringComponent/>, 1);
      });

      itThrowsOnRender('throws rendering an undefined component', (render) => {
        const UndefinedComponent = () => undefined;
        return render(<UndefinedComponent/>, 1);
      });

      itThrowsOnRender('throws rendering a number component', (render) => {
        const NumberComponent = () => 54;
        return render(<NumberComponent/>, 1);
      });

      itRenders('renders null children as blank', (render) => {
        return render(<div>{null}foo</div>).then(e => {
          expect(e.childNodes.length).toBe(3);
          expectTextNode(e.childNodes[0], 'foo');
        });
      });

      itRenders('renders false children as blank', (render) => {
        return render(<div>{false}foo</div>).then(e => {
          expect(e.childNodes.length).toBe(3);
          expectTextNode(e.childNodes[0], 'foo');
        });
      });

      itRenders('renders null and false children together as blank', (render) => {
        return render(<div>{false}{null}foo{null}{false}</div>).then(e => {
          expect(e.childNodes.length).toBe(3);
          expectTextNode(e.childNodes[0], 'foo');
        });
      });

      itRenders('renders only null and false children as blank', (render) => {
        return render(<div>{false}{null}{null}{false}</div>).then(e => {
          expect(e.childNodes.length).toBe(0);
        });
      });

      itRenders('renders leading blank children with comments when there are multiple children', (render) => {
        return render(<div>{''}foo</div>).then(e => {
          expect(e.childNodes.length).toBe(5);
          expectTextNode(e.childNodes[0], '');
          expectTextNode(e.childNodes[2], 'foo');
        });
      });

      itRenders('renders trailing blank children with comments when there are multiple children', (render) => {
        return render(<div>foo{''}</div>).then(e => {
          expect(e.childNodes.length).toBe(5);
          expectTextNode(e.childNodes[0], 'foo');
          expectTextNode(e.childNodes[3], '');
        });
      });

      itRenders('renders an element with just one text child without comments', (render) => {
        return render(<div>foo</div>).then(e => {
          expect(e.childNodes.length).toBe(1);
          expectNode(e.firstChild, TEXT_NODE_TYPE, 'foo');
        });
      });

      itRenders('renders an element with two text children with comments', (render) => {
        return render(<div>{'foo'}{'bar'}</div>).then(e => {
          expect(e.childNodes.length).toBe(6);
          expectTextNode(e.childNodes[0], 'foo');
          expectTextNode(e.childNodes[3], 'bar');
        });
      });

      itRenders('renders an element with number and text children with comments', (render) => {
        return render(<div>{'foo'}{40}</div>).then(e => {
          expect(e.childNodes.length).toBe(6);
          expectTextNode(e.childNodes[0], 'foo');
          expectTextNode(e.childNodes[3], '40');
        });
      });
      itRenders('renders a newline-eating tag with content not starting with \\n',
        render => render(<pre>Hello</pre>).then(e => expect(e.textContent).toBe('Hello')));
      itRenders('renders a newline-eating tag with content starting with \\n',
        render => render(<pre>{"\nHello"}</pre>).then(e => expect(e.textContent).toBe('\nHello')));
      itRenders('renders a normal tag with content starting with \\n',
        render => render(<div>{"\nHello"}</div>).then(e => expect(e.textContent).toBe('\nHello')));

      itRenders('renders stateless, React.createClass, class, and factory components', (render) => {
        const StatelessComponent = () => <div>foo</div>;
        const RccComponent = React.createClass({
          render: function() {
            return <div>foo</div>;
          },
        });
        class ClassComponent extends React.Component {
          render() {
            return <div>foo</div>;
          }
        }
        const FactoryComponent = () => {
          return {
            render: function() {
              return <div>foo</div>;
            },
          };
        };
        return Promise.all(
          [StatelessComponent, RccComponent, ClassComponent, FactoryComponent].map((Component) => {
            return render(<Component/>).then(e => {
              expect(e.childNodes.length).toBe(1);
              expectNode(e.firstChild, TEXT_NODE_TYPE, 'foo');
            });
          })
        );
      });

      itRenders('escapes >,<, and & as single child', render => {
        return render(<div>{'<span>Text&quot;</span>'}</div>).then(e => {
          expect(e.childNodes.length).toBe(1);
          expectNode(e.firstChild, TEXT_NODE_TYPE, '<span>Text&quot;</span>');
        });
      });

      itRenders('escapes >,<, and & as multiple children', render => {
        return render(<div>{'<span>Text1&quot;</span>'}{'<span>Text2&quot;</span>'}</div>).then(e => {
          expect(e.childNodes.length).toBe(6);
          expectTextNode(e.childNodes[0], '<span>Text1&quot;</span>');
          expectTextNode(e.childNodes[3], '<span>Text2&quot;</span>');
        });
      });

      itRenders('renders single child hierarchies of components', render => {
        const Component = (props) => <div>{props.children}</div>;
        return render(
          <Component>
            <Component>
              <Component>
                <Component/>
              </Component>
            </Component>
          </Component>)
          .then(element => {
            for (var i = 0; i < 3; i++) {
              expect(element.tagName.toLowerCase()).toBe('div');
              expect(element.childNodes.length).toBe(1);
              element = element.firstChild;
            }
            expect(element.tagName.toLowerCase()).toBe('div');
            expect(element.childNodes.length).toBe(0);
          });
      });
      itRenders('should reconnect multi-child hierarchies of components', render => {
        const Component = (props) => <div>{props.children}</div>;
        return render(
          <Component>
            <Component>
              <Component/><Component/>
            </Component>
            <Component>
              <Component/><Component/>
            </Component>
          </Component>)
          .then(element => {
            expect(element.tagName.toLowerCase()).toBe('div');
            expect(element.childNodes.length).toBe(2);
            for (var i = 0; i < 2; i++) {
              var child = element.childNodes[i];
              expect(child.tagName.toLowerCase()).toBe('div');
              expect(child.childNodes.length).toBe(2);
              for (var j = 0; j < 2; j++) {
                var grandchild = child.childNodes[j];
                expect(grandchild.tagName.toLowerCase()).toBe('div');
                expect(grandchild.childNodes.length).toBe(0);
              }
            }
          });
      });

      itThrowsOnRender('throws when rendering null', render => render(null));
      itThrowsOnRender('throws when rendering false', render => render(false));
      itThrowsOnRender('throws when rendering undefined', render => render(undefined));
      itThrowsOnRender('throws when rendering number', render => render(30));
      itThrowsOnRender('throws when rendering string', render => render('foo'));
    });

    describe('form controls', function() {
      // simple inputs
      // -------------
      itRenders('can render an input with a value', (render) => {
        return Promise.all([
          render(<input value="foo" onChange={() => {}}/>).then(e =>
            expect(e.getAttribute('value') || e.value).toBe('foo')),
          render(<input value="foo" readOnly={true}/>).then(e =>
            expect(e.getAttribute('value') || e.value).toBe('foo')),
        ]);
      });

      itRenders('can render an input with a value and no onChange/readOnly', render => {
        return render(<input value="foo"/>, 1)
          .then(element => expect(element.getAttribute('value') || element.value).toBe('foo'));
      });

      itRenders('can render an input with a defaultValue', (render) => {
        return render(<input defaultValue="foo"/>).then(e => {
          expect(e.getAttribute('value') || e.value).toBe('foo');
          expect(e.getAttribute('defaultValue')).toBe(null);
        });
      });

      itRenders('can render an input with both a value and defaultValue part 1', render => {
        return render(<input value="foo" defaultValue="bar" readOnly={true}/>, 1)
          .then(element => {
            expect(element.getAttribute('value') || element.value).toBe('foo');
            expect(element.getAttribute('defaultValue')).toBe(null);
          });
      });

      itRenders('can render an input with both a value and defaultValue part 2', render => {
        return render(<input defaultValue="bar" value="foo" readOnly={true}/>, 1)
          .then(element => {
            expect(element.getAttribute('value') || element.value).toBe('foo');
            expect(element.getAttribute('defaultValue')).toBe(null);
          });
      });

      // checkboxes
      // ----------
      itRenders('can render a checkbox that is checked', (render) => {
        return Promise.all([
          render(<input type="checkbox" checked={true} onChange={() => {}}/>)
            .then(e => expect(e.checked).toBe(true)),
          render(<input type="checkbox" checked={true} readOnly={true}/>)
            .then(e => expect(e.checked).toBe(true)),
        ]);
      });

      itRenders('can render a checkbox that is checked and no onChange/readOnly', render => {
        return render(<input type="checkbox" checked={true}/>, 1)
          .then(element => expect(element.checked).toBe(true));
      });

      itRenders('can render a checkbox with defaultChecked', (render) => {
        return render(<input type="checkbox" defaultChecked={true}/>).then(e => {
          expect(e.checked).toBe(true);
          expect(e.getAttribute('defaultChecked')).toBe(null);
        });
      });

      itRenders('can render a checkbox with both a checked and defaultChecked part 1', render => {
        return render(<input type="checkbox" checked={true} defaultChecked={false} readOnly={true}/>, 1)
          .then(element => {
            expect(element.checked).toBe(true);
            expect(element.getAttribute('defaultChecked')).toBe(null);
          });
      });

      itRenders('can render a checkbox with both a checked and defaultChecked part 2', render => {
        return render(<input type="checkbox" defaultChecked={false} checked={true} readOnly={true}/>, 1)
          .then(element => {
            expect(element.checked).toBe(true);
            expect(element.getAttribute('defaultChecked')).toBe(null);
          });
      });

      // textareas
      // ---------
      itRenders('can render a textarea with a value', (render) => {
        return Promise.all([
          render(<textarea value="foo" onChange={() => {}}/>).then(e => {
            expect(e.getAttribute('value')).toBe(null);
            expect(e.value).toBe('foo');
          }),
          render(<textarea value="foo" readOnly={true}/>).then(e => {
            expect(e.getAttribute('value')).toBe(null);
            expect(e.value).toBe('foo');
          }),
        ]);
      });

      itRenders('can render a textarea with a value and no onChange/readOnly', render => {
        return render(<textarea value="foo"/>, 1)
          .then(element => {
            expect(element.getAttribute('value')).toBe(null);
            expect(element.value).toBe('foo');
          });
      });

      itRenders('can render a textarea with a defaultValue', (render) => {
        return render(<textarea defaultValue="foo"/>).then(e => {
          expect(e.getAttribute('value')).toBe(null);
          expect(e.getAttribute('defaultValue')).toBe(null);
          expect(e.value).toBe('foo');
        });
      });

      itRenders('can render a textarea with both a value and defaultValue part 1', render => {
        return render(<textarea value="foo" defaultValue="bar" readOnly={true}/>, 1)
          .then(element => {
            expect(element.getAttribute('value')).toBe(null);
            expect(element.getAttribute('defaultValue')).toBe(null);
            expect(element.value).toBe('foo');
          });
      });

      itRenders('can render a textarea with both a value and defaultValue part 2', render => {
        return render(<textarea defaultValue="bar" value="foo" readOnly={true}/>, 1)
          .then(element => {
            expect(element.getAttribute('value')).toBe(null);
            expect(element.getAttribute('defaultValue')).toBe(null);
            expect(element.value).toBe('foo');
          });
      });

      // selects
      // ---------
      var options;
      beforeEach(function() {
        options = [
          <option key={1} value="foo" id="foo">Foo</option>,
          <option key={2} value="bar" id="bar">Bar</option>,
          <option key={3} value="baz" id="baz">Baz</option>,
        ];
      });

      const expectSelectValue = (element, selected) => {
        // the select shouldn't have a value or defaultValue attribute.
        expect(element.getAttribute('value')).toBe(null);
        expect(element.getAttribute('defaultValue')).toBe(null);

        ['foo', 'bar', 'baz'].forEach((value) => {
          const selectedValue = (selected.indexOf(value) !== -1);
          var option = element.querySelector(`#${value}`);
          expect(option.selected).toBe(selectedValue);
        });
      };
      itRenders('can render a select with a value', (render) => {
        return Promise.all([
          render(<select value="bar" onChange={() => {}}>{options}</select>)
            .then(e => expectSelectValue(e, ['bar'])),
          render(<select value="bar" readOnly={true}>{options}</select>)
            .then(e => expectSelectValue(e, ['bar'])),
          render(<select value={['bar', 'baz']} multiple={true} readOnly={true}>{options}</select>)
            .then(e => expectSelectValue(e, ['bar', 'baz'])),
        ]);
      });

      itRenders('can render a select with a value and no onChange/readOnly', render => {
        return render(<select value="bar">{options}</select>, 1)
          .then(element => expectSelectValue(element, ['bar']));
      });

      itRenders('can render a select with a defaultValue', (render) => {
        return render(<select defaultValue="bar">{options}</select>)
          .then(e => expectSelectValue(e, ['bar']));
      });

      itRenders('can render a select with both a value and defaultValue part 1', render => {
        return render(<select value="bar" defaultValue="baz" readOnly={true}>{options}</select>, 1)
          .then(element => expectSelectValue(element, ['bar']));
      });

      itRenders('can render a select with both a value and defaultValue part 2', render => {
        return render(<select defaultValue="baz" value="bar" readOnly={true}>{options}</select>, 1)
          .then(element => expectSelectValue(element, ['bar']));
      });

      // Controlled inputs on the client
      const getControlledFieldClass = (initialValue, onChange = () => {}, TagName = 'input',
        valueKey = 'value', extraProps = {}, children = null) => {
        return class ControlledField extends React.Component {
          constructor() {
            super();
            this.state = {[valueKey]: initialValue};
          }
          handleChange(event) {
            onChange(event);
            this.setState({[valueKey]: event.target[valueKey]});
          }
          render() {
            return (<TagName type="text"
              {...{[valueKey]: this.state[valueKey]}}
              onChange={this.handleChange.bind(this)}
              {...extraProps}>{children}</TagName>);
          }
        };
      };

      const testControlledField = (render, initialValue, changedValue, TagName = 'input',
        valueKey = 'value', extraProps = {}, children = null) => {

        let changeCount = 0;
        const ControlledField = getControlledFieldClass(
          initialValue, () => changeCount++, TagName, valueKey, extraProps, children
        );

        return render(<ControlledField/>).then(e => {
          expect(changeCount).toBe(0);
          expect(e[valueKey]).toBe(initialValue);

          // simulate a user typing.
          e[valueKey] = changedValue;
          ReactTestUtils.Simulate.change(e);

          expect(changeCount).toBe(1);
          expect(e[valueKey]).toBe(changedValue);
        });
      };

      itClientRenders('should render a controlled text input',
        render => testControlledField(render, 'Hello', 'Goodbye'));

      itClientRenders('should render a controlled textarea',
        render => testControlledField(render, 'Hello', 'Goodbye', 'textarea'));

      itClientRenders('should render a controlled checkbox',
        render => testControlledField(render, true, false, 'input', 'checked', {type:'checkbox'}));

      itClientRenders('should render a controlled select',
        render => testControlledField(render, 'B', 'A', 'select', 'value', {},
          [
            <option key="1" value="A">Option A</option>,
            <option key="2" value="B">Option B</option>,
          ]));
      // User interaction before client markup reconnect
      const testFieldWithUserInteractionBeforeClientRender = (
        element, initialValue = 'foo', changedValue = 'bar', valueKey = 'value'
      ) => {
        const root = renderOnServer(element);
        const field = root.firstChild;
        expect(field[valueKey]).toBe(initialValue);

        // simulate a user typing in the field **before** client-side reconnect happens.
        field[valueKey] = changedValue;

        // reconnect to the server markup.
        renderOnClient(element, root);

        // verify that the input field was not replaced.
        expect(root.firstChild).toBe(field);
        expect(field[valueKey]).toBe(changedValue);
      };

      it('should not blow away user-entered text on successful reconnect to an uncontrolled input', () => {
        testFieldWithUserInteractionBeforeClientRender(<input defaultValue="foo"/>, 'foo', 'bar');
      });

      it('should not blow away user-entered text on successful reconnect to an controlled input', () => {
        let changeCount = 0;
        const Component = getControlledFieldClass('foo', () => changeCount++);
        testFieldWithUserInteractionBeforeClientRender(<Component/>, 'foo', 'bar');
        // TODO: is this right? should onChange fire when a user modifies before markup reconnection?
        expect(changeCount).toBe(0);
      });

      it('should not blow away user-entered text on successful reconnect to an uncontrolled checkbox', () => {
        testFieldWithUserInteractionBeforeClientRender(
          <input type="checkbox" defaultChecked={true}/>, true, false, 'checked'
        );
      });

      it('should not blow away user-entered text on successful reconnect to an controlled checkbox', () => {
        let changeCount = 0;
        const Component = getControlledFieldClass(true, () => changeCount++, 'input', 'checked', {type: 'checkbox'});
        testFieldWithUserInteractionBeforeClientRender(<Component/>, true, false, 'checked');
        // TODO: is this right? should onChange fire when a user modifies before markup reconnection?
        expect(changeCount).toBe(0);
      });

      it('should not blow away user-entered text on successful reconnect to an uncontrolled textarea', () => {
        testFieldWithUserInteractionBeforeClientRender(<textarea defaultValue="foo"/>, 'foo', 'bar', 'textContent');
      });

      it('should not blow away user-entered text on successful reconnect to an uncontrolled textarea', () => {
        let changeCount = 0;
        const Component = getControlledFieldClass('foo', () => changeCount++, 'textarea', 'value');
        testFieldWithUserInteractionBeforeClientRender(<Component/>, 'foo', 'bar', 'textContent');
        // TODO: is this right? should onChange fire when a user modifies before markup reconnection?
        expect(changeCount).toBe(0);
      });

    });


    describe('context', function() {
      itRenders('can render context', (render) => {
        class ClassChildWithContext extends React.Component {
            render() {
              return <div id="classChild">{this.context.text}</div>;
            }
        }
        ClassChildWithContext.contextTypes = {text: React.PropTypes.string};

        function StatelessChildWithContext(props, context) {
          return <div id="statelessChild">{context.text}</div>;
        }
        StatelessChildWithContext.contextTypes = {text: React.PropTypes.string};

        class ClassChildWithoutContext extends React.Component {
            render() {
              // this should render blank; context isn't passed to this component.
              return <div id="classWoChild">{this.context.text}</div>;
            }
        }

        function StatelessChildWithoutContext(props, context) {
          // this should render blank; context isn't passed to this component.
          return <div id="statelessWoChild">{context.text}</div>;
        }

        class ClassChildWithWrongContext extends React.Component {
            render() {
              // this should render blank; context.text isn't passed to this component.
              return <div id="classWrongChild">{this.context.text}</div>;
            }
        }
        ClassChildWithWrongContext.contextTypes = {foo: React.PropTypes.string};

        function StatelessChildWithWrongContext(props, context) {
          // this should render blank; context.text isn't passed to this component.
          return <div id="statelessWrongChild">{context.text}</div>;
        }
        StatelessChildWithWrongContext.contextTypes = {foo: React.PropTypes.string};

        class Parent extends React.Component {
          getChildContext() {
            return {text: 'purple'};
          }
          render() {
            return (
              <div id="parent">
                <ClassChildWithContext/>
                <StatelessChildWithContext/>
                <ClassChildWithWrongContext/>
                <StatelessChildWithWrongContext/>
                <ClassChildWithoutContext/>
                <StatelessChildWithoutContext/>
              </div>);
          }
        }
        Parent.childContextTypes = {text: React.PropTypes.string };

        return render(<Parent/>).then(e => {
          expect(e.querySelector('#classChild').textContent).toBe('purple');
          expect(e.querySelector('#statelessChild').textContent).toBe('purple');
          expect(e.querySelector('#classWoChild').textContent).toBe('');
          expect(e.querySelector('#statelessWoChild').textContent).toBe('');
          expect(e.querySelector('#classWrongChild').textContent).toBe('');
          expect(e.querySelector('#statelessWrongChild').textContent).toBe('');
        });
      });

      itRenders('can pass context through to a grandchild', (render) => {
        class ClassGrandchild extends React.Component {
          render() {
            return <div id="classGrandchild">{this.context.text}</div>;
          }
        }
        ClassGrandchild.contextTypes = {text: React.PropTypes.string};

        function StatelessGrandchild(props, context) {
          return <div id="statelessGrandchild">{context.text}</div>;
        }
        StatelessGrandchild.contextTypes = {text: React.PropTypes.string};

        class Child extends React.Component {
            render() {
              // Child has no contextTypes; contents of #childContext should be a blank string.
              return (
                <div id="child">
                  <div id="childContext">{this.context.text}</div>
                  <ClassGrandchild/>
                  <StatelessGrandchild/>
                </div>);
            }
        }

        class Parent extends React.Component {
          getChildContext() {
            return {text: 'purple'};
          }
          render() {
            return <div id="parent"><Child/></div>;
          }
        }
        Parent.childContextTypes = {text: React.PropTypes.string };

        return render(<Parent/>).then(e => {
          expect(e.querySelector('#childContext').textContent).toBe('');
          expect(e.querySelector('#statelessGrandchild').textContent).toBe('purple');
          expect(e.querySelector('#classGrandchild').textContent).toBe('purple');
        });
      });

      itRenders('should let a child context override a parent context', (render) => {
        class Parent extends React.Component {
          getChildContext() {
            return {text: 'purple'};
          }
          render() {
            return <Child/>;
          }
        }
        Parent.childContextTypes = {text: React.PropTypes.string};

        class Child extends React.Component {
          getChildContext() {
            return {text: 'red'};
          }
          render() {
            return <Grandchild/>;
          }
        }
        Child.childContextTypes = {text: React.PropTypes.string};

        const Grandchild = (props, context) => {
          return <div>{context.text}</div>;
        };
        Grandchild.contextTypes = {text: React.PropTypes.string};

        return render(<Parent/>).then(e => expect(e.textContent).toBe('red'));
      });

      itRenders('should merge a child context with a parent context', (render) => {
        class Parent extends React.Component {
          getChildContext() {
            return {text1: 'purple'};
          }
          render() {
            return <Child/>;
          }
        }
        Parent.childContextTypes = {text1: React.PropTypes.string};

        class Child extends React.Component {
          getChildContext() {
            return {text2: 'red'};
          }
          render() {
            return <Grandchild/>;
          }
        }
        Child.childContextTypes = {text2: React.PropTypes.string};

        const Grandchild = (props, context) => {
          return <div><div id="first">{context.text1}</div><div id="second">{context.text2}</div></div>;
        };
        Grandchild.contextTypes = {text1: React.PropTypes.string, text2: React.PropTypes.string};

        return render(<Parent/>).then(e => {
          expect(e.querySelector('#first').textContent).toBe('purple');
          expect(e.querySelector('#second').textContent).toBe('red');
        });
      });

      itRenders('should run componentWillMount before getChildContext', (render) => {
        class Parent extends React.Component {
          getChildContext() {
            return {text: this.state.text};
          }
          componentWillMount() {
            this.setState({text: 'foo'});
          }
          render() {
            return <Child/>;
          }
        }
        Parent.childContextTypes = {text: React.PropTypes.string};

        const Child = (props, context) => {
          return <div>{context.text}</div>;
        };
        Child.contextTypes = {text: React.PropTypes.string};

        return render(<Parent/>).then(e => expect(e.textContent).toBe('foo'));
      });


      itThrowsOnRender('throws if getChildContext exists without childContextTypes', render => {
        class Component extends React.Component {
          render() {
            return <div/>;
          }
          getChildContext() {
            return {foo: 'bar'};
          }
        }
        return render(<Component/>);
      });

      itThrowsOnRender('throws if getChildContext returns a value not in childContextTypes', render => {
        class Component extends React.Component {
          render() {
            return <div/>;
          }
          getChildContext() {
            return {value1: 'foo', value2: 'bar'};
          }
        }
        Component.childContextTypes = {value1: React.PropTypes.string};
        return render(<Component/>);
      });

      // TODO: warn about context types in DEV mode?

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

      // Markup Matches: basic
      // this test only applies to the DOM client validator.
      xit('should reconnect a div with attributes in different order', () =>
        expectMarkupMatch(<div width="30" height="40"/>, <div height="40" width="30"/>));

      // Markup Matches: components
      it('should reconnect different component types', () => {
        // try each type of component on client and server.
        class ES6ClassComponent extends React.Component {
          render() {
            return <div id={this.props.id}/>;
          }
        }
        const CreateClassComponent = React.createClass({
          render: function() {
            return <div id={this.props.id}/>;
          },
        });
        const PureComponent = (props) => <div id={props.id}/>;
        const bareElement = <div id="foobarbaz"/>;

        expectMarkupMatch(<ES6ClassComponent id="foobarbaz"/>, <ES6ClassComponent id="foobarbaz"/>);
        expectMarkupMatch(<ES6ClassComponent id="foobarbaz"/>, <CreateClassComponent id="foobarbaz"/>);
        expectMarkupMatch(<ES6ClassComponent id="foobarbaz"/>, <PureComponent id="foobarbaz"/>);
        expectMarkupMatch(<ES6ClassComponent id="foobarbaz"/>, bareElement);

        expectMarkupMatch(<CreateClassComponent id="foobarbaz"/>, <ES6ClassComponent id="foobarbaz"/>);
        expectMarkupMatch(<CreateClassComponent id="foobarbaz"/>, <CreateClassComponent id="foobarbaz"/>);
        expectMarkupMatch(<CreateClassComponent id="foobarbaz"/>, <PureComponent id="foobarbaz"/>);
        expectMarkupMatch(<CreateClassComponent id="foobarbaz"/>, bareElement);

        expectMarkupMatch(<PureComponent id="foobarbaz"/>, <ES6ClassComponent id="foobarbaz"/>);
        expectMarkupMatch(<PureComponent id="foobarbaz"/>, <CreateClassComponent id="foobarbaz"/>);
        expectMarkupMatch(<PureComponent id="foobarbaz"/>, <PureComponent id="foobarbaz"/>);
        expectMarkupMatch(<PureComponent id="foobarbaz"/>, bareElement);

        expectMarkupMatch(bareElement, <ES6ClassComponent id="foobarbaz"/>);
        expectMarkupMatch(bareElement, <CreateClassComponent id="foobarbaz"/>);
        expectMarkupMatch(bareElement, <PureComponent id="foobarbaz"/>);
        expectMarkupMatch(bareElement, bareElement);
      });

      // Markup Matches: text
      it('should reconnect a div with text', () => expectMarkupMatch(<div>Text</div>));
      it('should reconnect a div with an entity', () =>
        expectMarkupMatch(<div>This markup contains an nbsp entity: &nbsp; server text</div>));
      it('should reconnect a div with text in code block', () => expectMarkupMatch(<div>{"Text"}</div>));
      it('should reconnect a div with text in code block & a literal',
        () => expectMarkupMatch(<div>{"Text"}</div>, <div>Text</div>));
      it('should reconnect a div with text in two code blocks', () => expectMarkupMatch(<div>{"Text1"}{"Text2"}</div>));
      it('should reconnect a div with text in two code blocks and a literal & code block', () =>
        expectMarkupMatch(<div>{"Text1"}{"Text2"}</div>, <div>Text1{"Text2"}</div>));
      it('should reconnect a div with text in code block and literal',
        () => expectMarkupMatch(<div>Text1{"Text2"}</div>));
      it('should reconnect a div with a number', () => expectMarkupMatch(<div>{2}</div>));
      it('should reconnect a div with a number and string version of number', () =>
        expectMarkupMatch(<div>{2}</div>, <div>2</div>));
      it('should reconnect a div with text with special characters',
        () => expectMarkupMatch(<div>{"Text & > < Stuff"}</div>));
      it('should reconnect a div with text with special characters in multiple children',
        () => expectMarkupMatch(<div>{"&<>\"'"}{"Text & > <\"' Stuff"}</div>));
      it('should reconnect a div with text with flanking whitespace',
        () => expectMarkupMatch(<div>  Text </div>));

      // Markup Matches: children
      it('should reconnect a div with text sibling to a node',
        () => expectMarkupMatch(<div>Text<span>More Text</span></div>));
      it('should reconnect a div with a child', () => expectMarkupMatch(<div id="parent"><div id="child"/></div>));
      it('should reconnect a div with multiple children',
        () => expectMarkupMatch(<div id="parent"><div id="child1"/><div id="child2"/></div>));
      it('should reconnect a div with multiple children separated by whitespace',
        () => expectMarkupMatch(<div id="parent"><div id="child1"/> <div id="child2"/></div>));
      it('should reconnect a div with a child surrounded by whitespace',
        () => expectMarkupMatch(<div id="parent">  <div id="child"/>   </div>)); // eslint-disable-line no-multi-spaces
      it('should reconnect a div with children separated by whitespace',
          () => expectMarkupMatch(<div id="parent"><div id="child1"/> <div id="child2"/></div>));
      it('should reconnect a div with blank text child', () => expectMarkupMatch(<div>{''}</div>));
      it('should reconnect a div with blank text children', () => expectMarkupMatch(<div>{''}{''}{''}</div>));
      it('should reconnect a div with whitespace children', () => expectMarkupMatch(<div>{' '}{' '}{' '}</div>));
      it('should reconnect a div with null children', () => expectMarkupMatch(<div>{null}{null}{null}</div>));
      it('should reconnect empty components as children', () =>
        expectMarkupMatch(<div><EmptyComponent/><EmptyComponent/></div>));

      // Markup Matches: specially wrapped components
      // (see the big switch near the beginning ofReactDOMComponent.mountComponent)
      it('should reconnect an img', () => expectMarkupMatch(<img/>));
      it('should reconnect an input', () => expectMarkupMatch(<input/>));
      it('should reconnect an input with defaultValue', () => expectMarkupMatch(<input defaultValue="foo"/>));
      it('should reconnect an input with defaultChecked true',
        () => expectMarkupMatch(<input defaultChecked={true}/>));
      it('should reconnect an input with defaultChecked false',
        () => expectMarkupMatch(<input defaultChecked={false}/>));
      it('should reconnect a button', () => expectMarkupMatch(<button/>));
      it('should reconnect a text area without content', () => expectMarkupMatch(<textarea/>));
      it('should reconnect a text area with content',
        () => expectMarkupMatch(<textarea defaultValue="Hello"/>));
      it('should reconnect a select',
        () => expectMarkupMatch(
          <select>
            <option value="A">Option A</option>
            <option value="B">Option B</option>
          </select>));
      it('should reconnect a select with a defaultValue',
        () => {
          expectMarkupMatch(
            <select defaultValue="A">
              <option value="A">Option A</option>
              <option value="B">Option B</option>
            </select>);
        });
      it('should reconnect a multiple select',
        () => expectMarkupMatch(
          <select multiple={true}>
            <option value="A">Option A</option>
            <option value="B">Option B</option>
            <option value="C">Option C</option>
          </select>));
      it('should reconnect a multiple select with a defaultValue',
        () => {
          expectMarkupMatch(
            <select multiple={true} defaultValue={['A', 'C']}>
              <option value="A">Option A</option>
              <option value="B">Option B</option>
              <option value="C">Option C</option>
            </select>);
        });

      // Markup Matches: namespaces
      it('should reconnect an svg element', () => expectMarkupMatch(<svg/>));
      it('should reconnect an svg element with an xlink',
        () => expectMarkupMatch(<svg><image xlinkHref="http://i.imgur.com/w7GCRPb.png"/></svg>));
      it('should reconnect a math element', () => expectMarkupMatch(<math/>));

      // Markup Matches: misc
      it('should reconnect a div with dangerouslySetInnerHTML',
        () => expectMarkupMatch(<div dangerouslySetInnerHTML={{__html:"<span id='child'/>"}}></div>));
      it('should reconnect an empty component at root', () => expectMarkupMatch(<EmptyComponent/>));
      it('should reconnect if component trees differ but resulting markup is the same', () => {
        class Component1 extends React.Component {
          render() {
            return <span id="foobar"/>;
          }
        }
        class Component2 extends React.Component {
          render() {
            return <span id="foobar"/>;
          }
        }
        expectMarkupMatch(<Component1/>, <Component2/>);
        expectMarkupMatch(<div><Component1/></div>, <div><Component2/></div>);
      });

      // Markup Mismatches: basic
      it('should error reconnecting different element types', () => expectMarkupMismatch(<div/>, <span/>));
      it('should error reconnecting missing attributes', () => expectMarkupMismatch(<div id="foo"/>, <div/>));
      it('should error reconnecting added attributes', () => expectMarkupMismatch(<div/>, <div id="foo"/>));
      it('should error reconnecting different attribute values',
        () => expectMarkupMismatch(<div id="foo"/>, <div id="bar"/>));

      // Markup Mismatches: text
      it('should error reconnecting different text',
        () => expectMarkupMismatch(<div>Text</div>, <div>Other Text</div>));
      it('should error reconnecting different numbers',
        () => expectMarkupMismatch(<div>{2}</div>, <div>{3}</div>));
      it('should error reconnecting different number from text',
        () => expectMarkupMismatch(<div>{2}</div>, <div>3</div>));
      it('should error reconnecting different text in code block',
        () => expectMarkupMismatch(<div>{"Text1"}</div>, <div>{"Text2"}</div>));
      it('should error reconnecting different text in two code blocks', () =>
        expectMarkupMismatch(<div>{"Text1"}{"Text2"}</div>, <div>{"Text1"}{"Text3"}</div>));
      it('should error reconnecting a div with text in code block and literal', () =>
        expectMarkupMismatch(<div>Text1{"Text2"}</div>, <div>Text1{"Text3"}</div>));
      it('should error reconnecting a div with text in code block and literal 2', () =>
        expectMarkupMismatch(<div>{"Text1"}Text2</div>, <div>{"Text1"}Text3</div>));

      // Markup Mismatches: children
      it('should error reconnecting missing children', () => expectMarkupMismatch(<div><div/></div>, <div/>));
      it('should error reconnecting added children', () => expectMarkupMismatch(<div/>, <div><div/></div>));
      it('should error reconnecting more children',
        () => expectMarkupMismatch(<div><div/></div>, <div><div/><div/></div>));
      it('should error reconnecting fewer children',
        () => expectMarkupMismatch(<div><div/><div/></div>, <div><div/></div>));
      it('should error reconnecting reordered children',
        () => expectMarkupMismatch(<div><div/><span/></div>, <div><span/><div/></div>));
      it('should error reconnecting a div with children separated by whitespace on the client',
          () => expectMarkupMismatch(
            <div id="parent"><div id="child1"/><div id="child2"/></div>,
            <div id="parent"><div id="child1"/>      <div id="child2"/></div>)); // eslint-disable-line no-multi-spaces
      it('should error reconnecting a div with children separated by different whitespace on the server',
        () => expectMarkupMismatch(
          <div id="parent"><div id="child1"/>      <div id="child2"/></div>, // eslint-disable-line no-multi-spaces
          <div id="parent"><div id="child1"/><div id="child2"/></div>));
      it('should error reconnecting a div with children separated by different whitespace',
          () => expectMarkupMismatch(
            <div id="parent"><div id="child1"/> <div id="child2"/></div>,
            <div id="parent"><div id="child1"/>      <div id="child2"/></div>)); // eslint-disable-line no-multi-spaces
      it('can distinguish an empty component from a dom node', () =>
        expectMarkupMismatch(<div><span/></div>, <div><EmptyComponent/></div>));
      it('can distinguish an empty component from an empty text component', () =>
        expectMarkupMismatch(<div><EmptyComponent/></div>, <div>{''}</div>));

      // Markup Mismatches: misc
      it('should error reconnecting a div with different dangerouslySetInnerHTML', () =>
        expectMarkupMismatch(
          <div dangerouslySetInnerHTML={{__html:"<span id='child1'/>"}}></div>,
          <div dangerouslySetInnerHTML={{__html:"<span id='child2'/>"}}></div>
        ));

      // Events after reconnecting
      itClientRenders('should have working events', render => {
        let clickCount = 0;
        return render(<div><button onClick={() => clickCount++}/></div>).then(e => {
          expect(clickCount).toBe(0);
          ReactTestUtils.Simulate.click(e.querySelector('button'));
          expect(clickCount).toBe(1);
        });
      });

      // DOM Updates after server rendering

      // returns a component that has a button and elementBeforeClick wrapped in a div
      // after the button is clicked, it should have the button and elementAfterClick.
      // these components are useful for testing client-side diffing.
      function getUpdatingComponent(elementBeforeClick, elementAfterClick) {
        return class extends React.Component {
          constructor() {
            super();
            this.state = {};
          }
          render() {
            return (
              <div>
                {this.state.clicked ? elementAfterClick : elementBeforeClick}
                <button onClick={() => this.setState({clicked: true})}/>
              </div>
            );
          }

        };
      }
      it('should be able to render and do a variety of diffing', () => {
        // an array of elements to render, each with a test function that validates whether
        // or not it was rendered correctly.
        const cases = [
          { element: <div title="Foo"/>, test: (e) => expect(e.title).toBe('Foo') },
          { element: <div title="Bar"/>, test: (e) => expect(e.title).toBe('Bar') },
          { element: <div style={{color: 'red'}}/>, test: (e) => expect(e.style.color).toBe('red') },
          { element: <div style={{color: 'white'}}/>, test: (e) => expect(e.style.color).toBe('white') },
          { element: <div/>, test: (e) => expect(e.style.color).toBe('') },
          { element: <div/>, test: (e) => expect(e.tagName.toLowerCase()).toBe('div') },
          { element: <span/>, test: (e) => expect(e.tagName.toLowerCase()).toBe('span') },
          { element: <div><span/></div>, test: (e) => expect(e.firstChild.tagName.toLowerCase()).toBe('span') },
          { element: <div><img/></div>, test: (e) => expect(e.firstChild.tagName.toLowerCase()).toBe('img') },
          { element: <div>Foo</div>, test: (e) => expect(e.textContent).toBe('Foo') },
          { element: <div>Bar</div>, test: (e) => expect(e.textContent).toBe('Bar') },
          { element: <div>{'Foo'}{'Bar'}</div>, test: (e) => expect(e.textContent).toBe('FooBar') },
          { element: <div>{'Too'}{'Asdf'}</div>, test: (e) => expect(e.textContent).toBe('TooAsdf') },
          { element: <div>{'Baz'}{'Bak'}{'Qux'}</div>, test: (e) => expect(e.textContent).toBe('BazBakQux') },
          { element: <div/>, test: (e) => expect(e.textContent).toBe('') },
          { element: <div>{null}</div>, test: (e) => expect(e.textContent).toBe('') },
          { element: <div>{null}{'OtherText'}</div>, test: (e) => expect(e.textContent).toBe('OtherText') },
        ];

        // test each element in the array as both the before and after element, and perform their
        // render tests when they are supposed to be rendered.
        cases.forEach((caseBefore) => {
          cases.forEach((caseAfter) => {
            const Component = getUpdatingComponent(caseBefore.element, caseAfter.element);
            const root = connectToServerRendering(<Component/>);
            caseBefore.test(root.firstChild.firstChild);
            ReactTestUtils.Simulate.click(root.querySelector('button'));
            caseAfter.test(root.firstChild.firstChild);
          });
        });
      });

      // refs
      it('should reconnect element with ref on server but not on client', () => {
        let refCount = 0;
        class RefsComponent extends React.Component {
          render() {
            return <div ref={(e) => refCount++}/>;
          }
        }
        expectMarkupMatch(<RefsComponent/>, <div/>);
        expect(refCount).toBe(0);
      });

      it('should reconnect element with ref on server but not on client', () => {
        let refCount = 0;
        class RefsComponent extends React.Component {
          render() {
            return <div ref={(e) => refCount++}/>;
          }
        }
        expectMarkupMatch(<div/>, <RefsComponent/>);
        expect(refCount).toBe(1);
      });

      it('should send the correct element to ref functions on client and not call them on server', () => {
        let refElement = null;
        class RefsComponent extends React.Component {
          render() {
            return <div ref={(e) => refElement=e}/>;
          }
        }
        expect(refElement).toBe(null);
        const serverRoot = renderOnServer(<RefsComponent/>);
        expect(refElement).toBe(null);
        const clientRoot = renderOnClient(<RefsComponent/>, serverRoot);
        expect(refElement).not.toBe(null);
        expect(refElement).toBe(clientRoot.firstChild);
      });

      it('should have string refs on client', () => {
        let refElement = null;
        class RefsComponent extends React.Component {
          render() {
            return <div ref="myDiv"/>;
          }
        }
        expect(refElement).toBe(null);
        const markup = ReactServerRendering.renderToString(<RefsComponent/>);
        const root = document.createElement('div');
        root.innerHTML = markup;
        const component = ReactDOM.render(<RefsComponent/>, root);
        expect(component.refs.myDiv).toBe(root.firstChild);
      });

    });

    it('should throw with silly args', function() {
      expect(
        ReactServerRendering.renderToString.bind(
          ReactServerRendering,
          'not a component'
        )
      ).toThrow(
        'renderToString(): You must pass a valid ReactElement.'
      );
    });
  });

  describe('renderToStaticMarkup', function() {
    it('should not put checksum and React ID on components', function() {
      var NestedComponent = React.createClass({
        render: function() {
          return <div>inner text</div>;
        },
      });

      var TestComponent = React.createClass({
        render: function() {
          return <span><NestedComponent /></span>;
        },
      });

      var response = ReactServerRendering.renderToStaticMarkup(
        <TestComponent />
      );

      expect(response).toBe('<span><div>inner text</div></span>');
    });

    it('should not put checksum and React ID on text components', function() {
      var TestComponent = React.createClass({
        render: function() {
          return <span>{'hello'} {'world'}</span>;
        },
      });

      var response = ReactServerRendering.renderToStaticMarkup(
        <TestComponent />
      );

      expect(response).toBe('<span>hello world</span>');
    });

    it('should not register event listeners', function() {
      var EventPluginHub = require('EventPluginHub');
      var cb = jest.fn();

      ReactServerRendering.renderToString(
        <span onClick={cb}>hello world</span>
      );
      expect(EventPluginHub.__getListenerBank()).toEqual({});
    });

    it('should only execute certain lifecycle methods', function() {
      function runTest() {
        var lifecycle = [];
        var TestComponent = React.createClass({
          componentWillMount: function() {
            lifecycle.push('componentWillMount');
          },
          componentDidMount: function() {
            lifecycle.push('componentDidMount');
          },
          getInitialState: function() {
            lifecycle.push('getInitialState');
            return {name: 'TestComponent'};
          },
          render: function() {
            lifecycle.push('render');
            return <span>Component name: {this.state.name}</span>;
          },
          componentWillUpdate: function() {
            lifecycle.push('componentWillUpdate');
          },
          componentDidUpdate: function() {
            lifecycle.push('componentDidUpdate');
          },
          shouldComponentUpdate: function() {
            lifecycle.push('shouldComponentUpdate');
          },
          componentWillReceiveProps: function() {
            lifecycle.push('componentWillReceiveProps');
          },
          componentWillUnmount: function() {
            lifecycle.push('componentWillUnmount');
          },
        });

        var response = ReactServerRendering.renderToStaticMarkup(
          <TestComponent />
        );

        expect(response).toBe('<span>Component name: TestComponent</span>');
        expect(lifecycle).toEqual(
          ['getInitialState', 'componentWillMount', 'render']
        );
      }

      runTest();

      // This should work the same regardless of whether you can use DOM or not.
      ExecutionEnvironment.canUseDOM = true;
      runTest();
    });

    it('should throw with silly args', function() {
      expect(
        ReactServerRendering.renderToStaticMarkup.bind(
          ReactServerRendering,
          'not a component'
        )
      ).toThrow(
        'renderToStaticMarkup(): You must pass a valid ReactElement.'
      );
    });

    it('allows setState in componentWillMount without using DOM', function() {
      var Component = React.createClass({
        componentWillMount: function() {
          this.setState({text: 'hello, world'});
        },
        render: function() {
          return <div>{this.state.text}</div>;
        },
      });

      ReactReconcileTransaction.prototype.perform = function() {
        // We shouldn't ever be calling this on the server
        throw new Error('Browser reconcile transaction should not be used');
      };
      var markup = ReactServerRendering.renderToString(
        <Component />
      );
      expect(markup.indexOf('hello, world') >= 0).toBe(true);
    });
  });
});
