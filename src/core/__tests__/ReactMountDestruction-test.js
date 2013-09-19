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
    expect(firstRootDiv.getElementsByClassName('firstReactDiv').length)
      .toBe(1);
    expect(secondRootDiv.getElementsByClassName('secondReactDiv').length)
      .toBe(1);

    // Test that after unmounting each, they are no longer in the document.
    React.unmountComponentAtNode(firstRootDiv);
    expect(firstRootDiv.getElementsByClassName('firstReactDiv').length)
      .toBe(0);
    React.unmountComponentAtNode(secondRootDiv);
    expect(secondRootDiv.getElementsByClassName('secondReactDiv').length)
      .toBe(0);
  });
});
