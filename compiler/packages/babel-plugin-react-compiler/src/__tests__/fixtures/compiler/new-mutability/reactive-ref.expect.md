
## Input

```javascript
// @enableNewMutationAliasingModel
function ReactiveRefInEffect(props) {
  const ref1 = useRef('initial value');
  const ref2 = useRef('initial value');
  let ref;
  if (props.foo) {
    ref = ref1;
  } else {
    ref = ref2;
  }
  useEffect(() => print(ref));
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableNewMutationAliasingModel
function ReactiveRefInEffect(props) {
  const $ = _c(2);
  const ref1 = useRef("initial value");
  const ref2 = useRef("initial value");
  let ref;
  if (props.foo) {
    ref = ref1;
  } else {
    ref = ref2;
  }
  let t0;
  if ($[0] !== ref) {
    t0 = () => print(ref);
    $[0] = ref;
    $[1] = t0;
  } else {
    t0 = $[1];
  }
  useEffect(t0);
}

```
      
### Eval output
(kind: exception) Fixture not implemented