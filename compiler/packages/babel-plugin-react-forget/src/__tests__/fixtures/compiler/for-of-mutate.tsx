import { makeObject_Primitives, mutate, Stringify } from "shared-runtime";

function Component(_props) {
  const collection = [makeObject_Primitives()];
  const results = [];
  for (const item of collection) {
    results.push(<div key={Stringify(item)}>{Stringify(mutate(item))}</div>);
  }
  return <div>{results}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
  isComponent: true,
};
