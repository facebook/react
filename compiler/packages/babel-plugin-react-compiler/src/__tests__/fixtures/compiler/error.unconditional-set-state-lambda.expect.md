
## Input

```javascript
// @validateNoSetStateInRender
function Component(props) {
  const [x, setX] = useState(0);

  const foo = () => {
    setX(1);
  };
  foo();

  return [x];
}

```


## Error

```
Found 1 error:

Error: Calling setState during render may trigger an infinite loop

Calling setState during render will trigger another render, and can lead to infinite loops. (https://react.dev/reference/react/useState)

error.unconditional-set-state-lambda.ts:8:2
   6 |     setX(1);
   7 |   };
>  8 |   foo();
     |   ^^^ Found setState() within useMemo()
   9 |
  10 |   return [x];
  11 | }
```
          
      