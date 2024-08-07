
## Input

```javascript
// @enableLowerContextAccess
function App() {
  const {foo, bar} = useContext(MyContext);
  return <Bar foo={foo} bar={bar} />;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableLowerContextAccess
function App() {
  const $ = _c(3);
  const { foo, bar } = useContext(MyContext, _temp);
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
function _temp(t0) {
  return [t0.foo, t0.bar];
}

```
      