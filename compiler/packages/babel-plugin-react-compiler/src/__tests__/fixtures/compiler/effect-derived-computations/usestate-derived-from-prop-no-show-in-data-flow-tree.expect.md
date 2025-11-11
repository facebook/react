
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp

function Component({prop}) {
  const [s, setS] = useState();
  const [second, setSecond] = useState(prop);

  /*
   * `second` is a source of state. It will inherit the value of `prop` in
   * the first render, but after that it will no longer be updated when
   * `prop` changes. So we shouldn't consider `second` as being derived from
   * `prop`
   */
  useEffect(() => {
    setS(second);
  }, [second]);

  return <div>{s}</div>;
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects_exp

function Component(t0) {
  const $ = _c(5);
  const { prop } = t0;
  const [s, setS] = useState();
  const [second] = useState(prop);
  let t1;
  let t2;
  if ($[0] !== second) {
    t1 = () => {
      setS(second);
    };
    t2 = [second];
    $[0] = second;
    $[1] = t1;
    $[2] = t2;
  } else {
    t1 = $[1];
    t2 = $[2];
  }
  useEffect(t1, t2);
  let t3;
  if ($[3] !== s) {
    t3 = <div>{s}</div>;
    $[3] = s;
    $[4] = t3;
  } else {
    t3 = $[4];
  }
  return t3;
}

```
      
### Eval output
(kind: exception) Fixture not implemented