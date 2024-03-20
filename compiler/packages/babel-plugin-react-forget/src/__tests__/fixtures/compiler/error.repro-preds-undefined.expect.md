
## Input

```javascript
// @enableAssumeHooksFollowRulesOfReact @enableTransitivelyFreezeFunctionExpressions
function useSupportsTouchEvent() {
  return useMemo(() => {
    if (checkforTouchEvents) {
      try {
        document.createEvent("TouchEvent");
        return true;
      } catch {
        return false;
      }
    }
  }, []);
}

```


## Error

```
Cannot read properties of undefined (reading 'preds')
```
          
      