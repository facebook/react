
## Input

```javascript
function useFreeze() {}
function foo() {}

function Component(props) {
  const x = [];
  const y = useFreeze(x);
  foo(y, x);
  return (
    <Component>
      {x}
      {y}
    </Component>
  );
}

```

## Code

```javascript
function useFreeze() {}
function foo() {}

function Component(props) {
  const $ = React.unstable_useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    $[0] = x;
  } else {
    x = $[0];
  }
  const y = useFreeze(x);
  foo(y, x);
  const c_1 = $[1] !== y;
  let t0;
  if (c_1) {
    t0 = (
      <Component>
        {x}
        {y}
      </Component>
    );
    $[1] = y;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      