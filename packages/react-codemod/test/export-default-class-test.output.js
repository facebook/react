'use strict';

import React from 'React';

export default class extends React.Component {
  constructor(props, context) {
    super(props, context);

    this.state = {
      foo: 'bar',
    };
  }

  render() {
    return <div />;
  }
};

