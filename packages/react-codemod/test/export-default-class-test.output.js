'use strict';

import React from 'React';

export default class extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      foo: 'bar',
    };
  }

  static propTypes = {
    foo: React.PropTypes.string,
  };

  render() {
    return <div />;
  }
}
