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

describe('ReactServerRendering', () => {
  beforeEach(() => {
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

  describe('renderToString', () => {
    it('should generate simple markup', () => {
      var response = ReactServerRendering.renderToString(
        <span>hello world</span>,
      );
      expect(response).toMatch(
        new RegExp(
          '<span ' +
            ROOT_ATTRIBUTE_NAME +
            '="" ' +
            ID_ATTRIBUTE_NAME +
            '="[^"]+" ' +
            ReactMarkupChecksum.CHECKSUM_ATTR_NAME +
            '="[^"]+">hello world</span>',
        ),
      );
    });

    it('should generate simple markup for self-closing tags', () => {
      var response = ReactServerRendering.renderToString(<img />);
      expect(response).toMatch(
        new RegExp(
          '<img ' +
            ROOT_ATTRIBUTE_NAME +
            '="" ' +
            ID_ATTRIBUTE_NAME +
            '="[^"]+" ' +
            ReactMarkupChecksum.CHECKSUM_ATTR_NAME +
            '="[^"]+"/>',
        ),
      );
    });

    it('should generate simple markup for attribute with `>` symbol', () => {
      var response = ReactServerRendering.renderToString(<img data-attr=">" />);
      expect(response).toMatch(
        new RegExp(
          '<img data-attr="&gt;" ' +
            ROOT_ATTRIBUTE_NAME +
            '="" ' +
            ID_ATTRIBUTE_NAME +
            '="[^"]+" ' +
            ReactMarkupChecksum.CHECKSUM_ATTR_NAME +
            '="[^"]+"/>',
        ),
      );
    });

    it('should generate comment markup for component returns null', () => {
      class NullComponent extends React.Component {
        render() {
          return null;
        }
      }

      var response = ReactServerRendering.renderToString(<NullComponent />);
      expect(response).toBe('<!-- react-empty: 1 -->');
    });

    it('should not register event listeners', () => {
      var EventPluginHub = require('EventPluginHub');
      var cb = jest.fn();

      ReactServerRendering.renderToString(
        <span onClick={cb}>hello world</span>,
      );
      expect(EventPluginHub.__getListenerBank()).toEqual({});
    });

    it('should render composite components', () => {
      class Parent extends React.Component {
        render() {
          return <div><Child name="child" /></div>;
        }
      }

      class Child extends React.Component {
        render() {
          return <span>My name is {this.props.name}</span>;
        }
      }

      var response = ReactServerRendering.renderToString(<Parent />);
      expect(response).toMatch(
        new RegExp(
          '<div ' +
            ROOT_ATTRIBUTE_NAME +
            '="" ' +
            ID_ATTRIBUTE_NAME +
            '="[^"]+" ' +
            ReactMarkupChecksum.CHECKSUM_ATTR_NAME +
            '="[^"]+">' +
            '<span ' +
            ID_ATTRIBUTE_NAME +
            '="[^"]+">' +
            '<!-- react-text: [0-9]+ -->My name is <!-- /react-text -->' +
            '<!-- react-text: [0-9]+ -->child<!-- /react-text -->' +
            '</span>' +
            '</div>',
        ),
      );
    });

    it('should only execute certain lifecycle methods', () => {
      function runTest() {
        var lifecycle = [];

        class TestComponent extends React.Component {
          constructor(props) {
            super(props);
            lifecycle.push('getInitialState');
            this.state = {name: 'TestComponent'};
          }

          componentWillMount() {
            lifecycle.push('componentWillMount');
          }

          componentDidMount() {
            lifecycle.push('componentDidMount');
          }

          render() {
            lifecycle.push('render');
            return <span>Component name: {this.state.name}</span>;
          }

          componentWillUpdate() {
            lifecycle.push('componentWillUpdate');
          }

          componentDidUpdate() {
            lifecycle.push('componentDidUpdate');
          }

          shouldComponentUpdate() {
            lifecycle.push('shouldComponentUpdate');
          }

          componentWillReceiveProps() {
            lifecycle.push('componentWillReceiveProps');
          }

          componentWillUnmount() {
            lifecycle.push('componentWillUnmount');
          }
        }

        var response = ReactServerRendering.renderToString(<TestComponent />);

        expect(response).toMatch(
          new RegExp(
            '<span ' +
              ROOT_ATTRIBUTE_NAME +
              '="" ' +
              ID_ATTRIBUTE_NAME +
              '="[^"]+" ' +
              ReactMarkupChecksum.CHECKSUM_ATTR_NAME +
              '="[^"]+">' +
              '<!-- react-text: [0-9]+ -->Component name: <!-- /react-text -->' +
              '<!-- react-text: [0-9]+ -->TestComponent<!-- /react-text -->' +
              '</span>',
          ),
        );
        expect(lifecycle).toEqual([
          'getInitialState',
          'componentWillMount',
          'render',
        ]);
      }

      runTest();

      // This should work the same regardless of whether you can use DOM or not.
      ExecutionEnvironment.canUseDOM = true;
      runTest();
    });

    it('should have the correct mounting behavior', () => {
      // This test is testing client-side behavior.
      ExecutionEnvironment.canUseDOM = true;

      var mountCount = 0;
      var numClicks = 0;

      class TestComponent extends React.Component {
        componentDidMount() {
          mountCount++;
        }

        click = () => {
          numClicks++;
        };

        render() {
          return (
            <span ref="span" onClick={this.click}>Name: {this.props.name}</span>
          );
        }
      }

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
        <TestComponent name="x" />,
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
      expect(console.error.calls.count()).toBe(1);
      expect(element.innerHTML.length > 0).toBe(true);
      expect(element.innerHTML).not.toEqual(lastMarkup);

      // Ensure the events system works after markup mismatch.
      expect(numClicks).toEqual(1);
      ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(instance.refs.span));
      expect(numClicks).toEqual(2);
    });

    it('should throw with silly args', () => {
      expect(
        ReactServerRendering.renderToString.bind(
          ReactServerRendering,
          'not a component',
        ),
      ).toThrowError('renderToString(): You must pass a valid ReactElement.');
    });
  });

  describe('renderToStaticMarkup', () => {
    it('should not put checksum and React ID on components', () => {
      class NestedComponent extends React.Component {
        render() {
          return <div>inner text</div>;
        }
      }

      class TestComponent extends React.Component {
        render() {
          return <span><NestedComponent /></span>;
        }
      }

      var response = ReactServerRendering.renderToStaticMarkup(
        <TestComponent />,
      );

      expect(response).toBe('<span><div>inner text</div></span>');
    });

    it('should not put checksum and React ID on text components', () => {
      class TestComponent extends React.Component {
        render() {
          return <span>{'hello'} {'world'}</span>;
        }
      }

      var response = ReactServerRendering.renderToStaticMarkup(
        <TestComponent />,
      );

      expect(response).toBe('<span>hello world</span>');
    });

    it('should not register event listeners', () => {
      var EventPluginHub = require('EventPluginHub');
      var cb = jest.fn();

      ReactServerRendering.renderToStaticMarkup(
        <span onClick={cb}>hello world</span>,
      );
      expect(EventPluginHub.__getListenerBank()).toEqual({});
    });

    it('should only execute certain lifecycle methods', () => {
      function runTest() {
        var lifecycle = [];

        class TestComponent extends React.Component {
          constructor(props) {
            super(props);
            lifecycle.push('getInitialState');
            this.state = {name: 'TestComponent'};
          }

          componentWillMount() {
            lifecycle.push('componentWillMount');
          }

          componentDidMount() {
            lifecycle.push('componentDidMount');
          }

          render() {
            lifecycle.push('render');
            return <span>Component name: {this.state.name}</span>;
          }

          componentWillUpdate() {
            lifecycle.push('componentWillUpdate');
          }

          componentDidUpdate() {
            lifecycle.push('componentDidUpdate');
          }

          shouldComponentUpdate() {
            lifecycle.push('shouldComponentUpdate');
          }

          componentWillReceiveProps() {
            lifecycle.push('componentWillReceiveProps');
          }

          componentWillUnmount() {
            lifecycle.push('componentWillUnmount');
          }
        }

        var response = ReactServerRendering.renderToStaticMarkup(
          <TestComponent />,
        );

        expect(response).toBe('<span>Component name: TestComponent</span>');
        expect(lifecycle).toEqual([
          'getInitialState',
          'componentWillMount',
          'render',
        ]);
      }

      runTest();

      // This should work the same regardless of whether you can use DOM or not.
      ExecutionEnvironment.canUseDOM = true;
      runTest();
    });

    it('should throw with silly args', () => {
      expect(
        ReactServerRendering.renderToStaticMarkup.bind(
          ReactServerRendering,
          'not a component',
        ),
      ).toThrowError(
        'renderToStaticMarkup(): You must pass a valid ReactElement.',
      );
    });

    it('allows setState in componentWillMount without using DOM', () => {
      class Component extends React.Component {
        componentWillMount() {
          this.setState({text: 'hello, world'});
        }

        render() {
          return <div>{this.state.text}</div>;
        }
      }

      ReactReconcileTransaction.prototype.perform = function() {
        // We shouldn't ever be calling this on the server
        throw new Error('Browser reconcile transaction should not be used');
      };
      var markup = ReactServerRendering.renderToString(<Component />);
      expect(markup.indexOf('hello, world') >= 0).toBe(true);
    });

    it('renders components with different batching strategies', () => {
      class StaticComponent extends React.Component {
        render() {
          const staticContent = ReactServerRendering.renderToStaticMarkup(
            <div>
              <img src="foo-bar.jpg" />
            </div>,
          );
          return <div dangerouslySetInnerHTML={{__html: staticContent}} />;
        }
      }

      class Component extends React.Component {
        componentWillMount() {
          this.setState({text: 'hello, world'});
        }

        render() {
          return <div>{this.state.text}</div>;
        }
      }

      expect(
        ReactServerRendering.renderToString.bind(
          ReactServerRendering,
          <div>
            <StaticComponent />
            <Component />
          </div>,
        ),
      ).not.toThrow();
    });
  });

  it('warns with a no-op when an async setState is triggered', () => {
    class Foo extends React.Component {
      componentWillMount() {
        this.setState({text: 'hello'});
        setTimeout(() => {
          this.setState({text: 'error'});
        });
      }
      render() {
        return <div onClick={() => {}}>{this.state.text}</div>;
      }
    }

    spyOn(console, 'error');
    ReactServerRendering.renderToString(<Foo />);
    jest.runOnlyPendingTimers();
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.mostRecent().args[0]).toBe(
      'Warning: setState(...): Can only update a mounting component.' +
        ' This usually means you called setState() outside componentWillMount() on the server.' +
        ' This is a no-op. Please check the code for the Foo component.',
    );
    var markup = ReactServerRendering.renderToStaticMarkup(<Foo />);
    expect(markup).toBe('<div>hello</div>');
  });

  it('warns with a no-op when an async forceUpdate is triggered', () => {
    class Baz extends React.Component {
      componentWillMount() {
        this.forceUpdate();
        setTimeout(() => {
          this.forceUpdate();
        });
      }

      render() {
        return <div onClick={() => {}} />;
      }
    }

    spyOn(console, 'error');
    ReactServerRendering.renderToString(<Baz />);
    jest.runOnlyPendingTimers();
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.mostRecent().args[0]).toBe(
      'Warning: forceUpdate(...): Can only update a mounting component. ' +
        'This usually means you called forceUpdate() outside componentWillMount() on the server. ' +
        'This is a no-op. Please check the code for the Baz component.',
    );
    var markup = ReactServerRendering.renderToStaticMarkup(<Baz />);
    expect(markup).toBe('<div></div>');
  });

  it('should warn when children are mutated during render', () => {
    spyOn(console, 'error');
    function Wrapper(props) {
      props.children[1] = <p key={1} />; // Mutation is illegal
      return <div>{props.children}</div>;
    }
    expect(() => {
      ReactServerRendering.renderToStaticMarkup(
        <Wrapper>
          <span key={0} />
          <span key={1} />
          <span key={2} />
        </Wrapper>,
      );
    }).toThrowError(/Cannot assign to read only property.*/);
  });
});
