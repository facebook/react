
## Input

```javascript
// @validateNoSetStateInRender
function Component(props) {
  const [x, setX] = useState(0);
  const aliased = setX;

  setX(1);
  aliased(2);

  return x;
}

```


## Error

```
Found 2 errors:

Error: Calling setState during render may trigger an infinite loop

Calling setState during render will trigger another render, and can lead to infinite loops. (https://react.dev/reference/react/useState)

error.invalid-unconditional-set-state-in-render.ts:6:2
  4 |   const aliased = setX;
  5 |
> 6 |   setX(1);
    |   ^^^^ Found setState() within useMemo()
  7 |   aliased(2);
  8 |
  9 |   return x;

Error: Calling setState during render may trigger an infinite loop

Calling setState during render will trigger another render, and can lead to infinite loops. (https://react.dev/reference/react/useState)

error.invalid-unconditional-set-state-in-render.ts:7:2
   5 |
   6 |   setX(1);
>  7 |   aliased(2);
     |   ^^^^^^^ Found setState() within useMemo()
   8 |
   9 |   return x;
  10 | }
```
          
      