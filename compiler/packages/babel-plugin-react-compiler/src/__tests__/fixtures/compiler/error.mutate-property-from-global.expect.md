
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

Error: This value cannot be modified

Cannot reassign variables declared outside of the component/hook.

error.mutate-property-from-global.ts:4:9
  2 |
  3 | function Foo() {
> 4 |   delete wat.foo;
    |          ^^^ value cannot be modified
  5 |   return wat;
  6 | }
  7 |
```
          
      