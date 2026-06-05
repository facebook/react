
## Input

```javascript
function useResource() {
  using resource = createResource();
  return resource.value;
}

export const FIXTURE_ENTRYPOINT = {
  fn: useResource,
  params: [],
  isComponent: false,
};

```


## Error

```
Found 1 error:

Todo: (BuildHIR::lowerStatement) Handle using kinds in VariableDeclaration

error.todo-using-declaration.ts:2:2
  1 | function useResource() {
> 2 |   using resource = createResource();
    |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ (BuildHIR::lowerStatement) Handle using kinds in VariableDeclaration
  3 |   return resource.value;
  4 | }
  5 |
```
          
      