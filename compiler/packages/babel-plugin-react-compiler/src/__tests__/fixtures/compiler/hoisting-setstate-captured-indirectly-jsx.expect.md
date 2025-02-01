
## Input

```javascript
// @validatePreserveExistingMemoizationGuarantees
function useFoo() {
  const onClick = response => {
    setState(DISABLED_FORM);
  };

  const [state, setState] = useState();
  const handleLogout = useCallback(() => {
    setState(DISABLED_FORM);
  }, [setState]);
  const getComponent = () => {
    return <ColumnItem onPress={() => handleLogout()} />;
  };

  // this `getComponent` call should not be inferred as mutating setState
  return [getComponent(), onClick]; // pass onClick to avoid dce
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @validatePreserveExistingMemoizationGuarantees
function useFoo() {
  const $ = _c(9);
  const onClick = (response) => {
    setState(DISABLED_FORM);
  };

  const [, t0] = useState();
  const setState = t0;
  let t1;
  if ($[0] !== setState) {
    t1 = () => {
      setState(DISABLED_FORM);
    };
    $[0] = setState;
    $[1] = t1;
  } else {
    t1 = $[1];
  }
  setState;
  const handleLogout = t1;
  let t2;
  if ($[2] !== handleLogout) {
    t2 = () => <ColumnItem onPress={() => handleLogout()} />;
    $[2] = handleLogout;
    $[3] = t2;
  } else {
    t2 = $[3];
  }
  const getComponent = t2;
  let t3;
  if ($[4] !== getComponent) {
    t3 = getComponent();
    $[4] = getComponent;
    $[5] = t3;
  } else {
    t3 = $[5];
  }
  let t4;
  if ($[6] !== onClick || $[7] !== t3) {
    t4 = [t3, onClick];
    $[6] = onClick;
    $[7] = t3;
    $[8] = t4;
  } else {
    t4 = $[8];
  }
  return t4;
}

```
      
### Eval output
(kind: exception) Fixture not implemented