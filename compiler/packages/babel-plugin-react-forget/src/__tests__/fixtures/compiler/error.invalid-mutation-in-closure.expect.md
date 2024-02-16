
## Input

```javascript
function useInvalidMutation(options) {
  function test() {
    foo(options.foo); // error should not point on this line
    options.foo = "bar";
  }
  return test;
}

```


## Error

```
  1 | function useInvalidMutation(options) {
  2 |   function test() {
> 3 |     foo(options.foo); // error should not point on this line
    |         ^^^^^^^^^^^ [ReactForget] InvalidReact: Mutating props or hook arguments is not allowed. Consider using a local variable instead. (3:3)
  4 |     options.foo = "bar";
  5 |   }
  6 |   return test;
```
          
      