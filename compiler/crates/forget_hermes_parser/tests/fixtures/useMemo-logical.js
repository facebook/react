function Component(props) {
  const x = useMemo(() => props.a && props.b);
  return x;
}
