
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
  2 |   function test() {
  3 |     foo(options.foo); // error should not point on this line
> 4 |     options.foo = "bar";
    |     ^^^^^^^ InvalidReact: Mutating props or hook arguments is not allowed. Consider using a local variable instead.. Found mutation of [object Object] (4:4)
  5 |   }
  6 |   return test;
  7 | }
```
          
      