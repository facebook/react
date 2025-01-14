
## Input

```javascript
function Component(props) {
  return (
    <Sathya.Codes.Forget>
      <Foo.Bar.Baz />
    </Sathya.Codes.Forget>
  );
}

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r;
function Component(props) {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = (
      <Sathya.Codes.Forget>
        <Foo.Bar.Baz />
      </Sathya.Codes.Forget>
    );
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}

```
      