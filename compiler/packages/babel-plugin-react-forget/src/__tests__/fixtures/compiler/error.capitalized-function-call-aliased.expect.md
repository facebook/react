
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
  2 | function Foo() {
  3 |   let x = Bar;
> 4 |   x(); // ERROR
    |   ^^^ InvalidReact: Capitalized function calls may be calling components that use hooks, which make them dangerous to memoize. Ensure there are no hook calls in the function and rename it to begin with a lowercase letter to fix this error. Bar may be a component. (4:4)
  5 | }
  6 |
```
          
      