const React = window.React;

const propTypes = {
  children: React.PropTypes.node.isRequired,
};

class Fixture extends React.Component {
  render() {
    const { children } = this.props;

    return (
      <div className="test-fixture">
        {children}
      </div>
    );
  }
}

Fixture.propTypes = propTypes;
//
// Fixture.Result = class extends React.Component {
//   render() {
//     const { children, passes } = this.props;
//     return (
//       <p className="test-fixture-result">
//         {children}
//       </p>
//     )
//   }
// }


export default Fixture
