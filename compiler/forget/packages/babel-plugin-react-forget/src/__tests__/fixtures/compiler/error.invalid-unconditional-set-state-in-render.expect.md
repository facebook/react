
## Input

```javascript
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
[ReactForget] InvalidReact: This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState) (5:5)

[ReactForget] InvalidReact: This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState) (6:6)
```
          
      