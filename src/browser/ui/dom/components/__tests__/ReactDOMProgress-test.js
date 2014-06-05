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

/*jshint evil:true */

var progressElement = document.createElement('progress');
var progressElementSupported = typeof progressElement.max !== 'undefined';

if(progressElementSupported) {
  var expectProgressToBeIndeterminate = function(progressInstance) {
    var progressDOMNode = progressInstance.getDOMNode();
    expect(progressDOMNode.position).toBe(-1); // For the "position" property to be -1 means that the <progress> element is in an indeterminate (barber-pole) state
  };

  describe('ReactDOMProgress', function() {
    var React;
    var ReactTestUtils;

    beforeEach(function() {
      React = require('React');
      ReactTestUtils = require('ReactTestUtils');
    });

    describe('when value transitions from being set to being null', function() {
      beforeEach(function() {
        this.progressInstance = ReactTestUtils.renderIntoDocument(<progress value="3.14" max="100" />);
        this.progressInstance.setProps({value: null});
      });

      it('should return to the indeterminate state', function() {
        expectProgressToBeIndeterminate(this.progressInstance);
      });
    });

    describe('when value transitions from being set to being undefined', function() {
      beforeEach(function() {
        this.progressInstance = ReactTestUtils.renderIntoDocument(<progress value="42" max="100" />);
        this.progressInstance.setProps({value: (void 0)});
      });

      it('should return to the indeterminate state', function() {
        expectProgressToBeIndeterminate(this.progressInstance);
      });
    });
  });
}
