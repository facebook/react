
## Input

```javascript
// @validateNoDerivedComputationsInEffects

function Component({value}) {
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    setLocalValue(value);
    document.title = `Value: ${value}`;
  }, [value]);

  return <div>{localValue}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{value: 'test'}],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects

function Component(t0) {
  const $ = _c(5);
  const { value } = t0;
  const [localValue, setLocalValue] = useState("");
  let t1;
  let t2;
  if ($[0] !== value) {
    t1 = () => {
      setLocalValue(value);
      document.title = `Value: ${value}`;
    };
    t2 = [value];
    $[0] = value;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useEffect(t1, t2);
  let t3;
  if ($[3] !== localValue) {
    t3 = <div>{localValue}</div>;
    $[3] = localValue;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{ value: "test" }],
};

```
      
### Eval output
(kind: exception) useState is not defined