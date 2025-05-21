
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
  14 |     bar();
  15 |   };
> 16 |   baz();
     |   ^^^ InvalidReact: This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState) (16:16)
  17 |
  18 |   return [x];
  19 | }
```
          
      