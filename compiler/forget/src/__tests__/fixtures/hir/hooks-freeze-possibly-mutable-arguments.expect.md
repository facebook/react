
## Input

```javascript
function Component(props) {
  const cond = props.cond;
  const x = props.x;
  let a;
  if (cond) {
    a = x;
  } else {
    a = [];
  }
  useFreeze(a); // should freeze, value *may* be mutable
  useFreeze(a); // should be readonly
  call(a); // should be readonly
  return a;
}

function useFreeze(x) {}
function call(x) {}

```

## Code

```javascript
function Component(props) {
  const $ = React.unstable_useMemoCache();
  const cond = props.cond;
  const x = props.x;
  let a = undefined;
  if (cond) {
    a = x;
  } else {
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      a = [];
      $[0] = a;
    } else {
      a = $[0];
    }
  }

  useFreeze(a);
  useFreeze(a);
  call(a);
  return a;
}

function useFreeze(x) {}
function call(x) {}

```
      