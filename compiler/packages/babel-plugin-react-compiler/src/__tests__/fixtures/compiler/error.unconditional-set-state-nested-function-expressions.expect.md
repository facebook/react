
## Input

```javascript
// @validateNoSetStateInRender
function Component(props) {
  const [x, setX] = useState(0);

  const foo = () => {
    setX(1);
  };

  const bar = () => {
    foo();
  };

  const baz = () => {
    bar();
  };
  baz();

  return [x];
}

```


## Error

```
Found 1 error:

Error: Calling setState during render may trigger an infinite loop

Calling setState during render will trigger another render, and can lead to infinite loops. (https://react.dev/reference/react/useState)

error.unconditional-set-state-nested-function-expressions.ts:16:2
  14 |     bar();
  15 |   };
> 16 |   baz();
     |   ^^^ Found setState() within useMemo()
  17 |
  18 |   return [x];
  19 | }
```
          
      