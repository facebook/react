
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
  const a = undefined;
  const c_0 = $[0] !== cond;
  const c_1 = $[1] !== x;
  let a$0;
  if (c_0 || c_1) {
    a$0 = undefined;
    if (cond) {
      const a$1 = x;
      a$0 = a$1;
    } else {
      let a$2;
      if ($[3] === Symbol.for("react.memo_cache_sentinel")) {
        a$2 = [];
        $[3] = a$2;
      } else {
        a$2 = $[3];
      }
      a$0 = a$2;
    }
    $[0] = cond;
    $[1] = x;
    $[2] = a$0;
  } else {
    a$0 = $[2];
  }

  useFreeze(a$0);
  useFreeze(a$0);
  call(a$0);
  return a$0;
}

function useFreeze(x) {}
function call(x) {}

```
      