
## Input

```javascript
// @lowerContextAccess
function App() {
  const {
    joe: {foo},
    bar,
  } = useContext(MyContext);
  return <Bar foo={foo} bar={bar} />;
}

```

## Code

```javascript
import _r from "react/compiler-runtime";
const { c: _c } = _r; // @lowerContextAccess
function App() {
  const $ = _c(3);
  const { joe: t0, bar } = useContext(MyContext);
  const { foo } = t0;
  let t1;
  if ($[0] !== bar || $[1] !== foo) {
    t1 = <Bar foo={foo} bar={bar} />;
    $[0] = bar;
    $[1] = foo;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      