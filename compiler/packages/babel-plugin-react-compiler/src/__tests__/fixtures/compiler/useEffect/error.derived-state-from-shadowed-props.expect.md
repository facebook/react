
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useState, useEffect} from 'react';

function Component({props, number}) {
  const nothing = 0;
  const missDirection = number;
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    setDisplayValue(props.prefix + missDirection + nothing);
  }, [props.prefix, missDirection, nothing]);

  return (
    <div
      onClick={() => {
        setDisplayValue('clicked');
      }}>
      {displayValue}
    </div>
  );
}

```


## Error

```
Found 1 error:

Error: Local state shadows parent state.

This setState() appears to derive a value from props [props, number]. This state value shadows a value passed as a prop. Instead of shadowing the prop with local state, hoist the state to the parent component and update it there.

error.derived-state-from-shadowed-props.ts:10:4
   8 |
   9 |   useEffect(() => {
> 10 |     setDisplayValue(props.prefix + missDirection + nothing);
     |     ^^^^^^^^^^^^^^^ This state value shadows a value passed as a prop.
  11 |   }, [props.prefix, missDirection, nothing]);
  12 |
  13 |   return (

error.derived-state-from-shadowed-props.ts:16:8
  14 |     <div
  15 |       onClick={() => {
> 16 |         setDisplayValue('clicked');
     |         ^^^^^^^^^^^^^^^ this setState updates the shadowed state, but should call an onChange event from the parent
  17 |       }}>
  18 |       {displayValue}
  19 |     </div>
```
          
      