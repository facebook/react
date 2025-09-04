
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useState, useEffect} from 'react';

function Component({props, number}) {
  const nothing = 0;
  const missDirection = number;
  const [displayValue, setDisplayValue] = useState(props.prefix + missDirection + nothing);

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

Error: You might not need an effect. Local state shadows parent state.

The setState within a useEffect is deriving from props [props, number]. Instead of shadowing the prop with local state, hoist the state to the parent component and update it there. If you are purposefully initializing state with a prop, and want to update it when a prop changes, do so conditionally in render

error.derived-state-from-shadowed-props.ts:10:4
   8 |
   9 |   useEffect(() => {
> 10 |     setDisplayValue(props.prefix + missDirection + nothing);
     |     ^^^^^^^^^^^^^^^ this derives values from props to synchronize state
  11 |   }, [props.prefix, missDirection, nothing]);
  12 |
  13 |   return (

error.derived-state-from-shadowed-props.ts:7:42
   5 |   const nothing = 0;
   6 |   const missDirection = number;
>  7 |   const [displayValue, setDisplayValue] = useState(props.prefix + missDirection + nothing);
     |                                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ this useState shadows props
   8 |
   9 |   useEffect(() => {
  10 |     setDisplayValue(props.prefix + missDirection + nothing);

error.derived-state-from-shadowed-props.ts:7:42
   5 |   const nothing = 0;
   6 |   const missDirection = number;
>  7 |   const [displayValue, setDisplayValue] = useState(props.prefix + missDirection + nothing);
     |                                           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ this useState shadows number
   8 |
   9 |   useEffect(() => {
  10 |     setDisplayValue(props.prefix + missDirection + nothing);

error.derived-state-from-shadowed-props.ts:16:8
  14 |     <div
  15 |       onClick={() => {
> 16 |         setDisplayValue('clicked');
     |         ^^^^^^^^^^^^^^^ this setState updates the shadowed state, but should call an onChange event from the parent
  17 |       }}>
  18 |       {displayValue}
  19 |     </div>
```
          
      