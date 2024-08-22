
## Input

```javascript
import {createContext, useCallback, useRef} from 'react';

const Context = createContext(null);

function Component({children}) {
  const callbackRef = useRef(function () {});
  const callback = useCallback(() => {
    callbackRef.current();
  }, []);

  const setCallback = useCallback(cb => {
    callbackRef.current = cb;
  }, []);

  return (
    <Context.Provider value={{callback, setCallback}}>
      {children}
    </Context.Provider>
  );
}

```


## Error

```
  14 |
  15 |   return (
> 16 |     <Context.Provider value={{callback, setCallback}}>
     |                               ^^^^^^^^ InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (16:16)

InvalidReact: Ref values (the `current` property) may not be accessed during render. (https://react.dev/reference/react/useRef) (16:16)
  17 |       {children}
  18 |     </Context.Provider>
  19 |   );
```
          
      