/**
 * Copyright 2013-2014 Facebook, Inc.
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

var React = require('React');

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

    var component = (
      <div>
        <div />
      </div>
    );
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

    var component = (
      <div>
        <div>
          <div />
        </div>
      </div>
    );
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
