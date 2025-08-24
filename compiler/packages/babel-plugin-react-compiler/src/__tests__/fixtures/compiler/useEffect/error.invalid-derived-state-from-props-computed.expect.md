
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

Error: You may not need this effect. Values derived from state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)

You are using invalid dependencies:

Invalid deps from props [props].

error.invalid-derived-state-from-props-computed.ts:9:4
   7 |   useEffect(() => {
   8 |     const computed = props.prefix + props.value + props.suffix;
>  9 |     setDisplayValue(computed);
     |     ^^^^^^^^^^^^^^^ You may not need this effect. Values derived from state should be calculated during render, not in an effect. (https://react.dev/learn/you-might-not-need-an-effect#updating-state-based-on-props-or-state)
  10 |   }, [props.prefix, props.value, props.suffix]);
  11 |
  12 |   return <div>{displayValue}</div>;
```
          
      