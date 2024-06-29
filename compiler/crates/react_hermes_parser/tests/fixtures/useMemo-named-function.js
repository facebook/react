function Component(props) {
  const x = useMemo(someHelper, []);
  return x;
}
