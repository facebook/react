
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
function component() {
  const $ = React.unstable_useMemoCache();
  let t;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t = graphql`
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
    $[0] = t;
  } else {
    t = $[0];
  }
  return t;
}

```
      