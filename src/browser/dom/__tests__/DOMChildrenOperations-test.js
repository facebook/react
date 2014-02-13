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
var ReactTestUtils = require('ReactTestUtils');

describe('DOMChildrenOperations', function() {
  describe('processUpdates', function() {
    var iframeItem1 = {iframe: true, key: 'iframe1'};
    var iframeItem2 = {iframe: true, key: 'iframe2'};
    var listOfItems = [];

    for (var i = 0; i < 20; i++) {
      if (i % 2) {
        listOfItems.push({index: i});
      } else {
        listOfItems.push({key: i, index: i});
      }
    }

    var TestComponent = React.createClass({
      getInitialState: function() {
        return {items: this.props.items};
      },
      mutateChildren: function() {
        var temp = listOfItems.slice();
        var items = this.props.items.slice();
        var count = Math.floor(Math.random() * 15) + 5;

        if (this.props.reload) {
          for (var i = 0; i < count; i++) {
            items.unshift(items.pop());
          }
        }

        for (var i = 0; i < count; i++) {
          var from = Math.floor(Math.random() * temp.length);
          var to = Math.floor(Math.random() * (items.length + 1));
          var item = temp.splice(from, 1)[0];
          items.splice(to, 0, item);
        }

        this.setState({
          items: items
        });
      },
      expectImmovableReloaded: function() {
        var items = this.state.items;
        var childNodes = this.getDOMNode().childNodes;
        var reloaded = false;

        for (var i = 0; i < items.length; i++) {
          if (items[i].iframe) {
            reloaded = reloaded ||
              !(childNodes[i].contentWindow &&
                childNodes[i].contentWindow.reactKey);
          }
        }

        expect(reloaded).toBe(true);
      },
      componentDidMount: function() {
        var items = this.state.items;
        var childNodes = this.getDOMNode().childNodes;

        for (var i = 0; i < items.length; i++) {
          if (items[i].iframe) {
            childNodes[i].contentWindow.reactKey = items[i].key;
          }
        }
      },
      componentDidUpdate: function() {
        var items = this.state.items;
        var childNodes = this.getDOMNode().childNodes;

        expect(childNodes.length).toBe(items.length);

        for (var i = 0; i < items.length; i++) {
          if (items[i].iframe) {
            if (!this.props.reload) {
              expect(
                childNodes[i].contentWindow &&
                childNodes[i].contentWindow.reactKey
              ).toBe(items[i].key);
            }
          } else {
            expect(childNodes[i].textContent).toBe(i + ':' + items[i].index);
          }
        }
      },
      render: function() {
        return (
          <div>
            {this.state.items.map(function(item, i) {
              if (item.iframe) {
                return <iframe key={item.key} />;
              } else {
                return <div key={item.key}>{i + ':' + item.index}</div>;
              }
            })}
          </div>
        );
      }
    });

    afterEach(function() {
      document.documentElement.removeChild(
        document.documentElement.lastChild
      );
    });

    var iterations = 100;

    it('should mutate 100 nodes without fault', function() {
      var component = ReactTestUtils.renderAttachedIntoDocument(
        <TestComponent items={[]} />
      );
      for (var i = 0; i < iterations; i++) {
        component.mutateChildren();
      }
    });

    it('should mutate and not reload the immovable object', function() {
      var component = ReactTestUtils.renderAttachedIntoDocument(
        <TestComponent items={[iframeItem1]} />
      );
      for (var i = 0; i < iterations; i++) {
        component.mutateChildren();
      }
    });

    it('should mutate and not reload any immovable object', function() {
      var component = ReactTestUtils.renderAttachedIntoDocument(
        <TestComponent items={[iframeItem1, iframeItem2]} />
      );
      for (var i = 0; i < iterations; i++) {
        component.mutateChildren();
      }
    });

    it('should mutate and reload the immovable objects', function() {
      var component = ReactTestUtils.renderAttachedIntoDocument(
        <TestComponent items={[iframeItem1, iframeItem2]} reload={true} />
      );
      for (var i = 0; i < iterations; i++) {
        component.mutateChildren();
      }
      component.expectImmovableReloaded();
    });
  });
});
