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

// Renders text using SSR and then stuffs it into a DOM node, which is returned.
// Does not perform client-side reconnect.
function renderOnServer(reactElement) {
  const markup = ReactServerRendering.renderToString(
		reactElement
	);

  var domElement = document.createElement('div');
  domElement.innerHTML = markup;
  return domElement;
}

function renderOnClient(reactElement, domElement, shouldMatch = true) {
  // we don't use spyOn(console, 'error') here because we want to be able to call this
  // function multiple times, and spyOn throws an error if you give it a function that is
  // already being spied upon.
  var oldConsoleError = console.error;
  console.error = jasmine.createSpy();
  ReactDOM.render(reactElement, domElement);
  if (shouldMatch && console.error.argsForCall.length !== 0) {
    // in Jasmine >= 2.3, we would just use fail() here.
    console.log(`An unexpected error was logged during markup reconnection: '${console.error.argsForCall[0][0]}'`);
    expect(`${console.error.argsForCall.length} errors logged.`).toBe('No errors logged.');
  } else if (!shouldMatch && console.error.argsForCall.length === 0) {
    console.log('Expected an error during reconnection but no error was logged.');
    expect(`${console.error.argsForCall.length} errors logged.`).toBe('1 error logged.');
  }
  console.error = oldConsoleError;
  return domElement;
}
// renders the first element with renderToString, puts it into a DOM node,
// runs React.render on that DOM node with the second element. returns the DOM
// node.
function connectToServerRendering(
  elementToRenderOnServer,
  elementToRenderOnClient = elementToRenderOnServer,
  shouldMatch = true
) {
  return renderOnClient(
    elementToRenderOnClient,
    renderOnServer(elementToRenderOnServer),
    shouldMatch);
}

function expectMarkupMismatch(elementToRenderOnServer, elementToRenderOnClient = elementToRenderOnServer) {
  return connectToServerRendering(elementToRenderOnServer, elementToRenderOnClient, false);
}

function expectMarkupMatch(elementToRenderOnServer, elementToRenderOnClient = elementToRenderOnServer) {
  return connectToServerRendering(elementToRenderOnServer, elementToRenderOnClient, true);
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
      var cb = jest.genMockFn();

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

      ReactDOM.render(<TestComponent name="x" />, element);
      expect(mountCount).toEqual(3);
      expect(element.innerHTML).toBe(lastMarkup);
      ReactDOM.unmountComponentAtNode(element);
      expect(element.innerHTML).toEqual('');

      // Now simulate a situation where the app is not idempotent. React should
      // warn but do the right thing.
      element.innerHTML = lastMarkup;
      spyOn(console, 'error');
      var instance = ReactDOM.render(<TestComponent name="y" />, element);
      expect(mountCount).toEqual(4);
      expect(console.error.argsForCall.length).toBe(1);
      expect(element.innerHTML.length > 0).toBe(true);
      expect(element.innerHTML).not.toEqual(lastMarkup);

      // Ensure the events system works
      expect(numClicks).toEqual(0);
      ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(instance.refs.span));
      expect(numClicks).toEqual(1);
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
      it('should reconnect a blank div', () => expectMarkupMatch(<div/>));
      it('should reconnect a div with an attribute', () => expectMarkupMatch(<div width="30"/>));
      it('should reconnect a div with a boolean attribute', () => expectMarkupMatch(<div disabled={true}/>));
      it('should reconnect a div with attributes in different order', () =>
        expectMarkupMatch(<div width="30" height="40"/>, <div height="40" width="30"/>));
      it('should reconnect a div with an class', () => expectMarkupMatch(<div className="myClass"/>));
      it('should reconnect a div with inline styles',
        () => expectMarkupMatch(<div style={{color:'red', width:'30px'}}/>));
      it('should reconnect a self-closing tag', () => expectMarkupMatch(<br/>));
      it('should reconnect a self-closing tag as a child', () => expectMarkupMatch(<div><br/></div>));

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
      it('should reconnect single child hierarchies of components', () => {
        const Component = (props) => <div>{props.children}</div>;
        expectMarkupMatch(
          <Component>
            <Component>
              <Component>
                <Component/>
              </Component>
            </Component>
          </Component>);
      });
      it('should reconnect multi-child hierarchies of components', () => {
        const Component = (props) => <div>{props.children}</div>;
        expectMarkupMatch(
          <Component>
            <Component>
              <Component/><Component/>
            </Component>
            <Component>
              <Component/><Component/>
            </Component>
          </Component>);
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
      it('should reconnect a newline-eating tag with content not starting with \\n',
        () => {
          const root = expectMarkupMatch(<pre>Hello</pre>);
          expect(root.textContent).toBe('Hello');
        });
      it('should reconnect a newline-eating tag with content not starting with \\n',
        () => {
          const root = expectMarkupMatch(<pre>{"\nHello"}</pre>);
          expect(root.textContent).toBe('\nHello');
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
      it('should have working events after reconnecting markup', () => {
        let clickCount = 0;
        const root = expectMarkupMatch(<div><button onClick={() => clickCount++}/></div>);
        expect(clickCount).toBe(0);
        ReactTestUtils.Simulate.click(root.querySelector('button'));
        expect(clickCount).toBe(1);
      });

      it('should have working events after a markup mismatch', () => {
        let clickCount = 0;
        const root = expectMarkupMismatch(<div>Mismatch</div>, <div><button onClick={() => clickCount++}/></div>);
        expect(clickCount).toBe(0);
        ReactTestUtils.Simulate.click(root.querySelector('button'));
        expect(clickCount).toBe(1);
      });

      it('should have not have an event if the event was only on server', () => {
        let clickCount = 0;
        const root = expectMarkupMatch(<div><button onClick={() => clickCount++}/></div>, <div><button/></div>);
        expect(clickCount).toBe(0);
        ReactTestUtils.Simulate.click(root.querySelector('button'));
        expect(clickCount).toBe(0); // note this is 0, click should NOT fire.
      });

      it('should have have an event if the event was only on client', () => {
        let clickCount = 0;
        const root = expectMarkupMatch(<div><button/></div>, <div><button onClick={() => clickCount++}/></div>);
        expect(clickCount).toBe(0);
        ReactTestUtils.Simulate.click(root.querySelector('button'));
        expect(clickCount).toBe(1);
      });

      // Controlled inputs
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

      const testControlledField = (initialValue, changedValue, TagName = 'input',
        valueKey = 'value', extraProps = {}, children = null) => {

        let changeCount = 0;
        const ControlledField = getControlledFieldClass(
          initialValue, () => changeCount++, TagName, valueKey, extraProps, children
        );

        let field = connectToServerRendering(<ControlledField/>).firstChild;

        expect(changeCount).toBe(0);
        expect(field[valueKey]).toBe(initialValue);

        // simulate a user typing.
        field[valueKey] = changedValue;
        ReactTestUtils.Simulate.change(field);

        expect(changeCount).toBe(1);
        expect(field[valueKey]).toBe(changedValue);
      };

      it('should render a controlled text input',
        () => testControlledField('Hello', 'Goodbye'));

      it('should render a controlled textarea',
        () => testControlledField('Hello', 'Goodbye', 'textarea'));

      it('should render a controlled checkbox',
        () => testControlledField(true, false, 'input', 'checked', {type:'checkbox'}));

      it('should render a controlled select',
      () => testControlledField('B', 'A', 'select', 'value', {},
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
      var cb = jest.genMockFn();

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
