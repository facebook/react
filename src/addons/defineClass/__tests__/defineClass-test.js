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
 * @emails react-core
 * @jsx React.DOM 
 */

var mocks = require('mocks');
var React = require('React');
var defineClass = require('defineClass');

describe('defineClass', function() {
  var initialState, defaultProps;
  beforeEach(function() {
    initialState = {
      activated: false
    }
    defaultProps = {
      displayActive: 'Hooray!',
      displayInactive: 'Boo!'
    };
  });

  it('should create a valid React component', function() {
    var afterMount = mocks.getMockFunction();

    var Component = defineClass(function() {
      this.initialState(initialState);
      this.defaultProps(defaultProps);

      this.render = function() {
        var text = this.state.activated
          ? this.props.displayActive
          : this.props.displayInactive
        return <div>{text}</div>
      };

      this.after('mount', afterMount);
    });
    
    var container = document.createElement('div');
    var component = React.renderComponent(<Component />, container);
    expect(component.state).toEqual(initialState);
    expect(component.props.displayActive).toEqual(defaultProps.displayActive);
    expect(component.props.displayInactive)
        .toEqual(defaultProps.displayInactive);
    expect(afterMount.mock.calls[0].value).toEqual(component.getDOMNode().value);
  });
});
