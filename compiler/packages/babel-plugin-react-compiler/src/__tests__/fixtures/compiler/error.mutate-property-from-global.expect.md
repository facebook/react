
## Input

```javascript
let wat = {};

function Foo() {
  delete wat.foo;
  return wat;
}

```


## Error

```
Found 1 error:
Error: Writing to a variable defined outside a component or hook is not allowed. Consider using an effect

error.mutate-property-from-global.ts:4:9
  2 |
  3 | function Foo() {
> 4 |   delete wat.foo;
    |          ^^^ Writing to a variable defined outside a component or hook is not allowed. Consider using an effect
  5 |   return wat;
  6 | }
  7 |


```
          
      