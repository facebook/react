
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
import { c as _c } from "react/compiler-runtime"; // @lowerContextAccess
function App() {
  const $ = _c(3);
  const context = useContext(MyContext);
  const foo = context.foo;
  const bar = context.bar;
  let t0;
  if ($[0] !== foo || $[1] !== bar) {
    t0 = <Bar foo={foo} bar={bar} />;
    $[0] = foo;
    $[1] = bar;
    $[2] = t0;
  } else {
    t0 = $[2];
  }
  return t0;
}

```
      