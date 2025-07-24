
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
Error: This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState)

error.invalid-unconditional-set-state-in-render.ts:6:2
  4 |   const aliased = setX;
  5 |
> 6 |   setX(1);
    |   ^^^^ This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState)
  7 |   aliased(2);
  8 |
  9 |   return x;


Error: This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState)

error.invalid-unconditional-set-state-in-render.ts:7:2
   5 |
   6 |   setX(1);
>  7 |   aliased(2);
     |   ^^^^^^^ This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState)
   8 |
   9 |   return x;
  10 | }


```
          
      