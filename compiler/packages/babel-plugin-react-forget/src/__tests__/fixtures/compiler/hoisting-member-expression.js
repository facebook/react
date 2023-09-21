function hoisting() {
  function onClick(x) {
    return x + bar.baz;
  }
  const bar = { baz: 1 };

  return <Button onClick={onClick} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
  isComponent: false,
};
