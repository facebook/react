// @skip
// Passed but should have errored

class ClassComponentWithFeatureFlag extends React.Component {
  render() {
    if (foo) {
      useFeatureFlag();
    }
  }
}
