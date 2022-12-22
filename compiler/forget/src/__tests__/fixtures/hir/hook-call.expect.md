
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

```
## Code

```javascript
function foo() {}

```
## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  let x;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    x = [];
    $[0] = x;
  } else {
    x = $[0];
  }

  const c_1 = $[1] !== x;
  let y;

  if (c_1) {
    y = useFreeze(x);
    $[1] = x;
    $[2] = y;
  } else {
    y = $[2];
  }

  foo(y, x);
  const c_3 = $[3] !== x;
  const c_4 = $[4] !== y;
  let t5;

  if (c_3 || c_4) {
    t5 = (
      <Component>
        {x}
        {y}
      </Component>
    );
    $[3] = x;
    $[4] = y;
    $[5] = t5;
  } else {
    t5 = $[5];
  }

  return t5;
}

```
      