
## Input

```javascript
// @validateNoDerivedComputationsInEffects
import {useState, useEffect} from 'react';

function Component({props, number}) {
  const nothing = 0;
  const missDirection = number;
  const [displayValue, setDisplayValue] = useState(
    props.prefix + missDirection + nothing
  );

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

The setState within a useEffect is deriving from props [props, number]. Instead of shadowing the prop with local state, hoist the state to the parent component and update it there. If you are purposefully initializing state with a prop, and want to update it when a prop changes, do so conditionally in render.

error.derived-state-from-shadowed-props.ts:12:4
  10 |
  11 |   useEffect(() => {
> 12 |     setDisplayValue(props.prefix + missDirection + nothing);
     |     ^^^^^^^^^^^^^^^ this derives values from props to synchronize state
  13 |   }, [props.prefix, missDirection, nothing]);
  14 |
  15 |   return (

error.derived-state-from-shadowed-props.ts:7:42
   5 |   const nothing = 0;
   6 |   const missDirection = number;
>  7 |   const [displayValue, setDisplayValue] = useState(
     |                                           ^^^^^^^^^
>  8 |     props.prefix + missDirection + nothing
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  9 |   );
     | ^^^^ this useState shadows props
  10 |
  11 |   useEffect(() => {
  12 |     setDisplayValue(props.prefix + missDirection + nothing);

error.derived-state-from-shadowed-props.ts:7:42
   5 |   const nothing = 0;
   6 |   const missDirection = number;
>  7 |   const [displayValue, setDisplayValue] = useState(
     |                                           ^^^^^^^^^
>  8 |     props.prefix + missDirection + nothing
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  9 |   );
     | ^^^^ this useState shadows number
  10 |
  11 |   useEffect(() => {
  12 |     setDisplayValue(props.prefix + missDirection + nothing);

error.derived-state-from-shadowed-props.ts:18:8
  16 |     <div
  17 |       onClick={() => {
> 18 |         setDisplayValue('clicked');
     |         ^^^^^^^^^^^^^^^ this setState updates the shadowed state, but should call an onChange event from the parent
  19 |       }}>
  20 |       {displayValue}
  21 |     </div>
```
          
      