function Component(props) {
  let Component = Foo;

  Component = useMemo(() => {
    return Component;
  });

  return <Component />;
}
