
## Input

```javascript
function Component(props) {
  eval('props.x = true');
  return <div />;
}

```


## Error

```
  1 | function Component(props) {
> 2 |   eval('props.x = true');
    |   ^^^^ UnsupportedJS: The 'eval' function is not supported. Eval is an anti-pattern in JavaScript, and the code executed cannot be evaluated by React Compiler (2:2)
  3 |   return <div />;
  4 | }
  5 |
```
          
      