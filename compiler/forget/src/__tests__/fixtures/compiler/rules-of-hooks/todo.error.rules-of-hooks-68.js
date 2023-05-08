// @skip

class ClassComponentWithFeatureFlag extends React.Component {
  render() {
    if (foo) {
      useFeatureFlag();
    }
  }
}
