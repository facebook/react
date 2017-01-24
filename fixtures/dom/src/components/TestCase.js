import React from 'react';

const propTypes = {
  children: React.PropTypes.node.isRequired,
  title: React.PropTypes.node.isRequired,
};

class TestCase extends React.Component {

  render() {
    const { title, description, children } = this.props;

    return (
      <section className="test-case">
        <h2 className="type-subheading">
          <label>
            <input type='checkbox' />
            {' '} {title}
          </label>
        </h2>
        <p>{description}</p>

        {children}
      </section>
    );
  }
}

TestCase.propTypes = propTypes;

TestCase.Steps = ({ children }) => (
  <div>
    <h3>Steps to reproduce:</h3>
    <ol>
      {children}
    </ol>
  </div>
)

TestCase.ExpectedResult = ({ children }) => (
  <div>
    <h3>Expected Result:</h3>
    <p>
      {children}
    </p>
  </div>
)
export default TestCase
