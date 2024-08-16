
## Input

```javascript
import {identity} from 'shared-runtime';

function Component(props) {
  let el;
  try {
    let value;
    try {
      value = identity(props.foo);
    } catch {
      el = <div value={value} />;
    }
  } catch {
    return null;
  }
  return el;
}

```


## Error

```
   8 |       value = identity(props.foo);
   9 |     } catch {
> 10 |       el = <div value={value} />;
     |            ^^^^^^^^^^^^^^^^^^^^^ InvalidReact: Unexpected JSX element within a try statement. To catch errors in rendering a given component, wrap that component in an error boundary. (https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) (10:10)
  11 |     }
  12 |   } catch {
  13 |     return null;
```
          
      