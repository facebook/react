import { mutate } from "shared-runtime";

function Component(a) {
  const x = { a };
  let obj = {
    method() {
      mutate(x);
      return x;
    },
  };
  return obj.method();
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ x: 1 }],
};
