
## Input

```javascript
function useKeyedState({key, init}) {
  const [prevKey, setPrevKey] = useState(key);
  const [state, setState] = useState(init);

  useMemo(() => {
    setPrevKey(key);
    setState(init);
  }, [key, init]);

  return state;
}

```


## Error

```
Found 2 errors:
Error: Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState)

error.invalid-setState-in-useMemo.ts:6:4
  4 |
  5 |   useMemo(() => {
> 6 |     setPrevKey(key);
    |     ^^^^^^^^^^ Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState)
  7 |     setState(init);
  8 |   }, [key, init]);
  9 |


Error: Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState)

error.invalid-setState-in-useMemo.ts:7:4
   5 |   useMemo(() => {
   6 |     setPrevKey(key);
>  7 |     setState(init);
     |     ^^^^^^^^ Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState)
   8 |   }, [key, init]);
   9 |
  10 |   return state;


```
          
      