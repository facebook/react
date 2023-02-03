
## Input

```javascript
function f(reader) {
  const queue = [1, 2, 3];
  let value = 0;
  let sum = 0;
  // BUG: we need to codegen the complex test expression
  while ((value = queue.pop()) != null) {
    sum += value;
  }
  return sum;
}

```


## Error

```
[ReactForget] Todo: (CodegenReactiveFunction::codegenInstructionValue) Cannot declare variables in a value block, tried to declare 'value'
```
          
      