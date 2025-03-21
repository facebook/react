// @enableEmitFreeze @instrumentForget
function useFoo(props) {
  return foo(props.x, __DEV__);
}
