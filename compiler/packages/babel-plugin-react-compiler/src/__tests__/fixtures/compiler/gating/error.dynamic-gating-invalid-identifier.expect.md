
## Input

```javascript
// @dynamicGating:{"source":"shared-runtime"}

function Foo() {
  'use memo if(true)';
  return <div>hello world</div>;
}

export const FIXTURE_ENTRYPOINT = {
  fn: Foo,
  params: [{}],
};

```


## Error

```
  2 |
  3 | function Foo() {
> 4 |   'use memo if(true)';
    |   ^^^^^^^^^^^^^^^^^^^^ InvalidReact: Dynamic gating directive is not a valid JavaScript identifier. Found 'use memo if(true)' (4:4)
  5 |   return <div>hello world</div>;
  6 | }
  7 |
```
          
      