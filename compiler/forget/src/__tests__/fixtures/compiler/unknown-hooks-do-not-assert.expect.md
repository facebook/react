
## Input

```javascript
// @enableTreatHooksAsFunctions true
// (enableAssumeHooksFollowRulesOfReact=false)
function Component(props) {
  const x = useUnknownHook1(props);
  const y = useUnknownHook2(x);
  return y;
}

```

## Code

```javascript
// @enableTreatHooksAsFunctions true
// (enableAssumeHooksFollowRulesOfReact=false)
function Component(props) {
  const x = useUnknownHook1(props);
  const y = useUnknownHook2(x);
  return y;
}

```
      