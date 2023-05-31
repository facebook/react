function Foo({ a }) {
  const ref = useRef();
  // type information is lost here as we don't track types of fields
  const val = { ref };
  // without type info, we don't know that val.ref.current is a ref value so we
  // end up depending on val.ref.current
  const x = { a, val: val.ref.current };

  return <VideoList videos={x} />;
}
