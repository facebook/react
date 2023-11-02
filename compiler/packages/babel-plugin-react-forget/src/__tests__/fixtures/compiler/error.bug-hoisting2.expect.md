
## Input

```javascript
function Component() {
  useRunOnceDuringRender(() => {
    const handler = () => {
      return () => {
        detachHandler(handler);
      };
    };
  });
}

```


## Error

```
[ReactForget] Todo: EnterSSA: Expected identifier to be defined before being used. Identifier handler$1 is undefined (3:7)
```
          
      