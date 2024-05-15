function Component() {
  const foo = () => {
    // Cannot assign to globals
    someUnknownGlobal = true;
    moduleLocal = true;
  };
  // It's possible that this could be an event handler / effect function,
  // but we don't know that and conservatively assume it's a render helper
  // where it's disallowed to modify globals
  return <Foo foo={foo} />;
}
