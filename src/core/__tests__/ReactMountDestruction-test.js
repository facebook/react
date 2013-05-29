/**
 * @jsx React.DOM
 * @emails react-core
 */

"use strict";

var ReactMount = require('ReactMount');
var React = require('React');
var ReactTestUtils = require('ReactTestUtils');
var ReactMount = require('ReactMount');

var reactComponentExpect = require('reactComponentExpect');

describe('ReactMount', function() {
  it("should destroy a react root upon request", function() {
    var mainContainerDiv = document.createElement('div');
    document.documentElement.appendChild(mainContainerDiv);

    var instanceOne = (
      <div className="firstReactDiv">
      </div>
    );
    var firstRootDiv = document.createElement('div');
    mainContainerDiv.appendChild(firstRootDiv);
    React.renderComponent(instanceOne, firstRootDiv);

    var instanceTwo = (
      <div className="secondReactDiv">
      </div>
    );
    var secondRootDiv = document.createElement('div');
    mainContainerDiv.appendChild(secondRootDiv);
    React.renderComponent(instanceTwo, secondRootDiv);

    // Test that two react roots are rendered in isolation
    expect(firstRootDiv.getElementsByClassName('firstReactDiv').length)
      .toBe(1);
    expect(secondRootDiv.getElementsByClassName('secondReactDiv').length)
      .toBe(1);

    // Test that after unmounting each, they are no longer in the document.
    React.unmountAndReleaseReactRootNode(firstRootDiv);
    expect(firstRootDiv.getElementsByClassName('firstReactDiv').length)
      .toBe(0);
    React.unmountAndReleaseReactRootNode(secondRootDiv);
    expect(secondRootDiv.getElementsByClassName('secondReactDiv').length)
      .toBe(0);
  });
});
