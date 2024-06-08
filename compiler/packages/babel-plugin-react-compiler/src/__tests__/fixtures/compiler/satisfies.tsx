import { Stringify } from "shared-runtime";

function Foo() {
  const b = 1 satisfies number;
  return <Stringify value={b} />;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [],
  isComponent: true,
};
