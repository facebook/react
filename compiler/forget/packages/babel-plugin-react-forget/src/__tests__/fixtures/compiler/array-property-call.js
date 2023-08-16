function Component(props) {
  const a = [props.a, props.b, "hello"];
  const x = a.push(42);
  const y = a.at(props.c);

  return { a, x, y };
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};
