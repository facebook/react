
## Input

```javascript
let wat = {};

function Foo() {
  wat.test = 1;
  return wat;
}

```


## Error

```
Found 1 error:

Error: This value cannot be modified

Cannot reassign variables declared outside of the component/hook.

error.store-property-in-global.ts:4:2
  2 |
  3 | function Foo() {
> 4 |   wat.test = 1;
    |   ^^^ value cannot be modified
  5 |   return wat;
  6 | }
  7 |
```
          
      