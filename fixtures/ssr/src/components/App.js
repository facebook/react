import React, {Component} from 'react';

import Chrome from './Chrome';
import Page from './Page';
import FormElementTests from './FormElementTests'

export default class App extends Component {
  render() {
    return (
      <Chrome title="SSR Fixture" assets={this.props.assets}>
        <div>
          <h1>SSR Fixture</h1>
          <Page />
        </div>
        <hr />
        <div>
          <h1>Basic Form Element Functionality Tests</h1>
          <FormElementTests />
        </div>
      </Chrome>
    );
  }
}
