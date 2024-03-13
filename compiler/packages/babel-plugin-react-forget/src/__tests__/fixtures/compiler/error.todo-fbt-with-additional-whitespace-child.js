function Component(props) {
  return (
    <fbt desc="Title">
      <fbt:plural count={identity(props.count)} name="count" showCount="yes">
        vote
      </fbt:plural>{" "}
      for <fbt:param name="option">{props.option} </fbt:param>
    </fbt>
  );
}
