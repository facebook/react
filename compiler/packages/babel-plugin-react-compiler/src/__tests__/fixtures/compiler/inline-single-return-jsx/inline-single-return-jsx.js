// @enableInlineSingleReturnJSX
function Component({a, b}) {
  const c = [a, b];
  return (
    <Child value={c}>
      <div />
    </Child>
  );
}
