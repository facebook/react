
## Input

```javascript
// @validateNoDerivedComputationsInEffects_exp
import {useEffect, useState} from 'react';

export default function Component(props) {
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

Error: You might not need an effect. Derive values in render, not effects.

Derived values (From props: [props]) should be computed during render, rather than in effects. Using an effect triggers an additional render which can hurt performance and user experience, potentially briefly showing stale values to the user.

error.invalid-derived-state-from-computed-props.ts:9:4
   7 |   useEffect(() => {
   8 |     const computed = props.prefix + props.value + props.suffix;
>  9 |     setDisplayValue(computed);
     |     ^^^^^^^^^^^^^^^ This should be computed during render, not in an effect
  10 |   }, [props.prefix, props.value, props.suffix]);
  11 |
  12 |   return <div>{displayValue}</div>;
```
          
      