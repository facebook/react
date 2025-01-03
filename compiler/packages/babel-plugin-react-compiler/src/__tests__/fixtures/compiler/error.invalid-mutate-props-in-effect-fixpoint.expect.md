
## Input

```javascript
import {useEffect} from 'react';

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
     |     ^ InvalidReact: Mutating component props or hook arguments is not allowed. Consider using a local variable instead. Found mutation of `y` (10:10)
  11 |   };
  12 |   let mutatePropsIndirect = () => {
  13 |     mutateProps();
```
          
      