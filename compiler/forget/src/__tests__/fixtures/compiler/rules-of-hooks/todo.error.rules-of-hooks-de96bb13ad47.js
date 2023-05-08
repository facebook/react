// @skip
// Passed but should have errored

class ClassComponentWithHook extends React.Component {
  render() {
    React.useState();
  }
}
