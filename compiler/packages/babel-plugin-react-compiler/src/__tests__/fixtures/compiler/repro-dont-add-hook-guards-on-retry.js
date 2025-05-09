// @flow @enableEmitHookGuards @panicThreshold:"none" @enableFire

component Foo(useDynamicHook) {
  useDynamicHook();
  return <div>hello world</div>;
}
