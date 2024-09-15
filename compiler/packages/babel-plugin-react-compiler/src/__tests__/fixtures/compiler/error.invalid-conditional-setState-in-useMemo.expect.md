
## Input

```javascript
function Component({item, cond}) {
  const [prevItem, setPrevItem] = useState(item);
  const [state, setState] = useState(0);

  useMemo(() => {
    if (cond) {
      setPrevItem(item);
      setState(0);
    }
  }, [cond, key, init]);

  return state;
}

```


## Error

```
   5 |   useMemo(() => {
   6 |     if (cond) {
>  7 |       setPrevItem(item);
     |       ^^^^^^^^^^^ InvalidReact: Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState) (7:7)

InvalidReact: Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState) (8:8)
   8 |       setState(0);
   9 |     }
  10 |   }, [cond, key, init]);
```
          
      