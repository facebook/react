
## Input

```javascript
// @lowerContextAccess
function App() {
  const context = useContext(MyContext);
  const foo = context.foo;
  const bar = context.bar;
  return <Bar foo={foo} bar={bar} />;
}

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r; // @lowerContextAccess
function App() {
  const $ = _c(3);
  const context = useContext(MyContext);
  const foo = context.foo;
  const bar = context.bar;
  let t0;
  if ($[0] !== bar || $[1] !== foo) {
    t0 = <Bar foo={foo} bar={bar} />;
    $[0] = bar;
    $[1] = foo;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      