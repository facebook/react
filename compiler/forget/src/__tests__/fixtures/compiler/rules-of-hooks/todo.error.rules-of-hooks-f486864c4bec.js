// @skip
// Passed but should have errored

// This is a false positive (it's valid) that unfortunately
// we cannot avoid. Prefer to rename it to not start with "use"
class Foo extends Component {
  render() {
    if (cond) {
      FooStore.useFeatureFlag();
    }
  }
}
