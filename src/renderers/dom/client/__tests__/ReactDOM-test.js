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

var React = require('React');
var ReactDOM = require('ReactDOM');
var ReactTestUtils = require('ReactTestUtils');
var div = React.createFactory('div');

describe('ReactDOM', () => {
  // TODO: uncomment this test once we can run in phantom, which
  // supports real submit events.
  /*
  it('should bubble onSubmit', function() {
    var count = 0;
    var form;
    var Parent = React.createClass({
      handleSubmit: function() {
        count++;
        return false;
      },
      render: function() {
        return <Child />;
      }
    });
    var Child = React.createClass({
      render: function() {
        return <form><input type="submit" value="Submit" /></form>;
      },
      componentDidMount: function() {
        form = ReactDOM.findDOMNode(this);
      }
    });
    var instance = ReactTestUtils.renderIntoDocument(<Parent />);
    form.submit();
    expect(count).toEqual(1);
  });
  */

  it('allows a DOM element to be used with a string', () => {
    var element = React.createElement('div', {className: 'foo'});
    var instance = ReactTestUtils.renderIntoDocument(element);
    expect(ReactDOM.findDOMNode(instance).tagName).toBe('DIV');
  });

  it('should allow children to be passed as an argument', () => {
    var argDiv = ReactTestUtils.renderIntoDocument(div(null, 'child'));
    var argNode = ReactDOM.findDOMNode(argDiv);
    expect(argNode.innerHTML).toBe('child');
  });

  it('should overwrite props.children with children argument', () => {
    var conflictDiv = ReactTestUtils.renderIntoDocument(
      div({children: 'fakechild'}, 'child'),
    );
    var conflictNode = ReactDOM.findDOMNode(conflictDiv);
    expect(conflictNode.innerHTML).toBe('child');
  });

  /**
   * We need to make sure that updates occur to the actual node that's in the
   * DOM, instead of a stale cache.
   */
  it('should purge the DOM cache when removing nodes', () => {
    var myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theDog" className="dog" />,
        <div key="theBird" className="bird" />
      </div>,
    );
    // Warm the cache with theDog
    myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theDog" className="dogbeforedelete" />,
        <div key="theBird" className="bird" />,
      </div>,
    );
    // Remove theDog - this should purge the cache
    myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theBird" className="bird" />,
      </div>,
    );
    // Now, put theDog back. It's now a different DOM node.
    myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theDog" className="dog" />,
        <div key="theBird" className="bird" />,
      </div>,
    );
    // Change the className of theDog. It will use the same element
    myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theDog" className="bigdog" />,
        <div key="theBird" className="bird" />,
      </div>,
    );
    var root = ReactDOM.findDOMNode(myDiv);
    var dog = root.childNodes[0];
    expect(dog.className).toBe('bigdog');
  });

  it('allow React.DOM factories to be called without warnings', () => {
    spyOn(console, 'error');
    var element = React.DOM.div();
    expect(element.type).toBe('div');
    expect(console.error.calls.count()).toBe(0);
  });

  it('throws in render() if the mount callback is not a function', () => {
    function Foo() {
      this.a = 1;
      this.b = 2;
    }

    class A extends React.Component {
      state = {};

      render() {
        return <div />;
      }
    }

    var myDiv = document.createElement('div');
    expect(() => ReactDOM.render(<A />, myDiv, 'no')).toThrowError(
      'ReactDOM.render(...): Expected the last optional `callback` argument ' +
        'to be a function. Instead received: string.',
    );
    expect(() => ReactDOM.render(<A />, myDiv, {})).toThrowError(
      'ReactDOM.render(...): Expected the last optional `callback` argument ' +
        'to be a function. Instead received: Object.',
    );
    expect(() => ReactDOM.render(<A />, myDiv, new Foo())).toThrowError(
      'ReactDOM.render(...): Expected the last optional `callback` argument ' +
        'to be a function. Instead received: Foo (keys: a, b).',
    );
  });

  it('throws in render() if the update callback is not a function', () => {
    function Foo() {
      this.a = 1;
      this.b = 2;
    }

    class A extends React.Component {
      state = {};

      render() {
        return <div />;
      }
    }

    var myDiv = document.createElement('div');
    ReactDOM.render(<A />, myDiv);

    expect(() => ReactDOM.render(<A />, myDiv, 'no')).toThrowError(
      'ReactDOM.render(...): Expected the last optional `callback` argument ' +
        'to be a function. Instead received: string.',
    );
    expect(() => ReactDOM.render(<A />, myDiv, {})).toThrowError(
      'ReactDOM.render(...): Expected the last optional `callback` argument ' +
        'to be a function. Instead received: Object.',
    );
    expect(() => ReactDOM.render(<A />, myDiv, new Foo())).toThrowError(
      'ReactDOM.render(...): Expected the last optional `callback` argument ' +
        'to be a function. Instead received: Foo (keys: a, b).',
    );
  });
});
