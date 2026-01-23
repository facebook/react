
## Input

```javascript
function Component(props) {
  const results = [];
  for (const item of props.items) {
    try {
      if (item === 'skip') {
        continue;
      }
      if (item === 'stop') {
        break;
      }
      results.push(item);
    } finally {
      console.log('processed', item);
    }
  }
  return results;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{items: ['a', 'skip', 'b', 'stop', 'c']}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function Component(props) {
  const $ = _c(2);
  let results;
  if ($[0] !== props.items) {
    results = [];
    for (const item of props.items) {
      try {
        if (item === "skip") {
          continue;
        }

        if (item === "stop") {
          break;
        }

        results.push(item);
      } finally {
        console.log("processed", item);
      }
    }
    $[0] = props.items;
    $[1] = results;
  } else {
    results = $[1];
  }
  return results;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ items: ["a", "skip", "b", "stop", "c"] }],
};

```
      
### Eval output
(kind: ok) ["a","b"]
logs: ['processed','a','processed','skip','processed','b','processed','stop']