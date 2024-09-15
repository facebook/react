
## Input

```javascript
function Foo(props) {
  props.test = 1;
  return null;
}

```


## Error

```
  1 | function Foo(props) {
> 2 |   props.test = 1;
    |   ^^^^^ InvalidReact: Mutating component props or hook arguments is not allowed. Consider using a local variable instead (2:2)
  3 |   return null;
  4 | }
  5 |
```
          
      