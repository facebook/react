// @enableEmitFreeze @instrumentForget
function useFoo(props) {
  const __DEV__ = 'conflicting global';
  console.log(__DEV__);
  return foo(props.x);
}
