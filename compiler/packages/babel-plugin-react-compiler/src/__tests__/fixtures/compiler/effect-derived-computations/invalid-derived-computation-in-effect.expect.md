
## Input

```javascript
// @validateNoDerivedComputationsInEffects
function Component() {
  const [firstName, setFirstName] = useState('Taylor');
  const lastName = 'Swift';

  // 🔴 Avoid: redundant state and unnecessary Effect
  const [fullName, setFullName] = useState('');
  useEffect(() => {
    setFullName(firstName + ' ' + lastName);
  }, [firstName, lastName]);

  return <div>{fullName}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validateNoDerivedComputationsInEffects
function Component() {
  const $ = _c(5);
  const [firstName] = useState("Taylor");

  const [fullName, setFullName] = useState("");
  let t0;
  let t1;
  if ($[0] !== firstName) {
    t0 = () => {
      setFullName(firstName + " " + "Swift");
    };
    t1 = [firstName, "Swift"];
    $[0] = firstName;
    $[1] = t0;
    $[2] = t1;
  } else {
    t0 = $[1];
    t1 = $[2];
  }
  useEffect(t0, t1);
  let t2;
  if ($[3] !== fullName) {
    t2 = <div>{fullName}</div>;
    $[3] = fullName;
    $[4] = t2;
  } else {
    t2 = $[4];
  }
  return t2;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [],
};

```
      
### Eval output
(kind: exception) useState is not defined