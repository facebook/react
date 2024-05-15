function Component(props) {
  return (
    useMemo(() => {
      return [props.value];
    }) || []
  );
}
