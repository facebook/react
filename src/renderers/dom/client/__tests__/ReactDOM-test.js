/**
 * Copyright 2013-2015, Facebook, Inc.
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
var ReactTestUtils = require('ReactTestUtils');
var div = React.createFactory('div');

describe('ReactDOM', function() {
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
        form = React.findDOMNode(this);
      }
    });
    var instance = ReactTestUtils.renderIntoDocument(<Parent />);
    form.submit();
    expect(count).toEqual(1);
  });
  */

  it('allows a DOM element to be used with a string', function() {
    var element = React.createElement('div', {className: 'foo'});
    var instance = ReactTestUtils.renderIntoDocument(element);
    expect(React.findDOMNode(instance).tagName).toBe('DIV');
  });

  it('should allow children to be passed as an argument', function() {
    var argDiv = ReactTestUtils.renderIntoDocument(
      div(null, 'child')
    );
    var argNode = React.findDOMNode(argDiv);
    expect(argNode.innerHTML).toBe('child');
  });

  it('should overwrite props.children with children argument', function() {
    var conflictDiv = ReactTestUtils.renderIntoDocument(
      div({children: 'fakechild'}, 'child')
    );
    var conflictNode = React.findDOMNode(conflictDiv);
    expect(conflictNode.innerHTML).toBe('child');
  });

  /**
   * We need to make sure that updates occur to the actual node that's in the
   * DOM, instead of a stale cache.
   */
  it('should purge the DOM cache when removing nodes', function() {
    var myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theDog" className="dog" />,
        <div key="theBird" className="bird" />
      </div>
    );
    // Warm the cache with theDog
    myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theDog" className="dogbeforedelete" />,
        <div key="theBird" className="bird" />,
      </div>
    );
    // Remove theDog - this should purge the cache
    myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theBird" className="bird" />,
      </div>
    );
    // Now, put theDog back. It's now a different DOM node.
    myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theDog" className="dog" />,
        <div key="theBird" className="bird" />,
      </div>
    );
    // Change the className of theDog. It will use the same element
    myDiv = ReactTestUtils.renderIntoDocument(
      <div>
        <div key="theDog" className="bigdog" />,
        <div key="theBird" className="bird" />,
      </div>
    );
    var root = React.findDOMNode(myDiv);
    var dog = root.childNodes[0];
    expect(dog.className).toBe('bigdog');
  });

  it('allow React.DOM factories to be called without warnings', function() {
    spyOn(console, 'error');
    var element = React.DOM.div();
    expect(element.type).toBe('div');
    expect(console.error.argsForCall.length).toBe(0);
  });

});
