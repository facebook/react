
## Input

```javascript
import {useHook} from 'shared-runtime';

function Component(props) {
  const frozen = useHook();
  let x;
  if (props.cond) {
    x = frozen;
  } else {
    x = {};
  }
  x.property = true;
}

```


## Error

```
   9 |     x = {};
  10 |   }
> 11 |   x.property = true;
     |   ^ InvalidReact: Updating a value returned from a hook is not allowed. Consider moving the mutation into the hook where the value is constructed (11:11)
  12 | }
  13 |
```
          
      