
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

Error: Calling setState from useMemo may trigger an infinite loop

Each time the memo callback is evaluated it will change state. This can cause a memoization dependency to change, running the memo function again and causing an infinite loop. Instead of setting state in useMemo(), prefer deriving the value during render. (https://react.dev/reference/react/useState)

error.invalid-conditional-setState-in-useMemo.ts:7:6
   5 |   useMemo(() => {
   6 |     if (cond) {
>  7 |       setPrevItem(item);
     |       ^^^^^^^^^^^ Found setState() within useMemo()
   8 |       setState(0);
   9 |     }
  10 |   }, [cond, key, init]);

Error: Calling setState from useMemo may trigger an infinite loop

Each time the memo callback is evaluated it will change state. This can cause a memoization dependency to change, running the memo function again and causing an infinite loop. Instead of setting state in useMemo(), prefer deriving the value during render. (https://react.dev/reference/react/useState)

error.invalid-conditional-setState-in-useMemo.ts:8:6
   6 |     if (cond) {
   7 |       setPrevItem(item);
>  8 |       setState(0);
     |       ^^^^^^^^ Found setState() within useMemo()
   9 |     }
  10 |   }, [cond, key, init]);
  11 |
```
          
      