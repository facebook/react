
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

Error: Calling setState from useMemo may trigger an infinite loop

Each time the memo callback is evaluated it will change state. This can cause a memoization dependency to change, running the memo function again and causing an infinite loop. Instead of setting state in useMemo(), prefer deriving the value during render. (https://react.dev/reference/react/useState)

error.invalid-setState-in-useMemo-indirect-useCallback.ts:13:4
  11 |
  12 |   useMemo(() => {
> 13 |     fn();
     |     ^^ Found setState() within useMemo()
  14 |   }, [key, init]);
  15 |
  16 |   return state;
```
          
      