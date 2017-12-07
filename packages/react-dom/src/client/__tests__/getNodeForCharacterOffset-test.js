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
    node.setSelectionRange(0, 1);

    component.setState({oneFirst: false}, () => {
      done();
    });
  });
});
