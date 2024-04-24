import { makeObject_Primitives } from "shared-runtime";

function Component(props) {
  let lastItem = null; // we reject this code bc `lastItem` could be null and you can't mutate null
  const items = [makeObject_Primitives(), makeObject_Primitives()];
  for (const x of items) {
    lastItem = x;
  }
  if (lastItem != null) {
    lastItem.mutated = true;
  }
  return items;
}
