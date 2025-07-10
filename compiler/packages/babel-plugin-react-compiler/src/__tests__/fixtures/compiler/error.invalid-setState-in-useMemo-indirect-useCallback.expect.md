
## Input

```javascript
import {useCallback} from 'react';

function useKeyedState({key, init}) {
  const [prevKey, setPrevKey] = useState(key);
  const [state, setState] = useState(init);

  const fn = useCallback(() => {
    setPrevKey(key);
    setState(init);
  });

  useMemo(() => {
    fn();
  }, [key, init]);

  return state;
}

```


## Error

```
Found 1 error:
Error: Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState)

error.invalid-setState-in-useMemo-indirect-useCallback.ts:13:4
  11 |
  12 |   useMemo(() => {
> 13 |     fn();
     |     ^^ Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState)
  14 |   }, [key, init]);
  15 |
  16 |   return state;


```
          
      