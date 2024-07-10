
## Input

```javascript
function component() {
  let t = graphql`
    fragment List_viewer on Viewer
    @argumentDefinitions(
      count: {
        type: "Int"
        defaultValue: 10
        directives: ["@int_max_value(logged_in: 10)"]
      }
      cursor: { type: "ID" }
    )

  `;

  return t;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime";
function component() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = graphql`
    fragment List_viewer on Viewer
    @argumentDefinitions(
      count: {
        type: "Int"
        defaultValue: 10
        directives: ["@int_max_value(logged_in: 10)"]
      }
      cursor: { type: "ID" }
    )

  `;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  const t = t0;
  return t;
}

```
      