
## Input

```javascript
// @enableCustomTypeDefinitionForReanimated
import {useSharedValue} from 'react-native-reanimated';

/**
 * https://docs.swmansion.com/react-native-reanimated/docs/2.x/api/hooks/useSharedValue/
 *
 * Test that shared values are treated as ref-like, i.e. allowing writes outside
 * of render
 */
function SomeComponent() {
  const sharedVal = useSharedValue(0);
  return (
    <Button
      onPress={() => (sharedVal.value = Math.random())}
      title="Randomize"
    />
  );
}

```

## Code

```javascript
import { c as _c } from "react/compiler-runtime"; // @enableCustomTypeDefinitionForReanimated
import { useSharedValue } from "react-native-reanimated";

/**
 * https://docs.swmansion.com/react-native-reanimated/docs/2.x/api/hooks/useSharedValue/
 *
 * Test that shared values are treated as ref-like, i.e. allowing writes outside
 * of render
 */
function SomeComponent() {
  const $ = _c(3);
  const sharedVal = useSharedValue(0);

  const T0 = Button;
  const t0 = () => (sharedVal.value = Math.random());
  let t1;
  if ($[0] !== T0 || $[1] !== t0) {
    t1 = <T0 onPress={t0} title="Randomize" />;
    $[0] = T0;
    $[1] = t0;
    $[2] = t1;
  } else {
    t1 = $[2];
  }
  return t1;
}

```
      