
## Input

```javascript
// @validateNoSetStateInRender @enableTreatSetIdentifiersAsStateSetters
function Component({setX}) {
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

Calling setState during render will trigger another render, and can lead to infinite loops. (https://react.dev/reference/react/useState).

error.invalid-unconditional-set-state-prop-in-render.ts:5:2
  3 |   const aliased = setX;
  4 |
> 5 |   setX(1);
    |   ^^^^ Found setState() in render
  6 |   aliased(2);
  7 |
  8 |   return x;

Error: Calling setState during render may trigger an infinite loop

Calling setState during render will trigger another render, and can lead to infinite loops. (https://react.dev/reference/react/useState).

error.invalid-unconditional-set-state-prop-in-render.ts:6:2
  4 |
  5 |   setX(1);
> 6 |   aliased(2);
    |   ^^^^^^^ Found setState() in render
  7 |
  8 |   return x;
  9 | }
```
          
      