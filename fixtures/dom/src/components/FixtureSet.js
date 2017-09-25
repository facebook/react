import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
  title: PropTypes.node.isRequired,
  description: PropTypes.node.isRequired,
};

class FixtureSet extends React.Component {
  render() {
    const {title, description, children} = this.props;

    return (
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}

        {children}
      </div>
    );
  }
}

FixtureSet.propTypes = propTypes;

export default FixtureSet;
