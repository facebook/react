
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
  4 |   const aliased = setX;
  5 |
> 6 |   setX(1);
    |   ^^^^ InvalidReact: This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState) (6:6)

InvalidReact: This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState) (7:7)
  7 |   aliased(2);
  8 |
  9 |   return x;
```
          
      