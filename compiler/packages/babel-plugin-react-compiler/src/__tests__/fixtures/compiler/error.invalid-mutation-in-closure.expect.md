
## Input

```javascript
function useInvalidMutation(options) {
  function test() {
    foo(options.foo); // error should not point on this line
    options.foo = 'bar';
  }
  return test;
}

```


## Error

```
Found 1 error:
Error: Mutating component props or hook arguments is not allowed. Consider using a local variable instead

Found mutation of `options`.

error.invalid-mutation-in-closure.ts:4:4
  2 |   function test() {
  3 |     foo(options.foo); // error should not point on this line
> 4 |     options.foo = 'bar';
    |     ^^^^^^^ Mutating component props or hook arguments is not allowed. Consider using a local variable instead
  5 |   }
  6 |   return test;
  7 | }


```
          
      