
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp

function Component({value}) {
  const [checked, setChecked] = useState('');

  useEffect(() => {
    setChecked(value === '' ? [] : value.split(','));
  }, [value]);

  return <div>{checked}</div>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp

function Component(t0) {
  const $ = _c(5);
  const { value } = t0;
  const [checked, setChecked] = useState("");
  let t1;
  let t2;
  if ($[0] !== value) {
    t1 = () => {
      setChecked(value === "" ? [] : value.split(","));
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
  if ($[3] !== checked) {
    t3 = <div>{checked}</div>;
    $[3] = checked;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

```
      
### Eval output
(kind: exception) Fixture not implemented