
## Input

```javascript
import foo from 'useDefaultExportNotTypedAsHook';

function Component() {
  return <div>{foo()}</div>;
}

```


## Error

```
  2 |
  3 | function Component() {
> 4 |   return <div>{foo()}</div>;
    |                ^^^ InvalidConfig: Invalid type configuration for module. Expected type for `import ... from 'useDefaultExportNotTypedAsHook'` to be a hook based on the module name (4:4)
  5 | }
  6 |
```
          
      