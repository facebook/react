/**
 * Copyright 2013-2014, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails react-core
 */

/*jslint evil: true */

"use strict";

var React = require('React');
var ReactDOM = require('ReactDOM');
var ReactMount = require('ReactMount');
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
        form = this.getDOMNode();
      }
    });
    var instance = ReactTestUtils.renderIntoDocument(<Parent />);
    form.submit();
    expect(count).toEqual(1);
  });
  */

  it("should allow children to be passed as an argument", function() {
    var argDiv = ReactTestUtils.renderIntoDocument(
      div(null, 'child')
    );
    var argNode = ReactMount.getNode(argDiv._rootNodeID);
    expect(argNode.innerHTML).toBe('child');
  });

  it("should overwrite props.children with children argument", function() {
    var conflictDiv = ReactTestUtils.renderIntoDocument(
      div({children: 'fakechild'}, 'child')
    );
    var conflictNode = ReactMount.getNode(conflictDiv._rootNodeID);
    expect(conflictNode.innerHTML).toBe('child');
  });

  /**
   * We need to make sure that updates occur to the actual node that's in the
   * DOM, instead of a stale cache.
   */
  it("should purge the DOM cache when removing nodes", function() {
    var myDiv = ReactTestUtils.renderIntoDocument(
      <div>{{
        theDog: <div className="dog" />,
        theBird: <div className="bird" />
      }}</div>
    );
    // Warm the cache with theDog
    myDiv.setProps({
      children: {
        theDog: <div className="dogbeforedelete" />,
        theBird: <div className="bird" />
      }
    });
    // Remove theDog - this should purge the cache
    myDiv.setProps({
      children: {
        theBird: <div className="bird" />
      }
    });
    // Now, put theDog back. It's now a different DOM node.
    myDiv.setProps({
      children: {
        theDog: <div className="dog" />,
        theBird: <div className="bird" />
      }
    });
    // Change the className of theDog. It will use the same element
    myDiv.setProps({
      children: {
        theDog: <div className="bigdog" />,
        theBird: <div className="bird" />
      }
    });
    var root = ReactMount.getNode(myDiv._rootNodeID);
    var dog = root.childNodes[0];
    expect(dog.className).toBe('bigdog');
  });

  it('allow React.DOM factories to be called without warnings', function() {
    spyOn(console, 'warn');
    var element = React.DOM.div();
    expect(element.type).toBe('div');
    expect(console.warn.argsForCall.length).toBe(0);
  });

  it('warns but allow dom factories to be used in createFactory', function() {
    spyOn(console, 'warn');
    var factory = React.createFactory(React.DOM.div);
    expect(factory().type).toBe('div');
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Do not pass React.DOM.div'
    );
  });

  it('warns but allow dom factories to be used in createElement', function() {
    spyOn(console, 'warn');
    var element = React.createElement(React.DOM.div);
    expect(element.type).toBe('div');
    expect(console.warn.argsForCall.length).toBe(1);
    expect(console.warn.argsForCall[0][0]).toContain(
      'Do not pass React.DOM.div'
    );
  });
});
