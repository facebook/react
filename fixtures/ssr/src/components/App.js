import React, { Component } from 'react';

import Chrome from './Chrome';
import Page from './Page';

export default class App extends Component {
  render() {
    return (
      <Chrome title="Hello World" assets={this.props.assets}>
        <div>
          <h1>Hello World</h1>
          <Page />
        </div>
      </Chrome>
    );
  }
}
