/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';

export default function App() {
  return <List />;
}

class List extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      items: ['one', 'two', 'three'],
    };
  }

  addItem = () => {
    if (this.inputRef && this.inputRef.value) {
      this.setState({items: [...this.state.items, this.inputRef.value]});
      this.inputRef.value = '';
    }
  };

  render() {
    return (
      <div>
        <input
          data-testname="AddItemInput"
          value={this.state.text}
          onChange={this.onInputChange}
          ref={c => (this.inputRef = c)}
        />
        <button data-testname="AddItemButton" onClick={this.addItem}>
          Add Item
        </button>
        <ul data-testname="List">
          {this.state.items.map((label, index) => (
            <ListItem key={index} label={label} />
          ))}
        </ul>
      </div>
    );
  }
}

function ListItem({label}) {
  return <li data-testname="ListItem">{label}</li>;
}
