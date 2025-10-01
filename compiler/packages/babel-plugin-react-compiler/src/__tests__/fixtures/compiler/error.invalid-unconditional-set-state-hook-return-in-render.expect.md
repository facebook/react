
## Input

```javascript
// @validateNoSetStateInRender @enableTreatSetIdentifiersAsStateSetters
function Component() {
  const [state, setState] = useCustomState(0);
  const aliased = setState;

  setState(1);
  aliased(2);

  return state;
}

function useCustomState(init) {
  return useState(init);
}

```


## Error

```
Found 2 errors:

Error: Calling setState during render may trigger an infinite loop

Calling setState during render will trigger another render, and can lead to infinite loops. (https://react.dev/reference/react/useState).

error.invalid-unconditional-set-state-hook-return-in-render.ts:6:2
  4 |   const aliased = setState;
  5 |
> 6 |   setState(1);
    |   ^^^^^^^^ Found setState() in render
  7 |   aliased(2);
  8 |
  9 |   return state;

Error: Calling setState during render may trigger an infinite loop

Calling setState during render will trigger another render, and can lead to infinite loops. (https://react.dev/reference/react/useState).

error.invalid-unconditional-set-state-hook-return-in-render.ts:7:2
   5 |
   6 |   setState(1);
>  7 |   aliased(2);
     |   ^^^^^^^ Found setState() in render
   8 |
   9 |   return state;
  10 | }
```
          
      