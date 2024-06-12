function Foo(props, ref) {
  const value = {};
  if (cond1) {
    mutate(value);
    return <Child ref={ref} />;
  }
  mutate(value);
  if (cond2) {
    return <Child ref={identity(ref)} />;
  }
  return value;
}
