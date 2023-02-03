
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
  const $ = React.useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    $[0] = x;
  } else {
    x = $[0];
  }
  let y;
  if ($[1] === Symbol.for("react.memo_cache_sentinel")) {
    y = useFreeze(x);
    $[1] = y;
  } else {
    y = $[1];
  }
  foo(y, x);
  let t0;
  if ($[2] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (
      <Component>
        {x}
        {y}
      </Component>
    );
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      