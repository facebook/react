/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

describe('getNodeForCharacterOffset', () => {
  var React;
  var ReactDOM;

  beforeEach(() => {
    React = require('react');
    ReactDOM = require('react-dom');
  });

  it('should re-render an input with the same selection', done => {
    const container = document.createElement('div');
    let node, component;
    document.body.appendChild(container);

    class InputComponent extends React.Component {
      constructor(props) {
        super(props);

        this.state = {
          oneFirst: true,
          oneValue: 'foo',
          twoValue: 'foo',
        };
      }

      componentWillMount() {
        component = this;
      }

      handleChange(e) {
        this.setState({value: e.target.value});
      }

      renderForms() {
        if (this.state.oneFirst) {
          return [
            <input
              key="1"
              value={this.state.oneValue}
              ref={e => (node = e)}
              readOnly={true}
            />,
            <input key="2" value={this.state.twoValue} readOnly={true} />,
          ];
        } else {
          return [
            <input key="2" value={this.state.twoValue} readOnly={true} />,
            <input key="1" value={this.state.oneValue} readOnly={true} />,
          ];
        }
      }

      render() {
        return <form>{this.renderForms()}</form>;
      }
    }

    ReactDOM.render(<InputComponent />, container);

    node.focus();
    node.setSelectionRange(1, 1);

    const inputDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'selectionStart');

    delete HTMLInputElement.prototype.selectionStart;

    let startMarkerNode, startMarkerOffset;
    let endMarkerNode, endMarkerOffset;

    // These aren't implemented by jsdom yet, so let's re-implement them
    // to test the markers created by getNodeForCharacterOffset

    window.getSelection = () => ({
      removeAllRanges: function() {
        return true;
      },
      addRange: function(range) {},
      extend: function(endNode, endOffset) {
        endMarkerNode = endNode;
        endMarkerOffset = endOffset;
      },
    });

    document.createRange = () => ({
      setStart: function(startNode, startOffset) {
        startMarkerNode = startNode;
        startMarkerOffset = startOffset;
      },
      setEnd: function(endNode, endOffset) {
        endMarkerNode = endNode;
        endMarkerOffset = endOffset;
      },
    });

    try {
      component.setState({oneFirst: false}, () => {
        console.log(startMarkerNode, startMarkerOffset);
        console.log(endMarkerNode, endMarkerOffset);
        done();
      });
    } finally {
      Object.defineProperty(HTMLInputElement.prototype, 'selectionStart', inputDescriptor);
    }
  });
});
