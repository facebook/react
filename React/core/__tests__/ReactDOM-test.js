/**
 * Copyright 2013 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var React = require("../../React");
var ReactDOM = require("../../ReactDOM");
var ReactTestUtils = require("../../ReactTestUtils");
var React = require("../../React");

describe('ref swapping', function() {
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
      componentDidMount: function(node) {
        form = node;
      }
    });
    var instance = ReactTestUtils.renderIntoDocument(<Parent />);
    form.submit();
    expect(count).toEqual(1);
  });
  */

  it("should allow children to be passed as an argument", function() {
    var argDiv = ReactTestUtils.renderIntoDocument(
      ReactDOM.div(null, 'child')
    );
    var argNode = document.getElementById(argDiv._rootNodeID);
    expect(argNode.innerHTML).toBe('child');
  });

  it("should overwrite props.children with children argument", function() {
    var conflictDiv = ReactTestUtils.renderIntoDocument(
      ReactDOM.div({children: 'fakechild'}, 'child')
    );
    var conflictNode = document.getElementById(conflictDiv._rootNodeID);
    expect(conflictNode.innerHTML).toBe('child');
  });

  /**
   * We need to make sure that updates occur to the actual node that's in the
   * DOM, instead of a stale cache.
   */
  it("should purge the DOM cache when removing nodes", function() {
    var myDiv = ReactTestUtils.renderIntoDocument(
      React.DOM.div(null, {
        theDog: React.DOM.div( {className:"dog"}, null ),
        theBird: React.DOM.div( {className:"bird"}, null )
      })
    );
    myDiv.setProps({
      children: {
        theDog: React.DOM.div( {className:"dogbeforedelete"}, null ),  // Warm the cache with theDog
        theBird: React.DOM.div( {className:"bird"}, null )
      }
    });
    myDiv.setProps({
      children: {                                 // This better purge that cache
        theBird: React.DOM.div( {className:"bird"}, null )
      }
    });
    // Now, put the dog back.
    myDiv.setProps({
      children: {
        theDog: React.DOM.div( {className:"dog"}, null ),       // This is a different node than before
        theBird: React.DOM.div( {className:"bird"}, null )
      }
    });
    myDiv.setProps({
      children: {                          // className changed to bigdog.
        theDog: React.DOM.div( {className:"bigdog"}, null ),    // but will it use the proper element
        theBird: React.DOM.div( {className:"bird"}, null )
      }
    });
    var root = document.getElementById(myDiv._rootNodeID);
    var dog = root.childNodes[0];
    expect(dog.className).toBe('bigdog');
  });
});
