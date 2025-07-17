
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
Found 2 errors:
Error: Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState)

error.invalid-conditional-setState-in-useMemo.ts:7:6
   5 |   useMemo(() => {
   6 |     if (cond) {
>  7 |       setPrevItem(item);
     |       ^^^^^^^^^^^ Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState)
   8 |       setState(0);
   9 |     }
  10 |   }, [cond, key, init]);


Error: Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState)

error.invalid-conditional-setState-in-useMemo.ts:8:6
   6 |     if (cond) {
   7 |       setPrevItem(item);
>  8 |       setState(0);
     |       ^^^^^^^^ Calling setState from useMemo may trigger an infinite loop. (https://react.dev/reference/react/useState)
   9 |     }
  10 |   }, [cond, key, init]);
  11 |


```
          
      