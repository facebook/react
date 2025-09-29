
## Input

```javascript
// @validateRefAccessDuringRender

function useHook(parentRef) {
  // Some components accept a union of "callback" refs and ref objects, which
  // we can't currently represent
  const elementRef = useRef(null);
  const handler = instance => {
    elementRef.current = instance;
    if (parentRef != null) {
      if (typeof parentRef === 'function') {
        // This call infers the type of `parentRef` as a function...
        parentRef(instance);
      } else {
        // So this assignment fails since we don't know its a ref
        parentRef.current = instance;
      }
    }
  };
  return handler;
}

```


## Error

```
Found 1 error:

Error: This value cannot be modified

Modifying component props or hook arguments is not allowed. Consider using a local variable instead.

error.todo-allow-assigning-to-inferred-ref-prop-in-callback.ts:15:8
  13 |       } else {
  14 |         // So this assignment fails since we don't know its a ref
> 15 |         parentRef.current = instance;
     |         ^^^^^^^^^ `parentRef` cannot be modified
  16 |       }
  17 |     }
  18 |   };
```
          
      