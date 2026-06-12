
## Input

```javascript
async function useAsyncResource() {
  await using resource = createAsyncResource();
  return resource.value;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useAsyncResource,
  params: [],
  isComponent: false,
};

```


## Error

```
Found 1 error:

Todo: (BuildHIR::lowerStatement) Handle await using kinds in VariableDeclaration

error.todo-await-using-declaration.ts:2:2
  1 | async function useAsyncResource() {
> 2 |   await using resource = createAsyncResource();
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ (BuildHIR::lowerStatement) Handle await using kinds in VariableDeclaration
  3 |   return resource.value;
  4 | }
  5 |
```
          
      