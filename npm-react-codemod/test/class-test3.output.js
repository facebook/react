'use strict';

var React = require('React');

// Comment
module.exports = class __exports extends React.Component {
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

module.exports.propTypes = {
  foo: React.PropTypes.bool,
};
