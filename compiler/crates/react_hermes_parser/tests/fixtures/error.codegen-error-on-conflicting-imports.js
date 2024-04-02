// @enableEmitFreeze @instrumentForget

let makeReadOnly = "conflicting identifier";
function useFoo(props) {
  return foo(props.x);
}
