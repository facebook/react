function hoisting() {
  function onClick(x) {
    return x + bar["baz"];
  }
  function onClick2(x) {
    return x + bar[baz];
  }
  const baz = "baz";
  const bar = { baz: 1 };

  return <Button onClick={onClick} onClick2={onClick2} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: hoisting,
  params: [],
};
