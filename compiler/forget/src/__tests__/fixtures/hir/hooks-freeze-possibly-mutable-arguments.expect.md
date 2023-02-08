
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
    const a$0 = x;
    a = a$0;
  } else {
    let a$1;
    if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
      a$1 = [];
      $[0] = a$1;
    } else {
      a$1 = $[0];
    }
    a = a$1;
  }

  useFreeze(a);
  useFreeze(a);
  call(a);
  return a;
}

function useFreeze(x) {}
function call(x) {}

```
      