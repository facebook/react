// @logger
import { useState } from "react";
import { identity, makeObject_Primitives, useHook } from "shared-runtime";

function Component() {
  const x = makeObject_Primitives();
  const x2 = makeObject_Primitives();
  useState(null);
  identity(x);
  identity(x2);

  const y = useHook();

  const z = [];

  for (let i = 0; i < 10; i++) {
    const obj = makeObject_Primitives();
    z.push(obj);
  }

  return [x, x2, y, z];
}
