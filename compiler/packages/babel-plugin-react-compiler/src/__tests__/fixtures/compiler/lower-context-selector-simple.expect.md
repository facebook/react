
## Input

```javascript
// @lowerContextAccess
function App() {
  const {foo, bar} = useContext(MyContext);
  return <Bar foo={foo} bar={bar} />;
}

```

## Code

```javascript
import { useContext_withSelector } from "react-compiler-runtime";
import { c as _c } from "react/compiler-runtime"; // @lowerContextAccess
function App() {
  const $ = _c(3);
  const { foo, bar } = useContext_withSelector(MyContext, _temp);
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
      