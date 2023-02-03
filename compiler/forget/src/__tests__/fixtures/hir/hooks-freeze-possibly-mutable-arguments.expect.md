
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
  const $ = React.useMemoCache();
  const cond = props.cond;
  const x = props.x;
  const c_0 = $[0] !== cond;
  const c_1 = $[1] !== x;
  let a;
  if (c_0 || c_1) {
    a = undefined;
    if (cond) {
      const a$0 = x;
      a = a$0;
    } else {
      let a$1;
      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        a$1 = [];
        $[3] = a$1;
      } else {
        a$1 = $[3];
      }
      a = a$1;
    }
    $[0] = cond;
    $[1] = x;
    $[2] = a;
  } else {
    a = $[2];
  }

  useFreeze(a);
  useFreeze(a);
  call(a);
  return a;
}

function useFreeze(x) {}
function call(x) {}

```
      