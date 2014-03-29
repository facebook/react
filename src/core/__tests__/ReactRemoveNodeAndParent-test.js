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
/*global global:true*/
"use strict";

var mocks = require('mocks');
var React = require('React');
var ReactTestUtils = require('ReactTestUtils');
var reactComponentExpect = require('reactComponentExpect');

// TODO: Test render and all stock methods.
describe('Removing a node and its parent at the same time', function() {

  it('Does not try to remove node from parent when parent has already been removed', function() {

    var TestChildComponent = React.createClass({
      render: function() {
        return (<div>
                <table>
                <tr><td></td></tr>
                {this.props.item.show ? <tr><td></td></tr> : <span/>}
                </table>
                </div>);
      }
    });

    var TestParentComponent = React.createClass({
      getInitialState: function() {
        return {items: [
          {key: 1, show: true},
          {key: 2, show: true}
        ]};
      },

      _changeState: function() {
        // removed the table row from the second item in the list
        this.setState({items: [
          {key: 1, show: true},
          {key: 2, show: false}
        ]});

        // Removes the second item from the list, in my case this happens in two
        // different locations but for the test we'll do it like this
        this.setState({items: [
          {key: 1, show: true}
        ]});
      },

      render: function() {
        var items = this.state.items;
        return (
            <div>
            {items.map(function (item) {
              return <TestChildComponent key={item.key} item={item} />
            })}
          </div>
        );
      }
    });

    var instance = <TestParentComponent />;
    instance = ReactTestUtils.renderIntoDocument(instance);

    reactComponentExpect(instance)
      .expectRenderedChild()
      .instance();

    expect(instance.getDOMNode().childNodes.length).toBe(2);

    instance._changeState();

    expect(instance.getDOMNode().childNodes.length).toBe(1);

  });

});
