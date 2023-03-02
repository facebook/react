
## Input

```javascript
function useBar(props) {
  let z;

  if (props.a) {
    if (props.b) {
      z = baz();
    }
  }

  return z;
}

```

## Code

```javascript
function useBar(props) {
  const $ = React.unstable_useMemoCache(1);
  let z = undefined;
  if (props.a) {
    if (props.b) {
      if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
        z = baz();
        $[0] = z;
      } else {
        z = $[0];
      }
    }
  }
  return z;
}

```
      