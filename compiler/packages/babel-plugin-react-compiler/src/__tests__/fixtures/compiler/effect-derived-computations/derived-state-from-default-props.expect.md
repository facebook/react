
## Input

```javascript
// @validateNoDerivedComputationsInEffects

export default function Component(input = 'empty') {
  const [currInput, setCurrInput] = useState(input);
  const localConst = 'local const';

  useEffect(() => {
    setCurrInput(input + localConst);
  }, [input, localConst]);

  return <div>{currInput}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{input: 'test'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects

export default function Component(t0) {
  const $ = _c(5);
  const input = t0 === undefined ? "empty" : t0;
  const [currInput, setCurrInput] = useState(input);
  let t1;
  let t2;
  if ($[0] !== input) {
    t1 = () => {
      setCurrInput(input + "local const");
    };
    t2 = [input, "local const"];
    $[0] = input;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useEffect(t1, t2);
  let t3;
  if ($[3] !== currInput) {
    t3 = <div>{currInput}</div>;
    $[3] = currInput;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ input: "test" }],
};

```
      
### Eval output
(kind: exception) useState is not defined