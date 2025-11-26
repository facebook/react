
## Input

```javascript
// @validateNoSetStateInRender
function Component(props) {
  const [x, setX] = useState(0);

  const foo = () => {
    setX(1);
  };

  const bar = () => {
    foo();
  };

  const baz = () => {
    bar();
  };
  baz();

  return [x];
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoSetStateInRender
function Component(props) {
  const $ = _c(2);
  const [x, setX] = useState(0);

  const foo = () => {
    setX(1);
  };

  const bar = () => {
    foo();
  };

  const baz = () => {
    bar();
  };

  baz();
  let t0;
  if ($[0] !== x) {
    t0 = [x];
    $[0] = x;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  return t0;
}

```
      
### Eval output
(kind: exception) Fixture not implemented