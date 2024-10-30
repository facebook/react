// @inferEffectDependencies
const nonreactive = 0;

function Component({foo, bar}) {
  useEffect(() => {
    console.log(foo);
    console.log(bar);
    console.log(nonreactive);
  });
  
  useEffect(() => {
    console.log(foo);
    console.log(bar?.baz);
    console.log(bar.qux);
  });
  
  function f() {
    console.log(foo);
  }
  
  // No inferred dep array, the argument is not a lambda
  useEffect(f);
  
}
