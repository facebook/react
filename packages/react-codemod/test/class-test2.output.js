'use strict';

var React = require('React');

class IdontNeedAParent {
  render() {
    return <div />;
  }
}

class ButIDo extends React.Component {
  foo() {
    this.setState({banana: '?'});
  }

  render() {
    return <div />;
  }
}

class IAccessProps {
  constructor(props) {
    this.state = {
      relayReleaseDate: props.soon,
    };
  }

  render() {
    return
  }
}
