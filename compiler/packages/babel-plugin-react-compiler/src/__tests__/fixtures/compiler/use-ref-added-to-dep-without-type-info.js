// @validateRefAccessDuringRender

/**
 * Allowed: we don't have sufficient type information to be sure that
 * this accesses a ref during render. Type info is lost when ref is
 * stored in an object field.
 */
function Foo({a}) {
  const ref = useRef();
  const val = {ref};
  const x = {a, val: val.ref.current};

  return <VideoList videos={x} />;
}
