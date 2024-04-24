
## Input

```javascript
function Router({ title, mapping }) {
  const array = [];
  for (let entry of mapping.values()) {
    array.push([title, entry]);
  }
  return array;
}

const routes = new Map([
  ["about", "/about"],
  ["contact", "/contact"],
]);

export const FIXTURE_ENTRYPOINT = {
  fn: Router,
  params: [],
  sequentialRenders: [
    {
      title: "Foo",
      mapping: routes,
    },
    {
      title: "Bar",
      mapping: routes,
    },
  ],
};

```

## Code

```javascript
import { unstable_useMemoCache as useMemoCache } from "react";
function Router(t0) {
  const $ = useMemoCache(5);
  const { title, mapping } = t0;
  let array;
  if ($[0] !== mapping || $[1] !== title) {
    array = [];
    let t1;
    if ($[3] !== mapping) {
      t1 = mapping.values();
      $[3] = mapping;
      $[4] = t1;
    } else {
      t1 = $[4];
    }
    for (const entry of t1) {
      array.push([title, entry]);
    }
    $[0] = mapping;
    $[1] = title;
    $[2] = array;
  } else {
    array = $[2];
  }
  return array;
}

const routes = new Map([
  ["about", "/about"],
  ["contact", "/contact"],
]);

export const FIXTURE_ENTRYPOINT = {
  fn: Router,
  params: [],
  sequentialRenders: [
    {
      title: "Foo",
      mapping: routes,
    },
    {
      title: "Bar",
      mapping: routes,
    },
  ],
};

```
      