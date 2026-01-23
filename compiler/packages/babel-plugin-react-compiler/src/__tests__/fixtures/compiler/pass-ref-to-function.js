// @validateRefAccessDuringRender

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses a ref during render. The return type of foo() is unknown.
 */
function Component(props) {
  const ref = useRef(null);
  const x = foo(ref);
  return x.current;
}
