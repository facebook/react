
## Input

```javascript
import { useEffect } from "react";

function Component(props) {
  let x = null;
  while (x == null) {
    x = props.value;
  }
  let y = x;
  let mutateProps = () => {
    y.foo = true;
  };
  let mutatePropsIndirect = () => {
    mutateProps();
  };
  useEffect(() => mutatePropsIndirect(), [mutatePropsIndirect]);
}

```


## Error

```
   8 |   let y = x;
   9 |   let mutateProps = () => {
> 10 |     y.foo = true;
     |     ^ InvalidReact: This mutates a variable that React considers immutable. Found mutation of `y` (10:10)
  11 |   };
  12 |   let mutatePropsIndirect = () => {
  13 |     mutateProps();
```
          
      