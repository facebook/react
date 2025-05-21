
## Input

```javascript
// @flow @enableEmitHookGuards @panicThreshold:"none" @enableFire

component Foo(useDynamicHook) {
  useDynamicHook();
  return <div>hello world</div>;
}

```

## Code

```javascript
function Foo({
  useDynamicHook,
}: $ReadOnly<{ useDynamicHook: any }>): React.Node {
  useDynamicHook();
  return <div>hello world</div>;
}

```
      
### Eval output
(kind: exception) Fixture not implemented