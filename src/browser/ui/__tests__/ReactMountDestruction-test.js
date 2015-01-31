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

'use strict';

var React = require('React');

describe('ReactMount', function() {
  it("should destroy a react root upon request", function() {
    var mainContainerDiv = document.createElement('div');
    document.documentElement.appendChild(mainContainerDiv);

    var instanceOne = <div className="firstReactDiv" />;
    var firstRootDiv = document.createElement('div');
    mainContainerDiv.appendChild(firstRootDiv);
    React.render(instanceOne, firstRootDiv);

    var instanceTwo = <div className="secondReactDiv" />;
    var secondRootDiv = document.createElement('div');
    mainContainerDiv.appendChild(secondRootDiv);
    React.render(instanceTwo, secondRootDiv);

    // Test that two react roots are rendered in isolation
    expect(firstRootDiv.firstChild.className).toBe('firstReactDiv');
    expect(secondRootDiv.firstChild.className).toBe('secondReactDiv');

    // Test that after unmounting each, they are no longer in the document.
    React.unmountComponentAtNode(firstRootDiv);
    expect(firstRootDiv.firstChild).toBeNull();
    React.unmountComponentAtNode(secondRootDiv);
    expect(secondRootDiv.firstChild).toBeNull();
  });

  it("should warn when unmounting a non-container root node", function() {
    var mainContainerDiv = document.createElement('div');

    var component =
      <div>
        <div />
      </div>;
    React.renderComponent(component, mainContainerDiv);

    // Test that unmounting at a root node gives a helpful warning
    var rootDiv = mainContainerDiv.firstChild;
    spyOn(console, 'warn');
    React.unmountComponentAtNode(rootDiv);
    expect(console.warn.callCount).toBe(1);
    expect(console.warn.mostRecentCall.args[0]).toBe(
      'Warning: unmountComponentAtNode(): The node you\'re attempting to ' +
      'unmount is not a valid React root node, and thus cannot be ' +
      'unmounted. You may have passed in a React root node as argument, ' +
      'rather than its container.'
    );
  });

  it("should warn when unmounting a non-container, non-root node", function() {
    var mainContainerDiv = document.createElement('div');

    var component =
      <div>
        <div>
          <div />
        </div>
      </div>;
    React.renderComponent(component, mainContainerDiv);

    // Test that unmounting at a non-root node gives a different warning
    var nonRootDiv = mainContainerDiv.firstChild.firstChild;
    spyOn(console, 'warn');
    React.unmountComponentAtNode(nonRootDiv);
    expect(console.warn.callCount).toBe(1);
    expect(console.warn.mostRecentCall.args[0]).toBe(
      'Warning: unmountComponentAtNode(): The node you\'re attempting to ' +
      'unmount is not a valid React root node, and thus cannot be ' +
      'unmounted.'
    );
  });
});
