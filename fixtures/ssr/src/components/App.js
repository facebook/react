import React, {Component} from 'react';

import Chrome from './Chrome';
import Header from './Header';
import Fixtures from './fixtures';
import '../style.css';

export default class App extends Component {
  render() {
    return (
      <Chrome title="SSR Fixture" assets={this.props.assets}>
        <Header />
        <Fixtures />
      </Chrome>
    );
  }
}
