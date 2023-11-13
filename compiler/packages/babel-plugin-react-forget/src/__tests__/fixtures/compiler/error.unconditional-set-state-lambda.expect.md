
## Input

```javascript
// @validateNoSetStateInRender @validateNoSetStateInRenderFunctionExpressions
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
[ReactForget] InvalidReact: This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState) (8:8)
```
          
      