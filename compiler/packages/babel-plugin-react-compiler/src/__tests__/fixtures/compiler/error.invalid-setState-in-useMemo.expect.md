
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
  4 |
  5 |   useMemo(() => {
> 6 |     setPrevKey(key);
    |     ^^^^^^^^^^ InvalidReact: Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState) (6:6)

InvalidReact: Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState) (7:7)
  7 |     setState(init);
  8 |   }, [key, init]);
  9 |
```
          
      