'use strict';

import React from 'React';

export default React.createClass({
  getInitialState: function() {
    return {
      foo: 'bar',
    };
  },

  propTypes: {
    foo: React.PropTypes.string,
  },

  render: function() {
    return <div />;
  }
});
