function Component(props) {
  useEffect(
    () => {
      console.log(props.value);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return <div />;
}
