function component(t) {
  let { a } = t;
  let y = { a };
  return y;
}

export const FIXTURE_ENTRYPOINT = {
  fn: component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};
