
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useEffect, useState} from 'react';

function Component(props) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    const computed = props.prefix + props.value + props.suffix;
    setDisplayValue(computed);
  }, [props.prefix, props.value, props.suffix]);

  return <div>{displayValue}</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Component,
  params: [{prefix: '[', value: 'test', suffix: ']'}],
};

```


## Error

```
Found 1 error:

Error: Derive values in render, not effects.

This setState() appears to derive a value from props [props]. Derived values should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.invalid-derived-state-from-props-computed.ts:9:4
   7 |   useEffect(() => {
   8 |     const computed = props.prefix + props.value + props.suffix;
>  9 |     setDisplayValue(computed);
     |     ^^^^^^^^^^^^^^^ This state value shadows a value passed as a prop.
  10 |   }, [props.prefix, props.value, props.suffix]);
  11 |
  12 |   return <div>{displayValue}</div>;
```
          
      