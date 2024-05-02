
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
   6 |     setX(1);
   7 |   };
>  8 |   foo();
     |   ^^^ InvalidReact: This is an unconditional set state during render, which will trigger an infinite loop. (https://react.dev/reference/react/useState) (8:8)
   9 |
  10 |   return [x];
  11 | }
```
          
      