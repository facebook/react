
## Input

```javascript
function Component(props) {
  let a;
  [a, b] = props.value;

  return [a, b];
}

```


## Error

```
  1 | function Component(props) {
  2 |   let a;
> 3 |   [a, b] = props.value;
    |   ^^^^^^ [ReactForget] InvalidReact: This reassigns a variable which was not defined inside of the component. Components should be pure and side-effect free. If this variable is used in rendering, use useState instead. (https://react.dev/learn/keeping-components-pure) (3:3)
  4 |
  5 |   return [a, b];
  6 | }
```
          
      