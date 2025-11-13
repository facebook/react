
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp

function Component({ prop }) {

  const [s, setS] = useState(0)
  useEffect(() => {
    setS(prop)
  }, [prop, setS]);

  return (<div>{prop}</div>)
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp

function Component(t0) {
  const $ = _c(5);
  const { prop } = t0;

  const [, setS] = useState(0);
  let t1;
  let t2;
  if ($[0] !== prop) {
    t1 = () => {
      setS(prop);
    };
    t2 = [prop, setS];
    $[0] = prop;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useEffect(t1, t2);
  let t3;
  if ($[3] !== prop) {
    t3 = <div>{prop}</div>;
    $[3] = prop;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

```
      
### Eval output
(kind: exception) Fixture not implemented