
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
import { c as _c } from "react/compiler-runtime"; // @lowerContextAccess
function App() {
  const $ = _c(3);
  const { joe: t0, bar } = useContext(MyContext);
  const { foo } = t0;
  let t1;
  if ($[0] !== foo || $[1] !== bar) {
    t1 = <Bar foo={foo} bar={bar} />;
    $[0] = foo;
    $[1] = bar;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      