import React, {Component} from 'react';

import Chrome from './Chrome';
import Page from './Page';
import SSRMismatchTest from './SSRMismatchTest';

export default class App extends Component {
  render() {
    return (
      <Chrome title="Hello World" assets={this.props.assets}>
        <div>
          <h1>Hello World</h1>
          <Page />
          <SSRMismatchTest url={this.props.url} />
        </div>
      </Chrome>
    );
  }
}
