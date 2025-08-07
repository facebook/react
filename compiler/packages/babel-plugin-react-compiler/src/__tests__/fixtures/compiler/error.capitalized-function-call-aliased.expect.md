
## Input

```javascript
// @validateNoCapitalizedCalls
function Foo() {
  let x = Bar;
  x(); // ERROR
}

```


## Error

```
Found 1 error:

Error: Capitalized functions are reserved for components, which must be invoked with JSX. If this is a component, render it with JSX. Otherwise, ensure that it has no hook calls and rename it to begin with a lowercase letter. Alternatively, if you know for a fact that this function is not a component, you can allowlist it via the compiler config

Bar may be a component..

error.capitalized-function-call-aliased.ts:4:2
  2 | function Foo() {
  3 |   let x = Bar;
> 4 |   x(); // ERROR
    |   ^^^ Capitalized functions are reserved for components, which must be invoked with JSX. If this is a component, render it with JSX. Otherwise, ensure that it has no hook calls and rename it to begin with a lowercase letter. Alternatively, if you know for a fact that this function is not a component, you can allowlist it via the compiler config
  5 | }
  6 |
```
          
      