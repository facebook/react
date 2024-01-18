function Component(props) {
  const {
    x: { destructured },
    sameName: renamed,
  } = props;
  const sameName = foo(destructured);

  return [sameName, renamed];
}
