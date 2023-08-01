function Component(props) {
  const x = 42;
  const onEvent = () => {
    console.log(x);
  };
  return <Foo onEvent={onEvent} />;
}
