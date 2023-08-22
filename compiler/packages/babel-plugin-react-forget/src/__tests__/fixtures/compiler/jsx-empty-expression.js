export function Component(props) {
  return (
    <div>
      {}
      {props.a}
    </div>
  );
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: ["TodoAdd"],
  isComponent: "TodoAdd",
};
