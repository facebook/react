
## Input

```javascript
function Foo() {}

function Component(props) {
  const a = [];
  const b = {};
  let c = new Foo(a, b);
  return c;
}

```

## Code

```javascript
function Foo() {}

```
## Code

```javascript
function Component(props) {
  const $ = React.useMemoCache();
  let c;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    const a = [];
    const b = {};
    c = new Foo(a, b);
    $[0] = c;
  } else {
    c = $[0];
  }

  return c;
}

```
      