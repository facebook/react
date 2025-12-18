function Component() {
  const Foo = () => {
    someGlobal = true;
    return <div />;
  };
  return <Foo />;
}
