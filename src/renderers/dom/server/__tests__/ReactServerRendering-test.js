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
      expect(console.error.calls.count()).toBe(1);
      expect(element.innerHTML.length > 0).toBe(true);
      expect(element.innerHTML).not.toEqual(lastMarkup);

      // Ensure the events system works after markup mismatch.
      expect(numClicks).toEqual(1);
      ReactTestUtils.Simulate.click(ReactDOM.findDOMNode(instance.refs.span));
      expect(numClicks).toEqual(2);
    });

    it('should throw with silly args', function() {
      expect(
        ReactServerRendering.renderToString.bind(
          ReactServerRendering,
          'not a component'
        )
      ).toThrowError(
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
      ).toThrowError(
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

  it('warns with a no-op when an async setState is triggered', function() {
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
      ' This is a no-op. Please check the code for the Foo component.'
    );
    var markup = ReactServerRendering.renderToStaticMarkup(<Foo />);
    expect(markup).toBe('<div>hello</div>');
  });

  it('warns with a no-op when an async replaceState is triggered', function() {
    var Bar = React.createClass({
      componentWillMount: function() {
        this.replaceState({text: 'hello'});
        setTimeout(() => {
          this.replaceState({text: 'error'});
        });
      },
      render: function() {
        return <div onClick={() => {}}>{this.state.text}</div>;
      },
    });

    spyOn(console, 'error');
    ReactServerRendering.renderToString(<Bar />);
    jest.runOnlyPendingTimers();
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.mostRecent().args[0]).toBe(
      'Warning: replaceState(...): Can only update a mounting component. ' +
      'This usually means you called replaceState() outside componentWillMount() on the server. ' +
      'This is a no-op. Please check the code for the Bar component.'
    );
    var markup = ReactServerRendering.renderToStaticMarkup(<Bar />);
    expect(markup).toBe('<div>hello</div>');
  });

  it('warns with a no-op when an async forceUpdate is triggered', function() {
    var Baz = React.createClass({
      componentWillMount: function() {
        this.forceUpdate();
        setTimeout(() => {
          this.forceUpdate();
        });
      },
      render: function() {
        return <div onClick={() => {}}></div>;
      },
    });

    spyOn(console, 'error');
    ReactServerRendering.renderToString(<Baz />);
    jest.runOnlyPendingTimers();
    expect(console.error.calls.count()).toBe(1);
    expect(console.error.calls.mostRecent().args[0]).toBe(
      'Warning: forceUpdate(...): Can only update a mounting component. ' +
      'This usually means you called forceUpdate() outside componentWillMount() on the server. ' +
      'This is a no-op. Please check the code for the Baz component.'
    );
    var markup = ReactServerRendering.renderToStaticMarkup(<Baz />);
    expect(markup).toBe('<div></div>');
  });
});
