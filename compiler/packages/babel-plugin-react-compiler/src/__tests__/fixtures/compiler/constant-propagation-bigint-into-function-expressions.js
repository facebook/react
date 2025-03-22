function Component(props) {
  const x = 42n;
  const onEvent = () => {
    console.log(x);
  };
  return <Foo onEvent={onEvent} />;
}
