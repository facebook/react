function component(a, b) {
  let z = { a };
  let p = () => <Foo>{z}</Foo>;
  return p();
}
