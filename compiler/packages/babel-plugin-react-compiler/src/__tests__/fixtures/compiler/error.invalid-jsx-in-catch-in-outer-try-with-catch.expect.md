
## Input

```javascript
// @validateNoJSXInTryStatements
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
   9 |       value = identity(props.foo);
  10 |     } catch {
> 11 |       el = <div value={value} />;
     |            ^^^^^^^^^^^^^^^^^^^^^ InvalidReact: Unexpected JSX element within a try statement. To catch errors in rendering a given component, wrap that component in an error boundary. (https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) (11:11)
  12 |     }
  13 |   } catch {
  14 |     return null;
```
          
      